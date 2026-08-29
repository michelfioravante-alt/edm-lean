import React from 'react';
import { Check, AlertTriangle, Trash2 } from 'lucide-react';

const SETORES = [
    { id: 'CNC', label: 'CNC' },
    { id: 'EDM_FIO', label: 'Eletrofio' },
    { id: 'EXTERNO', label: 'Serviço fora' },
];

const inputSm = 'w-full rounded-md border border-[#333844] bg-[#181B22] px-2 py-1 text-[12px] text-[#E7E9ED]';

export default function PecaImportRow({
    peca, idx, onPatch, onRemove, showRemove,
}) {
    const revisao = peca.precisaRevisao || !peca.leituraAutomatica;
    const codigoVazio = !String(peca.codigoPeca || '').trim();

    return (
        <li
            className={`rounded-[10px] border p-2.5 ${
                codigoVazio
                    ? 'border-[#C85558]/40 bg-[rgba(200,85,88,0.06)]'
                    : revisao
                        ? 'border-[#C99A4A]/40 bg-[rgba(201,154,74,0.06)]'
                        : 'border-[#262A33] bg-[#111318]'
            }`}
        >
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onPatch(idx, { selected: !peca.selected })}
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        peca.selected
                            ? 'border-[#D97D3D] bg-[#D97D3D] text-[#111318]'
                            : 'border-[#565B68]'
                    }`}
                    aria-label={peca.selected ? 'Desmarcar' : 'Selecionar'}
                >
                    {peca.selected ? <Check className="h-3 w-3" /> : null}
                </button>

                <div className="w-14 h-14 shrink-0 rounded-md border border-[#262A33] bg-white overflow-hidden flex items-center justify-center">
                    {peca.previewUrl ? (
                        <img src={peca.previewUrl} alt="" className="max-w-full max-h-full object-contain" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#565B68] bg-[#181B22] text-[9px] text-center px-0.5">
                            {peca.origemImport === 'csv' ? 'CSV' : '—'}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {peca.leituraAutomatica && !revisao ? (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#4A9D74]/15 text-[#4A9D74] border border-[#4A9D74]/30">
                                Lido auto
                            </span>
                        ) : (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C99A4A]/15 text-[#C99A4A] border border-[#C99A4A]/30">
                                Revisão manual
                            </span>
                        )}
                        {peca.origemImport === 'csv' ? (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#333844] text-[#7B808F]">
                                CSV
                            </span>
                        ) : null}
                        {peca.origemImport === 'manual' ? (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#333844] text-[#7B808F]">
                                Manual
                            </span>
                        ) : null}
                        <span className="text-[10px] text-[#565B68] truncate">{peca.fileName}</span>
                    </div>

                    {(peca.avisoRevisao || peca.aviso) ? (
                        <p className="text-[11px] text-[#C99A4A] flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                            {peca.avisoRevisao || peca.aviso}
                        </p>
                    ) : null}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <label className="text-[10px] text-[#565B68] col-span-2 sm:col-span-1">
                            Código peça *
                            <input
                                value={peca.codigoPeca || ''}
                                onChange={(e) => onPatch(idx, {
                                    codigoPeca: e.target.value.toUpperCase(),
                                    precisaRevisao: false,
                                    leituraAutomatica: false,
                                })}
                                className={`${inputSm} mt-0.5 font-mono`}
                                placeholder="E02-DB"
                            />
                        </label>
                        <label className="text-[10px] text-[#565B68]">
                            Material
                            <input
                                value={peca.material || ''}
                                onChange={(e) => onPatch(idx, { material: e.target.value })}
                                className={`${inputSm} mt-0.5`}
                            />
                        </label>
                        <label className="text-[10px] text-[#565B68]">
                            Processo
                            <input
                                value={peca.processo || ''}
                                onChange={(e) => onPatch(idx, { processo: e.target.value })}
                                className={`${inputSm} mt-0.5`}
                            />
                        </label>
                        <label className="text-[10px] text-[#565B68]">
                            Qtd
                            <input
                                type="number"
                                min="1"
                                value={peca.quantidade ?? 1}
                                onChange={(e) => onPatch(idx, { quantidade: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                                className={`${inputSm} mt-0.5`}
                            />
                        </label>
                        <label className="text-[10px] text-[#565B68] col-span-2 sm:col-span-1">
                            Setor
                            <select
                                value={peca.setor || 'CNC'}
                                onChange={(e) => onPatch(idx, { setor: e.target.value })}
                                className={`${inputSm} mt-0.5`}
                            >
                                {SETORES.map((s) => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </label>
                        {peca.origemImport === 'csv' ? (
                            <label className="text-[10px] text-[#565B68] col-span-2">
                                Arquivo PDF (opcional)
                                <input
                                    value={peca.arquivoPdf || ''}
                                    onChange={(e) => onPatch(idx, { arquivoPdf: e.target.value })}
                                    className={`${inputSm} mt-0.5`}
                                    placeholder="E02-DB.pdf"
                                />
                            </label>
                        ) : null}
                    </div>
                </div>

                {showRemove ? (
                    <button
                        type="button"
                        onClick={() => onRemove(idx)}
                        className="shrink-0 self-start rounded p-1 text-[#7B808F] hover:text-[#C85558]"
                        aria-label="Remover peça"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                ) : null}
            </div>
        </li>
    );
}
