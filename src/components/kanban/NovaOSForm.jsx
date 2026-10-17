import React, { useState, useEffect, useCallback } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { listaEtapasRoteiro, labelSetor, geraCartaoEtapa, montarRoteiro, slugEtapaPersonalizada } from '../../constants/osWorkflow';
import { nomesClienteAutocomplete } from '../../constants/roles';
import { Plus, Trash2, Flag, ArrowRight, X, Calculator, History, Loader2 } from 'lucide-react';
import { compressImageFile } from '../../utils/folhaProcesso';
import CalculadoraTempoModal from '../common/CalculadoraTempoModal';
import { formatarMoedaDigitacao, parseMoedaBr } from '../../utils/formatters';
import { osService } from '../../services/osService';
import { dadosFormularioRepetirPeca } from '../../utils/horasProducao';

const novaPeca = () => ({ nome: '', etapas: [], quantidade: 1 });

function CamposHm({ label, horas, minutos, onHoras, onMinutos, inputCls }) {
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#565B68] mb-1.5">{label}</p>
            <div className="flex gap-2">
                <input type="number" min="0" inputMode="numeric" value={horas} onChange={(e) => onHoras(e.target.value)} placeholder="h" className={inputCls} />
                <input type="number" min="0" max="59" inputMode="numeric" value={minutos} onChange={(e) => onMinutos(e.target.value)} placeholder="min" className={inputCls} />
            </div>
        </div>
    );
}

/**
 * variante:
 * - 'avulsa' — peça única (Kanban / Carteira / Início). Sem toggle Molde.
 * - 'molde'  — conjunto de peças da mesma ferramenta (só aba Moldes).
 */
export default function NovaOSForm({
    isOpen,
    onClose,
    onCreated,
    initialFromHistorico,
    initialModo,
    variante,
    onIrParaMoldes,
}) {
    const clientes = useAppStore((s) => s.clientes);
    const config = useAppStore((s) => s.configuracoesGlobais);
    const activeSector = useAppStore((s) => s.activeSector);
    const addOrdemServico = useAppStore((s) => s.addOrdemServico);
    const addGrupoOrdensServico = useAppStore((s) => s.addGrupoOrdensServico);
    const notificarApp = useAppStore((s) => s.notificarApp);
    const etapasPersonalizadas = useAppStore((s) => s.configuracoesGlobais?.etapasPersonalizadas) || [];
    const salvarEtapasPersonalizadas = useAppStore((s) => s.salvarEtapasPersonalizadas);
    const role = useAuthStore((s) => s.role);
    const nomeEmpresa = useAuthStore((s) => s.nomeEmpresa);
    const isGestor = role === 'admin';

    const varianteEfetiva = variante || (initialModo === 'molde' ? 'molde' : 'avulsa');
    const setorPadrao = activeSector && activeSector !== 'TODOS' ? activeSector : 'CNC';
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modo, setModo] = useState(varianteEfetiva === 'molde' ? 'molde' : 'avulsa');
    const [cliente, setCliente] = useState('');
    const [codigoPeca, setCodigoPeca] = useState('');
    const [codigoMolde, setCodigoMolde] = useState('');
    const [prazoEntrega, setPrazoEntrega] = useState('');
    const [valorOrcado, setValorOrcado] = useState('');
    const [setupCncH, setSetupCncH] = useState('');
    const [setupCncM, setSetupCncM] = useState('');
    const [corteCncH, setCorteCncH] = useState('');
    const [corteCncM, setCorteCncM] = useState('');
    const [setupEdmH, setSetupEdmH] = useState('');
    const [setupEdmM, setSetupEdmM] = useState('');
    const [corteEdmH, setCorteEdmH] = useState('');
    const [corteEdmM, setCorteEdmM] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [isPrioridade, setIsPrioridade] = useState(false);
    const [pecas, setPecas] = useState([novaPeca()]);
    const [showEdmCalc, setShowEdmCalc] = useState(false);
    const [edmTempo, setEdmTempo] = useState(null);
    const [observacoes, setObservacoes] = useState('');
    const [linkDesenho, setLinkDesenho] = useState('');
    const [folhaBlob, setFolhaBlob] = useState(null);
    const [folhaPreview, setFolhaPreview] = useState('');
    const [novaEtapaNome, setNovaEtapaNome] = useState('');
    const [editandoEtapaIdx, setEditandoEtapaIdx] = useState(null);
    const [editandoEtapaTexto, setEditandoEtapaTexto] = useState('');
    const [historicoOrigemId, setHistoricoOrigemId] = useState(null);
    const [historicoSugestao, setHistoricoSugestao] = useState(null);
    const [loadingHistoricoCodigo, setLoadingHistoricoCodigo] = useState(false);
    const nomesClientes = nomesClienteAutocomplete(clientes, nomeEmpresa);

    const aplicarTemposSetor = useCallback((setor, setupHm, corteHm) => {
        const sh = String(setupHm.horas || '');
        const sm = String(setupHm.minutos || '');
        const ch = String(corteHm.horas || '');
        const cm = String(corteHm.minutos || '');
        if (setor === 'EDM_FIO') {
            setSetupEdmH(sh); setSetupEdmM(sm); setCorteEdmH(ch); setCorteEdmM(cm);
            setEdmTempo(null);
        } else if (setor === 'CNC') {
            setSetupCncH(sh); setSetupCncM(sm); setCorteCncH(ch); setCorteCncM(cm);
        }
    }, []);

    const preencherComHistorico = useCallback((os) => {
        if (!os) return;
        const dados = dadosFormularioRepetirPeca(os, config || {});
        setModo('avulsa');
        setHistoricoOrigemId(dados.origemId);
        setCliente(dados.cliente);
        setCodigoPeca(dados.codigoPeca);
        setCodigoMolde('');
        setLinkDesenho(dados.linkDesenho);
        setQuantidade(dados.quantidade);
        setObservacoes(dados.observacoes);
        if (dados.valorOrcado != null && dados.valorOrcado !== '') {
            setValorOrcado(formatarMoedaDigitacao(String(Math.round(Number(dados.valorOrcado) * 100))));
        }
        setPecas([{
            nome: dados.componente,
            etapas: dados.etapas.length ? dados.etapas : [dados.setor],
            quantidade: dados.quantidade,
        }]);
        const setorTempos = isGestor ? dados.setor : setorPadrao;
        aplicarTemposSetor(setorTempos, dados.setupHm, dados.corteHm);
        setHistoricoSugestao(null);
    }, [aplicarTemposSetor, config, isGestor, setorPadrao]);

    useEffect(() => {
        if (!isOpen || !initialFromHistorico) return;
        preencherComHistorico(initialFromHistorico);
    }, [isOpen, initialFromHistorico, preencherComHistorico]);

    useEffect(() => {
        if (!isOpen) return;
        setModo(varianteEfetiva === 'molde' ? 'molde' : 'avulsa');
    }, [isOpen, varianteEfetiva]);

    useEffect(() => {
        if (!isOpen || modo !== 'avulsa') {
            setHistoricoSugestao(null);
            return undefined;
        }
        const cod = codigoPeca.trim();
        if (cod.length < 3) {
            setHistoricoSugestao(null);
            return undefined;
        }
        const timer = window.setTimeout(() => {
            setLoadingHistoricoCodigo(true);
            osService.searchHistorico({ codigoPeca: cod, limit: 8 })
                .then((rows) => {
                    const norm = (r) => String(r.codigo_peca || r.codigoPeca || '').trim().toLowerCase();
                    const alvo = cod.toLowerCase();
                    const matches = rows.filter((r) => norm(r) === alvo || norm(r).includes(alvo));
                    if (!matches.length) {
                        setHistoricoSugestao(null);
                        return;
                    }
                    const concluida = (r) => r.status === 'Concluído';
                    const pick = matches.find(concluida) || matches[0];
                    setHistoricoSugestao({
                        os: pick,
                        execucoes: matches.length,
                        dados: dadosFormularioRepetirPeca(pick, config || {}),
                    });
                })
                .catch(() => setHistoricoSugestao(null))
                .finally(() => setLoadingHistoricoCodigo(false));
        }, 450);
        return () => window.clearTimeout(timer);
    }, [codigoPeca, isOpen, modo, config]);

    if (!isOpen) return null;

    const reset = () => {
        setModo('avulsa');
        setCliente('');
        setCodigoPeca('');
        setCodigoMolde('');
        setPrazoEntrega('');
        setValorOrcado('');
        setSetupCncH(''); setSetupCncM(''); setCorteCncH(''); setCorteCncM('');
        setSetupEdmH(''); setSetupEdmM(''); setCorteEdmH(''); setCorteEdmM('');
        setQuantidade(1);
        setIsPrioridade(false);
        setPecas([novaPeca()]);
        setShowEdmCalc(false);
        setEdmTempo(null);
        setObservacoes('');
        setLinkDesenho('');
        setFolhaBlob(null);
        setHistoricoOrigemId(null);
        setHistoricoSugestao(null);
        setLoadingHistoricoCodigo(false);
        setFolhaPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return '';
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const addEtapa = (idx, setor) => {
        setPecas((p) => p.map((row, i) => (
            i === idx ? { ...row, etapas: [...row.etapas, setor] } : row
        )));
    };

    const catalogoEtapas = listaEtapasRoteiro(etapasPersonalizadas);

    const removeEtapa = (idx, ei) => {
        setPecas((p) => p.map((row, i) => {
            if (i !== idx) return row;
            const etapas = row.etapas.filter((_, j) => j !== ei);
            return { ...row, etapas };
        }));
        setEditandoEtapaIdx(null);
    };

    const criarEtapaPersonalizada = async (idx) => {
        const nome = novaEtapaNome.trim();
        if (!nome) return;
        const existente = catalogoEtapas.find((t) => t.label.toLowerCase() === nome.toLowerCase());
        if (existente) {
            addEtapa(idx, existente.id);
            setNovaEtapaNome('');
            return;
        }
        let id = slugEtapaPersonalizada(nome);
        if (catalogoEtapas.some((t) => t.id === id)) id = `${id}_${Date.now().toString(36).slice(-4)}`;
        const nova = { id, label: nome, kind: 'marco', geraCartao: false };
        await salvarEtapasPersonalizadas([...(etapasPersonalizadas || []), nova]);
        addEtapa(idx, id);
        setNovaEtapaNome('');
    };

    const salvarNomeEtapaChip = async (pecaIdx, ei) => {
        const peca = pecas[pecaIdx];
        const setor = peca?.etapas?.[ei];
        const nome = editandoEtapaTexto.trim();
        setEditandoEtapaIdx(null);
        if (!setor || !nome) return;
        if (!String(setor).startsWith('PX_')) return;
        const next = (etapasPersonalizadas || []).map((e) => (e.id === setor ? { ...e, label: nome } : e));
        if (!next.some((e) => e.id === setor)) next.push({ id: setor, label: nome, kind: 'marco', geraCartao: false });
        await salvarEtapasPersonalizadas(next);
    };

    const temposDoSetor = (setor) => {
        const isEdm = setor === 'EDM_FIO';
        const isCnc = setor === 'CNC';
        if (isEdm) {
            return {
                tempoEstimadoSetupHoras: parseInt(setupEdmH, 10) || 0,
                tempoEstimadoSetupMinutos: parseInt(setupEdmM, 10) || 0,
                tempoEstimadoCorteHoras: edmTempo ? edmTempo.horas : (parseInt(corteEdmH, 10) || 0),
                tempoEstimadoCorteMinutos: edmTempo ? edmTempo.minutos : (parseInt(corteEdmM, 10) || 0),
            };
        }
        if (isCnc) {
            return {
                tempoEstimadoSetupHoras: parseInt(setupCncH, 10) || 0,
                tempoEstimadoSetupMinutos: parseInt(setupCncM, 10) || 0,
                tempoEstimadoCorteHoras: parseInt(corteCncH, 10) || 0,
                tempoEstimadoCorteMinutos: parseInt(corteCncM, 10) || 0,
            };
        }
        return {};
    };

    const flattenKanbans = () => {
        if (!isGestor) {
            return [{
                componente: '',
                setor: setorPadrao,
                codigoPeca: (codigoPeca || 'S/N').toUpperCase(),
                quantidade: parseInt(quantidade, 10) || 1,
                roteiro: montarRoteiro([setorPadrao], etapasPersonalizadas),
                ...temposDoSetor(setorPadrao),
            }];
        }
        const lista = modo === 'molde' ? pecas : [pecas[0] || novaPeca()];
        const linhas = [];
        lista.forEach((peca, pi) => {
            const qtd = parseInt(modo === 'molde' ? peca.quantidade : quantidade, 10) || 1;
            const nome = (peca.nome || codigoPeca || codigoMolde || `P${pi + 1}`).trim();
            const roteiro = montarRoteiro(peca.etapas || [], etapasPersonalizadas);
            (peca.etapas || []).filter((s) => geraCartaoEtapa(s, etapasPersonalizadas)).forEach((setor) => {
                const etapasCard = (peca.etapas || []).filter((s) => geraCartaoEtapa(s, etapasPersonalizadas));
                const sufixo = (etapasCard.length > 1) ? ` · ${labelSetor(setor, etapasPersonalizadas)}` : '';
                linhas.push({
                    componente: peca.nome?.trim() || '',
                    setor,
                    quantidade: qtd,
                    codigoPeca: modo === 'molde'
                        ? `${codigoMolde || 'MOLDE'}-${nome}${sufixo}`
                        : `${(codigoPeca || nome).toUpperCase()}${etapasCard.length > 1 ? sufixo : ''}`,
                    roteiro,
                    ...temposDoSetor(setor),
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
        valorOrcado: valorOrcado === '' ? null : parseMoedaBr(valorOrcado),
        quantidade: parseInt(quantidade, 10) || 1,
        status: 'A fazer',
        programado: false,
        // Molde manual entra na fila do gestor (igual import CSV) até liberar
        em_fila: modo === 'molde',
        emFila: modo === 'molde',
        isPrioridade,
        is_prioridade: isPrioridade,
        observacoes: observacoes.trim(),
        linkDesenho: linkDesenho.trim(),
        folhaBlob,
        parent_id: historicoOrigemId || null,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || !cliente.trim()) return;
        setIsSubmitting(true);
        try {
            const linhas = flattenKanbans().filter((k) => k.setor);
            if (linhas.length === 0) {
                notificarApp('Inclua pelo menos CNC, eletrofio ou serviço externo. As outras etapas (laser, torno, ou as que você criar) entram só no caminho da peça, sem cartão no quadro.', 'aviso');
                setIsSubmitting(false);
                return;
            }
            const precisaGrupo = linhas.length > 1;
            let criados = [];
            if (precisaGrupo) {
                criados = await addGrupoOrdensServico(cabecalho(), linhas);
            } else {
                const cab = cabecalho();
                const one = await addOrdemServico({
                    ...cab,
                    setor: linhas[0].setor,
                    componenteMolde: linhas[0].componente,
                    quantidade: linhas[0].quantidade || cab.quantidade,
                    tempoEstimadoCorteHoras: linhas[0].tempoEstimadoCorteHoras,
                    tempoEstimadoCorteMinutos: linhas[0].tempoEstimadoCorteMinutos,
                    tempoEstimadoSetupHoras: linhas[0].tempoEstimadoSetupHoras,
                    tempoEstimadoSetupMinutos: linhas[0].tempoEstimadoSetupMinutos,
                    programado: linhas[0].setor === 'EXTERNO',
                    em_fila: cab.em_fila,
                    roteiro_ordem: 1,
                    roteiro: linhas[0].roteiro || montarRoteiro([linhas[0].setor], etapasPersonalizadas),
                }, { optimistic: false });
                criados = one ? [one] : [];
            }
            handleClose();
            if (criados?.length) onCreated?.(criados);
        } catch (err) {
            notificarApp(err?.message || 'Falha ao criar O.S.');
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
                        <span className={`inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-[6px] border text-[11px] font-semibold ${
                            geraCartaoEtapa(setor, etapasPersonalizadas)
                                ? 'border-[#D97D3D]/40 bg-[rgba(217,125,61,0.1)] text-[#D97D3D]'
                                : 'border-[#C99A4A]/40 bg-[rgba(201,154,74,0.08)] text-[#C99A4A]'
                        }`}>
                            {editandoEtapaIdx === `${idx}-${ei}` && String(setor).startsWith('PX_') ? (
                                <input
                                    autoFocus
                                    value={editandoEtapaTexto}
                                    onChange={(e) => setEditandoEtapaTexto(e.target.value)}
                                    onBlur={() => salvarNomeEtapaChip(idx, ei)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') { e.preventDefault(); salvarNomeEtapaChip(idx, ei); }
                                        if (e.key === 'Escape') setEditandoEtapaIdx(null);
                                    }}
                                    className="w-[110px] bg-transparent border-0 text-[11px] font-semibold text-[#C99A4A] focus:outline-none"
                                />
                            ) : (
                                <button
                                    type="button"
                                    className="cursor-pointer text-left"
                                    title={String(setor).startsWith('PX_') ? 'Clique para renomear' : undefined}
                                    onClick={() => {
                                        if (!String(setor).startsWith('PX_')) return;
                                        setEditandoEtapaIdx(`${idx}-${ei}`);
                                        setEditandoEtapaTexto(labelSetor(setor, etapasPersonalizadas));
                                    }}
                                >
                                    {ei + 1}. {labelSetor(setor, etapasPersonalizadas)}{!geraCartaoEtapa(setor, etapasPersonalizadas) ? ' · marco' : ''}
                                </button>
                            )}
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
                    {catalogoEtapas.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => addEtapa(idx, t.id)}
                            className="px-2 py-1 rounded-[6px] border border-[#262A33] text-[10px] font-semibold text-[#7B808F] hover:border-[#D97D3D] hover:text-[#D97D3D] cursor-pointer"
                        >
                            + {t.label}{t.geraCartao === false ? ' (marco)' : ''}
                        </button>
                    ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <input
                        placeholder="Nova etapa, ex.: Corte a laser"
                        value={novaEtapaNome}
                        onChange={(e) => setNovaEtapaNome(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); criarEtapaPersonalizada(idx); } }}
                        className={`${inputCls} flex-1 min-w-[160px] py-1.5 text-[12px]`}
                    />
                    <button
                        type="button"
                        onClick={() => criarEtapaPersonalizada(idx)}
                        className="px-2.5 py-1.5 rounded-[6px] border border-[#D97D3D]/40 text-[10px] font-semibold text-[#D97D3D] cursor-pointer hover:bg-[rgba(217,125,61,0.1)]"
                    >
                        Criar e adicionar
                    </button>
                </div>
                <p className="text-[10px] text-[#565B68] mt-1.5 leading-relaxed">
                    Etapa criada vira marco no caminho (sem quadro). Clique nela na lista acima para renomear. CNC, eletrofio e serviço externo continuam gerando cartão.
                </p>
            </div>
        </div>
    );

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                modo === 'molde'
                    ? 'Novo molde'
                    : (isGestor ? 'Nova O.S. — peça avulsa' : 'Novo kanban')
            }
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {modo === 'molde' && isGestor ? (
                    <div className="rounded-[8px] border border-[#D97D3D]/25 bg-[rgba(217,125,61,0.08)] px-3 py-2.5">
                        <p className="text-[12px] text-[#E7E9ED] leading-relaxed">
                            <strong className="text-[#D97D3D]">Molde</strong> = peças da mesma ferramenta / mesmo job
                            (ex.: cavidade, macho, placa). Cada peça vira um cartão; entram na fila até você liberar para o setor.
                        </p>
                    </div>
                ) : null}

                {modo === 'avulsa' && isGestor && onIrParaMoldes ? (
                    <p className="text-[11px] text-[#7B808F] leading-relaxed">
                        Uma peça / um cartão no Kanban.{' '}
                        <button
                            type="button"
                            onClick={() => { handleClose(); onIrParaMoldes(); }}
                            className="text-[#D97D3D] font-semibold hover:underline cursor-pointer"
                        >
                            É um molde com várias peças?
                        </button>
                    </p>
                ) : null}

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
                        {nomesClientes.map((nome) => <option key={nome} value={nome} />)}
                    </datalist>
                    <p className="text-[10px] text-[#565B68] mt-1">
                        {isGestor
                            ? 'Lista de clientes cadastrados, a própria empresa e “Outros”.'
                            : 'Só o nome (autocomplete). Sem contatos nem dados financeiros. Inclui a empresa e “Outros”.'}
                    </p>
                </div>

                {modo === 'molde' && isGestor ? (
                    <div>
                        <label className={labelCls}>Código do molde / ferramenta</label>
                        <input value={codigoMolde} onChange={(e) => setCodigoMolde(e.target.value)} placeholder="Ex: KINNER" className={inputCls} required />
                        <p className="text-[10px] text-[#565B68] mt-1">Identifica o conjunto. As peças abaixo ficam ligadas a este código.</p>
                    </div>
                ) : modo !== 'molde' ? (
                    <div>
                        <label className={labelCls}>Código da peça</label>
                        <input value={codigoPeca} onChange={(e) => setCodigoPeca(e.target.value)} placeholder="Ex: PN-123" className={`${inputCls} uppercase`} />
                        {(loadingHistoricoCodigo || historicoSugestao) ? (
                            <div className="mt-2 rounded-[8px] border border-[#333844] bg-[#111318] px-3 py-2.5">
                                {loadingHistoricoCodigo ? (
                                    <p className="text-[11px] text-[#7B808F] flex items-center gap-1.5">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando histórico…
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-[11px] text-[#9DA2AE] flex items-center gap-1.5">
                                            <History className="w-3.5 h-3.5 text-[#D97D3D] shrink-0" />
                                            {historicoSugestao.execucoes > 1
                                                ? `Peça já produzida ${historicoSugestao.execucoes} vezes.`
                                                : 'Peça já produzida antes.'}
                                            {' '}Última ref.: {historicoSugestao.dados.resumo.formatado.totalReal} máquina
                                            ({historicoSugestao.dados.resumo.formatado.concluidoEm}).
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => preencherComHistorico(historicoSugestao.os)}
                                            className="mt-2 text-[11px] font-semibold text-[#D97D3D] hover:underline cursor-pointer"
                                        >
                                            Usar dados da última execução
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : null}
                    </div>
                ) : null}

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
                            <input
                                type="text"
                                inputMode="numeric"
                                value={valorOrcado}
                                onChange={(e) => setValorOrcado(formatarMoedaDigitacao(e.target.value))}
                                placeholder="12.500,00"
                                className={inputCls}
                            />
                        </div>
                    )}
                </div>
                {modo !== 'molde' && parseInt(quantidade, 10) > 1 && (
                    <p className="text-[11px] text-[#7B808F] -mt-2">
                        Um kanban só: {quantidade} peças iguais. O operador marca o progresso no cartão (0/{quantidade}). Não abre um cartão por unidade.
                    </p>
                )}

                {modo !== 'molde' && (
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
                )}

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
                            Digite as peças e o roteiro. CNC, eletrofio e serviço externo viram cartão. Laser, retífica, torno, montagem e etapas que você criar só aparecem no caminho da peça.
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

                {((!isGestor && setorPadrao !== 'EXTERNO') || (isGestor && (modo === 'molde' ? pecas : [pecas[0]]).some((p) => (p?.etapas || []).includes('CNC') || (p?.etapas || []).includes('EDM_FIO')))) && (
                    <div className="border border-[#262A33] rounded-[8px] p-3 bg-[#111318] space-y-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#565B68]">Tempos previstos (CAM)</p>
                        <p className="text-[10px] text-[#565B68] leading-relaxed">
                            Setup e usinagem/corte a fio entram no cartão e na eficiência: previsto ÷ real. Dá para completar depois ao programar.
                        </p>
                        {((!isGestor && setorPadrao === 'CNC') || (isGestor && (modo === 'molde' ? pecas : [pecas[0]]).some((p) => (p?.etapas || []).includes('CNC')))) && (
                            <div className="grid grid-cols-2 gap-3">
                                <CamposHm label="Setup CNC" horas={setupCncH} minutos={setupCncM} onHoras={setSetupCncH} onMinutos={setSetupCncM} inputCls={inputCls} />
                                <CamposHm label="Usinagem CNC" horas={corteCncH} minutos={corteCncM} onHoras={setCorteCncH} onMinutos={setCorteCncM} inputCls={inputCls} />
                            </div>
                        )}
                        {((!isGestor && setorPadrao === 'EDM_FIO') || (isGestor && (modo === 'molde' ? pecas : [pecas[0]]).some((p) => (p?.etapas || []).includes('EDM_FIO')))) && (
                            <div className="grid grid-cols-2 gap-3">
                                <CamposHm label="Setup eletrofio" horas={setupEdmH} minutos={setupEdmM} onHoras={setSetupEdmH} onMinutos={setSetupEdmM} inputCls={inputCls} />
                                <CamposHm label="Corte a fio" horas={edmTempo ? edmTempo.horas : corteEdmH} minutos={edmTempo ? edmTempo.minutos : corteEdmM} onHoras={setCorteEdmH} onMinutos={setCorteEdmM} inputCls={inputCls} />
                            </div>
                        )}
                    </div>
                )}

                {isGestor && (modo === 'molde' ? pecas : [pecas[0]]).some((p) => (p?.etapas || []).includes('EDM_FIO')) && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowEdmCalc(true)}
                            className="text-[11px] text-[#565B68] hover:text-[#7B808F] flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                        >
                            <Calculator className="w-3.5 h-3.5" />
                            Calculadora de perímetro EDM
                        </button>
                        {edmTempo && (
                            <p className="text-[10px] text-[#7B808F] mt-1">Estimativa WEDM: {edmTempo.horas}h {String(edmTempo.minutos).padStart(2, '0')}m (aplica nas etapas de fio)</p>
                        )}
                    </div>
                )}

                <>
                <div>
                    <label className={labelCls}>Caminho / link do desenho</label>
                    <input value={linkDesenho} onChange={(e) => setLinkDesenho(e.target.value)} placeholder="Pasta de rede, URL ou caminho do arquivo" className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Observações (vão para o cartão e a folha)</label>
                    <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Sobremetal, cuidado no setup, pedido do cliente…" className={`${inputCls} min-h-[72px] resize-y`} />
                </div>
                <div>
                    <label className={labelCls}>Print / anexo da peça</label>
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
                                notificarApp(err?.message || 'Não foi possível ler a imagem.');
                            }
                        }}
                    />
                    {folhaPreview && (
                        <img src={folhaPreview} alt="Print" className="mt-2 max-h-28 rounded-[6px] border border-[#262A33] object-contain" />
                    )}
                    <p className="text-[10px] text-[#565B68] mt-1">Print da folha CAM ou foto da peça. Uma imagem por kanban — escolher outra substitui a anterior.</p>
                </div>

                <p className="text-[11px] text-[#7B808F] leading-relaxed">
                    O anexo aparece no cartão e na folha A4. Tempos previstos você digita acima (ou usa a calculadora de eletrofio).
                </p>

                <div className="flex gap-3 pt-2 border-t border-[#262A33]">
                    <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" variant="primary" className="flex-[2]" disabled={isSubmitting}>
                        {isSubmitting ? 'Criando...' : 'Enviar para A fazer'}
                    </Button>
                </div>
                </>
            </form>
        </Modal>
            <Modal
                isOpen={showEdmCalc}
                onClose={() => setShowEdmCalc(false)}
                title="Calculadora EDM"
                maxWidth="max-w-md"
                overlayClassName="z-[210]"
            >
                <CalculadoraTempoModal
                    initialQuantidade={parseInt(quantidade, 10) || 1}
                    onCalculate={(h, m, qtd) => {
                        setEdmTempo({ horas: h, minutos: m });
                        setCorteEdmH(String(h));
                        setCorteEdmM(String(m));
                        if (qtd) setQuantidade(qtd);
                        setShowEdmCalc(false);
                    }}
                    onClose={() => setShowEdmCalc(false)}
                />
            </Modal>
        </>
    );
}
