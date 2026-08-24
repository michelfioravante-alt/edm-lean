const DEMO_ROLES = new Set(['admin', 'operador', 'programador', 'programmer']);

export function isDemoSession() {
    try {
        return DEMO_ROLES.has(localStorage.getItem('cnc-lean-session') || '');
    } catch {
        return false;
    }
}

/** Sem Supabase, ou sessão de demonstração (fábrica de exemplo). */
export function isLocalMode() {
    if (import.meta.env.VITE_LOCAL_MODE === 'true') return true;

    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('SEU_PROJETO')) return true;

    return isDemoSession();
}
