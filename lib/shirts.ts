import type { ProductId, TextPositionId } from "./catalog";

/**
 * Hand-drawn flat front-view garment templates.
 * All coordinates live in a 400 x 480 viewBox shared by the
 * on-screen SVG mockup and the canvas PNG download.
 */

export interface TextSpot {
  x: number;
  y: number;
  scale: number;
}

export interface ShirtSpec {
  id: ProductId;
  /** Main silhouette path. */
  body: string;
  /** Collar rib path (drawn slightly darker). */
  collar?: string;
  /** Extra detail paths: hood, pocket, drawstrings... */
  details: { d: string; kind: "hood" | "hoodInner" | "pocket" | "string" | "hem" }[];
  /** Chest print placement box in viewBox units. */
  designBox: { x: number; y: number; w: number; h: number };
  textSpots: Record<TextPositionId, TextSpot>;
}

const OVERSIZED: ShirtSpec = {
  id: "oversized",
  body: "M165 88 L112 104 L58 186 L104 202 L122 216 L114 402 L286 402 L278 216 L296 202 L342 186 L288 104 L235 88 Q200 112 165 88 Z",
  collar: "M165 88 Q200 112 235 88 L235 98 Q200 122 165 98 Z",
  details: [{ d: "M114 386 L286 386", kind: "hem" }],
  designBox: { x: 125, y: 150, w: 150, h: 150 },
  textSpots: {
    chest: { x: 200, y: 336, scale: 1 },
    upper: { x: 200, y: 132, scale: 0.85 },
    left: { x: 148, y: 196, scale: 0.5 },
  },
};

const REGULAR: ShirtSpec = {
  id: "regular",
  body: "M172 92 L128 106 L78 182 L120 196 L136 210 L130 396 L270 396 L264 210 L280 196 L322 182 L272 106 L228 92 Q200 112 172 92 Z",
  collar: "M172 92 Q200 112 228 92 L228 101 Q200 121 172 101 Z",
  details: [{ d: "M130 380 L270 380", kind: "hem" }],
  designBox: { x: 140, y: 155, w: 120, h: 120 },
  textSpots: {
    chest: { x: 200, y: 312, scale: 1 },
    upper: { x: 200, y: 136, scale: 0.85 },
    left: { x: 160, y: 190, scale: 0.5 },
  },
};

const HOODIE: ShirtSpec = {
  id: "hoodie",
  body: "M170 122 L126 136 L80 212 L118 224 L134 238 L128 400 L272 400 L266 238 L282 224 L320 212 L274 136 L230 122 Q200 134 170 122 Z",
  details: [
    { d: "M148 120 Q200 38 252 120 Q232 102 200 102 Q168 102 148 120 Z", kind: "hood" },
    { d: "M168 118 Q200 68 232 118 Q216 106 200 106 Q184 106 168 118 Z", kind: "hoodInner" },
    { d: "M188 132 L184 192", kind: "string" },
    { d: "M212 132 L216 192", kind: "string" },
    { d: "M150 322 L250 322 L258 400 L142 400 Z", kind: "pocket" },
  ],
  designBox: { x: 140, y: 205, w: 120, h: 110 },
  textSpots: {
    chest: { x: 200, y: 348, scale: 1 },
    upper: { x: 200, y: 168, scale: 0.7 },
    left: { x: 158, y: 230, scale: 0.5 },
  },
};

export const SHIRTS: Record<ProductId, ShirtSpec> = {
  oversized: OVERSIZED,
  regular: REGULAR,
  hoodie: HOODIE,
};

/** Darken a hex color by `amt` (0-255) for collars, pockets, shading. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) - amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) - amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) - amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
