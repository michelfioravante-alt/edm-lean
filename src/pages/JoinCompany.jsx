import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Building2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function JoinCompany({ inviteCode }) {
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [pin, setPin] = useState('');

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                // 1. Busca a empresa via RPC segura (não expõe a tabela inteira)
                const { data, error } = await supabase.rpc('buscar_empresa_por_codigo', {
                    p_codigo: inviteCode
                });

                if (error || !data || data.length === 0) {
                    throw new Error('Código de convite inválido ou expirado.');
                }

                setCompany(data[0]);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (inviteCode) fetchCompany();
    }, [inviteCode]);

    // Quando o acesso é liberado, redireciona automaticamente para a aplicação principal
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                window.location.href = '/';
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (pin.length < 4) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { loginComoOperador } = useAuthStore.getState();
            const result = await loginComoOperador(inviteCode, pin);

            if (!result.success) {
                throw new Error(result.error);
            }

            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Erro ao realizar login de terminal.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#111318] flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-kanban-amber/20 border-t-kanban-amber rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#111318] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#181B22] via-[#111318] to-[#111318]">
            {/* Background Decoration */}
            <div className="absolute top-20 right-10 w-64 h-64 bg-kanban-amber/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-20 left-10 w-64 h-64 bg-[#7B808F]/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-16 h-16 bg-kanban-amber p-3 rounded-2xl shadow-2xl shadow-amber-500/20 mb-4 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 70L40 50L55 60L85 25" stroke="#0a0c0f" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M45 40L55 60" stroke="white" strokeWidth="12" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-white tracking-tight uppercase">EDM <span className="text-kanban-amber">Lean</span></h1>
                </div>

                {success ? (
                    <div className="bg-[#181B22]/80 backdrop-blur-xl border border-[#262A33] p-8 rounded-[14px] text-center shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-kanban-green/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-kanban-green/30">
                            <CheckCircle2 className="w-10 h-10 text-kanban-green" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Acesso liberado</h2>
                        <p className="text-[#7B808F] mb-4 leading-relaxed">
                            Este dispositivo agora está conectado à fábrica <strong>{company?.nome_fantasia}</strong>.
                        </p>
                        <p className="text-sm text-[#E7E9ED] mb-6">
                            Você será redirecionado automaticamente para o Kanban desta unidade.
                        </p>
                        <p className="text-[11px] text-[#565B68]">
                            Se nada acontecer em alguns segundos, <button
                                onClick={() => window.location.href = '/'}
                                className="underline text-kanban-amber font-bold"
                            >
                                toque aqui para abrir o sistema
                            </button>.
                        </p>
                    </div>
                ) : (
                    <div className="bg-[#181B22]/70 backdrop-blur-2xl border border-white/10 p-8 rounded-[14px] shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-3 mb-8 bg-[#111318]/80 p-4 rounded-2xl border border-[#262A33]">
                            <div className="w-10 h-10 bg-kanban-amber/20 rounded-xl flex items-center justify-center border border-kanban-amber/30">
                                <Building2 className="w-5 h-5 text-kanban-amber" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-[#565B68] uppercase tracking-widest leading-none mb-1">Você está entrando em</p>
                                <p className="text-lg font-bold text-white leading-none">{company?.nome_fantasia}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 bg-[rgba(200,85,88,0.1)] border border-[#C85558]/20 text-[#C85558] p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-pulse">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleJoin} className="space-y-8">
                            <div className="text-center">
                                <p className="text-sm text-[#7B808F] mb-6">Insira o PIN de segurança para liberar o acesso ao terminal de produção.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#7B808F] uppercase tracking-[0.2em] mb-3 ml-1">PIN de Segurança (4 dígitos)</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        maxLength={4}
                                        required
                                        placeholder="Solicite ao seu gestor"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-[#111318]/80 border border-[#262A33] text-white rounded-2xl py-5 px-6 focus:ring-4 focus:ring-kanban-amber/20 focus:border-kanban-amber transition-all outline-none text-lg font-semibold tracking-[1em] placeholder:text-[#565B68] group-hover:border-[#333844] placeholder:tracking-normal"
                                    />
                                    <CheckCircle2 className={`absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors ${pin.length === 4 ? 'text-kanban-amber' : 'text-[#565B68]'}`} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || pin.length < 4}
                                className="w-full bg-kanban-amber hover:bg-[#c46d32] disabled:opacity-50 disabled:cursor-not-allowed text-[#111318] font-semibold text-lg py-5 rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-4 border-[#111318]/20 border-t-[#111318] rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>LIBERAR ACESSO</span>
                                        <ShieldCheck className="w-6 h-6" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-[#565B68] text-xs font-medium">
                            Este acesso permite gerenciar o Kanban e visualizar registros históricos da unidade.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
