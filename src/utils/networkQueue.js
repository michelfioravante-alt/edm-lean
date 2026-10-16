const STORAGE_KEY = 'edm_lean_action_queue_v1';
const MAX_ITENS = 40;

function lerFila() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const lista = raw ? JSON.parse(raw) : [];
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

function gravarFila(lista) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lista.slice(-MAX_ITENS)));
    } catch {
        /* quota / private mode */
    }
}

export function estaOnline() {
    return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

export function enfileirarAcao(acao) {
    const fila = lerFila();
    const item = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        ...acao,
    };
    fila.push(item);
    gravarFila(fila);
    return item;
}

export function tamanhoFila() {
    return lerFila().length;
}

export function limparFila() {
    gravarFila([]);
}

/**
 * Processa a fila FIFO. `executar(item)` deve lançar se falhar.
 * Itens ok saem; o primeiro que falhar interrompe (mantém o resto).
 */
export async function drenarFila(executar) {
    const fila = lerFila();
    if (!fila.length) return { ok: 0, restante: 0 };

    const restante = [];
    let ok = 0;
    let travou = false;

    for (const item of fila) {
        if (travou) {
            restante.push(item);
            continue;
        }
        try {
            await executar(item);
            ok += 1;
        } catch (err) {
            restante.push(item);
            travou = true;
            gravarFila(restante);
            throw err;
        }
    }

    gravarFila(restante);
    return { ok, restante: restante.length };
}

export function ouvirOnline(onOnline, onOffline) {
    const up = () => onOnline?.();
    const down = () => onOffline?.();
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
        window.removeEventListener('online', up);
        window.removeEventListener('offline', down);
    };
}
