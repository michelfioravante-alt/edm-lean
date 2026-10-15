import React, { useMemo } from 'react';
import { X, Download, BarChart3 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { agregarHorasMolde, exportRelatorioMoldeCsv } from '../../utils/horasProducao';
import { formatarHoras } from '../../utils/formatters';

export default function RelatorioMoldeModal({ open, grupo, onClose }) {
    const config = useAppStore((s) => s.configuracoesGlobais);

    const agregado = useMemo(() => {
        if (!grupo?.kanbans?.length) return null;
        return agregarHorasMolde(grupo.kanbans, config || {});
    }, [grupo, config]);

    if (!open || !grupo || !agregado) return null;

    const molde = grupo.head?.codigo_molde || grupo.titulo || 'Molde';
    const cliente = grupo.cliente || grupo.head?.cliente || '—';
    const maxHoras = Math.max(...agregado.porSetor.map((s) => s.horas), 0.01);

    return (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <button type="button" className="absolute inset-0 bg-black/75" aria-label="Fechar" onClick={onClose} />
            <div className="relative z-10 flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[#262A33] bg-[#181B22] sm:rounded-xl">
                <div className="flex items-start justify-between gap-3 border-b border-[#262A33] px-5 py-4">
                    <div>
                        <p className="font-['Space_Grotesk'] text-[15px] font-semibold text-[#E7E9ED]">Relatório de horas — molde</p>
                        <p className="mt-0.5 text-[12px] text-[#7B808F]">{cliente} · Molde {molde}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-md p-1 text-[#7B808F] hover:text-[#E7E9ED]">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="rounded-lg border border-[#262A33] bg-[#111318] p-3 text-center">
                            <p className="text-[20px] font-semibold text-[#D97D3D] font-mono">{agregado.formatado.totalReal}</p>
                            <p className="text-[10px] text-[#565B68] uppercase mt-1">Horas reais</p>
                        </div>
                        <div className="rounded-lg border border-[#262A33] bg-[#111318] p-3 text-center">
                            <p className="text-[20px] font-semibold text-[#9DA2AE] font-mono">{agregado.formatado.totalEst}</p>
                            <p className="text-[10px] text-[#565B68] uppercase mt-1">Horas orçadas</p>
                        </div>
                        <div className="rounded-lg border border-[#262A33] bg-[#111318] p-3 text-center">
                            <p className="text-[20px] font-semibold text-[#4A9D74]">{agregado.pctConcluido}%</p>
                            <p className="text-[10px] text-[#565B68] uppercase mt-1">{agregado.concluidas}/{agregado.total} peças</p>
                        </div>
                        <div className="rounded-lg border border-[#262A33] bg-[#111318] p-3 text-center">
                            <p className="text-[16px] font-semibold text-[#E7E9ED]">{agregado.formatado.referenciaTotal}</p>
                            <p className="text-[10px] text-[#565B68] uppercase mt-1">Ref. interna</p>
                        </div>
                    </div>

                    {agregado.porSetor.length > 0 ? (
                        <div className="rounded-[10px] border border-[#262A33] bg-[#111318] p-4">
                            <p className="text-[10px] uppercase tracking-wider text-[#565B68] mb-3 flex items-center gap-1">
                                <BarChart3 className="w-3 h-3" /> Horas por setor
                            </p>
                            <div className="space-y-2">
                                {agregado.porSetor.map((s) => (
                                    <div key={s.setor}>
                                        <div className="flex justify-between text-[11px] mb-0.5">
                                            <span className="text-[#9DA2AE]">{s.label} ({s.pecas} peças)</span>
                                            <span className="text-[#E7E9ED] font-mono">{formatarHoras(s.horas)}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-[#262A33] overflow-hidden">
                                            <div
                                                className="h-full bg-[#D97D3D] rounded-full"
                                                style={{ width: `${Math.min(100, (s.horas / maxHoras) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div className="overflow-x-auto rounded-[10px] border border-[#262A33]">
                        <table className="w-full min-w-[520px] text-[11px]">
                            <thead>
                                <tr className="bg-[#111318] text-[#7B808F] text-left">
                                    <th className="px-3 py-2 font-medium">Peça</th>
                                    <th className="px-3 py-2 font-medium">Setor</th>
                                    <th className="px-3 py-2 font-medium text-right">Setup</th>
                                    <th className="px-3 py-2 font-medium text-right">Corte</th>
                                    <th className="px-3 py-2 font-medium text-right">Total</th>
                                    <th className="px-3 py-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agregado.linhas.map((l) => (
                                    <tr key={l.os?.id || l.codigo} className="border-t border-[#262A33] text-[#E7E9ED]">
                                        <td className="px-3 py-2 font-mono">{l.codigo}</td>
                                        <td className="px-3 py-2">{l.setorLabel}</td>
                                        <td className="px-3 py-2 text-right font-mono">{l.formatado.setupReal}</td>
                                        <td className="px-3 py-2 text-right font-mono">{l.formatado.corteReal}</td>
                                        <td className="px-3 py-2 text-right font-mono font-semibold text-[#D97D3D]">{l.formatado.totalReal}</td>
                                        <td className="px-3 py-2">
                                            <span className={`text-[10px] uppercase ${l.concluida ? 'text-[#4A9D74]' : 'text-[#C99A4A]'}`}>
                                                {l.concluida ? 'Concluída' : 'Aberta'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex gap-2 border-t border-[#262A33] px-5 py-3">
                    <button
                        type="button"
                        onClick={() => exportRelatorioMoldeCsv({ molde, cliente }, agregado)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#333844] py-2 text-[13px] text-[#E7E9ED]"
                    >
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                    <button type="button" onClick={onClose} className="rounded-md bg-[#D97D3D] px-5 py-2 text-[13px] font-semibold text-[#111318]">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
