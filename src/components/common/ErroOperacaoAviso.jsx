import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function ErroOperacaoAviso() {
    const erro = useAppStore((s) => s.erroOperacao);
    const aviso = useAppStore((s) => s.avisoOperacao);
    const sucesso = useAppStore((s) => s.sucessoOperacao);
    const limparErro = useAppStore((s) => s.limparErroOperacao);
    const limparAviso = useAppStore((s) => s.limparAvisoOperacao);
    const limparSucesso = useAppStore((s) => s.limparSucessoOperacao);

    useEffect(() => {
        if (!erro) return undefined;
        const t = setTimeout(limparErro, 8000);
        return () => clearTimeout(t);
    }, [erro, limparErro]);

    useEffect(() => {
        if (!aviso) return undefined;
        const t = setTimeout(limparAviso, 6000);
        return () => clearTimeout(t);
    }, [aviso, limparAviso]);

    useEffect(() => {
        if (!sucesso) return undefined;
        const t = setTimeout(limparSucesso, 4000);
        return () => clearTimeout(t);
    }, [sucesso, limparSucesso]);

    if (!erro && !aviso && !sucesso) return null;

    return (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-[200] max-w-md w-[calc(100%-2rem)] flex flex-col gap-2 pointer-events-none">
            {sucesso ? (
                <div
                    role="status"
                    className="pointer-events-auto flex items-start gap-2 rounded-[10px] border border-[#4A9D74]/40 bg-[#141A17] px-4 py-3 text-[13px] text-[#E7E9ED] shadow-xl backdrop-blur-sm"
                >
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#4A9D74]" />
                    <span className="flex-1 leading-snug">{sucesso}</span>
                    <button type="button" onClick={limparSucesso} aria-label="Fechar" className="text-[#7B808F] hover:text-[#E7E9ED] cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : null}
            {aviso ? (
                <div
                    role="status"
                    className="pointer-events-auto flex items-start gap-2 rounded-[10px] border border-[#C99A4A]/40 bg-[#1F1A14] px-4 py-3 text-[13px] text-[#E7E9ED] shadow-xl backdrop-blur-sm"
                >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#C99A4A]" />
                    <span className="flex-1 leading-snug">{aviso}</span>
                    <button type="button" onClick={limparAviso} aria-label="Fechar aviso" className="text-[#7B808F] hover:text-[#E7E9ED] cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : null}
            {erro ? (
                <div
                    role="alert"
                    className="pointer-events-auto flex items-start gap-2 rounded-[10px] border border-[#C85558]/40 bg-[#1F1416] px-4 py-3 text-[13px] text-[#E7E9ED] shadow-xl backdrop-blur-sm"
                >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#C85558]" />
                    <span className="flex-1 leading-snug">{erro}</span>
                    <button type="button" onClick={limparErro} aria-label="Fechar aviso" className="text-[#7B808F] hover:text-[#E7E9ED] cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : null}
        </div>
    );
}
