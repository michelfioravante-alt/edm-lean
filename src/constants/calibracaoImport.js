export const CALIBRACAO_IMPORT_DEFAULT = {
    /** Fração da largura da página onde o parser lê o bloco de título (ZW3D). */
    limiteColunaEsquerda: 0.42,
    /** Padrão opcional para reconhecer código de peça (regex). Deixe vazio = padrão interno. */
    regexCodigoPeca: '',
};

export function carregarCalibracaoImport(stored) {
    const base = { ...CALIBRACAO_IMPORT_DEFAULT };
    if (!stored || typeof stored !== 'object') return base;
    const lim = Number(stored.limiteColunaEsquerda);
    if (Number.isFinite(lim) && lim >= 0.25 && lim <= 0.6) {
        base.limiteColunaEsquerda = lim;
    }
    if (typeof stored.regexCodigoPeca === 'string') {
        base.regexCodigoPeca = stored.regexCodigoPeca.trim();
    }
    return base;
}

export function lerCalibracaoImportLocal() {
    if (typeof window === 'undefined') return { ...CALIBRACAO_IMPORT_DEFAULT };
    try {
        const raw = localStorage.getItem('lean_calibracao_import_zw3d');
        return carregarCalibracaoImport(raw ? JSON.parse(raw) : null);
    } catch {
        return { ...CALIBRACAO_IMPORT_DEFAULT };
    }
}

export function salvarCalibracaoImportLocal(calibracao) {
    const merged = carregarCalibracaoImport(calibracao);
    if (typeof window !== 'undefined') {
        localStorage.setItem('lean_calibracao_import_zw3d', JSON.stringify(merged));
    }
    return merged;
}
