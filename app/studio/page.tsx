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

function ControlSection({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/10 py-8">
      <p className="micro mb-6">
        <span className="text-white">{index}</span>
        <span className="mx-3 text-white/25">/</span>
        {title}
      </p>
      {children}
    </section>
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
    <div className="mx-auto max-w-7xl px-5 pb-28 pt-12 lg:pb-16">
      <div className="flex items-baseline justify-between border-b border-white/10 pb-5">
        <h1 className="font-display text-4xl uppercase tracking-wide sm:text-5xl">
          Studio
        </h1>
        <p className="micro flex items-center gap-2">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
          Live preview
        </p>
      </div>
      <p className="mt-4 max-w-xl text-sm text-[#8f8f96]">
        Pick a garment, generate the artwork with AI, add your own text.
        Generation is free and unlimited.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[380px_1fr] lg:gap-16">
        {/* CONTROLS */}
        <div>
          <ControlSection index="01" title="Garment">
            <div>
              {PRODUCTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickProduct(p.id)}
                  className={`flex w-full items-center justify-between border-b border-white/10 py-4 text-left transition ${
                    productId === p.id
                      ? "border-l-2 border-l-white pl-4 text-white"
                      : "pl-4 text-[#8f8f96] hover:text-white"
                  }`}
                >
                  <span>
                    <span className="block font-medium">{p.name}</span>
                    <span className="mt-0.5 block text-xs">{p.blurb}</span>
                  </span>
                  <span className="font-display text-lg">
                    {formatINR(p.price)}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <span className="micro">Size</span>
              <div className="flex gap-1.5">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`h-9 w-9 text-xs transition ${
                      size === s
                        ? "bg-white font-semibold text-black"
                        : "border border-white/15 text-[#8f8f96] hover:border-white/50 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </ControlSection>

          <ControlSection index="02" title="Colour">
            <div className="flex items-center gap-4">
              {availableColors.map((c) => (
                <button
                  key={c.id}
                  title={c.label}
                  onClick={() => setColorId(c.id)}
                  className={`h-10 w-10 rounded-full transition ${
                    colorId === c.id
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#0b0b0d]"
                      : "ring-1 ring-white/20 hover:ring-white/50"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <p className="text-sm text-[#c9c9ce]">{color.label}</p>
            </div>
            {availableColors.length === 1 && (
              <p className="micro mt-4 normal-case tracking-normal">
                Only colour the printer stocks for this garment.
              </p>
            )}
          </ControlSection>

          <ControlSection index="03" title="AI artwork">
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickPreset(p.id)}
                  className={`border px-4 py-2 text-sm transition ${
                    presetId === p.id
                      ? "border-white bg-white font-medium text-black"
                      : "border-white/15 text-[#8f8f96] hover:border-white/50 hover:text-white"
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
              placeholder="Describe your graphic…"
              className="field mt-4 w-full p-3 text-sm"
            />
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={surprise}
                className="micro text-white underline underline-offset-4 hover:text-[#c9c9ce]"
              >
                Surprise me
              </button>
            </div>
            <button
              onClick={() => generate()}
              disabled={status === "loading"}
              className={`mt-4 w-full py-4 text-sm font-semibold uppercase tracking-widest ${
                status === "loading" ? "generating" : "btn-solid"
              }`}
            >
              {status === "loading" ? "Generating…" : "Generate artwork"}
            </button>
            {status === "ready" && (
              <p className="mt-3 text-xs text-[#8f8f96]">
                Fresh artwork generated.{" "}
                <button
                  onClick={() => generate()}
                  className="text-white underline underline-offset-2"
                >
                  Regenerate
                </button>
              </p>
            )}
            {status === "error" && (
              <p className="mt-3 text-xs text-[#8f8f96]">
                {moderationMsg ?? (
                  <>
                    The free generator was busy — showing the bundled sample
                    for this style.{" "}
                    <button
                      onClick={() => generate()}
                      className="text-white underline underline-offset-2"
                    >
                      Try again
                    </button>
                  </>
                )}
              </p>
            )}
          </ControlSection>

          <ControlSection index="04" title="Your text">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Add text — try "मुखौटे"'
              className="field w-full p-3 text-sm"
            />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <select
                value={fontId}
                onChange={(e) => setFontId(e.target.value)}
                className="field bg-[#0b0b0d] p-3 text-sm"
              >
                {TEXT_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-3">
                <span className="micro">Size</span>
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
            <div className="mt-4 flex flex-wrap gap-2">
              {TEXT_POSITIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTextPos(p.id)}
                  className={`border px-3 py-1.5 text-xs transition ${
                    textPos === p.id
                      ? "border-white bg-white/10 text-white"
                      : "border-white/15 text-[#8f8f96] hover:border-white/50 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </ControlSection>

          {/* Desktop actions */}
          <div className="hidden gap-3 border-t border-white/10 pt-8 lg:flex">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-ghost flex-1 py-4 text-sm font-semibold uppercase tracking-widest"
            >
              {downloading ? "Rendering…" : "Download preview"}
            </button>
            <Link
              href={checkoutHref}
              className="btn-solid flex-1 py-4 text-center text-sm font-semibold uppercase tracking-widest"
            >
              Order — {formatINR(product.price)}
            </Link>
          </div>
        </div>

        {/* PREVIEW */}
        <div>
          <div className="lg:sticky lg:top-6">
            <div className="border border-white/10 bg-[#0e0e10] p-6 sm:p-10">
              <div className="flex items-center justify-between">
                <p className="micro">Preview</p>
                <p className="micro text-white">
                  {product.name} · {color.label} · {size}
                </p>
              </div>
              <div className="mx-auto mt-6 max-w-md">
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
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <p className="micro normal-case tracking-normal">
                  Print-area preview — final placement set by the printer.
                </p>
                <p className="font-display text-3xl">
                  {formatINR(product.price)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky order bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0b0d]/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3 p-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-ghost px-5 py-3 text-sm font-semibold uppercase tracking-widest"
          >
            {downloading ? "…" : "Preview"}
          </button>
          <Link
            href={checkoutHref}
            className="btn-solid flex-1 py-3 text-center text-sm font-semibold uppercase tracking-widest"
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
