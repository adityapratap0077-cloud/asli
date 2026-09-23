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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-spacemono text-xs tracking-[0.25em] text-[#8f8f96]">
      {children}
    </p>
  );
}

function StudioInner() {
  const params = useSearchParams();
  const initialDesign = params.get("design");

  const [productId, setProductId] = useState<ProductId>("oversized");
  const [colorId, setColorId] = useState("white");
  const [size, setSize] = useState<SizeId>("M");
  const [presetId, setPresetId] = useState("desi-hiphop");
  const [prompt, setPrompt] = useState("");
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

  const pickProduct = (id: ProductId) => {
    setProductId(id);
    const colors = productColors(productById(id));
    if (!colors.some((c) => c.id === colorId)) {
      setColorId(colors[0].id);
    }
  };
  const preset = presetById(presetId);
  const font = TEXT_FONTS.find((f) => f.id === fontId) ?? TEXT_FONTS[0];

  const generate = useCallback(async () => {
    const seed = Math.floor(Math.random() * 999999);
    setStatus("loading");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, stylePreset: presetId, seed }),
      });
      const data = await res.json();
      if (data.error) {
        // Moderation block — show the reason, keep the current artwork.
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
      // Free provider hiccup — fall back to the bundled sample artwork.
      setDesignSrc(preset.sample);
      setImgKey((k) => k + 1);
      setStatus("error");
    }
  }, [prompt, presetId, preset]);

  const pickPreset = (id: string) => {
    setPresetId(id);
    const p = presetById(id);
    setDesignSrc(p.sample);
    setImgKey((k) => k + 1);
    setStatus("idle");
  };

  const onDesignError = useCallback(() => {
    // Remote artwork failed to load (offline / blocked) — bundled sample.
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
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-3xl sm:text-4xl">THE STUDIO</h1>
      <p className="mt-2 max-w-xl text-[#c9c9ce]">
        Pick a garment, generate the artwork with AI, add your own text, and
        preview it live. Generation is free and unlimited.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[400px_1fr]">
        {/* CONTROLS */}
        <div className="space-y-8">
          <div>
            <SectionLabel>01 — Garment</SectionLabel>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {PRODUCTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickProduct(p.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    productId === p.id
                      ? "border-white bg-white/10"
                      : "border-white/10 bg-[#101014] hover:border-white/30"
                  }`}
                >
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="font-spacemono mt-1 text-xs text-[#8f8f96]">
                    {formatINR(p.price)}
                  </p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#8f8f96]">{product.blurb}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="font-spacemono text-xs tracking-[0.25em] text-[#8f8f96]">
                SIZE
              </span>
              <div className="flex gap-1.5">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-10 rounded-lg border px-2 py-1.5 font-spacemono text-xs transition ${
                      size === s
                        ? "border-white bg-white text-black"
                        : "border-white/15 bg-[#101014] text-[#c9c9ce] hover:border-white/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <SectionLabel>02 — Colour</SectionLabel>
            <div className="mt-3 flex gap-3">
              {availableColors.map((c) => (
                <button
                  key={c.id}
                  title={c.label}
                  onClick={() => setColorId(c.id)}
                  className={`h-10 w-10 rounded-full border transition ${
                    colorId === c.id
                      ? "border-white ring-2 ring-white/40 ring-offset-2 ring-offset-[#0b0b0d]"
                      : "border-white/20 hover:border-white/50"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-[#8f8f96]">{color.label}</p>
          </div>

          <div>
            <SectionLabel>03 — AI artwork</SectionLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              {STYLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickPreset(p.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    presetId === p.id
                      ? "border-white bg-[#f2f2f0] font-semibold text-[#0b0b0d]"
                      : "border-white/15 text-[#c9c9ce] hover:border-white/40 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder={`Describe your graphic… e.g. "a tiger wearing a gold chain, ${preset.label.toLowerCase()} style"`}
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#101014] p-3 text-sm text-white placeholder-[#5a5a61] focus:border-white/40 focus:outline-none"
            />
            <button
              onClick={generate}
              disabled={status === "loading"}
              className="mt-3 w-full rounded-full bg-[#f2f2f0] py-3.5 font-semibold text-[#0b0b0d] transition hover:bg-white disabled:opacity-50"
            >
              {status === "loading" ? "Generating…" : "Generate artwork"}
            </button>
            {status === "ready" && (
              <p className="mt-2 text-xs text-[#8f8f96]">
                Fresh artwork generated — free via Pollinations. Not feeling
                it?{" "}
                <button onClick={generate} className="underline underline-offset-2 hover:text-white">
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
                    <button onClick={generate} className="underline underline-offset-2 hover:text-white">
                      Try again
                    </button>
                  </>
                )}
              </p>
            )}
          </div>

          <div>
            <SectionLabel>04 — Your text</SectionLabel>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Add text — try "मुखौटे" with the Hindi font'
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#101014] p-3 text-sm text-white placeholder-[#5a5a61] focus:border-white/40 focus:outline-none"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <select
                value={fontId}
                onChange={(e) => setFontId(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#101014] p-3 text-sm text-white focus:border-white/40 focus:outline-none"
              >
                {TEXT_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#101014] px-3">
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
                      ? "border-white bg-white/10 text-white"
                      : "border-white/15 text-[#8f8f96] hover:border-white/40 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 border-t border-white/10 pt-6">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 rounded-full border border-white/25 py-3.5 font-semibold hover:border-white/60 disabled:opacity-50"
            >
              {downloading ? "Rendering…" : "Download preview"}
            </button>
            <Link
              href={checkoutHref}
              className="flex-1 rounded-full bg-[#f2f2f0] py-3.5 text-center font-semibold text-[#0b0b0d] hover:bg-white"
            >
              Order — {formatINR(product.price)}
            </Link>
          </div>
        </div>

        {/* MOCKUP */}
        <div>
          <div className="lg:sticky lg:top-6">
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
            <p className="font-spacemono mt-4 text-center text-xs text-[#8f8f96]">
              {product.name} — {color.label} — live preview
            </p>
          </div>
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
