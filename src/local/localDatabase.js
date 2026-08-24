import { createSeedDatabase } from './seedData';

const STORAGE_KEY = 'cnc-lean-local-db';

export function uuid() {
    return crypto.randomUUID();
}

export function loadDb() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const db = JSON.parse(raw);
            if (!db.historico_quebras_estoque) db.historico_quebras_estoque = [];
            if (!db.ferramentas_maquina) db.ferramentas_maquina = [];
            if (!db.movimentacoes_estoque) db.movimentacoes_estoque = [];
            if (!db.fornecedores) db.fornecedores = [];
            if (!db.configuracoes.modo_magazine_default) db.configuracoes.modo_magazine_default = 'individual';
            if (db.configuracoes.baixa_estoque_setup === undefined) db.configuracoes.baixa_estoque_setup = false;
            if (!Array.isArray(db.configuracoes.etapas_personalizadas)) db.configuracoes.etapas_personalizadas = [];
            if (!Array.isArray(db.convites_acesso)) db.convites_acesso = [];
            const itens = db.estoque_itens || db.estoque_itens || [];
            db.estoque_itens = itens.map((i) => ({
                ...i,
                quantidade: i.quantidade ?? i.qtd ?? 0,
                alerta_minimo: i.alerta_minimo ?? i.alertaMinimo ?? 0,
                unidade: i.unidade || 'un',
            }));
            if (Array.isArray(db.ferramental)) {
                db.ferramental = db.ferramental.map((f) => ({
                    ...f,
                    estoque_item_id: f.estoque_item_id || null,
                }));
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
            return db;
        }
    } catch (e) {
        console.warn('localDb: erro ao ler, recriando seed', e);
    }
    const seed = createSeedDatabase();
    saveDb(seed);
    return seed;
}

export function saveDb(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDb() {
    const seed = createSeedDatabase();
    saveDb(seed);
    return seed;
}

export function mutateDb(mutator) {
    const db = loadDb();
    mutator(db);
    saveDb(db);
    return db;
}
