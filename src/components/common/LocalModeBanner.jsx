import React from 'react';
import { FlaskConical, RotateCcw, LogOut } from 'lucide-react';
import { isLocalMode } from '../../local/mode';
import { resetDb } from '../../local/localDatabase';
import { useAuthStore } from '../../store/useAuthStore';

export default function LocalModeBanner() {
    const logout = useAuthStore((s) => s.logout);

    if (!isLocalMode()) return null;

    const handleReset = () => {
        if (window.confirm('Voltar a fábrica de exemplo ao início? O que você mexeu neste navegador some.')) {
            resetDb();
            try {
                localStorage.removeItem('edm-lean-demo-guia-viu-boasvindas');
                localStorage.removeItem('edm-lean-demo-guia-recolhido');
            } catch { /* ignore */ }
            window.location.reload();
        }
    };

    return (
        <div className="bg-[rgba(201,154,74,0.1)] border-b border-[#C99A4A]/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-[#C99A4A]">
                <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                    <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                    Demonstração
                </span>
                <span className="text-[#9DA2AE] font-medium normal-case tracking-normal">
                    Precision Tools no seu navegador — PIN gestor 1234. O guia laranja no canto explica cada tela.
                </span>
            </div>
            <div className="flex items-center gap-3 ml-auto">
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-[#7B808F] hover:text-[#E7E9ED] font-medium transition-colors cursor-pointer"
                >
                    <RotateCcw className="w-3 h-3" />
                    Restaurar exemplos
                </button>
                <div className="w-px h-3.5 bg-[#333844]" />
                <button
                    type="button"
                    onClick={() => logout()}
                    className="flex items-center gap-1.5 text-[#C85558] hover:text-[#e06062] font-semibold transition-colors cursor-pointer"
                    title="Sair da demonstração e voltar à página inicial"
                >
                    <LogOut className="w-3 h-3" />
                    Sair da demo
                </button>
            </div>
        </div>
    );
}
