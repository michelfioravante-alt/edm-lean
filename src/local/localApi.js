import { loadDb, mutateDb, uuid } from './localDatabase';
import { LOCAL_EMPRESA_ID } from './seedData';

function findOs(db, id) {
    return db.ordens_servico.find((o) => o.id === id);
}

function mapMovePayload(novosParametros = {}) {
    const payload = {
        is_pausado: false,
        data_pausa: null,
        motivo_pausa: null,
        observacao_pausa: null,
    };

    if (novosParametros.timestampEntrada_setup || novosParametros.timestampEntradaSetup)
        payload.timestamp_entrada_setup = novosParametros.timestampEntrada_setup || novosParametros.timestampEntradaSetup;
    if (novosParametros.timestampEntrada_emCorte || novosParametros.timestampEntradaCorte)
        payload.timestamp_entrada_emcorte = novosParametros.timestampEntrada_emCorte || novosParametros.timestampEntradaCorte;
    if (novosParametros.timestampEntrada_afericao || novosParametros.timestampEntradaAfericao)
        payload.timestamp_entrada_afericao = novosParametros.timestampEntrada_afericao || novosParametros.timestampEntradaAfericao;
    if (novosParametros.timestampEntrada_concluido || novosParametros.timestampEntradaConcluido)
        payload.timestamp_entrada_concluido = novosParametros.timestampEntrada_concluido || novosParametros.timestampEntradaConcluido;

    if (novosParametros.maquina_nome !== undefined || novosParametros.maquina !== undefined)
        payload.maquina_nome = novosParametros.maquina_nome ?? novosParametros.maquina ?? null;
    if (novosParametros.operador_atual !== undefined || novosParametros.operadorAtual !== undefined)
        payload.operador_atual = novosParametros.operador_atual ?? novosParametros.operadorAtual ?? null;
    if (novosParametros.resultadoAfericao || novosParametros.resultado_afericao)
        payload.resultado_afericao = novosParametros.resultadoAfericao || novosParametros.resultado_afericao;
    if (novosParametros.motivoRefugo || novosParametros.motivo_refugo)
        payload.motivo_refugo = novosParametros.motivoRefugo || novosParametros.motivo_refugo;
    if (novosParametros.quantidade !== undefined) payload.quantidade = novosParametros.quantidade;
    if (novosParametros.quantidade_concluida !== undefined) payload.quantidade_concluida = novosParametros.quantidade_concluida;
    if (novosParametros.posicao !== undefined) payload.posicao = novosParametros.posicao;
    if (novosParametros.tempos_fases || novosParametros.temposFases)
        payload.tempos_fases = novosParametros.tempos_fases || novosParametros.temposFases;

    // Setup extra e divisão de O.S. reestimam os tempos junto com a movimentação.
    if (novosParametros.tempo_estimado_setup_horas !== undefined) payload.tempo_estimado_setup_horas = novosParametros.tempo_estimado_setup_horas;
    if (novosParametros.tempo_estimado_setup_minutos !== undefined) payload.tempo_estimado_setup_minutos = novosParametros.tempo_estimado_setup_minutos;
    if (novosParametros.tempo_estimado_corte_horas !== undefined) payload.tempo_estimado_corte_horas = novosParametros.tempo_estimado_corte_horas;
    if (novosParametros.tempo_estimado_corte_minutos !== undefined) payload.tempo_estimado_corte_minutos = novosParametros.tempo_estimado_corte_minutos;

    if (novosParametros.estrategia_ferramental !== undefined || novosParametros.estrategiaFerramental !== undefined)
        payload.estrategia_ferramental = novosParametros.estrategia_ferramental ?? novosParametros.estrategiaFerramental ?? null;

    if (novosParametros.setup_atual !== undefined || novosParametros.setupAtual !== undefined)
        payload.setup_atual = novosParametros.setup_atual ?? novosParametros.setupAtual;
    if (novosParametros.aguardando_tt !== undefined) payload.aguardando_tt = novosParametros.aguardando_tt;
    if (novosParametros.observacao_tt !== undefined) payload.observacao_tt = novosParametros.observacao_tt;

    return payload;
}

export const localApi = {
    config: {
        async fetch() { return loadDb().configuracoes; },
        async upsert({ custoHoraMaquina, turnos, pinOnboarding, modoMagazineDefault, baixaEstoqueNoSetup }) {
            return mutateDb((db) => {
                db.configuracoes = {
                    ...db.configuracoes,
                    custo_hora_maquina: custoHoraMaquina,
                    turnos,
                    pin_onboarding: pinOnboarding,
                    ...(modoMagazineDefault !== undefined && { modo_magazine_default: modoMagazineDefault }),
                    ...(baixaEstoqueNoSetup !== undefined && { baixa_estoque_setup: baixaEstoqueNoSetup }),
                };
            }).configuracoes;
        },
    },
    maquinas: {
        async fetchAll() { return loadDb().maquinas; },
        async create(nome, setor = 'CNC') {
            let created;
            mutateDb((db) => {
                created = { id: uuid(), empresa_id: LOCAL_EMPRESA_ID, nome, setor, status: 'Parada', created_at: new Date().toISOString() };
                db.maquinas.push(created);
            });
            return created;
        },
        async remove(id) { mutateDb((db) => { db.maquinas = db.maquinas.filter((m) => m.id !== id); }); },
    },
    operadores: {
        async fetchAll() { return loadDb().operadores; },
        async create(nome, setor = 'TODOS', funcao = 'Operador') {
            let created;
            mutateDb((db) => {
                created = { id: uuid(), empresa_id: LOCAL_EMPRESA_ID, nome, setor, funcao, created_at: new Date().toISOString() };
                db.operadores.push(created);
            });
            return created;
        },
        async remove(id) { mutateDb((db) => { db.operadores = db.operadores.filter((o) => o.id !== id); }); },
    },

    programadores: {
        async fetchAll() { return loadDb().programadores; },
        async create(nome, setor = 'CNC') {
            let created;
            mutateDb((db) => {
                created = { id: uuid(), empresa_id: LOCAL_EMPRESA_ID, nome, setor, created_at: new Date().toISOString() };
                db.programadores.push(created);
            });
            return created;
        },

        async remove(id) { mutateDb((db) => { db.programadores = db.programadores.filter((p) => p.id !== id); }); },
    },
    clientes: {
        async fetchAll() { return loadDb().clientes; },
        async create({ nome, email, telefone }) {
            let created;
            mutateDb((db) => {
                created = { id: uuid(), empresa_id: LOCAL_EMPRESA_ID, nome, email: email || null, telefone: telefone || null, created_at: new Date().toISOString() };
                db.clientes.push(created);
            });
            return created;
        },
        async update(id, { nome, email, telefone }) {
            let updated;
            mutateDb((db) => {
                const idx = db.clientes.findIndex((c) => c.id === id);
                if (idx === -1) throw new Error('Cliente não encontrado');
                db.clientes[idx] = { ...db.clientes[idx], nome, email: email || null, telefone: telefone || null };
                updated = db.clientes[idx];
            });
            return updated;
        },
        async remove(id) { mutateDb((db) => { db.clientes = db.clientes.filter((c) => c.id !== id); }); },
    },
    estoque: {
        async fetchAll() { return loadDb().estoque_itens; },
        async create(nome, quantidade, alertaMinimo, setor = 'TODOS') {
            let created;
            mutateDb((db) => {
                created = { id: uuid(), empresa_id: LOCAL_EMPRESA_ID, nome, quantidade: parseInt(quantidade) || 0, alerta_minimo: parseInt(alertaMinimo) || 0, setor, created_at: new Date().toISOString() };
                db.estoque_itens.push(created);
            });
            return created;
        },

        async decrementar(id, delta = 1) {
            let updated = null;
            mutateDb((db) => {
                const item = db.estoque_itens.find((i) => i.id === id);
                if (item) { item.quantidade = Math.max(0, item.quantidade - parseInt(delta)); updated = { ...item }; }
            });
            return updated;
        },
        async movimentar(id, delta) {
            let updated = null;
            mutateDb((db) => {
                const item = db.estoque_itens.find((i) => i.id === id);
                if (item) { item.quantidade = Math.max(0, item.quantidade + parseInt(delta)); updated = { ...item }; }
            });
            return updated;
        },
        async updateQuantidade(id, novaQuantidade) {
            let updated = null;
            mutateDb((db) => {
                const item = db.estoque_itens.find((i) => i.id === id);
                if (item) { item.quantidade = Math.max(0, parseInt(novaQuantidade) || 0); updated = { ...item }; }
            });
            return updated;
        },
        async remove(id) { mutateDb((db) => { db.estoque_itens = db.estoque_itens.filter((i) => i.id !== id); }); },
    },
    movimentacoesEstoque: {
        async fetchAll() { return loadDb().movimentacoes_estoque || []; },
        async create(payload) {
            let created;
            mutateDb((db) => {
                if (!db.movimentacoes_estoque) db.movimentacoes_estoque = [];
                created = {
                    id: uuid(),
                    empresa_id: LOCAL_EMPRESA_ID,
                    estoque_item_id: payload.estoqueItemId,
                    item_nome: payload.itemNome,
                    tipo: payload.tipo,
                    quantidade: parseInt(payload.quantidade) || 0,
                    quantidade_resultante: payload.quantidadeResultante ?? null,
                    motivo: payload.motivo || null,
                    operador_nome: payload.operadorNome || null,
                    observacao: payload.observacao || null,
                    created_at: new Date().toISOString(),
                };
                db.movimentacoes_estoque.unshift(created);
            });
            return created;
        },
    },
    historicoQuebrasEstoque: {
        async fetchAll() { return loadDb().historico_quebras_estoque || []; },
        async create(payload) {
            let created;
            mutateDb((db) => {
                if (!db.historico_quebras_estoque) db.historico_quebras_estoque = [];
                created = {
                    id: uuid(),
                    empresa_id: LOCAL_EMPRESA_ID,
                    estoque_item_id: payload.estoqueItemId,
                    item_nome: payload.itemNome,
                    maquina_nome: payload.maquinaNome || null,
                    operador_nome: payload.operadorNome || null,
                    codigo_peca: payload.codigoPeca || null,
                    os_id: payload.osId || null,
                    observacao: payload.observacao || null,
                    hora_inicio: payload.horaInicio || null,
                    hora_fim: payload.horaFim || null,
                    created_at: new Date().toISOString(),
                };
                db.historico_quebras_estoque.unshift(created);
            });
            return created;
        },
    },
    historicoConsumiveis: {
        async fetchAll() { return loadDb().historico_consumiveis; },
        async create({ maquinaId, itemNome, operadorNome }) {
            let created;
            mutateDb((db) => {
                created = { id: uuid(), empresa_id: LOCAL_EMPRESA_ID, maquina_id: maquinaId, item_nome: itemNome, operador_nome: operadorNome, data_instalacao: new Date().toISOString(), data_fim: null, horas_produzidas: 0, created_at: new Date().toISOString() };
                db.historico_consumiveis.unshift(created);
            });
            return created;
        },
        async encerrarAtivo({ maquinaId, itemNome }) {
            const now = new Date().toISOString();
            mutateDb((db) => {
                db.historico_consumiveis.forEach((h) => {
                    if (h.maquina_id === maquinaId && h.item_nome === itemNome && !h.data_fim) h.data_fim = now;
                });
            });
        },
    },
    ferramentasMaquina: {
        async fetchAtivas() {
            return (loadDb().ferramentas_maquina || []).filter((f) => f.ativo);
        },
        async instalar(payload) {
            let created;
            mutateDb((db) => {
                if (!db.ferramentas_maquina) db.ferramentas_maquina = [];
                created = {
                    id: uuid(),
                    empresa_id: LOCAL_EMPRESA_ID,
                    maquina_id: payload.maquinaId || null,
                    maquina_nome: payload.maquinaNome,
                    estoque_item_id: payload.estoqueItemId,
                    item_nome: payload.itemNome,
                    os_id: payload.osId || null,
                    codigo_peca: payload.codigoPeca || null,
                    slot: payload.slot || null,
                    quantidade: parseInt(payload.quantidade) || 1,
                    motivo: payload.motivo || 'troca',
                    operador_nome: payload.operadorNome || null,
                    instalado_em: new Date().toISOString(),
                    removido_em: null,
                    ativo: true,
                    created_at: new Date().toISOString(),
                };
                db.ferramentas_maquina.unshift(created);
            });
            return created;
        },
        async retirarPorId(id, motivo = 'fim_ciclo') {
            let updated = null;
            mutateDb((db) => {
                const f = (db.ferramentas_maquina || []).find((x) => x.id === id && x.ativo);
                if (f) {
                    f.ativo = false;
                    f.removido_em = new Date().toISOString();
                    f.motivo_remocao = motivo;
                    updated = { ...f };
                }
            });
            return updated;
        },
        async retirarPorItem({ maquinaNome, estoqueItemId, quantidade = 1, motivo = 'quebra' }) {
            let updated = null;
            mutateDb((db) => {
                const lista = (db.ferramentas_maquina || []).filter(
                    (f) => f.ativo && f.maquina_nome === maquinaNome && f.estoque_item_id === estoqueItemId
                );
                let restante = quantidade;
                for (const f of lista) {
                    if (restante <= 0) break;
                    const qtd = f.quantidade || 1;
                    if (qtd <= restante) {
                        f.ativo = false;
                        f.removido_em = new Date().toISOString();
                        f.motivo_remocao = motivo;
                        restante -= qtd;
                        updated = { ...f };
                    } else {
                        f.quantidade = qtd - restante;
                        const removida = {
                            ...f,
                            id: uuid(),
                            quantidade: restante,
                            ativo: false,
                            removido_em: new Date().toISOString(),
                            motivo_remocao: motivo,
                        };
                        db.ferramentas_maquina.unshift(removida);
                        restante = 0;
                        updated = removida;
                    }
                }
            });
            return updated;
        },
        async limparPorOs(osId) {
            mutateDb((db) => {
                const now = new Date().toISOString();
                (db.ferramentas_maquina || []).forEach((f) => {
                    if (f.ativo && f.os_id === osId) {
                        f.ativo = false;
                        f.removido_em = now;
                        f.motivo_remocao = 'os_concluida';
                    }
                });
            });
        },
    },
    ferramental: {
        async fetchAll() { return loadDb().ferramental; },
        async fetchHistorico() { return loadDb().historico_ferramental; },
        async create(payload) {
            let created;
            mutateDb((db) => {
                created = { id: uuid(), empresa_id: LOCAL_EMPRESA_ID, nome: payload.nome, tipo: payload.tipo || 'Fresa', codigo: payload.codigo || null, vida_util_horas: parseFloat(payload.vidaUtilHoras) || 0, alerta_horas: parseFloat(payload.alertaHoras) || 0, horas_usadas: 0, status: 'disponivel', maquina_id: null, observacao: payload.observacao || null, created_at: new Date().toISOString() };
                db.ferramental.push(created);
            });
            return created;
        },
        async update(id, updates) {
            let updated = null;
            mutateDb((db) => {
                const f = db.ferramental.find((x) => x.id === id);
                if (!f) throw new Error('Ferramenta não encontrada');
                Object.assign(f, updates);
                updated = { ...f };
            });
            return updated;
        },
        async registrarQuebra({ ferramentalId, maquinaNome, operadorNome, observacao }) {
            let updated;
            mutateDb((db) => {
                const f = db.ferramental.find((x) => x.id === ferramentalId);
                if (!f) throw new Error('Ferramenta não encontrada');
                f.status = 'quebrado'; f.maquina_id = null; updated = { ...f };
                db.historico_ferramental.unshift({ id: uuid(), empresa_id: LOCAL_EMPRESA_ID, ferramental_id: ferramentalId, evento: 'quebra', maquina_nome: maquinaNome || null, operador_nome: operadorNome || null, horas_no_evento: f.horas_usadas || 0, observacao: observacao || null, created_at: new Date().toISOString() });
            });
            return updated;
        },
        async remove(id) { mutateDb((db) => { db.ferramental = db.ferramental.filter((f) => f.id !== id); }); },
    },
    autoKanban: {
        async fetchAll() { return loadDb().kanbans_automaticos; },
        async create({ tipo, descricao, diasIntervalo, maquinaNome }) {
            let created;
            mutateDb((db) => {
                created = { id: uuid(), empresa_id: LOCAL_EMPRESA_ID, tipo, descricao, maquina_nome: maquinaNome, dias_intervalo: diasIntervalo, criado_em: new Date().toISOString() };
                db.kanbans_automaticos.push(created);
            });
            return created;
        },
        async remove(id) { mutateDb((db) => { db.kanbans_automaticos = db.kanbans_automaticos.filter((k) => k.id !== id); }); },
    },
    perfis: {
        async fetchEquipe() { return loadDb().perfis; },
        async updateRole(userId, newRole) { mutateDb((db) => { const p = db.perfis.find((x) => x.id === userId); if (p) p.funcao = newRole; }); },
        async detachUser(userId) { mutateDb((db) => { const p = db.perfis.find((x) => x.id === userId); if (p) { p.empresa_id = null; p.funcao = 'operador'; } }); },
    },
    os: {
        async fetchAllAtivas() { return loadDb().ordens_servico.filter((o) => o.status !== 'Excluído' && o.status !== 'Excluido'); },
        async fetchExcluidos() { return loadDb().ordens_servico.filter((o) => o.status === 'Excluído' || o.status === 'Excluido'); },
        async updatePositions(orderedIds) { mutateDb((db) => { orderedIds.forEach((id, index) => { const os = findOs(db, id); if (os) os.posicao = index + 1; }); }); },
        async create(osData) {
            let created;
            mutateDb((db) => {
                created = {
                    id: uuid(), empresa_id: LOCAL_EMPRESA_ID,
                    codigo_peca: osData.codigo_peca || osData.codigoPeca, cliente: osData.cliente,
                    link_desenho: osData.link_desenho || osData.linkDesenho || null,
                    is_prioridade: osData.is_prioridade ?? osData.isPrioridade ?? false,
                    status: osData.status || 'A fazer',
                    tempo_estimado_corte_horas: parseInt(osData.tempo_estimado_corte_horas || osData.tempoEstimadoCorteHoras) || 0,
                    tempo_estimado_corte_minutos: parseInt(osData.tempo_estimado_corte_minutos || osData.tempoEstimadoCorteMinutos) || 0,
                    tempo_estimado_setup_horas: parseInt(osData.tempo_estimado_setup_horas || osData.tempoEstimadoSetupHoras) || 0,
                    tempo_estimado_setup_minutos: parseInt(osData.tempo_estimado_setup_minutos || osData.tempoEstimadoSetupMinutos) || 0,
                    prazo_entrega: osData.prazo_entrega || osData.prazoEntrega || null,
                    programador: osData.programador || osData.programador_nome || null,
                    quantidade: parseInt(osData.quantidade) || 1,
                    quantidade_concluida: parseInt(osData.quantidade_concluida || osData.quantidadeConcluida) || 0,
                    posicao: osData.posicao || null, parent_id: osData.parent_id || null,

                    total_setups: parseInt(osData.total_setups || osData.totalSetups) || 1,
                    setup_atual: parseInt(osData.setup_atual || osData.setupAtual) || 1,
                    nomes_setups: osData.nomes_setups || osData.nomesSetups || [],
                    detalhes_setups: osData.detalhes_setups || osData.detalhesSetups || [],
                    codigo_molde: osData.codigo_molde || osData.codigoMolde || null,
                    componente_molde: osData.componente_molde || osData.componenteMolde || null,
                    numero_programa: osData.numero_programa || osData.numeroPrograma || null,
                    nx_import: osData.nx_import || osData.nxImport || null,
                    estrategia_ferramental: osData.estrategia_ferramental || osData.estrategiaFerramental || null,
                    aguardando_tt: osData.aguardando_tt ?? false,
                    observacao_tt: osData.observacao_tt || null,

                    is_pausado: false, historico_pausas: [], tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
                    created_at: new Date().toISOString(),
                };
                db.ordens_servico.push(created);
            });
            return created;
        },
        async moveOs(id, newStatus, novosParametros = {}) {
            let updated;
            mutateDb((db) => {
                const os = findOs(db, id);
                if (!os) throw new Error('OS não encontrada');
                Object.assign(os, { status: newStatus, ...mapMovePayload(novosParametros) });
                updated = { ...os };
            });
            return updated;
        },
        async updateOs(id, updateData) {
            let updated;
            mutateDb((db) => {
                const os = findOs(db, id);
                if (!os) throw new Error('OS não encontrada');
                const map = { isPausado: 'is_pausado', is_pausado: 'is_pausado', historicoPausas: 'historico_pausas', historico_pausas: 'historico_pausas', temposFases: 'tempos_fases', tempos_fases: 'tempos_fases', resultadoAfericao: 'resultado_afericao', resultado_afericao: 'resultado_afericao', motivoRefugo: 'motivo_refugo', motivo_refugo: 'motivo_refugo', dataPausa: 'data_pausa', data_pausa: 'data_pausa', motivoPausa: 'motivo_pausa', motivo_pausa: 'motivo_pausa', observacaoPausa: 'observacao_pausa', observacao_pausa: 'observacao_pausa', quantidade: 'quantidade', quantidade_concluida: 'quantidade_concluida', quantidadeConcluida: 'quantidade_concluida', estrategiaFerramental: 'estrategia_ferramental', estrategia_ferramental: 'estrategia_ferramental' };
                Object.entries(updateData).forEach(([k, v]) => { if (map[k]) os[map[k]] = v; });
                updated = { ...os };
            });
            return updated;
        },
        async editOs(id, fields) {
            let updated;
            mutateDb((db) => {
                const os = findOs(db, id);
                if (!os) throw new Error('OS não encontrada');
                if (fields.cliente !== undefined) os.cliente = fields.cliente;
                if (fields.codigoPeca !== undefined) os.codigo_peca = fields.codigoPeca;
                if (fields.prazoEntrega !== undefined) os.prazo_entrega = fields.prazoEntrega;
                if (fields.tempoEstimadoCorteHoras !== undefined) os.tempo_estimado_corte_horas = parseInt(fields.tempoEstimadoCorteHoras) || 0;
                if (fields.tempoEstimadoCorteMinutos !== undefined) os.tempo_estimado_corte_minutos = parseInt(fields.tempoEstimadoCorteMinutos) || 0;
                if (fields.tempoEstimadoSetupHoras !== undefined) os.tempo_estimado_setup_horas = parseInt(fields.tempoEstimadoSetupHoras) || 0;
                if (fields.tempoEstimadoSetupMinutos !== undefined) os.tempo_estimado_setup_minutos = parseInt(fields.tempoEstimadoSetupMinutos) || 0;
                if (fields.programador !== undefined) os.programador = fields.programador;
                if (fields.linkDesenho !== undefined) os.link_desenho = fields.linkDesenho;
                if (fields.isPrioridade !== undefined) os.is_prioridade = fields.isPrioridade;
                if (fields.quantidade !== undefined) os.quantidade = parseInt(fields.quantidade) || 1;

                if (fields.codigoMolde !== undefined) os.codigo_molde = fields.codigoMolde || null;
                if (fields.componenteMolde !== undefined) os.componente_molde = fields.componenteMolde || null;
                if (fields.numeroPrograma !== undefined) os.numero_programa = fields.numeroPrograma || null;
                if (fields.totalSetups !== undefined) os.total_setups = parseInt(fields.totalSetups) || 1;
                if (fields.setupAtual !== undefined) os.setup_atual = parseInt(fields.setupAtual) || 1;
                if (fields.nomesSetups !== undefined) os.nomes_setups = fields.nomesSetups;
                if (fields.detalhesSetups !== undefined) os.detalhes_setups = fields.detalhesSetups;

                updated = { ...os };
            });
            return updated;
        },
        async delete(id) {
            let updated;
            mutateDb((db) => { const os = findOs(db, id); if (os) { os.status = 'Excluído'; updated = { ...os }; } });
            return updated;
        },
        async fetchStatsByCliente(clienteNome) {
            return loadDb().ordens_servico.filter((o) => o.cliente === clienteNome);
        },
    },
};
