import { createClient } from '@supabase/supabase-js'

// GANTI DENGAN URL & KEY DARI DASHBOARD SUPABASE ANDA
const supabaseUrl = 'https://yyjqsmlsswjvnqdnmppo.supabase.co'
const supabaseAnonKey = 'sb_publishable_IZpXAmekpupR6uDBUz-_Rg_SMnpvECI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
