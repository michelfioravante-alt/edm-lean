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
            if (!db.configuracoes.modo_magazine_default) db.configuracoes.modo_magazine_default = 'individual';
            if (db.configuracoes.baixa_estoque_setup === undefined) db.configuracoes.baixa_estoque_setup = false;
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
