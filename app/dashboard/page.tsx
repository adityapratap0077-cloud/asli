"use client";

import { useCallback, useEffect, useState } from "react";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";

interface OrderRow {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  product: string;
  color: string;
  size: string;
  design: string;
  custom_text: string;
  method: string;
  payment_ref: string;
  payer_email: string;
  total: number;
  status: OrderStatus;
  qikink_order_id: string | null;
  qikink_forwarded_at: string | null;
  qikink_error_log: { at: string; step: string; message: string } | null;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  payment_pending: "Payment pending",
  verified: "Verified",
  in_print: "In print",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#101014] p-3 text-sm text-white placeholder-[#5a5a61] focus:border-white/40 focus:outline-none";

export default function DashboardPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  const load = useCallback(async (k: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders?key=${encodeURIComponent(k)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setOrders(data.orders ?? []);
      setAuthed(true);
      sessionStorage.setItem("asli-owner-key", k);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("asli-owner-key");
    if (saved) {
      setKey(saved);
      load(saved);
    }
  }, [load]);

  const setStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, id, status }),
    });
    if (res.ok) {
      // Reload: verifying a payment auto-forwards to Qikink, which may
      // have flipped the status to in_print and set fulfillment fields.
      await load(key);
    }
  };

  const [qikinkMsg, setQikinkMsg] = useState("");
  const [qikinkBusy, setQikinkBusy] = useState(false);

  const testQikink = async () => {
    setQikinkBusy(true);
    setQikinkMsg("");
    try {
      const res = await fetch(
        `/api/qikink/test?key=${encodeURIComponent(key)}`
      );
      const data = await res.json();
      setQikinkMsg(
        data.ok ? `Qikink connected: ${data.detail}` : `Qikink failed: ${data.detail}`
      );
    } catch (e) {
      setQikinkMsg(`Qikink test error: ${e instanceof Error ? e.message : e}`);
    } finally {
      setQikinkBusy(false);
    }
  };

  const forwardToQikink = async (id: string) => {
    setQikinkBusy(true);
    setQikinkMsg("");
    try {
      const res = await fetch("/api/qikink/forward-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Forward failed");
      setQikinkMsg(
        data.skipped
          ? `${id}: ${data.skipped}`
          : `${id}: forwarded to Qikink (${data.qikinkOrderId}).`
      );
      await load(key);
    } catch (e) {
      setQikinkMsg(
        `${id}: forward failed — ${e instanceof Error ? e.message : e}`
      );
      await load(key);
    } finally {
      setQikinkBusy(false);
    }
  };

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <p className="font-spacemono text-xs tracking-[0.3em] text-[#8f8f96]">
          {BRAND.name} — OWNER ONLY
        </p>
        <h1 className="font-display mt-4 text-3xl">Order dashboard</h1>
        <p className="mt-2 text-sm text-[#8f8f96]">
          Enter your owner key (the OWNER_DASHBOARD_KEY env var) to view
          orders.
        </p>
        <input
          type="password"
          className={`${inputCls} mt-6`}
          placeholder="Owner key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(key)}
        />
        <button
          onClick={() => load(key)}
          disabled={loading || !key}
          className="mt-3 w-full rounded-full bg-[#f2f2f0] py-3 font-semibold text-[#0b0b0d] hover:bg-white disabled:opacity-50"
        >
          {loading ? "Checking…" : "Unlock dashboard"}
        </button>
        {error && (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  }

  const visible =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const pending = orders.filter((o) => o.status === "payment_pending").length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-spacemono text-xs tracking-[0.3em] text-[#8f8f96]">
            {BRAND.name} — OWNER
          </p>
          <h1 className="font-display mt-2 text-3xl sm:text-4xl">
            Orders{" "}
            <span className="text-lg text-[#8f8f96]">
              ({orders.length} total{pending > 0 && `, ${pending} pending`})
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          {(["all", ...ORDER_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                filter === s
                  ? "border-white bg-white/10 text-white"
                  : "border-white/15 text-[#8f8f96] hover:border-white/40"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#101014] p-4">
        <button
          onClick={testQikink}
          disabled={qikinkBusy}
          className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/50 disabled:opacity-50"
        >
          {qikinkBusy ? "Working…" : "Test Qikink connection"}
        </button>
        {qikinkMsg && (
          <p className="text-sm text-[#c9c9ce]">{qikinkMsg}</p>
        )}
      </div>

      <div className="mt-8 space-y-4">
        {visible.map((o) => (
          <div
            key={o.id}
            className="rounded-2xl border border-white/10 bg-[#101014] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-spacemono text-sm">{o.id}</p>
                <p className="mt-1 text-sm text-[#8f8f96]">
                  {new Date(o.created_at).toLocaleString("en-IN")} ·{" "}
                  {o.method.toUpperCase()} · ₹{o.total.toLocaleString("en-IN")}
                </p>
              </div>
              <select
                value={o.status}
                onChange={(e) =>
                  setStatus(o.id, e.target.value as OrderStatus)
                }
                className="rounded-xl border border-white/10 bg-[#0b0b0d] p-2 text-sm text-white"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="font-spacemono text-xs text-[#8f8f96]">
                  CUSTOMER
                </p>
                <p className="mt-1 font-semibold">{o.name}</p>
                <p className="text-[#c9c9ce]">{o.phone}</p>
                <p className="text-[#c9c9ce]">
                  {o.address}, {o.city} — {o.pincode}
                </p>
              </div>
              <div>
                <p className="font-spacemono text-xs text-[#8f8f96]">ITEM</p>
                <p className="mt-1 font-semibold">
                  {o.product} · {o.color}
                  {o.size ? ` · Size ${o.size}` : ""}
                </p>
                {o.custom_text && (
                  <p className="text-[#c9c9ce]">Text: “{o.custom_text}”</p>
                )}
                {o.design && (
                  <a
                    href={o.design}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#c9c9ce] underline underline-offset-2 hover:text-white"
                  >
                    View artwork
                  </a>
                )}
              </div>
              <div>
                <p className="font-spacemono text-xs text-[#8f8f96]">PAYMENT</p>
                <p className="mt-1 font-semibold">
                  {o.method === "upi" ? "UPI" : "PayPal"} — ref {o.payment_ref}
                </p>
                {o.payer_email && (
                  <p className="text-[#c9c9ce]">{o.payer_email}</p>
                )}
                <p className="mt-1 text-xs text-[#8f8f96]">
                  Verify the payment in your UPI app / PayPal before marking
                  verified.
                </p>
              </div>
              <div>
                <p className="font-spacemono text-xs text-[#8f8f96]">
                  FULFILLMENT
                </p>
                {o.qikink_order_id ? (
                  <p className="mt-1 font-semibold text-emerald-300">
                    Sent to Qikink
                  </p>
                ) : o.qikink_error_log ? (
                  <p className="mt-1 font-semibold text-red-300">
                    Forward failed
                  </p>
                ) : (
                  <p className="mt-1 text-[#c9c9ce]">Not sent yet</p>
                )}
                {o.qikink_order_id && (
                  <p className="text-xs text-[#8f8f96]">
                    Qikink #{o.qikink_order_id}
                    {o.qikink_forwarded_at &&
                      ` · ${new Date(o.qikink_forwarded_at).toLocaleString("en-IN")}`}
                  </p>
                )}
                {o.qikink_error_log && (
                  <p className="mt-1 text-xs text-red-300/90">
                    {o.qikink_error_log.message}
                  </p>
                )}
                {!o.qikink_order_id &&
                  (o.status === "verified" || o.status === "in_print") && (
                    <button
                      onClick={() => forwardToQikink(o.id)}
                      disabled={qikinkBusy}
                      className="mt-2 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white hover:border-white/50 disabled:opacity-50"
                    >
                      {o.qikink_error_log ? "Retry forward" : "Forward to Qikink"}
                    </button>
                  )}
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-[#101014] p-10 text-center text-[#8f8f96]">
            No orders here yet.
          </p>
        )}
      </div>
    </div>
  );
}
