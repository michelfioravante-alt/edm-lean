import { create } from 'zustand';
import { osService } from '../services/osService';
import { maquinasService } from '../services/maquinasService';
import { operadoresService } from '../services/operadoresService';
import { programadoresService } from '../services/programadoresService';
import { configService } from '../services/configService';
import { estoqueService } from '../services/estoqueService';
import { historicoConsumiveisService } from '../services/historicoConsumiveisService';
import { autoKanbanService } from '../services/autoKanbanService';
import { perfisService } from '../services/perfisService';
import { convitesService } from '../services/convitesService';
import { clientesService } from '../services/clientesService';
import { fornecedoresService } from '../services/fornecedoresService';
import { historicoQuebrasEstoqueService } from '../services/historicoQuebrasEstoqueService';
import { movimentacoesEstoqueService } from '../services/movimentacoesEstoqueService';
import { ferramentasMaquinaService } from '../services/ferramentasMaquinaService';
import { ferramentalService } from '../services/ferramentalService';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';
import { statusToColKey, colKeyToStatus } from '../constants/cncProcess';
import { novoGrupoId } from '../constants/osWorkflow';
import { novaOsRow, osPatch } from '../utils/osPayload';
import { osMovida } from '../utils/relogioOs';
import { chaveSku, normalizarItemEstoque, qtdEstoque } from '../utils/estoque';

// Normaliza um registro de historico_consumiveis (snake_case → camelCase)
const normalizarHistoricoConsumivel = (r) => ({
    ...r,
    maquinaId: r.maquina_id,
    itemNome: r.item_nome,
    operadorNome: r.operador_nome,
    dataInstalacao: r.data_instalacao,
    dataFim: r.data_fim,
    horasProduzidasSimuladas: r.horas_produzidas || 0
});

const normalizarHistoricoQuebraEstoque = (r) => ({
    ...r,
    estoqueItemId: r.estoque_item_id,
    itemNome: r.item_nome,
    maquinaNome: r.maquina_nome,
    operadorNome: r.operador_nome,
    codigoPeca: r.codigo_peca,
    osId: r.os_id,
    horaInicio: r.hora_inicio,
    horaFim: r.hora_fim,
});

const normalizarFerramentaMaquina = (r) => ({
    ...r,
    maquinaId: r.maquina_id,
    maquinaNome: r.maquina_nome,
    estoqueItemId: r.estoque_item_id,
    itemNome: r.item_nome,
    osId: r.os_id,
    codigoPeca: r.codigo_peca,
    operadorNome: r.operador_nome,
    instaladoEm: r.instalado_em,
    removidoEm: r.removido_em,
    motivoRemocao: r.motivo_remocao,
});

// Store global para substituir as variáveis soltas do arquivo antigo logic.js
export const useAppStore = create((set) => ({
    configuracoesGlobais: {
        custoHoraMaquina: 50, // default R$ 50/h
        turnos: [
            { id: 't1', nome: 'Turno 1', inicio: '07:30', fim: '15:30' }
        ],
        pinOnboarding: '1234',
        modoMagazineDefault: 'individual',
        baixaEstoqueNoSetup: false,
        etapasPersonalizadas: [],
    },
    // Array de máquinas do Supabase (snake_case: { id, nome, status })
    maquinas: [],

    // Listas para Cadastros (carregadas do Supabase)
    operadores: [],
    programadores: [],
    clientes: [],
    fornecedores: [],
    usuarios: [],
    erroOperacao: null, // Mensagem de falha ao salvar no banco (exibida no App)
    convites: [],

    // Kanbans Automáticos
    kanbansAutomaticos: [],

    // Estoque e Consumíveis (carregados do Supabase)
    // Array de { id, nome, quantidade, alerta_minimo }
    estoque: [],
    historicoConsumiveis: [],
    historicoQuebrasEstoque: [],
    movimentacoesEstoque: [],

    // Ferramentas instaladas/alocadas por máquina (magazine ativo)
    ferramentasMaquina: [],

    // Ferramental CNC
    ferramental: [],
    historicoFerramental: [],

    // Quadro Kanban
    kanban: {
        aFazer: [],
        setup: [],
        emCorte: [],
        afericao: [],
        concluido: [],
        excluido: []
    },
    isFetching: false,
    setIsFetching: (val) => set({ isFetching: val }),

    // Estado do setor produtivo ativo ('CNC', 'EDM_FIO', 'TODOS')
    activeSector: typeof window !== 'undefined' ? (localStorage.getItem('lean_active_sector') || 'CNC') : 'CNC',
    setActiveSector: (sector) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('lean_active_sector', sector);
        }
        set({ activeSector: sector });
    },

    // Estado para navegação mobile entre colunas do Kanban

    kanbanStage: 'aFazer',
    setKanbanStage: (stage) => set({ kanbanStage: stage }),

    destaqueOsId: null,
    osDeepLinkId: null,
    setOsDeepLinkId: (id) => set({ osDeepLinkId: id }),
    carteiraFiltroPedido: null,
    pedirFiltroCarteira: (filtro) => set({ carteiraFiltroPedido: filtro }),

    irParaKanban: (os) => {
        const setor = os?.setor || 'CNC';
        if (typeof window !== 'undefined') {
            localStorage.setItem('lean_active_sector', setor);
        }
        set({ activeSector: setor, destaqueOsId: os?.id || null });
    },
    limparDestaqueOs: () => set({ destaqueOsId: null }),

    // Actions Globais (apenas atualiza memória — persistida via salvarConfiguracoes)
    atualizarConfiguracoes: (novasConfigs) => set((state) => ({
        configuracoesGlobais: { ...state.configuracoesGlobais, ...novasConfigs }
    })),

    // Carrega as configurações do Supabase e sobrescreve os defaults
    fetchConfiguracoes: async () => {
        try {
            const data = await configService.fetch();
            if (data) {
                set({
                    configuracoesGlobais: {
                        custoHoraMaquina: data.custo_hora_maquina || 50,
                        custoHoraCnc: data.custo_hora_cnc || 80,
                        custoHoraEdm: data.custo_hora_edm || 120,
                        turnos: data.turnos || [{ id: 't1', nome: 'Turno 1', inicio: '07:30', fim: '15:30' }],
                        pinOnboarding: data.pin_onboarding || '1234',
                        limiteMaquinas: data.limite_maquinas ?? 999,
                        modoMagazineDefault: data.modo_magazine_default || 'individual',
                        baixaEstoqueNoSetup: data.baixa_estoque_setup ?? false,
                        etapasPersonalizadas: data.etapas_personalizadas || [],
                    }
                });
            }
        } catch (e) {
            console.warn('fetchConfiguracoes:', e.message);
        }
    },

    registrarPausaRetroativaFaltaEnergia: async (osId, colKey, dados) => {
        const { horaInicioEnergia, horaFimEnergia, observacaoPausa } = dados;
        await useAppStore.getState().registrarPausaRetroativa(osId, colKey, {
            horaInicio: horaInicioEnergia,
            horaFim: horaFimEnergia,
            motivo: 'Falta de Energia',
            observacao: observacaoPausa,
        });
    },

    /** Pausa informada depois do fato, com horários HH:MM de hoje. */
    registrarPausaRetroativa: async (osId, colKey, { horaInicio, horaFim, motivo, observacao }) => {
        const hoje = new Date();
        const parseHora = (hstr) => {
            const [h, m] = (hstr || '').split(':').map((n) => parseInt(n, 10));
            if (Number.isNaN(h) || Number.isNaN(m)) return null;
            return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), h, m, 0, 0);
        };
        const inicio = parseHora(horaInicio);
        const fim = parseHora(horaFim);
        if (!inicio || !fim || fim <= inicio) {
            console.warn('Pausa retroativa ignorada: horários inválidos', horaInicio, horaFim);
            return;
        }
        try {
            const updatedOsBanco = await osService.registrarPausa(osId, {
                inicio: inicio.toISOString(),
                fim: fim.toISOString(),
                motivo,
                observacao,
            });
            useAppStore.getState().aplicarOsDoBanco(colKey, updatedOsBanco);
        } catch (e) {
            console.error('registrarPausaRetroativa:', e);
            set({ erroOperacao: `Não foi possível registrar a pausa: ${e.message || 'erro de conexão'}` });
        }
    },

    registrarPausaRetroativaFaltaEnergiaGlobal: async (dados) => {
        try {
            const stateNow = useAppStore.getState();
            const cols = ['setup', 'emCorte', 'afericao'];
            for (const colKey of cols) {
                const lista = stateNow.kanban[colKey] || [];
                for (const os of lista) {
                    await stateNow.registrarPausaRetroativaFaltaEnergia(os.id, colKey, dados);
                }
            }
        } catch (e) {
            console.error('registrarPausaRetroativaFaltaEnergiaGlobal erro:', e);
        }
    },

    registrarPausaRetroativaQuebraFerramenta: async (osId, colKey, dados) => {
        const { horaInicioQuebra, horaFimQuebra, observacaoPausa } = dados;
        await useAppStore.getState().registrarPausaRetroativa(osId, colKey, {
            horaInicio: horaInicioQuebra,
            horaFim: horaFimQuebra,
            motivo: 'Quebra de Ferramenta',
            observacao: observacaoPausa,
        });
    },

    registrarQuebraFerramentaPausa: async (osId, colKey, dados) => {
        const state = useAppStore.getState();
        const {
            estoqueItemId,
            itemNome,
            maquinaNome,
            operadorNome,
            codigoPeca,
            observacao,
            retroativo,
            horaInicioQuebra,
            horaFimQuebra,
        } = dados;

        const itemEstoque = state.estoque.find(i => i.id === estoqueItemId);
        if (!itemEstoque || itemEstoque.quantidade <= 0) {
            throw new Error('Item sem estoque disponível.');
        }

        const authState = useAuthStore.getState();
        const empresaId = authState.empresaId;

        const obsBase = `Quebra: ${itemNome} · ${maquinaNome} · ${operadorNome}${codigoPeca ? ` · peça ${codigoPeca}` : ''}`;
        const obsFinal = observacao ? `${obsBase}. ${observacao}` : obsBase;

        try {
            await state.consumirEstoqueItem(estoqueItemId, 1);

            await ferramentasMaquinaService.retirarPorItem({
                maquinaNome,
                estoqueItemId,
                quantidade: 1,
                motivo: 'quebra',
            });

            const registro = await historicoQuebrasEstoqueService.create({
                empresaId,
                estoqueItemId,
                itemNome,
                maquinaNome,
                operadorNome,
                codigoPeca,
                osId,
                observacao: obsFinal,
                horaInicio: retroativo ? horaInicioQuebra : null,
                horaFim: retroativo ? horaFimQuebra : null,
            });

            set((s) => ({
                historicoQuebrasEstoque: [
                    normalizarHistoricoQuebraEstoque(registro),
                    ...s.historicoQuebrasEstoque,
                ],
            }));

            await state.fetchFerramentasMaquina();

            if (retroativo) {
                await state.registrarPausaRetroativaQuebraFerramenta(osId, colKey, {
                    horaInicioQuebra,
                    horaFimQuebra,
                    observacaoPausa: obsFinal,
                });
            } else {
                await state.togglePausaOrdemServico(osId, colKey, {
                    isPausado: true,
                    motivoPausa: 'Quebra de Ferramenta',
                    observacaoPausa: obsFinal,
                    dataPausa: new Date().toISOString(),
                });
            }
        } catch (e) {
            console.error('registrarQuebraFerramentaPausa:', e);
            throw e;
        }
    },

    salvarEtapasPersonalizadas: async (etapasPersonalizadas) => {
        const c = useAppStore.getState().configuracoesGlobais || {};
        try {
            await configService.upsert({
                custoHoraMaquina: c.custoHoraMaquina,
                custoHoraCnc: c.custoHoraCnc,
                custoHoraEdm: c.custoHoraEdm,
                turnos: c.turnos,
                pinOnboarding: c.pinOnboarding,
                modoMagazineDefault: c.modoMagazineDefault,
                baixaEstoqueNoSetup: c.baixaEstoqueNoSetup,
                etapasPersonalizadas,
            });
        } catch (e) {
            console.warn('salvarEtapasPersonalizadas:', e.message);
        }
        set({
            configuracoesGlobais: {
                ...c,
                etapasPersonalizadas,
            },
        });
    },

    salvarConfiguracoes: async ({ custoHoraMaquina, custoHoraCnc, custoHoraEdm, turnos, pinOnboarding, modoMagazineDefault, baixaEstoqueNoSetup, etapasPersonalizadas }) => {
        await configService.upsert({ custoHoraMaquina, custoHoraCnc, custoHoraEdm, turnos, pinOnboarding, modoMagazineDefault, baixaEstoqueNoSetup, etapasPersonalizadas });
        set((state) => ({
            configuracoesGlobais: {
                ...state.configuracoesGlobais,
                custoHoraMaquina,
                ...(custoHoraCnc !== undefined && { custoHoraCnc }),
                ...(custoHoraEdm !== undefined && { custoHoraEdm }),
                turnos,
                pinOnboarding,
                ...(modoMagazineDefault !== undefined && { modoMagazineDefault }),
                ...(baixaEstoqueNoSetup !== undefined && { baixaEstoqueNoSetup }),
                ...(etapasPersonalizadas !== undefined && { etapasPersonalizadas }),
            }
        }));
    },

    // Carrega máquinas do Supabase
    fetchMaquinas: async () => {
        try {
            const data = await maquinasService.fetchAll();
            set({ maquinas: data });
        } catch (e) {
            console.warn('fetchMaquinas:', e.message);
        }
    },

    // Carrega operadores do Supabase
    fetchOperadores: async () => {
        try {
            const data = await operadoresService.fetchAll();
            set({ operadores: data });
        } catch (e) {
            console.warn('fetchOperadores:', e.message);
        }
    },

    // Carrega programadores do Supabase
    fetchProgramadores: async () => {
        try {
            const data = await programadoresService.fetchAll();
            if (!Array.isArray(data)) return;
            // Não sobrescreve com [] se já temos itens (evita lista "sumir" em refetch/realtime)
            set((state) => ({
                programadores: data.length > 0 ? data : (state.programadores?.length ? state.programadores : data)
            }));
        } catch (e) {
            console.warn('fetchProgramadores:', e.message);
        }
    },

    // Carrega clientes do Supabase
    fetchClientes: async () => {
        try {
            const data = await clientesService.fetchAll();
            set({ clientes: data });
        } catch (e) {
            console.warn('fetchClientes:', e.message);
        }
    },

    fetchFornecedores: async () => {
        try {
            const data = await fornecedoresService.fetchAll();
            set({ fornecedores: data });
        } catch (e) {
            console.warn('fetchFornecedores:', e.message);
        }
    },

    addFornecedor: async (payload) => {
        const created = await fornecedoresService.create(payload);
        set((state) => ({ fornecedores: [...(state.fornecedores || []), created] }));
        return created;
    },

    removeFornecedor: async (id) => {
        await fornecedoresService.remove(id);
        set((state) => ({ fornecedores: (state.fornecedores || []).filter((f) => f.id !== id) }));
    },

    fetchClientStats: async (clienteNome) => {
        try {
            return await osService.fetchStatsByCliente(clienteNome);
        } catch (error) {
            console.error("Erro ao carregar estatísticas do cliente", error);
            return [];
        }
    },

    addCliente: async (clienteData) => {
        try {
            const novo = await clientesService.create(clienteData);
            set((state) => ({ clientes: [...state.clientes, novo] }));
        } catch (error) {
            console.error("Erro ao adicionar cliente", error);
            throw error;
        }
    },
    editCliente: async (id, clienteData) => {
        try {
            const atualizado = await clientesService.update(id, clienteData);
            set((state) => ({
                clientes: state.clientes.map(c => c.id === id ? atualizado : c)
            }));
            return atualizado;
        } catch (error) {
            console.error("Erro ao editar cliente", error);
            throw error;
        }
    },
    removeCliente: async (id) => {
        await clientesService.remove(id);
        set((state) => ({ clientes: state.clientes.filter(c => c.id !== id) }));
    },

    // Carrega histórico de consumíveis do Supabase
    fetchHistoricoConsumiveis: async () => {
        try {
            const data = await historicoConsumiveisService.fetchAll();
            const normalizado = data.map(normalizarHistoricoConsumivel);
            set({ historicoConsumiveis: normalizado });
        } catch (e) {
            console.warn('fetchHistoricoConsumiveis:', e.message);
        }
    },

    fetchHistoricoQuebrasEstoque: async () => {
        try {
            const data = await historicoQuebrasEstoqueService.fetchAll();
            set({ historicoQuebrasEstoque: (data || []).map(normalizarHistoricoQuebraEstoque) });
        } catch (e) {
            console.warn('fetchHistoricoQuebrasEstoque:', e.message);
        }
    },

    fetchFerramentasMaquina: async () => {
        try {
            const data = await ferramentasMaquinaService.fetchAtivas();
            set({ ferramentasMaquina: (data || []).map(normalizarFerramentaMaquina) });
        } catch (e) {
            console.warn('fetchFerramentasMaquina:', e.message);
        }
    },

    montarMagazineLote: async ({ maquinaNome, maquinaId, osId, codigoPeca, operadorNome, itens, baixarEstoque }) => {
        const state = useAppStore.getState();
        const instalados = [];

        for (const item of itens) {
            if (!item.estoqueItemId || !item.quantidade) continue;
            const estoqueItem = state.estoque.find((i) => i.id === item.estoqueItemId);
            if (!estoqueItem) continue;

            if (baixarEstoque) {
                await state.consumirEstoqueItem(item.estoqueItemId, item.quantidade);
            }

            const reg = await ferramentasMaquinaService.instalar({
                maquinaId: maquinaId || state.maquinas.find((m) => m.nome === maquinaNome)?.id,
                maquinaNome,
                estoqueItemId: item.estoqueItemId,
                itemNome: item.itemNome || estoqueItem.nome,
                osId,
                codigoPeca,
                slot: item.slot || null,
                quantidade: item.quantidade,
                motivo: 'setup_lote',
                operadorNome,
            });
            instalados.push(normalizarFerramentaMaquina(reg));
        }

        set((s) => ({
            ferramentasMaquina: [...instalados, ...s.ferramentasMaquina.filter((f) => f.ativo !== false)],
        }));

        return instalados;
    },

    registrarTrocaFerramentaPausa: async (osId, colKey, dados) => {
        const state = useAppStore.getState();
        const {
            estoqueItemId,
            itemNome,
            maquinaNome,
            operadorNome,
            codigoPeca,
            observacao,
            slot,
            ferramentaSaiuId,
            fimDeCiclo,
        } = dados;

        const itemEstoque = state.estoque.find((i) => i.id === estoqueItemId);
        if (!itemEstoque || itemEstoque.quantidade <= 0) {
            throw new Error('Item sem estoque disponível.');
        }

        const prefixo = fimDeCiclo ? 'Fim de ciclo / setup nova ferramenta' : 'Troca';
        const obsFinal = `${prefixo}: ${itemNome} · ${maquinaNome} · ${operadorNome}${slot ? ` · ${slot}` : ''}${codigoPeca ? ` · peça ${codigoPeca}` : ''}${observacao ? `. ${observacao}` : ''}`;

        try {
            if (ferramentaSaiuId) {
                await ferramentasMaquinaService.retirarPorId(ferramentaSaiuId, fimDeCiclo ? 'fim_ciclo' : 'troca');
            }

            await state.consumirEstoqueItem(estoqueItemId, 1);

            const reg = await ferramentasMaquinaService.instalar({
                maquinaId: state.maquinas.find((m) => m.nome === maquinaNome)?.id,
                maquinaNome,
                estoqueItemId,
                itemNome,
                osId,
                codigoPeca,
                slot: slot || null,
                quantidade: 1,
                motivo: fimDeCiclo ? 'fim_ciclo' : 'troca',
                operadorNome,
            });

            await state.fetchFerramentasMaquina();

            await state.togglePausaOrdemServico(osId, colKey, {
                isPausado: true,
                motivoPausa: 'Troca de Ferramenta',
                observacaoPausa: obsFinal,
                dataPausa: new Date().toISOString(),
            });
        } catch (e) {
            console.error('registrarTrocaFerramentaPausa:', e);
            throw e;
        }
    },

    // Equipe / Usuários
    fetchUsuarios: async () => {
        try {
            const data = await perfisService.fetchEquipe();
            set({ usuarios: data });
        } catch (e) {
            console.warn('fetchUsuarios:', e.message);
        }
    },
    updateUserRole: async (userId, newRole) => {
        await perfisService.updateRole(userId, newRole);
        set((state) => ({
            usuarios: state.usuarios.map(u => u.id === userId ? { ...u, funcao: newRole } : u)
        }));
    },
    removeUserFromEquipe: async (userId) => {
        await perfisService.detachUser(userId);
        set((state) => ({
            usuarios: state.usuarios.filter(u => u.id !== userId)
        }));
    },
    fetchConvites: async () => {
        try {
            const data = await convitesService.fetchAll();
            set({ convites: data || [] });
        } catch (e) {
            console.warn('fetchConvites:', e.message);
        }
    },
    criarConvite: async ({ nome, funcao, setorPadrao, pin }) => {
        const created = await convitesService.create({ nome, funcao, setorPadrao, pin });
        set((state) => ({ convites: [created, ...(state.convites || [])] }));
        return created;
    },
    revogarConvite: async (id) => {
        await convitesService.revoke(id);
        set((state) => ({ convites: (state.convites || []).filter((c) => c.id !== id) }));
    },
    atualizarPinConvite: async (id, pin) => {
        const updated = await convitesService.updatePin(id, pin);
        set((state) => ({
            convites: (state.convites || []).map((c) => (c.id === id ? { ...c, pin: updated?.pin ?? pin } : c)),
        }));
        return updated;
    },

    // Carrega Kanbans Automáticos do Supabase
    fetchAutoKanbans: async () => {
        try {
            const data = await autoKanbanService.fetchAll();
            // Normaliza snake_case -> camelCase
            const normalizado = data.map(kb => ({
                id: kb.id,
                tipo: kb.tipo,
                descricao: kb.descricao,
                maquinaNome: kb.maquina_nome,
                diasIntervalo: kb.dias_intervalo,
                criadoEm: kb.criado_em
            }));
            set({ kanbansAutomaticos: normalizado });
        } catch (e) {
            console.warn('fetchAutoKanbans:', e.message);
        }
    },

    // Função de Boot: Carrega todas as O.S do Supabase
    // Aceita { merge: true } para polling — mescla com estado atual em vez de substituir,
    // evitando flicker e conflitos com atualizações otimistas.
    fetchKanbanDadosInicial: async ({ merge = false } = {}) => {
        if (!merge) set({ isFetching: true });
        try {
            const data = await osService.fetchAllAtivas();

            const dateCache = new Map();
            const getTs = (isoStr) => {
                if (!isoStr) return 0;
                if (dateCache.has(isoStr)) return dateCache.get(isoStr);
                const ts = new Date(isoStr).getTime();
                dateCache.set(isoStr, ts);
                return ts;
            };

            const sortByPriorityAndDate = (list) => [...list].sort((a, b) => {
                if (a.is_prioridade !== b.is_prioridade) return b.is_prioridade ? 1 : -1;
                return getTs(a.created_at) - getTs(b.created_at);
            });

            if (merge) {
                // Merge: preserva campos do estado local, DB tem prioridade em campos que possui
                set((state) => {
                    // Mapa ID → card atual
                    const localMap = {};
                    for (const cards of Object.values(state.kanban)) {
                        for (const card of cards) localMap[card.id] = card;
                    }

                    const novoKanban = {
                        aFazer: [], setup: [], emCorte: [], afericao: [], concluido: [], excluido: []
                    };

                    for (const os of data) {
                        const col = statusToColKey(os.status);
                        if (!col) continue;
                        // Merge: local complementa, DB sobrescreve
                        const card = localMap[os.id] ? { ...localMap[os.id], ...os } : os;
                        novoKanban[col].push(card);
                    }

                    novoKanban.aFazer.sort((a, b) => (a.posicao || 0) - (b.posicao || 0));
                    novoKanban.setup = sortByPriorityAndDate(novoKanban.setup);
                    novoKanban.emCorte = sortByPriorityAndDate(novoKanban.emCorte);
                    novoKanban.afericao = sortByPriorityAndDate(novoKanban.afericao);
                    novoKanban.concluido = novoKanban.concluido
                        .sort((a, b) => getTs(b.created_at) - getTs(a.created_at))
                        .slice(0, 20);

                    return { kanban: novoKanban };
                });
            } else {
                // Boot completo: substitui tudo (carregamento inicial, visibilitychange)
                const novoKanban = {
                    aFazer: data.filter(os => statusToColKey(os.status) === 'aFazer'),
                    setup: sortByPriorityAndDate(data.filter(os => statusToColKey(os.status) === 'setup')),
                    emCorte: sortByPriorityAndDate(data.filter(os => statusToColKey(os.status) === 'emCorte')),
                    afericao: sortByPriorityAndDate(data.filter(os => statusToColKey(os.status) === 'afericao')),
                    concluido: data
                        .filter(os => statusToColKey(os.status) === 'concluido')
                        .sort((a, b) => getTs(b.created_at) - getTs(a.created_at))
                        .slice(0, 20),
                    excluido: []
                };
                set({ kanban: novoKanban });
            }
        } catch (error) {
            console.error("Erro ao carregar dados do Kanban", error);
        } finally {
            set({ isFetching: false });
        }
    },

    // Inscrição em Tempo Real para Multi-Usuários
    realtimeChannel: null,
    realtimeStatus: 'IDLE', // IDLE | SUBSCRIBED | TIMED_OUT | CLOSED | CHANNEL_ERROR
    realtimeLastOkAt: null,

    subscribeToKanbanUpdates: () => {
        const state = useAppStore.getState();
        if (state.realtimeChannel) return;

        const { empresaId } = useAuthStore.getState();
        if (!empresaId) return;

        const statusToCol = (status) => statusToColKey(status);

        // Debounce de refetch para reduzir egress: várias mudanças em 2s = 1 request por tabela
        const DEBOUNCE_MS = 2000;
        const refetchTimers = {};
        const debounceRefetch = (key, fn) => {
            if (refetchTimers[key]) clearTimeout(refetchTimers[key]);
            refetchTimers[key] = setTimeout(() => {
                fn();
                delete refetchTimers[key];
            }, DEBOUNCE_MS);
        };
        const refetchOperadores = () => debounceRefetch('operadores', () => useAppStore.getState().fetchOperadores?.());
        const refetchMaquinas = () => debounceRefetch('maquinas', () => useAppStore.getState().fetchMaquinas?.());
        const refetchProgramadores = () => debounceRefetch('programadores', () => useAppStore.getState().fetchProgramadores?.());
        const refetchClientes = () => debounceRefetch('clientes', () => useAppStore.getState().fetchClientes?.());
        const refetchEstoque = () => debounceRefetch('estoque', () => useAppStore.getState().fetchEstoque?.());
        const refetchHistoricoConsumiveis = () => debounceRefetch('historico', () => useAppStore.getState().fetchHistoricoConsumiveis?.());

        const channel = supabase
            .channel(`kanban-realtime-${empresaId}-${Date.now()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'ordens_servico', filter: `empresa_id=eq.${empresaId}` },
                (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;

                    // Atualiza o timestamp do último evento recebido (prova que o canal está vivo)
                    set({ realtimeLastOkAt: Date.now() });

                    set((draft) => {
                        const newKanban = { ...draft.kanban };

                        if (eventType === 'INSERT') {
                            const col = statusToCol(newRecord.status);
                            if (col && !newKanban[col].some(os => os.id === newRecord.id)) {
                                newKanban[col] = [...newKanban[col], newRecord];
                            }
                        } else if (eventType === 'UPDATE') {
                            // 1. Localiza onde está o card atualmente no front
                            let colAtual = null;
                            let cardOriginal = null;

                            for (const k of Object.keys(newKanban)) {
                                const found = newKanban[k].find(os => os.id === newRecord.id);
                                if (found) {
                                    colAtual = k;
                                    cardOriginal = found;
                                    break;
                                }
                            }

                            const colNova = statusToCol(newRecord.status);

                            // 2. Se mudou de coluna ou não existia
                            if (colNova !== colAtual) {
                                // Remove da antiga se existia
                                if (colAtual) {
                                    newKanban[colAtual] = newKanban[colAtual].filter(os => os.id !== newRecord.id);
                                }

                                // Adiciona na nova
                                if (colNova && newRecord.status !== 'Excluído') {
                                    const cardFinal = cardOriginal ? { ...cardOriginal, ...newRecord } : newRecord;
                                    newKanban[colNova] = [...newKanban[colNova], cardFinal];
                                }
                            } else if (colAtual) {
                                // 3. Se continua na mesma coluna, apenas atualiza o item in-place para evitar flicker/re-order
                                newKanban[colAtual] = newKanban[colAtual].map(os =>
                                    os.id === newRecord.id ? { ...os, ...newRecord } : os
                                );
                            }
                        } else if (eventType === 'DELETE') {
                            for (const k of Object.keys(newKanban)) {
                                newKanban[k] = newKanban[k].filter(os => os.id !== oldRecord.id);
                            }
                        }

                        // Re-ordenação básica para manter consistência nas colunas (exceto aFazer que tem ordem customizada)
                        const sortByPriority = (list) => [...list].sort((a, b) => {
                            if (a.is_prioridade !== b.is_prioridade) return b.is_prioridade ? 1 : -1;
                            return new Date(a.created_at) - new Date(b.created_at);
                        });

                        for (const k of ['setup', 'emCorte', 'afericao']) {
                            newKanban[k] = sortByPriority(newKanban[k]);
                        }

                        // 'aFazer' mantemos ordenado por 'posicao'
                        newKanban.aFazer.sort((a, b) => (a.posicao || 0) - (b.posicao || 0));

                        return { kanban: newKanban };
                    });
                }
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'operadores', filter: `empresa_id=eq.${empresaId}` }, refetchOperadores)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'maquinas', filter: `empresa_id=eq.${empresaId}` }, refetchMaquinas)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'programadores', filter: `empresa_id=eq.${empresaId}` }, refetchProgramadores)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes', filter: `empresa_id=eq.${empresaId}` }, refetchClientes)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque_itens', filter: `empresa_id=eq.${empresaId}` }, refetchEstoque)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'historico_consumiveis', filter: `empresa_id=eq.${empresaId}` }, refetchHistoricoConsumiveis)
            .subscribe((status) => {
                set({ realtimeStatus: status });

                // Se o canal fechar/der erro, remove e tenta reconectar
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    const s = useAppStore.getState();
                    if (s.realtimeChannel) {
                        supabase.removeChannel(s.realtimeChannel);
                        set({ realtimeChannel: null });
                        setTimeout(() => useAppStore.getState().subscribeToKanbanUpdates(), 1000);
                    }
                }
            });

        set({ realtimeChannel: channel });
    },

    unsubscribeFromKanbanUpdates: () => {
        const { realtimeChannel } = useAppStore.getState();
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            set({ realtimeChannel: null, realtimeStatus: 'IDLE' });
        }
    },

    setKanban: (novoKanban) => set({ kanban: novoKanban }),

    addOrdemServico: async (os, options = {}) => {
        const { optimistic = false, onError } = options;
        const TIMEOUT_MS = 45000; // tempo generoso para o create em background

        const stateNow = useAppStore.getState();
        const currentA_Fazer = stateNow.kanban.aFazer || [];

        let novaPosicao;
        if (os.isPrioridade || os.is_prioridade) {
            novaPosicao = 1;
        } else {
            const maxPos = currentA_Fazer.reduce((max, item) => Math.max(max, item.posicao || 0), 0);
            novaPosicao = maxPos + 1;
        }

        const osComPosicao = { ...os, posicao: novaPosicao };

        const doCreate = () => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
            );
            return Promise.race([
                osService.create(osComPosicao),
                timeoutPromise
            ]);
        };

        const applySuccess = (novaOsBanco, placeholderId) => {
            set((state) => {
                const list = state.kanban.aFazer || [];
                const withoutPlaceholder = placeholderId
                    ? list.filter((o) => o.id !== placeholderId && !o._optimistic)
                    : list;
                let novaLista;
                if (novaOsBanco.is_prioridade) {
                    novaLista = [novaOsBanco, ...withoutPlaceholder];
                    osService.updatePositions(novaLista.map((o) => o.id)).catch(console.error);
                } else {
                    novaLista = [...withoutPlaceholder, novaOsBanco];
                }
                return { kanban: { ...state.kanban, aFazer: novaLista } };
            });
        };

        const removePlaceholder = (placeholderId) => {
            set((state) => {
                const list = (state.kanban.aFazer || []).filter((o) => o.id !== placeholderId && !o._optimistic);
                return { kanban: { ...state.kanban, aFazer: list } };
            });
        };

        if (optimistic) {
            const tempId = `temp-${Date.now()}`;
            const placeholder = { ...novaOsRow(osComPosicao), id: tempId, _optimistic: true };
            set((state) => {
                const currentList = state.kanban.aFazer || [];
                const novaLista = placeholder.is_prioridade
                    ? [placeholder, ...currentList]
                    : [...currentList, placeholder];
                return { kanban: { ...state.kanban, aFazer: novaLista } };
            });
            doCreate()
                .then((novaOsBanco) => applySuccess(novaOsBanco, tempId))
                .catch((err) => {
                    removePlaceholder(tempId);
                    if (typeof onError === 'function') onError(err);
                });
            return;
        }

        const novaOsBanco = await doCreate();
        applySuccess(novaOsBanco, null);
        return novaOsBanco;
    },

    criarKanbanRetrabalho: async (osOrigem, { motivo } = {}) => {
        if (!osOrigem?.id) throw new Error('O.S. de origem inválida.');
        const codigo = osOrigem.codigo_peca;
        const nota = [
            `Retrabalho da peça ${codigo || osOrigem.id}.`,
            motivo ? `Motivo do refugo: ${motivo}` : null,
        ].filter(Boolean).join(' ');
        return useAppStore.getState().addOrdemServico({
            codigo_peca: codigo,
            cliente: osOrigem.cliente,
            setor: osOrigem.setor,
            link_desenho: osOrigem.link_desenho,
            prazo_entrega: osOrigem.prazo_entrega,
            programador: osOrigem.programador,
            quantidade: osOrigem.quantidade || 1,
            programado: osOrigem.programado ?? true,
            is_retrabalho: true,
            parent_id: osOrigem.id,
            os_grupo_id: osOrigem.os_grupo_id || null,
            tempo_estimado_corte_horas: osOrigem.tempo_estimado_corte_horas,
            tempo_estimado_corte_minutos: osOrigem.tempo_estimado_corte_minutos,
            tempo_estimado_setup_horas: osOrigem.tempo_estimado_setup_horas,
            tempo_estimado_setup_minutos: osOrigem.tempo_estimado_setup_minutos,
            total_setups: osOrigem.total_setups || 1,
            setup_atual: 1,
            nomes_setups: osOrigem.nomes_setups || [],
            detalhes_setups: osOrigem.detalhes_setups || [],
            codigo_molde: osOrigem.codigo_molde,
            componente_molde: osOrigem.componente_molde,
            numero_programa: osOrigem.numero_programa,
            link_programa: osOrigem.link_programa,
            estrategia_ferramental: osOrigem.estrategia_ferramental,
            observacoes: nota,
        });
    },
    addGrupoOrdensServico: async (cabecalho, kanbans) => {
        const { addOrdemServico } = useAppStore.getState();
        const grupoId = cabecalho.os_grupo_id || novoGrupoId();
        const criados = [];
        for (let i = 0; i < kanbans.length; i++) {
            const k = kanbans[i];
            const created = await addOrdemServico({
                ...cabecalho,
                codigoPeca: k.codigoPeca || cabecalho.codigoPeca,
                componenteMolde: k.componente || k.componenteMolde || '',
                setor: k.setor,
                quantidade: k.quantidade || cabecalho.quantidade || 1,
                tempoEstimadoCorteHoras: k.tempoEstimadoCorteHoras,
                tempoEstimadoCorteMinutos: k.tempoEstimadoCorteMinutos,
                tempoEstimadoSetupHoras: k.tempoEstimadoSetupHoras,
                tempoEstimadoSetupMinutos: k.tempoEstimadoSetupMinutos,
                programado: k.setor === 'EXTERNO' ? true : (k.programado ?? cabecalho.programado ?? false),
                os_grupo_id: grupoId,
                roteiro_ordem: i + 1,
                roteiro: k.roteiro || cabecalho.roteiro || [],
                status: 'A fazer',
                em_fila: k.em_fila ?? k.emFila ?? cabecalho.em_fila ?? cabecalho.emFila ?? false,
                nxImport: k.nxImport || k.nx_import || cabecalho.nxImport || cabecalho.nx_import || null,
                folhaBlob: k.folhaBlob || cabecalho.folhaBlob || null,
                observacoes: k.observacoes != null ? k.observacoes : cabecalho.observacoes,
            }, { optimistic: false });
            criados.push(created);
        }
        return criados;
    },

    editOrdemServico: async (id, fields) => {
        try {
            const updated = await osService.editOs(id, fields);
            set((state) => {
                const newKanban = {};
                for (const col of Object.keys(state.kanban)) {
                    newKanban[col] = (state.kanban[col] || []).map((os) =>
                        os.id === id ? { ...os, ...updated } : os,
                    );
                }
                return { kanban: newKanban };
            });
            return updated;
        } catch (error) {
            console.error("Erro ao editar Ordem de Serviço", error);
            throw error;
        }
    },

    syncRoteiroGrupo: async (os, roteiro) => {
        const { editOrdemServico } = useAppStore.getState();
        const grupo = os?.os_grupo_id;
        const state = useAppStore.getState();
        const ids = new Set();
        if (grupo) {
            Object.values(state.kanban || {}).forEach((col) => {
                (col || []).forEach((c) => {
                    if (c.os_grupo_id === grupo) ids.add(c.id);
                });
            });
        } else if (os?.id) {
            ids.add(os.id);
        }
        await Promise.all([...ids].map((id) => editOrdemServico(id, { roteiro })));
    },

    moveOrdemServico: async (osId, sourceCol, destCol, updatedOsParams = {}) => {
        const oldState = structuredClone(useAppStore.getState().kanban);

        // Otimista: o servidor devolve os tempos definitivos (mover_os usa a hora do banco).
        set((draftState) => {
            const kanban = { ...draftState.kanban };
            let colAtual = sourceCol;
            let idx = (kanban[sourceCol] || []).findIndex((o) => o.id === osId);
            if (idx === -1) {
                colAtual = Object.keys(kanban).find((k) => (kanban[k] || []).some((o) => o.id === osId));
                if (!colAtual) return {};
                idx = kanban[colAtual].findIndex((o) => o.id === osId);
            }
            const origem = [...kanban[colAtual]];
            const [osToMove] = origem.splice(idx, 1);
            kanban[colAtual] = origem;
            kanban[destCol] = [...(colAtual === destCol ? origem : kanban[destCol] || []), osMovida(osToMove, destCol, updatedOsParams)];
            return { kanban };
        });

        const MOVE_TIMEOUT_MS = 25000;
        try {
            const updatedOsBanco = await Promise.race([
                osService.moveOs(osId, destCol, updatedOsParams),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Tempo esgotado ao salvar a movimentação. Tente novamente.')), MOVE_TIMEOUT_MS)
                ),
            ]);
            set((state) => ({
                kanban: {
                    ...state.kanban,
                    [destCol]: state.kanban[destCol].map((o) => (o.id === osId ? { ...o, ...updatedOsBanco } : o)),
                },
            }));
        } catch (err) {
            console.error('Erro ao mover O.S., revertendo...', err);
            set({ kanban: oldState, erroOperacao: `Não foi possível mover a O.S.: ${err.message || 'erro de conexão'}` });
            throw err;
        }

        if (destCol === 'aFazer') {
            const updatedList = useAppStore.getState().kanban.aFazer;
            osService.updatePositions(updatedList.map((o) => o.id)).catch(console.error);
        }

        if (destCol === 'concluido') {
            await ferramentasMaquinaService.limparPorOs(osId);
            await useAppStore.getState().fetchFerramentasMaquina();
        }
    },

    deleteOrdemServico: async (osId, colKey) => {
        try {
            await osService.delete(osId);

            set((state) => {
                const sourceList = Array.from(state.kanban[colKey]);
                const index = sourceList.findIndex(os => os.id === osId);
                if (index === -1) return state;

                const [os] = sourceList.splice(index, 1);
                os.status = 'Excluído';

                return {
                    kanban: {
                        ...state.kanban,
                        [colKey]: sourceList,
                        excluido: [...(state.kanban.excluido || []), os]
                    }
                };
            });
        } catch (err) {
            console.error("Erro ao deletar OS no Supabase", err);
        }
    },

    togglePausaOrdemServico: async (osId, colKey, pauseData) => {
        try {
            const updatedOsBanco = pauseData.isPausado
                ? await osService.pausar(osId, pauseData.motivoPausa, pauseData.observacaoPausa)
                : await osService.retomar(osId);
            useAppStore.getState().aplicarOsDoBanco(colKey, updatedOsBanco);
        } catch (e) {
            console.error('Erro ao pausar/retomar O.S.', e);
            set({ erroOperacao: `Não foi possível ${pauseData.isPausado ? 'pausar' : 'retomar'} a O.S.: ${e.message || 'erro de conexão'}` });
            throw e;
        }
    },

    /** Troca o card pela linha devolvida pelo banco, preservando o que só existe no front (ex.: valor_orcado). */
    aplicarOsDoBanco: (colKey, osBanco) => {
        set((state) => ({
            kanban: {
                ...state.kanban,
                [colKey]: (state.kanban[colKey] || []).map((o) => (o.id === osBanco.id ? { ...o, ...osBanco } : o)),
            },
        }));
    },

    limparErroOperacao: () => set({ erroOperacao: null }),

    updateOrdemServico: async (osId, colKeyOrUpdates, maybeUpdates) => {
        const updates = typeof colKeyOrUpdates === 'object' ? colKeyOrUpdates : maybeUpdates;
        const colKey = typeof colKeyOrUpdates === 'string' ? colKeyOrUpdates : null;

        // --- ATUALIZAÇÃO OTIMISTA ---
        const oldKanban = structuredClone(useAppStore.getState().kanban);
        set((state) => {
            const newKanban = { ...state.kanban };
            if (colKey && newKanban[colKey]) {
                newKanban[colKey] = newKanban[colKey].map(o => o.id === osId ? { ...o, ...osPatch(updates) } : o);
            } else {
                for (const key of Object.keys(newKanban)) {
                    newKanban[key] = (newKanban[key] || []).map(o => o.id === osId ? { ...o, ...osPatch(updates) } : o);
                }
            }
            return { kanban: newKanban };
        });

        try {
            const updatedOsBanco = await osService.updateOs(osId, updates);
            // Sincroniza com dado real (contendo campos calculados pelo banco se houver)
            set((state) => {
                const newKanban = { ...state.kanban };
                for (const key of Object.keys(newKanban)) {
                    newKanban[key] = newKanban[key].map(o => o.id === osId ? { ...o, ...updatedOsBanco } : o);
                }
                return { kanban: newKanban };
            });
        } catch (e) {
            console.error("Erro ao atualizar os no BD, revertendo...", e);
            set({ kanban: oldKanban });
        }
    },

    splitOrdemServico: async (osId, sourceCol, destCol, splitData) => {
        const { concluidas, faltantes, updatedOsParams } = splitData;
        const state = useAppStore.getState();

        // 1. CAPTURA OS DADOS AGORA, antes do moveOrdemServico alterar o estado
        const originalOsData = state.kanban[sourceCol]?.find(o => o.id === osId);

        if (!originalOsData) {
            console.error("Split falhou: O.S. não encontrada na coluna de origem", { osId, sourceCol });
            return;
        }

        const totalOriginal = originalOsData.quantidade || 1;
        const ratioConcluidas = totalOriginal > 0 ? concluidas / totalOriginal : 1;
        const ratioFaltantes = totalOriginal > 0 ? faltantes / totalOriginal : 0;

        // Tempos estimados proporcionais (setup e corte são lineares com a quantidade)
        const setupH = parseInt(originalOsData.tempo_estimado_setup_horas || 0);
        const setupM = parseInt(originalOsData.tempo_estimado_setup_minutos || 0);
        const corteH = parseInt(originalOsData.tempo_estimado_corte_horas || 0);
        const corteM = parseInt(originalOsData.tempo_estimado_corte_minutos || 0);

        const setupTotalMin = setupH * 60 + setupM;
        const corteTotalMin = corteH * 60 + corteM;

        const setupConclMin = Math.round(setupTotalMin * ratioConcluidas);
        const corteConclMin = Math.round(corteTotalMin * ratioConcluidas);
        const setupFaltMin = Math.round(setupTotalMin * ratioFaltantes);
        const corteFaltMin = Math.round(corteTotalMin * ratioFaltantes);

        const paramsOriginal = {
            ...updatedOsParams,
            quantidade: concluidas,
            quantidade_concluida: concluidas,
            tempo_estimado_setup_horas: Math.floor(setupConclMin / 60),
            tempo_estimado_setup_minutos: setupConclMin % 60,
            tempo_estimado_corte_horas: Math.floor(corteConclMin / 60),
            tempo_estimado_corte_minutos: corteConclMin % 60
        };

        const oldKanban = structuredClone(state.kanban);

        try {
            // 2. Move a original com quantidade e tempos proporcionais às peças concluídas
            await state.moveOrdemServico(osId, sourceCol, destCol, paramsOriginal);

            // 3. Cria a complementar com tempos proporcionais às peças faltantes
            const { id, created_at, updated_at, ...cleanData } = originalOsData;
            const novaOs = {
                ...cleanData,
                quantidade: faltantes,
                quantidade_concluida: 0,
                quantidadeConcluida: 0,
                status: 'A fazer',
                parent_id: osId,
                tempo_estimado_setup_horas: Math.floor(setupFaltMin / 60),
                tempo_estimado_setup_minutos: setupFaltMin % 60,
                tempo_estimado_corte_horas: Math.floor(corteFaltMin / 60),
                tempo_estimado_corte_minutos: corteFaltMin % 60,
                tempos_fases: { setup: 0, emCorte: 0, afericao: 0 },
                historico_pausas: [],
                is_pausado: false,
                data_pausa: null,
                motivo_pausa: null,
                observacao_pausa: null
            };

            await state.addOrdemServico(novaOs);
        } catch (e) {
            console.error("Erro fatal no Split de OS:", e);
            set({ kanban: oldKanban });
            throw e;
        }
    },

    reorderOrdemServico: async (colKey, startIndex, endIndex) => {
        const state = useAppStore.getState();
        const list = Array.from(state.kanban[colKey]);
        const [removed] = list.splice(startIndex, 1);
        list.splice(endIndex, 0, removed);

        // Atualiza estado local primeiro (Optimistic)
        set((state) => ({
            kanban: {
                ...state.kanban,
                [colKey]: list
            }
        }));

        // Se for a coluna 'aFazer', persiste a nova ordem no banco
        if (colKey === 'aFazer') {
            try {
                await osService.updatePositions(list.map(os => os.id));
            } catch (error) {
                console.error("Erro ao persistir ordem das OS", error);
            }
        }
    },

    // registrarFimFase was removed to prevent race conditions erasing machine data in the cloud.

    // Actions para Máquinas (Supabase)
    addMaquina: async (nome, setor = 'CNC') => {
        const state = useAppStore.getState();
        const limite = state.configuracoesGlobais?.limiteMaquinas ?? 999;
        if (state.maquinas.length >= limite) {
            throw new Error('Limite do plano atingido. Entre em contato para adicionar mais máquinas.');
        }
        const nova = await maquinasService.create(nome, setor);
        set((s) => ({ maquinas: [...s.maquinas, nova] }));
    },
    removeMaquina: async (id) => {
        await maquinasService.remove(id);
        set((state) => ({ maquinas: state.maquinas.filter(m => m.id !== id) }));
    },

    // Actions para Operadores (Supabase)
    addOperador: async (nome, setor = 'TODOS') => {
        const novo = await operadoresService.create(nome, setor);
        set((state) => ({ operadores: [...state.operadores, novo] }));
    },
    removeOperador: async (id) => {
        await operadoresService.remove(id);
        set((state) => ({ operadores: state.operadores.filter(op => op.id !== id) }));
    },


    // Programadores (Supabase)
    addProgramador: async (nome, setor = 'CNC') => {
        const novo = await programadoresService.create(nome, setor);
        set((state) => ({ programadores: [...state.programadores, novo] }));
    },

    removeProgramador: async (id) => {
        await programadoresService.remove(id);
        set((state) => ({ programadores: state.programadores.filter(pr => pr.id !== id) }));
    },

    // Actions para Kanbans Automáticos (Supabase)
    addKanbanAutomatico: async (dados) => {
        const novo = await autoKanbanService.create({
            tipo: dados.tipo,
            descricao: dados.descricao,
            maquinaNome: dados.maquinaNome,
            diasIntervalo: dados.diasIntervalo
        });
        set((state) => ({
            kanbansAutomaticos: [
                ...state.kanbansAutomaticos,
                {
                    id: novo.id,
                    tipo: novo.tipo,
                    descricao: novo.descricao,
                    maquinaNome: novo.maquina_nome,
                    diasIntervalo: novo.dias_intervalo,
                    criadoEm: novo.criado_em
                }
            ]
        }));
    },
    removeKanbanAutomatico: async (id) => {
        await autoKanbanService.remove(id);
        set((state) => ({
            kanbansAutomaticos: state.kanbansAutomaticos.filter(kb => kb.id !== id)
        }));
    },

    // Motor de Agendamento (Cron Simulado)
    processarKanbansAutomaticos: async () => {
        const state = useAppStore.getState();
        if (!state.kanbansAutomaticos || state.kanbansAutomaticos.length === 0) return;
        const now = new Date();

        for (const kb of state.kanbansAutomaticos) {
            const dataBase = new Date(kb.ultimaExecucao || kb.criadoEm);
            const diferencaDias = Math.floor((now - dataBase) / (1000 * 60 * 60 * 24));

            if (diferencaDias >= kb.diasIntervalo) {
                try {
                    const maq = (state.maquinas || []).find((m) => m.nome === kb.maquinaNome);
                    const setor = maq?.setor || 'CNC';
                    await state.addOrdemServico({
                        codigoPeca: `MANUT-${String(setor).replace(/_/g, '').slice(0, 6)}`,
                        cliente: 'Manutenção interna',
                        maquina_nome: kb.maquinaNome,
                        setor,
                        programado: true,
                        observacoes: `Rotina automática: ${kb.descricao || kb.tipo}. A cada ${kb.diasIntervalo} dias. Não é O.S. de peça.`,
                        quantidade: 1,
                        prazo_entrega: new Date(now.getTime() + (kb.diasIntervalo * 24 * 60 * 60 * 1000)).toISOString()
                    });
                    set((s) => ({
                        kanbansAutomaticos: s.kanbansAutomaticos.map(k =>
                            k.id === kb.id ? { ...k, ultimaExecucao: now.toISOString() } : k
                        )
                    }));
                } catch (err) {
                    console.error("Erro ao criar O.S. automática no Supabase:", err);
                }
            }
        }
    },

    // Actions para Estoque (Supabase)
    fetchEstoque: async () => {
        try {
            const data = await estoqueService.fetchAll();
            set({ estoque: (data || []).map(normalizarItemEstoque) });
        } catch (e) {
            console.warn('fetchEstoque:', e.message);
        }
    },

    addEstoqueItem: async (nome, qtd, alertMin, setor = 'TODOS', unidade = 'un') => {
        try {
            const chave = chaveSku(nome, setor);
            const existente = useAppStore.getState().estoque.find((i) => chaveSku(i.nome, i.setor) === chave);
            if (existente) {
                await useAppStore.getState().movimentarEstoque({
                    itemId: existente.id,
                    tipo: 'entrada',
                    quantidade: qtd,
                    motivo: 'Entrada em SKU já cadastrado',
                });
                const atualizado = await estoqueService.update(existente.id, {
                    alerta_minimo: parseInt(alertMin, 10) || existente.alerta_minimo,
                    unidade: unidade || existente.unidade || 'un',
                });
                if (atualizado) {
                    set((state) => ({
                        estoque: state.estoque.map((i) => (i.id === existente.id ? normalizarItemEstoque({ ...i, ...atualizado }) : i)),
                    }));
                }
                return;
            }
            const novo = await estoqueService.create(nome, qtd, alertMin, setor, unidade);
            set((state) => ({ estoque: [...state.estoque, normalizarItemEstoque(novo)] }));
        } catch (e) {
            console.error('addEstoqueItem:', e.message);
            throw e;
        }
    },


    removeEstoqueItem: async (id) => {
        try {
            await estoqueService.remove(id);
            set((state) => ({ estoque: state.estoque.filter(i => i.id !== id) }));
        } catch (e) {
            console.error('removeEstoqueItem:', e.message);
            throw e;
        }
    },

    fetchMovimentacoesEstoque: async () => {
        try {
            const data = await movimentacoesEstoqueService.fetchAll();
            set({ movimentacoesEstoque: data || [] });
        } catch (e) {
            console.warn('fetchMovimentacoesEstoque:', e.message);
        }
    },

    /**
     * Entrada ou saída de estoque com motivo registrado.
     * A contagem é alterada no banco (atômica) e só então o movimento é gravado,
     * para o histórico nunca mostrar uma baixa que não aconteceu.
     */
    movimentarEstoque: async ({ itemId, tipo, quantidade, motivo, operadorNome, observacao }) => {
        const qtd = Math.abs(parseInt(quantidade) || 0);
        if (!itemId || qtd <= 0) throw new Error('Informe uma quantidade maior que zero.');

        const item = useAppStore.getState().estoque.find((i) => i.id === itemId);
        if (!item) throw new Error('Item não encontrado no inventário.');
        if (tipo === 'saida' && qtd > qtdEstoque(item)) {
            throw new Error(`Saída de ${qtd} maior que o saldo atual (${qtdEstoque(item)}).`);
        }

        const atualizado = await estoqueService.movimentar(itemId, tipo === 'entrada' ? qtd : -qtd);
        if (!atualizado) throw new Error('O banco não retornou o item atualizado.');

        set((state) => ({ estoque: state.estoque.map((i) => (i.id === itemId ? normalizarItemEstoque(atualizado) : i)) }));

        const registro = await movimentacoesEstoqueService.create({
            estoqueItemId: itemId,
            itemNome: item.nome,
            tipo,
            quantidade: qtd,
            quantidadeResultante: atualizado.quantidade,
            motivo,
            operadorNome,
            observacao,
        });

        set((state) => ({ movimentacoesEstoque: [registro, ...state.movimentacoesEstoque] }));
        return atualizado;
    },

    consumirEstoqueItem: async (id, qtd = 1, motivo = 'Consumo') => {
        try {
            await useAppStore.getState().movimentarEstoque({
                itemId: id,
                tipo: 'saida',
                quantidade: qtd,
                motivo,
            });
        } catch (e) {
            console.error('consumirEstoqueItem:', e.message);
            throw e;
        }
    },

    // Actions para Histórico de Trocas (Consumíveis por Máquina)
    registrarTrocaConsumivel: async (maquinaId, estoqueItemId, operadorNome) => {
        const state = useAppStore.getState();
        const now = new Date().toISOString();
        const itemEstoque = state.estoque.find((i) => i.id === estoqueItemId);
        if (!itemEstoque) throw new Error('Selecione um item do estoque.');
        if (qtdEstoque(itemEstoque) < 1) throw new Error('Sem saldo para essa troca.');
        const itemNome = itemEstoque.nome;

        try {
            await historicoConsumiveisService.encerrarAtivo({ maquinaId, itemNome });
            const novoRegistro = await historicoConsumiveisService.create({ maquinaId, itemNome, operadorNome });
            await state.movimentarEstoque({
                itemId: estoqueItemId,
                tipo: 'saida',
                quantidade: 1,
                motivo: `Troca na máquina`,
                operadorNome,
            });

            const normalizado = normalizarHistoricoConsumivel(novoRegistro);

            set((s) => ({
                historicoConsumiveis: [
                    normalizado,
                    ...s.historicoConsumiveis.map(log =>
                        log.maquinaId === maquinaId && log.itemNome === itemNome && !log.dataFim
                            ? { ...log, dataFim: now }
                            : log
                    )
                ]
            }));

        } catch (e) {
            console.error('registrarTrocaConsumivel:', e.message);
            throw e;
        }
    },

    fetchFerramental: async () => {
        const data = await ferramentalService.fetchAll();
        const historico = await ferramentalService.fetchHistorico();
        set({ ferramental: data, historicoFerramental: historico });
    },

    addFerramentalItem: async (payload) => {
        const skuId = payload.estoqueItemId || payload.estoqueItemId || payload.estoque_item_id;
        if (!skuId) throw new Error('Escolha o item de estoque (SKU) desta ferramenta.');
        const sku = useAppStore.getState().estoque.find((i) => i.id === skuId);
        if (!sku || qtdEstoque(sku) < 1) {
            throw new Error('Sem saldo no estoque para serializar esta ferramenta. Dê entrada no SKU primeiro.');
        }
        await useAppStore.getState().movimentarEstoque({
            itemId: skuId,
            tipo: 'saida',
            quantidade: 1,
            motivo: 'Ferramental (instância)',
        });
        const novo = await ferramentalService.create({
            ...payload,
            nome: payload.nome || sku.nome,
            estoqueItemId: skuId,
        });
        set((state) => ({ ferramental: [...state.ferramental, novo] }));
    },

    vincularFerramentalAoSku: async (ferramentalId, estoqueItemId) => {
        const atualizado = await ferramentalService.update(ferramentalId, { estoque_item_id: estoqueItemId });
        set((state) => ({
            ferramental: state.ferramental.map((f) => (f.id === ferramentalId ? { ...f, ...atualizado } : f)),
        }));
    },

    registrarQuebraFerramenta: async (payload) => {
        const atualizado = await ferramentalService.registrarQuebra(payload);
        const historico = await ferramentalService.fetchHistorico();
        set((state) => ({
            ferramental: state.ferramental.map((f) => (f.id === atualizado.id ? atualizado : f)),
            historicoFerramental: historico,
        }));
    },

    removeFerramentalItem: async (id) => {
        await ferramentalService.remove(id);
        set((state) => ({ ferramental: state.ferramental.filter((f) => f.id !== id) }));
    },
}));

