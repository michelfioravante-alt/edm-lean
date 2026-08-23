import React from 'react';
import { Bar } from 'react-chartjs-2';
import { barOpts, hGradient } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

export default function ClientPiecesChart({ concluidas = [] }) {
    const ranking = {};
    concluidas.forEach((os) => {
        const cliente = os.cliente?.trim() || 'Não informado';
        ranking[cliente] = (ranking[cliente] || 0) + 1;
    });
    const sorted = Object.entries(ranking).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const data = {
        labels: sorted.map(([n]) => (n.length > 22 ? `${n.slice(0, 21)}…` : n)),
        datasets: [{
            data: sorted.map(([, c]) => c),
            backgroundColor: (c) => hGradient(c, 'rgba(217,125,61,0.95)', 'rgba(217,125,61,0.18)'),
            barPercentage: 0.5,
        }],
    };
    const options = {
        ...barOpts({ horizontal: true, tickY: (v) => (Number.isInteger(v) ? v : '') }),
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => sorted[items[0]?.dataIndex]?.[0] || '',
                    label: (c) => ` ${c.parsed.x} peça${c.parsed.x === 1 ? '' : 's'}`,
                },
            },
        },
    };

    return (
        <ChartCard title="Volume por cliente" subtitle="O.S. concluídas no recorte" badge="carteira">
            {sorted.length ? <Bar options={options} data={data} /> : <ChartEmpty>Nenhuma peça concluída neste recorte.</ChartEmpty>}
        </ChartCard>
    );
}
