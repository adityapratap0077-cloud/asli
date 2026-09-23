import Image from "next/image";
import Link from "next/link";
import { DESIGNS, PRODUCTS, formatINR } from "@/lib/catalog";
import { BRAND } from "@/lib/brand";

const TICKER = [
  "Wear the real you",
  "Free AI design",
  "Printed on demand in India",
  "One of one",
];

const STEPS = [
  {
    n: "01",
    title: "Pick your garment",
    body: "Oversized tee, regular tee, or hoodie — only the colours the printer actually stocks.",
  },
  {
    n: "02",
    title: "Generate with AI",
    body: "Describe the graphic in plain words. The AI draws it free, in seconds, unlimited tries.",
  },
  {
    n: "03",
    title: "Wear your one-of-one",
    body: "Preview it live, add your own text, then order. Printed only after you order.",
  },
];

const FAQS = [
  {
    q: "Is the AI generation really free?",
    a: "Yes. Artwork is generated with Pollinations.ai, which is free and needs no API key. Generate and regenerate as much as you like before ordering.",
  },
  {
    q: "How does my design get printed?",
    a: "Orders are fulfilled print-on-demand in India — each piece is printed only after you order it, then shipped to your door. No inventory, no bulk runs.",
  },
  {
    q: "Can I put Hindi text on my garment?",
    a: "Yes. The text layer supports Devanagari with a proper Hindi typeface, plus display and mono fonts. Type it, position it, done.",
  },
  {
    q: "Who owns the design I create?",
    a: "You do. Anything you generate in the studio is yours to wear, gift, or sell.",
  },
  {
    q: "How much does a custom piece cost?",
    a: "Custom tees are ₹949 and hoodies ₹1,299 — the AI design work is included free. You pay UPI (India) or PayPal (international); every payment is verified by hand before printing.",
  },
];

function SectionHead({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
      <p className="micro">{index}</p>
      <h2 className="font-display text-3xl uppercase tracking-wide sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* Thin ticker */}
      <div className="overflow-hidden border-b border-white/10 py-2.5">
        <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="micro">
              {t} <span className="ml-10 text-white/40">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="grain">
        <div className="mx-auto max-w-7xl px-5 pt-16 sm:pt-24">
          <p className="micro">AI custom streetwear — printed in India</p>
          <h1 className="font-display mt-6 text-[16vw] uppercase leading-[0.88] tracking-tight sm:text-[11vw] lg:text-[9rem]">
            Wear the
            <br />
            <span className="text-stroke">real you</span>
          </h1>
          <p className="font-devanagari mt-6 text-xl text-[#c9c9ce] sm:text-2xl">
            {BRAND.taglineHindi}
          </p>
          <p className="mt-4 max-w-xl text-[#8f8f96]">
            Type a prompt, AI draws the graphic, and it gets printed on your
            garment. One piece, one of one — if you can describe it, you can
            wear it.
          </p>
          <form
            action="/studio"
            method="get"
            className="mt-8 flex max-w-xl items-stretch border-b border-white/25 pb-1 focus-within:border-white/70"
          >
            <input
              name="prompt"
              placeholder="Describe your graphic…"
              className="w-full bg-transparent py-3 text-white placeholder-[#5a5a61] focus:outline-none"
            />
            <button
              type="submit"
              className="btn-solid shrink-0 px-8 text-sm font-semibold uppercase tracking-widest"
            >
              Design
            </button>
          </form>
        </div>
        <figure className="mt-14 border-y border-white/10">
          <Image
            src="/hero.webp"
            alt="Black oversized t-shirt in dramatic light"
            width={1600}
            height={700}
            priority
            className="aspect-[16/9] w-full object-cover sm:aspect-[21/8]"
          />
          <figcaption className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
            <span className="micro">Fig. 01 — Oversized tee, black</span>
            <span className="micro">Worn nowhere else</span>
          </figcaption>
        </figure>
      </section>

      {/* PROCESS */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
        <SectionHead index="01 — Process" title="How it works" />
        <div className="grid md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={`py-10 pr-8 md:py-14 ${
                i > 0 ? "md:border-l md:border-white/10 md:pl-8" : ""
              } ${i < 2 ? "border-b border-white/10 md:border-b-0" : ""}`}
            >
              <p className="micro text-white">{s.n}</p>
              <h3 className="font-display mt-4 text-2xl uppercase tracking-wide">
                {s.title}
              </h3>
              <p className="mt-3 text-[#8f8f96]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DROPS */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
          <SectionHead index="02 — Drops" title="Fresh drops" />
          <p className="mt-6 max-w-xl text-[#8f8f96]">
            Starter designs from the vault. Open any of them in the studio and
            make it yours.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-px bg-white/10 md:grid-cols-3">
            {DESIGNS.slice(0, 3).map((d) => (
              <Link
                key={d.id}
                href={`/studio?design=${encodeURIComponent(d.src)}`}
                className="group bg-[#0b0b0d]"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <Image
                    src={d.src}
                    alt={d.name}
                    width={600}
                    height={750}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <p className="font-medium">{d.name}</p>
                  <p className="micro group-hover:text-white">
                    Remix <span aria-hidden>→</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-right">
            <Link
              href="/gallery"
              className="micro text-white underline underline-offset-4 hover:text-[#c9c9ce]"
            >
              View all drops
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
          <SectionHead index="03 — Pricing" title="Honest pricing" />
          <p className="mt-6 max-w-xl text-[#8f8f96]">
            AI design is free, forever. You pay for the garment and the print.
          </p>
          <div className="mt-10">
            {PRODUCTS.map((p) => (
              <div
                key={p.id}
                className="grid items-center gap-2 border-t border-white/10 py-8 sm:grid-cols-[1fr_1fr_auto] sm:gap-8"
              >
                <div>
                  <h3 className="font-display text-2xl uppercase tracking-wide sm:text-3xl">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#8f8f96]">{p.blurb}</p>
                </div>
                <p className="micro hidden sm:block">AI design included</p>
                <div className="flex items-center justify-between gap-8 sm:justify-end">
                  <p className="font-display text-3xl">{formatINR(p.price)}</p>
                  <Link
                    href={`/studio?product=${p.id}`}
                    className="btn-ghost px-6 py-3 text-sm font-semibold uppercase tracking-widest"
                  >
                    Design
                  </Link>
                </div>
              </div>
            ))}
            <div className="border-t border-white/10" />
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center sm:py-32">
          <p className="micro">04 — Manifesto</p>
          <p className="font-display mt-8 text-3xl uppercase leading-tight tracking-wide sm:text-5xl">
            Fast fashion prints a lakh copies of the same tee. We print exactly
            one — <span className="text-stroke">yours.</span>
          </p>
          <p className="font-devanagari mt-8 text-lg text-[#8f8f96]">
            हर पीस पहनने वाले ने डिज़ाइन किया है। कोई वेयरहाउस नहीं, कोई
            डेडस्टॉक नहीं।
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-5 py-20 sm:py-28">
          <SectionHead index="05 — Questions" title="FAQ" />
          <div className="mt-4">
            {FAQS.map((f) => (
              <details key={f.q} className="faq group border-b border-white/10">
                <summary className="flex items-center justify-between gap-4 py-6">
                  <span className="text-lg font-medium">{f.q}</span>
                  <span className="faq-icon micro text-xl">+</span>
                </summary>
                <p className="pb-6 pr-10 text-[#8f8f96]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="grain border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-24 text-center sm:py-32">
          <h2 className="font-display mx-auto max-w-4xl text-[13vw] uppercase leading-[0.9] tracking-tight sm:text-8xl">
            Your tee doesn't <span className="text-stroke">exist yet</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[#8f8f96]">
            Design it in five minutes. Wear the only one on earth.
          </p>
          <Link
            href="/studio"
            className="btn-solid mt-10 inline-block px-12 py-4 text-sm font-semibold uppercase tracking-widest"
          >
            Start designing — free
          </Link>
        </div>
      </section>
    </div>
  );
}
