import React from 'react';
import ChartCard, { ChartEmpty } from './ChartCard';

const COLORS = ['#5A5F6C', '#C99A4A', '#D97D3D', '#4A9D74'];

export default function WipPipelineChart({ pipeline = [] }) {
    const max = Math.max(1, ...pipeline.map((p) => p.n));
    const total = pipeline.reduce((s, p) => s + p.n, 0);

    return (
        <ChartCard title="Fila ao vivo" subtitle={`${total} cartão${total === 1 ? '' : 's'} no quadro agora — independente do mês.`} badge="WIP">
            {pipeline.length ? (
                <div className="h-full flex flex-col justify-center gap-5">
                    {pipeline.map((p, i) => (
                        <div key={p.key}>
                            <div className="flex justify-between items-baseline mb-1.5">
                                <span className="text-[11px] text-[#8B90A0] uppercase tracking-[0.12em] font-medium">{p.label}</span>
                                <span className="font-['IBM_Plex_Mono'] text-[13px] text-[#E7E9ED]">{p.n}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#111318] overflow-hidden">
                                <div
                                    className="h-full rounded-full origin-left"
                                    style={{
                                        width: `${(p.n / max) * 100}%`,
                                        background: `linear-gradient(90deg, ${COLORS[i]}, ${COLORS[i]}99)`,
                                        boxShadow: p.n ? `0 0 12px ${COLORS[i]}55` : 'none',
                                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <ChartEmpty>Quadro vazio neste setor.</ChartEmpty>
            )}
        </ChartCard>
    );
}
