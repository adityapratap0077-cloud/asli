import Image from "next/image";
import Link from "next/link";
import { DESIGNS } from "@/lib/catalog";
import { BRAND } from "@/lib/brand";

const STEPS = [
  {
    n: "01",
    title: "Pick your garment",
    body: "Oversized tee, regular tee, or hoodie — in black, white, or navy.",
  },
  {
    n: "02",
    title: "Generate with AI",
    body: "Type a prompt or tap a style preset. The artwork is generated free, in seconds.",
  },
  {
    n: "03",
    title: "Preview and order",
    body: "See it on the garment, add your own text, download the mockup, place the order.",
  },
];

const FAQS = [
  {
    q: "Is the AI generation really free?",
    a: "Yes. Artwork is generated with Pollinations.ai, which is free and needs no API key. You can generate and regenerate as much as you like before ordering.",
  },
  {
    q: "How does my design get printed?",
    a: "Orders are fulfilled print-on-demand in India — each piece is printed only after you order it, then shipped to your door. No inventory, no bulk orders.",
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
    a: "Custom tees are ₹949 and hoodies ₹1,299 — the AI design work is included free.",
  },
];

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Image
          src="/hero.webp"
          alt="Black oversized t-shirt in dramatic light"
          fill
          priority
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0d]/60 via-[#0b0b0d]/30 to-[#0b0b0d]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-28 pt-24 sm:pt-32">
          <p className="font-spacemono text-xs tracking-[0.3em] text-[#c9c9ce]">
            {BRAND.name} {BRAND.devanagari} — {BRAND.descriptor.toUpperCase()}
          </p>
          <h1 className="font-display mt-6 max-w-3xl text-5xl leading-[1.02] sm:text-7xl">
            WEAR THE
            <br />
            REAL YOU
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[#c9c9ce]">
            असली means real. Type a prompt, AI draws the graphic, and it gets
            printed on your garment — one piece, one of one, nobody else on
            earth wearing it. No design skills needed. If you can describe it,
            you can wear it.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/studio"
              className="rounded-full bg-[#f2f2f0] px-7 py-3.5 font-semibold text-[#0b0b0d] hover:bg-white"
            >
              Open the Studio
            </Link>
            <Link
              href="/gallery"
              className="rounded-full border border-white/25 px-7 py-3.5 font-semibold text-white hover:border-white/60"
            >
              Browse drops
            </Link>
          </div>
        </div>
      </section>

      {/* STRIP */}
      <section className="border-y border-white/10 bg-[#101014]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-white/10 px-5 sm:grid-cols-3 sm:divide-x">
          {["DESIGNED BY YOU", "ONE OF ONE", "PRINTED ON DEMAND"].map(
            (t) => (
              <p
                key={t}
                className="font-spacemono py-5 text-center text-xs tracking-[0.25em] text-[#8f8f96]"
              >
                {t}
              </p>
            )
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-3xl sm:text-4xl">HOW IT WORKS</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-white/10 bg-[#101014] p-7"
            >
              <p className="font-spacemono text-sm text-[#8f8f96]">{s.n}</p>
              <h3 className="font-display mt-3 text-xl">{s.title}</h3>
              <p className="mt-3 text-[#c9c9ce]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY TEASER */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl sm:text-4xl">FRESH DROPS</h2>
          <Link href="/gallery" className="text-sm text-[#c9c9ce] underline underline-offset-4 hover:text-white">
            View all
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3">
          {DESIGNS.slice(0, 3).map((d) => (
            <Link
              key={d.id}
              href={`/studio?design=${encodeURIComponent(d.src)}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101014]"
            >
              <div className="relative aspect-square">
                <Image
                  src={d.src}
                  alt={d.name}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="font-semibold">{d.name}</p>
                <p className="font-spacemono text-xs text-[#8f8f96]">{d.tag}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BRAND */}
      <section className="border-b border-white/10 bg-[#101014]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-16 text-center sm:flex-row sm:text-left">
          <Image
            src="/logo-wordmark.png"
            alt="ASLI असली wordmark"
            width={320}
            height={320}
            className="w-44 shrink-0 rounded-2xl sm:w-56"
          />
          <div>
            <p className="font-spacemono text-xs tracking-[0.3em] text-[#8f8f96]">
              WHY ASLI
            </p>
            <p className="mt-3 max-w-2xl text-lg text-[#c9c9ce]">
              Streetwear's oldest question is real vs fake. Fast fashion prints
              a lakh copies of the same tee — {BRAND.name} prints exactly one:
              yours. Every piece is designed by its wearer and printed on
              demand in India. <span className="text-white">{BRAND.taglineHindi}</span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 pb-24">
        <h2 className="font-display text-3xl sm:text-4xl">QUESTIONS</h2>
        <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {FAQS.map((f) => (
            <details key={f.q} className="faq group py-5">
              <summary className="flex items-center justify-between gap-4">
                <span className="font-semibold">{f.q}</span>
                <span className="faq-icon font-spacemono text-xl text-[#8f8f96]">
                  +
                </span>
              </summary>
              <p className="mt-3 pr-8 text-[#c9c9ce]">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/studio"
            className="inline-block rounded-full bg-[#f2f2f0] px-8 py-4 font-semibold text-[#0b0b0d] hover:bg-white"
          >
            Start designing — it is free
          </Link>
        </div>
      </section>
    </div>
  );
}
