import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || ''

console.log('--- Supabase Client Diagnostics ---')
console.log('Supabase URL:', supabaseUrl || '(MISSING/EMPTY)')
console.log('Supabase Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}... (Length: ${supabaseAnonKey.length})` : '(MISSING/EMPTY)')
console.log('-----------------------------------')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Supabase environment variables are missing! Make sure the .env file exists in the project root and Vite has been restarted.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
