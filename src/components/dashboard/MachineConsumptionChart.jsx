import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { isSameMonth, isSameWeek, isToday, parseISO } from 'date-fns';
import { useAppStore } from '../../store/useAppStore';
import { CHART, doughnutOpts } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

function nomeMaquina(maquinas, id) {
    if (!id) return 'Não informada';
    return maquinas.find((m) => m.id === id)?.nome || 'Removida';
}

export default function MachineConsumptionChart({ periodo }) {
    const historicoConsumiveis = useAppStore((s) => s.historicoConsumiveis);
    const maquinas = useAppStore((s) => s.maquinas);

    const logs = useMemo(() => {
        const all = historicoConsumiveis || [];
        if (!periodo) return all;
        const now = new Date();
        return all.filter((log) => {
            const dt = log.dataInstalacao || log.data_instalacao;
            if (!dt) return false;
            const parsed = parseISO(dt);
            if (Number.isNaN(parsed.getTime())) return false;
            if (periodo === 'mes') return isSameMonth(parsed, now);
            if (periodo === 'semana') return isSameWeek(parsed, now);
            if (periodo === 'hoje') return isToday(parsed);
            if (/^\d{4}-\d{2}$/.test(periodo)) {
                const [y, m] = periodo.split('-').map(Number);
                return isSameMonth(parsed, new Date(y, m - 1, 1));
            }
            return true;
        });
    }, [historicoConsumiveis, periodo]);

    const counts = {};
    logs.forEach((log) => {
        const id = log.maquinaId || log.maquina_id;
        if (!id) return;
        counts[id] = (counts[id] || 0) + 1;
    });
    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([id, n]) => [nomeMaquina(maquinas || [], id), n]);
    const total = sorted.reduce((s, [, n]) => s + n, 0);

    const data = {
        labels: sorted.map(([n]) => n),
        datasets: [{
            data: sorted.map(([, n]) => n),
            backgroundColor: CHART.series,
            borderWidth: 0,
            spacing: 3,
            borderRadius: 5,
            hoverOffset: 5,
        }],
    };
    const options = {
        ...doughnutOpts({ cutout: '76%' }),
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (c) => {
                        const pct = total ? ((c.parsed / total) * 100).toFixed(0) : 0;
                        return ` ${c.parsed} troca(s) · ${pct}%`;
                    },
                },
            },
        },
    };

    return (
        <ChartCard title="Trocas por máquina" subtitle="Consumíveis substituídos no recorte" badge="insumos">
            {total > 0 ? (
                <div className="h-full flex items-center gap-4">
                    <div className="relative flex-1 h-full min-w-0">
                        <Doughnut data={data} options={options} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="font-['Space_Grotesk'] text-[26px] font-semibold text-[#E7E9ED] leading-none">{total}</span>
                            <span className="text-[10px] uppercase tracking-[0.14em] text-[#6B7080] mt-1">trocas</span>
                        </div>
                    </div>
                    <ul className="shrink-0 max-w-[46%] space-y-1.5 overflow-y-auto max-h-full pr-1">
                        {sorted.slice(0, 5).map(([nome, n], i) => (
                            <li key={nome} className="flex items-center gap-2 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CHART.series[i % CHART.series.length] }} />
                                <span className="text-[#8B90A0] truncate">{nome}</span>
                                <span className="ml-auto font-['IBM_Plex_Mono'] text-[#E7E9ED]">{n}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <ChartEmpty>Nenhuma troca de insumo neste recorte.</ChartEmpty>
            )}
        </ChartCard>
    );
}
