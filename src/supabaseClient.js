import { createClient } from '@supabase/supabase-js'

// GANTI DENGAN URL & KEY DARI DASHBOARD SUPABASE ANDA
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yyjqsmlsswjvnqdnmppo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IZpXAmekpupR6uDBUz-_Rg_SMnpvECI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
