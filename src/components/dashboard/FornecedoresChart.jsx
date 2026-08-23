import React from 'react';
import { Bar } from 'react-chartjs-2';
import { barOpts, hGradient } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

export default function FornecedoresChart({ ranking = [] }) {
    const rows = ranking.slice(0, 6);
    const data = {
        labels: rows.map((r) => r.nome),
        datasets: [{
            data: rows.map((r) => r.mediaDias ?? 0),
            backgroundColor: (c) => hGradient(c, 'rgba(201,154,74,0.95)', 'rgba(201,154,74,0.2)'),
            barPercentage: 0.5,
        }],
    };
    const options = {
        ...barOpts({ horizontal: true, tickY: (v) => `${v}d` }),
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (c) => ` ${(c.parsed.x || 0).toFixed(1)} dias`,
                    afterLabel: (c) => {
                        const r = rows[c.dataIndex];
                        return `${r.ciclos} ciclo(s) · ${r.laAgora} no terceiro`;
                    },
                },
            },
        },
    };

    return (
        <ChartCard title="Terceiros" subtitle="Dias médios entre enviado e retorno" badge="lead time">
            {rows.length ? <Bar data={data} options={options} /> : <ChartEmpty>Ainda não há ciclo completo de serviço externo.</ChartEmpty>}
        </ChartCard>
    );
}
