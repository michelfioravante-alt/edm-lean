const KEY = 'edm_auth_throttle_v1';

function ler() {
    try {
        return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {};
    } catch {
        return {};
    }
}

function gravar(map) {
    try {
        sessionStorage.setItem(KEY, JSON.stringify(map));
    } catch {
        /* ignore */
    }
}

/** Bloqueia rajadas no browser (o freio forte continua no Supabase). */
export function checarThrottleAuth(acao, { minIntervalMs = 1200, maxPorJanela = 8, janelaMs = 5 * 60 * 1000 } = {}) {
    const agora = Date.now();
    const map = ler();
    const slot = map[acao] || { last: 0, hits: [] };
    const hits = (slot.hits || []).filter((t) => agora - t < janelaMs);

    if (slot.last && agora - slot.last < minIntervalMs) {
        return { ok: false, error: 'Aguarde um instante antes de tentar de novo.' };
    }
    if (hits.length >= maxPorJanela) {
        return { ok: false, error: 'Muitas tentativas neste navegador. Espere alguns minutos.' };
    }

    hits.push(agora);
    map[acao] = { last: agora, hits };
    gravar(map);
    return { ok: true };
}

export function mensagemErroAuth(err) {
    const raw = (typeof err === 'string' ? err : err?.message || err?.error_description || '') || '';
    const m = String(raw);
    if (/429|too many requests|rate limit|muitas tentativas/i.test(m)) {
        return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
    }
    if (/Email not confirmed/i.test(m)) {
        return 'E-mail não confirmado. Verifique a caixa de entrada.';
    }
    if (/Invalid login credentials/i.test(m)) {
        return 'E-mail ou senha incorretos.';
    }
    if (/weak password|Password should/i.test(m)) {
        return 'Senha fraca. Use no mínimo 8 caracteres, misturando letras e números.';
    }
    return m || 'Falha na autenticação.';
}

export function senhaAceitavel(password) {
    if (!password || password.length < 8) {
        return { ok: false, error: 'A senha deve ter no mínimo 8 caracteres.' };
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return { ok: false, error: 'Use letras e pelo menos um número na senha.' };
    }
    return { ok: true };
}
