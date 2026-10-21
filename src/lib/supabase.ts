
import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string
if (!url || !key) console.warn('⚠️ Supabase env mancanti - aggiungi VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY su Bolt')
export const supabase = url && key ? createClient(url, key) : null as any
