import React, { useMemo, useRef, useState } from 'react';
import {
    FolderUp, Loader2, X, ChevronDown, Calendar, FileSpreadsheet, FileText, Plus, Download, Link2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { montarRoteiro, geraCartaoEtapa, labelSetor } from '../../constants/osWorkflow';
import { nomesClienteAutocomplete } from '../../constants/roles';
import { useAuthStore } from '../../store/useAuthStore';
import { parseZw3dPasta, montarRoteiroSugestao } from '../../utils/zw3dFolhaParser';
import { parseMoldeCsv, vincularPdfsCsv, downloadCsvTemplate } from '../../utils/moldeCsvParser';
import PecaImportRow from './PecaImportRow';
import CsvFormatGuia from './CsvFormatGuia';

const MODOS = [
    {
        id: 'pdf',
        label: 'Folhas PDF',
        icon: FileText,
        desc: 'ZW3D ou PDFs soltos — leitura automática com revisão manual quando falhar.',
    },
    {
        id: 'csv',
        label: 'Planilha CSV',
        icon: FileSpreadsheet,
        desc: 'Lista estruturada de peças — mais confiável quando o PDF varia.',
    },
    {
        id: 'csv_pdf',
        label: 'CSV + PDFs',
        icon: Link2,
        desc: 'Planilha com dados + PDFs para desenho (campo arquivo_pdf).',
    },
];

function novaPecaManual() {
    return {
        fileName: 'Manual',
        codigoPeca: '',
        material: '',
        processo: '',
        tratamento: '',
        quantidade: 1,
        setor: 'CNC',
        etapas: ['CNC'],
        origemImport: 'manual',
        leituraAutomatica: false,
        precisaRevisao: true,
        avisoRevisao: 'Peça adicionada manualmente.',
        selected: true,
        folhaBlob: null,
        previewUrl: '',
    };
}

function montarLinhasKanban(pecas, molde, origemLabel) {
    const linhas = [];
    pecas.forEach((p) => {
        const etapas = (p.etapas || []).length ? p.etapas : montarRoteiroSugestao({
            setor: p.setor || 'CNC',
            processo: p.processo,
            tratamento: p.tratamento,
        });
        const roteiro = montarRoteiro(etapas);
        const etapasCard = etapas.filter((s) => geraCartaoEtapa(s));
        const cards = etapasCard.length ? etapasCard : [p.setor || 'CNC'];
        const componente = [p.material, p.processo, p.tratamento].filter(Boolean).join(' · ')
            || p.codigoPeca;
        const obsBase = [
            p.material && `Material: ${p.material}`,
            p.processo && `Processo: ${p.processo}`,
            p.tratamento && `Tratamento: ${p.tratamento}`,
            p.fileName && `Arquivo: ${p.fileName}`,
        ].filter(Boolean).join('\n');
        const nxBase = {
            origem: origemLabel,
            material: p.material || null,
            processo: p.processo || null,
            tratamento: p.tratamento || null,
            arquivo: p.fileName || p.arquivoPdf || null,
        };
        cards.forEach((setor) => {
            const sufixo = cards.length > 1 ? ` · ${labelSetor(setor)}` : '';
            linhas.push({
                codigoPeca: `${String(p.codigoPeca).trim()}${sufixo}`,
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
    return linhas;
}

export default function ImportarMoldePanel({
    open = true,
    embedded = false,
    onClose,
    onCreated,
    calibracao,
    cabecalhoExterno,
    onOpenAjuda,
}) {
    const addGrupoOrdensServico = useAppStore((s) => s.addGrupoOrdensServico);
    const addOrdemServico = useAppStore((s) => s.addOrdemServico);
    const clientes = useAppStore((s) => s.clientes);
    const nomeEmpresa = useAuthStore((s) => s.nomeEmpresa);
    const nomesClientes = nomesClienteAutocomplete(clientes, nomeEmpresa);

    const pdfInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const csvInputRef = useRef(null);
    const csvPdfInputRef = useRef(null);
    const prazoInputRef = useRef(null);

    const [modo, setModo] = useState('pdf');
    const [dragOver, setDragOver] = useState(false);
    const [menuAberto, setMenuAberto] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [info, setInfo] = useState('');
    const [erro, setErro] = useState('');
    const [codigoMolde, setCodigoMolde] = useState('');
    const [cliente, setCliente] = useState('');
    const [prazo, setPrazo] = useState('');
    const [pecas, setPecas] = useState([]);
    const [csvPendentes, setCsvPendentes] = useState(null);

    const selecionadas = useMemo(
        () => pecas.filter((p) => p.selected && String(p.codigoPeca || '').trim()),
        [pecas],
    );

    const resumoRevisao = useMemo(
        () => pecas.filter((p) => p.selected && (!p.leituraAutomatica || p.precisaRevisao)).length,
        [pecas],
    );

    if (!open) return null;

    const clienteFinal = () => (cabecalhoExterno?.cliente ?? cliente).trim();
    const moldeFinal = () => (cabecalhoExterno?.codigoMolde ?? codigoMolde).trim();
    const prazoFinal = () => cabecalhoExterno?.prazo ?? prazo;

    const reset = () => {
        setPecas([]);
        setCsvPendentes(null);
        setCodigoMolde('');
        setCliente('');
        setPrazo('');
        setErro('');
        setInfo('');
        setLoading(false);
        setSaving(false);
        setMenuAberto(false);
        setModo('pdf');
    };

    const fechar = () => {
        reset();
        onClose?.();
    };

    const patchPeca = (idx, patch) => {
        setPecas((prev) => prev.map((p, i) => {
            if (i !== idx) return p;
            const next = { ...p, ...patch };
            if (patch.setor && !patch.etapas) {
                next.etapas = montarRoteiroSugestao({
                    setor: patch.setor,
                    processo: next.processo,
                    tratamento: next.tratamento,
                });
            }
            return next;
        }));
    };

    const removerPeca = (idx) => {
        setPecas((prev) => prev.filter((_, i) => i !== idx));
    };

    const adicionarPecaManual = () => {
        setPecas((prev) => [...prev, novaPecaManual()]);
    };

    const aplicarPecas = (rows, meta = {}) => {
        if (meta.codigoMolde) setCodigoMolde(meta.codigoMolde);
        if (meta.cliente) setCliente(meta.cliente);
        if (meta.prazo) setPrazo(meta.prazo);
        setPecas(rows.map((r) => ({ ...r, selected: r.selected !== false })));
    };

    const ingestPdf = async (fileList) => {
        const files = [...(fileList || [])].filter((f) => /\.pdf$/i.test(f.name));
        if (!files.length) {
            setErro('Nenhum PDF encontrado.');
            return;
        }
        setLoading(true);
        setErro('');
        setInfo('');
        try {
            const { codigoMolde: molde, pecas: rows, resumo } = await parseZw3dPasta(files, { calibracao });
            aplicarPecas(rows, { codigoMolde: molde });
            const auto = resumo?.processadas ?? rows.filter((r) => r.leituraAutomatica).length;
            const rev = resumo?.revisao ?? rows.filter((r) => !r.leituraAutomatica).length;
            setInfo(`${rows.length} peça(s) · ${auto} lida(s) automaticamente · ${rev} para revisão manual`);
        } catch (e) {
            setErro(e?.message || 'Falha ao ler as folhas.');
        } finally {
            setLoading(false);
        }
    };

    const ingestCsv = async (file, pdfFiles = []) => {
        setLoading(true);
        setErro('');
        setInfo('');
        try {
            const parsed = await parseMoldeCsv(file);
            let rows = parsed.pecas;
            let extra = '';

            if (pdfFiles.length) {
                const linked = await vincularPdfsCsv(rows, pdfFiles);
                rows = linked.pecas;
                extra = ` · ${linked.resumo.comPdf} com PDF vinculado`;
            }

            aplicarPecas(rows, {
                codigoMolde: parsed.codigoMolde,
                cliente: parsed.cliente,
                prazo: parsed.prazo,
            });
            setCsvPendentes(null);
            setInfo(`${rows.length} peça(s) da planilha${extra}${
                parsed.resumo?.colunasIgnoradas?.length
                    ? ` · colunas ignoradas: ${parsed.resumo.colunasIgnoradas.join(', ')}`
                    : ''
            }${parsed.resumo?.delimiter ? ` · separador: ${parsed.resumo.delimiter}` : ''}`);
        } catch (e) {
            setErro(e?.message || 'Falha ao ler a planilha.');
        } finally {
            setLoading(false);
        }
    };

    const onDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = [...(e.dataTransfer?.files || [])];
        const pdfs = dropped.filter((f) => /\.pdf$/i.test(f.name));
        const csvs = dropped.filter((f) => /\.csv$/i.test(f.name) || /\.txt$/i.test(f.name));

        if (modo === 'csv') {
            if (csvs[0]) await ingestCsv(csvs[0]);
            else setErro('Solte um arquivo .csv');
            return;
        }

        if (modo === 'csv_pdf') {
            if (csvs[0] && !csvPendentes) {
                setCsvPendentes(csvs[0]);
                setInfo('Planilha recebida. Agora solte ou selecione os PDFs para vincular.');
                return;
            }
            if (csvPendentes && pdfs.length) {
                await ingestCsv(csvPendentes, pdfs);
                return;
            }
            if (csvs[0] && pdfs.length) {
                await ingestCsv(csvs[0], pdfs);
                return;
            }
            setErro('Modo CSV+PDF: envie a planilha e depois os PDFs (ou os dois juntos).');
            return;
        }

        // PDF mode — suporta pasta via items
        const items = e.dataTransfer?.items;
        if (items?.length && modo === 'pdf') {
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
                await ingestPdf(collected);
                return;
            }
        }
        await ingestPdf(dropped);
    };

    const criar = async () => {
        const cli = clienteFinal();
        if (!cli) {
            setErro('Informe o cliente.');
            return;
        }
        if (!selecionadas.length) {
            setErro('Selecione ao menos uma peça com código preenchido.');
            return;
        }
        const semCodigo = pecas.filter((p) => p.selected && !String(p.codigoPeca || '').trim());
        if (semCodigo.length) {
            setErro('Todas as peças selecionadas precisam de código.');
            return;
        }

        setSaving(true);
        setErro('');
        try {
            const molde = moldeFinal() || 'Molde';
            const origemLabel = modo === 'csv' || modo === 'csv_pdf' ? 'csv' : 'zw3d';
            const linhas = montarLinhasKanban(selecionadas, molde, origemLabel);

            const cabecalho = {
                cliente: cli,
                codigoPeca: molde,
                codigoMolde: molde,
                prazoEntrega: prazoFinal() || '',
                quantidade: 1,
                status: 'A fazer',
                programado: false,
                isPrioridade: false,
                em_fila: true,
                observacoes: `Importado ${origemLabel === 'csv' ? 'CSV' : 'ZW3D/PDF'} · ${linhas.length} kanban(s) na fila`,
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

    const modoAtual = MODOS.find((m) => m.id === modo) || MODOS[0];

    const renderDropZone = () => {
        const isCsv = modo === 'csv';
        const isMix = modo === 'csv_pdf';

        return (
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed px-4 py-8 transition-colors ${
                    dragOver ? 'border-[#D97D3D] bg-[#D97D3D]/10' : 'border-[#333844] bg-[#111318]'
                }`}
            >
                {loading ? (
                    <Loader2 className="h-8 w-8 text-[#D97D3D] animate-spin" />
                ) : (
                    <modoAtual.icon className="h-8 w-8 text-[#D97D3D]" />
                )}
                <div className="text-center px-2 max-w-md">
                    <p className="text-sm font-medium text-[#E7E9ED]">
                        {loading ? 'Processando…' : modoAtual.desc}
                    </p>
                    {isMix && csvPendentes ? (
                        <p className="text-[12px] text-[#C99A4A] mt-2">
                            Planilha «{csvPendentes.name}» pronta — agora adicione os PDFs.
                        </p>
                    ) : null}
                </div>

                <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" multiple className="hidden"
                    onChange={(e) => { ingestPdf(e.target.files); e.target.value = ''; }} />
                <input ref={folderInputRef} type="file" className="hidden" webkitdirectory="" directory="" multiple
                    onChange={(e) => { ingestPdf(e.target.files); e.target.value = ''; }} />
                <input ref={csvInputRef} type="file" accept=".csv,text/csv,text/plain" className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) ingestCsv(e.target.files[0]); e.target.value = ''; }} />
                <input ref={csvPdfInputRef} type="file" accept="application/pdf,.pdf" multiple className="hidden"
                    onChange={async (e) => {
                        const pdfs = [...(e.target.files || [])];
                        if (csvPendentes) await ingestCsv(csvPendentes, pdfs);
                        e.target.value = '';
                    }} />

                {!loading && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                        {isCsv ? (
                            <>
                                <button type="button" onClick={() => downloadCsvTemplate()}
                                    className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#333844] px-3 py-2 text-xs text-[#E7E9ED]">
                                    <Download className="h-3.5 w-3.5" />
                                    Baixar modelo .csv
                                </button>
                                <a href={`${import.meta.env.BASE_URL}modelo-importacao-molde.csv`} download
                                    className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#333844] px-3 py-2 text-xs text-[#7B808F] hover:text-[#E7E9ED]">
                                    Abrir exemplo
                                </a>
                                <button type="button" onClick={() => csvInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#D97D3D] px-3.5 py-2 text-xs font-semibold text-[#111318]">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                    Selecionar planilha
                                </button>
                            </>
                        ) : isMix ? (
                            <>
                                <button type="button" onClick={() => downloadCsvTemplate()}
                                    className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#333844] px-3 py-2 text-xs text-[#E7E9ED]">
                                    <Download className="h-3.5 w-3.5" />
                                    Modelo CSV
                                </button>
                                <button type="button" onClick={() => csvInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#333844] px-3 py-2 text-xs text-[#E7E9ED]">
                                    1. Planilha
                                </button>
                                <button type="button" onClick={() => csvPdfInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#D97D3D] px-3 py-2 text-xs font-semibold text-[#111318]">
                                    2. PDFs
                                </button>
                            </>
                        ) : (
                            <div className="relative">
                                <button type="button"
                                    className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#D97D3D] px-3.5 py-2 text-xs font-semibold text-[#111318]"
                                    onClick={() => setMenuAberto((v) => !v)}>
                                    <FolderUp className="h-3.5 w-3.5" />
                                    Selecionar folhas
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${menuAberto ? 'rotate-180' : ''}`} />
                                </button>
                                {menuAberto ? (
                                    <div className="absolute left-1/2 z-20 mt-1.5 w-52 -translate-x-1/2 overflow-hidden rounded-[8px] border border-[#333844] bg-[#181B22] shadow-lg">
                                        <button type="button" className="block w-full px-3 py-2.5 text-left text-[12px] text-[#E7E9ED] hover:bg-[#1F232B]"
                                            onClick={() => { setMenuAberto(false); pdfInputRef.current?.click(); }}>
                                            Arquivos PDF
                                        </button>
                                        <button type="button" className="block w-full border-t border-[#262A33] px-3 py-2.5 text-left text-[12px] text-[#E7E9ED] hover:bg-[#1F232B]"
                                            onClick={() => { setMenuAberto(false); folderInputRef.current?.click(); }}>
                                            Pasta do molde
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const usaCabecalhoExterno = embedded && cabecalhoExterno;

    const corpo = (
        <>
            {!embedded ? (
                <div className="flex items-start justify-between gap-3 border-b border-[#262A33] px-5 py-4">
                    <div>
                        <p className="font-['Space_Grotesk'] text-[15px] text-[#E7E9ED]">Importar molde</p>
                        <p className="mt-0.5 text-[12px] text-[#7B808F]">
                            PDF, planilha CSV ou os dois. Tudo passa por revisão — nada fica bloqueado.
                        </p>
                    </div>
                    <button type="button" onClick={fechar} className="rounded-md p-1 text-[#7B808F] hover:text-[#E7E9ED]" aria-label="Fechar">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : null}

            <div className={`overflow-y-auto space-y-4 ${embedded ? '' : 'px-5 py-4 max-h-[60vh]'}`}>
                {embedded && onOpenAjuda ? (
                    <div className="flex items-start justify-between gap-2 rounded-[8px] border border-[#C99A4A]/30 bg-[#C99A4A]/8 px-3 py-2">
                        <p className="text-[11px] text-[#9DA2AE] leading-relaxed">
                            <span className="text-[#C99A4A] font-semibold uppercase text-[10px]">Beta · </span>
                            CSV é a fonte mais confiável. PDF ZW3D pode exigir revisão manual e calibração.
                        </p>
                        <button type="button" onClick={onOpenAjuda} className="shrink-0 text-[11px] font-semibold text-[#D97D3D] hover:underline">
                            Ajuda
                        </button>
                    </div>
                ) : null}

                {!pecas.length ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {MODOS.map((m) => {
                                const Icon = m.icon;
                                const ativo = modo === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => { setModo(m.id); setErro(''); setInfo(''); setCsvPendentes(null); }}
                                        className={`rounded-[8px] border p-3 text-left transition-colors ${
                                            ativo ? 'border-[#D97D3D] bg-[#D97D3D]/10' : 'border-[#262A33] bg-[#111318] hover:border-[#333844]'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 mb-1.5 ${ativo ? 'text-[#D97D3D]' : 'text-[#7B808F]'}`} />
                                        <p className="text-[12px] font-semibold text-[#E7E9ED]">{m.label}</p>
                                        <p className="text-[10px] text-[#565B68] mt-0.5 line-clamp-2">{m.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                        {(modo === 'csv' || modo === 'csv_pdf') ? <CsvFormatGuia /> : null}
                        {renderDropZone()}
                    </>
                ) : (
                    <>
                        <div className="rounded-[8px] border border-[#D97D3D]/30 bg-[#D97D3D]/10 px-3 py-2 text-[12px] text-[#E7E9ED]">
                            Fila do molde — revise os campos, desmarque o que não for importar e confirme.
                            {resumoRevisao > 0 ? (
                                <span className="block mt-1 text-[#C99A4A]">{resumoRevisao} peça(s) pedem revisão manual.</span>
                            ) : null}
                        </div>

                        {!usaCabecalhoExterno ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label className="text-[11px] text-[#7B808F]">
                                    Código do molde
                                    <input value={codigoMolde} onChange={(e) => setCodigoMolde(e.target.value)}
                                        className="mt-1 w-full rounded-md border border-[#333844] bg-[#111318] p-2.5 text-sm text-[#E7E9ED]" />
                                </label>
                                <label className="text-[11px] text-[#7B808F]">
                                    Cliente *
                                    <input list="clientes-molde-import" value={cliente} onChange={(e) => setCliente(e.target.value)}
                                        className="mt-1 w-full rounded-md border border-[#333844] bg-[#111318] p-2.5 text-sm text-[#E7E9ED]" placeholder="Nome do cliente" />
                                    <datalist id="clientes-molde-import">{nomesClientes.map((n) => <option key={n} value={n} />)}</datalist>
                                </label>
                                <label className="text-[11px] text-[#7B808F]">
                                    Prazo de entrega
                                    <div className="relative mt-1">
                                        <input ref={prazoInputRef} type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)}
                                            onClick={(e) => e.currentTarget.showPicker?.()}
                                            className="edm-date-input w-full rounded-md border border-[#333844] bg-[#111318] py-2.5 pl-3 pr-10 text-sm text-[#E7E9ED] cursor-pointer" />
                                        <button type="button" tabIndex={-1} onClick={() => prazoInputRef.current?.showPicker?.()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#D97D3D] hover:bg-[#D97D3D]/10" aria-label="Abrir calendário">
                                            <Calendar className="h-4 w-4" />
                                        </button>
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <p className="text-[11px] text-[#7B808F]">
                                Cliente, molde e prazo vêm do formulário acima.
                            </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7B808F]">
                                {selecionadas.length} de {pecas.length} selecionada(s)
                            </p>
                            <div className="flex gap-2">
                                <button type="button" onClick={adicionarPecaManual}
                                    className="inline-flex items-center gap-1 text-[12px] text-[#D97D3D]">
                                    <Plus className="w-3.5 h-3.5" /> Peça manual
                                </button>
                                <button type="button" onClick={() => { setPecas([]); setCodigoMolde(''); setInfo(''); }}
                                    className="text-[12px] text-[#7B808F]">
                                    Recomeçar
                                </button>
                            </div>
                        </div>

                        <ul className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
                            {pecas.map((p, idx) => (
                                <PecaImportRow
                                    key={`${p.fileName}-${idx}-${p.codigoPeca}`}
                                    peca={p}
                                    idx={idx}
                                    onPatch={patchPeca}
                                    onRemove={removerPeca}
                                    showRemove={pecas.length > 1}
                                />
                            ))}
                        </ul>
                    </>
                )}

                {info ? <p className="text-[12px] text-[#4A9D74]">{info}</p> : null}
                {erro ? <p className="text-[12px] text-[#C85558]">{erro}</p> : null}
            </div>

            <div className={`flex gap-2 border-t border-[#262A33] ${embedded ? 'pt-3 mt-1' : 'px-5 py-3'}`}>
                <button type="button" onClick={criar} disabled={saving || !selecionadas.length}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#D97D3D] py-2 text-[13px] font-medium text-[#111318] hover:bg-[#c46d32] disabled:opacity-50">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Enviar para fila · {selecionadas.length} peça{selecionadas.length === 1 ? '' : 's'}
                </button>
                <button type="button" onClick={fechar} className="rounded-md border border-[#333844] px-4 py-2 text-[13px] text-[#E7E9ED]">
                    {embedded ? 'Voltar' : 'Fechar'}
                </button>
            </div>
        </>
    );

    if (embedded) return corpo;

    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <button type="button" className="absolute inset-0 bg-black/70" aria-label="Fechar" onClick={fechar} />
            <div className="relative z-10 flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-[#262A33] bg-[#181B22] sm:rounded-xl">
                {corpo}
            </div>
        </div>
    );
}

/** @deprecated use ImportarMoldePanel — mantido para compatibilidade */
export function ImportarMoldeModal(props) {
    return <ImportarMoldePanel {...props} />;
}
