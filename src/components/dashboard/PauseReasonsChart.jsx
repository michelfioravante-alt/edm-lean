import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = [
    '#f59e0b', '#3b82f6', '#a855f7', '#22c55e', '#f43f5e',
    '#fb923c', '#06b6d4', '#14b8a6', '#94a3b8'
];

export default function PauseReasonsChart({ concluidas = [], kanban = {} }) {
    const motivoHoras = {};

    const addPausas = (pausas) => {
        (pausas || []).forEach(p => {
            const motivo = p.motivo?.trim() || 'Não informado';
            const h = p.duracaoHoras || 0;
            motivoHoras[motivo] = (motivoHoras[motivo] || 0) + h;
        });
    };

    concluidas.forEach(os => addPausas(os.historico_pausas || os.historicoPausas));

    // Pausas ativas
    const ativas = [...(kanban.setup || []), ...(kanban.emCorte || []), ...(kanban.afericao || [])];
    const agoraMs = Date.now();
    ativas.forEach(os => {
        if (os.is_pausado || os.isPausado) {
            const dataPausa = os.data_pausa || os.dataPausa;
            const motivo = os.motivo_pausa || os.motivoPausa || 'Não informado';
            if (dataPausa) {
                const t = new Date(dataPausa).getTime();
                if (!isNaN(t)) {
                    const h = Math.max(0, (agoraMs - t) / (1000 * 60 * 60));
                    motivoHoras[motivo] = (motivoHoras[motivo] || 0) + h;
                }
            }
        }
    });

    const sortedData = Object.entries(motivoHoras)
        .filter(([, h]) => h > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);

    const barHeight = 24;
    const chartHeight = Math.max(100, sortedData.length * barHeight);
    const maxVisibleHeight = 320;

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        barThickness: barHeight,
        maxBarThickness: barHeight,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ${ctx.parsed.x.toFixed(1)}h de tempo morto`
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { color: 'rgba(148, 163, 184, 0.12)' },
                ticks: {
                    color: '#94a3b8',
                    callback: (v) => v + 'h'
                }
            },
            y: {
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 11 } }
            }
        }
    };

    const chartData = {
        labels: sortedData.map(([m]) => m),
        datasets: [{
            label: 'Horas',
            data: sortedData.map(([, h]) => h),
            backgroundColor: sortedData.map((_, i) => COLORS[i % COLORS.length]),
            borderRadius: 4,
            borderSkipped: false,
        }]
    };

    return (
        <div className="bg-surface2 p-6 rounded-xl shadow-card border border-edge flex flex-col">
            <h3 className="text-lg font-semibold text-core mb-1">Tempo Morto por Motivo de Pausa</h3>
            <p className="text-sm text-muted mb-4">Análise de causa raiz: onde as horas estão sendo perdidas</p>
            <div
                className="flex-1 min-h-0 overflow-y-auto kanban-scroll"
                style={{ minHeight: 120, maxHeight: maxVisibleHeight }}
            >
                {sortedData.length > 0 ? (
                    <div style={{ height: chartHeight, minWidth: 200 }}>
                        <Bar options={options} data={chartData} />
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center justify-center text-[#7B808F] gap-2 py-8">
                        <p className="font-bold text-sm">Nenhuma pausa registrada no período.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
