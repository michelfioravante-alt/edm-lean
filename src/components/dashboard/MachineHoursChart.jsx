import React from 'react';
import { Bar } from 'react-chartjs-2';
import { horasKanban } from '../../constants/osWorkflow';
import { barOpts, hGradient } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

export default function MachineHoursChart({ concluidas = [] }) {
    const ranking = {};
    concluidas.forEach((os) => {
        const name = os.maquina_nome;
        if (!name) return;
        const h = horasKanban(os);
        ranking[name] = (ranking[name] || 0) + h.setupReal + h.corteReal;
    });
    const sorted = Object.entries(ranking).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const data = {
        labels: sorted.map(([n]) => n.replace(/\s*\(.*\)/, '')),
        datasets: [{
            data: sorted.map(([, v]) => v),
            backgroundColor: (c) => hGradient(c, 'rgba(217,125,61,0.95)', 'rgba(217,125,61,0.2)'),
            barPercentage: 0.55,
        }],
    };
    const options = {
        ...barOpts({ horizontal: true, tickY: (v) => `${v}h` }),
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => ` ${c.parsed.x.toFixed(1)} h de setup + corte` } },
        },
    };

    return (
        <ChartCard title="Carga por máquina" subtitle="Horas reais de setup + corte no período" badge="top 6">
            {sorted.length ? <Bar options={options} data={data} /> : <ChartEmpty>Sem horas de máquina neste recorte.</ChartEmpty>}
        </ChartCard>
    );
}
