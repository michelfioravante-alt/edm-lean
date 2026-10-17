import React, { useEffect, useMemo, useState } from 'react';
import {
    Home, ListTodo, LayoutDashboard, History, Package, Briefcase,
    ClipboardList, Settings2, Play, Ruler, CheckCircle2, Wrench,
    FolderKanban, MoreHorizontal, X, Layers,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const KANBAN_STAGES = [
    { id: 'aFazer', label: 'Fila', icon: ClipboardList },
    { id: 'setup', label: 'Setup', icon: Settings2 },
    { id: 'emCorte', label: 'Corte', icon: Play },
    { id: 'afericao', label: 'Insp.', icon: Ruler },
    { id: 'concluido', label: 'OK', icon: CheckCircle2 },
];

function navPorPapel(role) {
    if (role === 'admin') {
        return {
            primary: [
                { id: 'home', label: 'Início', icon: Home },
                { id: 'kanban', label: 'Kanban', icon: ListTodo },
                { id: 'moldes', label: 'Moldes', icon: FolderKanban },
                { id: 'estoque', label: 'Estoque', icon: Package },
            ],
            more: [
                { id: 'carteira', label: 'Carteira de O.S.', icon: Briefcase },
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'registros', label: 'Registros', icon: History },
                { id: 'ferramental', label: 'Ferramental CNC', icon: Wrench },
                { id: 'clientes', label: 'Clientes', icon: Briefcase },
            ],
        };
    }
    return {
        primary: [
            { id: 'kanban', label: 'Kanban', icon: ListTodo },
            { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
            { id: 'estoque', label: 'Estoque', icon: Package },
            { id: 'registros', label: 'Histórico', icon: History },
        ],
        more: [
            { id: 'ferramental', label: 'Ferramental CNC', icon: Wrench },
        ],
    };
}

export default function MobileNav({ activeView, onViewChange, role }) {
    const kanbanStage = useAppStore((state) => state.kanbanStage);
    const setKanbanStage = useAppStore((state) => state.setKanbanStage);
    const [colunasKanban, setColunasKanban] = useState(true);
    const [maisAberto, setMaisAberto] = useState(false);

    const { primary, more } = useMemo(() => navPorPapel(role), [role]);
    const idsMais = useMemo(() => new Set(more.map((i) => i.id)), [more]);
    const isKanbanView = activeView === 'kanban';
    const showStages = isKanbanView && colunasKanban;
    const maisAtivo = idsMais.has(activeView);

    useEffect(() => {
        if (!isKanbanView) setColunasKanban(false);
        else setColunasKanban(true);
    }, [isKanbanView]);

    useEffect(() => {
        setMaisAberto(false);
    }, [activeView]);

    const irPara = (id) => {
        onViewChange(id);
        setMaisAberto(false);
        if (id === 'kanban') setColunasKanban(true);
    };

    return (
        <>
            {maisAberto && (
                <div className="md:hidden fixed inset-0 z-[55] flex flex-col justify-end">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] cursor-pointer"
                        aria-label="Fechar menu"
                        onClick={() => setMaisAberto(false)}
                    />
                    <div
                        className="relative bg-[#181B22] border-t border-[#262A33] rounded-t-2xl shadow-2xl px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 duration-200"
                        role="dialog"
                        aria-label="Mais opções"
                    >
                        <div className="flex items-center justify-between px-1 mb-2">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#565B68]">Mais</p>
                                <p className="text-sm font-semibold text-[#E7E9ED]">Outras telas</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMaisAberto(false)}
                                className="p-2 rounded-lg text-[#7B808F] hover:bg-[#1F232B] hover:text-[#E7E9ED] cursor-pointer"
                                aria-label="Fechar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            {more.map((item) => {
                                const Icon = item.icon;
                                const ativo = activeView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => irPara(item.id)}
                                        className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
                                            ativo
                                                ? 'bg-[#1F232B] border-[#D97D3D]/50 text-[#E7E9ED]'
                                                : 'bg-[#111318]/80 border-[#262A33] text-[#9DA2AE] hover:border-[#333844] hover:text-[#E7E9ED]'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 shrink-0 ${ativo ? 'text-[#D97D3D]' : ''}`} />
                                        <span className="text-xs font-medium leading-tight">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#181B22]/95 backdrop-blur-md border-t border-[#262A33] px-1.5 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] z-50 flex justify-around items-stretch min-h-[56px] shadow-[0_-8px_24px_rgba(0,0,0,0.35)]">
                {showStages ? (
                    <>
                        <button
                            type="button"
                            onClick={() => setColunasKanban(false)}
                            className="flex flex-col items-center justify-center py-1.5 px-2 gap-0.5 rounded-lg bg-[#1F232B] border border-[#333844] text-[#9DA2AE] active:scale-95 transition-all shrink-0 cursor-pointer self-center"
                            title="Ver atalhos"
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span className="text-[8px] font-semibold uppercase tracking-tight">Menu</span>
                        </button>
                        {KANBAN_STAGES.map((item) => {
                            const Icon = item.icon;
                            const ativo = kanbanStage === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setKanbanStage(item.id)}
                                    className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 gap-0.5 transition-colors cursor-pointer ${
                                        ativo ? 'text-[#D97D3D]' : 'text-[#565B68]'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${ativo ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                                    <span className="text-[9px] font-medium tracking-tight leading-none truncate max-w-full px-0.5">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </>
                ) : (
                    <>
                        {isKanbanView && (
                            <button
                                type="button"
                                onClick={() => setColunasKanban(true)}
                                className="flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 gap-0.5 transition-colors cursor-pointer text-[#D97D3D]"
                                title="Voltar às colunas do kanban"
                            >
                                <Layers className="w-4 h-4 stroke-[2.2]" />
                                <span className="text-[9.5px] font-medium tracking-tight leading-none">Colunas</span>
                            </button>
                        )}
                        {primary
                            .filter((item) => !(isKanbanView && item.id === 'kanban'))
                            .map((item) => {
                                const Icon = item.icon;
                                const ativo = activeView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => irPara(item.id)}
                                        className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 gap-0.5 transition-colors cursor-pointer ${
                                            ativo ? 'text-[#D97D3D]' : 'text-[#565B68]'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${ativo ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                                        <span className="text-[9.5px] font-medium tracking-tight leading-none truncate max-w-full px-0.5">
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        {more.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setMaisAberto(true)}
                                className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 gap-0.5 transition-colors cursor-pointer ${
                                    maisAtivo || maisAberto ? 'text-[#D97D3D]' : 'text-[#565B68]'
                                }`}
                            >
                                <MoreHorizontal className={`w-4 h-4 ${maisAtivo || maisAberto ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                                <span className="text-[9.5px] font-medium tracking-tight leading-none">Mais</span>
                            </button>
                        )}
                    </>
                )}
            </nav>
        </>
    );
}
