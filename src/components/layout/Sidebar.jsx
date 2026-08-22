import React from 'react';
import { 
    LayoutDashboard, ListTodo, Settings, ChevronLeft, Package, 
    History, LogOut, Briefcase, Wrench, Home, ShieldCheck, Code 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { isLocalMode } from '../../local/mode';

export default function Sidebar({ isOpen, onClose, activeView, onViewChange }) {
    const { user, role, logout } = useAuthStore();
    const demoMode = isLocalMode();
    const isAdmin = role === 'admin';

    const getRoleBadge = () => {
        if (isAdmin) {
            return {
                label: 'Gerência',
                icon: ShieldCheck,
                classes: 'bg-[#1F232B] text-[#E7E9ED] border-[#333844]'
            };
        }
        return {
            label: 'Programador',
            icon: Code,
            classes: 'bg-[#1F232B] text-[#9DA2AE] border-[#333844]'
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
                className={`fixed top-0 left-0 h-[100dvh] w-72 bg-[#111318] border-r border-[#262A33] text-[#E7E9ED] shadow-2xl z-[60] transform transition-transform duration-250 ease-in-out flex flex-col ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Header do Menu */}
                <div className="p-4 flex justify-between items-center border-b border-[#262A33] bg-[#181B22]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-[26px] h-[26px] rounded-[6px] bg-[#D97D3D] flex items-center justify-center font-['Space_Grotesk'] font-bold text-[#111318] text-[13px] leading-none select-none">
                            E
                        </div>
                        <div className="flex flex-col">
                            <span className="font-['Space_Grotesk'] font-semibold text-[13.5px] text-[#E7E9ED] tracking-[0.1px] leading-tight">
                                EDM Lean
                            </span>
                            <span className="text-[9px] text-[#565B68] font-medium tracking-[1.2px] uppercase">
                                SHOP FLOOR OS
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-[#1F232B] rounded-[6px] text-[#7B808F] hover:text-[#E7E9ED] transition-colors cursor-pointer"
                        aria-label="Fechar menu"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                </div>

                {/* Perfil Compacto do Usuário */}
                <div className="p-3.5 bg-[#181B22]/60 border-b border-[#262A33] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[7px] bg-[#1F232B] border border-[#333844] flex items-center justify-center font-semibold text-xs text-[#E7E9ED] shrink-0 font-['Space_Grotesk']">
                        {user?.email ? user.email.charAt(0).toUpperCase() : (isAdmin ? 'G' : 'P')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#E7E9ED] truncate leading-tight">
                            {user?.email || (isAdmin ? 'Gerente' : 'Programador')}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[5px] border ${roleBadge.classes}`}>
                                <RoleIcon className="w-2.5 h-2.5" />
                                {roleBadge.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Lista de Navegação Categorizada */}
                <nav className="p-3 space-y-4 flex-1 overflow-y-auto custom-scrollbar">

                    {/* Grupo 1: Operação & Produção */}
                    <div className="space-y-0.5">
                        <div className="px-3 pb-2 text-[10px] font-semibold text-[#565B68] uppercase tracking-[0.15em]">
                            Operação & Produção
                        </div>

                        {isAdmin && (
                        <button
                            onClick={() => { onViewChange('carteira'); onClose(); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-xs font-medium transition-all border cursor-pointer ${
                                activeView === 'carteira'
                                    ? 'bg-[#1F232B] border-[#333844] text-[#E7E9ED] font-semibold'
                                    : 'border-transparent text-[#7B808F] hover:bg-[#181B22] hover:text-[#E7E9ED]'
                            }`}
                        >
                            <Home className="h-4 w-4 shrink-0 text-[#7B808F]" />
                            <span>Carteira de O.S.</span>
                        </button>
                        )}

                        <button
                            onClick={() => { onViewChange('kanban'); onClose(); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-xs font-medium transition-all border cursor-pointer ${
                                activeView === 'kanban'
                                    ? 'bg-[#1F232B] border-[#333844] text-[#E7E9ED] font-semibold'
                                    : 'border-transparent text-[#7B808F] hover:bg-[#181B22] hover:text-[#E7E9ED]'
                            }`}
                        >
                            <ListTodo className="h-4 w-4 shrink-0 text-[#7B808F]" />
                            <span>Kanban de Produção</span>
                        </button>

                        <button
                            onClick={() => { onViewChange('registros'); onClose(); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-xs font-medium transition-all border cursor-pointer ${
                                activeView === 'registros'
                                    ? 'bg-[#1F232B] border-[#333844] text-[#E7E9ED] font-semibold'
                                    : 'border-transparent text-[#7B808F] hover:bg-[#181B22] hover:text-[#E7E9ED]'
                            }`}
                        >
                            <History className="h-4 w-4 shrink-0 text-[#7B808F]" />
                            <span>Histórico de Registros</span>
                        </button>

                        <button
                            onClick={() => { onViewChange('estoque'); onClose(); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-xs font-medium transition-all border cursor-pointer ${
                                activeView === 'estoque'
                                    ? 'bg-[#1F232B] border-[#333844] text-[#E7E9ED] font-semibold'
                                    : 'border-transparent text-[#7B808F] hover:bg-[#181B22] hover:text-[#E7E9ED]'
                            }`}
                        >
                            <Package className="h-4 w-4 shrink-0 text-[#7B808F]" />
                            <span>Estoque & Insumos</span>
                        </button>

                        <button
                            onClick={() => { onViewChange('ferramental'); onClose(); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-xs font-medium transition-all border cursor-pointer ${
                                activeView === 'ferramental'
                                    ? 'bg-[#1F232B] border-[#333844] text-[#E7E9ED] font-semibold'
                                    : 'border-transparent text-[#7B808F] hover:bg-[#181B22] hover:text-[#E7E9ED]'
                            }`}
                        >
                            <Wrench className="h-4 w-4 shrink-0 text-[#7B808F]" />
                            <span>Ferramental & Magazines</span>
                        </button>

                        {isAdmin && (
                        <button
                            onClick={() => { onViewChange('clientes'); onClose(); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-xs font-medium transition-all border cursor-pointer ${
                                activeView === 'clientes'
                                    ? 'bg-[#1F232B] border-[#333844] text-[#E7E9ED] font-semibold'
                                    : 'border-transparent text-[#7B808F] hover:bg-[#181B22] hover:text-[#E7E9ED]'
                            }`}
                        >
                            <Briefcase className="h-4 w-4 shrink-0 text-[#7B808F]" />
                            <span>Clientes</span>
                        </button>
                        )}
                    </div>

                    {/* Grupo 2: Gestão Executiva */}
                    {isAdmin && (
                        <div className="space-y-0.5 pt-3 border-t border-[#262A33]">
                            <div className="px-3 pb-2 text-[10px] font-semibold text-[#565B68] uppercase tracking-[0.15em] flex items-center justify-between">
                                <span>Gestão & Estratégia</span>
                                <span className="text-[8px] bg-[#1F232B] text-[#9DA2AE] px-1.5 py-0.5 rounded-[4px] font-mono">
                                    {isAdmin ? 'ADMIN' : 'CAM'}
                                </span>
                            </div>

                            <button
                                onClick={() => { onViewChange('dashboard'); onClose(); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-xs font-medium transition-all border cursor-pointer ${
                                    activeView === 'dashboard'
                                        ? 'bg-[#1F232B] border-[#333844] text-[#E7E9ED] font-semibold'
                                        : 'border-transparent text-[#7B808F] hover:bg-[#181B22] hover:text-[#E7E9ED]'
                                }`}
                            >
                                <LayoutDashboard className="h-4 w-4 shrink-0 text-[#7B808F]" />
                                <span>Dashboard Executivo</span>
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => { onViewChange('configuracoes'); onClose(); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-xs font-medium transition-all border cursor-pointer ${
                                        activeView === 'configuracoes'
                                            ? 'bg-[#1F232B] border-[#333844] text-[#E7E9ED] font-semibold'
                                            : 'border-transparent text-[#7B808F] hover:bg-[#181B22] hover:text-[#E7E9ED]'
                                    }`}
                                >
                                    <Settings className="h-4 w-4 shrink-0 text-[#7B808F]" />
                                    <span>Configurações</span>
                                </button>
                            )}
                        </div>
                    )}
                </nav>

                {/* Footer and Logout */}
                <div className="p-3 border-t border-[#262A33] bg-[#181B22] safe-area-bottom">
                    <button
                        type="button"
                        onClick={() => logout()}
                        className="w-full flex items-center gap-2 justify-center p-2.5 rounded-[7px] transition-colors font-medium text-xs border border-[#333844] bg-[#111318] text-[#7B808F] hover:text-[#C85558] hover:border-[#C85558]/40 active:scale-[0.98] cursor-pointer"
                    >
                        {demoMode ? <Home className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                        {demoMode ? 'Sair do Modo Demo' : 'Sair do Sistema'}
                    </button>
                    <div className="text-[10px] text-center text-[#565B68] mt-2.5 font-mono">
                        EDM LEAN &copy; 2026
                    </div>
                </div>
            </aside>
        </>
    );
}
