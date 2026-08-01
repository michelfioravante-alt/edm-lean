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
import { clientesService } from '../services/clientesService';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';

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

// Store global para substituir as variáveis soltas do arquivo antigo logic.js
export const useAppStore = create((set) => ({
    configuracoesGlobais: {
        custoHoraMaquina: 50, // default R$ 50/h
        turnos: [
            { id: 't1', nome: 'Turno 1', inicio: '07:30', fim: '15:30' }
        ],
        pinOnboarding: '1234' // PIN padrão
    },
    // Array de máquinas do Supabase (snake_case: { id, nome, status })
    maquinas: [],

    // Listas para Cadastros (carregadas do Supabase)
    operadores: [],
    programadores: [],
    clientes: [],
    usuarios: [],

    // Kanbans Automáticos
    kanbansAutomaticos: [],

    // Estoque e Consumíveis (carregados do Supabase)
    // Array de { id, nome, quantidade, alerta_minimo }
    estoque: [],
    historicoConsumiveis: [],

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

    // Estado para navegação mobile entre colunas do Kanban
    kanbanStage: 'aFazer',
    setKanbanStage: (stage) => set({ kanbanStage: stage }),

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
                        turnos: data.turnos || [{ id: 't1', nome: 'Turno 1', inicio: '07:30', fim: '15:30' }],
                        pinOnboarding: data.pin_onboarding || '1234',
                        limiteMaquinas: data.limite_maquinas ?? 999
                    }
                });
            }
        } catch (e) {
            console.warn('fetchConfiguracoes:', e.message);
        }
    },

    registrarPausaRetroativaFaltaEnergia: async (osId, colKey, dados) => {
        try {
            const stateNow = useAppStore.getState();
            const lista = stateNow.kanban[colKey] || [];
            const os = lista.find(o => o.id === osId);
            if (!os) return;

            const { horaInicioEnergia, horaFimEnergia, observacaoPausa } = dados;

            const hoje = new Date();
            const parseHora = (hstr) => {
                const [h, m] = (hstr || '').split(':').map((n) => parseInt(n, 10));
                if (Number.isNaN(h) || Number.isNaN(m)) return null;
                return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), h, m, 0, 0);
            };

            const inicio = parseHora(horaInicioEnergia);
            const fim = parseHora(horaFimEnergia);
            if (!inicio || !fim || fim <= inicio) {
                console.warn('Pausa retroativa ignorada: horários inválidos', horaInicioEnergia, horaFimEnergia);
                return;
            }

            const duracaoHoras = Math.max(0, (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60));

            const historicoExistente = os.historico_pausas || os.historicoPausas || [];
            const novaPausa = {
                inicio: inicio.toISOString(),
                fim: fim.toISOString(),
                motivo: 'Falta de Energia',
                observacao: observacaoPausa,
                duracaoHoras,
                fase: colKey
            };

            const novoHistorico = [...historicoExistente, novaPausa];

            const updatedOsBanco = await osService.updateOs(osId, { historicoPausas: novoHistorico });

            set((draft) => {
                const k = { ...draft.kanban };
                const colList = [...(k[colKey] || [])];
                const idx = colList.findIndex((o) => o.id === osId);
                if (idx !== -1) {
                    colList[idx] = {
                        ...colList[idx],
                        ...updatedOsBanco,
                        historico_pausas: novoHistorico
                    };
                }
                k[colKey] = colList;
                return { kanban: k };
            });
        } catch (e) {
            console.error('registrarPausaRetroativaFaltaEnergia erro:', e);
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

    salvarConfiguracoes: async ({ custoHoraMaquina, turnos, pinOnboarding }) => {
        await configService.upsert({ custoHoraMaquina, turnos, pinOnboarding });
        set((state) => ({
            configuracoesGlobais: { ...state.configuracoesGlobais, custoHoraMaquina, turnos, pinOnboarding }
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

            const statusToCol = {
                'A fazer': 'aFazer',
                'Set-up': 'setup',
                'Em Corte': 'emCorte',
                'Aferição': 'afericao',
                'Concluído': 'concluido'
            };

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
                        const col = statusToCol[os.status];
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
                    aFazer: data.filter(os => os.status === 'A fazer'),
                    setup: sortByPriorityAndDate(data.filter(os => os.status === 'Set-up')),
                    emCorte: sortByPriorityAndDate(data.filter(os => os.status === 'Em Corte')),
                    afericao: sortByPriorityAndDate(data.filter(os => os.status === 'Aferição')),
                    concluido: data
                        .filter(os => os.status === 'Concluído')
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

        const statusToCol = (status) => {
            const map = {
                'A fazer': 'aFazer',
                'Set-up': 'setup',
                'Em Corte': 'emCorte',
                'Aferição': 'afericao',
                'Concluído': 'concluido'
            };
            return map[status];
        };

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
            const placeholder = {
                ...osComPosicao,
                id: tempId,
                _optimistic: true,
                codigo_peca: osComPosicao.codigo_peca || osComPosicao.codigoPeca,
                codigoPeca: osComPosicao.codigo_peca || osComPosicao.codigoPeca
            };
            set((state) => {
                const currentList = state.kanban.aFazer || [];
                const novaLista = (osComPosicao.is_prioridade || osComPosicao.isPrioridade)
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
    },

    editOrdemServico: async (id, fields) => {
        try {
            const updated = await osService.editOs(id, fields);
            set((state) => {
                const newKanban = {};
                for (const col of Object.keys(state.kanban)) {
                    newKanban[col] = (state.kanban[col] || []).map(os =>
                        os.id === id ? { ...os, ...updated } : os
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

    moveOrdemServico: async (osId, sourceCol, destCol, updatedOsParams = {}) => {
        try {
            const state = useAppStore.getState();
            const sourceList = Array.from(state.kanban[sourceCol]);
            let os = sourceList.find(o => o.id === osId);

            // Se não encontrou no estado local (ex: viajou no Realtime), tentamos buscar do outro state
            if (!os) {
                const destList = Array.from(state.kanban[destCol] || []);
                os = destList.find(o => o.id === osId);
            }

            // --- CÁLCULO DE TEMPOS DA FASE ANTERIOR ---
            if (os) {
                // Pega do banco ou do estado antigo (normalizado em minúsculas para coincidir com PostgreSQL, ex: timestamp_entrada_emcorte)
                const colKeyLower = sourceCol.toLowerCase();
                const timestampEntrada = os[`timestamp_entrada_${colKeyLower}`] || os[`timestamp_entrada_${sourceCol}`] || os.created_at;
                const nowMs = updatedOsParams[`timestampEntrada_${destCol}`]
                    ? new Date(updatedOsParams[`timestampEntrada_${destCol}`]).getTime()
                    : Date.now();
                const startMs = new Date(timestampEntrada).getTime();

                let tempoBrutoHoras = Math.max(0, (nowMs - startMs) / (1000 * 60 * 60));

                const pausasArray = os.historico_pausas || os.historicoPausas || [];
                const pausasNestaFase = pausasArray.filter(p => p.fase === sourceCol);
                const tempoMortoHoras = pausasNestaFase.reduce((acc, p) => acc + p.duracaoHoras, 0);

                const tempoLiquidoHoras = Math.max(0, tempoBrutoHoras - tempoMortoHoras);

                const novosTemposFases = {
                    ...(os.tempos_fases || os.temposFases || { setup: 0, emCorte: 0, afericao: 0 }),
                };
                novosTemposFases[sourceCol] = (novosTemposFases[sourceCol] || 0) + tempoLiquidoHoras;

                // Embutir no pacote que vai pro Supabase
                updatedOsParams.temposFases = novosTemposFases;

                // Garantir limpeza de pausa se mover de coluna (mesmo que moveOs no service já faça, aqui no front é bom ser explícito)
                updatedOsParams.is_pausado = false;
                updatedOsParams.data_pausa = null;
                updatedOsParams.motivo_pausa = null;
                updatedOsParams.observacao_pausa = null;

                // Ao devolver para A fazer: libera máquina e operador
                if (destCol === 'aFazer') {
                    updatedOsParams.maquina_nome = null;
                    updatedOsParams.operador_atual = null;
                }
            }
            // -------------------------------------------

            const statusTargetMap = {
                'aFazer': 'A fazer',
                'setup': 'Set-up',
                'emCorte': 'Em Corte',
                'afericao': 'Aferição',
                'concluido': 'Concluído'
            };

            const novoStatus = statusTargetMap[destCol];
            // --- ATUALIZAÇÃO OTIMISTA (FRONT-END PRIMEIRO) ---
            const oldState = structuredClone(useAppStore.getState().kanban);

            set((draftState) => {
                const draftSourceList = Array.from(draftState.kanban[sourceCol]);
                const draftDestList = Array.from(draftState.kanban[destCol]);

                const osIndex = draftSourceList.findIndex(o => o.id === osId);
                let osToMove = null;
                if (osIndex !== -1) {
                    [osToMove] = draftSourceList.splice(osIndex, 1);
                } else {
                    // Se não estava na source, procura em todas (fallback para Realtime)
                    for (const k of Object.keys(draftState.kanban)) {
                        const idx = draftState.kanban[k].findIndex(o => o.id === osId);
                        if (idx !== -1) {
                            [osToMove] = draftState.kanban[k].splice(idx, 1);
                            break;
                        }
                    }
                }

                if (osToMove) {
                    const updatedOptimisticOs = { ...osToMove, ...updatedOsParams, status: novoStatus };
                    draftDestList.push(updatedOptimisticOs);
                    return {
                        kanban: {
                            ...draftState.kanban,
                            [sourceCol]: draftSourceList,
                            [destCol]: draftDestList
                        }
                    };
                }
                return {};
            });

            // Persiste no banco em background (com timeout para não travar em rede lenta)
            const MOVE_TIMEOUT_MS = 25000;
            const moveWithTimeout = Promise.race([
                osService.moveOs(osId, novoStatus, updatedOsParams),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Tempo esgotado ao salvar a movimentação. Tente novamente.')), MOVE_TIMEOUT_MS)
                )
            ]);
            try {
                const updatedOsBanco = await moveWithTimeout;
                set((state) => {
                    const newKanban = { ...state.kanban };
                    const colKey = destCol;
                    newKanban[colKey] = newKanban[colKey].map(os => os.id === osId ? updatedOsBanco : os);
                    return { kanban: newKanban };
                });
            } catch (err) {
                console.error("Erro na transição no Supabase, revertendo...", err);
                set({ kanban: oldState });
                throw err;
            }

            // Se o destino for 'aFazer', persiste a ordem (inclusive do novo item que entrou)
            if (destCol === 'aFazer') {
                const updatedList = useAppStore.getState().kanban.aFazer;
                osService.updatePositions(updatedList.map(o => o.id)).catch(console.error);
            }
        } catch (err) {
            console.error("Erro na transição no Supabase", err);
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
        const state = useAppStore.getState();
        const list = Array.from(state.kanban[colKey]);
        const index = list.findIndex(os => os.id === osId);
        if (index === -1) return;

        let os = list[index];
        let updatePayload = { isPausado: pauseData.isPausado };

        if (!pauseData.isPausado) {
            // Está despausando
            const dataRetomada = pauseData.dataRetomada || new Date().toISOString();
            const startPausa = os.data_pausa || os.dataPausa || os.data_Pausa;

            if (startPausa) {
                const duracaoMs = new Date(dataRetomada) - new Date(startPausa);
                const duracaoHoras = Math.max(0, duracaoMs / (1000 * 60 * 60));

                const novaPausa = {
                    inicio: startPausa,
                    fim: dataRetomada,
                    motivo: os.motivo_pausa || os.motivoPausa || os.motivo_pausa,
                    observacao: os.observacao_pausa || os.observacaoPausa || os.observacao_pausa,
                    duracaoHoras,
                    fase: colKey
                };

                updatePayload.historicoPausas = [...(os.historico_pausas || os.historicoPausas || []), novaPausa];
            }

            // Limpa campos transientes no banco
            updatePayload.dataPausa = null;
            updatePayload.motivoPausa = null;
            updatePayload.observacaoPausa = null;
        } else {
            // Está pausando - garante que o payload leve os dados do modal
            updatePayload.dataPausa = pauseData.dataPausa;
            updatePayload.motivoPausa = pauseData.motivoPausa;
            updatePayload.observacaoPausa = pauseData.observacaoPausa;
        }

        try {
            const updatedOsBanco = await osService.updateOs(osId, updatePayload);

            // No front end lidamos com as chaves transientes em memória (dataPausa, motivo) pro card
            set((stateDraft) => {
                const draftList = Array.from(stateDraft.kanban[colKey]);
                const dIndex = draftList.findIndex(o => o.id === osId);
                if (dIndex !== -1) {
                    if (pauseData.isPausado) {
                        draftList[dIndex] = { ...updatedOsBanco, ...pauseData };
                    } else {
                        draftList[dIndex] = {
                            ...updatedOsBanco,
                            dataPausa: null,
                            motivoPausa: null,
                            observacaoPausa: null
                        };
                    }
                }
                return { kanban: { ...stateDraft.kanban, [colKey]: draftList } };
            });
        } catch (e) {
            console.error("Erro ao pausar no supabase", e);
        }
    },

    updateOrdemServico: async (osId, colKeyOrUpdates, maybeUpdates) => {
        const updates = typeof colKeyOrUpdates === 'object' ? colKeyOrUpdates : maybeUpdates;
        const colKey = typeof colKeyOrUpdates === 'string' ? colKeyOrUpdates : null;

        // --- ATUALIZAÇÃO OTIMISTA ---
        const oldKanban = structuredClone(useAppStore.getState().kanban);
        set((state) => {
            const newKanban = { ...state.kanban };
            if (colKey && newKanban[colKey]) {
                newKanban[colKey] = newKanban[colKey].map(o => o.id === osId ? { ...o, ...updates } : o);
            } else {
                for (const key of Object.keys(newKanban)) {
                    newKanban[key] = (newKanban[key] || []).map(o => o.id === osId ? { ...o, ...updates } : o);
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
        const setupH = parseInt(originalOsData.tempo_estimado_setup_horas || originalOsData.tempoEstimadoSetupHoras || 0);
        const setupM = parseInt(originalOsData.tempo_estimado_setup_minutos || originalOsData.tempoEstimadoSetupMinutos || 0);
        const corteH = parseInt(originalOsData.tempo_estimado_corte_horas || originalOsData.tempoEstimadoCorteHoras || 0);
        const corteM = parseInt(originalOsData.tempo_estimado_corte_minutos || originalOsData.tempoEstimadoCorteMinutos || 0);

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
    addMaquina: async (nome) => {
        const state = useAppStore.getState();
        const limite = state.configuracoesGlobais?.limiteMaquinas ?? 999;
        if (state.maquinas.length >= limite) {
            throw new Error('Limite do plano atingido. Entre em contato para adicionar mais máquinas.');
        }
        const nova = await maquinasService.create(nome);
        set((s) => ({ maquinas: [...s.maquinas, nova] }));
    },
    removeMaquina: async (id) => {
        await maquinasService.remove(id);
        set((state) => ({ maquinas: state.maquinas.filter(m => m.id !== id) }));
    },

    // Actions para Operadores (Supabase)
    addOperador: async (nome) => {
        const novo = await operadoresService.create(nome);
        set((state) => ({ operadores: [...state.operadores, novo] }));
    },
    removeOperador: async (id) => {
        await operadoresService.remove(id);
        set((state) => ({ operadores: state.operadores.filter(op => op.id !== id) }));
    },

    // Programadores (Supabase)
    addProgramador: async (nome) => {
        const novo = await programadoresService.create(nome);
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
                    await state.addOrdemServico({
                        codigoPeca: `AUTO-${(kb.tipo || 'ROT').substring(0, 3).toUpperCase()}`,
                        cliente: kb.descricao || kb.tipo,
                        maquina_nome: kb.maquinaNome,
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
            set({ estoque: data });
        } catch (e) {
            console.warn('fetchEstoque:', e.message);
        }
    },

    addEstoqueItem: async (nome, qtd, alertMin) => {
        try {
            const novo = await estoqueService.create(nome, qtd, alertMin);
            set((state) => ({ estoque: [...state.estoque, novo] }));
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

    consumirEstoqueItem: async (id, qtd = 1) => {
        try {
            // Decremento atômico: o banco faz GREATEST(quantidade - delta, 0), evitando race condition
            const atualizado = await estoqueService.decrementar(id, qtd);
            if (atualizado) {
                set((state) => ({
                    estoque: state.estoque.map(i => i.id === id ? atualizado : i)
                }));
            }
        } catch (e) {
            console.error('consumirEstoqueItem:', e.message);
        }
    },

    // Actions para Histórico de Trocas (Consumíveis por Máquina)
    registrarTrocaConsumivel: async (maquinaId, itemNome, operadorNome) => {
        const state = useAppStore.getState();
        const now = new Date().toISOString();

        try {
            // 1. Encerra o consumível anterior ativo nesta máquina+item no Supabase
            await historicoConsumiveisService.encerrarAtivo({ maquinaId, itemNome });

            // 2. Cria o novo registro de instalação no Supabase
            const novoRegistro = await historicoConsumiveisService.create({ maquinaId, itemNome, operadorNome });

            // 3. Consome 1 unidade do estoque via decremento atômico (evita race condition)
            const itemEstoque = state.estoque.find(i => i.nome === itemNome);
            if (itemEstoque) {
                const atualizado = await estoqueService.decrementar(itemEstoque.id, 1);
                if (atualizado) {
                    set((s) => ({
                        estoque: s.estoque.map(i => i.id === atualizado.id ? atualizado : i)
                    }));
                }
            }

            // 4. Atualiza o histórico local (normalizado para compatibilidade de UI)
            const normalizado = normalizarHistoricoConsumivel(novoRegistro);

            set((s) => ({
                historicoConsumiveis: [
                    normalizado,
                    // Encerra os ativos locais do mesmo item+maquina
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
    }
}));

