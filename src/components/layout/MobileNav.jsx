import React, { useState } from 'react';
import { ListTodo, LayoutDashboard, History, Package, Briefcase, ClipboardList, Settings2, CheckCircle2, Ruler, Wrench, Layers } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

function LogoIcon(props) {
    return (
        <svg
            {...props}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M20 70L40 50L55 60L85 25" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M45 40L55 60" stroke="currentColor" strokeWidth="16" strokeLinecap="round" opacity="0.8" />
        </svg>
    );
}

export default function MobileNav({ activeView, onViewChange, role }) {
    const kanbanStage = useAppStore(state => state.kanbanStage);
    const setKanbanStage = useAppStore(state => state.setKanbanStage);
    const [navMode, setNavMode] = useState('kanban'); // 'kanban' or 'pages'

    const isKanbanView = activeView === 'kanban';

    const pagesItems = [
        { id: 'kanban', label: 'Kanban', icon: ListTodo },
        ...(role === 'admin' ? [{ id: 'dashboard', label: 'Dash', icon: LayoutDashboard }] : []),
        { id: 'registros', label: 'Registros', icon: History },
        { id: 'estoque', label: 'Estoque', icon: Package },
        { id: 'ferramental', label: 'Ferramentas', icon: Wrench },
        { id: 'clientes', label: 'Clientes', icon: Briefcase },
    ];

    const kanbanStages = [
        { id: 'aFazer', label: 'A fazer', icon: ClipboardList },
        { id: 'setup', label: 'Setup', icon: Settings2 },
        { id: 'emCorte', label: 'Usinagem', icon: LogoIcon },
        { id: 'afericao', label: 'Inspeção', icon: Ruler },
        { id: 'concluido', label: 'Concluído', icon: CheckCircle2 },
    ];

    const colorMap = {
        kanban: 'text-kanban-amber',
        dashboard: 'text-kanban-blue',
        registros: 'text-kanban-violet',
        estoque: 'text-kanban-teal',
        ferramental: 'text-kanban-amber',
        clientes: 'text-kanban-steel',
        aFazer: 'text-kanban-steel',
        setup: 'text-kanban-amber',
        emCorte: 'text-kanban-teal',
        afericao: 'text-kanban-violet',
        concluido: 'text-kanban-green',
    };

    const showStages = isKanbanView && navMode === 'kanban';
    const currentItems = showStages ? kanbanStages : pagesItems;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-1 py-1 z-50 flex justify-around items-center h-[65px] safe-area-bottom shadow-[0_-4px_10px_rgba(0,0,0,0.4)]">
            {isKanbanView && (
                <button
                    type="button"
                    onClick={() => setNavMode(prev => prev === 'kanban' ? 'pages' : 'kanban')}
                    className="flex flex-col items-center justify-center py-1 px-1.5 gap-0.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 active:scale-95 transition-all shrink-0 cursor-pointer"
                    title={navMode === 'kanban' ? 'Trocar para menu de páginas' : 'Trocar para colunas do Kanban'}
                >
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">
                        {navMode === 'kanban' ? 'Menu' : 'Colunas'}
                    </span>
                </button>
            )}

            {currentItems.map((item) => {
                const Icon = item.icon;
                const isActive = showStages ? kanbanStage === item.id : activeView === item.id;
                const itemColorClass = colorMap[item.id] || 'text-slate-400';

                return (
                    <button
                        key={item.id}
                        onClick={() => {
                            if (showStages) {
                                setKanbanStage(item.id);
                            } else {
                                onViewChange(item.id);
                                if (item.id === 'kanban') setNavMode('kanban');
                            }
                        }}
                        className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all cursor-pointer ${isActive ? 'scale-105' : 'opacity-60 grayscale hover:grayscale-0'}`}
                    >
                        <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? `${itemColorClass.replace('text-', 'bg-')}/10 ${itemColorClass}` : 'text-slate-500'}`}>
                            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tighter text-center leading-none transition-colors ${isActive ? itemColorClass : 'text-slate-500'}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}
