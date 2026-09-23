"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Mockup from "@/components/Mockup";
import {
  productById,
  productColors,
  colorById,
  isValidSize,
  TEXT_FONTS,
  formatINR,
  type ProductId,
  type TextPositionId,
} from "@/lib/catalog";
import { BRAND } from "@/lib/brand";

/**
 * Launch payment config — no gateway, no video KYC needed.
 * Defaults are the owner's own details (shared 2026-09-23):
 *  - UPI ID for Indian buyers
 *  - PayPal.Me link for international buyers (PayPal cannot take
 *    UPI or domestic INR payments)
 * The env vars NEXT_PUBLIC_OWNER_UPI_ID / NEXT_PUBLIC_PAYPAL_ME_URL
 * override these defaults if set.
 */
const OWNER_UPI_ID =
  process.env.NEXT_PUBLIC_OWNER_UPI_ID || "9889550543@ibl";
const PAYPAL_ME_URL =
  process.env.NEXT_PUBLIC_PAYPAL_ME_URL ||
  "https://paypal.me/adityapratap0077";
const UPI_IS_PLACEHOLDER = OWNER_UPI_ID === "yourname@upi";
const PAYPAL_IS_PLACEHOLDER =
  PAYPAL_ME_URL === "https://www.paypal.me/yourname";

type Method = "upi" | "paypal";

interface Order {
  id: string;
  createdAt: string;
  product: string;
  productId: string;
  color: string;
  size: string;
  design: string;
  text: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  countryCode: string;
  pincode: string;
  method: Method;
  paymentRef: string;
  payerEmail: string;
  total: number;
  /** true when the order reached the owner's database */
  synced: boolean;
}

function makeOrderId(): string {
  return (
    BRAND.orderPrefix + Date.now().toString(36).toUpperCase().slice(-6)
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#101014] p-3 text-sm text-white placeholder-[#5a5a61] focus:border-white/40 focus:outline-none";

function CheckoutInner() {
  const params = useSearchParams();
  const product = productById(params.get("product") ?? "oversized");
  const paramColor = params.get("color") ?? "";
  const validColors = productColors(product);
  const color = colorById(
    validColors.some((c) => c.id === paramColor) ? paramColor : validColors[0].id
  );
  const sizeParam = (params.get("size") ?? "M").toUpperCase();
  const size = isValidSize(sizeParam) ? sizeParam : "M";
  const designSrc = params.get("design") ?? "";
  const text = params.get("text") ?? "";
  const font =
    TEXT_FONTS.find((f) => f.id === params.get("font")) ?? TEXT_FONTS[0];
  const textPos = (params.get("pos") as TextPositionId) || "chest";

  const [step, setStep] = useState<"form" | "done">("form");
  const [method, setMethod] = useState<Method>("upi");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  const placeOrder = async () => {
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!/^[6-9]\d{9}$/.test(phone.trim()))
      return setError("Please enter a valid 10-digit mobile number.");
    if (address.trim().length < 8)
      return setError("Please enter your full delivery address.");
    if (city.trim().length < 2)
      return setError("Please enter your city.");
    if (state.trim().length < 2)
      return setError("Please enter your state (required by the courier).");
    if (!/^\d{6}$/.test(pincode.trim()))
      return setError("Please enter a valid 6-digit pincode.");
    if (method === "upi" && !/^\d{12}$/.test(paymentRef.trim()))
      return setError(
        "Please enter the 12-digit UTR / transaction reference from your UPI app."
      );
    if (method === "paypal" && paymentRef.trim().length < 8)
      return setError(
        "Please enter your PayPal transaction ID (you get it after paying)."
      );
    if (
      method === "paypal" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail.trim())
    )
      return setError("Please enter the payer email from your PayPal payment.");
    setError("");

    const o: Order = {
      id: makeOrderId(),
      createdAt: new Date().toISOString(),
      product: product.name,
      productId: product.id,
      color: color.label,
      size,
      design: designSrc,
      text,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      countryCode: "IN",
      pincode: pincode.trim(),
      method,
      paymentRef: paymentRef.trim(),
      payerEmail: payerEmail.trim(),
      total: product.price,
      synced: false,
    };

    // Send to the owner's order database; fall back to a clearly-labelled
    // local copy if the backend isn't connected yet.
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(o),
      });
      o.synced = res.ok;
    } catch {
      o.synced = false;
    }
    try {
      const prev = JSON.parse(localStorage.getItem("asli-orders") ?? "[]");
      localStorage.setItem("asli-orders", JSON.stringify([...prev, o]));
    } catch {
      /* local backup unavailable — order still confirmed on screen */
    }
    setOrder(o);
    setStep("done");
  };

  if (step === "done" && order) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-14 text-center">
        <p className="font-spacemono text-xs tracking-[0.3em] text-[#8f8f96]">
          ORDER RECEIVED
        </p>
        <h1 className="font-display mt-4 text-4xl">{order.id}</h1>

        <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-amber-400/30 bg-[#101014] p-7 text-left">
          <p className="font-semibold text-amber-300">
            Payment pending verification
          </p>
          {order.method === "upi" ? (
            <p className="mt-2 text-sm text-[#c9c9ce]">
              We received your order with UTR {order.paymentRef}. UPI payments
              are verified manually — usually within a few hours. Your order
              goes to print as soon as the payment is confirmed, and we will
              message {order.phone} either way.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#c9c9ce]">
              We received your order with PayPal transaction{" "}
              {order.paymentRef}. PayPal payments are matched manually against
              the payer email ({order.payerEmail}) — usually within a few
              hours. Your order goes to print as soon as it is confirmed, and
              we will message {order.phone} either way.
            </p>
          )}
          <p className="mt-2 text-sm text-[#8f8f96]">
            No money is taken by us automatically — nothing is charged until
            the payment is verified by a human.
          </p>
          {!order.synced && (
            <p className="mt-2 text-sm text-amber-200/80">
              Heads up: our order system is still being connected, so this
              order is saved on your device for now. Screenshot this page —
              we will still confirm everything on {order.phone}.
            </p>
          )}
        </div>

        <div className="mx-auto mt-6 max-w-lg text-left text-sm text-[#8f8f96]">
          <p className="font-spacemono text-xs tracking-[0.25em]">
            WHAT HAPPENS NEXT
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>We verify your payment manually.</li>
            <li>We confirm your order on WhatsApp/SMS.</li>
            <li>Your piece is printed on demand and quality-checked.</li>
            <li>It ships across India in 3–5 working days.</li>
          </ol>
        </div>

        <Link
          href="/studio"
          className="mt-10 inline-block rounded-full border border-white/25 px-7 py-3 font-semibold hover:border-white/60"
        >
          Design another
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-3xl sm:text-4xl">CHECKOUT</h1>
      <p className="mt-2 max-w-2xl text-[#c9c9ce]">
        No payment gateway at launch — pay manually and we verify every order
        by hand. UPI for Indian buyers, PayPal for international buyers.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px]">
        {/* FORM */}
        <div className="space-y-6">
          <div>
            <p className="font-spacemono text-xs tracking-[0.25em] text-[#8f8f96]">
              DELIVERY DETAILS
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                className={inputCls}
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="Mobile number"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                className={`${inputCls} sm:col-span-2`}
                placeholder="Full address (house no, street, area)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="State (e.g. Uttar Pradesh)"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="Pincode"
                inputMode="numeric"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="font-spacemono text-xs tracking-[0.25em] text-[#8f8f96]">
              PAYMENT METHOD
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setMethod("upi")}
                className={`rounded-2xl border p-5 text-left transition ${
                  method === "upi"
                    ? "border-white bg-white/10"
                    : "border-white/10 bg-[#101014] hover:border-white/30"
                }`}
              >
                <p className="font-semibold">
                  Manual UPI{" "}
                  <span className="ml-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-normal text-emerald-300">
                    For Indian buyers
                  </span>
                </p>
                <p className="mt-1 text-sm text-[#8f8f96]">
                  Pay to our UPI ID from any UPI app, then enter your 12-digit
                  UTR below.
                </p>
              </button>
              <button
                onClick={() => setMethod("paypal")}
                className={`rounded-2xl border p-5 text-left transition ${
                  method === "paypal"
                    ? "border-white bg-white/10"
                    : "border-white/10 bg-[#101014] hover:border-white/30"
                }`}
              >
                <p className="font-semibold">
                  PayPal{" "}
                  <span className="ml-1 rounded-full bg-sky-400/15 px-2 py-0.5 text-xs font-normal text-sky-300">
                    For international buyers
                  </span>
                </p>
                <p className="mt-1 text-sm text-[#8f8f96]">
                  PayPal cannot take UPI or domestic INR payments — use this
                  if you are ordering from outside India.
                </p>
              </button>
            </div>

            {method === "upi" && (
              <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-[#101014] p-5">
                <p className="font-spacemono text-xs tracking-[0.25em] text-[#8f8f96]">
                  PAY TO THIS UPI ID
                </p>
                <p className="font-spacemono mt-2 text-lg">
                  {OWNER_UPI_ID}{" "}
                  {UPI_IS_PLACEHOLDER && (
                    <span className="ml-2 rounded bg-amber-400/15 px-2 py-0.5 text-xs text-amber-300">
                      PLACEHOLDER — owner sets the real ID after approval
                    </span>
                  )}
                </p>
                <p className="mt-3 flex items-center gap-4">
                  <img
                    src="/upi-qr.png"
                    alt="Scan to pay with UPI"
                    className="h-36 w-36 shrink-0 rounded-xl bg-white p-2"
                  />
                  <span className="text-sm text-[#8f8f96]">
                    Scan this QR in any UPI app, or pay directly to the UPI
                    ID above. After paying, paste the 12-digit UTR /
                    transaction reference:
                  </span>
                </p>
                <input
                  className={`${inputCls} mt-3`}
                  placeholder="12-digit UTR (e.g. 409812345678)"
                  inputMode="numeric"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>
            )}

            {method === "paypal" && (
              <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-[#101014] p-5">
                <p className="font-spacemono text-xs tracking-[0.25em] text-[#8f8f96]">
                  PAY WITH PAYPAL
                </p>
                <a
                  href={PAYPAL_ME_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block rounded-full bg-[#f2f2f0] px-6 py-3 font-semibold text-[#0b0b0d] hover:bg-white"
                >
                  Pay {formatINR(product.price)} with PayPal
                </a>
                {PAYPAL_IS_PLACEHOLDER && (
                  <p className="mt-2">
                    <span className="rounded bg-amber-400/15 px-2 py-0.5 text-xs text-amber-300">
                      PLACEHOLDER LINK — owner connects their PayPal.Me URL
                      after approval
                    </span>
                  </p>
                )}
                <p className="mt-3 text-sm text-[#8f8f96]">
                  After paying on PayPal, come back and enter your transaction
                  details so we can match your payment to this order:
                </p>
                <input
                  className={`${inputCls} mt-3`}
                  placeholder="PayPal transaction ID"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
                <input
                  className={`${inputCls} mt-3`}
                  placeholder="Payer email (from your PayPal payment)"
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            onClick={placeOrder}
            className="w-full rounded-full bg-[#f2f2f0] py-4 font-semibold text-[#0b0b0d] hover:bg-white"
          >
            Place order — {formatINR(product.price)}
          </button>
          <p className="text-xs text-[#8f8f96]">
            Online card and one-click payments (via Razorpay — UPI, cards,
            international cards and PayPal in a single checkout) will be added
            later, when order volume justifies the KYC process.
          </p>
        </div>

        {/* SUMMARY */}
        <div>
          <div className="lg:sticky lg:top-6">
            <div className="mx-auto max-w-[280px]">
              <Mockup
                product={product.id as ProductId}
                color={color}
                designSrc={designSrc || null}
                text={text}
                textFont={font.family}
                textSize={34}
                textPos={textPos}
              />
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-[#101014] p-5 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-[#8f8f96]">Item</span>
                <span>{product.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8f8f96]">Colour</span>
                <span>{color.label}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8f8f96]">Size</span>
                <span>{size}</span>
              </div>
              {text.trim() && (
                <div className="flex justify-between py-1">
                  <span className="text-[#8f8f96]">Custom text</span>
                  <span className="max-w-[55%] truncate">“{text}”</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-[#8f8f96]">Design</span>
                <span>AI custom — free</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatINR(product.price)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-5 py-20 text-[#8f8f96]">
          Loading checkout…
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
