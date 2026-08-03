import React, { useState, useEffect } from 'react';
import Column from './Column';
import Button from '../common/Button';
import Modal from '../common/Modal';
import NovaOSForm from './NovaOSForm';
import TransitionModal from './TransitionModal';
import PauseModal from './PauseModal';
import AfericaoModal from './AfericaoModal';
import AcompanhamentoModal from './AcompanhamentoModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import ConfirmDevolverModal from './ConfirmDevolverModal';
import ConfirmDevolverCorteModal from './ConfirmDevolverCorteModal';
import RegraAfericaoModal from './RegraAfericaoModal';
import MachineOccupiedModal from './MachineOccupiedModal';
import ExtraSetupModal from './ExtraSetupModal';
import SplitModal from './SplitModal';
import { Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { KANBAN_COLUMNS, COLUMN_LABELS } from '../../constants/cncProcess';
import { SECTORS, SECTOR_OPTIONS } from '../../constants/sectorConstants';
import { Cpu, Zap, Factory, Lock } from 'lucide-react';

export default function Board() {
    // Seletores granulares
    const kanban = useAppStore(state => state.kanban);
    const estoque = useAppStore(state => state.estoque);
    const kanbanStage = useAppStore(state => state.kanbanStage);
    const activeSector = useAppStore(state => state.activeSector);
    const setActiveSector = useAppStore(state => state.setActiveSector);

    const role = useAuthStore(state => state.role);
    const setorPadrao = useAuthStore(state => state.setorPadrao);
    const isProgrammerLocked = Boolean(setorPadrao && setorPadrao !== 'TODOS' && role !== 'admin');

    useEffect(() => {
        if (isProgrammerLocked && activeSector !== setorPadrao) {
            setActiveSector(setorPadrao);
        }
    }, [isProgrammerLocked, setorPadrao, activeSector, setActiveSector]);

    const moveOrdemServico = useAppStore(state => state.moveOrdemServico);
    const togglePausaOrdemServico = useAppStore(state => state.togglePausaOrdemServico);
    const deleteOrdemServico = useAppStore(state => state.deleteOrdemServico);
    const fetchKanbanDadosInicial = useAppStore(state => state.fetchKanbanDadosInicial);

    // Títulos de colunas dinâmicos baseados no setor ativo
    const sectorConfig = SECTORS[activeSector] || SECTORS.CNC;
    const COLUMN_TITLES = Object.fromEntries(
        Object.values(sectorConfig.kanbanColumns).map(col => [col.key, col.label])
    );
    const COLUMN_THEMES = Object.fromEntries(
        Object.values(KANBAN_COLUMNS).map((col) => [col.key, { color: col.theme, icon: col.icon }])
    );





    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingTransition, setPendingTransition] = useState(null);
    const [pauseContext, setPauseContext] = useState(null);
    const [deleteContext, setDeleteContext] = useState(null);
    const [pendingAfericao, setPendingAfericao] = useState(null);
    const [selectedOs, setSelectedOs] = useState(null);
    const [showRegraAfericaoAlert, setShowRegraAfericaoAlert] = useState(false);
    const [occupiedMachineAlert, setOccupiedMachineAlert] = useState(null);
    const [extraSetupContext, setExtraSetupContext] = useState(null);
    const [splitContext, setSplitContext] = useState(null);
    const [transitionError, setTransitionError] = useState(null);
    const [pendingDevolverAFazer, setPendingDevolverAFazer] = useState(null);
    const [pendingDevolverCorteSetup, setPendingDevolverCorteSetup] = useState(null);

    // Memoização simples da contagem de estoque
    const lowStockCount = (estoque || []).filter(item => item.quantidade <= item.alerta_minimo).length;

    // O fetch inicial é feito pelo Layout (ao receber empresaId).
    // O Board não precisa re-fazer o boot — evita fetch duplicado e conflito com polling.

    const handleConfirmPause = (pauseData) => {
        if (pauseContext) {
            const state = useAppStore.getState();
            const { osData, colKey } = pauseContext;

            // Pausa retroativa específica para Falta de Energia (não altera isPausado agora)
            if (pauseData?.tipo === 'faltaEnergiaRetroativa') {
                if (pauseData.aplicarGlobal) {
                    state.registrarPausaRetroativaFaltaEnergiaGlobal(pauseData);
                } else {
                    state.registrarPausaRetroativaFaltaEnergia(osData.id, colKey, pauseData);
                }
                setPauseContext(null);
                return;
            }

            // Quebra de ferramenta: estoque + histórico + pausa (imediata ou retroativa)
            if (pauseData?.tipo === 'quebraFerramenta') {
                state.registrarQuebraFerramentaPausa(osData.id, colKey, pauseData)
                    .catch((err) => {
                        alert(err?.message || 'Erro ao registrar quebra de ferramenta.');
                    });
                setPauseContext(null);
                return;
            }

            if (pauseData?.tipo === 'trocaFerramentaEstoque') {
                state.registrarTrocaFerramentaPausa(osData.id, colKey, pauseData)
                    .catch((err) => {
                        alert(err?.message || 'Erro ao registrar troca de ferramenta.');
                    });
                setPauseContext(null);
                return;
            }

            if (pauseData?.motivo?.includes('Tratamento Térmico')) {
                const nowIso = new Date().toISOString();
                state.moveOrdemServico(osData.id, colKey, 'aFazer', {
                    status: 'A fazer',
                    aguardando_tt: true,
                    maquina_nome: null,
                    operador_atual: null,
                    observacao_tt: pauseData.observacao || 'Enviado para Tratamento Térmico externo',
                    timestampEntrada_aFazer: nowIso
                }).catch((err) => {
                    console.error("Erro ao enviar para T.T.:", err);
                    alert("Erro ao enviar peça para Tratamento Térmico.");
                });
                setPauseContext(null);
                return;
            }

            if (!pauseData.isPausado && (colKey === 'setup' || colKey === 'emCorte')) {
                const targetMachine = osData.maquina_nome || osData.maquina;
                if (targetMachine) {
                    const isOccupied = state.kanban[colKey].some(item =>
                        item.id !== osData.id &&
                        (item.maquina_nome === targetMachine || item.maquina === targetMachine) &&
                        !(item.is_pausado || item.isPausado)
                    );
                    if (isOccupied) {
                        setOccupiedMachineAlert({ maquinaName: targetMachine, targetCol: colKey });
                        return;
                    }
                }
            }
            togglePausaOrdemServico(osData.id, colKey, pauseData);
            setPauseContext(null);
        }
    };

    const handleConfirmDelete = () => {
        if (deleteContext) {
            deleteOrdemServico(deleteContext.osData.id, deleteContext.colKey);
            setDeleteContext(null);
        }
    };

    const handleDeleteFromModal = (osData) => {
        const state = useAppStore.getState();
        let foundCol = Object.keys(state.kanban).find(key => state.kanban[key].find(o => o.id === osData.id));
        if (foundCol) {
            setDeleteContext({ osData, colKey: foundCol });
            setSelectedOs(null);
        }
    };

    const getFilteredCards = (colKey, cards) => {
        if (!cards) return [];
        let list = cards;
        if (activeSector !== 'TODOS') {
            list = list.filter((os) => {
                const osSetor = os.setor || os.tipo_processo || 'CNC';
                return osSetor === activeSector;
            });
        }
        if (colKey !== 'concluido') return list;
        const limiteMs = 48 * 60 * 60 * 1000;
        const now = Date.now();
        const filtered = list.filter(card => {
            const timeEntrada = card.timestamp_entrada_concluido || card.timestampEntrada_concluido || card.created_at;
            if (!timeEntrada) return true;
            return (now - new Date(timeEntrada).getTime()) < limiteMs;
        });
        filtered.sort((a, b) => {
            const tA = new Date(a.timestamp_entrada_concluido || a.timestampEntrada_concluido || a.created_at).getTime() || 0;
            const tB = new Date(b.timestamp_entrada_concluido || b.timestampEntrada_concluido || b.created_at).getTime() || 0;
            return tB - tA;
        });
        return filtered.slice(0, 20);
    };


    const handleConfirmTransition = (data) => {
        if (!pendingTransition) return;
        const state = useAppStore.getState();
        const destCol = pendingTransition.destCol;
        if (destCol === 'setup' || destCol === 'emCorte') {
            const targetMachine = data.maquina_nome || state.kanban[pendingTransition.sourceCol].find(os => os.id === pendingTransition.osId)?.maquina_nome;
            if (targetMachine) {
                const isOccupied = state.kanban[destCol].some(os =>
                    (os.maquina_nome === targetMachine || os.maquina === targetMachine) &&
                    !(os.is_pausado || os.isPausado)
                );
                if (isOccupied) {
                    setOccupiedMachineAlert({ maquinaName: targetMachine, targetCol: destCol });
                    return;
                }
            }
        }
        setTransitionError(null);
        const ctx = { ...pendingTransition };
        setPendingTransition(null);
        const nowIso = new Date().toISOString();
        const { magazineLote, ...movePayload } = data;
        state.moveOrdemServico(ctx.osId, ctx.sourceCol, destCol, {
            ...movePayload,
            status: COLUMN_TITLES[destCol],
            [`timestampEntrada_${destCol}`]: nowIso
        }).then(async () => {
            if (magazineLote?.itens?.length > 0) {
                const os = useAppStore.getState().kanban[destCol]?.find((o) => o.id === ctx.osId);
                await useAppStore.getState().montarMagazineLote({
                    maquinaNome: movePayload.maquina_nome,
                    osId: ctx.osId,
                    codigoPeca: os?.codigo_peca || os?.codigoPeca || ctx.osData?.codigo_peca,
                    operadorNome: movePayload.operador_atual,
                    itens: magazineLote.itens,
                    baixarEstoque: magazineLote.baixarEstoque,
                });
            }
        }).catch((err) => {
            console.error("Erro ao mover O.S.:", err);
            setTransitionError(err?.message || "Falha ao salvar. Tente novamente.");
            setTimeout(() => setTransitionError(null), 4000);
        });
    };

    const handleCancelTransition = () => setPendingTransition(null);

    const handleConfirmDevolverCorteSetup = () => {
        if (!pendingDevolverCorteSetup) return;
        const ctx = pendingDevolverCorteSetup;
        const { osId, sourceCol, destCol } = ctx;
        setPendingDevolverCorteSetup(null);
        const nowIso = new Date().toISOString();
        moveOrdemServico(osId, sourceCol, destCol, {
            status: COLUMN_TITLES[destCol],
            [`timestampEntrada_${destCol}`]: nowIso
        }).catch((err) => {
            console.error("Erro ao devolver Corte para Set-up:", err);
            setPendingDevolverCorteSetup(ctx);
            setTransitionError(err?.message || "Falha ao salvar.");
            setTimeout(() => setTransitionError(null), 4000);
        });
    };

    const handleConfirmDevolver = () => {
        if (!pendingDevolverAFazer) return;
        const ctx = pendingDevolverAFazer;
        const { osId, sourceCol, destCol } = ctx;
        setPendingDevolverAFazer(null);
        const nowIso = new Date().toISOString();
        moveOrdemServico(osId, sourceCol, destCol, {
            status: COLUMN_TITLES[destCol],
            [`timestampEntrada_${destCol}`]: nowIso,
            maquina_nome: null,
            operador_atual: null
        }).catch((err) => {
            console.error("Erro ao devolver:", err);
            setPendingDevolverAFazer(ctx);
            setTransitionError(err?.message || "Falha ao salvar.");
            setTimeout(() => setTransitionError(null), 4000);
        });
    };

    const handleConfirmSplit = (choice, qtdConcluidasManual) => {
        if (!splitContext) return;
        const { osId, sourceCol, destCol, osData } = splitContext;
        const state = useAppStore.getState();
        const ctx = splitContext;
        setSplitContext(null);

        // Indo para Concluído com "Avançar Tudo": abrir AfericaoModal (o move é feito ao confirmar aferição)
        if (choice === 'all' && destCol === 'concluido') {
            setPendingAfericao({ osId, sourceCol, destCol, osData });
            return;
        }

        if (choice === 'split') {
            const total = osData.quantidade || 1;
            const concluidas = Math.max(
                0,
                Math.min(
                    total - 1,
                    qtdConcluidasManual !== undefined
                        ? qtdConcluidasManual
                        : (osData.quantidade_concluida || 0)
                )
            );
            const faltantes = total - concluidas;
            const nowIso = new Date().toISOString();
            state.splitOrdemServico(osId, sourceCol, destCol, {
                concluidas,
                faltantes,
                updatedOsParams: {
                    status: COLUMN_TITLES[destCol],
                    [`timestampEntrada_${destCol}`]: nowIso
                }
            }).catch((err) => {
                console.error("Erro ao fazer split:", err);
                setSplitContext(ctx);
                setTransitionError(err?.message || "Falha ao salvar.");
                setTimeout(() => setTransitionError(null), 4000);
            });
        } else {
            const nowIso = new Date().toISOString();
            state.moveOrdemServico(osId, sourceCol, destCol, {
                status: COLUMN_TITLES[destCol],
                [`timestampEntrada_${destCol}`]: nowIso
            }).catch((err) => {
                console.error("Erro ao avançar:", err);
                setSplitContext(ctx);
                setTransitionError(err?.message || "Falha ao salvar.");
                setTimeout(() => setTransitionError(null), 4000);
            });
        }
    };

    const handleReorder = (colKey, startIndex, endIndex) => {
        const { reorderOrdemServico } = useAppStore.getState();
        reorderOrdemServico(colKey, startIndex, endIndex);
    };

    const handleConfirmAfericao = (afericaoData) => {
        if (!pendingAfericao) return;
        const { moveOrdemServico } = useAppStore.getState();
        const ctx = pendingAfericao;
        setPendingAfericao(null);
        const nowIso = new Date().toISOString();

        if (afericaoData?.avancarProximoSetup) {
            const currentSetup = ctx.osData?.setup_atual || ctx.osData?.setupAtual || 1;
            const nextSetup = currentSetup + 1;
            moveOrdemServico(ctx.osId, ctx.sourceCol, 'setup', {
                status: COLUMN_TITLES['setup'],
                setup_atual: nextSetup,
                resultado_afericao: `Aprovada (${currentSetup}º Setup)`,
                timestampEntrada_setup: nowIso
            }).catch((err) => {
                console.error("Erro ao avançar para o próximo setup:", err);
                setPendingAfericao(ctx);
                setTransitionError(err?.message || "Falha ao salvar.");
                setTimeout(() => setTransitionError(null), 4000);
            });
            return;
        }

        moveOrdemServico(ctx.osId, ctx.sourceCol, ctx.destCol, {
            ...afericaoData,
            status: COLUMN_TITLES[ctx.destCol],
            [`timestampEntrada_${ctx.destCol}`]: nowIso
        }).catch((err) => {
            console.error("Erro na aferição:", err);
            setPendingAfericao(ctx);
            setTransitionError(err?.message || "Falha ao salvar.");
            setTimeout(() => setTransitionError(null), 4000);
        });
    };

    const handleCancelAfericao = () => setPendingAfericao(null);

    const handleConfirmExtraSetup = (extraTimes) => {
        if (!extraSetupContext) return;
        const ctx = extraSetupContext;
        const { osId, sourceCol, destCol, osData } = ctx;
        setExtraSetupContext(null);
        const nowIso = new Date().toISOString();
        let updatedParams = {
            status: COLUMN_TITLES[destCol],
            [`timestampEntrada_${destCol}`]: nowIso
        };
        if (extraTimes) {
            const currSetupH = parseInt(osData.tempo_estimado_setup_horas ?? 0);
            const currSetupM = parseInt(osData.tempo_estimado_setup_minutos ?? 0);
            const currCorteH = parseInt(osData.tempo_estimado_corte_horas ?? 0);
            const currCorteM = parseInt(osData.tempo_estimado_corte_minutos ?? 0);
            let totSetupM = currSetupM + extraTimes.extraSetupM;
            let totSetupH = currSetupH + extraTimes.extraSetupH + Math.floor(totSetupM / 60);
            totSetupM %= 60;
            let totCorteM = currCorteM + extraTimes.extraCorteM;
            let totCorteH = currCorteH + extraTimes.extraCorteH + Math.floor(totCorteM / 60);
            totCorteM %= 60;
            updatedParams.tempo_estimado_setup_horas = totSetupH;
            updatedParams.tempo_estimado_setup_minutos = totSetupM;
            updatedParams.tempo_estimado_corte_horas = totCorteH;
            updatedParams.tempo_estimado_corte_minutos = totCorteM;
        }
        moveOrdemServico(osId, sourceCol, destCol, updatedParams).catch((err) => {
            console.error("Erro no extra setup:", err);
            setExtraSetupContext(ctx);
            setTransitionError(err?.message || "Falha ao salvar.");
            setTimeout(() => setTransitionError(null), 4000);
        });
    };

    return (
        <ErrorBoundary>
            <div className="h-full flex flex-col kanban-col-animate relative">
                {transitionError && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500/95 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-bold animate-in fade-in duration-200 max-w-[90vw]">
                        {transitionError}
                    </div>
                )}
                {/* O seletor de etapas mobile foi movido para a MobileNav (barra inferior) */}

                {/* FLOATING ACTION BUTTON (MOBILE ONLY) */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="md:hidden fixed bottom-24 right-6 z-50 bg-kanban-amber text-slate-900 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-4 border-slate-950"
                >
                    <Plus className="w-8 h-8" />
                </button>

                {/* SECTOR SELECTOR BAR */}
                {isProgrammerLocked ? (
                    <div className="flex items-center gap-2 p-3 px-4 bg-slate-900 border border-slate-800 rounded-xl mb-6 w-full sm:w-fit text-xs font-bold text-slate-200 shadow-inner">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Kanban Exclusivo do Setor: {activeSector === 'EDM_FIO' ? '⚡ Eletroerosão a Fio (EDM)' : '🌀 Centro de Usinagem CNC'}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl mb-6 w-full sm:w-fit overflow-x-auto shadow-sm">
                        <button
                            onClick={() => setActiveSector('CNC')}
                            className={`px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                                activeSector === 'CNC'
                                    ? 'bg-cyan-500 text-slate-950 shadow-md scale-102 font-black'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                        >
                            <Cpu className="w-4 h-4" />
                            <span>Centro de Usinagem CNC</span>
                        </button>
                        <button
                            onClick={() => setActiveSector('EDM_FIO')}
                            className={`px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                                activeSector === 'EDM_FIO'
                                    ? 'bg-emerald-500 text-slate-950 shadow-md scale-102 font-black'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                        >
                            <Zap className="w-4 h-4" />
                            <span>Eletroerosão a Fio (EDM)</span>
                        </button>
                        <button
                            onClick={() => setActiveSector('TODOS')}
                            className={`px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                                activeSector === 'TODOS'
                                    ? 'bg-indigo-500 text-slate-950 shadow-md scale-102 font-black'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                        >
                            <Factory className="w-4 h-4" />
                            <span>Visão Geral Fábrica</span>
                        </button>
                    </div>
                )}


                {/* PAGE HEADER */}
                <div className="hidden sm:flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                            Kanban — {sectorConfig.label}
                        </h1>
                        <p className="text-slate-400 text-base font-medium">
                            {activeSector === 'CNC' && 'Gerencie as ordens de serviço do centro de usinagem CNC.'}
                            {activeSector === 'EDM_FIO' && 'Gerencie as ordens de serviço da eletroerosão a fio (WEDM).'}
                            {activeSector === 'TODOS' && 'Visão consolidada de todas as ordens de serviço da ferramentaria.'}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-kanban-amber text-slate-900 rounded-lg px-6 py-3 font-bold uppercase tracking-widest cursor-pointer transition-colors hover:bg-amber-400 shadow-sm"
                    >
                        <Plus className="w-6 h-6" />
                        <span>Nova OS</span>
                    </button>
                </div>


                {/* STATS BAR */}
                {(() => {
                    // Filtra pelo setor ativo para que os stats batam com o que aparece nas colunas
                    const filteredAFazer = getFilteredCards('aFazer', kanban.aFazer || []);
                    const filteredSetup = getFilteredCards('setup', kanban.setup || []);
                    const filteredEmCorte = getFilteredCards('emCorte', kanban.emCorte || []);
                    const filteredAfericao = getFilteredCards('afericao', kanban.afericao || []);
                    const filteredConcluido = getFilteredCards('concluido', kanban.concluido || []);
                    const totalAtivas = filteredAFazer.length + filteredSetup.length + filteredEmCorte.length + filteredAfericao.length;
                    const totalEmAtraso = [...filteredAFazer, ...filteredSetup, ...filteredEmCorte, ...filteredAfericao].filter(os => {
                        const prazo = os.prazo_entrega || os.prazoEntrega;
                        if (!prazo) return false;
                        const prazoDate = new Date(prazo.includes('T') ? prazo : `${prazo}T12:00:00`);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return prazoDate.getTime() < today.getTime() && !(os.is_pausado || os.isPausado);
                    }).length;
                    const totalConcluidas = filteredConcluido.filter(os => {
                        const ts = os.timestamp_entrada_concluido || os.timestampEntrada_concluido;
                        return ts && new Date(ts).toDateString() === new Date().toDateString();
                    }).length;

                    return (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 shrink-0">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-1.5 h-12 rounded-full bg-kanban-steel shrink-0"></div>
                                <div>
                                    <div className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">Total OS Ativas</div>
                                    <div className="text-3xl font-black text-white leading-none">{totalAtivas}</div>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-1.5 h-12 rounded-full bg-kanban-rust shrink-0"></div>
                                <div>
                                    <div className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">Em Atraso</div>
                                    <div className={`text-3xl font-black leading-none ${totalEmAtraso > 0 ? 'text-kanban-rust' : 'text-slate-600'}`}>{totalEmAtraso}</div>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-1.5 h-12 rounded-full bg-kanban-teal shrink-0"></div>
                                <div>
                                    <div className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">Em Usinagem</div>
                                    <div className="text-3xl font-black text-white leading-none">{filteredEmCorte.length}</div>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-1.5 h-12 rounded-full bg-kanban-green shrink-0"></div>
                                <div>
                                    <div className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">Concluídas Hoje</div>
                                    <div className="text-3xl font-black text-white leading-none">{totalConcluidas}</div>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                                <div className="w-1.5 h-12 rounded-full bg-red-500 shrink-0"></div>
                                <div>
                                    <div className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">Alerta Estoque</div>
                                    <div className={`text-3xl font-black leading-none ${lowStockCount > 0 ? 'text-red-500' : 'text-slate-600'}`}>{lowStockCount}</div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* KANBAN COLUMNS */}
                <div className="flex flex-col md:flex-row gap-4 pb-12 items-center md:items-stretch flex-1 w-full md:w-max md:min-w-full md:px-6 md:snap-scroll-x justify-center">
                    {Object.entries(COLUMN_TITLES)
                        .filter(([key]) => window.innerWidth >= 768 || key === kanbanStage)
                        .map(([columnKey, title]) => (
                            <Column
                                key={columnKey}
                                id={columnKey}
                                title={title}
                                cards={getFilteredCards(columnKey, kanban[columnKey] || [])}
                                theme={COLUMN_THEMES[columnKey]}
                                onReorderRequest={handleReorder}
                                onTransitionRequest={(osId, sourceCol, destCol) => {
                                    if (!destCol) return;
                                    if (sourceCol === 'concluido') {
                                        setTransitionError('O.S. concluída não pode ser movida.');
                                        setTimeout(() => setTransitionError(null), 3000);
                                        return;
                                    }
                                    if (sourceCol === 'emCorte' && destCol === 'concluido') {
                                        setShowRegraAfericaoAlert(true);
                                        return;
                                    }
                                    if (destCol === 'setup' || destCol === 'emCorte') {
                                        const osToMove = kanban[sourceCol]?.find(item => item.id === osId);
                                        if (destCol === 'setup' && sourceCol === 'emCorte') {
                                            setPendingDevolverCorteSetup({ osId, sourceCol, destCol, osData: osToMove });
                                        } else if (destCol === 'setup' && sourceCol === 'afericao') {
                                            setExtraSetupContext({ osId, sourceCol, destCol, osData: osToMove });
                                        } else if (sourceCol === 'afericao' && destCol === 'emCorte') {
                                            setTransitionError('De Aferição só pode ir para Set-up.');
                                            setTimeout(() => setTransitionError(null), 3000);
                                            return;
                                        } else {
                                            setPendingTransition({ osId, sourceCol, destCol, osData: osToMove });
                                        }
                                    } else if (destCol === 'concluido') {

                                        const osToMove = kanban[sourceCol].find(item => item.id === osId);
                                        // Lote indo para Concluído: perguntar peças concluídas (SplitModal) antes da aferição
                                        if ((osToMove?.quantidade || 1) > 1) {
                                            setSplitContext({ osId, sourceCol, destCol, osData: osToMove });
                                        } else {
                                            setPendingAfericao({ osId, sourceCol, destCol, osData: osToMove });
                                        }
                                    } else if (sourceCol === 'emCorte' && destCol === 'afericao') {
                                        const osToMove = kanban[sourceCol].find(item => item.id === osId);
                                        const total = osToMove?.quantidade || 1;
                                        // Lote: sempre abre modal de Split (peças concluídas)
                                        if (total > 1) {
                                            setSplitContext({ osId, sourceCol, destCol, osData: osToMove });
                                        } else {
                                            const nowIso = new Date().toISOString();
                                            moveOrdemServico(osId, sourceCol, destCol, {
                                                status: COLUMN_TITLES[destCol],
                                                [`timestampEntrada_${destCol}`]: nowIso
                                            });
                                        }
                                    } else if (destCol === 'aFazer' && (sourceCol === 'setup' || sourceCol === 'emCorte')) {
                                        // Devolver para A fazer: pede confirmação
                                        const osToMove = kanban[sourceCol].find(item => item.id === osId);
                                        setPendingDevolverAFazer({ osId, sourceCol, destCol, osData: osToMove });
                                    } else {
                                        const nowIso = new Date().toISOString();
                                        moveOrdemServico(osId, sourceCol, destCol, {
                                            status: COLUMN_TITLES[destCol],
                                            [`timestampEntrada_${destCol}`]: nowIso
                                        });
                                    }
                                }}
                                onPauseRequest={(osData) => setPauseContext({ osData, colKey: columnKey })}
                                onViewRequest={(osData) => setSelectedOs(osData)}
                                onDeleteRequest={(osData) => setDeleteContext({ osData, colKey: columnKey })}
                            />
                        ))}
                </div>

                {/* MODALS */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Ordem de Serviço" maxWidth="max-w-3xl">
                    <NovaOSForm onClose={() => setIsModalOpen(false)} />
                </Modal>

                {pendingTransition && (
                    <TransitionModal
                        isOpen={!!pendingTransition}
                        onClose={handleCancelTransition}
                        onConfirm={handleConfirmTransition}
                        targetColumnTitle={COLUMN_TITLES[pendingTransition.destCol]}
                        destCol={pendingTransition.destCol}
                        osData={pendingTransition.osData}
                    />
                )}

                <PauseModal
                    isOpen={!!pauseContext}
                    onClose={() => setPauseContext(null)}
                    onConfirm={handleConfirmPause}
                    osData={pauseContext?.osData}
                />

                <SplitModal
                    isOpen={!!splitContext}
                    onClose={() => setSplitContext(null)}
                    onConfirm={handleConfirmSplit}
                    osData={splitContext?.osData}
                />

                <AfericaoModal
                    isOpen={!!pendingAfericao}
                    onClose={handleCancelAfericao}
                    onConfirm={handleConfirmAfericao}
                    osData={pendingAfericao?.osData}
                />

                <AcompanhamentoModal
                    isOpen={!!selectedOs}
                    onClose={() => setSelectedOs(null)}
                    osData={selectedOs}
                    onDeleteRequest={handleDeleteFromModal}
                    onPauseRequest={(osData) => {
                        const colKey = Object.keys(kanban).find(key => kanban[key].some(os => os.id === osData.id));
                        setPauseContext({ osData, colKey });
                    }}
                />

                <ConfirmDeleteModal
                    isOpen={!!deleteContext}
                    onClose={() => setDeleteContext(null)}
                    onConfirm={handleConfirmDelete}
                    osData={deleteContext?.osData}
                />

                <ConfirmDevolverModal
                    isOpen={!!pendingDevolverAFazer}
                    onClose={() => setPendingDevolverAFazer(null)}
                    onConfirm={handleConfirmDevolver}
                    osData={pendingDevolverAFazer?.osData}
                    sourceCol={pendingDevolverAFazer?.sourceCol}
                />

                <ConfirmDevolverCorteModal
                    isOpen={!!pendingDevolverCorteSetup}
                    onClose={() => setPendingDevolverCorteSetup(null)}
                    onConfirm={handleConfirmDevolverCorteSetup}
                />

                <RegraAfericaoModal isOpen={showRegraAfericaoAlert} onClose={() => setShowRegraAfericaoAlert(false)} />

                <MachineOccupiedModal
                    isOpen={!!occupiedMachineAlert}
                    onClose={() => setOccupiedMachineAlert(null)}
                    maquinaName={occupiedMachineAlert?.maquinaName}
                    targetCol={occupiedMachineAlert?.targetCol}
                />

                <ExtraSetupModal
                    isOpen={!!extraSetupContext}
                    onClose={() => setExtraSetupContext(null)}
                    onConfirm={handleConfirmExtraSetup}
                    osData={extraSetupContext?.osData}
                />
            </div>
        </ErrorBoundary>
    );
}
