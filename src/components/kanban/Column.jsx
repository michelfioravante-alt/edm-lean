import React, { useRef, useEffect, memo } from 'react';
import Card from './Card';
import Sortable from 'sortablejs';
import { ClipboardList, Settings2, Play, Ruler, CheckCircle2 } from 'lucide-react';

const ColumnIcon = ({ iconType, className }) => {
    switch (iconType) {
        case 'afazer':
            return <ClipboardList className={className} />;
        case 'setup':
            return <Settings2 className={className} />;
        case 'corte':
            return <Play className={className} />;
        case 'afericao':
            return <Ruler className={className} />;
        case 'concluido':
            return <CheckCircle2 className={className} />;
        default:
            return <ClipboardList className={className} />;
    }
};

const Column = ({ id, title, cards, onTransitionRequest, onReorderRequest, onPauseRequest, onViewRequest, theme }) => {
    const sortableRef = useRef(null);

    useEffect(() => {
        if (!sortableRef.current) return;

        const sortable = Sortable.create(sortableRef.current, {
            group: 'kanban',
            animation: 150,
            delay: 250,
            delayOnTouchOnly: true,
            filter: '.kanban-no-drag',
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
            className="flex-none w-full sm:w-auto sm:flex-1 sm:min-w-[280px] max-w-[340px] rounded-[10px] flex flex-col transition-colors border bg-[#111318] border-[#262A33] mb-4 min-h-[500px]"
        >
            {/* Header da Coluna */}
            <div className="px-3.5 py-3 flex items-center justify-between border-b border-[#262A33] sticky top-[115px] md:top-[52px] z-30 bg-[#181B22] rounded-t-[9px]">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 flex items-center justify-center text-[#7B808F]">
                        <ColumnIcon iconType={theme?.icon} className="w-3.5 h-3.5 stroke-[1.6]" />
                    </div>
                    <span className="text-[12px] font-semibold tracking-[0.5px] uppercase text-[#7B808F]">
                        {title}
                    </span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] min-w-[22px] text-center border bg-[#1F232B] text-[#7B808F] border-[#333844]">
                    {cards.length}
                </span>
            </div>

            {/* Lista de Cards */}
            <div className="flex-1 relative flex flex-col min-h-[50px]">
                {cards.length === 0 && (
                    <div className="absolute inset-x-0 top-0 flex flex-col items-center justify-center p-8 gap-1.5 opacity-30 pointer-events-none mt-4 z-0">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-[#565B68]">Vazio</span>
                    </div>
                )}

                <div
                    ref={sortableRef}
                    data-col-id={id}
                    className="p-2.5 flex-1 flex flex-col relative gap-2.5 z-10"
                >
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            data-os-id={card.id}
                            className="cursor-grab active:cursor-grabbing transition-transform will-change-transform rounded-[10px] p-0 kanban-item-draggable"
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
