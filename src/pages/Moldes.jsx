import React, { useMemo, useState } from 'react';
import {
    FolderKanban, Plus, Filter, CheckCircle2, Package, ChevronRight, Send, BarChart3,
} from 'lucide-react';
import RelatorioMoldeModal from '../components/moldes/RelatorioMoldeModal';
import { useAppStore } from '../store/useAppStore';
import { agruparCarteira, labelSetor, statusEhConcluido, kanbanEmFila } from '../constants/osWorkflow';
import { resolveFolhaImagemSrc } from '../services/osPrints';
import NovaOSForm from '../components/kanban/NovaOSForm';
import AcompanhamentoModal from '../components/kanban/AcompanhamentoModal';

const FILTROS = [
    { id: 'todos', label: 'Todas' },
    { id: 'fila', label: 'Na fila' },
    { id: 'liberadas', label: 'No setor' },
    { id: 'abertas', label: 'Em aberto' },
    { id: 'terceiro', label: 'Serviço fora' },
];

const SETORES_ENVIO = [
    { id: 'CNC', label: 'CNC' },
    { id: 'EDM_FIO', label: 'Eletrofio' },
    { id: 'EXTERNO', label: 'Serviço fora' },
];

function progressoGrupo(kanbans) {
    const total = kanbans.length || 1;
    const done = kanbans.filter(statusEhConcluido).length;
    const naFila = kanbans.filter(kanbanEmFila).length;
    return { total, done, naFila, pct: Math.round((done / total) * 100) };
}

function codigoPeca(os) {
    return os.codigo_peca || os.codigoPeca || '—';
}

function codigoMoldeGrupo(g) {
    return g.head?.codigo_molde || g.head?.codigoMolde || g.titulo || '—';
}

function chegadaGrupo(g) {
    const t = g.head?.created_at || g.head?.createdAt;
    const ms = t ? new Date(t).getTime() : 0;
    return Number.isFinite(ms) ? ms : 0;
}

function ConfirmEnviarSetorModal({
    open, pecas, setor, onSetor, onConfirm, onCancel, enviando,
}) {
    if (!open || !pecas?.length) return null;
    const uma = pecas.length === 1;
    const lista = pecas.slice(0, 5).map(codigoPeca).join(', ');
    const extra = pecas.length > 5 ? ` e mais ${pecas.length - 5}` : '';

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/75" aria-label="Fechar" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-[#262A33] bg-[#181B22] p-5 shadow-xl">
                <p className="font-['Space_Grotesk'] text-[15px] font-semibold text-[#E7E9ED]">Enviar para o setor</p>
                <p className="mt-3 text-[13px] text-[#E7E9ED] leading-relaxed">
                    {uma ? (
                        <>
                            Deseja enviar a peça <span className="font-semibold text-[#D97D3D]">{codigoPeca(pecas[0])}</span>
                            {' '}para o setor de <span className="font-semibold">{labelSetor(setor)}</span>?
                        </>
                    ) : (
                        <>
                            Deseja enviar <span className="font-semibold">{pecas.length} peças</span>
                            {' '}({lista}{extra}) para o setor de <span className="font-semibold">{labelSetor(setor)}</span>?
                        </>
                    )}
                </p>
                <p className="mt-2 text-[12px] text-[#7B808F]">
                    A peça sai da fila do molde e passa a aparecer no Kanban do setor escolhido.
                </p>
                <label className="mt-4 block text-[11px] text-[#7B808F]">
                    Setor de destino
                    <select
                        value={setor}
                        onChange={(e) => onSetor(e.target.value)}
                        className="mt-1 w-full rounded-md border border-[#333844] bg-[#111318] px-3 py-2 text-sm text-[#E7E9ED]"
                    >
                        {SETORES_ENVIO.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>
                </label>
                <div className="mt-5 flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={enviando}
                        className="rounded-md border border-[#333844] px-4 py-2 text-[13px] text-[#E7E9ED]"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={enviando}
                        className="rounded-md bg-[#D97D3D] px-4 py-2 text-[13px] font-semibold text-[#111318] disabled:opacity-50"
                    >
                        {enviando ? 'Enviando…' : 'Sim, enviar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Moldes({ onNavigate }) {
    const kanban = useAppStore((s) => s.kanban);
    const config = useAppStore((s) => s.configuracoesGlobais);
    const editOrdemServico = useAppStore((s) => s.editOrdemServico);
    const setActiveSector = useAppStore((s) => s.setActiveSector);
    const irParaKanban = useAppStore((s) => s.irParaKanban);

    const [manualOpen, setManualOpen] = useState(false);
    const [novaOsMolde, setNovaOsMolde] = useState(false);
    const [filtro, setFiltro] = useState('fila');
    const [selecionado, setSelecionado] = useState(null);
    const [idsMarcados, setIdsMarcados] = useState(() => new Set());
    const [enviando, setEnviando] = useState(false);
    const [selectedOs, setSelectedOs] = useState(null);
    const [toast, setToast] = useState('');
    const [confirmEnvio, setConfirmEnvio] = useState(null);
    const [relatorioMoldeOpen, setRelatorioMoldeOpen] = useState(false);

    const grupos = useMemo(() => {
        return agruparCarteira(kanban, config || {})
            .filter((g) => g.isMolde)
            .sort((a, b) => chegadaGrupo(b) - chegadaGrupo(a));
    }, [kanban, config]);

    const detalhe = useMemo(
        () => grupos.find((g) => g.grupoId === selecionado) || null,
        [grupos, selecionado],
    );

    const pecasFiltradas = useMemo(() => {
        if (!detalhe) return [];
        return detalhe.kanbans.filter((os) => {
            const setor = os.setor || os.tipo_processo || '';
            if (filtro === 'todos') return true;
            if (filtro === 'fila') return kanbanEmFila(os);
            if (filtro === 'liberadas') return !kanbanEmFila(os);
            if (filtro === 'abertas') return !statusEhConcluido(os);
            if (filtro === 'terceiro') return setor === 'EXTERNO';
            return true;
        });
    }, [detalhe, filtro]);

    const selecionadasNaFila = useMemo(() => {
        if (!detalhe || !idsMarcados.size) return [];
        return detalhe.kanbans.filter((k) => idsMarcados.has(k.id) && kanbanEmFila(k));
    }, [detalhe, idsMarcados]);

    const showToast = (msg) => {
        setToast(msg);
        window.setTimeout(() => setToast(''), 4000);
    };

    const toggleMarca = (id) => {
        setIdsMarcados((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const abrirConfirmacao = (pecas, setorSugerido) => {
        if (!pecas.length) return;
        setConfirmEnvio({
            pecas,
            setor: setorSugerido || pecas[0]?.setor || pecas[0]?.tipo_processo || 'CNC',
        });
    };

    const executarEnvio = async () => {
        if (!confirmEnvio?.pecas?.length) return;
        const { pecas, setor } = confirmEnvio;
        setEnviando(true);
        try {
            await Promise.all(pecas.map(async (os) => {
                const nx = { ...(os.nx_import || os.nxImport || {}), em_fila: false };
                await editOrdemServico(os.id, {
                    setor,
                    programado: setor === 'EXTERNO',
                    em_fila: false,
                    emFila: false,
                    nxImport: nx,
                });
            }));
            setIdsMarcados(new Set());
            setConfirmEnvio(null);
            setActiveSector(setor === 'EXTERNO' ? 'TODOS' : setor);
            const nomes = pecas.length === 1
                ? codigoPeca(pecas[0])
                : `${pecas.length} peças`;
            showToast(`${nomes} enviada(s) para ${labelSetor(setor)}. Confira no Kanban do setor.`);
        } catch (e) {
            alert(e?.message || 'Falha ao enviar.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 pb-6 w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 bg-[#181B22] p-5 rounded-[10px] border border-[#262A33]">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[rgba(217,125,61,0.1)] rounded-[8px] border border-[#D97D3D]/20 text-[#D97D3D] shrink-0">
                        <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-['Space_Grotesk'] text-lg font-semibold text-[#E7E9ED]">Moldes</h2>
                        <p className="text-[#565B68] mt-0.5 text-xs max-w-xl">
                            Ordem de chegada (recentes no topo) · Nova O.S. → Molde para cadastrar ou importar peças.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => { setNovaOsMolde(true); setManualOpen(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[7px] bg-[#D97D3D] text-[#111318] text-xs font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Nova O.S.
                    </button>
                </div>
            </div>

            {!grupos.length ? (
                <div className="rounded-[10px] border border-dashed border-[#333844] bg-[#181B22] px-6 py-14 text-center">
                    <Package className="w-8 h-8 text-[#D97D3D] mx-auto mb-3" />
                    <p className="text-sm text-[#E7E9ED] font-medium">Nenhum molde na carteira ainda</p>
                    <p className="text-[12px] text-[#7B808F] mt-2 max-w-md mx-auto">
                        Abra Nova O.S., escolha Molde e cadastre manualmente ou importe por CSV/PDF (beta).
                    </p>
                    <button
                        type="button"
                        onClick={() => { setNovaOsMolde(true); setManualOpen(true); }}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-[7px] bg-[#D97D3D] text-[#111318] text-xs font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Nova O.S. — Molde
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4">
                    {toast ? (
                        <div className="xl:col-span-2 rounded-[8px] border border-[#4A9D74]/40 bg-[#4A9D74]/10 px-4 py-2 text-[12px] text-[#E7E9ED]">
                            {toast}
                        </div>
                    ) : null}
                    <div className="space-y-2">
                        {grupos.map((g) => {
                            const prog = progressoGrupo(g.kanbans);
                            const ativo = selecionado === g.grupoId;
                            const thumb = resolveFolhaImagemSrc(
                                g.kanbans.find((k) => k.folha_imagem || k.folhaImagem)?.folha_imagem
                                || g.kanbans.find((k) => k.folha_imagem || k.folhaImagem)?.folhaImagem,
                            );
                            return (
                                <button
                                    key={g.grupoId}
                                    type="button"
                                    onClick={() => {
                                        setSelecionado(g.grupoId);
                                        setIdsMarcados(new Set());
                                        setFiltro('fila');
                                    }}
                                    className={`w-full text-left rounded-[10px] border p-3.5 transition-colors ${
                                        ativo ? 'border-[#D97D3D] bg-[#D97D3D]/10' : 'border-[#262A33] bg-[#181B22] hover:border-[#333844]'
                                    }`}
                                >
                                    <div className="flex gap-3">
                                        <div className="w-14 h-10 rounded-md border border-[#262A33] bg-white overflow-hidden shrink-0 flex items-center justify-center">
                                            {thumb ? (
                                                <img src={thumb} alt="" className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#565B68] text-[10px]">PDF</div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-['Space_Grotesk'] text-sm font-semibold text-[#E7E9ED] truncate">
                                                    {g.cliente || 'Cliente não informado'}
                                                </p>
                                                <span className="font-mono text-[12px] text-[#D97D3D] shrink-0">{prog.pct}%</span>
                                            </div>
                                            <p className="text-[11px] text-[#7B808F] truncate mt-0.5">
                                                Molde {codigoMoldeGrupo(g)} · {prog.total} peças
                                            </p>
                                            <p className="text-[10px] text-[#565B68] mt-1.5">
                                                {prog.done}/{prog.total} concluídos
                                                {prog.naFila ? ` · ${prog.naFila} na fila` : ''}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="rounded-[10px] border border-[#262A33] bg-[#181B22] min-h-[320px] flex flex-col">
                        {!detalhe ? (
                            <p className="p-6 text-sm text-[#7B808F]">Selecione um molde à esquerda.</p>
                        ) : (
                            <>
                                <div className="px-4 py-3 border-b border-[#262A33] flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-['Space_Grotesk'] text-[15px] text-[#E7E9ED]">
                                            {detalhe.cliente || 'Cliente não informado'}
                                        </p>
                                        <p className="text-[11px] text-[#7B808F] mt-0.5">
                                            Molde {codigoMoldeGrupo(detalhe)} · {detalhe.kanbans.length} peças
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRelatorioMoldeOpen(true)}
                                        className="inline-flex items-center gap-1.5 shrink-0 rounded-md border border-[#333844] px-2.5 py-1.5 text-[11px] font-medium text-[#E7E9ED] hover:bg-[#1F232B]"
                                    >
                                        <BarChart3 className="w-3.5 h-3.5 text-[#D97D3D]" />
                                        Horas do molde
                                    </button>
                                </div>

                                <div className="px-4 py-2 border-b border-[#262A33] bg-[#111318]/50">
                                    <p className="text-[10px] uppercase tracking-wider text-[#565B68] mb-1.5 flex items-center gap-1">
                                        <Filter className="w-3 h-3" /> Filtrar lista
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {FILTROS.map((f) => (
                                            <button
                                                key={f.id}
                                                type="button"
                                                onClick={() => setFiltro(f.id)}
                                                className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
                                                    filtro === f.id
                                                        ? 'bg-[#333844] text-[#E7E9ED] ring-1 ring-[#565B68]'
                                                        : 'border border-[#333844] text-[#9DA2AE]'
                                                }`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selecionadasNaFila.length > 0 && (
                                    <div className="px-4 py-2.5 border-b border-[#262A33] bg-[#111318] flex flex-wrap items-center gap-2">
                                        <span className="text-[11px] text-[#9DA2AE]">{selecionadasNaFila.length} na fila selecionada(s)</span>
                                        <button
                                            type="button"
                                            disabled={enviando}
                                            onClick={() => abrirConfirmacao(
                                                selecionadasNaFila,
                                                selecionadasNaFila[0]?.setor || selecionadasNaFila[0]?.tipo_processo || 'CNC',
                                            )}
                                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-[#D97D3D] text-[#111318] font-semibold disabled:opacity-50"
                                        >
                                            <Send className="w-3 h-3" />
                                            Liberar selecionadas…
                                        </button>
                                        <button type="button" onClick={() => setIdsMarcados(new Set())} className="text-[11px] text-[#7B808F]">
                                            Limpar seleção
                                        </button>
                                    </div>
                                )}

                                <ul className="divide-y divide-[#262A33] overflow-y-auto max-h-[55vh]">
                                    {pecasFiltradas.map((os) => {
                                        const img = resolveFolhaImagemSrc(os.folha_imagem || os.folhaImagem);
                                        const done = statusEhConcluido(os);
                                        const naFila = kanbanEmFila(os);
                                        const marcado = idsMarcados.has(os.id);
                                        const setorSug = os.setor || os.tipo_processo || 'CNC';
                                        return (
                                            <li key={os.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#1F232B]">
                                                <input
                                                    type="checkbox"
                                                    checked={marcado}
                                                    onChange={() => toggleMarca(os.id)}
                                                    className="accent-[#D97D3D] shrink-0"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOs(os)}
                                                    className="w-[4.5rem] h-10 rounded border border-[#262A33] overflow-hidden bg-white shrink-0 flex items-center justify-center"
                                                >
                                                    {img ? <img src={img} alt="" className="max-w-full max-h-full object-contain" /> : null}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex-1 min-w-0 text-left flex items-center justify-between gap-2"
                                                    onClick={() => setSelectedOs(os)}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-[#E7E9ED] truncate font-medium">{codigoPeca(os)}</p>
                                                        <p className="text-[11px] text-[#7B808F] truncate">
                                                            {labelSetor(setorSug)} · {os.componente_molde || os.componenteMolde || '—'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-[#565B68] shrink-0" />
                                                </button>
                                                {done ? (
                                                    <CheckCircle2 className="w-4 h-4 text-[#4A9D74] shrink-0" />
                                                ) : naFila ? (
                                                    <button
                                                        type="button"
                                                        disabled={enviando}
                                                        onClick={() => abrirConfirmacao([os], setorSug)}
                                                        className="inline-flex items-center gap-0.5 shrink-0 rounded-md border border-[#D97D3D]/50 bg-[#D97D3D]/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#D97D3D] hover:bg-[#D97D3D]/25 disabled:opacity-50"
                                                        title="Liberar para o setor (com confirmação)"
                                                    >
                                                        <Send className="w-3 h-3" />
                                                        Liberar
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            irParaKanban(os);
                                                            onNavigate?.('kanban');
                                                        }}
                                                        className="text-[10px] uppercase tracking-wider text-[#9DA2AE] shrink-0 hover:text-[#D97D3D] px-1"
                                                    >
                                                        Kanban
                                                    </button>
                                                )}
                                            </li>
                                        );
                                    })}
                                    {!pecasFiltradas.length && (
                                        <li className="px-4 py-8 text-sm text-[#7B808F] text-center">Nenhuma peça neste filtro.</li>
                                    )}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            )}

            <ConfirmEnviarSetorModal
                open={!!confirmEnvio}
                pecas={confirmEnvio?.pecas || []}
                setor={confirmEnvio?.setor || 'CNC'}
                onSetor={(setor) => setConfirmEnvio((c) => (c ? { ...c, setor } : c))}
                onConfirm={executarEnvio}
                onCancel={() => setConfirmEnvio(null)}
                enviando={enviando}
            />

            <NovaOSForm
                isOpen={manualOpen}
                onClose={() => { setManualOpen(false); setNovaOsMolde(false); }}
                initialModo={novaOsMolde ? 'molde' : undefined}
                onCreated={(criados) => {
                    const gid = criados?.[0]?.os_grupo_id || criados?.[0]?.osGrupoId;
                    if (gid) setSelecionado(gid);
                    setNovaOsMolde(false);
                }}
            />
            {selectedOs ? (
                <AcompanhamentoModal
                    isOpen={!!selectedOs}
                    osData={selectedOs}
                    onClose={() => setSelectedOs(null)}
                />
            ) : null}

            <RelatorioMoldeModal
                open={relatorioMoldeOpen && !!detalhe}
                grupo={detalhe}
                onClose={() => setRelatorioMoldeOpen(false)}
            />
        </div>
    );
}
