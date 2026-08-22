import React from 'react';

export default function KpiCard({ title, value, icon: Icon, trend, trendValue, colorClass, tooltipContent }) {
    return (
        <div className="bg-[#181B22] p-5 rounded-[10px] border border-[#262A33] relative z-0 hover:border-[#333844] transition-colors">
            {/* Tarja de cor lateral */}
            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-[10px] ${colorClass || 'bg-[#333844]'}`}></div>

            <div className="flex justify-between items-start mb-3 group relative">
                <h3 className="text-[#7B808F] font-medium text-xs uppercase tracking-wider">{title}</h3>
                <div className={`p-1.5 rounded-[6px] bg-[#1F232B] relative ${tooltipContent ? 'cursor-help' : ''}`}>
                    <Icon className="w-4 h-4 text-[#9DA2AE]" />
                    {tooltipContent && (
                        <div className="pointer-events-none absolute right-0 top-[calc(100%+8px)] w-64 opacity-0 transition-all duration-200 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 z-50">
                            <div className="absolute -top-1.5 right-3.5 w-3 h-3 bg-[#1F232B] rotate-45 border-l border-t border-[#262A33]"></div>
                            <div className="bg-[#1F232B] border border-[#333844] shadow-[0_8px_24px_rgba(0,0,0,0.5)] rounded-[8px] p-3 text-[0.8rem] text-[#E7E9ED] leading-relaxed font-normal normal-case relative">
                                {tooltipContent}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
                <h2 className="font-['Space_Grotesk'] text-2xl font-semibold text-[#E7E9ED]">{value}</h2>
            </div>

            {trend && !isNaN(parseFloat(trendValue)) && (
                <div className="flex items-center gap-1 text-xs">
                    <span className={`font-semibold ${trend === 'up' ? 'text-[#4A9D74]' : trend === 'down' ? 'text-[#C85558]' : 'text-[#7B808F]'}`}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '-'} {Math.abs(parseFloat(trendValue))}%
                    </span>
                    <span className="text-[#565B68]">vs último turno</span>
                </div>
            )}
        </div>
    );
}
