import { SHIRTS, shade } from "./shirts";
import type { ProductId, ShirtColor, TextPositionId } from "./catalog";

export interface MockupState {
  product: ProductId;
  color: ShirtColor;
  designSrc: string | null;
  text: string;
  textFont: string;
  textSize: number; // in viewBox units
  textPos: TextPositionId;
}

const VB_W = 400;
const VB_H = 480;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("could not load " + src));
    img.src = src;
  });
}

/** Invert an image via a temp canvas (used for dark garments). */
function invertImage(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

/**
 * Rasterize the current mockup to a high-res PNG and trigger a download.
 * Uses the same ShirtSpec geometry as the on-screen SVG so the
 * preview and the download always match.
 */
export async function downloadMockup(state: MockupState): Promise<void> {
  const spec = SHIRTS[state.product];
  const SCALE = 3;
  const canvas = document.createElement("canvas");
  canvas.width = VB_W * SCALE;
  canvas.height = VB_H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  // Garment silhouette
  ctx.fillStyle = state.color.hex;
  ctx.fill(new Path2D(spec.body));
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 2;
  ctx.stroke(new Path2D(spec.body));

  // Details: collar / hood / pocket slightly darker, strings & hems as strokes
  for (const det of spec.details) {
    const p = new Path2D(det.d);
    if (det.kind === "string" || det.kind === "hem") {
      ctx.strokeStyle = shade(state.color.hex, 60);
      ctx.lineWidth = det.kind === "string" ? 3 : 2;
      ctx.stroke(p);
    } else {
      ctx.fillStyle = shade(state.color.hex, det.kind === "hoodInner" ? 45 : 22);
      ctx.fill(p);
    }
  }
  if (spec.collar) {
    ctx.fillStyle = shade(state.color.hex, 22);
    ctx.fill(new Path2D(spec.collar));
  }

  // AI design artwork, blended like a real print
  if (state.designSrc) {
    const img = await loadImage(state.designSrc);
    const b = spec.designBox;
    ctx.save();
    if (state.color.dark) {
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(invertImage(img), b.x, b.y, b.w, b.h);
    } else {
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(img, b.x, b.y, b.w, b.h);
    }
    ctx.restore();
  }

  // Custom text layer
  const label = state.text.trim();
  if (label) {
    const spot = spec.textSpots[state.textPos];
    ctx.fillStyle = state.color.dark ? "#f4f4f2" : "#161619";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = state.textSize * spot.scale;
    ctx.font = `${size}px ${state.textFont}`;
    const lines = label.split("\n").slice(0, 3);
    const lineH = size * 1.15;
    const startY = spot.y - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => ctx.fillText(line, spot.x, startY + i * lineH));
  }

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/png")
  );
  if (!blob) throw new Error("render failed");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `streetwear-${state.product}-${state.color.id}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
