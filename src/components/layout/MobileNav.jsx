import React from 'react';
import { ListTodo, LayoutDashboard, History, Package, Briefcase, Settings, ClipboardList, Settings2, CheckCircle2, Ruler } from 'lucide-react';
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

    // Itens de navegação global padrão
    const navItems = [
        { id: 'kanban', label: 'Kanban', icon: ListTodo },
        ...(role === 'admin' ? [{ id: 'dashboard', label: 'Dash', icon: LayoutDashboard }] : []),
        { id: 'registros', label: 'Registros', icon: History },
        { id: 'estoque', label: 'Estoque', icon: Package },
        { id: 'clientes', label: 'Clientes', icon: Briefcase },
    ];

    // Itens específicos para quando o usuário está no Kanban
    const kanbanStages = [
        { id: 'aFazer', label: 'A fazer', icon: ClipboardList },
        { id: 'setup', label: 'Set-up', icon: Settings2 },
        { id: 'emCorte', label: 'Corte', icon: LogoIcon },
        { id: 'afericao', label: 'Aferição', icon: Ruler },
        { id: 'concluido', label: 'Concluído', icon: CheckCircle2 },
    ];

    // Mapeamento de cores para os ícones
    const colorMap = {
        // Global
        kanban: 'text-kanban-amber',
        dashboard: 'text-kanban-blue',
        registros: 'text-kanban-violet',
        estoque: 'text-kanban-teal',
        clientes: 'text-kanban-steel',
        // Kanban Stages
        aFazer: 'text-kanban-steel',
        setup: 'text-kanban-amber',
        emCorte: 'text-kanban-teal',
        afericao: 'text-kanban-violet',
        concluido: 'text-kanban-green',
    };

    const isKanbanView = activeView === 'kanban';
    const currentItems = isKanbanView ? kanbanStages : navItems;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-1 py-1 z-50 flex justify-around items-center h-[65px] safe-area-bottom shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
            {currentItems.map((item) => {
                const Icon = item.icon;
                const isActive = isKanbanView ? kanbanStage === item.id : activeView === item.id;
                const itemColorClass = colorMap[item.id] || 'text-slate-400';

                return (
                    <button
                        key={item.id}
                        onClick={() => isKanbanView ? setKanbanStage(item.id) : onViewChange(item.id)}
                        className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${isActive ? 'scale-110' : 'opacity-60 grayscale-[0.5] grayscale hover:grayscale-0'}`}
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
