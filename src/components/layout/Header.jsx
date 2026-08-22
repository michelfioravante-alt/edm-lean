import React, { useState } from 'react';
import { Briefcase, LogOut, ShieldCheck, Cpu, Zap, Menu } from 'lucide-react';
import { isLocalMode } from '../../local/mode';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import ManagerPinModal from '../common/ManagerPinModal';

export default function Header({ onMenuToggle }) {
    const { nomeEmpresa, logout, role, setorPadrao, enterLocalStudyMode, setSetorPadrao } = useAuthStore();
    const demoMode = isLocalMode();
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    const entrarProgramador = (setor) => {
        if (role === 'programmer') {
            setSetorPadrao(setor);
            useAppStore.getState().setActiveSector(setor);
            return;
        }
        enterLocalStudyMode('programmer', setor);
    };
        if (role === 'admin' && setorPadrao === 'TODOS') return;
        setIsPinModalOpen(true);
    };

    const getRoleLabel = () => (role === 'admin' ? 'Gerente' : 'Programador');

    return (
        <header className="bg-[#111318] border-b border-[#262A33] sticky top-0 z-50 h-[52px] flex items-center px-4 md:px-6">
            <div className="w-full flex justify-between items-center">

                {/* Left side: Menu toggle + Logo Flat */}
                <div className="flex items-center gap-3 md:gap-4">
                    <button
                        onClick={onMenuToggle}
                        className="text-[#7B808F] hover:text-[#E7E9ED] transition-colors p-1.5 rounded-md hover:bg-[#1F232B] cursor-pointer"
                        aria-label="Menu"
                    >
                        <Menu className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2.5">
                        <div className="w-[26px] h-[26px] rounded-[6px] bg-[#D97D3D] flex items-center justify-center font-['Space_Grotesk'] font-bold text-[#111318] text-[13px] leading-none select-none shrink-0">
                            E
                        </div>
                        <div className="flex flex-col">
                            <span className="font-['Space_Grotesk'] font-semibold text-[14px] text-[#E7E9ED] tracking-[0.1px] leading-tight">
                                EDM Lean
                            </span>
                            <span className="text-[9.5px] text-[#565B68] font-medium tracking-[1.2px] uppercase leading-none mt-0.5">
                                SHOP FLOOR OS
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center text (desktop) */}
                <div className="hidden lg:block font-mono text-[10px] tracking-[0.2em] uppercase text-[#565B68]">
                    VISUALIZE · CONTROLE · PRODUZA
                </div>

                {/* Right side: Empresa + Role + Quick selector in Demo + Logout */}
                <div className="flex items-center gap-2.5 sm:gap-4">
                    {nomeEmpresa && (
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#181B22] rounded-[6px] border border-[#262A33] max-w-[200px]">
                            <Briefcase className="w-3 h-3 text-[#7B808F] shrink-0" />
                            <span className="font-mono text-[10px] text-[#9DA2AE] tracking-wider uppercase truncate">
                                {nomeEmpresa}
                            </span>
                        </div>
                    )}

                    {/* Role Pill - Clean industrial outline */}
                    <div className="flex items-center gap-1.5 text-[11.5px] text-[#7B808F] font-medium border border-[#333844] px-2.5 py-1 rounded-[7px] bg-[#181B22]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#7B808F]" />
                        <span>{getRoleLabel()}</span>
                    </div>

                    {/* Seletor rápido de Perfil / Setor — Apenas Modo Demonstração */}
                    {demoMode && (
                        <>
                            {/* Desktop Button Set */}
                            <div className="hidden xl:flex items-center gap-1 bg-[#181B22] p-1 rounded-[7px] border border-[#262A33] text-[11px] font-medium">
                                <button
                                    type="button"
                                    onClick={handleGerenteClick}
                                    className={`px-2 py-0.5 rounded-[5px] transition-colors cursor-pointer flex items-center gap-1 ${role === 'admin' && setorPadrao === 'TODOS' ? 'bg-[#1F232B] text-[#E7E9ED] border border-[#333844] font-semibold' : 'text-[#7B808F] hover:text-[#E7E9ED]'}`}
                                    title="Visão de Gerência (PIN Master)"
                                >
                                    <ShieldCheck className="w-3 h-3" /> Gerente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => entrarProgramador('CNC')}
                                    className={`px-2 py-0.5 rounded-[5px] transition-colors cursor-pointer flex items-center gap-1 ${role !== 'admin' && setorPadrao === 'CNC' ? 'bg-[#1F232B] text-[#E7E9ED] border border-[#333844] font-semibold' : 'text-[#7B808F] hover:text-[#E7E9ED]'}`}
                                    title="Programador CNC"
                                >
                                    <Cpu className="w-3 h-3" /> CNC
                                </button>
                                <button
                                    type="button"
                                    onClick={() => entrarProgramador('EDM_FIO')}
                                    className={`px-2 py-0.5 rounded-[5px] transition-colors cursor-pointer flex items-center gap-1 ${role !== 'admin' && setorPadrao === 'EDM_FIO' ? 'bg-[#1F232B] text-[#E7E9ED] border border-[#333844] font-semibold' : 'text-[#7B808F] hover:text-[#E7E9ED]'}`}
                                    title="Programador EDM Fio"
                                >
                                    <Zap className="w-3 h-3" /> EDM Fio
                                </button>
                            </div>
                        </>
                    )}

                    <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-[#565B68] tracking-[0.05em] uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4A9D74]"></span>
                        <span>ONLINE</span>
                    </div>

                    {/* Botão Sair no mobile */}
                    <button
                        onClick={() => logout()}
                        className="md:hidden p-2 text-[#7B808F] hover:text-[#C85558] hover:bg-[#C85558]/10 rounded-[7px] transition-colors cursor-pointer"
                        aria-label="Sair"
                        type="button"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <ManagerPinModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={() => enterLocalStudyMode('admin', 'TODOS')}
            />
        </header>
    );
}
