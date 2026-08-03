/** Modo local: sem Supabase — dados em localStorage para estudar o fluxo CNC. */
export function isLocalMode() {
    if (import.meta.env.VITE_LOCAL_MODE === 'true') return true;
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return !url || !key || url.includes('SEU_PROJETO');
}
