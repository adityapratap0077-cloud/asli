import Link from "next/link";
import { BRAND } from "@/lib/brand";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Payments",
    body: [
      "ASLI runs on manual payments at launch — UPI for Indian buyers, PayPal for international buyers. There is no payment gateway and no video KYC involved.",
      "After you pay, you enter your UTR / transaction reference at checkout. Every payment is verified by a human — usually within a few hours — before anything goes to print.",
      "Nothing is ever charged automatically. If your payment can't be verified, the order is cancelled and anything you paid is returned to source.",
    ],
  },
  {
    title: "Shipping",
    body: [
      "Orders ship across India in 3–5 working days after payment verification and printing.",
      "International orders (paid via PayPal) are quoted per order before printing — shipping time is typically 10–15 working days depending on the country.",
      "You get a confirmation message on your phone number at every stage: verified, printed, shipped.",
    ],
  },
  {
    title: "Returns & reprints",
    body: [
      "Every piece is custom-made for one person, so we can't accept returns for change of mind — please double-check size, colour, and design at checkout.",
      "If your piece arrives with a print defect, wrong design, or wrong garment, send us a photo within 7 days of delivery and we reprint or replace it free. No arguments.",
      "Size exchanges are handled case by case — message us and we'll sort it out.",
    ],
  },
  {
    title: "Refunds",
    body: [
      "Payment not verified → order cancelled, full amount returned to the source account.",
      "Design rejected in moderation (see below) → full refund, no questions.",
      "We cancel for any other reason → full refund.",
      "Refunds go back through the same channel you paid with (UPI reversal or PayPal refund).",
    ],
  },
  {
    title: "What we won't print",
    body: [
      "Hate symbols or slurs targeting any community; extremist or terrorist imagery.",
      "Sexual content involving minors — zero tolerance, order cancelled and refunded.",
      "Direct copies of other brands' logos or copyrighted characters for resale.",
      "Anything instructing real-world harm.",
      "Every design is reviewed by a human before printing. If your design is rejected, you get a full refund and a note explaining why.",
    ],
  },
  {
    title: "Your design, your rights",
    body: [
      "Anything you generate in the studio is yours — wear it, gift it, sell it. We don't claim ownership of your artwork.",
      "By ordering, you confirm your design is your own creation (or you have the right to use it) and doesn't infringe anyone else's rights.",
    ],
  },
];

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="font-spacemono text-xs tracking-[0.3em] text-[#8f8f96]">
        {BRAND.name} {BRAND.devanagari}
      </p>
      <h1 className="font-display mt-4 text-4xl sm:text-5xl">
        SHIPPING, RETURNS
        <br />
        & THE FINE PRINT
      </h1>
      <p className="mt-4 text-[#c9c9ce]">
        Plain-language policies. No legalese — if something here is unclear,
        ask us before ordering and we'll answer straight.
      </p>

      <div className="mt-12 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-2xl">{s.title.toUpperCase()}</h2>
            <div className="mt-4 space-y-3">
              {s.body.map((p, i) => (
                <p key={i} className="text-[#c9c9ce]">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 text-center">
        <Link
          href="/studio"
          className="inline-block rounded-full bg-[#f2f2f0] px-8 py-4 font-semibold text-[#0b0b0d] hover:bg-white"
        >
          Design yours — {BRAND.tagline}
        </Link>
      </div>
    </div>
  );
}
