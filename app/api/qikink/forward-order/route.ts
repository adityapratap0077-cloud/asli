import { NextRequest, NextResponse } from "next/server";
import { forwardOrderToQikink } from "@/lib/qikink";

/**
 * POST /api/qikink/forward-order — { key, id }
 * Owner-only. Forwards one verified order to Qikink (or retries a
 * failed forward). Safe to call repeatedly: already-forwarded orders
 * are skipped, failures are logged on the order row.
 */
export async function POST(req: NextRequest) {
  let b: { key?: string; id?: string } = {};
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const expected = process.env.OWNER_DASHBOARD_KEY;
  if (!expected || b.key !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!b.id) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }
  const result = await forwardOrderToQikink(b.id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 502 }
    );
  }
  return NextResponse.json({
    ok: true,
    skipped: result.skipped,
    qikinkOrderId: result.qikinkOrderId,
  });
}
