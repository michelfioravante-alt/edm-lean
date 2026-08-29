import React, { useEffect, useState } from 'react';
import { X, FlaskConical, FileText, FileSpreadsheet, Link2, SlidersHorizontal } from 'lucide-react';
import {
    CALIBRACAO_IMPORT_DEFAULT,
    carregarCalibracaoImport,
    salvarCalibracaoImportLocal,
} from '../../constants/calibracaoImport';

const MODOS_AJUDA = [
    {
        icon: FileSpreadsheet,
        title: 'Planilha CSV (recomendado)',
        body: 'Lista oficial da engenharia. Colunas: código da peça, material, processo, setor, quantidade. Baixe o modelo em public/modelo-importacao-molde.csv.',
    },
    {
        icon: FileText,
        title: 'Folhas PDF (ZW3D)',
        body: '1 PDF = 1 peça. O sistema tenta ler título, material e quantidade do bloco esquerdo. Sempre revise — layouts diferentes exigem calibração.',
    },
    {
        icon: Link2,
        title: 'CSV + PDFs',
        body: 'Planilha com dados + PDFs vinculados pelo nome do arquivo (coluna arquivo_pdf). Ideal quando o CSV é a fonte e o PDF é só desenho.',
    },
];

export default function MoldeImportAjudaModal({ open, onClose, calibracao, onSalvarCalibracao }) {
    const [local, setLocal] = useState(() => carregarCalibracaoImport(calibracao));

    useEffect(() => {
        if (open) setLocal(carregarCalibracaoImport(calibracao));
    }, [open, calibracao]);

    if (!open) return null;

    const salvar = () => {
        const merged = salvarCalibracaoImportLocal(local);
        onSalvarCalibracao?.(merged);
        onClose?.();
    };

    const reset = () => setLocal({ ...CALIBRACAO_IMPORT_DEFAULT });

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <button type="button" className="absolute inset-0 bg-black/80" aria-label="Fechar" onClick={onClose} />
            <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#262A33] bg-[#181B22] sm:rounded-xl">
                <div className="flex items-start justify-between gap-3 border-b border-[#262A33] px-5 py-4">
                    <div>
                        <p className="font-['Space_Grotesk'] text-[15px] font-semibold text-[#E7E9ED] flex items-center gap-2">
                            Importação de molde
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#C99A4A]/20 text-[#C99A4A] border border-[#C99A4A]/30">
                                <FlaskConical className="w-3 h-3" /> Beta
                            </span>
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#7B808F]">
                            Recurso em calibração — revise sempre antes de liberar para o setor.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-md p-1 text-[#7B808F] hover:text-[#E7E9ED]">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-4 space-y-4">
                    <div className="rounded-[8px] border border-[#333844] bg-[#111318] px-3 py-2.5 text-[12px] text-[#9DA2AE] leading-relaxed">
                        Peças importadas vão para a <strong className="text-[#E7E9ED]">fila do molde</strong> — não aparecem no Kanban até o gestor liberar.
                        Prefira CSV quando possível; use PDF como complemento visual.
                    </div>

                    <div className="space-y-2">
                        {MODOS_AJUDA.map((m) => {
                            const Icon = m.icon;
                            return (
                                <div key={m.title} className="rounded-[8px] border border-[#262A33] bg-[#111318] p-3">
                                    <p className="text-[12px] font-semibold text-[#E7E9ED] flex items-center gap-1.5">
                                        <Icon className="w-3.5 h-3.5 text-[#D97D3D]" />
                                        {m.title}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#7B808F] leading-relaxed">{m.body}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="rounded-[8px] border border-[#D97D3D]/30 bg-[#111318] p-4 space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#D97D3D] flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Calibração PDF (ZW3D)
                        </p>
                        <p className="text-[11px] text-[#7B808F] leading-relaxed">
                            Se o código ou material não forem lidos, ajuste a faixa da coluna esquerda do PDF.
                            Imprima uma folha de teste, importe e compare — aumente se faltar texto; diminua se pegar lixo da tabela da direita.
                        </p>

                        <label className="block text-[11px] text-[#9DA2AE]">
                            Largura do bloco de título: {Math.round(local.limiteColunaEsquerda * 100)}% da página
                            <input
                                type="range"
                                min="25"
                                max="60"
                                step="1"
                                value={Math.round(local.limiteColunaEsquerda * 100)}
                                onChange={(e) => setLocal((s) => ({
                                    ...s,
                                    limiteColunaEsquerda: Number(e.target.value) / 100,
                                }))}
                                className="mt-2 w-full accent-[#D97D3D]"
                            />
                            <span className="flex justify-between text-[10px] text-[#565B68] mt-0.5">
                                <span>25% (estreito)</span>
                                <span>Padrão 42%</span>
                                <span>60% (largo)</span>
                            </span>
                        </label>

                        <label className="block text-[11px] text-[#9DA2AE]">
                            Padrão do código da peça (regex, opcional)
                            <input
                                type="text"
                                value={local.regexCodigoPeca}
                                onChange={(e) => setLocal((s) => ({ ...s, regexCodigoPeca: e.target.value }))}
                                placeholder="Ex: [A-Z]\\d{2}-[A-Z]{2} — vazio = padrão interno"
                                className="mt-1 w-full rounded-md border border-[#333844] bg-[#181B22] px-3 py-2 text-[12px] font-mono text-[#E7E9ED] placeholder-[#565B68]"
                            />
                        </label>
                    </div>
                </div>

                <div className="flex gap-2 border-t border-[#262A33] px-5 py-3">
                    <button type="button" onClick={reset} className="rounded-md border border-[#333844] px-3 py-2 text-[12px] text-[#7B808F]">
                        Restaurar padrão
                    </button>
                    <button type="button" onClick={salvar} className="flex-1 rounded-md bg-[#D97D3D] py-2 text-[13px] font-semibold text-[#111318]">
                        Salvar calibração
                    </button>
                </div>
            </div>
        </div>
    );
}
