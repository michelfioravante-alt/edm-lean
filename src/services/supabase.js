import { createClient } from '@supabase/supabase-js';
import { isLocalMode } from '../local/mode';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!isLocalMode() && (!supabaseUrl || !supabaseAnonKey)) {
    console.error('ERRO: Variáveis de ambiente do Supabase não encontradas. Use VITE_LOCAL_MODE=true ou preencha o .env');
}

export const supabase = isLocalMode()
    ? null
    : createClient(supabaseUrl, supabaseAnonKey, {
        realtime: { heartbeatIntervalMs: 10000 },
        auth: { detectSessionInUrl: true, persistSession: true },
    });
