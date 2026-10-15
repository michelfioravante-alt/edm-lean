import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERRO: Variáveis de ambiente do Supabase não encontradas. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: { heartbeatIntervalMs: 10000 },
    auth: { detectSessionInUrl: true, persistSession: true },
});
