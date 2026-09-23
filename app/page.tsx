import Image from "next/image";
import Link from "next/link";
import TiltCard from "@/components/TiltCard";
import { DESIGNS, PRODUCTS, formatINR } from "@/lib/catalog";
import { BRAND } from "@/lib/brand";

const TICKER = [
  "असली — WEAR THE REAL YOU",
  "FREE AI DESIGN",
  "PRINTED ON DEMAND IN INDIA",
  "ONE OF ONE",
  "NO TWO PIECES ALIKE",
];

const STEPS = [
  {
    n: "01",
    title: "Pick your garment",
    body: "Oversized tee, regular tee, or hoodie — only the colours the printer actually stocks. What you see is what gets printed.",
    tilt: "-rotate-1",
  },
  {
    n: "02",
    title: "Generate with AI",
    body: "Describe the graphic in plain words — English, Hindi, Hinglish, whatever. The AI draws it free, in seconds, unlimited tries.",
    tilt: "rotate-1",
  },
  {
    n: "03",
    title: "Wear your one-of-one",
    body: "Preview it live on the garment, add your own text, then order. Printed only after you order. Nobody else on earth wearing it.",
    tilt: "-rotate-1",
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

function Ticker({ items, fast = false }: { items: string[]; fast?: boolean }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-white/10 bg-[#101014] py-3">
      <div
        className={`flex w-max items-center gap-8 whitespace-nowrap ${
          fast ? "animate-marquee-fast" : "animate-marquee"
        }`}
      >
        {row.map((t, i) => (
          <span
            key={i}
            className="font-spacemono text-xs tracking-[0.25em] text-[#8f8f96]"
          >
            {t} <span className="ml-8 text-white">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <Ticker items={TICKER} />

      {/* HERO */}
      <section className="grain relative overflow-hidden">
        <div className="orb left-1/2 top-10 h-[420px] w-[420px] -translate-x-1/2 bg-white/[0.05]" />
        <div
          aria-hidden
          className="font-devanagari pointer-events-none absolute -right-8 top-6 select-none text-[26vw] leading-none text-white/[0.04] sm:text-[18vw]"
        >
          असली
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="font-spacemono text-xs tracking-[0.3em] text-[#c9c9ce]">
              <span className="live-dot mr-2 inline-block h-2 w-2 rounded-full bg-white" />
              AI CUSTOM STREETWEAR — PRINTED IN INDIA
            </p>
            <h1 className="font-display mt-6 text-[17vw] leading-[0.95] sm:text-8xl lg:text-[7.5rem]">
              WEAR THE
              <br />
              <span className="text-stroke">REAL YOU</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#c9c9ce]">
              असली means real. Type a prompt, AI draws the graphic, and it gets
              printed on your garment — one piece, one of one. If you can
              describe it, you can wear it.
            </p>
            <form
              action="/studio"
              method="get"
              className="card-3d mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-[#101014] p-2 pl-5 focus-within:border-white/40"
            >
              <input
                name="prompt"
                placeholder='Describe your graphic… e.g. "tiger with a gold chain"'
                className="w-full bg-transparent text-sm text-white placeholder-[#5a5a61] focus:outline-none"
              />
              <button
                type="submit"
                className="btn-3d shrink-0 rounded-xl px-6 py-3 text-sm font-bold"
              >
                Design it →
              </button>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm">
              <Link
                href="/studio"
                className="font-semibold text-white underline underline-offset-4 hover:text-[#c9c9ce]"
              >
                Open the full studio
              </Link>
              <Link href="/gallery" className="text-[#8f8f96] hover:text-white">
                or browse the drops →
              </Link>
            </div>
          </div>

          {/* 3D hero card */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="orb -inset-10 bg-white/[0.06]" />
            <TiltCard max={12}>
              <div className="card-3d relative overflow-hidden rounded-3xl bg-[#101014]">
                <Image
                  src="/hero.webp"
                  alt="Black oversized t-shirt in dramatic light"
                  width={640}
                  height={800}
                  priority
                  className="aspect-[4/5] w-full object-cover"
                />
                <div className="tilt-pop absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
                <p className="tilt-pop font-display absolute bottom-5 left-5 text-2xl tracking-wide">
                  1 OF 1
                </p>
              </div>
            </TiltCard>
            <div className="tilt-pop sticker font-spacemono absolute -left-5 top-10 -rotate-6 rounded-full bg-[#f2f2f0] px-4 py-2 text-xs font-bold text-[#0b0b0d]">
              DESIGNED BY YOU
            </div>
            <div className="tilt-pop-sm sticker font-spacemono absolute -right-4 bottom-16 rotate-3 rounded-full bg-[#0b0b0d] px-4 py-2 text-xs text-white">
              FREE AI DESIGN ✦
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-4xl sm:text-5xl">
            HOW IT <span className="text-stroke-thin">WORKS</span>
          </h2>
          <p className="font-spacemono hidden text-xs tracking-[0.25em] text-[#8f8f96] sm:block">
            3 STEPS. 5 MINUTES.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className={`card-3d lift rounded-3xl bg-[#101014] p-7 ${s.tilt}`}
            >
              <p className="font-display text-stroke-thin text-5xl">{s.n}</p>
              <h3 className="font-display mt-4 text-2xl">{s.title}</h3>
              <p className="mt-3 text-[#c9c9ce]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FRESH DROPS */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-4xl sm:text-5xl">
            FRESH <span className="text-stroke-thin">DROPS</span>
          </h2>
          <Link
            href="/gallery"
            className="text-sm text-[#c9c9ce] underline underline-offset-4 hover:text-white"
          >
            View all
          </Link>
        </div>
        <p className="mt-3 max-w-xl text-[#8f8f96]">
          Starter designs from the community vault. Tap any drop to remix it in
          the studio — make it yours.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3">
          {DESIGNS.slice(0, 3).map((d) => (
            <Link
              key={d.id}
              href={`/studio?design=${encodeURIComponent(d.src)}`}
              className="card-3d lift group overflow-hidden rounded-3xl bg-[#101014]"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={d.src}
                  alt={d.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition duration-300 group-hover:opacity-100">
                  <span className="btn-3d rounded-full px-5 py-2 text-sm font-bold">
                    Remix in studio →
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <p className="font-semibold">{d.name}</p>
                <p className="font-spacemono text-xs text-[#8f8f96]">{d.tag}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="relative overflow-hidden border-y border-white/10 bg-[#101014]">
        <div className="orb right-0 top-0 h-[300px] w-[300px] bg-white/[0.04]" />
        <div className="relative mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-4xl sm:text-5xl">
            HONEST <span className="text-stroke-thin">PRICING</span>
          </h2>
          <p className="mt-3 max-w-xl text-[#8f8f96]">
            AI design is free, forever. You pay for the garment + the print.
            Nothing else.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PRODUCTS.map((p, i) => (
              <div
                key={p.id}
                className={`card-3d lift relative rounded-3xl bg-[#0b0b0d] p-7 ${
                  i === 1 ? "-rotate-1 border-white/25" : i === 2 ? "rotate-1" : "-rotate-1"
                }`}
              >
                {p.id === "hoodie" && (
                  <span className="sticker font-spacemono absolute -top-3 right-6 rounded-full bg-[#f2f2f0] px-3 py-1 text-[11px] font-bold text-[#0b0b0d]">
                    HEAVYWEIGHT
                  </span>
                )}
                <p className="font-spacemono text-xs tracking-[0.25em] text-[#8f8f96]">
                  {p.id.toUpperCase()}
                </p>
                <h3 className="font-display mt-2 text-2xl">{p.name}</h3>
                <p className="mt-2 text-sm text-[#8f8f96]">{p.blurb}</p>
                <p className="font-display mt-6 text-4xl">{formatINR(p.price)}</p>
                <p className="font-spacemono mt-1 text-xs text-[#8f8f96]">
                  AI DESIGN INCLUDED — ₹0
                </p>
                <Link
                  href={`/studio?product=${p.id}`}
                  className="btn-3d mt-6 block rounded-xl py-3 text-center font-bold"
                >
                  Design yours
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="card-3d grid items-center gap-10 rounded-3xl bg-[#101014] p-8 sm:p-12 lg:grid-cols-[0.7fr_1.3fr]">
          <TiltCard max={8} className="mx-auto w-fit">
            <Image
              src="/logo-wordmark.png"
              alt="ASLI असली wordmark"
              width={420}
              height={420}
              className="sticker w-44 rounded-2xl sm:w-60"
            />
          </TiltCard>
          <div>
            <p className="font-spacemono text-xs tracking-[0.3em] text-[#8f8f96]">
              WHY ASLI
            </p>
            <p className="font-display mt-4 text-2xl leading-snug sm:text-3xl">
              Fast fashion prints a lakh copies of the same tee.{" "}
              <span className="text-stroke-thin">We print exactly one:</span>{" "}
              yours.
            </p>
            <p className="mt-4 max-w-2xl text-[#c9c9ce]">
              Every piece is designed by its wearer and printed on demand in
              India. No warehouses, no deadstock, no fake.{" "}
              <span className="font-devanagari text-white">
                {BRAND.taglineHindi}
              </span>
            </p>
          </div>
        </div>
      </section>

      <Ticker items={[...TICKER].reverse()} fast />

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="font-display text-4xl sm:text-5xl">
          QUEST<span className="text-stroke-thin">IONS</span>
        </h2>
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
      </section>

      {/* FINAL CTA */}
      <section className="grain relative overflow-hidden border-t border-white/10 bg-[#101014]">
        <div className="orb left-1/2 top-1/2 h-[380px] w-[620px] -translate-x-1/2 -translate-y-1/2 bg-white/[0.05]" />
        <div
          aria-hidden
          className="font-devanagari pointer-events-none absolute inset-0 flex items-center justify-center select-none text-[30vw] leading-none text-white/[0.03]"
        >
          असली
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center">
          <h2 className="font-display mx-auto max-w-3xl text-5xl leading-[0.95] sm:text-7xl">
            YOUR TEE
            <br />
            <span className="text-stroke">DOESN'T EXIST</span>
            <br />
            YET
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[#c9c9ce]">
            Design it in five minutes. Wear the only one on earth.
          </p>
          <Link
            href="/studio"
            className="btn-3d mt-10 inline-block rounded-2xl px-10 py-4 text-lg font-bold"
          >
            Start designing — it's free
          </Link>
        </div>
      </section>
    </div>
  );
}
