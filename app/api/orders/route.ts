import { NextRequest, NextResponse } from "next/server";
import {
  isOrdersBackendConfigured,
  supabaseAdmin,
  isValidStatus,
} from "@/lib/supabase";
import { isValidSize } from "@/lib/catalog";
import { forwardOrderToQikink } from "@/lib/qikink";

function ownerKeyOk(req: NextRequest): boolean {
  const expected = process.env.OWNER_DASHBOARD_KEY;
  if (!expected) return false;
  const got =
    req.nextUrl.searchParams.get("key") ??
    req.headers.get("x-owner-key") ??
    "";
  return got === expected;
}

function backendError() {
  return NextResponse.json(
    {
      error:
        "Order database not connected yet. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then run supabase/schema.sql.",
    },
    { status: 503 }
  );
}

/**
 * POST /api/orders — create an order (called by checkout).
 * Writes to Supabase when configured; 503 otherwise so the client
 * can fall back to clearly-labelled local storage.
 */
export async function POST(req: NextRequest) {
  if (!isOrdersBackendConfigured()) return backendError();

  let b: Record<string, string> = {};
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required = [
    "id",
    "name",
    "phone",
    "address",
    "city",
    "state",
    "pincode",
    "product",
    "color",
    "method",
    "paymentRef",
    "total",
  ] as const;
  for (const k of required) {
    if (!String(b[k] ?? "").trim()) {
      return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 });
    }
  }
  if (b.method !== "upi" && b.method !== "paypal") {
    return NextResponse.json({ error: "Bad method" }, { status: 400 });
  }
  const size = String(b.size ?? "M").toUpperCase();
  if (!isValidSize(size)) {
    return NextResponse.json({ error: "Bad size" }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("orders").insert({
    id: String(b.id),
    name: String(b.name),
    phone: String(b.phone),
    address: String(b.address),
    city: String(b.city),
    state: String(b.state),
    country_code: String(b.countryCode ?? "IN"),
    pincode: String(b.pincode),
    product: String(b.product),
    product_id: String(b.productId ?? ""),
    color: String(b.color),
    size,
    design: String(b.design ?? ""),
    custom_text: String(b.text ?? ""),
    method: b.method,
    payment_ref: String(b.paymentRef),
    payer_email: String(b.payerEmail ?? ""),
    total: Number(b.total) || 0,
    status: "payment_pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, synced: true });
}

/**
 * GET /api/orders?key=OWNER_DASHBOARD_KEY — list orders, newest first.
 * Owner-only: needs the dashboard key.
 */
export async function GET(req: NextRequest) {
  if (!ownerKeyOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOrdersBackendConfigured()) return backendError();

  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ orders: data });
}

/**
 * PATCH /api/orders — { key, id, status } — owner updates order status.
 */
export async function PATCH(req: NextRequest) {
  let b: { key?: string; id?: string; status?: string } = {};
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const expected = process.env.OWNER_DASHBOARD_KEY;
  if (!expected || b.key !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!b.id || !b.status || !isValidStatus(b.status)) {
    return NextResponse.json({ error: "Bad id/status" }, { status: 400 });
  }
  if (!isOrdersBackendConfigured()) return backendError();

  const { error } = await supabaseAdmin()
    .from("orders")
    .update({ status: b.status })
    .eq("id", b.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Payment verified -> hand the order to Qikink automatically.
  // Fire-and-forget: forwardOrderToQikink logs failures on the order
  // row, and the owner can retry from the dashboard.
  if (b.status === "verified" && b.id) {
    forwardOrderToQikink(b.id).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
