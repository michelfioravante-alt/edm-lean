import React from 'react';

export default function KpiCard({ title, value, icon: Icon, trend, trendValue, colorClass, tooltipContent }) {
    return (
        <div className="bg-slate-900 p-5 rounded-xl shadow-card border border-slate-800 relative z-0">
            {/* Tarja de cor lateral corrigida para não transbordar sem o uso do overflow-hidden */}
            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${colorClass || 'bg-slate-500'}`}></div>

            <div className="flex justify-between items-start mb-2 group relative">
                <h3 className="text-slate-400 font-medium text-sm">{title}</h3>
                <div className={`p-2 rounded-lg bg-slate-950 ${(colorClass || 'bg-slate-500').replace('bg-', 'text-')} relative cursor-help`}>
                    <Icon className="w-5 h-5" />
                    {tooltipContent && (
                        <div className="pointer-events-none absolute right-0 top-[calc(100%+8px)] w-64 opacity-0 transition-all duration-200 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 z-50">
                            {/* Ponta da Flecha (Opcional visual) */}
                            <div className="absolute -top-1.5 right-3.5 w-3 h-3 bg-slate-800 rotate-45 border-l border-t border-slate-800"></div>
                            <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 shadow-modal rounded-lg p-3 text-[0.8rem] text-slate-100 leading-relaxed font-normal normal-case relative">
                                {tooltipContent}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
                <h2 className="text-2xl font-bold text-slate-100">{value}</h2>
            </div>

            {trend && !isNaN(parseFloat(trendValue)) && (
                <div className="flex items-center gap-1 text-sm">
                    <span className={`font-semibold ${trend === 'up' ? 'text-kanban-green' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '-'} {Math.abs(parseFloat(trendValue))}%
                    </span>
                    <span className="text-slate-400">vs último turno</span>
                </div>
            )}
        </div>
    );
}
