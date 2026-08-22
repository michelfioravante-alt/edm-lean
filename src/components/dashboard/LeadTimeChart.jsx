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
import { useAppStore } from '../../store/useAppStore';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function LeadTimeChart({ concluidas }) {
    // Aggregates only 'Concluído' OS for efficiency comparison
    // Compares Estimated Time vs Real Time (Lead Time / Cycle Time conceptually here)
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        barPercentage: 1,
        categoryPercentage: 0.7,
        maxBarThickness: 32,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 6,
                    font: { size: 11 },
                    padding: 12,
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}h`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(148, 163, 184, 0.12)',
                },
                border: { display: false },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 11 },
                    callback: function (value) {
                        return value + 'h';
                    }
                }
            },
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 10 },
                    maxRotation: 45,
                }
            }
        }
    };

    // Obter as OS concluídas mais recentes (limitado a 10 para o gráfico visualmente não quebrar)
    const completedOS = [...concluidas]
        .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
        .slice(0, 10)
        .reverse();

    const labels = completedOS.map(os => os.codigo_peca || os.codigoPeca || `OS-${os.id.toString().slice(-4)}`);

    const plannedData = completedOS.map(os => {
        const setupH = parseInt(os.tempo_estimado_setup_horas || os.tempoEstimadoSetupHoras || 0, 10) || 0;
        const setupM = (parseInt(os.tempo_estimado_setup_minutos || os.tempoEstimadoSetupMinutos || 0, 10) || 0) / 60;
        const corteH = parseInt(os.tempo_estimado_corte_horas || os.tempoEstimadoCorteHoras || 0, 10) || 0;
        const corteM = (parseInt(os.tempo_estimado_corte_minutos || os.tempoEstimadoCorteMinutos || 0, 10) || 0) / 60;
        return setupH + setupM + corteH + corteM;
    });

    const realData = completedOS.map(os => {
        const temposFases = os.tempos_fases || os.temposFases || { setup: 0, emCorte: 0 };
        return (temposFases.setup || 0) + (temposFases.emCorte || 0);
    });

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Tempo Previsto (h)',
                data: plannedData,
                backgroundColor: 'rgba(148, 163, 184, 0.7)',
                borderRadius: 4,
                borderSkipped: false,
            },
            {
                label: 'Tempo Real (h)',
                data: realData,
                backgroundColor: 'rgba(59, 130, 246, 0.85)',
                borderRadius: 4,
                borderSkipped: false,
            },
        ],
    };

    return (
        <div className="bg-surface2 p-6 rounded-xl shadow-card border border-edge h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold text-core mb-1">Eficiência: Previsto vs Realizado</h3>
            <p className="text-sm text-muted mb-4">Comparativo das últimas 10 Ordens Concluídas (Horas Líquidas)</p>
            <div className="flex-1 min-h-0">
                {completedOS.length > 0 ? (
                    <Bar options={options} data={chartData} />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#7B808F]">
                        <p>Nenhuma ordem concluída para exibir gráficos.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
