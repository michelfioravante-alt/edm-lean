import React from 'react';
import { Bar } from 'react-chartjs-2';
import { horasKanban } from '../../constants/osWorkflow';
import { barOpts, hGradient } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

export default function ProducaoPorOperadorChart({ concluidas = [] }) {
    const horas = {};
    const qtd = {};
    concluidas.forEach((os) => {
        const op = os.operador_atual || os.operador || 'Não informado';
        const h = horasKanban(os);
        horas[op] = (horas[op] || 0) + h.setupReal + h.corteReal;
        qtd[op] = (qtd[op] || 0) + 1;
    });
    const sorted = Object.entries(horas).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const data = {
        labels: sorted.map(([o]) => o),
        datasets: [{
            data: sorted.map(([, h]) => h),
            backgroundColor: (c) => hGradient(c, 'rgba(74,157,116,0.95)', 'rgba(74,157,116,0.18)'),
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
                    afterLabel: (c) => `${qtd[sorted[c.dataIndex][0]] || 0} peça(s)`,
                },
            },
        },
    };

    return (
        <ChartCard title="Produção por operador" subtitle="Horas de setup + corte nas O.S. concluídas" badge="chão">
            {sorted.length ? <Bar options={options} data={data} /> : <ChartEmpty>Sem operador registrado neste recorte.</ChartEmpty>}
        </ChartCard>
    );
}
