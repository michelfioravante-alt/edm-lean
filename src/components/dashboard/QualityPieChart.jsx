import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { CHART, doughnutOpts } from '../../utils/chartTheme';
import ChartCard, { ChartEmpty } from './ChartCard';

export default function QualityPieChart({ concluidas = [] }) {
    const aprovadas = concluidas.filter((os) => {
        const r = os.resultado_afericao || os.resultadoAfericao;
        return r === 'Aprovada' || r === 'Aprovada';
    }).length;
    const refugo = concluidas.filter((os) => (os.resultado_afericao || os.resultadoAfericao) === 'Refugo').length;
    const total = aprovadas + refugo;
    const fpy = total > 0 ? ((aprovadas / total) * 100).toFixed(1) : '0';

    const data = {
        labels: ['Aprovadas', 'Refugo'],
        datasets: [{
            data: [aprovadas, refugo],
            backgroundColor: [CHART.ok, CHART.alert],
            hoverBackgroundColor: ['#5BB888', '#D86A6C'],
            borderWidth: 0,
            spacing: 3,
            borderRadius: 6,
            hoverOffset: 6,
        }],
    };
    const options = {
        ...doughnutOpts(),
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (c) => {
                        const pct = total ? ((c.parsed / total) * 100).toFixed(1) : 0;
                        return ` ${c.label}: ${c.parsed} (${pct}%)`;
                    },
                },
            },
        },
    };

    return (
        <ChartCard title="Qualidade (FPY)" subtitle="Primeira aprovação na aferição" badge="CMM">
            {total > 0 ? (
                <div className="h-full flex items-center gap-6">
                    <div className="relative flex-1 h-full min-w-0">
                        <Doughnut data={data} options={options} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="font-['Space_Grotesk'] text-[28px] font-semibold text-[#E7E9ED] leading-none">{fpy}%</span>
                            <span className="text-[10px] uppercase tracking-[0.16em] text-[#6B7080] mt-1">FPY</span>
                        </div>
                    </div>
                    <div className="shrink-0 space-y-3 pr-1">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-[#6B7080]">Aprovadas</p>
                            <p className="font-['IBM_Plex_Mono'] text-lg text-[#4A9D74]">{aprovadas}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-[#6B7080]">Refugo</p>
                            <p className="font-['IBM_Plex_Mono'] text-lg text-[#C85558]">{refugo}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <ChartEmpty>Nenhuma peça aferida neste recorte.</ChartEmpty>
            )}
        </ChartCard>
    );
}
