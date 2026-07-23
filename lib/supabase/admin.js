import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * SERVER-ONLY. Uses the service role key, which bypasses RLS entirely.
 * Only import this inside Server Actions / Route Handlers — never in a
 * Client Component, and never send this key to the browser.
 *
 * Used for things an ordinary user should never be able to do directly,
 * like the Chair creating a new account (no public sign-up in this system).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}