import React, { useMemo, useRef, useState } from 'react';
import { FolderUp, Loader2, X, Check, AlertTriangle, ChevronDown, Calendar } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { montarRoteiro, geraCartaoEtapa, labelSetor } from '../../constants/osWorkflow';
import { nomesClienteAutocomplete } from '../../constants/roles';
import { useAuthStore } from '../../store/useAuthStore';
import { parseZw3dPasta } from '../../utils/zw3dFolhaParser';

const SETORES = [
    { id: 'CNC', label: 'CNC' },
    { id: 'EDM_FIO', label: 'Eletrofio' },
    { id: 'EXTERNO', label: 'Serviço fora' },
];

export default function ImportarMoldeModal({ open, onClose, onCreated }) {
    const addGrupoOrdensServico = useAppStore((s) => s.addGrupoOrdensServico);
    const addOrdemServico = useAppStore((s) => s.addOrdemServico);
    const clientes = useAppStore((s) => s.clientes);
    const nomeEmpresa = useAuthStore((s) => s.nomeEmpresa);
    const nomesClientes = nomesClienteAutocomplete(clientes, nomeEmpresa);

    const pdfInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const prazoInputRef = useRef(null);

    const [dragOver, setDragOver] = useState(false);
    const [menuAberto, setMenuAberto] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState('');
    const [codigoMolde, setCodigoMolde] = useState('');
    const [cliente, setCliente] = useState('');
    const [prazo, setPrazo] = useState('');
    const [pecas, setPecas] = useState([]);

    const selecionadas = useMemo(() => pecas.filter((p) => p.selected && !p.erro), [pecas]);

    if (!open) return null;

    const reset = () => {
        setPecas([]);
        setCodigoMolde('');
        setCliente('');
        setPrazo('');
        setErro('');
        setLoading(false);
        setSaving(false);
        setMenuAberto(false);
    };

    const fechar = () => {
        reset();
        onClose?.();
    };

    const ingestFiles = async (fileList) => {
        const files = [...(fileList || [])];
        if (!files.length) return;
        setLoading(true);
        setErro('');
        setMenuAberto(false);
        try {
            const { codigoMolde: molde, pecas: rows, resumo } = await parseZw3dPasta(files);
            setCodigoMolde(molde);
            setPecas(rows.map((r) => ({ ...r, selected: !r.erro && !r.precisaRevisao })));
            if (!rows.length) setErro('Nenhum PDF encontrado.');
            else if (resumo?.revisao) {
                setErro(`${resumo.processadas}/${resumo.totalFolhas} processadas · ${resumo.revisao} para revisão (sem card até corrigir).`);
            } else if (resumo) {
                setErro('');
            }
        } catch (e) {
            setErro(e?.message || 'Falha ao ler as folhas.');
        } finally {
            setLoading(false);
        }
    };

    const onDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        const items = e.dataTransfer?.items;
        if (items && items.length) {
            const collected = [];
            const walk = async (entry, path = '') => {
                if (entry.isFile) {
                    const file = await new Promise((res, rej) => entry.file(res, rej));
                    Object.defineProperty(file, 'webkitRelativePath', { value: `${path}${file.name}` });
                    collected.push(file);
                } else if (entry.isDirectory) {
                    const reader = entry.createReader();
                    const readAll = () => new Promise((resolve) => {
                        const acc = [];
                        const pump = () => {
                            reader.readEntries((batch) => {
                                if (!batch.length) resolve(acc);
                                else { acc.push(...batch); pump(); }
                            });
                        };
                        pump();
                    });
                    const kids = await readAll();
                    for (const kid of kids) await walk(kid, `${path}${entry.name}/`);
                }
            };
            const entries = [];
            for (const item of items) {
                const entry = item.webkitGetAsEntry?.();
                if (entry) entries.push(entry);
            }
            if (entries.length) {
                for (const entry of entries) await walk(entry);
                await ingestFiles(collected);
                return;
            }
        }
        await ingestFiles(e.dataTransfer.files);
    };

    const patchPeca = (idx, patch) => {
        setPecas((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
    };

    const criar = async () => {
        if (!cliente.trim()) {
            setErro('Informe o cliente.');
            return;
        }
        if (!selecionadas.length) {
            setErro('Selecione ao menos uma peça.');
            return;
        }
        setSaving(true);
        setErro('');
        try {
            const molde = codigoMolde.trim() || 'Molde';
            const linhas = [];
            selecionadas.forEach((p) => {
                const etapas = (p.etapas || []).length ? p.etapas : [p.setor || 'CNC'];
                const roteiro = montarRoteiro(etapas);
                const etapasCard = etapas.filter((s) => geraCartaoEtapa(s));
                const cards = etapasCard.length ? etapasCard : [p.setor || 'CNC'];
                const componente = [p.material, p.processo, p.tratamento].filter(Boolean).join(' · ')
                    || p.codigoPeca;
                const obsBase = [
                    p.material && `Material: ${p.material}`,
                    p.processo && `Processo: ${p.processo}`,
                    p.tratamento && `Tratamento: ${p.tratamento}`,
                    `Arquivo: ${p.fileName}`,
                ].filter(Boolean).join('\n');
                const nxBase = {
                    origem: 'zw3d',
                    em_fila: true,
                    material: p.material || null,
                    processo: p.processo || null,
                    tratamento: p.tratamento || null,
                    arquivo: p.fileName,
                };
                cards.forEach((setor) => {
                    const sufixo = cards.length > 1 ? ` · ${labelSetor(setor)}` : '';
                    linhas.push({
                        codigoPeca: `${p.codigoPeca}${sufixo}`,
                        codigoMolde: molde,
                        componente,
                        setor,
                        quantidade: p.quantidade || 1,
                        roteiro,
                        folhaBlob: p.folhaBlob || null,
                        programado: setor === 'EXTERNO',
                        em_fila: true,
                        nxImport: { ...nxBase },
                        observacoes: obsBase,
                    });
                });
            });

            const cabecalho = {
                cliente: cliente.trim(),
                codigoPeca: molde,
                codigoMolde: molde,
                prazoEntrega: prazo || '',
                quantidade: 1,
                status: 'A fazer',
                programado: false,
                isPrioridade: false,
                em_fila: true,
                observacoes: `Importado ZW3D · ${linhas.length} peças na fila do molde`,
            };

            let criados;
            if (linhas.length > 1) {
                criados = await addGrupoOrdensServico(cabecalho, linhas);
            } else {
                const one = await addOrdemServico({
                    ...cabecalho,
                    setor: linhas[0].setor,
                    componenteMolde: linhas[0].componente,
                    quantidade: linhas[0].quantidade,
                    programado: linhas[0].setor === 'EXTERNO',
                    roteiro_ordem: 1,
                    roteiro: linhas[0].roteiro,
                    folhaBlob: linhas[0].folhaBlob,
                    observacoes: linhas[0].observacoes,
                    em_fila: true,
                    nxImport: linhas[0].nxImport,
                }, { optimistic: false });
                criados = one ? [one] : [];
            }

            const { editOrdemServico } = useAppStore.getState();
            for (let i = 0; i < criados.length; i++) {
                const row = linhas[i];
                const os = criados[i];
                if (!os?.id) continue;
                try {
                    await editOrdemServico(os.id, {
                        folhaBlob: row.folhaBlob || undefined,
                        observacoes: row.observacoes,
                        componenteMolde: row.componente,
                        codigoMolde: molde,
                        em_fila: true,
                        nxImport: row.nxImport,
                    });
                } catch (e) {
                    console.warn('Metadados peça', e);
                }
            }

            fechar();
            onCreated?.(criados, molde);
        } catch (e) {
            setErro(e?.message || 'Não foi possível criar o molde.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <button type="button" className="absolute inset-0 bg-black/70" aria-label="Fechar" onClick={fechar} />
            <div className="relative z-10 flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-[#262A33] bg-[#181B22] sm:rounded-xl">
                <div className="flex items-start justify-between gap-3 border-b border-[#262A33] px-5 py-4">
                    <div>
                        <p className="font-['Space_Grotesk'] text-[15px] text-[#E7E9ED]">Importar molde (ZW3D)</p>
                        <p className="mt-0.5 text-[12px] text-[#7B808F]">
                            PDF multi-página (1 folha = 1 peça) ou vários PDFs. Cada peça entra na fila do molde — só vai ao quadro do setor quando liberada.
                        </p>
                    </div>
                    <button type="button" onClick={fechar} className="rounded-md p-1 text-[#7B808F] hover:text-[#E7E9ED]" aria-label="Fechar">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-4 space-y-4">
                    {!pecas.length ? (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                            className={`flex flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed px-4 py-10 transition-colors ${
                                dragOver ? 'border-[#D97D3D] bg-[#D97D3D]/10' : 'border-[#333844] bg-[#111318]'
                            }`}
                        >
                            {loading ? (
                                <Loader2 className="h-8 w-8 text-[#D97D3D] animate-spin" />
                            ) : (
                                <FolderUp className="h-8 w-8 text-[#D97D3D]" />
                            )}
                            <div className="text-center px-2">
                                <p className="text-sm font-medium text-[#E7E9ED]">
                                    {loading ? 'Lendo folhas…' : 'Solte PDFs ou a pasta do molde'}
                                </p>
                                <p className="text-[12px] text-[#7B808F] mt-1">
                                    Ou use o botão — arquivos soltos e pastas no mesmo fluxo.
                                </p>
                            </div>
                            <input
                                ref={pdfInputRef}
                                type="file"
                                accept="application/pdf,.pdf"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    ingestFiles(e.target.files);
                                    e.target.value = '';
                                }}
                            />
                            <input
                                ref={folderInputRef}
                                type="file"
                                className="hidden"
                                // @ts-expect-error webkitdirectory
                                webkitdirectory=""
                                directory=""
                                multiple
                                onChange={(e) => {
                                    ingestFiles(e.target.files);
                                    e.target.value = '';
                                }}
                            />
                            {!loading && (
                                <div className="relative mt-1">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#D97D3D] px-3.5 py-2 text-xs font-semibold text-[#111318]"
                                        onClick={() => setMenuAberto((v) => !v)}
                                        aria-expanded={menuAberto}
                                    >
                                        <FolderUp className="h-3.5 w-3.5" />
                                        Selecionar folhas
                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${menuAberto ? 'rotate-180' : ''}`} />
                                    </button>
                                    {menuAberto ? (
                                        <div className="absolute left-1/2 z-20 mt-1.5 w-52 -translate-x-1/2 overflow-hidden rounded-[8px] border border-[#333844] bg-[#181B22] shadow-lg">
                                            <button
                                                type="button"
                                                className="block w-full px-3 py-2.5 text-left text-[12px] text-[#E7E9ED] hover:bg-[#1F232B]"
                                                onClick={() => {
                                                    setMenuAberto(false);
                                                    pdfInputRef.current?.click();
                                                }}
                                            >
                                                Arquivos PDF
                                                <span className="mt-0.5 block text-[10px] text-[#7B808F]">Vários de uma vez (Downloads)</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="block w-full border-t border-[#262A33] px-3 py-2.5 text-left text-[12px] text-[#E7E9ED] hover:bg-[#1F232B]"
                                                onClick={() => {
                                                    setMenuAberto(false);
                                                    folderInputRef.current?.click();
                                                }}
                                            >
                                                Pasta do molde
                                                <span className="mt-0.5 block text-[10px] text-[#7B808F]">Lê todos os PDFs da pasta</span>
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="rounded-[8px] border border-[#D97D3D]/30 bg-[#D97D3D]/10 px-3 py-2 text-[12px] text-[#E7E9ED]">
                                As peças vão para a <span className="font-semibold text-[#D97D3D]">fila do molde</span> (aba Moldes).
                                O kanban do setor só recebe o que você liberar.
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label className="text-[11px] text-[#7B808F] sm:col-span-1">
                                    Código do molde
                                    <input
                                        value={codigoMolde}
                                        onChange={(e) => setCodigoMolde(e.target.value)}
                                        className="mt-1 w-full rounded-md border border-[#333844] bg-[#111318] p-2.5 text-sm text-[#E7E9ED]"
                                    />
                                </label>
                                <label className="text-[11px] text-[#7B808F] sm:col-span-1">
                                    Cliente
                                    <input
                                        list="clientes-molde-import"
                                        value={cliente}
                                        onChange={(e) => setCliente(e.target.value)}
                                        className="mt-1 w-full rounded-md border border-[#333844] bg-[#111318] p-2.5 text-sm text-[#E7E9ED]"
                                        placeholder="Nome do cliente"
                                    />
                                    <datalist id="clientes-molde-import">
                                        {nomesClientes.map((n) => <option key={n} value={n} />)}
                                    </datalist>
                                </label>
                                <label className="text-[11px] text-[#7B808F]">
                                    Prazo de entrega
                                    <div className="relative mt-1">
                                        <input
                                            ref={prazoInputRef}
                                            type="date"
                                            value={prazo}
                                            onChange={(e) => setPrazo(e.target.value)}
                                            onClick={(e) => e.currentTarget.showPicker?.()}
                                            className="edm-date-input w-full rounded-md border border-[#333844] bg-[#111318] py-2.5 pl-3 pr-10 text-sm text-[#E7E9ED] cursor-pointer"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => prazoInputRef.current?.showPicker?.()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#D97D3D] hover:bg-[#D97D3D]/10"
                                            aria-label="Abrir calendário"
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <span className="mt-1 block text-[10px] text-[#565B68]">Clique no campo ou no ícone para abrir o calendário</span>
                                </label>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7B808F]">
                                    {selecionadas.length} de {pecas.length} peças · 1 kanban cada
                                </p>
                                <button
                                    type="button"
                                    className="text-[12px] text-[#D97D3D]"
                                    onClick={() => { setPecas([]); setCodigoMolde(''); }}
                                >
                                    Trocar seleção
                                </button>
                            </div>

                            <ul className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                                {pecas.map((p, idx) => (
                                    <li
                                        key={`${p.fileName}-${idx}`}
                                        className={`flex gap-3 rounded-[10px] border p-2.5 ${
                                            p.erro ? 'border-[#C85558]/40 bg-[rgba(200,85,88,0.06)]' : 'border-[#262A33] bg-[#111318]'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => patchPeca(idx, { selected: !p.selected })}
                                            disabled={!!p.erro}
                                            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                                p.selected && !p.erro
                                                    ? 'border-[#D97D3D] bg-[#D97D3D] text-[#111318]'
                                                    : 'border-[#565B68]'
                                            }`}
                                        >
                                            {p.selected && !p.erro ? <Check className="h-3 w-3" /> : null}
                                        </button>
                                        <div className="w-16 h-16 shrink-0 rounded-md border border-[#262A33] bg-white overflow-hidden flex items-center justify-center">
                                            {p.previewUrl ? (
                                                <img src={p.previewUrl} alt="" className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#565B68] bg-[#181B22]">
                                                    <AlertTriangle className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-[12px] text-[#E7E9ED]">{p.codigoPeca}</span>
                                                {p.material ? (
                                                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#333844] text-[#9DA2AE]">
                                                        {p.material}
                                                    </span>
                                                ) : null}
                                                {p.tratamento ? (
                                                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#C99A4A]/40 text-[#C99A4A]">
                                                        Têmpera
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-[11px] text-[#7B808F] truncate">
                                                {[p.material, p.processo].filter(Boolean).join(' · ') || p.fileName}
                                            </p>
                                            {p.erro ? (
                                                <p className="text-[11px] text-[#C85558]">{p.erro}</p>
                                            ) : (
                                                <>
                                                    {p.aviso ? (
                                                        <p className="text-[11px] text-[#C99A4A]">{p.aviso}</p>
                                                    ) : null}
                                                    <div className="flex flex-wrap gap-2">
                                                    <select
                                                        value={p.setor}
                                                        onChange={(e) => patchPeca(idx, { setor: e.target.value })}
                                                        className="rounded-md border border-[#333844] bg-[#181B22] px-2 py-1 text-[12px] text-[#E7E9ED]"
                                                    >
                                                        {SETORES.map((s) => (
                                                            <option key={s.id} value={s.id}>{s.label}</option>
                                                        ))}
                                                    </select>
                                                    <span className="text-[11px] text-[#565B68] self-center">
                                                        Destino sugerido · qtd {p.quantidade}
                                                    </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    {erro ? <p className="text-[12px] text-[#C85558]">{erro}</p> : null}
                </div>

                <div className="flex gap-2 border-t border-[#262A33] px-5 py-3">
                    <button
                        type="button"
                        onClick={criar}
                        disabled={saving || !selecionadas.length}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#D97D3D] py-2 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32] disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Enviar para fila · {selecionadas.length} peça{selecionadas.length === 1 ? '' : 's'}
                    </button>
                    <button type="button" onClick={fechar} className="rounded-md border border-[#333844] px-4 py-2 text-[13px] text-[#E7E9ED]">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
