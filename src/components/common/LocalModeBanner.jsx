import React from 'react';
import { FlaskConical, RotateCcw, LogOut } from 'lucide-react';
import { isLocalMode } from '../../local/mode';
import { resetDb } from '../../local/localDatabase';
import { useAuthStore } from '../../store/useAuthStore';

export default function LocalModeBanner() {
    const logout = useAuthStore((s) => s.logout);

    if (!isLocalMode()) return null;

    const handleReset = () => {
        if (window.confirm('Restaurar dados de exemplo? Suas alterações locais serão perdidas.')) {
            resetDb();
            window.location.reload();
        }
    };

    const handleExit = () => {
        logout();
    };

    return (
        <div className="bg-[rgba(201,154,74,0.08)] border-b border-[#C99A4A]/25 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#C99A4A] font-semibold uppercase tracking-wider">
                <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                Modo Demonstração — dados salvos no navegador
            </div>
            <div className="flex items-center gap-3 ml-auto">
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-[#7B808F] hover:text-[#E7E9ED] font-medium transition-colors cursor-pointer"
                >
                    <RotateCcw className="w-3 h-3" />
                    Restaurar exemplos
                </button>
                <div className="w-px h-3.5 bg-[#333844]" />
                <button
                    onClick={handleExit}
                    className="flex items-center gap-1.5 text-[#C85558] hover:text-[#e06062] font-semibold transition-colors cursor-pointer"
                    title="Sair do modo demonstração e voltar à página inicial"
                >
                    <LogOut className="w-3 h-3" />
                    Sair do Demo
                </button>
            </div>
        </div>
    );
}
