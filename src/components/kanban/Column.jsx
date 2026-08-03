import React, { useRef, useEffect, memo } from 'react';
import Card from './Card';
import Sortable from 'sortablejs';

const ColumnIcon = ({ iconType, className }) => {
    switch (iconType) {
        case 'afazer':
            return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
                    <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M4 7h6M4 4.5h4M4 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
            );
        case 'setup':
            return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
                    <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.9 2.9l1 1M10.1 10.1l1 1M2.9 11.1l1-1M10.1 3.9l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
            );
        case 'corte':
            return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
                    <path d="M2 12L12 2M5 2h7v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'afericao':
            return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <circle cx="7" cy="7" r="0.8" fill="currentColor" />
                </svg>
            );
        case 'concluido':
            return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M4.5 7l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        default: return null;
    }
};

const getThemeClasses = (baseColorName) => {
    return {
        text: `text-${baseColorName}`,
        bgHover: `bg-${baseColorName}/10`,
        borderBottom: `after:bg-${baseColorName}`,
        countBg: `bg-${baseColorName}-dim`,
        countBorder: `border-${baseColorName}/20`,
        dragOver: `bg-${baseColorName}/10 border-${baseColorName}/50`,
    };
};

const Column = ({ id, title, cards, onTransitionRequest, onReorderRequest, onPauseRequest, onViewRequest, theme }) => {
    const classes = getThemeClasses(theme?.color || 'core');
    const sortableRef = useRef(null);

    useEffect(() => {
        if (!sortableRef.current) return;

        const sortable = Sortable.create(sortableRef.current, {
            group: 'kanban',
            animation: 150,
            delay: 250,
            delayOnTouchOnly: true,
            filter: '.kanban-no-drag', // Botões de seta no mobile não iniciam drag
            onEnd: (evt) => {
                const itemEl = evt.item;
                const osId = itemEl.dataset.osId;
                const sourceCol = evt.from.dataset.colId;
                const destCol = evt.to.dataset.colId;
                const sourceIndex = evt.oldIndex;
                const destIndex = evt.newIndex;

                if (sourceCol === destCol) {
                    evt.from.insertBefore(itemEl, evt.from.childNodes[sourceIndex] || null);

                    if (sourceCol === 'aFazer' && sourceIndex !== destIndex && onReorderRequest) {
                        onReorderRequest(sourceCol, sourceIndex, destIndex);
                    }
                } else {
                    evt.from.insertBefore(itemEl, evt.from.childNodes[sourceIndex] || null);

                    if (onTransitionRequest) {
                        onTransitionRequest(osId, sourceCol, destCol);
                    }
                }
            }
        });

        return () => {
            sortable.destroy();
        };
    }, [id, onReorderRequest, onTransitionRequest]);

    return (
        <div
            className={`flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[260px] max-w-[320px] rounded-xl flex flex-col shadow-sm transition-colors border bg-slate-900 border-slate-800 mb-4 min-h-[500px]`}
        >
            <div className={`p-4 flex items-center justify-between border-b border-slate-800 sticky top-[115px] md:top-[52px] z-30 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] ${classes.borderBottom} bg-slate-950 rounded-t-xl shadow-lg`}>
                <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 flex items-center justify-center opacity-90 ${classes.text}`}>
                        <ColumnIcon iconType={theme?.icon} />
                    </div>
                    <span className="text-sm font-extrabold tracking-widest uppercase text-white">
                        {title}
                    </span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded min-w-[24px] text-center border ${classes.countBg} ${classes.text} ${classes.countBorder}`}>
                    {cards.length}
                </span>
            </div>

            <div className="flex-1 relative flex flex-col min-h-[50px]">
                {cards.length === 0 && (
                    <div className="absolute inset-x-0 top-0 flex flex-col items-center justify-center p-[32px_16px] gap-2 opacity-25 pointer-events-none mt-4 z-0">
                        <svg className="w-8 h-8 opacity-50 text-slate-500" viewBox="0 0 28 28" fill="none">
                            <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        <span className="text-xs font-bold tracking-widest uppercase text-slate-500">Vazio</span>
                    </div>
                )}

                <div
                    ref={sortableRef}
                    data-col-id={id}
                    className={`p-3 flex-1 flex flex-col relative gap-3 z-10`}
                >
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            data-os-id={card.id}
                            className="cursor-grab active:cursor-grabbing hover:-translate-y-[1px] transition-transform will-change-transform bg-slate-950 border border-slate-800 rounded-lg p-0 kanban-item-draggable"
                        >
                            <Card
                                data={card}
                                onPauseRequest={onPauseRequest}
                                onViewRequest={onViewRequest}
                                onTransitionRequest={onTransitionRequest}
                                columnId={id}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(Column);
