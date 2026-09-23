import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase access for order storage.
 * Requires env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * All reads/writes go through the /api/orders route — the anon key is
 * never enough on its own, and RLS stays locked down.
 */
export function isOrdersBackendConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!isOrdersBackendConfigured()) {
    throw new Error("Orders backend not configured");
  }
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return client;
}

export type OrderStatus =
  | "payment_pending"
  | "verified"
  | "in_print"
  | "shipped"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "payment_pending",
  "verified",
  "in_print",
  "shipped",
  "cancelled",
];

export function isValidStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as string[]).includes(s);
}
