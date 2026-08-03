import React, { useState } from 'react';
import Modal from '../common/Modal';
import EditOSModal from './EditOSModal';
import { Clock, User, Settings, CheckCircle2, PauseCircle, PlayCircle, History, AlertTriangle, Trash, Link as LinkIcon, Copy, Check, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../../store/useAppStore';

export default function AcompanhamentoModal({ isOpen, onClose, osData, onDeleteRequest, onPauseRequest }) {
    if (!osData) return null;

    const [copied, setCopied] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isEditingTotal, setIsEditingTotal] = useState(false);

    // Busca a versão mais atualizada da OS do store para garantir que vemos as mudanças de Realtime
    const currentOs = useAppStore(state => {
        const kanban = state.kanban;
        for (const col of Object.keys(kanban)) {
            const found = kanban[col].find(o => o.id === osData.id);
            if (found) return found;
        }
        return osData;
    });

    const activeData = currentOs || osData;
    const [newTotal, setNewTotal] = useState(activeData.quantidade || 1);

    const temposFases = activeData.tempos_fases || activeData.temposFases || { setup: 0, emCorte: 0, afericao: 0 };
    const historicoPausas = activeData.historico_pausas || activeData.historicoPausas || [];

    const formatarHoras = (horasDecimal) => {
        if (!horasDecimal) return '00:00:00';
        const h = Math.floor(horasDecimal);
        const m = Math.floor((horasDecimal - h) * 60);
        const s = Math.floor((((horasDecimal - h) * 60) - m) * 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const getStatusIcon = () => {
        const isPausado = osData.is_pausado || osData.isPausado;
        if (isPausado) return <PauseCircle className="w-6 h-6 text-kanban-red" />;
        if (osData.statusLocal === 'Concluído' || osData.status === 'Concluído') return <CheckCircle2 className="w-6 h-6 text-kanban-green" />;
        if (osData.statusLocal === 'A fazer' || osData.status === 'A fazer') return <History className="w-6 h-6 text-slate-500" />;
        return <PlayCircle className="w-6 h-6 text-kanban-cyan" />;
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Detalhes" maxWidth="max-w-3xl">
                <div className="space-y-6">

                    {/* Header Profile */}
                    <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-5 items-center justify-between">
                        <div className="flex gap-4 items-center">
                            <div className="p-3 bg-slate-950 rounded-lg shadow-sm border border-slate-800">
                                {getStatusIcon()}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-100">
                                    {osData.cliente ? `Cliente: ${osData.cliente}` : 'Cliente não informado'}
                                </h4>
                                {osData.codigoPeca || osData.codigo_peca ? (
                                    <p className="text-sm font-medium text-slate-400 mt-1">
                                        O.S: <span className="text-slate-300">{osData.codigoPeca || osData.codigo_peca}</span>
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditOpen(true)}
                                    className="p-1.5 rounded-md hover:bg-kanban-amber/10 text-slate-400 hover:text-kanban-amber transition-colors"
                                    title="Editar O.S."
                                >
                                    <Pencil className="w-5 h-5" />
                                </button>
                                {onDeleteRequest && (
                                    <button
                                        onClick={() => onDeleteRequest(activeData)}
                                        className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Excluir O.S."
                                    >
                                        <Trash className="w-5 h-5" />
                                    </button>
                                )}
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${(activeData.is_pausado || activeData.isPausado) ? 'bg-kanban-red/20 text-kanban-red' :
                                    (activeData.statusLocal === 'Concluído' || activeData.status === 'Concluído') ? 'bg-kanban-green/20 text-kanban-green' :
                                        (activeData.statusLocal === 'A fazer' || activeData.status === 'A fazer') ? 'bg-slate-800 text-slate-400' :
                                            'bg-kanban-cyan/20 text-kanban-cyan'
                                    }`}>
                                    {(activeData.is_pausado || activeData.isPausado) ? 'Em Pausa' : (activeData.statusLocal || activeData.status || 'Desconhecido')}
                                </span>
                            </div>
                            {(activeData.resultadoAfericao || activeData.resultado_afericao) && (
                                <div className="text-right">
                                    <p className={`text-xs font-bold mt-1 ${(activeData.resultadoAfericao || activeData.resultado_afericao) === 'Aprovada' ? 'text-kanban-green' : 'text-red-500'}`}>
                                        Avaliação: {activeData.resultadoAfericao || activeData.resultado_afericao}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Grid de Informações Vitais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <h5 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Produção Atual
                            </h5>
                            <ul className="space-y-2 text-sm">
                                {(activeData.programador || activeData.programador_nome) && (
                                    <li className="flex justify-between">
                                        <span className="text-slate-500">Programador:</span>
                                        <span className="font-semibold text-slate-200">{activeData.programador || activeData.programador_nome}</span>
                                    </li>
                                )}
                                {(osData.maquina_nome || osData.maquina) && (
                                    <li className="flex justify-between">
                                        <span className="text-slate-500">Máquina:</span>
                                        <span className="font-semibold text-slate-200">{osData.maquina_nome || osData.maquina}</span>
                                    </li>
                                )}
                                {(activeData.operador_atual || activeData.operadorAtual || activeData.operador) && (
                                    <li className="flex justify-between">
                                        <span className="text-slate-500">Operador:</span>
                                        <span className="font-semibold text-slate-200">{activeData.operador_atual || activeData.operadorAtual || activeData.operador}</span>
                                    </li>
                                )}
                                <li className="flex justify-between">
                                    <span className="text-slate-500">Data de Criação:</span>
                                    <span className="font-semibold text-slate-200">
                                        {(osData.created_at || osData.createdAt) ? format(new Date(osData.created_at || osData.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                                    </span>
                                </li>
                                {(osData.link_desenho || osData.linkDesenho) && (
                                    <li className="pt-2 mt-2 border-t border-slate-800">
                                        <span className="text-slate-500 block mb-1">Desenho Técnico (Local/Link):</span>
                                        <div
                                            className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded p-2 cursor-pointer hover:bg-slate-900 transition-colors group"
                                            onClick={() => {
                                                navigator.clipboard.writeText(osData.link_desenho || osData.linkDesenho);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            title="Copiar Endereço"
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="text-xs font-mono text-slate-400 truncate tracking-tight">{osData.link_desenho || osData.linkDesenho}</span>
                                            </div>
                                            <div className="shrink-0 pl-2">
                                                {copied ? <Check className="w-4 h-4 text-kanban-green" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-kanban-amber" />}
                                            </div>
                                        </div>
                                    </li>
                                )}
                                {(activeData.nx_import?.ferramentas || activeData.nxImport?.ferramentas || []).length > 0 && (
                                    <li className="pt-2 mt-2 border-t border-slate-800">
                                        <span className="text-slate-500 block mb-1">Ferramentas / Magazine Previsto:</span>
                                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                            {(activeData.nx_import?.ferramentas || activeData.nxImport?.ferramentas).map((f, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs">
                                                    <span className="font-mono text-kanban-amber font-bold">{f.codigoT || `T${String(idx + 1).padStart(2, '0')}`}</span>
                                                    <span className="text-slate-300 font-medium">{f.nome || 'Ferramenta'}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <h5 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-kanban-teal" /> Progresso do Lote
                            </h5>
                            {osData.quantidade > 1 ? (
                                <div className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <span className="text-3xl font-black text-white">{osData.quantidade_concluida || 0}</span>
                                            {isEditingTotal ? (
                                                <div className="inline-flex items-center gap-2 ml-2">
                                                    <span className="text-slate-500 font-bold">/</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={newTotal}
                                                        onChange={(e) => setNewTotal(parseInt(e.target.value) || 1)}
                                                        className="w-16 bg-slate-950 border border-kanban-amber rounded px-2 py-1 text-white font-bold text-lg"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const { editOrdemServico } = useAppStore.getState();
                                                            editOrdemServico(osData.id, { quantidade: newTotal });
                                                            setIsEditingTotal(false);
                                                        }}
                                                        className="bg-kanban-green text-slate-950 p-1.5 rounded-md hover:bg-green-400"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="text-slate-500 font-bold ml-2">/ {osData.quantidade} peças</span>
                                                    <button
                                                        onClick={() => {
                                                            setNewTotal(osData.quantidade);
                                                            setIsEditingTotal(true);
                                                        }}
                                                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-kanban-amber"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                        <div
                                            className="bg-kanban-teal h-full transition-all duration-500 shadow-[0_0_10px_rgba(45,212,191,0.3)]"
                                            style={{ width: `${Math.min(100, ((osData.quantidade_concluida || 0) / osData.quantidade) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-24 flex flex-col items-center justify-center text-center opacity-40">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Peça Única</p>
                                    <p className="text-[10px] text-slate-600 mt-1">Nenhum lote configurado</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <h5 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Tempos Líquidos
                            </h5>
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between">
                                    <span className="text-slate-500">Tempo de Set-up:</span>
                                    <span className="font-mono font-bold text-slate-200">{formatarHoras(temposFases.setup)}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-slate-500">Tempo de Corte:</span>
                                    <span className="font-mono font-bold text-slate-200">{formatarHoras(temposFases.emCorte)}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-slate-500">Tempo de Aferição:</span>
                                    <span className="font-mono font-bold text-slate-200">{formatarHoras(temposFases.afericao || 0)}</span>
                                </li>
                                <li className="flex justify-between pt-2 mt-2 border-t border-slate-800">
                                    <span className="text-slate-300 font-bold">Total Produzido:</span>
                                    <span className="font-mono font-bold text-kanban-amber">
                                        {formatarHoras(temposFases.setup + temposFases.emCorte + (temposFases.afericao || 0))}
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* ALERTA DE REFUGO (Reposicionado à direita dos tempos) */}
                        {(activeData.resultadoAfericao || activeData.resultado_afericao) === 'Refugo' && (activeData.motivo_refugo || activeData.motivoRefugo) && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col">
                                <h5 className="text-xs font-bold uppercase text-red-500 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    Justificativa do Refugo
                                </h5>
                                <div className="flex-1 bg-slate-950/50 rounded-lg p-3 border border-red-500/10 overflow-y-auto max-h-[120px]">
                                    <p className="text-sm text-slate-200 font-medium italic leading-relaxed break-words whitespace-pre-wrap">
                                        "{activeData.motivo_refugo || activeData.motivoRefugo}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Linha do Tempo de Pausas */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-800 bg-slate-900">
                            <h5 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-kanban-amber" />
                                Histórico de Interrupções e Pausas
                            </h5>
                        </div>

                        {(() => {
                            const PHASE_NAMES = {
                                'aFazer': 'A fazer',
                                'setup': 'Set-up',
                                'emCorte': 'Em Corte',
                                'afericao': 'Aferição',
                                'concluido': 'Concluído'
                            };

                            const activePause = (osData.is_pausado || osData.isPausado) ? {
                                fase: osData.status,
                                motivo: osData.motivo_pausa || osData.motivoPausa || 'Não informado',
                                observacao: osData.observacao_pausa || osData.observacaoPausa,
                                inicio: osData.data_pausa || osData.dataPausa,
                                duracaoHoras: (Date.now() - new Date(osData.data_pausa || osData.dataPausa).getTime()) / (1000 * 60 * 60),
                                isActive: true
                            } : null;

                            const allPausas = activePause ? [activePause, ...historicoPausas] : historicoPausas;

                            if (allPausas.length === 0) {
                                return (
                                    <div className="p-6 text-center text-sm text-slate-400 bg-slate-900/50">
                                        Nenhuma pausa registrada no ciclo de vida desta peça. Ocorrência limpa.
                                    </div>
                                );
                            }

                            return (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs uppercase bg-slate-900 text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">Fase</th>
                                                <th className="px-4 py-3">Motivo / Obs</th>
                                                <th className="px-4 py-3">Início</th>
                                                <th className="px-4 py-3">Duração</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800 text-slate-300">
                                            {allPausas.map((pausa, idx) => (
                                                <tr key={idx} className={`hover:bg-slate-800/50 transition-colors ${pausa.isActive ? 'bg-kanban-amber/5' : ''}`}>
                                                    <td className="px-4 py-3">
                                                        <span className="flex items-center gap-1.5 capitalize">
                                                            {pausa.isActive && <div className="w-2 h-2 rounded-full bg-kanban-amber animate-pulse"></div>}
                                                            {PHASE_NAMES[pausa.fase] || pausa.fase}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 group">
                                                        <div className="font-medium text-slate-200">{pausa.motivo}</div>
                                                        {pausa.observacao && (
                                                            <div className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1 group-hover:line-clamp-none">
                                                                "{pausa.observacao}"
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                                                        {pausa.inicio ? format(new Date(pausa.inicio), 'dd/MM HH:mm') : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                                                        <span className={pausa.isActive ? 'text-kanban-amber' : 'text-kanban-red'}>
                                                            {formatarHoras(pausa.duracaoHoras)}
                                                        </span>
                                                        {pausa.isActive && <span className="text-[9px] block text-kanban-amber/70 font-bold uppercase tracking-tighter">Em aberto</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </Modal>

            <EditOSModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                osData={osData}
            />
        </>
    );
}
