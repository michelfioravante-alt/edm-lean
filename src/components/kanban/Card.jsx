import React, { useState, useEffect, memo } from 'react';
import { 
    Calendar, User, Monitor, Clock, Link as LinkIcon, 
    Copy, Check, Plus, ArrowRight, ArrowLeft, Eye, 
    Pause, Play, AlertCircle, Cpu, Zap, RotateCw 
} from 'lucide-react';
import { calcularTempoFaseAtual } from '../../utils/manufacturingMath';
import { formatarHoras } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { kanbanPrecisaProgramar, labelSetor, custoHoraKanban, listarKanbansDoGrupo } from '../../constants/osWorkflow';

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
function observacaoLegivel(obs, maquinas) {
    if (!obs || typeof obs !== 'string') return obs;
    if (!maquinas?.length) return obs;
    return obs.replace(UUID_REGEX, (uuid) => {
        const m = maquinas.find(maq => maq.id?.toLowerCase() === uuid.toLowerCase());
        return m?.nome || uuid;
    });
}

const Card = ({ data, columnId, onViewRequest, onTransitionRequest, onPauseRequest, onProgramarRequest }) => {
    const destaqueOsId = useAppStore((s) => s.destaqueOsId);
    const isDestaque = destaqueOsId && data.id === destaqueOsId;
    const {
        status,
        codigo_peca,
        codigoPeca,
        maquina_nome,
        maquina: maqLocal,
        operador_atual,
        operador: opLocal,
        programador_nome,
        programador: pgLocal,
        link_desenho,
        linkDesenho,
        quantidade_concluida,
        quantidade,
        is_prioridade,
        isPrioridade,
        is_pausado,
        isPausado,
        prazo_entrega,
        prazoEntrega,
        cliente,
        codigo_molde,
        codigoMolde,
        numero_programa,
        numeroPrograma,
        componente_molde,
        componenteMolde,
        descricao_peca,
        descricaoPeca,
        setor,
        tipo_processo
    } = data;

    const updateOrdemServico = useAppStore(state => state.updateOrdemServico);
    const maquinas = useAppStore(state => state.maquinas);
    const kanban = useAppStore(state => state.kanban);
    const configuracoesGlobais = useAppStore(state => state.configuracoesGlobais);
    const precisaProgramar = kanbanPrecisaProgramar(data);
    const irmaos = listarKanbansDoGrupo(kanban, data);
    const custoInfo = custoHoraKanban(data, configuracoesGlobais || {});
    const role = useAuthStore((s) => s.role);
    const isGestor = role === 'admin';

    const maquina = maquina_nome || maqLocal;
    const operador = operador_atual || opLocal;
    const programador = programador_nome || pgLocal;
    const molde = codigo_molde || codigoMolde;
    const programa = numero_programa || numeroPrograma;
    const pecaDesc = componente_molde || componenteMolde || descricao_peca || descricaoPeca;
    const codPeca = codigo_peca || codigoPeca || 'S/N';
    const osSetor = setor || tipo_processo || 'CNC';

    const _rawLink = link_desenho || linkDesenho;
    const linkFinal = (_rawLink && !String(_rawLink).startsWith('{') && !String(_rawLink).startsWith('[')) ? _rawLink : null;
    const isPrioridadeFinal = !!(is_prioridade || isPrioridade);
    const isPausadoFinal = !!(is_pausado || isPausado);
    const prazoFinal = prazo_entrega || prazoEntrega;

    const [nowMs, setNowMs] = useState(Date.now());
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (status === 'Concluído' || status === 'A fazer') return;
        const interval = setInterval(() => {
            setNowMs(Date.now());
        }, 60000);
        return () => clearInterval(interval);
    }, [status]);

    const safePrazo = prazoFinal ? (prazoFinal.includes('T') ? prazoFinal : `${prazoFinal}T12:00:00`) : null;
    const isOverdue = safePrazo ? new Date(safePrazo).getTime() < new Date().setHours(0, 0, 0, 0) && status !== 'Concluído' : false;
    const isDueToday = safePrazo ? new Date(safePrazo).toDateString() === new Date().toDateString() && status !== 'Concluído' : false;

    const handleProgressInc = (e) => {
        e.stopPropagation();
        const max = quantidade || 1;
        const current = quantidade_concluida || 0;
        if (current >= max) return;
        updateOrdemServico(data.id, { quantidade_concluida: current + 1 });
    };

    // Ícone da máquina de acordo com setor
    const getMachineIcon = () => {
        if (osSetor === 'EDM_FIO') return Zap;
        if (osSetor === 'TORNO') return RotateCw;
        return Cpu;
    };
    const MachineIcon = getMachineIcon();

    const getMachineLabel = () => labelSetor(osSetor);

    // Status tag no canto superior direito
    const getStatusTag = () => {
        if (isPausadoFinal) {
            return <span className="text-[9.5px] font-semibold uppercase tracking-[0.4px] px-2 py-0.5 rounded-[4px] text-[#C99A4A] bg-[rgba(201,154,74,0.12)] border border-[#C99A4A]/30">Pausado</span>;
        }
        if (isPrioridadeFinal) {
            return <span className="text-[9.5px] font-semibold uppercase tracking-[0.4px] px-2 py-0.5 rounded-[4px] text-[#C85558] bg-[rgba(200,85,88,0.1)] border border-[#C85558]/30">Prioridade</span>;
        }
        if (isOverdue) {
            return <span className="text-[9.5px] font-semibold uppercase tracking-[0.4px] px-2 py-0.5 rounded-[4px] text-[#C85558] bg-[rgba(200,85,88,0.1)]">Atrasada</span>;
        }
        if (status === 'Concluído') {
            return <span className="text-[9.5px] font-semibold uppercase tracking-[0.4px] px-2 py-0.5 rounded-[4px] text-[#4A9D74] bg-[rgba(74,157,116,0.1)]">Concluído</span>;
        }
        return <span className="text-[9.5px] font-semibold uppercase tracking-[0.4px] px-2 py-0.5 rounded-[4px] text-[#7B808F] bg-[#111318] border border-[#333844]">{status}</span>;
    };

    const isOptimistic = !!data._optimistic;

    // Próxima e anterior coluna para navegação rápida
    const ORDER = ['aFazer', 'setup', 'emCorte', 'afericao', 'concluido'];
    const currentIndex = ORDER.indexOf(columnId);
    let prevStage = currentIndex > 0 ? ORDER[currentIndex - 1] : null;
    const nextStage = currentIndex < ORDER.length - 1 ? ORDER[currentIndex + 1] : null;
    if (columnId === 'afericao') prevStage = 'setup';
    if (columnId === 'concluido') prevStage = null;

    const handleMoveAction = (e, destCol) => {
        e.stopPropagation();
        if (destCol && onTransitionRequest) {
            onTransitionRequest(data.id, columnId, destCol);
        }
    };

    const hasMetaTable = molde || programa || (data.total_setups > 1);
    const qtdTotal = quantidade || 1;
    const qtdProntas = quantidade_concluida || 0;
    const progressPct = Math.min(100, Math.round((qtdProntas / qtdTotal) * 100));

    return (
        <div
            className={`bg-[#181B22] border rounded-[10px] overflow-hidden transition-all duration-150 hover:border-[#333844] group ${
                isDestaque ? 'border-[#D97D3D] ring-1 ring-[#D97D3D]/40' : (isPrioridadeFinal ? 'border-[#C85558]/50' : 'border-[#262A33]')
            } ${isPrioridadeFinal ? 'border-l-[3px] border-l-[#C85558]' : ''} ${isOptimistic ? 'opacity-80 cursor-wait' : 'cursor-grab active:cursor-grabbing'}`}
            onDoubleClick={() => !isOptimistic && onViewRequest?.(data)}
            onClick={(e) => {
                if (window.innerWidth < 768 && !isOptimistic && !e.target.closest('button') && !e.target.closest('a')) {
                    onViewRequest?.(data);
                }
            }}
        >
            {/* 1. CARD HEADER (Identificação Técnica) */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#1F232B] border-b border-[#262A33]">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center gap-1 text-[10.5px] font-semibold text-[#D97D3D] uppercase tracking-[0.3px] shrink-0">
                        <MachineIcon className="w-3 h-3 stroke-[1.8]" />
                        <span>{getMachineLabel()}</span>
                    </div>
                    <span className="font-['IBM_Plex_Mono'] text-[11px] text-[#9DA2AE] truncate">
                        {codPeca}
                    </span>
                </div>
                <div className="shrink-0">
                    {getStatusTag()}
                </div>
            </div>

            {/* 2. CARD BODY (Conteúdo & Metadados) */}
            <div className="p-3.5">
                {/* Nome do Cliente */}
                <h4 className="font-['Space_Grotesk'] font-semibold text-[14.5px] text-[#E7E9ED] leading-tight mb-1 truncate" title={cliente}>
                    {cliente || 'Cliente não informado'}
                </h4>
                <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#333844] text-[#9DA2AE]">{labelSetor(osSetor)}</span>
                    {precisaProgramar && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#C99A4A]/40 text-[#C99A4A]">A programar</span>
                    )}
                    {irmaos.length > 1 && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#262A33] text-[#7B808F]">{irmaos.length} kanbans nesta O.S.</span>
                    )}
                    {isGestor && custoInfo.custo > 0 && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#262A33] text-[#D97D3D]">
                            R$ {custoInfo.custo.toFixed(0)} ({custoInfo.horas.toFixed(1)}h)
                        </span>
                    )}
                </div>

                {/* Descrição da Peça / Componente */}
                {pecaDesc ? (
                    <div className="text-[12px] text-[#7B808F] mb-2 line-clamp-2">
                        {pecaDesc}
                    </div>
                ) : (
                    <div className="h-1 mb-2"></div>
                )}
                {(data.observacoes) && (
                    <p className="text-[11px] text-[#9DA2AE] mb-2 line-clamp-2 italic">{data.observacoes}</p>
                )}

                {/* Mini-tabela de dados técnicos */}
                {hasMetaTable && (
                    <div className="border border-[#262A33] rounded-[7px] overflow-hidden mb-3 text-[11.5px]">
                        {molde && (
                            <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-[#262A33] bg-[rgba(255,255,255,0.015)]">
                                <span className="text-[#565B68] font-medium">Molde</span>
                                <span className="font-['IBM_Plex_Mono'] text-[#9DA2AE] text-right font-medium truncate max-w-[170px]">{molde}</span>
                            </div>
                        )}
                        {programa && (
                            <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-[#262A33] last:border-b-0 bg-transparent">
                                <span className="text-[#565B68] font-medium">Programa</span>
                                <span className="font-['IBM_Plex_Mono'] text-[#9DA2AE] text-right font-medium truncate max-w-[170px]">{programa}</span>
                            </div>
                        )}
                        {(data.total_setups > 1) && (
                            <div className="flex justify-between items-center px-2.5 py-1.5 bg-[rgba(255,255,255,0.015)]">
                                <span className="text-[#565B68] font-medium">Setup</span>
                                <span className="font-['IBM_Plex_Mono'] text-[#9DA2AE] text-right font-medium">
                                    {data.nomes_setups?.[(data.setup_atual || 1) - 1] || `OP${(data.setup_atual || 1) * 10}`} ({(data.setup_atual || 1)}/{data.total_setups})
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Barra de Progresso de Lote (quando quantidade > 1) */}
                {qtdTotal > 1 && (
                    <div className="flex items-center gap-2 my-2.5 py-1 px-2 rounded-[6px] bg-[#111318] border border-[#262A33]">
                        <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#565B68] font-semibold">LOTE</span>
                        <div className="flex-1 h-[4px] bg-[#1F232B] rounded-[2px] overflow-hidden border border-[#262A33]">
                            <div className="h-full bg-[#4A9D74]" style={{ width: `${progressPct}%` }}></div>
                        </div>
                        <span className="font-['IBM_Plex_Mono'] text-[10.5px] text-[#9DA2AE] font-medium">
                            {qtdProntas}/{qtdTotal}
                        </span>
                        {status === 'Em Corte' && !isPausadoFinal && (
                            <button
                                onClick={handleProgressInc}
                                className="text-[#4A9D74] hover:text-white p-0.5 rounded transition-colors ml-0.5 cursor-pointer"
                                title="Marcar +1 pronta"
                            >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                        )}
                    </div>
                )}

                {/* Linhas de Informações Secundárias */}
                <div className="space-y-1.5 text-[11.5px] text-[#7B808F] mb-3">
                    {prazoFinal && (
                        <div className={`flex items-center gap-2 ${isOverdue ? 'text-[#C85558] font-semibold' : isDueToday ? 'text-[#C99A4A] font-semibold' : ''}`}>
                            <Calendar className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span>
                                Entrega {new Date(prazoFinal.includes('T') ? prazoFinal : `${prazoFinal}T12:00:00`).toLocaleDateString('pt-BR')}
                                {isOverdue && ' (Atrasada)'}
                                {isDueToday && ' (Hoje)'}
                            </span>
                        </div>
                    )}

                    {maquina && (
                        <div className="flex items-center gap-2">
                            <Monitor className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span className="truncate">{maquina}</span>
                        </div>
                    )}

                    {operador && (
                        <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span className="truncate">{operador}</span>
                        </div>
                    )}

                    {!(status === 'A fazer' || status === 'Concluído') && (
                        <div className="flex items-center justify-between pt-1 text-[11px] text-[#565B68] font-['IBM_Plex_Mono']">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                Tempo na etapa: {formatarHoras(calcularTempoFaseAtual(data, status, nowMs))}
                            </span>
                            {onPauseRequest && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPauseRequest(data);
                                    }}
                                    className="p-1 hover:text-[#E7E9ED] transition-colors cursor-pointer"
                                    title={isPausadoFinal ? "Retomar" : "Pausar"}
                                >
                                    {isPausadoFinal ? <Play className="w-3 h-3 text-[#4A9D74]" /> : <Pause className="w-3 h-3 text-[#C99A4A]" />}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Alerta de Pausa */}
                {isPausadoFinal && (
                    <div className="mb-3 p-2.5 bg-[rgba(201,154,74,0.1)] border-l-2 border-[#C99A4A] rounded-r-[6px] text-xs">
                        <div className="flex items-center gap-1.5 text-[#C99A4A] font-semibold text-[10.5px] uppercase tracking-wider mb-0.5">
                            <AlertCircle className="w-3 h-3" />
                            <span>Pausa: {data.motivo_pausa || data.motivoPausa || 'Não informado'}</span>
                        </div>
                        {(data.observacao_pausa || data.observacaoPausa) && (
                            <p className="text-[10px] text-[#9DA2AE] italic leading-tight mt-1">
                                "{observacaoLegivel(data.observacao_pausa || data.observacaoPausa, maquinas)}"
                            </p>
                        )}
                    </div>
                )}

                {/* Link do Desenho (se houver) */}
                {linkFinal && (
                    <div
                        className="flex items-center justify-between bg-[#111318] border border-[#262A33] rounded-[6px] px-2.5 py-1.5 mb-3 text-[10.5px] font-['IBM_Plex_Mono'] text-[#7B808F] hover:text-[#E7E9ED] cursor-pointer transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(linkFinal);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        title="Copiar link do desenho"
                    >
                        <div className="flex items-center gap-1.5 truncate">
                            <LinkIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate">{linkFinal}</span>
                        </div>
                        {copied ? <Check className="w-3 h-3 text-[#4A9D74] shrink-0 ml-2" /> : <Copy className="w-3 h-3 opacity-60 shrink-0 ml-2" />}
                    </div>
                )}

                {/* 3. CARD ACTIONS (Side-by-side: Detalhes + Mover) */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#262A33] kanban-no-drag">
                    {prevStage && (
                        <button
                            type="button"
                            onClick={(e) => handleMoveAction(e, prevStage)}
                            className="p-2 bg-transparent text-[#7B808F] hover:text-[#E7E9ED] hover:bg-[#1F232B] border border-[#333844] rounded-[7px] transition-all active:scale-95 cursor-pointer"
                            title="Voltar etapa anterior"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewRequest?.(data);
                        }}
                        className="flex-1 py-1.5 px-3 bg-transparent text-[#7B808F] hover:text-[#E7E9ED] hover:bg-[#1F232B] border border-[#333844] rounded-[7px] text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detalhes</span>
                    </button>

                    {precisaProgramar && onProgramarRequest && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onProgramarRequest(data);
                            }}
                            className="flex-1 py-1.5 px-3 bg-[#1F232B] text-[#C99A4A] border border-[#C99A4A]/40 rounded-[7px] text-[12px] font-semibold cursor-pointer"
                        >
                            Programar
                        </button>
                    )}

                    {nextStage && (
                        <button
                            type="button"
                            onClick={(e) => handleMoveAction(e, nextStage)}
                            className="flex-1 py-1.5 px-3 bg-[#D97D3D] hover:bg-[#c46d32] text-[#111318] border border-[#D97D3D] rounded-[7px] text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                            <span>Mover</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(Card);
