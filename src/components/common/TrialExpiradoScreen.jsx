import React from 'react';
import { BarChart3, LogOut, MessageCircle } from 'lucide-react';

const WHATSAPP_COMERCIAL = 'https://wa.me/5551982710396?text=Olá! Meu período de teste do EDM Lean expirou para a empresa e gostaria de reativar.';

export default function TrialExpiradoScreen({ nomeEmpresa, onLogout }) {
    return (
        <div className="min-h-screen bg-[#111318] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans select-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-kanban-amber/5 via-transparent to-red-500/5 opacity-40 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[rgba(200,85,88,0.1)] rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-[480px] z-10 backdrop-blur-xl bg-[#181B22]/60 border border-[#262A33]/60 rounded-[14px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center flex flex-col gap-6 animate-in zoom-in-95 duration-500">
                <div className="relative mx-auto mb-2">
                    <div className="w-20 h-20 bg-[rgba(200,85,88,0.1)] border border-[#C85558]/20 text-[#C85558] rounded-[14px] flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                        <BarChart3 className="w-9 h-9 animate-pulse" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white tracking-tight">Período de Testes Expirado</h2>

                <p className="text-[#7B808F] text-sm leading-relaxed">
                    Seu período de avaliação gratuita de 30 dias do <strong className="text-white">EDM Lean</strong> para a empresa <strong className="text-white">{nomeEmpresa}</strong> chegou ao fim. Esperamos que o painel Kanban e os relatórios OEE tenham ajudado a otimizar a sua produção!
                </p>

                <div className="bg-[#111318]/80 border border-[#262A33] rounded-2xl p-5 text-left flex flex-col gap-3">
                    <span className="text-[10px] font-semibold text-[#565B68] uppercase tracking-widest">Como reativar o acesso?</span>
                    <p className="text-xs text-[#7B808F] leading-relaxed">
                        Para contratar o plano Pro ou reativar o seu acesso de teste, entre em contato diretamente com o responsável comercial/desenvolvedor:
                    </p>
                    <a
                        href={WHATSAPP_COMERCIAL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#4A9D74] hover:bg-[#3d8763] text-white font-bold rounded-xl text-sm transition-all shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span>Falar com o Comercial</span>
                    </a>
                </div>

                <button
                    onClick={onLogout}
                    className="text-xs font-bold text-[#565B68] hover:text-[#E7E9ED] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 w-fit mx-auto cursor-pointer"
                >
                    <LogOut className="w-3 h-3" />
                    Sair da Conta
                </button>
            </div>
        </div>
    );
}
