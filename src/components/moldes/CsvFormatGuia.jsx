import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import {
    CSV_COLUNAS, CSV_COLUNAS_OPCIONAIS_MOLDE, CSV_TEMPLATE, getCsvExemploTabela,
} from '../../utils/moldeCsvParser';

export default function CsvFormatGuia({ compact = false }) {
    const [aberto, setAberto] = useState(!compact);
    const [copiado, setCopiado] = useState(false);
    const tabela = useMemo(() => getCsvExemploTabela(), []);

    const copiarModelo = async () => {
        try {
            await navigator.clipboard.writeText(CSV_TEMPLATE);
            setCopiado(true);
            window.setTimeout(() => setCopiado(false), 2000);
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="rounded-[10px] border border-[#262A33] bg-[#111318] overflow-hidden">
            <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-[#1F232B]"
            >
                <span className="text-[12px] font-semibold text-[#E7E9ED]">
                    Como o sistema lê o CSV
                </span>
                {aberto ? <ChevronUp className="w-4 h-4 text-[#7B808F]" /> : <ChevronDown className="w-4 h-4 text-[#7B808F]" />}
            </button>

            {aberto ? (
                <div className="border-t border-[#262A33] px-3 py-3 space-y-3">
                    <p className="text-[11px] text-[#7B808F] leading-relaxed">
                        A <span className="text-[#E7E9ED]">1ª linha</span> do arquivo são os nomes das colunas (cabeçalho).
                        O sistema identifica cada coluna pelo nome — não pela posição das letras, desde que o cabeçalho use os nomes abaixo.
                        Separador: <span className="text-[#E7E9ED]">ponto e vírgula (;)</span> ou <span className="text-[#E7E9ED]">vírgula (,)</span> — detectamos automaticamente.
                    </p>

                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#565B68] mb-1.5">Exemplo (copie ou baixe)</p>
                        <div className="overflow-x-auto rounded-md border border-[#262A33]">
                            <table className="w-full min-w-[520px] text-[11px]">
                                <thead>
                                    <tr className="bg-[#181B22] text-[#9DA2AE]">
                                        {tabela.headers.map((h) => (
                                            <th key={h} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tabela.rows.map((row, ri) => (
                                        <tr key={ri} className="border-t border-[#262A33] text-[#E7E9ED]">
                                            {tabela.headers.map((h) => (
                                                <td key={h} className="px-2 py-1.5 whitespace-nowrap">{row[h]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            type="button"
                            onClick={copiarModelo}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#D97D3D] hover:underline"
                        >
                            {copiado ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiado ? 'Copiado!' : 'Copiar exemplo para a área de transferência'}
                        </button>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#565B68] mb-1.5">Colunas reconhecidas</p>
                        <ul className="space-y-1.5">
                            {CSV_COLUNAS.map((col) => (
                                <li key={col.id} className="text-[11px] text-[#7B808F]">
                                    <span className="font-mono text-[#D97D3D]">{col.id}</span>
                                    {col.obrigatorio ? (
                                        <span className="ml-1 text-[9px] uppercase text-[#C85558]">obrigatório</span>
                                    ) : null}
                                    {col.aliases?.length ? (
                                        <span className="text-[#565B68]">
                                            {' '}(também: {col.aliases.join(', ')})
                                        </span>
                                    ) : null}
                                    <span className="block text-[#565B68] mt-0.5">{col.desc} Ex.: {col.exemplos}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#565B68] mb-1">Opcionais do molde (na planilha ou no modal)</p>
                        <ul className="text-[11px] text-[#565B68] space-y-0.5">
                            {CSV_COLUNAS_OPCIONAIS_MOLDE.map((c) => (
                                <li key={c.id}>
                                    <span className="font-mono text-[#9DA2AE]">{c.id}</span>
                                    {c.aliases?.length ? ` (${c.aliases.join(', ')})` : ''} — {c.desc}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-[10px] text-[#565B68] border-t border-[#262A33] pt-2">
                        Setor: use <span className="font-mono text-[#9DA2AE]">CNC</span>, <span className="font-mono text-[#9DA2AE]">EDM_FIO</span> ou <span className="font-mono text-[#9DA2AE]">EXTERNO</span>
                        {' '}(ou palavras como Eletrofio, Têmpera — convertemos automaticamente).
                    </p>
                </div>
            ) : null}
        </div>
    );
}
