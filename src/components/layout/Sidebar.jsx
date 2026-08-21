import React from 'react';
import {
    LayoutDashboard, ListTodo, Settings, ChevronLeft,
    Package, History, LogOut, Briefcase, ShieldCheck, UserCheck, Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function Sidebar({ isOpen, onClose, activeView, onViewChange }) {
    const { role, user, nomeEmpresa, logout } = useAuthStore();
    const isAdmin = role === 'admin';

    return (
        <>
            {/* Overlay for mobile and desktop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-[100dvh] w-72 bg-slate-950 border-r border-slate-800/80 text-slate-50 shadow-[20px_0_40px_rgba(0,0,0,0.6)] z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header do Menu */}
                <div className="p-5 flex justify-between items-center border-b border-slate-800/80 bg-slate-900/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-kanban-amber/10 border border-kanban-amber/30 rounded-lg flex items-center justify-center text-kanban-amber">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-extrabold tracking-wider uppercase text-white leading-none">Navegação</h2>
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">EDM Lean System</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                </div>

                {/* Perfil / Identificação do Usuário */}
                <div className="px-4 py-3.5 border-b border-slate-800/60 bg-slate-950/80 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                        isAdmin
                            ? 'bg-kanban-amber/15 text-kanban-amber border-kanban-amber/30'
                            : 'bg-kanban-steel/15 text-kanban-steel border-kanban-steel/30'
                    }`}>
                        {user?.email ? user.email.charAt(0).toUpperCase() : (isAdmin ? 'A' : 'O')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate leading-tight">
                            {user?.email || (isAdmin ? 'Administrador' : 'Operador Terminal')}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                isAdmin
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                    : 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                            }`}>
                                {isAdmin ? <ShieldCheck className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
                                {isAdmin ? 'Gerência / Admin' : 'Chão de Fábrica'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Lista de Navegação Categorizada */}
                <nav className="p-3 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

                    {/* Grupo 1: Operação */}
                    <div className="space-y-1">
                        <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.15em]">
                            Operação & Produção
                        </div>

                        <button
                            onClick={() => { onViewChange('kanban'); onClose(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                                activeView === 'kanban'
                                    ? 'bg-kanban-amber/10 border-kanban-amber/40 text-kanban-amber font-bold shadow-sm'
                                    : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-semibold'
                            }`}
                        >
                            <ListTodo className="h-4 w-4 shrink-0" />
                            <span>Kanban de Produção</span>
                        </button>

                        <button
                            onClick={() => { onViewChange('registros'); onClose(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                                activeView === 'registros'
                                    ? 'bg-kanban-amber/10 border-kanban-amber/40 text-kanban-amber font-bold shadow-sm'
                                    : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-semibold'
                            }`}
                        >
                            <History className="h-4 w-4 shrink-0" />
                            <span>Histórico de Registros</span>
                        </button>

                        <button
                            onClick={() => { onViewChange('estoque'); onClose(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                                activeView === 'estoque'
                                    ? 'bg-kanban-amber/10 border-kanban-amber/40 text-kanban-amber font-bold shadow-sm'
                                    : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-semibold'
                            }`}
                        >
                            <Package className="h-4 w-4 shrink-0" />
                            <span>Estoque & Consumíveis</span>
                        </button>

                        <button
                            onClick={() => { onViewChange('clientes'); onClose(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                                activeView === 'clientes'
                                    ? 'bg-kanban-amber/10 border-kanban-amber/40 text-kanban-amber font-bold shadow-sm'
                                    : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-semibold'
                            }`}
                        >
                            <Briefcase className="h-4 w-4 shrink-0" />
                            <span>Clientes</span>
                        </button>
                    </div>

                    {/* Grupo 2: Gestão Executiva (Apenas Admin) */}
                    {isAdmin && (
                        <div className="space-y-1 pt-2 border-t border-slate-800/60">
                            <div className="px-3 pb-2 text-[10px] font-extrabold text-kanban-amber uppercase tracking-[0.15em] flex items-center justify-between">
                                <span>Gestão & Estratégia</span>
                                <span className="text-[8px] bg-kanban-amber/20 text-kanban-amber px-1.5 py-0.5 rounded font-black">ADMIN</span>
                            </div>

                            <button
                                onClick={() => { onViewChange('dashboard'); onClose(); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                                    activeView === 'dashboard'
                                        ? 'bg-kanban-amber/10 border-kanban-amber/40 text-kanban-amber font-bold shadow-sm'
                                        : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-semibold'
                                }`}
                            >
                                <LayoutDashboard className="h-4 w-4 shrink-0" />
                                <span>Dashboard Executivo</span>
                            </button>

                            <button
                                onClick={() => { onViewChange('configuracoes'); onClose(); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                                    activeView === 'configuracoes'
                                        ? 'bg-kanban-amber/10 border-kanban-amber/40 text-kanban-amber font-bold shadow-sm'
                                        : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-semibold'
                                }`}
                            >
                                <Settings className="h-4 w-4 shrink-0" />
                                <span>Configurações da Fábrica</span>
                            </button>
                        </div>
                    )}
                </nav>

                {/* Footer and Logout */}
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 safe-area-bottom">
                    <button
                        type="button"
                        onClick={() => logout()}
                        className="w-full flex items-center gap-2.5 justify-center bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white p-3 rounded-lg transition-colors font-bold uppercase tracking-wider text-xs border border-red-500/20 hover:border-red-500 active:scale-[0.98]"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair do Sistema
                    </button>
                    <div className="text-[10px] text-center text-slate-600 mt-3 font-mono tracking-wider">
                        EDM LEAN &copy; 2026
                    </div>
                </div>
            </aside>
        </>
    );
}

