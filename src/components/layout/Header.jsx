import React from 'react';
import { Activity, Menu, Package, Briefcase, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function Header({ onMenuToggle }) {
    const { nomeEmpresa, logout } = useAuthStore();

    return (
        <header className="bg-bg/92 backdrop-blur-md border-b border-edge sticky top-0 z-50 h-[52px] flex items-center px-4 md:px-7">
            <div className="w-full flex justify-between items-center">

                {/* Left side: Menu toggle + Logo */}
                <div className="flex items-center gap-5">
                    <button
                        onClick={onMenuToggle}
                        className="text-muted hover:text-core transition-colors flex items-center p-1"
                        aria-label="Menu"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect y="2" width="16" height="1.5" rx="0.75" fill="currentColor" />
                            <rect y="7.25" width="16" height="1.5" rx="0.75" fill="currentColor" />
                            <rect y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-2 font-mono text-[13px] font-bold tracking-[0.08em] uppercase text-core leading-none">
                        <div className="w-[26px] h-[26px] bg-kanban-amber rounded flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Trend Line - Dark for contrast */}
                                <path d="M20 70L40 50L55 60L85 25" stroke="#0a0c0f" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Spark / Wire - White for contrast */}
                                <path d="M45 40L55 60" stroke="white" strokeWidth="12" strokeLinecap="round" />
                            </svg>
                        </div>
                        EDM Lean
                    </div>
                </div>

                {/* Center text (hidden on small screens) */}
                <div className="hidden lg:block font-mono text-[10px] tracking-[0.2em] uppercase text-dim">
                    Visualize · Controle · Produza
                </div>

                {/* Right side: Empresa + Status + Quick Logout */}
                <div className="flex items-center gap-3 sm:gap-6">
                    {nomeEmpresa && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/40 rounded-full border border-slate-700/50 max-w-[100px] xs:max-w-[150px] sm:max-w-[300px]">
                            <Briefcase className="w-3 h-3 text-kanban-amber shrink-0" />
                            <span className="font-mono text-[9px] sm:text-[10px] text-slate-300 tracking-wider uppercase truncate">
                                {nomeEmpresa}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted tracking-[0.05em] uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-kanban-teal animate-pulse"></span>
                        <span className="hidden sm:inline">Online</span>
                    </div>

                    {/* Botão Sair visível no mobile (evita depender do menu lateral) */}
                    <button
                        onClick={() => logout()}
                        className="md:hidden p-2.5 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors touch-manipulation"
                        aria-label="Sair do sistema"
                        type="button"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
