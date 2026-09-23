import { NextRequest, NextResponse } from "next/server";
import { presetById } from "@/lib/catalog";

const PRINT_SUFFIX =
  "black ink on a plain solid white background, flat t-shirt graphic design, high contrast, no photograph, no mockup, no frame";

/**
 * Brand moderation: prompts matching any of these never reach the image
 * model. Every order is also reviewed by a human before printing — this
 * is the first gate, not the only one.
 */
const BLOCKED_PATTERNS: RegExp[] = [
  // sexual content involving minors
  /\b(child|kid|teen|minor|schoolgirl|schoolboy|loli|shota)\b/i,
  // hate / extremist
  /\b(nazi|hitler|kkk|white\s*power|ethnic\s*cleansing)\b/i,
  // sexual violence
  /\b(rape|molest)\b/i,
  // instructions for real-world harm
  /\b(how to (make|build).{0,20}(bomb|gun|weapon|poison))\b/i,
];

function isBlocked(prompt: string): boolean {
  return BLOCKED_PATTERNS.some((re) => re.test(prompt));
}

/**
 * POST /api/generate  { prompt, stylePreset, seed }
 *
 * Default: Pollinations.ai — free, keyless. Returns a direct image URL the
 * client loads; on any client-side load failure the studio falls back to
 * the bundled sample artwork for the requested style.
 *
 * Optional upgrade: set FAL_KEY to route through fal.ai (stub below).
 * Never expose keys client-side — all generation stays server-side.
 */
export async function POST(req: NextRequest) {
  let body: { prompt?: string; stylePreset?: string; seed?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const preset = presetById(String(body.stylePreset ?? "desi-hiphop"));
  const seed =
    Number.isFinite(Number(body.seed)) && Number(body.seed) >= 0
      ? Number(body.seed)
      : Math.floor(Math.random() * 999999);
  const userPrompt = String(body.prompt ?? "").trim();
  if (userPrompt && isBlocked(userPrompt)) {
    return NextResponse.json(
      {
        error:
          "That prompt can't be printed — it trips our content rules (no hate, no sexual content involving minors, no real-world harm). Try a different idea.",
      },
      { status: 400 }
    );
  }
  const subject = userPrompt || `${preset.label} themed artwork`;
  const fullPrompt = `${subject}, ${preset.enhancer}, ${PRINT_SUFFIX}`;

  // Optional paid upgrade path (stub). When FAL_KEY is set we try fal.ai
  // first and fall through to the free provider on any failure.
  if (process.env.FAL_KEY) {
    try {
      const falUrl = await generateWithFal(fullPrompt);
      if (falUrl) {
        return NextResponse.json({
          imageUrl: falUrl,
          mode: "fal",
          style: preset.id,
          fallback: preset.sample,
        });
      }
    } catch {
      /* fall through to free provider */
    }
  }

  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}` +
    `?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;

  return NextResponse.json({
    imageUrl: url,
    mode: "pollinations",
    style: preset.id,
    fallback: preset.sample,
    seed,
  });
}

/**
 * STUB — wire fal.ai txt2img here (e.g. the fal-ai/flux model family)
 * when FAL_KEY is configured. Return the resulting image URL or null.
 * Kept minimal on purpose: the free Pollinations path stays the default.
 */
async function generateWithFal(prompt: string): Promise<string | null> {
  void prompt;
  return null;
}
