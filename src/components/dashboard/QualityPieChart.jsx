import React from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useAppStore } from '../../store/useAppStore';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function QualityPieChart({ concluidas = [] }) {
    // Contagem
    const aprovadas = concluidas.filter(os => (os.resultado_afericao || os.resultadoAfericao) === 'Aprovada').length;
    const refugo = concluidas.filter(os => (os.resultado_afericao || os.resultadoAfericao) === 'Refugo').length;

    const total = aprovadas + refugo;
    const fpy = total > 0 ? ((aprovadas / total) * 100).toFixed(1) : 0;

    const data = {
        labels: ['Aprovadas (FPY)', 'Refugo / Descarte'],
        datasets: [
            {
                data: [aprovadas, refugo],
                backgroundColor: [
                    '#10b981', // emerald-500
                    '#ef4444', // red-500
                ],
                borderColor: [
                    '#059669', // emerald-600
                    '#dc2626', // red-600
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const value = context.parsed;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return ` ${context.label}: ${value} un (${percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <div className="bg-surface2 p-6 rounded-xl shadow-card border border-edge h-[400px] flex flex-col relative">
            <h3 className="text-lg font-semibold text-core mb-1">Qualidade de Produção (FPY)</h3>
            <p className="text-sm text-muted mb-6">Índice de Aprovação vs Refugo na CMM</p>

            <div className="flex-1 relative min-h-0 flex items-center justify-center">
                {total > 0 ? (
                    <>
                        <Doughnut data={data} options={options} />
                        {/* Overlay Rate Center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                            <span className="text-3xl font-black text-core">{fpy}%</span>
                            <span className="text-xs font-bold text-muted uppercase tracking-widest">Aprovação</span>
                        </div>
                    </>
                ) : (
                    <div className="text-slate-400 text-center">
                        <p>Nenhuma peça aferida até o momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
