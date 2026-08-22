import React, { useState } from 'react';
import { 
    ListTodo, LayoutDashboard, History, Package, Briefcase, 
    ClipboardList, Settings2, Play, Ruler, CheckCircle2, Wrench, Layers 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function MobileNav({ activeView, onViewChange, role }) {
    const kanbanStage = useAppStore(state => state.kanbanStage);
    const setKanbanStage = useAppStore(state => state.setKanbanStage);
    const [navMode, setNavMode] = useState('kanban');

    const isKanbanView = activeView === 'kanban';

    const pagesItems = [
        ...(role === 'admin' ? [{ id: 'carteira', label: 'Carteira', icon: Briefcase }] : []),
        { id: 'kanban', label: 'Kanban', icon: ListTodo },
        ...(role === 'admin' ? [{ id: 'dashboard', label: 'Dash', icon: LayoutDashboard }] : []),
        { id: 'registros', label: 'Registros', icon: History },
        { id: 'estoque', label: 'Estoque', icon: Package },
        { id: 'ferramental', label: 'Ferramental', icon: Wrench },
        ...(role === 'admin' ? [{ id: 'clientes', label: 'Clientes', icon: Briefcase }] : []),
    ];

    const kanbanStages = [
        { id: 'aFazer', label: 'A fazer', icon: ClipboardList },
        { id: 'setup', label: 'Setup', icon: Settings2 },
        { id: 'emCorte', label: 'Usinagem', icon: Play },
        { id: 'afericao', label: 'Inspeção', icon: Ruler },
        { id: 'concluido', label: 'Concluído', icon: CheckCircle2 },
    ];

    const showStages = isKanbanView && navMode === 'kanban';
    const currentItems = showStages ? kanbanStages : pagesItems;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#181B22] border-t border-[#262A33] px-1 py-1 z-50 flex justify-around items-center h-[56px] safe-area-bottom shadow-2xl">
            {isKanbanView && (
                <button
                    type="button"
                    onClick={() => setNavMode(prev => prev === 'kanban' ? 'pages' : 'kanban')}
                    className="flex flex-col items-center justify-center py-1 px-1.5 gap-0.5 rounded-[6px] bg-[#1F232B] border border-[#333844] text-[#7B808F] active:scale-95 transition-all shrink-0 cursor-pointer"
                    title={navMode === 'kanban' ? 'Ver páginas' : 'Ver colunas'}
                >
                    <Layers className="w-3.5 h-3.5 text-[#9DA2AE]" />
                    <span className="text-[8px] font-mono uppercase tracking-tighter">
                        {navMode === 'kanban' ? 'Menu' : 'Colunas'}
                    </span>
                </button>
            )}

            {currentItems.map((item) => {
                const Icon = item.icon;
                const isActive = showStages ? kanbanStage === item.id : activeView === item.id;

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
                        className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors cursor-pointer ${
                            isActive ? 'text-[#D97D3D]' : 'text-[#565B68] hover:text-[#7B808F]'
                        }`}
                    >
                        <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                        <span className="text-[9.5px] font-medium tracking-tight text-center leading-none">
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}
