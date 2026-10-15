import React from 'react';
import { Bar } from 'react-chartjs-2';
import { horasKanban } from '../../constants/osWorkflow';
import { barOpts, hGradient } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

export default function RefugoPorMaquinaChart({ concluidas = [] }) {
    const horas = {};
    const qtd = {};
    concluidas.filter((os) => (os.resultado_afericao) === 'Refugo').forEach((os) => {
        const maq = os.maquina_nome || 'Não informada';
        const h = horasKanban(os);
        horas[maq] = (horas[maq] || 0) + h.setupReal + h.corteReal;
        qtd[maq] = (qtd[maq] || 0) + 1;
    });
    const sorted = Object.entries(horas).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const data = {
        labels: sorted.map(([m]) => m),
        datasets: [{
            data: sorted.map(([, h]) => h),
            backgroundColor: (c) => hGradient(c, 'rgba(200,85,88,0.95)', 'rgba(200,85,88,0.18)'),
            barPercentage: 0.5,
        }],
    };
    const options = {
        ...barOpts({ horizontal: true, tickY: (v) => `${v}h` }),
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (c) => ` ${c.parsed.x.toFixed(1)} h`,
                    afterLabel: (c) => `${qtd[sorted[c.dataIndex][0]] || 0} peça(s) refugada(s)`,
                },
            },
        },
    };

    return (
        <ChartCard title="Refugo por máquina" subtitle="Horas de setup + corte em peças reprovadas" badge="qualidade">
            {sorted.length ? <Bar options={options} data={data} /> : <ChartEmpty>Nenhum refugo neste recorte.</ChartEmpty>}
        </ChartCard>
    );
}
