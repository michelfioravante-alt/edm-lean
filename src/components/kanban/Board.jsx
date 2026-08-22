import React, { useState, useEffect } from 'react';
import Column from './Column';
import Button from '../common/Button';
import NovaOSForm from './NovaOSForm';
import ProgramarKanbanModal from './ProgramarKanbanModal';
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
import { Plus, Lock, Cpu, Zap, RotateCw, Factory, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { KANBAN_COLUMNS } from '../../constants/cncProcess';
import { SECTORS } from '../../constants/sectorConstants';
import { kanbanPrecisaProgramar, todosKanbans } from '../../constants/osWorkflow';
import FolhaProcessoModal from './FolhaProcessoModal';
import { SETORES_PROGRAMADOR, setorPermitido } from '../../constants/roles';

export default function Board() {
    // Seletores granulares
    const kanban = useAppStore(state => state.kanban);
    const estoque = useAppStore(state => state.estoque);
    const kanbanStage = useAppStore(state => state.kanbanStage);
    const activeSector = useAppStore(state => state.activeSector);
    const setActiveSector = useAppStore(state => state.setActiveSector);

    const role = useAuthStore(state => state.role);
    const setorPadrao = useAuthStore(state => state.setorPadrao);
    const isGestor = role === 'admin';

    useEffect(() => {
        if (!isGestor && !setorPermitido(role, activeSector)) {
            const fallback = SETORES_PROGRAMADOR.includes(setorPadrao) ? setorPadrao : 'CNC';
            setActiveSector(fallback);
        }
    }, [isGestor, role, activeSector, setorPadrao, setActiveSector]);

    const moveOrdemServico = useAppStore(state => state.moveOrdemServico);
    const togglePausaOrdemServico = useAppStore(state => state.togglePausaOrdemServico);
    const deleteOrdemServico = useAppStore(state => state.deleteOrdemServico);

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
    const [programarOs, setProgramarOs] = useState(null);
    const [transitionError, setTransitionError] = useState(null);
    const [pendingDevolverAFazer, setPendingDevolverAFazer] = useState(null);
    const [pendingDevolverCorteSetup, setPendingDevolverCorteSetup] = useState(null);
    const [folhasPrint, setFolhasPrint] = useState(null);
    const destaqueOsId = useAppStore((s) => s.destaqueOsId);
    const limparDestaqueOs = useAppStore((s) => s.limparDestaqueOs);
    const osDeepLinkId = useAppStore((s) => s.osDeepLinkId);
    const setOsDeepLinkId = useAppStore((s) => s.setOsDeepLinkId);
    const irParaKanban = useAppStore((s) => s.irParaKanban);

    useEffect(() => {
        if (!destaqueOsId) return;
        const t = setTimeout(() => limparDestaqueOs(), 8000);
        return () => clearTimeout(t);
    }, [destaqueOsId, limparDestaqueOs]);

    useEffect(() => {
        if (!osDeepLinkId) return;
        const found = todosKanbans(kanban).find((o) => String(o.id) === String(osDeepLinkId));
        if (!found) return;
        irParaKanban(found);
        setSelectedOs(found);
        setOsDeepLinkId(null);
    }, [osDeepLinkId, kanban, irParaKanban, setOsDeepLinkId]);

    // Memoização simples da contagem de estoque
    const lowStockCount = (estoque || []).filter(item => item.quantidade <= item.alerta_minimo).length;

    const handleConfirmPause = (pauseData) => {
        if (pauseContext) {
            const state = useAppStore.getState();
            const { osData, colKey } = pauseContext;

            if (pauseData?.tipo === 'faltaEnergiaRetroativa') {
                if (pauseData.aplicarGlobal) {
                    state.registrarPausaRetroativaFaltaEnergiaGlobal(pauseData);
                } else {
                    state.registrarPausaRetroativaFaltaEnergia(osData.id, colKey, pauseData);
                }
                setPauseContext(null);
                return;
            }

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

    // Dados calculados para os KPIs
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
    const totalConcluidasHoje = filteredConcluido.filter(os => {
        const ts = os.timestamp_entrada_concluido || os.timestampEntrada_concluido;
        return ts && new Date(ts).toDateString() === new Date().toDateString();
    }).length;

    const sectorLabelShort = activeSector === 'EDM_FIO' ? 'centro EDM' : activeSector === 'TORNO' ? 'torno CNC' : activeSector === 'CNC' ? 'centro CNC' : 'toda a fábrica';

    return (
        <ErrorBoundary>
            <div className="h-full flex flex-col relative">
                <div className="flex flex-col space-y-4 kanban-col-animate">
                {transitionError && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[#C85558] text-white px-4 py-2.5 rounded-[7px] shadow-2xl text-xs font-semibold animate-in fade-in duration-200 max-w-[90vw] border border-[#C85558]">
                        {transitionError}
                    </div>
                )}

                {/* FLOATING ACTION BUTTON (MOBILE ONLY) */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="md:hidden fixed bottom-20 right-5 z-50 bg-[#D97D3D] text-[#111318] w-12 h-12 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border border-[#111318] cursor-pointer"
                    aria-label="Nova Ordem de Serviço"
                >
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>

                {/* 1. SECTOR SELECTOR — SEGMENTED CONTROL */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#262A33]">
                    {isGestor ? (
                        <div className="selector-bar py-1">
                            <button type="button" onClick={() => setActiveSector('EDM_FIO')} className={`sel-btn ${activeSector === 'EDM_FIO' ? 'active' : ''}`}>Eletroerosão (EDM)</button>
                            <button type="button" onClick={() => setActiveSector('CNC')} className={`sel-btn ${activeSector === 'CNC' ? 'active' : ''}`}>Centro CNC</button>
                            <button type="button" onClick={() => setActiveSector('TORNO')} className={`sel-btn ${activeSector === 'TORNO' ? 'active' : ''}`}>Torno CNC</button>
                            <button type="button" onClick={() => setActiveSector('RETIFICA')} className={`sel-btn ${activeSector === 'RETIFICA' ? 'active' : ''}`}>Retífica</button>
                            <button type="button" onClick={() => setActiveSector('EXTERNO')} className={`sel-btn ${activeSector === 'EXTERNO' ? 'active' : ''}`}>Externo</button>
                            <button type="button" onClick={() => setActiveSector('TODOS')} className={`sel-btn ${activeSector === 'TODOS' ? 'active' : ''}`}>Visão Geral</button>
                        </div>
                    ) : (
                        <div className="selector-bar py-1">
                            <button type="button" onClick={() => setActiveSector('CNC')} className={`sel-btn ${activeSector === 'CNC' ? 'active' : ''}`}>Centro CNC</button>
                            <button type="button" onClick={() => setActiveSector('EDM_FIO')} className={`sel-btn ${activeSector === 'EDM_FIO' ? 'active' : ''}`}>Eletroerosão (EDM)</button>
                        </div>
                    )}

                    {/* Botão Nova OS Desktop */}
                    <div className="hidden sm:flex items-center">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setIsModalOpen(true)}
                            className="gap-1.5 shadow-sm"
                        >
                            <Plus className="w-4 h-4 stroke-[2.2]" />
                            <span>Nova OS</span>
                        </Button>
                    </div>
                </div>

                {/* 2. DENSE KPI DATA STRIP (TABLE-LIKE ROW) */}
                <div className="kpi-strip">
                    <div className="kpi-cell">
                        <div className="kpi-label">OS Ativas</div>
                        <div className="kpi-value">{totalAtivas}</div>
                        <div className="kpi-sub">no {sectorLabelShort}</div>
                    </div>
                    <div className="kpi-cell">
                        <div className="kpi-label">Usinagem</div>
                        <div className="kpi-value ok">{filteredEmCorte.length}</div>
                    </div>
                    <div className="kpi-cell">
                        <div className="kpi-label">Concl. Hoje</div>
                        <div className="kpi-value ok">{totalConcluidasHoje}</div>
                    </div>
                    <div className="kpi-cell">
                        <div className="kpi-label">Atraso</div>
                        <div className={`kpi-value ${totalEmAtraso > 0 ? 'alert' : ''}`}>{totalEmAtraso}</div>
                    </div>
                    <div className="kpi-cell">
                        <div className="kpi-label">Alerta Estoque</div>
                        <div className={`kpi-value ${lowStockCount > 0 ? 'alert' : ''}`}>{lowStockCount}</div>
                    </div>
                </div>

                {/* 3. KANBAN COLUMNS */}
                <div className="flex flex-col md:flex-row gap-3 pb-12 items-center md:items-stretch flex-1 w-full md:w-max md:min-w-full md:snap-scroll-x justify-center">
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
                                        if (sourceCol === 'aFazer' && kanbanPrecisaProgramar(osToMove)) {
                                            setTransitionError('Este kanban ainda não foi programado. Programe no A fazer antes do set-up.');
                                            setProgramarOs(osToMove);
                                            setTimeout(() => setTransitionError(null), 4000);
                                            return;
                                        }
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
                                    } else if (destCol === 'aFazer' && (sourceCol === 'setup' || sourceCol === 'emCorte' || sourceCol === 'afericao')) {
                                        const osToMove = kanban[sourceCol]?.find(item => item.id === osId);
                                        setPendingDevolverAFazer({ osId, sourceCol, destCol, osData: osToMove });
                                    } else if (destCol === 'concluido' && sourceCol === 'afericao') {
                                        const osToMove = kanban[sourceCol]?.find(item => item.id === osId);
                                        if ((osToMove?.quantidade || 1) > 1) {
                                            setSplitContext({ osId, sourceCol, destCol, osData: osToMove });
                                        } else {
                                            setPendingAfericao({ osId, sourceCol, destCol, osData: osToMove });
                                        }
                                    } else {
                                        const osToMove = kanban[sourceCol]?.find(item => item.id === osId);
                                        if ((osToMove?.quantidade || 1) > 1 && destCol === 'concluido') {
                                            setSplitContext({ osId, sourceCol, destCol, osData: osToMove });
                                        } else {
                                            const nowIso = new Date().toISOString();
                                            moveOrdemServico(osId, sourceCol, destCol, {
                                                status: COLUMN_TITLES[destCol],
                                                [`timestampEntrada_${destCol}`]: nowIso
                                            }).catch((err) => {
                                                console.error("Erro ao mover O.S.:", err);
                                                setTransitionError(err?.message || "Falha ao salvar.");
                                                setTimeout(() => setTransitionError(null), 4000);
                                            });
                                        }
                                    }
                                }}
                                onPauseRequest={(osData) => {
                                    const sourceCol = Object.keys(kanban).find(key => kanban[key].some(item => item.id === osData.id));
                                    if (sourceCol) setPauseContext({ osData, colKey: sourceCol });
                                }}
                                onViewRequest={(osData) => setSelectedOs(osData)}
                                onProgramarRequest={(osData) => setProgramarOs(osData)}
                            />
                        ))}
                </div>
                </div>

                {/* MODAIS DO FLUXO */}
                <NovaOSForm
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onCreated={(lista) => setFolhasPrint(lista)}
                />
                {folhasPrint && (
                    <FolhaProcessoModal osList={folhasPrint} onClose={() => setFolhasPrint(null)} />
                )}

                <ProgramarKanbanModal
                    isOpen={!!programarOs}
                    osData={programarOs}
                    onClose={() => setProgramarOs(null)}
                />

                {pendingTransition && (
                    <TransitionModal
                        isOpen={!!pendingTransition}
                        osData={pendingTransition.osData}
                        sourceCol={pendingTransition.sourceCol}
                        destCol={pendingTransition.destCol}
                        onConfirm={handleConfirmTransition}
                        onCancel={() => setPendingTransition(null)}
                    />
                )}

                {pauseContext && (
                    <PauseModal
                        isOpen={!!pauseContext}
                        osData={pauseContext.osData}
                        columnId={pauseContext.colKey}
                        onConfirm={handleConfirmPause}
                        onClose={() => setPauseContext(null)}
                    />
                )}

                {pendingAfericao && (
                    <AfericaoModal
                        isOpen={!!pendingAfericao}
                        osData={pendingAfericao.osData}
                        onConfirm={handleConfirmAfericao}
                        onClose={() => setPendingAfericao(null)}
                    />
                )}

                {selectedOs && (
                    <AcompanhamentoModal
                        isOpen={!!selectedOs}
                        osData={selectedOs}
                        onClose={() => setSelectedOs(null)}
                        onDelete={handleDeleteFromModal}
                        onPauseRequest={(osData) => {
                            const sourceCol = Object.keys(kanban).find(key => kanban[key].some(item => item.id === osData.id));
                            if (sourceCol) setPauseContext({ osData, colKey: sourceCol });
                        }}
                    />
                )}

                {deleteContext && (
                    <ConfirmDeleteModal
                        isOpen={!!deleteContext}
                        onConfirm={handleConfirmDelete}
                        onClose={() => setDeleteContext(null)}
                    />
                )}

                {pendingDevolverAFazer && (
                    <ConfirmDevolverModal
                        isOpen={!!pendingDevolverAFazer}
                        onConfirm={handleConfirmDevolver}
                        onClose={() => setPendingDevolverAFazer(null)}
                    />
                )}

                {pendingDevolverCorteSetup && (
                    <ConfirmDevolverCorteModal
                        isOpen={!!pendingDevolverCorteSetup}
                        onConfirm={handleConfirmDevolverCorteSetup}
                        onClose={() => setPendingDevolverCorteSetup(null)}
                    />
                )}

                {showRegraAfericaoAlert && (
                    <RegraAfericaoModal
                        isOpen={showRegraAfericaoAlert}
                        onClose={() => setShowRegraAfericaoAlert(false)}
                    />
                )}

                {occupiedMachineAlert && (
                    <MachineOccupiedModal
                        isOpen={!!occupiedMachineAlert}
                        maquinaNome={occupiedMachineAlert.maquinaName}
                        targetCol={occupiedMachineAlert.targetCol}
                        onClose={() => setOccupiedMachineAlert(null)}
                    />
                )}

                {extraSetupContext && (
                    <ExtraSetupModal
                        isOpen={!!extraSetupContext}
                        osData={extraSetupContext.osData}
                        onConfirm={handleConfirmExtraSetup}
                        onClose={() => setExtraSetupContext(null)}
                    />
                )}

                {splitContext && (
                    <SplitModal
                        isOpen={!!splitContext}
                        osData={splitContext.osData}
                        destCol={splitContext.destCol}
                        onConfirm={handleConfirmSplit}
                        onClose={() => setSplitContext(null)}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
}
