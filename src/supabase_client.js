import { createClient } from '@supabase/supabase-js'

// 🔑 Replace these with your actual Supabase project keys
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ONUmk0SoEDQZLalm-0ek_w_Iku8Gnil'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)