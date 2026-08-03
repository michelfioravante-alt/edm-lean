/** Modo local: sem Supabase — dados em localStorage para demonstração do fluxo. */
export function isLocalMode() {
    // 1. Forçado via variável de ambiente (ex: dev sem Supabase)
    if (import.meta.env.VITE_LOCAL_MODE === 'true') return true;

    // 2. Credenciais Supabase ausentes ou placeholder
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('SEU_PROJETO')) return true;

    // 3. Usuário entrou no Modo Demonstração (mesmo com Supabase configurado no Vercel)
    //    enterLocalStudyMode() salva 'cnc-lean-session' no localStorage
    try {
        const session = localStorage.getItem('cnc-lean-session');
        if (session === 'admin' || session === 'operador' || session === 'programador') return true;
    } catch (_) {
        // localStorage pode estar bloqueado (ex: iframe privado)
    }

    return false;
}
