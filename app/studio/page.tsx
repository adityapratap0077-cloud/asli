"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Mockup from "@/components/Mockup";
import { downloadMockup } from "@/lib/download";
import {
  PRODUCTS,
  SIZES,
  STYLE_PRESETS,
  TEXT_FONTS,
  TEXT_POSITIONS,
  productById,
  productColors,
  colorById,
  presetById,
  formatINR,
  type ProductId,
  type SizeId,
  type TextPositionId,
} from "@/lib/catalog";

const PRODUCT_IDS: ProductId[] = ["oversized", "regular", "hoodie"];

const SURPRISE_PROMPTS = [
  "a tiger wearing a gold chain, desi hip-hop style",
  "मुखौटे written in dripping gothic letters with a cracked mask",
  "a retro anime samurai under a full moon, ink style",
  "minimal line-art of the Himalayas at sunrise",
  "a roaring lion made of smoke and embers",
  "Hindi typography poster saying असली, brutalist style",
  "a cosmic astronaut riding a Royal Enfield through stars",
  "dark streetwear skull with roses, gothic tattoo style",
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-spacemono flex items-center gap-3 text-xs tracking-[0.25em] text-[#8f8f96]">
      <span className="inline-block h-px w-6 bg-white/25" />
      {children}
    </p>
  );
}

function StudioInner() {
  const params = useSearchParams();
  const initialDesign = params.get("design");
  const initialPrompt = params.get("prompt") ?? "";
  const paramProduct = params.get("product") as ProductId | null;
  const initialProduct: ProductId = PRODUCT_IDS.includes(paramProduct as ProductId)
    ? (paramProduct as ProductId)
    : "oversized";

  const [productId, setProductId] = useState<ProductId>(initialProduct);
  const [colorId, setColorId] = useState(
    productColors(productById(initialProduct))[0].id
  );
  const [size, setSize] = useState<SizeId>("M");
  const [presetId, setPresetId] = useState("desi-hiphop");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [designSrc, setDesignSrc] = useState<string | null>(
    initialDesign ?? STYLE_PRESETS[0].sample
  );
  const [imgKey, setImgKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [moderationMsg, setModerationMsg] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [fontId, setFontId] = useState("display");
  const [textSize, setTextSize] = useState(34);
  const [textPos, setTextPos] = useState<TextPositionId>("chest");
  const [downloading, setDownloading] = useState(false);

  const product = productById(productId);
  const availableColors = productColors(product);
  const color = colorById(colorId);
  const preset = presetById(presetId);
  const font = TEXT_FONTS.find((f) => f.id === fontId) ?? TEXT_FONTS[0];

  const generate = useCallback(
    async (overridePrompt?: string) => {
      const seed = Math.floor(Math.random() * 999999);
      setStatus("loading");
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: overridePrompt ?? prompt,
            stylePreset: presetId,
            seed,
          }),
        });
        const data = await res.json();
        if (data.error) {
          setStatus("error");
          setModerationMsg(data.error);
          return;
        }
        setModerationMsg(null);
        if (!data.imageUrl) throw new Error("no image url");
        setDesignSrc(data.imageUrl);
        setImgKey(seed);
        setStatus("ready");
      } catch {
        setDesignSrc(preset.sample);
        setImgKey((k) => k + 1);
        setStatus("error");
      }
    },
    [prompt, presetId, preset]
  );

  const surprise = () => {
    const pick =
      SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    setPrompt(pick);
    generate(pick);
  };

  const pickPreset = (id: string) => {
    setPresetId(id);
    const p = presetById(id);
    setDesignSrc(p.sample);
    setImgKey((k) => k + 1);
    setStatus("idle");
  };

  const pickProduct = (id: ProductId) => {
    setProductId(id);
    const colors = productColors(productById(id));
    if (!colors.some((c) => c.id === colorId)) {
      setColorId(colors[0].id);
    }
  };

  const onDesignError = useCallback(() => {
    setDesignSrc((cur) => {
      const fallback = presetById(presetId).sample;
      return cur === fallback ? cur : fallback;
    });
  }, [presetId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadMockup({
        product: productId,
        color,
        designSrc,
        text,
        textFont: font.family,
        textSize,
        textPos,
      });
    } catch {
      /* user-facing: silently ignore, mockup is still on screen */
    } finally {
      setDownloading(false);
    }
  };

  const checkoutHref =
    `/checkout?product=${productId}&color=${colorId}&size=${size}` +
    `&design=${encodeURIComponent(designSrc ?? "")}` +
    `&text=${encodeURIComponent(text)}&font=${fontId}&pos=${textPos}`;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-28 pt-10 lg:pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">
            THE <span className="text-stroke-thin">STUDIO</span>
          </h1>
          <p className="mt-2 max-w-xl text-[#c9c9ce]">
            Pick a garment, generate the artwork with AI, add your own text.
            Generation is free and unlimited.
          </p>
        </div>
        <p className="font-spacemono hidden items-center gap-2 text-xs tracking-[0.25em] text-[#8f8f96] sm:flex">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-white" />
          LIVE PREVIEW
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[400px_1fr]">
        {/* CONTROLS */}
        <div className="space-y-8">
          {/* 01 — Garment */}
          <section>
            <SectionLabel>01 — Garment</SectionLabel>
            <div className="bed-3d mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#101014] p-2">
              {PRODUCTS.map((p) => (
                <button
                  key={p.id}
                  data-active={productId === p.id}
                  onClick={() => pickProduct(p.id)}
                  className="seg-btn rounded-xl px-2 py-3 text-center text-[#c9c9ce] hover:bg-white/5 hover:text-white"
                >
                  <p className="text-sm font-semibold leading-tight">{p.name}</p>
                  <p className="font-spacemono mt-1 text-xs opacity-70">
                    {formatINR(p.price)}
                  </p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#8f8f96]">{product.blurb}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="font-spacemono text-xs tracking-[0.25em] text-[#8f8f96]">
                SIZE
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-10 rounded-lg border px-2 py-1.5 font-spacemono text-xs transition ${
                      size === s
                        ? "border-white bg-white font-bold text-black shadow-[3px_3px_0_rgba(0,0,0,0.8)]"
                        : "border-white/15 bg-[#101014] text-[#c9c9ce] hover:border-white/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 02 — Colour */}
          <section>
            <SectionLabel>02 — Colour</SectionLabel>
            <div className="mt-3 flex items-center gap-3">
              {availableColors.map((c) => (
                <button
                  key={c.id}
                  title={c.label}
                  onClick={() => setColorId(c.id)}
                  className={`h-11 w-11 rounded-full border-2 transition ${
                    colorId === c.id
                      ? "scale-110 border-white shadow-[0_8px_20px_rgba(0,0,0,0.7)]"
                      : "border-white/20 hover:scale-105 hover:border-white/50"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <p className="ml-1 text-sm text-[#c9c9ce]">{color.label}</p>
            </div>
            {availableColors.length === 1 && (
              <p className="font-spacemono mt-2 text-[11px] tracking-wide text-[#8f8f96]">
                ONLY COLOUR THE PRINTER STOCKS FOR THIS GARMENT
              </p>
            )}
          </section>

          {/* 03 — AI artwork */}
          <section>
            <SectionLabel>03 — AI artwork</SectionLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              {STYLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickPreset(p.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    presetId === p.id
                      ? "border-white bg-[#f2f2f0] font-bold text-[#0b0b0d] shadow-[3px_3px_0_rgba(0,0,0,0.8)]"
                      : "border-white/15 text-[#c9c9ce] hover:border-white/40 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="relative mt-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder={`Describe your graphic… e.g. "a tiger wearing a gold chain, ${preset.label.toLowerCase()} style"`}
                className="bed-3d w-full rounded-2xl bg-[#101014] p-3 pr-12 text-sm text-white placeholder-[#5a5a61] focus:border-white/40 focus:outline-none"
              />
              <button
                onClick={surprise}
                title="Surprise me"
                className="sticker absolute right-2 top-2 rounded-lg bg-[#f2f2f0] px-2.5 py-1.5 text-sm transition hover:rotate-12"
              >
                🎲
              </button>
            </div>
            <button
              onClick={() => generate()}
              disabled={status === "loading"}
              className={`mt-3 w-full rounded-2xl py-4 font-bold transition disabled:opacity-80 ${
                status === "loading" ? "generating" : "btn-3d"
              }`}
            >
              {status === "loading" ? "Generating artwork…" : "✦ Generate artwork"}
            </button>
            {status === "ready" && (
              <p className="mt-2 text-xs text-[#8f8f96]">
                Fresh artwork generated — free via Pollinations. Not feeling
                it?{" "}
                <button onClick={() => generate()} className="underline underline-offset-2 hover:text-white">
                  Regenerate
                </button>
              </p>
            )}
            {status === "error" && (
              <p className="mt-2 text-xs text-[#8f8f96]">
                {moderationMsg ?? (
                  <>
                    The free generator was busy — showing the bundled sample
                    for this style.{" "}
                    <button onClick={() => generate()} className="underline underline-offset-2 hover:text-white">
                      Try again
                    </button>
                  </>
                )}
              </p>
            )}
          </section>

          {/* 04 — Text */}
          <section>
            <SectionLabel>04 — Your text</SectionLabel>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Add text — try "मुखौटे" with the Hindi font'
              className="bed-3d mt-3 w-full rounded-2xl bg-[#101014] p-3 text-sm text-white placeholder-[#5a5a61] focus:border-white/40 focus:outline-none"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <select
                value={fontId}
                onChange={(e) => setFontId(e.target.value)}
                className="bed-3d rounded-2xl bg-[#101014] p-3 text-sm text-white focus:border-white/40 focus:outline-none"
              >
                {TEXT_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <div className="bed-3d flex items-center gap-2 rounded-2xl bg-[#101014] px-3">
                <span className="font-spacemono text-xs text-[#8f8f96]">SIZE</span>
                <input
                  type="range"
                  min={16}
                  max={64}
                  value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  className="slider w-full"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TEXT_POSITIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTextPos(p.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    textPos === p.id
                      ? "border-white bg-white/10 font-semibold text-white shadow-[2px_2px_0_rgba(0,0,0,0.8)]"
                      : "border-white/15 text-[#8f8f96] hover:border-white/40 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* Desktop actions */}
          <div className="hidden gap-3 border-t border-white/10 pt-6 lg:flex">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 rounded-2xl border border-white/25 py-4 font-semibold transition hover:border-white/60 disabled:opacity-50"
            >
              {downloading ? "Rendering…" : "Download preview"}
            </button>
            <Link
              href={checkoutHref}
              className="btn-3d flex-1 rounded-2xl py-4 text-center font-bold"
            >
              Order — {formatINR(product.price)}
            </Link>
          </div>
        </div>

        {/* CANVAS — the print bed */}
        <div>
          <div className="lg:sticky lg:top-6">
            <div className="bed-3d bg-dots relative rounded-3xl bg-[#0d0d10] p-4 sm:p-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-spacemono flex items-center gap-2 text-xs tracking-[0.25em] text-[#8f8f96]">
                  <span className="live-dot inline-block h-2 w-2 rounded-full bg-white" />
                  PRINT BED — LIVE
                </p>
                <p className="sticker font-spacemono rounded-full bg-[#f2f2f0] px-3 py-1 text-xs font-bold text-[#0b0b0d]">
                  {product.name} · {color.label} · {size}
                </p>
              </div>
              <div className="card-3d mx-auto max-w-md overflow-hidden rounded-2xl">
                <Mockup
                  product={productId}
                  color={color}
                  designSrc={designSrc}
                  text={text}
                  textFont={font.family}
                  textSize={textSize}
                  textPos={textPos}
                  imgKey={imgKey}
                  onDesignError={onDesignError}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-[#8f8f96]">
                  Print-area preview — final placement set by the printer.
                </p>
                <p className="font-display text-2xl">{formatINR(product.price)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky order bar */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-white/10 p-4 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-2xl border border-white/25 px-5 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {downloading ? "…" : "Preview"}
          </button>
          <Link
            href={checkoutHref}
            className="btn-3d flex-1 rounded-2xl py-3 text-center font-bold"
          >
            Order — {formatINR(product.price)}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-5 py-20 text-[#8f8f96]">
          Loading studio…
        </div>
      }
    >
      <StudioInner />
    </Suspense>
  );
}
