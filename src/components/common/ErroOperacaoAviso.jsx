import React, { useEffect } from 'react';
import { AlertCircle, Wifi, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function ErroOperacaoAviso() {
    const erro = useAppStore((s) => s.erroOperacao);
    const aviso = useAppStore((s) => s.avisoOperacao);
    const limparErro = useAppStore((s) => s.limparErroOperacao);
    const limparAviso = useAppStore((s) => s.limparAvisoOperacao);

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

    if (!erro && !aviso) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] max-w-md w-[calc(100%-2rem)] flex flex-col gap-2">
            {aviso ? (
                <div role="status" className="flex items-start gap-2 rounded-[8px] border border-[#C99A4A]/40 bg-[#1F1A14] px-4 py-3 text-[13px] text-[#E7E9ED] shadow-xl">
                    <Wifi className="w-4 h-4 mt-0.5 shrink-0 text-[#C99A4A]" />
                    <span className="flex-1">{aviso}</span>
                    <button type="button" onClick={limparAviso} aria-label="Fechar aviso" className="text-[#7B808F] hover:text-[#E7E9ED]">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : null}
            {erro ? (
                <div role="alert" className="flex items-start gap-2 rounded-[8px] border border-[#C85558]/40 bg-[#1F1416] px-4 py-3 text-[13px] text-[#E7E9ED] shadow-xl">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#C85558]" />
                    <span className="flex-1">{erro}</span>
                    <button type="button" onClick={limparErro} aria-label="Fechar aviso" className="text-[#7B808F] hover:text-[#E7E9ED]">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : null}
        </div>
    );
}
