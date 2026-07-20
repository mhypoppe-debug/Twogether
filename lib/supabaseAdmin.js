import { createClient } from "@supabase/supabase-js";

// Server-side only client, using the SERVICE ROLE key (never expose this key to the browser).
// This is only ever imported from files under app/api/**, which run on the server.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. " +
      "Set these in your Vercel project settings (or .env.local for local dev)."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
