import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || SUPABASE_URL.includes('your_project_id')) {
  // Helpful console message for common misconfiguration (placeholder URL)
  // Replace with your actual Supabase project URL in the .env file, e.g.
  // VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
  console.error('VITE_SUPABASE_URL is missing or uses a placeholder. Check your .env file.')
}

if (!SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_ANON_KEY is missing. Check your .env file.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)