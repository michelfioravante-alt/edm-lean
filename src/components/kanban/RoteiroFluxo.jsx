import React from 'react';
import { labelSetor, roteiroDaOs } from '../../constants/osWorkflow';

export default function RoteiroFluxo({ os, irmaos, onToggleMarco, somenteLeitura }) {
    const passos = roteiroDaOs(os, irmaos);
    if (!passos.length) return null;

    return (
        <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase text-[#565B68]">Caminho da peça</h5>
            <div className="flex flex-wrap items-center gap-1.5">
                {passos.map((p, i) => {
                    const feito = p.kind === 'marco' ? !!p.feito : false;
                    const isMarco = p.kind === 'marco';
                    return (
                        <React.Fragment key={p.id || i}>
                            {i > 0 && <span className="text-[#565B68] text-[10px]">→</span>}
                            {isMarco && onToggleMarco && !somenteLeitura ? (
                                <button
                                    type="button"
                                    onClick={() => onToggleMarco(p.id, !feito)}
                                    className={`px-2 py-1 rounded-[6px] border text-[11px] font-semibold cursor-pointer ${
                                        feito
                                            ? 'border-[#4A9D74]/40 text-[#4A9D74] bg-[rgba(74,157,116,0.1)]'
                                            : 'border-[#C99A4A]/40 text-[#C99A4A] bg-[rgba(201,154,74,0.08)]'
                                    }`}
                                    title="Marco de fluxo — não abre kanban. Toque para marcar feito."
                                >
                                    {p.label || labelSetor(p.setor)} {feito ? '✓' : ''}
                                </button>
                            ) : (
                                <span
                                    className={`px-2 py-1 rounded-[6px] border text-[11px] font-semibold ${
                                        p.kind === 'externo'
                                            ? 'border-[#C99A4A]/40 text-[#C99A4A]'
                                            : isMarco
                                                ? (feito ? 'border-[#4A9D74]/40 text-[#4A9D74]' : 'border-[#333844] text-[#9DA2AE]')
                                                : 'border-[#D97D3D]/40 text-[#D97D3D]'
                                    }`}
                                >
                                    {p.label || labelSetor(p.setor)}
                                    {isMarco && feito ? ' ✓' : ''}
                                </span>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            <p className="text-[10px] text-[#565B68]">
                CNC e fio são kanban. Laser, retífica, torno e montagem são etapas da peça. Terceiro (têmpera) tem fornecedor e datas.
            </p>
        </div>
    );
}
