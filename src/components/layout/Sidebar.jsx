import React from 'react';
import { LayoutDashboard, ListTodo, Settings, ChevronLeft, Package, History, LogOut, Briefcase, Wrench } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function Sidebar({ isOpen, onClose, activeView, onViewChange }) {
    const { role, logout } = useAuthStore();
    return (
        <>
            {/* Overlay for mobile and desktop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-[100dvh] w-72 bg-slate-900 border-r border-slate-800 text-slate-50 shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-5 flex justify-between items-center border-b border-slate-800 bg-slate-950">
                    <h2 className="text-xl font-bold tracking-wide text-white">Menu Principal</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-3 flex-1 overflow-y-auto mt-2">
                    <button
                        onClick={() => { onViewChange('kanban'); onClose(); }}
                        className={`w-full flex items-center p-4 rounded-xl transition-all border-l-4 ${activeView === 'kanban'
                            ? 'bg-kanban-amber/20 text-kanban-amber border-kanban-amber font-bold'
                            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold border-transparent'
                            }`}
                    >
                        <div className="w-8 flex justify-center shrink-0">
                            <ListTodo className="h-6 w-6" />
                        </div>
                        <span className="text-lg ml-1">Kanban</span>
                    </button>

                    {role === 'admin' && (
                        <button
                            onClick={() => { onViewChange('dashboard'); onClose(); }}
                            className={`w-full flex items-center p-4 rounded-xl transition-all border-l-4 ${activeView === 'dashboard'
                                ? 'bg-kanban-amber/20 text-kanban-amber border-kanban-amber font-bold'
                                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold border-transparent'
                                }`}
                        >
                            <div className="w-8 flex justify-center shrink-0">
                                <LayoutDashboard className="h-6 w-6" />
                            </div>
                            <span className="text-lg ml-1">Dashboard</span>
                        </button>
                    )}

                    <button
                        onClick={() => { onViewChange('registros'); onClose(); }}
                        className={`w-full flex items-center p-4 rounded-xl transition-all border-l-4 ${activeView === 'registros'
                            ? 'bg-kanban-amber/20 text-kanban-amber border-kanban-amber font-bold'
                            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold border-transparent'
                            }`}
                    >
                        <div className="w-8 flex justify-center shrink-0">
                            <History className="h-6 w-6" />
                        </div>
                        <span className="text-lg ml-1">Registros</span>
                    </button>

                    <button
                        onClick={() => { onViewChange('estoque'); onClose(); }}
                        className={`w-full flex items-center p-4 rounded-xl transition-all border-l-4 ${activeView === 'estoque'
                            ? 'bg-kanban-amber/20 text-kanban-amber border-kanban-amber font-bold'
                            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold border-transparent'
                            }`}
                    >
                        <div className="w-8 flex justify-center shrink-0">
                            <Package className="h-6 w-6" />
                        </div>
                        <span className="text-lg ml-1">Estoque e Consumíveis</span>
                    </button>

                    <button
                        onClick={() => { onViewChange('ferramental'); onClose(); }}
                        className={`w-full flex items-center p-4 rounded-xl transition-all border-l-4 ${activeView === 'ferramental'
                            ? 'bg-kanban-amber/20 text-kanban-amber border-kanban-amber font-bold'
                            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold border-transparent'
                            }`}
                    >
                        <div className="w-8 flex justify-center shrink-0">
                            <Wrench className="h-6 w-6" />
                        </div>
                        <span className="text-lg ml-1">Ferramental</span>
                    </button>

                    <button
                        onClick={() => { onViewChange('clientes'); onClose(); }}
                        className={`w-full flex items-center p-4 rounded-xl transition-all border-l-4 ${activeView === 'clientes'
                            ? 'bg-kanban-amber/20 text-kanban-amber border-kanban-amber font-bold'
                            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold border-transparent'
                            }`}
                    >
                        <div className="w-8 flex justify-center shrink-0">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <span className="text-lg ml-1">Clientes</span>
                    </button>

                    {role === 'admin' && (
                        <button
                            onClick={() => { onViewChange('configuracoes'); onClose(); }}
                            className={`w-full flex items-center p-4 rounded-xl transition-all mt-8 border-l-4 ${activeView === 'configuracoes'
                                ? 'bg-kanban-amber/20 text-kanban-amber border-kanban-amber font-bold'
                                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold border-transparent'
                                }`}
                        >
                            <div className="w-8 flex justify-center shrink-0">
                                <Settings className="h-6 w-6" />
                            </div>
                            <span className="text-lg ml-1">Configurações</span>
                        </button>
                    )}
                </nav>

                {/* Footer and Logout */}
                <div className="p-4 pb-6 border-t border-slate-800 mt-auto bg-slate-950/50 safe-area-bottom">
                    <button
                        type="button"
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 justify-center bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white p-4 min-h-[48px] rounded-lg transition-colors font-bold uppercase tracking-wider text-sm border border-red-500/20 hover:border-red-500 touch-manipulation active:scale-[0.98]"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair do Sistema
                    </button>
                    <div className="text-xs text-center text-slate-600 mt-4 uppercase tracking-[0.2em] font-bold flex flex-col items-center gap-2">
                        <div className="w-8 h-8 bg-kanban-amber/20 rounded-lg flex items-center justify-center mb-1">
                            <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 70L40 50L55 60L85 25" stroke="#fbbf24" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M45 40L55 60" stroke="white" strokeWidth="12" strokeLinecap="round" />
                            </svg>
                        </div>
                        EDM Lean &copy; 2026

                    </div>

                </div>
            </aside>
        </>
    );
}
