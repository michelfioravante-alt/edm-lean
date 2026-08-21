import React from 'react';
import { 
    LayoutDashboard, ListTodo, Settings, ChevronLeft, Package, 
    History, LogOut, Briefcase, Wrench, Home, ShieldCheck, UserCheck, Code 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { isLocalMode } from '../../local/mode';

export default function Sidebar({ isOpen, onClose, activeView, onViewChange }) {
    const { user, role, logout } = useAuthStore();
    const demoMode = isLocalMode();
    const isAdmin = role === 'admin';
    const isProgrammer = role === 'programmer';

    const getRoleBadge = () => {
        if (isAdmin) {
            return {
                label: 'Gerência / Admin',
                icon: ShieldCheck,
                classes: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
            };
        }
        if (isProgrammer) {
            return {
                label: 'Programador CAM',
                icon: Code,
                classes: 'bg-blue-500/10 text-blue-300 border-blue-500/20'
            };
        }
        return {
            label: 'Chão de Fábrica',
            icon: UserCheck,
            classes: 'bg-teal-500/10 text-teal-300 border-teal-500/20'
        };
    };

    const roleBadge = getRoleBadge();
    const RoleIcon = roleBadge.icon;

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-[100dvh] w-72 bg-slate-950 border-r border-slate-800/80 text-slate-50 shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Header do Menu */}
                <div className="p-4 flex justify-between items-center border-b border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-kanban-amber/20 border border-kanban-amber/40 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 70L40 50L55 60L85 25" stroke="#fbbf24" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M45 40L55 60" stroke="white" strokeWidth="14" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="font-extrabold text-sm tracking-wider uppercase text-white font-mono">Módulo CNC</span>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        aria-label="Fechar menu"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                </div>

                {/* Perfil Compacto do Usuário */}
                <div className="p-3.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 ${
                        isAdmin
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : isProgrammer
                                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                : 'bg-kanban-steel/15 text-kanban-steel border-kanban-steel/30'
                    }`}>
                        {user?.email ? user.email.charAt(0).toUpperCase() : (isAdmin ? 'A' : (isProgrammer ? 'P' : 'O'))}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate leading-tight">
                            {user?.email || (isAdmin ? 'Administrador' : (isProgrammer ? 'Programador CNC' : 'Operador Terminal'))}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${roleBadge.classes}`}>
                                <RoleIcon className="w-2.5 h-2.5" />
                                {roleBadge.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Lista de Navegação Categorizada */}
                <nav className="p-3 space-y-5 flex-1 overflow-y-auto custom-scrollbar">

                    {/* Grupo 1: Operação & Chão de Fábrica */}
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
                            onClick={() => { onViewChange('ferramental'); onClose(); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                                activeView === 'ferramental'
                                    ? 'bg-kanban-amber/10 border-kanban-amber/40 text-kanban-amber font-bold shadow-sm'
                                    : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200 font-semibold'
                            }`}
                        >
                            <Wrench className="h-4 w-4 shrink-0" />
                            <span>Ferramental & Magazines</span>
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

                    {/* Grupo 2: Gestão Executiva (Admin & Programador) */}
                    {(isAdmin || isProgrammer) && (
                        <div className="space-y-1 pt-3 border-t border-slate-800/60">
                            <div className="px-3 pb-2 text-[10px] font-extrabold text-kanban-amber uppercase tracking-[0.15em] flex items-center justify-between">
                                <span>Gestão & Estratégia</span>
                                <span className="text-[8px] bg-kanban-amber/20 text-kanban-amber px-1.5 py-0.5 rounded font-black">
                                    {isAdmin ? 'ADMIN' : 'CAM'}
                                </span>
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

                            {isAdmin && (
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
                            )}
                        </div>
                    )}
                </nav>

                {/* Footer and Logout */}
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 safe-area-bottom">
                    <button
                        type="button"
                        onClick={() => logout()}
                        className={`w-full flex items-center gap-2.5 justify-center p-3 rounded-lg transition-colors font-bold uppercase tracking-wider text-xs border active:scale-[0.98] ${
                            demoMode
                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 border-amber-500/20 hover:border-amber-500'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/20 hover:border-red-500'
                        }`}
                    >
                        {demoMode ? <Home className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                        {demoMode ? 'Sair do Modo Demo' : 'Sair do Sistema'}
                    </button>
                    <div className="text-[10px] text-center text-slate-600 mt-3 font-mono tracking-wider">
                        MÓDULO CNC &copy; 2026
                    </div>
                </div>
            </aside>
        </>
    );
}
