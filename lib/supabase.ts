// Server-side only — never import this in client components
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gzbsshirjurwbmhobkvq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
