import React from 'react';
import { Bar } from 'react-chartjs-2';
import { barOpts, hGradient } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

export default function PauseReasonsChart({ concluidas = [], kanban = {} }) {
    const motivoHoras = {};
    const add = (pausas) => {
        (pausas || []).forEach((p) => {
            const motivo = p.motivo?.trim() || 'Não informado';
            const h = Number(p.duracaoHoras ?? p.duracaoHoras ?? p.duracao_horas) || 0;
            motivoHoras[motivo] = (motivoHoras[motivo] || 0) + h;
        });
    };
    concluidas.forEach((os) => add(os.historico_pausas || os.historicoPausas));
    const ativas = [...(kanban.setup || []), ...(kanban.emCorte || []), ...(kanban.afericao || [])];
    const now = Date.now();
    ativas.forEach((os) => {
        if (!(os.is_pausado || os.isPausado)) return;
        const dataPausa = os.data_pausa || os.dataPausa;
        if (!dataPausa) return;
        const t = new Date(dataPausa).getTime();
        if (Number.isNaN(t)) return;
        const motivo = os.motivo_pausa || os.motivoPausa || 'Não informado';
        motivoHoras[motivo] = (motivoHoras[motivo] || 0) + Math.max(0, (now - t) / 3600000);
    });
    const sorted = Object.entries(motivoHoras).filter(([, h]) => h > 0).sort((a, b) => b[1] - a[1]).slice(0, 7);

    const data = {
        labels: sorted.map(([m]) => m),
        datasets: [{
            data: sorted.map(([, h]) => h),
            backgroundColor: (c) => hGradient(c, 'rgba(201,154,74,0.95)', 'rgba(201,154,74,0.18)'),
            barPercentage: 0.5,
        }],
    };
    const options = {
        ...barOpts({ horizontal: true, tickY: (v) => `${v}h` }),
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => ` ${c.parsed.x.toFixed(1)} h paradas` } },
        },
    };

    return (
        <ChartCard title="Tempo morto" subtitle="Horas de pausa por motivo" badge="parada">
            {sorted.length ? <Bar options={options} data={data} /> : <ChartEmpty>Nenhuma pausa neste recorte.</ChartEmpty>}
        </ChartCard>
    );
}
