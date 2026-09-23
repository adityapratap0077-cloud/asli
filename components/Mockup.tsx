"use client";

import { SHIRTS, shade } from "@/lib/shirts";
import type { ProductId, ShirtColor, TextPositionId } from "@/lib/catalog";

interface MockupProps {
  product: ProductId;
  color: ShirtColor;
  designSrc: string | null;
  text: string;
  textFont: string;
  textSize: number;
  textPos: TextPositionId;
  /** Bump to force the artwork <img> to reload (regenerate). */
  imgKey?: string | number;
  onDesignError?: () => void;
}

/**
 * Live garment mockup: hand-drawn SVG silhouette + AI artwork
 * blended like a real print + custom text layer.
 * Geometry comes from lib/shirts.ts so the PNG download matches.
 */
export default function Mockup({
  product,
  color,
  designSrc,
  text,
  textFont,
  textSize,
  textPos,
  imgKey,
  onDesignError,
}: MockupProps) {
  const spec = SHIRTS[product];
  const b = spec.designBox;
  const spot = spec.textSpots[textPos];
  const ink = color.dark ? "#f4f4f2" : "#161619";
  const lines = text.split("\n").slice(0, 3);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#101014]"
      style={{ aspectRatio: "400 / 480", containerType: "inline-size" }}
    >
      <svg
        viewBox="0 0 400 480"
        className="absolute inset-0 h-full w-full"
        aria-label={`${product} mockup in ${color.label}`}
      >
        <path
          d={spec.body}
          fill={color.hex}
          stroke="rgba(0,0,0,0.28)"
          strokeWidth={2}
        />
        {spec.details.map((det, i) =>
          det.kind === "string" || det.kind === "hem" ? (
            <path
              key={i}
              d={det.d}
              fill="none"
              stroke={shade(color.hex, 60)}
              strokeWidth={det.kind === "string" ? 3 : 2}
              strokeLinecap="round"
            />
          ) : (
            <path
              key={i}
              d={det.d}
              fill={shade(color.hex, det.kind === "hoodInner" ? 45 : 22)}
            />
          )
        )}
        {spec.collar && (
          <path d={spec.collar} fill={shade(color.hex, 22)} />
        )}
      </svg>

      {designSrc && (
        <img
          key={imgKey}
          src={designSrc}
          alt="AI generated garment artwork"
          onError={onDesignError}
          className="absolute"
          style={{
            left: `${(b.x / 400) * 100}%`,
            top: `${(b.y / 480) * 100}%`,
            width: `${(b.w / 400) * 100}%`,
            height: `${(b.h / 480) * 100}%`,
            objectFit: "contain",
            mixBlendMode: color.dark ? "screen" : "multiply",
            ...(color.dark ? { filter: "invert(1)" } : {}),
          }}
          draggable={false}
        />
      )}

      {text.trim() && (
        <div
          className="absolute text-center font-bold"
          style={{
            left: `${(spot.x / 400) * 100}%`,
            top: `${(spot.y / 480) * 100}%`,
            transform: "translate(-50%, -50%)",
            width: textPos === "left" ? "26%" : "80%",
            color: ink,
            fontFamily: textFont,
            fontSize: `${((textSize * spot.scale) / 400) * 100}cqw`,
            lineHeight: 1.15,
            whiteSpace: "pre-line",
          }}
        >
          {lines.join("\n")}
        </div>
      )}
    </div>
  );
}
