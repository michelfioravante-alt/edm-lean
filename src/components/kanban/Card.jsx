import React, { useState, useEffect, memo } from 'react';
import { PlayCircle, PauseCircle, Clock, Link as LinkIcon, Copy, Check, Plus } from 'lucide-react';
import { calcularTempoFaseAtual } from '../../utils/manufacturingMath';
import { formatarHoras } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import { COLUMN_LABELS } from '../../constants/cncProcess';

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
function observacaoLegivel(obs, maquinas) {
    if (!obs || typeof obs !== 'string') return obs;
    if (!maquinas?.length) return obs;
    return obs.replace(UUID_REGEX, (uuid) => {
        const m = maquinas.find(maq => maq.id?.toLowerCase() === uuid.toLowerCase());
        return m?.nome || uuid;
    });
}

const Card = ({ data, onPauseRequest, onViewRequest, onTransitionRequest, columnId }) => {
    const { programador: pgLocal, programador_nome, codigoPeca, codigo_peca, cliente, maquina: maqLocal, maquina_nome, operador: opLocal, operador_atual, status, prazoEntrega, prazo_entrega, isPausado, is_pausado, linkDesenho, link_desenho, isPrioridade, is_prioridade, quantidade, quantidade_concluida } = data;
    const updateOrdemServico = useAppStore(state => state.updateOrdemServico);
    const maquinas = useAppStore(state => state.maquinas);

    // Adaptação segura entre o formato antigo local (camelCase) e o novo banco Supabase (snake_case)
    const maquina = maquina_nome || maqLocal;
    const operador = operador_atual || opLocal;
    const programador = programador_nome || pgLocal;
    // Guard against debug JSON blobs accidentally written to link_desenho
    const _rawLink = link_desenho || linkDesenho;
    const linkFinal = (_rawLink && !String(_rawLink).startsWith('{') && !String(_rawLink).startsWith('[')) ? _rawLink : null;
    const resultadoFinal = data.resultado_afericao || data.resultadoAfericao;
    const isPrioridadeFinal = is_prioridade || isPrioridade;
    const isPausadoFinal = !!(is_pausado || isPausado);
    const prazoFinal = prazo_entrega || prazoEntrega;

    const handleProgressInc = (e) => {
        e.stopPropagation();
        const max = quantidade || 1;
        const current = quantidade_concluida || 0;
        if (current >= max) return; // Não permitir passar do total

        const next = current + 1;
        updateOrdemServico(data.id, { quantidade_concluida: next });
    };

    const [nowMs, setNowMs] = useState(Date.now());
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Apenas atualizar o relógio se não estiver concluído ou a fazer
        if (status === 'Concluído' || status === 'A fazer') return;

        // Atualiza a cada minuto para poupar performance, exibe "tempo real" sutil.
        const interval = setInterval(() => {
            setNowMs(Date.now());
        }, 60000);

        return () => clearInterval(interval);
    }, [status]);

    const safePrazo = prazoFinal ? (prazoFinal.includes('T') ? prazoFinal : `${prazoFinal}T12:00:00`) : null;
    const isDueToday = safePrazo ? new Date(safePrazo).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0) : false;
    const isOverdue = safePrazo ? new Date(safePrazo).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) : false;

    const isDueTomorrow = safePrazo ? (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return new Date(safePrazo).setHours(0, 0, 0, 0) === tomorrow.getTime();
    })() : false;

    const accentColor = isPausadoFinal ? 'bg-kanban-amber'
        : isOverdue ? 'bg-kanban-rust'
            : (isDueToday || isDueTomorrow) ? 'bg-kanban-amber'
                : 'bg-kanban-steel';

    const getBadgeStyles = () => {
        if (isPausadoFinal) return 'bg-kanban-amber-dim text-kanban-amber border border-kanban-amber/30';
        if (isOverdue) return 'bg-kanban-rust-dim text-kanban-rust border border-kanban-rust/20';
        switch (status) {
            case 'A fazer': return 'bg-kanban-steel-dim text-kanban-steel border border-kanban-steel/20';
            case 'Set-up': return 'bg-kanban-amber-dim text-kanban-amber border border-kanban-amber/30';
            case 'Em Corte': return 'bg-kanban-teal-dim text-kanban-teal border border-kanban-teal/20';
            case 'Aferição': return 'bg-kanban-violet-dim text-kanban-violet border border-kanban-violet/20';
            case 'Concluído': return 'bg-kanban-green-dim text-kanban-green border border-kanban-green/20';
            default: return 'bg-slate-900 text-slate-400 border border-slate-800';
        }
    };

    const badgeLabel = isPausadoFinal ? 'Pausado' : isOverdue ? 'Atrasado' : isDueToday ? 'Hoje' : status;
    const badgeClass = getBadgeStyles();

    const isOptimistic = !!data._optimistic;

    return (
        <div
            className={`bg-slate-950 border border-slate-800 rounded-lg relative overflow-hidden transition-all duration-150 hover:border-slate-600 hover:-translate-y-[1px] shadow-sm hover:shadow-lg hover:shadow-black/40 group p-0 kanban-card-wrapper ${isOptimistic ? 'kanban-no-drag opacity-90 cursor-wait' : 'cursor-grab active:cursor-grabbing'}`}
            onDoubleClick={() => !isOptimistic && onViewRequest?.(data)}
        >
            {/* Left Accent Line */}
            <div className={`w-1 absolute left-0 top-0 bottom-0 rounded-l-lg ${accentColor}`}></div>

            {isOptimistic && (
                <div className="absolute top-2 right-2 z-20 px-2 py-1 rounded bg-kanban-amber/20 text-kanban-amber border border-kanban-amber/40 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    Salvando…
                </div>
            )}

            <div className="p-4 relative z-10">
                {/* Header (PC ID + G-Code + Molde/Componente + Alerts + Setups) */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Badge de Setor Produtivo (EDM, Torno ou CNC) */}
                        {(data.setor || data.tipo_processo || 'CNC') === 'EDM_FIO' ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 flex items-center gap-1">
                                ⚡ EDM Fio
                            </span>
                        ) : (data.setor || data.tipo_processo) === 'TORNO' ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-950/90 text-amber-400 border border-amber-500/50 flex items-center gap-1">
                                ⚙️ Torno
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-cyan-950/90 text-cyan-400 border border-cyan-500/50 flex items-center gap-1">
                                🌀 CNC
                            </span>
                        )}

                        <span className="text-xs font-bold tracking-widest uppercase text-slate-400 font-mono">
                            PC: {codigo_peca || codigoPeca || 'S/N'}
                        </span>
                        {(data.codigo_molde || data.codigoMolde) && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Molde: {data.codigo_molde || data.codigoMolde}
                            </span>
                        )}
                        {(data.componente_molde || data.componenteMolde) && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold text-slate-300 bg-slate-900 border border-slate-800">
                                {data.componente_molde || data.componenteMolde}
                            </span>
                        )}
                        {(data.numero_programa || data.numeroPrograma) && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-kanban-amber/20 text-kanban-amber border border-kanban-amber/30">
                                Prog: {data.numero_programa || data.numeroPrograma}
                            </span>
                        )}
                        {data.aguardando_tt && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                                🔥 Aguardando Retorno T.T.
                            </span>
                        )}
                        {(data.is_retrabalho || data.isRetrabalho) && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                🛠️ Retrabalho / Ajuste
                            </span>
                        )}
                        {(data.total_setups || data.totalSetups) > 1 && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-slate-800 text-slate-200 border border-slate-700">
                                {data.nomes_setups?.[(data.setup_atual || data.setupAtual || 1) - 1] || `OP${(data.setup_atual || data.setupAtual || 1) * 10}`} ({(data.setup_atual || data.setupAtual || 1)}/{data.total_setups || data.totalSetups})
                            </span>
                        )}
                        {data.parent_id && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest bg-kanban-amber/20 text-kanban-amber border border-kanban-amber/30">
                                Complementar
                            </span>
                        )}
                        {resultadoFinal && (
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest ${resultadoFinal === 'Aprovada' ? 'bg-kanban-green/20 text-kanban-green' : 'bg-red-500/20 text-red-500'}`}>
                                {resultadoFinal}
                            </span>
                        )}
                    </div>
                </div>

                {/* Cliente / Title */}
                <h4 className="text-base font-bold text-white mb-2 tracking-wide truncate" title={cliente}>
                    {cliente || 'Sem Cliente'}
                </h4>

                {/* Badge de Prioridade sob o Cliente */}
                {isPrioridadeFinal && (
                    <div className="mb-3">
                        <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-500 border border-red-500/30 rounded-md text-[10px] font-black uppercase tracking-widest animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                            <svg width="10" height="10" viewBox="0 0 14 14" fill="currentColor">
                                <path d="M7 1L8.85 5.25L13.5 5.8L10 9.1L10.9 13.5L7 11.25L3.1 13.5L4 9.1L0.5 5.8L5.15 5.25L7 1Z" />
                            </svg>
                            Prioridade
                        </span>
                    </div>
                )}

                {/* Metadata List */}
                <div className="flex flex-col gap-2 mb-4">
                    {prazoFinal && (
                        <div className={`flex items-center gap-2 text-xs font-semibold tracking-wide ${isOverdue ? 'text-kanban-rust font-bold' : 'text-slate-400'}`}>
                            <svg width="12" height="12" viewBox="0 0 9 9" fill="none">
                                <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.1" />
                                <path d="M4.5 2.5V4.5L5.8 5.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                            </svg>
                            Entrega: {new Date(prazoFinal.includes('T') ? prazoFinal : `${prazoFinal}T12:00:00`).toLocaleDateString('pt-BR')} {isOverdue ? '· ATRASADO' : isDueToday ? '· HOJE' : ''}
                        </div>
                    )}
                    {maquina && (
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400">
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                                <rect x="1" y="1.5" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1.1" />
                                <path d="M3 1V2.5M6 1V2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                            </svg>
                            Máquina: {maquina}
                        </div>
                    )}
                    {operador && (
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-kanban-blue">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Op: {operador}
                        </div>
                    )}
                    {programador && (
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Prog: {programador}
                        </div>
                    )}
                    {quantidade > 1 && (
                        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-700/50 rounded-lg p-2 mt-1">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-kanban-teal animate-pulse"></div>
                                <span className="text-[11px] font-black text-slate-200 uppercase tracking-widest">
                                    Lote: {quantidade_concluida || 0} / {quantidade} <span className="text-[9px] text-slate-500 font-bold ml-1">concluídas</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {status === 'Em Corte' && !isPausadoFinal && (
                                    <button
                                        onClick={handleProgressInc}
                                        className="bg-kanban-teal text-slate-950 p-1 rounded hover:bg-teal-400 transition-all active:scale-90 shadow-sm flex items-center gap-1"
                                        title="Marcar +1 peça pronta"
                                    >
                                        <Plus className="w-3.5 h-3.5 stroke-[4px]" />
                                        <span className="text-[9px] font-black uppercase whitespace-nowrap">Pronta</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {linkFinal && (
                        <div
                            className="flex items-center justify-between bg-slate-900 border border-slate-700/50 rounded p-1.5 mt-1 cursor-pointer hover:bg-slate-800 transition-colors group/link"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(linkFinal);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            title="Copiar Caminho do Desenho"
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-[10px] font-mono text-slate-400 truncate tracking-tight">{linkFinal}</span>
                            </div>
                            <div className="shrink-0 pl-2">
                                {copied ? <Check className="w-3.5 h-3.5 text-kanban-green" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover/link:text-kanban-amber" />}
                            </div>
                        </div>
                    )}

                    {/* ALERTA DE PAUSA (MOTIVO E OBS) */}
                    {isPausadoFinal && (
                        <div className="mt-3 p-3 bg-kanban-amber/10 border-l-4 border-kanban-amber rounded-r-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <PauseCircle className="w-4 h-4 text-kanban-amber" />
                                <span className="text-[10px] font-black uppercase text-kanban-amber tracking-tighter">Motivo da Pausa</span>
                            </div>
                            <p className="text-xs font-bold text-slate-200 mb-1 leading-tight">
                                {data.motivo_pausa || data.motivoPausa || 'Não informado'}
                            </p>
                            {(data.observacao_pausa || data.observacaoPausa) && (
                                <p className="text-[10px] text-slate-400 italic leading-tight border-t border-kanban-amber/20 pt-1">
                                    "{observacaoLegivel(data.observacao_pausa || data.observacaoPausa, maquinas)}"
                                </p>
                            )}
                        </div>
                    )}
                </div>


                {/* Footer Status */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold tracking-widest uppercase px-2 py-1 rounded-[4px] ${badgeClass}`}>
                            {badgeLabel}
                        </span>
                        {!(status === 'A fazer' || status === 'Concluído') && (
                            <span className="text-xs text-slate-400 font-bold tracking-wide flex items-center gap-1.5" title="Tempo investido na fase atual">
                                <Clock className="w-3.5 h-3.5 text-kanban-amber" />
                                {formatarHoras(calcularTempoFaseAtual(data, status, nowMs))}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {!(status === 'A fazer' || status === 'Concluído') && (
                            <button
                                className="text-slate-500 hover:text-white transition-colors p-[2px] cursor-pointer"
                                title={isPausadoFinal ? "Retomar Produção" : "Pausar OS"}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPauseRequest?.(data);
                                }}
                            >
                                {isPausadoFinal ? (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-kanban-green">
                                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                                        <path d="M5.5 4.5v5l4-2.5-4-2.5z" fill="currentColor" />
                                    </svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-kanban-amber">
                                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                                        <path d="M5.5 5v4M8.5 5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Quick Move Actions - oculto enquanto a O.S. está sendo salva (otimista) */}
                {!isOptimistic && (
                <div className="kanban-no-drag md:hidden grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 touch-manipulation"
                    onClick={(e) => e.stopPropagation()}
                >
                    {(() => {
                        const ORDER = ['aFazer', 'setup', 'emCorte', 'afericao', 'concluido'];
                        const LABELS = COLUMN_LABELS;
                        const currentIndex = ORDER.indexOf(columnId);

                        let prevStage = currentIndex > 0 ? ORDER[currentIndex - 1] : null;
                        const nextStage = currentIndex < ORDER.length - 1 ? ORDER[currentIndex + 1] : null;
                        if (columnId === 'afericao') prevStage = 'setup';
                        if (columnId === 'concluido') prevStage = null;

                        const handleMove = (destCol) => {
                            if (destCol && onTransitionRequest) onTransitionRequest(data.id, columnId, destCol);
                        };

                        return (
                            <>
                                {prevStage ? (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleMove(prevStage); }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="flex items-center justify-center gap-1.5 py-3 px-2 min-h-[48px] bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-tighter text-slate-400 active:bg-slate-800 active:scale-95 transition-all touch-manipulation"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m15 18-6-6 6-6" />
                                        </svg>
                                        <span>Voltar p/ {LABELS[prevStage]}</span>
                                    </button>
                                ) : <div />}

                                {nextStage ? (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleMove(nextStage); }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="flex items-center justify-center gap-1.5 py-3 px-2 min-h-[48px] bg-kanban-blue/10 border border-kanban-blue/30 rounded-lg text-[10px] font-black uppercase tracking-tighter text-kanban-blue active:bg-kanban-blue/20 active:scale-95 transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)] touch-manipulation"
                                    >
                                        <span>Mover p/ {LABELS[nextStage]}</span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </button>
                                ) : <div />}
                            </>
                        );
                    })()}
                </div>
                )}
            </div>
        </div>
    );
};

export default memo(Card);
