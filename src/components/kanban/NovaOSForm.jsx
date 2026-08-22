import React, { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { TIPOS_KANBAN_GESTOR, labelSetor } from '../../constants/osWorkflow';
import { Plus, Trash2, Flag, ArrowRight, X, Calculator } from 'lucide-react';
import { compressImageFile } from '../../utils/folhaProcesso';

const novaPeca = () => ({ nome: '', etapas: [], quantidade: 1 });

const PRESETS = [
    { id: 'cnc-tt-fio', label: 'CNC → TT → Fio', etapas: ['CNC', 'EXTERNO', 'EDM_FIO'] },
    { id: 'cnc-ret', label: 'CNC → Retífica', etapas: ['CNC', 'RETIFICA'] },
    { id: 'fio-tt', label: 'Fio → TT', etapas: ['EDM_FIO', 'EXTERNO'] },
];

export default function NovaOSForm({ isOpen, onClose, onCreated }) {
    const clientes = useAppStore((s) => s.clientes);
    const activeSector = useAppStore((s) => s.activeSector);
    const addOrdemServico = useAppStore((s) => s.addOrdemServico);
    const addGrupoOrdensServico = useAppStore((s) => s.addGrupoOrdensServico);
    const role = useAuthStore((s) => s.role);
    const isGestor = role === 'admin';

    const setorPadrao = activeSector && activeSector !== 'TODOS' ? activeSector : 'CNC';
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modo, setModo] = useState('avulsa');
    const [cliente, setCliente] = useState('');
    const [codigoPeca, setCodigoPeca] = useState('');
    const [codigoMolde, setCodigoMolde] = useState('');
    const [prazoEntrega, setPrazoEntrega] = useState('');
    const [valorOrcado, setValorOrcado] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [isPrioridade, setIsPrioridade] = useState(false);
    const [pecas, setPecas] = useState([novaPeca()]);
    const [showEdmCalc, setShowEdmCalc] = useState(false);
    const [edmTempo, setEdmTempo] = useState(null);
    const [observacoes, setObservacoes] = useState('');
    const [linkDesenho, setLinkDesenho] = useState('');
    const [folhaBlob, setFolhaBlob] = useState(null);
    const [folhaPreview, setFolhaPreview] = useState('');

    if (!isOpen) return null;

    const reset = () => {
        setModo('avulsa');
        setCliente('');
        setCodigoPeca('');
        setCodigoMolde('');
        setPrazoEntrega('');
        setValorOrcado('');
        setQuantidade(1);
        setIsPrioridade(false);
        setPecas([novaPeca()]);
        setShowEdmCalc(false);
        setEdmTempo(null);
        setObservacoes('');
        setLinkDesenho('');
        setFolhaBlob(null);
        setFolhaPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return '';
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const setEtapasPeca = (idx, etapas) => {
        setPecas((p) => p.map((row, i) => (i === idx ? { ...row, etapas } : row)));
    };

    const addEtapa = (idx, setor) => {
        setPecas((p) => p.map((row, i) => (
            i === idx ? { ...row, etapas: [...row.etapas, setor] } : row
        )));
    };

    const removeEtapa = (idx, ei) => {
        setPecas((p) => p.map((row, i) => {
            if (i !== idx) return row;
            const etapas = row.etapas.filter((_, j) => j !== ei);
            return { ...row, etapas };
        }));
    };

    const flattenKanbans = () => {
        if (!isGestor) {
            return [{
                componente: '',
                setor: setorPadrao,
                codigoPeca: (codigoPeca || 'S/N').toUpperCase(),
                quantidade: parseInt(quantidade, 10) || 1,
            }];
        }
        const lista = modo === 'molde' ? pecas : [pecas[0] || novaPeca()];
        const linhas = [];
        lista.forEach((peca, pi) => {
            const qtd = parseInt(modo === 'molde' ? peca.quantidade : quantidade, 10) || 1;
            const nome = (peca.nome || codigoPeca || codigoMolde || `P${pi + 1}`).trim();
            (peca.etapas || []).forEach((setor) => {
                const sufixo = (peca.etapas.length > 1) ? ` · ${labelSetor(setor)}` : '';
                const isEdm = setor === 'EDM_FIO';
                linhas.push({
                    componente: peca.nome?.trim() || '',
                    setor,
                    quantidade: qtd,
                    codigoPeca: modo === 'molde'
                        ? `${codigoMolde || 'MOLDE'}-${nome}${sufixo}`
                        : `${(codigoPeca || nome).toUpperCase()}${peca.etapas.length > 1 ? sufixo : ''}`,
                    tempoEstimadoCorteHoras: isEdm && edmTempo ? edmTempo.horas : undefined,
                    tempoEstimadoCorteMinutos: isEdm && edmTempo ? edmTempo.minutos : undefined,
                });
            });
        });
        return linhas;
    };

    const cabecalho = () => ({
        cliente: cliente.trim(),
        codigoPeca: codigoPeca.trim() || codigoMolde.trim() || 'S/N',
        codigoMolde: modo === 'molde' ? codigoMolde.trim() : '',
        prazoEntrega,
        valorOrcado: valorOrcado === '' ? null : valorOrcado,
        quantidade: parseInt(quantidade, 10) || 1,
        status: 'A fazer',
        programado: false,
        isPrioridade,
        is_prioridade: isPrioridade,
        observacoes: observacoes.trim(),
        linkDesenho: linkDesenho.trim(),
        folhaBlob,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || !cliente.trim()) return;
        setIsSubmitting(true);
        try {
            const linhas = flattenKanbans().filter((k) => k.setor);
            if (linhas.length === 0) {
                alert('Defina pelo menos uma etapa no roteiro.');
                setIsSubmitting(false);
                return;
            }
            const precisaGrupo = linhas.length > 1;
            let criados = [];
            if (precisaGrupo) {
                criados = await addGrupoOrdensServico(cabecalho(), linhas);
            } else {
                const one = await addOrdemServico({
                    ...cabecalho(),
                    setor: linhas[0].setor,
                    componenteMolde: linhas[0].componente,
                    quantidade: linhas[0].quantidade || cabecalho().quantidade,
                    tempoEstimadoCorteHoras: linhas[0].tempoEstimadoCorteHoras,
                    tempoEstimadoCorteMinutos: linhas[0].tempoEstimadoCorteMinutos,
                    programado: linhas[0].setor === 'EXTERNO',
                    roteiro_ordem: 1,
                }, { optimistic: false });
                criados = one ? [one] : [];
            }
            handleClose();
            if (criados?.length) onCreated?.(criados);
        } catch (err) {
            alert(err?.message || 'Falha ao criar O.S.');
        }
        setIsSubmitting(false);
    };

    const inputCls = 'w-full px-3 py-2.5 border border-[#262A33] bg-[#111318] rounded-[8px] text-[#E7E9ED] text-sm placeholder-[#565B68] focus:outline-none focus:border-[#D97D3D]';
    const labelCls = 'block text-[10px] font-semibold text-[#565B68] uppercase tracking-wider mb-1.5';

    const renderRoteiroPeca = (peca, idx, { showNome }) => (
        <div key={idx} className="border border-[#262A33] rounded-[8px] p-3 bg-[#111318] space-y-2">
            {showNome && (
                <div className="flex gap-2 items-center">
                    <input
                        value={peca.nome}
                        onChange={(e) => setPecas((p) => p.map((row, i) => i === idx ? { ...row, nome: e.target.value } : row))}
                        placeholder="Nome da peça (cavidade, macho…)"
                        className={`${inputCls} flex-1`}
                    />
                    <div className="w-[88px] shrink-0">
                        <input
                            type="number"
                            min="1"
                            value={peca.quantidade || 1}
                            onChange={(e) => setPecas((p) => p.map((row, i) => i === idx ? { ...row, quantidade: e.target.value } : row))}
                            className={inputCls}
                            title="Qtd. iguais deste tipo"
                        />
                    </div>
                    {pecas.length > 1 && (
                        <button type="button" onClick={() => setPecas((p) => p.filter((_, i) => i !== idx))} className="p-2 text-[#565B68] hover:text-[#C85558] cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#565B68]">Caminho nesta peça</p>
            <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                {peca.etapas.length === 0 && (
                    <span className="text-[11px] text-[#565B68]">Nenhuma etapa — escolha o setor na ordem do processo.</span>
                )}
                {peca.etapas.map((setor, ei) => (
                    <React.Fragment key={`${setor}-${ei}`}>
                        {ei > 0 && <ArrowRight className="w-3.5 h-3.5 text-[#565B68] shrink-0" />}
                        <span className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-[6px] border border-[#D97D3D]/40 bg-[rgba(217,125,61,0.1)] text-[11px] font-semibold text-[#D97D3D]">
                            {ei + 1}. {labelSetor(setor)}
                            <button type="button" onClick={() => removeEtapa(idx, ei)} className="p-0.5 text-[#7B808F] hover:text-[#C85558] cursor-pointer">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    </React.Fragment>
                ))}
            </div>
            <div>
                <p className="text-[10px] text-[#565B68] mb-1.5">{peca.etapas.length === 0 ? 'Adicionar etapa' : 'Próxima etapa'}</p>
                <div className="flex flex-wrap gap-1.5">
                    {TIPOS_KANBAN_GESTOR.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => addEtapa(idx, t.id)}
                            className="px-2 py-1 rounded-[6px] border border-[#262A33] text-[10px] font-semibold text-[#7B808F] hover:border-[#D97D3D] hover:text-[#D97D3D] cursor-pointer"
                        >
                            + {t.label}
                        </button>
                    ))}
                </div>
            </div>
            {idx === 0 && isGestor && (
                <div className="flex flex-wrap gap-1 pt-1">
                    {PRESETS.map((pr) => (
                        <button
                            key={pr.id}
                            type="button"
                            onClick={() => setEtapasPeca(idx, [...pr.etapas])}
                            className="text-[10px] px-2 py-1 rounded-[5px] bg-[#181B22] border border-[#262A33] text-[#9DA2AE] cursor-pointer hover:text-[#E7E9ED]"
                        >
                            {pr.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isGestor ? 'Nova O.S. — despacho para o setor' : 'Novo kanban'}
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {isGestor && (
                    <div className="flex bg-[#111318] p-1 rounded-[7px] border border-[#262A33] gap-1">
                        <button
                            type="button"
                            onClick={() => { setModo('avulsa'); setPecas([pecas[0] || novaPeca()]); }}
                            className={`flex-1 py-2 rounded-[5px] text-[11px] font-semibold uppercase tracking-wider cursor-pointer ${modo === 'avulsa' ? 'bg-[#D97D3D] text-[#111318]' : 'text-[#7B808F]'}`}
                        >
                            Uma peça
                        </button>
                        <button
                            type="button"
                            onClick={() => setModo('molde')}
                            className={`flex-1 py-2 rounded-[5px] text-[11px] font-semibold uppercase tracking-wider cursor-pointer ${modo === 'molde' ? 'bg-[#D97D3D] text-[#111318]' : 'text-[#7B808F]'}`}
                        >
                            Molde (várias peças)
                        </button>
                    </div>
                )}

                <div>
                    <label className={labelCls}>Cliente *</label>
                    <input
                        list="os-clientes-nomes"
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                        required
                        placeholder="Nome do cliente"
                        className={inputCls}
                    />
                    <datalist id="os-clientes-nomes">
                        {clientes.map((c) => <option key={c.id} value={c.nome} />)}
                    </datalist>
                    {!isGestor && (
                        <p className="text-[10px] text-[#565B68] mt-1">Somente o nome. Contatos ficam na agenda do gestor.</p>
                    )}
                </div>

                {modo === 'molde' && isGestor ? (
                    <div>
                        <label className={labelCls}>Código do molde</label>
                        <input value={codigoMolde} onChange={(e) => setCodigoMolde(e.target.value)} placeholder="Ex: KINNER" className={inputCls} />
                    </div>
                ) : (
                    <div>
                        <label className={labelCls}>Código da peça</label>
                        <input value={codigoPeca} onChange={(e) => setCodigoPeca(e.target.value)} placeholder="Ex: PN-123" className={`${inputCls} uppercase`} />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>Prazo {modo === 'molde' ? '(do molde)' : ''}</label>
                        <input type="date" value={prazoEntrega} onChange={(e) => setPrazoEntrega(e.target.value)} className={inputCls} />
                    </div>
                    {modo !== 'molde' && (
                        <div>
                            <label className={labelCls}>Qtd. do lote (peças iguais)</label>
                            <input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className={inputCls} />
                        </div>
                    )}
                    {isGestor && (
                        <div className={modo === 'molde' ? '' : 'col-span-2'}>
                            <label className={labelCls}>Valor orçado (R$)</label>
                            <input type="number" min="0" step="0.01" value={valorOrcado} onChange={(e) => setValorOrcado(e.target.value)} placeholder="0,00" className={inputCls} />
                        </div>
                    )}
                </div>
                {modo !== 'molde' && parseInt(quantidade, 10) > 1 && (
                    <p className="text-[11px] text-[#7B808F] -mt-2">
                        Um kanban só: {quantidade} peças iguais. O operador marca o progresso no cartão (0/{quantidade}). Não abre um cartão por unidade.
                    </p>
                )}

                <button
                    type="button"
                    onClick={() => setIsPrioridade((v) => !v)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] border cursor-pointer ${
                        isPrioridade
                            ? 'border-[#C85558]/50 bg-[rgba(200,85,88,0.1)]'
                            : 'border-[#262A33] bg-[#111318]'
                    }`}
                >
                    <span className="flex items-center gap-2 text-sm font-medium text-[#E7E9ED]">
                        <Flag className={`w-4 h-4 ${isPrioridade ? 'text-[#C85558]' : 'text-[#565B68]'}`} />
                        Prioridade
                    </span>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${isPrioridade ? 'text-[#C85558]' : 'text-[#565B68]'}`}>
                        {isPrioridade ? 'Destaque no quadro' : 'Normal'}
                    </span>
                </button>

                {isGestor ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className={labelCls}>
                                {modo === 'molde' ? 'Peças do molde e o caminho de cada uma' : 'Roteiro desta peça'}
                            </label>
                            {modo === 'molde' && (
                                <button
                                    type="button"
                                    onClick={() => setPecas((p) => [...p, novaPeca()])}
                                    className="text-[11px] font-semibold text-[#D97D3D] flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Peça
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-[#565B68] leading-relaxed">
                            A ordem da esquerda para a direita é o caminho. Lote de peças iguais: informe a quantidade — vira um único cartão com progresso (ex.: 4/12), não 12 cartões.
                        </p>
                        {(modo === 'molde' ? pecas : [pecas[0]]).map((peca, idx) =>
                            renderRoteiroPeca(peca, idx, { showNome: modo === 'molde' })
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-[#E7E9ED] bg-[#111318] border border-[#262A33] rounded-[8px] px-3 py-2">
                        {labelSetor(setorPadrao)} — cai em A fazer para programar
                    </p>
                )}

                {isGestor && (modo === 'molde' ? pecas : [pecas[0]]).some((p) => (p?.etapas || []).includes('EDM_FIO')) && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowEdmCalc((v) => !v)}
                            className="text-[11px] text-[#565B68] hover:text-[#7B808F] flex items-center gap-1.5 cursor-pointer"
                        >
                            <Calculator className="w-3.5 h-3.5" />
                            {showEdmCalc ? 'Ocultar calculadora de perímetro EDM' : 'Calculadora de perímetro EDM'}
                        </button>
                        {edmTempo && !showEdmCalc && (
                            <p className="text-[10px] text-[#7B808F] mt-1">Estimativa WEDM: {edmTempo.horas}h {String(edmTempo.minutos).padStart(2, '0')}m (aplica nas etapas de fio)</p>
                        )}
                        {showEdmCalc && (
                            <div className="mt-2 border border-[#262A33] rounded-[8px] p-2">
                                <CalculadoraTempoModal
                                    initialQuantidade={parseInt(quantidade, 10) || 1}
                                    onCalculate={(h, m, qtd) => {
                                        setEdmTempo({ horas: h, minutos: m });
                                        if (qtd) setQuantidade(qtd);
                                        setShowEdmCalc(false);
                                    }}
                                    onClose={() => setShowEdmCalc(false)}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className={labelCls}>Caminho / link do desenho</label>
                    <input value={linkDesenho} onChange={(e) => setLinkDesenho(e.target.value)} placeholder="Pasta de rede, URL ou caminho do arquivo" className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Observações (vão para o cartão e a folha)</label>
                    <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Sobremetal, cuidado no setup, pedido do cliente…" className={`${inputCls} min-h-[72px] resize-y`} />
                </div>
                <div>
                    <label className={labelCls}>Print da peça (NX / Mastercam)</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-[11px] text-[#7B808F] file:mr-3 file:py-1.5 file:px-3 file:rounded-[6px] file:border-0 file:bg-[#1F232B] file:text-[#E7E9ED] file:text-[11px] cursor-pointer"
                        onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                                const blob = await compressImageFile(f);
                                setFolhaPreview((prev) => {
                                    if (prev) URL.revokeObjectURL(prev);
                                    return URL.createObjectURL(blob);
                                });
                                setFolhaBlob(blob);
                            } catch (err) {
                                alert(err?.message || 'Não foi possível ler a imagem.');
                            }
                        }}
                    />
                    {folhaPreview && (
                        <img src={folhaPreview} alt="Print" className="mt-2 max-h-28 rounded-[6px] border border-[#262A33] object-contain" />
                    )}
                    <p className="text-[10px] text-[#565B68] mt-1">Uma foto por kanban. Escolher outra substitui a anterior (Storage, não no banco).</p>
                </div>

                <p className="text-[11px] text-[#7B808F] leading-relaxed">
                    Depois da criação abre a folha para imprimir (PDF). CAM e máquina continuam no A fazer.
                </p>

                <div className="flex gap-3 pt-2 border-t border-[#262A33]">
                    <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" variant="primary" className="flex-[2]" disabled={isSubmitting}>
                        {isSubmitting ? 'Criando...' : 'Enviar para A fazer'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
