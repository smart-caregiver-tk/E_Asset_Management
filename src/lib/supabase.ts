import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use any to prevent TS type resolution issues with dynamic table queries
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
