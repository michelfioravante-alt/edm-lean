import React from 'react';

export default function ChartCard({ title, subtitle, badge, children, className = '', tall = false }) {
    return (
        <div
            className={`chart-card flex flex-col ${tall ? 'min-h-[420px] h-[420px]' : 'min-h-[360px] h-[360px]'} ${className}`}
        >
            <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
                <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold tracking-tight text-[#E7E9ED]">{title}</h3>
                    {subtitle && (
                        <p className="text-[11px] text-[#6B7080] mt-0.5 leading-snug">{subtitle}</p>
                    )}
                </div>
                {badge && (
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-[#7B808F] bg-[#111318] border border-[#262A33] px-2 py-0.5 rounded-md">
                        {badge}
                    </span>
                )}
            </div>
            <div className="flex-1 min-h-0 relative">{children}</div>
        </div>
    );
}

export function ChartEmpty({ children }) {
    return (
        <div className="h-full flex items-center justify-center text-center px-6">
            <p className="text-[13px] text-[#6B7080] leading-relaxed">{children}</p>
        </div>
    );
}
