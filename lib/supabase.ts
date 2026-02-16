import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side only — service role bypasses RLS for read-only queries
export const supabase = createClient(supabaseUrl, serviceKey);
