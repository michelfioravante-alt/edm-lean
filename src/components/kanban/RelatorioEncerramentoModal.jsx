import React, { useEffect, useMemo, useState } from 'react';
import { X, Download, Clock, History, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { resumoHorasOs, exportRelatorioPecaCsv, codigoPecaOs } from '../../utils/horasProducao';
import { osService } from '../../services/osService';
import { formatarHoras } from '../../utils/formatters';

function LinhaHoras({ label, real, orcado }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-[#262A33]/80 text-[13px]">
            <span className="text-[#9DA2AE]">{label}</span>
            <span className="text-[#E7E9ED] font-mono">
                {formatarHoras(real)}
                {orcado > 0 ? (
                    <span className="text-[#565B68] font-normal ml-2">(orç. {formatarHoras(orcado)})</span>
                ) : null}
            </span>
        </div>
    );
}

export default function RelatorioEncerramentoModal({ isOpen, osData, onClose }) {
    const config = useAppStore((s) => s.configuracoesGlobais);
    const [historico, setHistorico] = useState([]);
    const [loadingHist, setLoadingHist] = useState(false);

    const resumo = useMemo(
        () => (osData ? resumoHorasOs(osData, config || {}) : null),
        [osData, config],
    );

    useEffect(() => {
        if (!isOpen || !osData) return;
        const codigo = codigoPecaOs(osData);
        if (!codigo || codigo === '—') return;
        setLoadingHist(true);
        osService.searchHistorico({ codigoPeca: codigo, limit: 8 })
            .then((rows) => setHistorico(rows.filter((r) => r.id !== osData.id)))
            .catch(() => setHistorico([]))
            .finally(() => setLoadingHist(false));
    }, [isOpen, osData]);

    if (!isOpen || !osData || !resumo) return null;

    return (
        <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <button type="button" className="absolute inset-0 bg-black/75" aria-label="Fechar" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl border border-[#262A33] bg-[#181B22] sm:rounded-xl shadow-xl">
                <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[#262A33] bg-[#181B22] px-5 py-4">
                    <div>
                        <p className="font-['Space_Grotesk'] text-[15px] font-semibold text-[#E7E9ED]">Peça concluída — horas máquina</p>
                        <p className="mt-0.5 text-[12px] text-[#7B808F]">
                            {resumo.codigo} · {resumo.cliente}
                            {resumo.molde !== '—' ? ` · Molde ${resumo.molde}` : ''}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-md p-1 text-[#7B808F] hover:text-[#E7E9ED]">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                    <div className="rounded-[10px] border border-[#4A9D74]/30 bg-[#4A9D74]/10 px-3 py-2 text-[12px] text-[#E7E9ED]">
                        Referência para orçamentos futuros — horas reais registradas na produção.
                    </div>

                    <div className="rounded-[10px] border border-[#262A33] bg-[#111318] p-4">
                        <p className="text-[10px] uppercase tracking-wider text-[#565B68] mb-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Tempos
                        </p>
                        <LinhaHoras label="Setup" real={resumo.setupReal} orcado={resumo.setupEst} />
                        <LinhaHoras label="Usinagem / corte" real={resumo.corteReal} orcado={resumo.corteEst} />
                        <LinhaHoras label="Aferição" real={resumo.afericaoReal} orcado={0} />
                        {resumo.pausas > 0 ? (
                            <LinhaHoras label="Pausas" real={resumo.pausas} orcado={0} />
                        ) : null}
                        <div className="flex items-center justify-between pt-2 mt-1 text-[14px] font-semibold">
                            <span className="text-[#D97D3D]">Total máquina</span>
                            <span className="text-[#E7E9ED] font-mono">{resumo.formatado.totalReal}</span>
                        </div>
                        {resumo.eficiencia != null ? (
                            <p className="text-[11px] text-[#7B808F] mt-2">
                                Eficiência CAM: {Math.round(resumo.eficiencia)}% (orçado ÷ real)
                            </p>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                        <div className="rounded-md border border-[#262A33] bg-[#111318] px-3 py-2">
                            <p className="text-[#565B68] text-[10px] uppercase">Setor</p>
                            <p className="text-[#E7E9ED]">{resumo.setorLabel}</p>
                        </div>
                        <div className="rounded-md border border-[#262A33] bg-[#111318] px-3 py-2">
                            <p className="text-[#565B68] text-[10px] uppercase">Máquina</p>
                            <p className="text-[#E7E9ED] truncate">{resumo.maquina}</p>
                        </div>
                        <div className="rounded-md border border-[#262A33] bg-[#111318] px-3 py-2">
                            <p className="text-[#565B68] text-[10px] uppercase">Operador</p>
                            <p className="text-[#E7E9ED] truncate">{resumo.operador}</p>
                        </div>
                        <div className="rounded-md border border-[#262A33] bg-[#111318] px-3 py-2">
                            <p className="text-[#565B68] text-[10px] uppercase">Programa</p>
                            <p className="text-[#E7E9ED] truncate">{resumo.programa}</p>
                        </div>
                    </div>

                    <div className="rounded-[10px] border border-[#333844] bg-[#111318] px-3 py-2.5 text-[12px]">
                        <p className="text-[#565B68] text-[10px] uppercase mb-0.5">Referência interna (opcional)</p>
                        <p className="text-[#9DA2AE]">
                            {resumo.formatado.referenciaInterna} — horas × taxa configurada ({formatarHoras(resumo.taxaHora ? resumo.referenciaInterna / resumo.taxaHora : 0)} × R$/h do setor).
                            Não substitui o preço comercial do cliente.
                        </p>
                    </div>

                    {(loadingHist || historico.length > 0) ? (
                        <div className="rounded-[10px] border border-[#262A33] bg-[#111318] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-[#565B68] mb-2 flex items-center gap-1">
                                <History className="w-3 h-3" /> Execuções anteriores — {resumo.codigo}
                            </p>
                            {loadingHist ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#D97D3D]" />
                            ) : (
                                <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                                    {historico.map((h) => {
                                        const hr = resumoHorasOs(h, config || {});
                                        return (
                                            <li key={h.id} className="text-[11px] text-[#9DA2AE] flex justify-between gap-2">
                                                <span>{hr.formatado.concluidoEm}</span>
                                                <span className="text-[#E7E9ED] font-mono shrink-0">{hr.formatado.totalReal}</span>
                                                <span className="truncate">{hr.molde !== '—' ? hr.molde : hr.cliente}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    ) : null}
                </div>

                <div className="sticky bottom-0 flex gap-2 border-t border-[#262A33] bg-[#181B22] px-5 py-3">
                    <button
                        type="button"
                        onClick={() => exportRelatorioPecaCsv(osData, config || {})}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#333844] py-2 text-[13px] text-[#E7E9ED] hover:bg-[#1F232B]"
                    >
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-[#D97D3D] px-5 py-2 text-[13px] font-semibold text-[#111318]"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
