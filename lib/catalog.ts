export type ProductId = "oversized" | "regular" | "hoodie";

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type SizeId = (typeof SIZES)[number];

export function isValidSize(s: string): s is SizeId {
  return (SIZES as readonly string[]).includes(s);
}

export interface Product {
  id: ProductId;
  name: string;
  blurb: string;
  price: number;
}

export const PRODUCTS: Product[] = [
  {
    id: "oversized",
    name: "Oversized Tee",
    blurb: "Drop shoulders, boxy fit. The streetwear staple.",
    price: 949,
  },
  {
    id: "regular",
    name: "Regular Tee",
    blurb: "Classic everyday fit, clean silhouette.",
    price: 949,
  },
  {
    id: "hoodie",
    name: "Hoodie",
    blurb: "Heavyweight fleece, kangaroo pocket.",
    price: 1299,
  },
];

export interface ShirtColor {
  id: string;
  label: string;
  hex: string;
  dark: boolean;
}

export const COLORS: ShirtColor[] = [
  { id: "black", label: "Black", hex: "#17171a", dark: true },
  { id: "white", label: "White", hex: "#f3f3f1", dark: false },
  { id: "cream", label: "Cream", hex: "#e7dbc2", dark: false },
  { id: "navy", label: "Navy", hex: "#1e2b4f", dark: true },
];

export interface StylePreset {
  id: string;
  label: string;
  /** Appended to the user's prompt before sending to the image model. */
  enhancer: string;
  /** Bundled sample artwork used as the instant preview / fallback. */
  sample: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "desi-hiphop",
    label: "Desi Hip-Hop",
    enhancer:
      "desi hip-hop streetwear graphic, bold distressed print style, aggressive energy",
    sample: "/designs/desi-hiphop.webp",
  },
  {
    id: "anime-ink",
    label: "Anime Ink",
    enhancer:
      "japanese sumi-e ink wash illustration, bold black brush strokes, streetwear graphic",
    sample: "/designs/anime-ink.webp",
  },
  {
    id: "minimal-line",
    label: "Minimal Line",
    enhancer:
      "minimalist single continuous thin line art, elegant, lots of empty space",
    sample: "/designs/minimal-line.webp",
  },
  {
    id: "hindi-type",
    label: "Hindi Typography",
    enhancer:
      "Hindi Devanagari typographic poster design, bold stylized lettering",
    sample: "/designs/hindi-type.webp",
  },
  {
    id: "dark-gothic",
    label: "Dark Gothic",
    enhancer:
      "dark gothic engraving illustration, ornate details, heavy black ink",
    sample: "/designs/dark-gothic.webp",
  },
];

export interface DesignItem {
  id: string;
  name: string;
  src: string;
  tag: string;
}

export const DESIGNS: DesignItem[] = [
  { id: "desi-hiphop", name: "Mukhaute", src: "/designs/desi-hiphop.webp", tag: "Desi Hip-Hop" },
  { id: "anime-ink", name: "Ink Lion", src: "/designs/anime-ink.webp", tag: "Anime Ink" },
  { id: "minimal-line", name: "One Line", src: "/designs/minimal-line.webp", tag: "Minimal Line" },
  { id: "hindi-type", name: "Apni Kahani", src: "/designs/hindi-type.webp", tag: "Hindi Typography" },
  { id: "dark-gothic", name: "Thorn Skull", src: "/designs/dark-gothic.webp", tag: "Dark Gothic" },
  { id: "bonus-sun", name: "Rising Sun", src: "/designs/bonus-sun.webp", tag: "Brutalist" },
];

export interface TextFont {
  id: string;
  label: string;
  family: string;
}

export const TEXT_FONTS: TextFont[] = [
  { id: "display", label: "Display Bold", family: "'Archivo Black', sans-serif" },
  { id: "mono", label: "Mono", family: "'Space Mono', monospace" },
  {
    id: "devanagari",
    label: "Hindi (Devanagari)",
    family: "'Tiro Devanagari Hindi', serif",
  },
];

export type TextPositionId = "chest" | "upper" | "left";

export const TEXT_POSITIONS: { id: TextPositionId; label: string }[] = [
  { id: "chest", label: "Chest center" },
  { id: "upper", label: "Upper chest" },
  { id: "left", label: "Left chest (small)" },
];

export function productById(id: string): Product {
  return PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];
}

export function colorById(id: string): ShirtColor {
  return COLORS.find((c) => c.id === id) ?? COLORS[0];
}

export function presetById(id: string): StylePreset {
  return STYLE_PRESETS.find((p) => p.id === id) ?? STYLE_PRESETS[0];
}

export function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}
