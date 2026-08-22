import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { Mail, Lock, Zap, ShieldCheck, Factory, Eye, EyeOff, Database, KeyRound, ArrowLeft, FlaskConical } from 'lucide-react';

export default function Login({ initialMode = 'login', onBack }) {
    const { login, signUp, requestPasswordReset, updatePassword, isResettingPassword, enterLocalStudyMode } = useAuthStore();

    const [mode, setMode] = useState(isResettingPassword ? 'reset_password' : initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isResettingPassword) setMode('reset_password');
    }, [isResettingPassword]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setError('');
        setSuccessMsg('');

        if (mode === 'register') {
            const res = await signUp(email, password, companyName);
            if (res.success) {
                if (res.requiresEmailConfirmation) {
                    setSuccessMsg('Conta criada! Verifique seu e-mail para ativar o acesso.');
                    setMode('login');
                    setPassword('');
                } else {
                    setSuccessMsg('Conta criada com sucesso!');
                }
            } else {
                setError(res.error);
            }
        } else if (mode === 'login') {
            const res = await login(email, password);
            if (!res.success) {
                setError(res.error?.includes('Email not confirmed') ? 'E-mail não confirmado. Verifique sua caixa de entrada.' : res.error);
            }
        } else if (mode === 'forgot_password') {
            const res = await requestPasswordReset(email);
            if (res.success) {
                setSuccessMsg('Link de recuperação enviado! Verifique seu e-mail.');
                setMode('login');
                setPassword('');
            } else {
                setError(res.error);
            }
        } else if (mode === 'reset_password') {
            if (password !== confirmPassword) { setError('As senhas não coincidem.'); setIsProcessing(false); return; }
            if (password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); setIsProcessing(false); return; }
            const res = await updatePassword(password);
            if (res.success) {
                setSuccessMsg('Senha atualizada com sucesso!');
                useAuthStore.setState({ isResettingPassword: false });
                window.location.hash = '';
                setMode('login');
            } else {
                setError(res.error);
            }
        }
        setIsProcessing(false);
    };

    const getHeader = () => {
        switch (mode) {
            case 'register': return { title: 'Nova Fábrica', subtitle: 'Crie seu ambiente industrial' };
            case 'forgot_password': return { title: 'Recuperar Acesso', subtitle: 'Enviaremos um link seguro por e-mail' };
            case 'reset_password': return { title: 'Nova Senha', subtitle: 'Defina sua nova senha de acesso' };
            default: return { title: 'Bem-vindo', subtitle: 'Acesso restrito ao sistema' };
        }
    };
    const header = getHeader();

    const getButtonText = () => {
        switch (mode) {
            case 'register': return 'Criar minha conta industrial';
            case 'forgot_password': return 'Enviar link de recuperação';
            case 'reset_password': return 'Confirmar nova senha';
            default: return 'Entrar no Sistema';
        }
    };

    const inputCls = "w-full pl-11 pr-4 py-3 bg-[#111318] border border-[#262A33] rounded-[8px] focus:outline-none focus:border-[#D97D3D] text-[#E7E9ED] font-medium placeholder-[#565B68] transition-all text-sm";
    const labelCls = "block text-[10px] font-semibold text-[#565B68] uppercase tracking-[0.15em] mb-1.5";

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
            style={{
                backgroundImage: "url('/fundo-edm.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Overlay escuro alinhado ao design system */}
            <div className="absolute inset-0 bg-[#111318]/75 backdrop-blur-[2px]" />

            {/* Botão voltar */}
            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    className="fixed top-5 left-5 z-30 flex items-center gap-2 px-3.5 py-2 bg-[#181B22]/90 hover:bg-[#1F232B] border border-[#262A33] text-[#9DA2AE] hover:text-[#E7E9ED] rounded-[8px] text-xs font-medium transition-all cursor-pointer backdrop-blur-md"
                >
                    <ArrowLeft size={14} className="text-[#D97D3D]" />
                    <span>Voltar ao Site</span>
                </button>
            )}

            <div className="w-full max-w-[400px] z-10 flex flex-col gap-6">
                {/* BRANDING */}
                <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative mb-5">
                        <div className="w-20 h-20 bg-[#D97D3D] rounded-[18px] border border-[#D97D3D] shadow-[0_0_32px_rgba(217,125,61,0.3)] flex items-center justify-center relative group overflow-hidden transition-transform duration-500 hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <svg viewBox="0 0 100 100" className="w-12 h-12 relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 70L40 50L55 60L85 25" stroke="#0a0c0f" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="opacity-90" />
                                <path d="M45 40L55 60" stroke="white" strokeWidth="10" strokeLinecap="round" className="animate-pulse" />
                            </svg>
                        </div>
                        <div className="absolute -bottom-1.5 inset-x-0 mx-auto w-10 h-1 bg-[#D97D3D] blur-lg opacity-80"></div>
                    </div>

                    <h1 className="font-['Space_Grotesk'] text-3xl font-semibold text-[#E7E9ED] tracking-tight flex items-baseline gap-2">
                        EDM LEAN <span className="w-1.5 h-1.5 bg-[#D97D3D] rounded-full inline-block mb-1"></span>
                    </h1>
                    <p className="text-[#7B808F] text-sm mt-2 leading-relaxed">
                        Gestão Lean para Manufatura CNC & EDM.
                    </p>
                </div>

                {/* FORM CARD */}
                <div className="bg-[#181B22]/90 backdrop-blur-md border border-[#262A33] rounded-[14px] p-7 shadow-[0_24px_64px_rgba(0,0,0,0.6)] relative animate-in fade-in slide-in-from-bottom-2 duration-500">

                    {/* Tab selector Login/Criar */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-semibold text-[#E7E9ED]">{header.title}</h2>
                            <p className="text-[10px] font-medium text-[#565B68] uppercase tracking-widest mt-0.5">{header.subtitle}</p>
                        </div>

                        {mode === 'login' || mode === 'register' ? (
                            <div className="flex bg-[#111318] p-1 rounded-[7px] border border-[#262A33] gap-1">
                                <button
                                    type="button"
                                    onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                                    className={`px-3 py-1.5 rounded-[5px] text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${mode === 'login' ? 'bg-[#D97D3D] text-[#111318]' : 'text-[#565B68] hover:text-[#9DA2AE]'}`}
                                >
                                    Login
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                                    className={`px-3 py-1.5 rounded-[5px] text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${mode === 'register' ? 'bg-[#D97D3D] text-[#111318]' : 'text-[#565B68] hover:text-[#9DA2AE]'}`}
                                >
                                    Criar
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('login'); setError(''); setSuccessMsg('');
                                    if (mode === 'reset_password') useAuthStore.setState({ isResettingPassword: false });
                                }}
                                className="px-3 py-1.5 bg-[#111318] rounded-[7px] border border-[#262A33] text-[10px] font-semibold text-[#7B808F] uppercase tracking-wider hover:text-[#E7E9ED] transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <ArrowLeft className="w-3 h-3" /> Voltar
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Modo demo */}
                        {isLocalMode() && (
                            <div className="bg-[rgba(74,157,116,0.08)] border border-[#4A9D74]/30 p-3.5 rounded-[8px] text-center space-y-2">
                                <p className="text-xs font-medium text-[#4A9D74]">
                                    Modo local ativo — acesse sem senha
                                </p>
                                <button
                                    type="button"
                                    onClick={() => enterLocalStudyMode('admin')}
                                    className="w-full py-2.5 bg-[#4A9D74] hover:bg-[#3d8763] text-[#111318] font-semibold rounded-[7px] text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <FlaskConical className="w-3.5 h-3.5" />
                                    <span>Explorar Modo Demonstração</span>
                                </button>
                            </div>
                        )}

                        {/* Erro */}
                        {error && (
                            <div className="bg-[rgba(200,85,88,0.1)] border border-[#C85558]/30 text-[#C85558] p-3 rounded-[7px] text-xs font-medium text-center">
                                {error}
                            </div>
                        )}

                        {/* Sucesso */}
                        {successMsg && (
                            <div className="bg-[rgba(74,157,116,0.1)] border border-[#4A9D74]/30 text-[#4A9D74] p-3 rounded-[7px] text-xs font-medium text-center">
                                {successMsg}
                            </div>
                        )}

                        <div className="space-y-3">
                            {/* Nome da empresa (registro) */}
                            {mode === 'register' && (
                                <div>
                                    <label className={labelCls}>Fábrica / Empresa</label>
                                    <div className="relative">
                                        <Factory className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#565B68]" />
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={e => setCompanyName(e.target.value)}
                                            placeholder="Nome da sua fábrica"
                                            className={inputCls}
                                            required={mode === 'register'}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* E-mail */}
                            {(mode === 'login' || mode === 'register' || mode === 'forgot_password') && (
                                <div>
                                    <label className={labelCls}>E-mail</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#565B68]" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="nome@empresa.com"
                                            className={inputCls}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Senha */}
                            {(mode === 'login' || mode === 'register' || mode === 'reset_password') && (
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className={labelCls.replace('mb-1.5', '')}>
                                            {mode === 'reset_password' ? 'Nova Senha' : 'Senha de Acesso'}
                                        </label>
                                        {mode === 'login' && (
                                            <button
                                                type="button"
                                                onClick={() => { setMode('forgot_password'); setError(''); setSuccessMsg(''); }}
                                                className="text-[10px] font-medium text-[#D97D3D]/70 hover:text-[#D97D3D] uppercase tracking-wider transition-colors cursor-pointer"
                                            >
                                                Esqueci
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#565B68]" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className={inputCls + ' pr-11'}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#565B68] hover:text-[#D97D3D] transition-colors cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Confirmar senha (reset) */}
                            {mode === 'reset_password' && (
                                <div>
                                    <label className={labelCls}>Confirmar Nova Senha</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#565B68]" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className={inputCls}
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className={`w-full h-[46px] bg-[#D97D3D] hover:bg-[#c46d32] text-[#111318] font-semibold px-6 rounded-[8px] transition-all shadow-[0_4px_20px_rgba(217,125,61,0.25)] hover:shadow-[0_4px_28px_rgba(217,125,61,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2.5 group relative overflow-hidden text-sm tracking-wide ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-600 ease-in-out skew-x-[-20deg]"></div>
                            {isProcessing ? (
                                <svg className="animate-spin h-4 w-4 text-[#111318]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <>
                                    <span className="uppercase tracking-wider text-xs">{getButtonText()}</span>
                                    {mode === 'login' && <Zap className="w-3.5 h-3.5 fill-[#111318] group-hover:scale-110 transition-transform" />}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Demo extra button */}
                {isLocalMode() && mode === 'login' && (
                    <button
                        type="button"
                        onClick={() => enterLocalStudyMode('admin')}
                        className="w-full py-3 bg-[rgba(74,157,116,0.12)] hover:bg-[rgba(74,157,116,0.2)] border border-[#4A9D74]/30 text-[#4A9D74] font-medium rounded-[8px] text-xs transition-all cursor-pointer"
                    >
                        Entrar no Modo Demonstração Interativo (Sem Login)
                    </button>
                )}

                {/* Footer */}
                <div className="flex flex-col items-center gap-3 opacity-40 hover:opacity-70 transition-opacity">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#4A9D74]" />
                            <span className="text-[9px] font-medium text-[#565B68] uppercase tracking-widest">TLS 1.3 Secure</span>
                        </div>
                        <div className="w-px h-3 bg-[#262A33]"></div>
                        <div className="flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-[#9DA2AE]" />
                            <span className="text-[9px] font-medium text-[#565B68] uppercase tracking-widest">Cloud Powered</span>
                        </div>
                    </div>
                    <p className="text-[9px] font-medium text-[#565B68] uppercase tracking-[0.2em]">
                        © 2026 EDM Lean • Precision Software Solutions
                    </p>
                </div>
            </div>
        </div>
    );
}

// SVG fallback Database icon
function Database(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5V19A9 3 0 0 0 21 19V5" />
            <path d="M3 12A9 3 0 0 0 21 12" />
        </svg>
    );
}
