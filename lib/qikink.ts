/**
 * Qikink Open API integration (print-on-demand fulfillment).
 *
 * Official API reference (2026-09-23):
 *   https://documenter.getpostman.com/view/26157218/2sBYAysUHS
 *
 * Auth: POST {QIKINK_API_URL}/api/token with form-encoded `ClientId` and
 * `client_secret` -> { ClientId, Accesstoken, expires_in: 3600 }.
 * Every other call sends `ClientId` + `Accesstoken` headers.
 * Tokens are cached in memory and refreshed a minute before expiry.
 *
 * Order: POST {QIKINK_API_URL}/api/order/create (JSON body, exact fields —
 * Qikink rejects unexpected fields). Rate limit 60 req/min.
 *
 * Env:
 *   QIKINK_CLIENT_ID / QIKINK_CLIENT_SECRET — from the Qikink dashboard
 *   QIKINK_API_URL   — default https://sandbox.qikink.com (use
 *                      https://api.qikink.com for production)
 *   QIKINK_TOKEN_PATH — default /api/token
 *   QIKINK_ORDER_PATH — default /api/order/create
 *   QIKINK_GATEWAY    — default Prepaid (case-sensitive: COD | Prepaid)
 *   QIKINK_PRINT_TYPE_ID — default 17 (DTF). See docs enum:
 *                      1=DTG, 17=DTF, 3=Embroidery, etc.
 *   QIKINK_PRODUCT_MAP — JSON keyed "<productId>[:<color>[:<size>]]":
 *     { "oversized:black:XL": { "sku": "OVTs-Blk-XL", "placement": "front" },
 *       "oversized":           { "sku": "OVTs-Blk-M",  "placement": "front" } }
 *     Keys with color+size win; plain product id is the fallback.
 *   NEXT_PUBLIC_SITE_URL — used to absolutize local artwork paths
 */
import { supabaseAdmin, isOrdersBackendConfigured } from "./supabase";
import { PRODUCTS } from "./catalog";

export interface QikinkConfig {
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  tokenPath: string;
  orderPath: string;
  gateway: string;
  printTypeId: string;
}

export function qikinkConfig(): QikinkConfig | null {
  const clientId = process.env.QIKINK_CLIENT_ID ?? "";
  const clientSecret = process.env.QIKINK_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    apiUrl: (process.env.QIKINK_API_URL ?? "https://sandbox.qikink.com").replace(
      /\/$/,
      ""
    ),
    tokenPath: process.env.QIKINK_TOKEN_PATH ?? "/api/token",
    orderPath: process.env.QIKINK_ORDER_PATH ?? "/api/order/create",
    gateway: process.env.QIKINK_GATEWAY ?? "Prepaid",
    printTypeId: process.env.QIKINK_PRINT_TYPE_ID ?? "17",
  };
}

export function isQikinkConfigured(): boolean {
  return qikinkConfig() !== null;
}

// ---------------------------------------------------------------------------
// Access token cache
// ---------------------------------------------------------------------------

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function pickToken(j: Record<string, unknown>): string | null {
  for (const k of ["Accesstoken", "accessToken", "access_token", "token"]) {
    const v = j[k];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

function pickExpirySec(j: Record<string, unknown>): number {
  for (const k of ["expires_in", "ExpiresIn", "expiresIn", "expiry"]) {
    const v = j[k];
    if (typeof v === "number" && v > 0) return v;
  }
  return 3600;
}

async function fetchToken(cfg: QikinkConfig): Promise<string> {
  // Verified against sandbox.qikink.com 2026-09-23: the token endpoint expects
  // form-encoded fields named exactly `ClientId` and `client_secret`.
  const body = new URLSearchParams({
    ClientId: cfg.clientId,
    client_secret: cfg.clientSecret,
  });
  const res = await fetch(cfg.apiUrl + cfg.tokenPath, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Qikink token request failed (${res.status}): ${text.slice(0, 200)}`
    );
  }
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(text);
  } catch {
    throw new Error(`Qikink token response was not JSON: ${text.slice(0, 120)}`);
  }
  const token = pickToken(j);
  if (!token) throw new Error("Qikink token response had no access token");
  cachedToken = token;
  tokenExpiresAt = Date.now() + (pickExpirySec(j) - 60) * 1000;
  return token;
}

async function getAccessToken(cfg: QikinkConfig): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  return fetchToken(cfg);
}

/** Owner-dashboard "Test connection" — validates credentials only. */
export async function testQikinkConnection(): Promise<{
  ok: boolean;
  detail: string;
}> {
  const cfg = qikinkConfig();
  if (!cfg)
    return {
      ok: false,
      detail:
        "QIKINK_CLIENT_ID / QIKINK_CLIENT_SECRET are not set on the server.",
    };
  try {
    cachedToken = null;
    await fetchToken(cfg);
    return {
      ok: true,
      detail: `Authenticated against ${cfg.apiUrl}. Token issued OK.`,
    };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

// ---------------------------------------------------------------------------
// Authenticated requests with retry
// ---------------------------------------------------------------------------

async function qikinkFetch(
  cfg: QikinkConfig,
  path: string,
  init: RequestInit,
  attempt = 0
): Promise<Response> {
  const token = await getAccessToken(cfg);
  const res = await fetch(cfg.apiUrl + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ClientId: cfg.clientId,
      Accesstoken: token,
    },
  });
  if (res.status === 401 && attempt === 0) {
    cachedToken = null; // force refresh and retry once
    return qikinkFetch(cfg, path, init, 1);
  }
  if ((res.status >= 500 || res.status === 429) && attempt < 3) {
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    return qikinkFetch(cfg, path, init, attempt + 1);
  }
  return res;
}

// ---------------------------------------------------------------------------
// Product mapping: ASLI product (+color +size) -> Qikink SKU
// ---------------------------------------------------------------------------

export interface QikinkProductMapping {
  sku: string;
  placement: string;
}

function defaultProductMap(): Record<string, QikinkProductMapping> {
  const map: Record<string, QikinkProductMapping> = {};
  for (const p of PRODUCTS) {
    map[p.id] = { sku: "", placement: "front" };
  }
  return map;
}

export function qikinkProductMap(): Record<string, QikinkProductMapping> {
  const merged = defaultProductMap();
  const raw = process.env.QIKINK_PRODUCT_MAP ?? "";
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, QikinkProductMapping>;
      for (const [k, v] of Object.entries(parsed)) {
        if (v && typeof v.sku === "string") merged[k] = v;
      }
    } catch {
      /* ignore malformed JSON; defaults stand */
    }
  }
  return merged;
}

/**
 * Most specific key wins: "product:color:size" -> "product:color" -> "product".
 * Colors are normalized to lowercase; sizes uppercased.
 */
export function resolveQikinkProduct(
  productId: string,
  color: string,
  size: string
): QikinkProductMapping | null {
  const map = qikinkProductMap();
  const c = (color || "").toLowerCase().replace(/\s+/g, "");
  const s = (size || "M").toUpperCase();
  return (
    map[`${productId}:${c}:${s}`] ??
    map[`${productId}:${c}`] ??
    map[productId] ??
    null
  );
}

// ---------------------------------------------------------------------------
// Artwork: Qikink needs a publicly reachable file, so mirror the design
// into Supabase Storage (public bucket) and hand Qikink that URL.
// ---------------------------------------------------------------------------

const ARTWORK_BUCKET = "asli-artwork";

async function mirrorArtwork(designUrl: string): Promise<string> {
  if (!designUrl) throw new Error("Order has no artwork URL to print.");
  if (designUrl.startsWith("http://") || designUrl.startsWith("https://")) {
    try {
      const admin = supabaseAdmin();
      await admin.storage.createBucket(ARTWORK_BUCKET, { public: true });
    } catch {
      /* bucket probably already exists */
    }
    try {
      const img = await fetch(designUrl);
      if (!img.ok) throw new Error(`artwork fetch ${img.status}`);
      const buf = Buffer.from(await img.arrayBuffer());
      const ext = designUrl.includes(".webp") ? "webp" : "png";
      const path = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const { error } = await supabaseAdmin()
        .storage.from(ARTWORK_BUCKET)
        .upload(path, buf, {
          contentType: ext === "webp" ? "image/webp" : "image/png",
          upsert: true,
        });
      if (error) throw error;
      const { data } = supabaseAdmin().storage.from(ARTWORK_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    } catch {
      // Storage mirror failed — hand Qikink the original URL instead.
      return designUrl;
    }
  }
  // Local sample artwork ("/designs/...") — absolutize against the site URL.
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  if (site) return site + designUrl;
  throw new Error(
    "Artwork is a local path and NEXT_PUBLIC_SITE_URL is not set, so Qikink cannot fetch it."
  );
}

// ---------------------------------------------------------------------------
// Order forwarding
// ---------------------------------------------------------------------------

export interface OrderRow {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state?: string | null;
  country_code?: string | null;
  pincode: string;
  product: string;
  product_id?: string | null;
  color: string;
  size?: string | null;
  design: string | null;
  custom_text?: string | null;
  method: string;
  payment_ref: string;
  payer_email?: string | null;
  total: number;
  status: string;
  qikink_order_id?: string | null;
  qikink_forwarded_at?: string | null;
  qikink_error_log?: unknown;
}

export function productIdForOrder(order: OrderRow): string {
  if (order.product_id) return order.product_id;
  const hit = PRODUCTS.find((p) => p.name === order.product);
  return hit ? hit.id : "oversized";
}

export interface ForwardResult {
  ok: boolean;
  skipped?: string;
  qikinkOrderId?: string;
  error?: string;
}

async function logQikinkError(orderId: string, step: string, message: string) {
  try {
    await supabaseAdmin()
      .from("orders")
      .update({
        qikink_error_log: { at: new Date().toISOString(), step, message },
      })
      .eq("id", orderId);
  } catch {
    /* logging must never break the flow */
  }
}

/**
 * Forward one verified order to Qikink. Safe to call repeatedly:
 * already-forwarded orders are skipped, failures are logged on the
 * order row and returned (never thrown).
 */
export async function forwardOrderToQikink(
  orderId: string
): Promise<ForwardResult> {
  const cfg = qikinkConfig();
  if (!cfg) {
    const error =
      "Qikink API not configured (QIKINK_CLIENT_ID / QIKINK_CLIENT_SECRET missing).";
    await logQikinkError(orderId, "config", error);
    return { ok: false, error };
  }
  if (!isOrdersBackendConfigured()) {
    return { ok: false, error: "Orders backend not configured." };
  }

  const { data: order, error: loadErr } = await supabaseAdmin()
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (loadErr || !order) {
    return { ok: false, error: `Order ${orderId} not found.` };
  }
  const o = order as OrderRow;
  if (o.qikink_order_id) {
    return { ok: true, skipped: `Already forwarded as ${o.qikink_order_id}.` };
  }

  const productId = productIdForOrder(o);
  const size = (o.size || "M").toUpperCase();
  const mapping = resolveQikinkProduct(productId, o.color, size);
  if (!mapping || !mapping.sku) {
    const error =
      `No Qikink SKU mapped for "${productId}" / color "${o.color}" / size ${size}. ` +
      `Add it via QIKINK_PRODUCT_MAP — see .env.example.`;
    await logQikinkError(orderId, "product-map", error);
    return { ok: false, error };
  }

  let designUrl: string;
  try {
    designUrl = await mirrorArtwork(o.design ?? "");
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await logQikinkError(orderId, "artwork", error);
    return { ok: false, error };
  }

  // Payload follows the official Qikink Open API spec exactly —
  // unexpected fields are rejected, so this shape must stay exact.
  //   docs: https://documenter.getpostman.com/view/26157218/2sBYAysUHS
  const idStem = o.id.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const orderNumber = ("asli" + idStem).slice(0, 15);
  const designCode = ("d" + idStem).slice(0, 20);
  const [firstName, ...rest] = (o.name || "").trim().split(/\s+/);
  const address1 = (o.address || "").slice(0, 90);
  const address2 = (o.address || "").slice(90, 180);
  const placement =
    mapping.placement === "back"
      ? "bk"
      : mapping.placement === "left"
        ? "lp"
        : mapping.placement === "right"
          ? "rp"
          : "fr";

  const payload = {
    order_number: orderNumber,
    qikink_shipping: 1,
    gateway: cfg.gateway,
    total_order_value: Number(o.total) || 0,
    line_items: [
      {
        search_from_my_products: 0,
        print_type_id: cfg.printTypeId,
        quantity: 1,
        price: Number(o.total) || 0,
        sku: mapping.sku,
        designs: [
          {
            design_code: designCode,
            width_inches: 10,
            height_inches: 12,
            placement_sku: placement,
            design_link: designUrl,
            mockup_link: designUrl,
          },
        ],
      },
    ],
    shipping_address: {
      first_name: firstName || o.name,
      last_name: rest.join(" "),
      address1,
      address2,
      phone: o.phone,
      email: o.payer_email || "",
      city: o.city,
      zip: o.pincode,
      province: o.state || "",
      country_code: o.country_code || "IN",
    },
  };

  let res: Response;
  try {
    res = await qikinkFetch(cfg, cfg.orderPath, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const error = `Network error talking to Qikink: ${
      e instanceof Error ? e.message : String(e)
    }`;
    await logQikinkError(orderId, "request", error);
    return { ok: false, error };
  }

  const text = await res.text();
  if (!res.ok) {
    const error = `Qikink rejected the order (${res.status}): ${text.slice(
      0,
      300
    )}`;
    await logQikinkError(orderId, "qikink-api", error);
    return { ok: false, error };
  }

  let qikinkOrderId = "";
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    const statusCode = String(j.status_code ?? "");
    if (statusCode && statusCode !== "200") {
      const error = `Qikink returned status_code ${statusCode}: ${text.slice(0, 300)}`;
      await logQikinkError(orderId, "qikink-api", error);
      return { ok: false, error };
    }
    const cand = j.order_id ?? j.orderId ?? j.id;
    qikinkOrderId =
      typeof cand === "string" || typeof cand === "number"
        ? String(cand)
        : text.slice(0, 80);
  } catch {
    qikinkOrderId = text.slice(0, 80);
  }

  await supabaseAdmin()
    .from("orders")
    .update({
      qikink_order_id: qikinkOrderId,
      qikink_forwarded_at: new Date().toISOString(),
      qikink_error_log: null,
      status: "in_print",
    })
    .eq("id", orderId);

  return { ok: true, qikinkOrderId };
}
