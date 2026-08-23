import React from 'react';
import { Bar } from 'react-chartjs-2';
import { horasKanban } from '../../constants/osWorkflow';
import { barOpts, vGradient } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

export default function LeadTimeChart({ concluidas }) {
    const completedOS = [...(concluidas || [])]
        .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
        .slice(0, 8)
        .reverse();

    const labels = completedOS.map((os) => os.codigo_peca || os.codigoPeca || `OS-${String(os.id).slice(-4)}`);
    const data = {
        labels,
        datasets: [
            {
                label: 'CAM',
                data: completedOS.map((os) => horasKanban(os).estimadas),
                backgroundColor: (c) => vGradient(c, 'rgba(139,144,160,0.85)', 'rgba(139,144,160,0.18)'),
                barPercentage: 0.72,
                categoryPercentage: 0.62,
            },
            {
                label: 'Máquina',
                data: completedOS.map((os) => {
                    const h = horasKanban(os);
                    return h.setupReal + h.corteReal;
                }),
                backgroundColor: (c) => vGradient(c, 'rgba(217,125,61,0.95)', 'rgba(217,125,61,0.22)'),
                barPercentage: 0.72,
                categoryPercentage: 0.62,
            },
        ],
    };
    const options = {
        ...barOpts({ legend: true, tickY: (v) => `${v}h` }),
        plugins: {
            ...barOpts({ legend: true }).plugins,
            tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${c.parsed.y.toFixed(1)} h` } },
        },
        scales: {
            ...barOpts().scales,
            x: { ...barOpts().scales.x, ticks: { ...barOpts().scales.x.ticks, maxRotation: 28 } },
        },
    };

    return (
        <ChartCard title="CAM vs máquina" subtitle="Últimas 8 O.S. — previsto no cadastro × setup + corte reais" badge="horas">
            {completedOS.length ? <Bar options={options} data={data} /> : <ChartEmpty>Nenhuma ordem concluída neste recorte.</ChartEmpty>}
        </ChartCard>
    );
}
