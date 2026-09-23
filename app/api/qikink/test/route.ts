import { NextRequest, NextResponse } from "next/server";
import { testQikinkConnection } from "@/lib/qikink";

/**
 * GET /api/qikink/test?key=OWNER_DASHBOARD_KEY — owner-only.
 * Validates Qikink API credentials by requesting an access token.
 * Places no order and changes nothing.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.OWNER_DASHBOARD_KEY;
  const got =
    req.nextUrl.searchParams.get("key") ?? req.headers.get("x-owner-key") ?? "";
  if (!expected || got !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await testQikinkConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
