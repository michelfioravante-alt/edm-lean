import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, Factory, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';

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
                    setSuccessMsg('Conta criada. Confirme o e-mail para ativar o acesso.');
                    setMode('login');
                    setPassword('');
                } else {
                    setSuccessMsg('Conta criada.');
                }
            } else {
                setError(res.error);
            }
        } else if (mode === 'login') {
            const res = await login(email, password);
            if (!res.success) {
                setError(res.error?.includes('Email not confirmed') ? 'E-mail não confirmado. Verifique a caixa de entrada.' : res.error);
            }
        } else if (mode === 'forgot_password') {
            const res = await requestPasswordReset(email);
            if (res.success) {
                setSuccessMsg('Enviamos um link de recuperação para o e-mail.');
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
                setSuccessMsg('Senha atualizada.');
                useAuthStore.setState({ isResettingPassword: false });
                window.location.hash = '';
                setMode('login');
            } else {
                setError(res.error);
            }
        }
        setIsProcessing(false);
    };

    const titles = {
        register: { title: 'Criar conta', subtitle: 'Nome da oficina e acesso do gestor' },
        forgot_password: { title: 'Recuperar acesso', subtitle: 'Enviamos um link por e-mail' },
        reset_password: { title: 'Nova senha', subtitle: 'Defina a senha de acesso' },
        login: { title: 'Entrar', subtitle: 'Acesso à oficina' },
    };
    const header = titles[mode] || titles.login;

    const buttonText = {
        register: 'Criar conta',
        forgot_password: 'Enviar link',
        reset_password: 'Guardar senha',
        login: 'Entrar',
    }[mode] || 'Entrar';

    const inputCls = 'w-full pl-10 pr-4 py-2.5 bg-[#111318] border border-[#262A33] rounded-md focus:outline-none focus:border-[#D97D3D]/70 text-[#E7E9ED] placeholder-[#565B68] text-sm';
    const labelCls = 'block text-[11px] text-[#7B808F] mb-1.5';

    return (
        <div className="relative flex min-h-screen flex-col bg-[#111318]">
            <header className="relative z-20 border-b border-[#262A33]/80">
                <div className="mx-auto flex h-[72px] max-w-[1080px] items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#333844] bg-[#181B22] text-[11px] font-semibold tracking-wide text-[#D97D3D]">
                            EL
                        </span>
                        <span className="font-['Space_Grotesk'] text-[15px] tracking-tight text-[#E7E9ED]">EDM Lean</span>
                    </div>
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center gap-1.5 text-[13px] text-[#7B808F] hover:text-[#E7E9ED]"
                        >
                            <ArrowLeft size={14} />
                            Voltar
                        </button>
                    )}
                </div>
            </header>

            <div className="flex flex-1 items-center justify-center px-4 py-12">
                <div className="w-full max-w-[400px] rounded-xl border border-[#262A33] bg-[#181B22] p-8">
                    <div className="mb-7 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="font-['Space_Grotesk'] text-xl font-medium text-[#E7E9ED]">{header.title}</h1>
                            <p className="mt-1 text-[13px] text-[#7B808F]">{header.subtitle}</p>
                        </div>
                        {(mode === 'login' || mode === 'register') && (
                            <div className="flex rounded-md border border-[#262A33] p-0.5 text-[12px]">
                                <button
                                    type="button"
                                    onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                                    className={`rounded px-2.5 py-1 ${mode === 'login' ? 'bg-[#1F232B] text-[#E7E9ED]' : 'text-[#7B808F]'}`}
                                >
                                    Entrar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                                    className={`rounded px-2.5 py-1 ${mode === 'register' ? 'bg-[#1F232B] text-[#E7E9ED]' : 'text-[#7B808F]'}`}
                                >
                                    Criar
                                </button>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'login' && (
                            <div className="space-y-2 border-b border-[#262A33] pb-5">
                                <p className="text-[12px] text-[#7B808F]">Fábrica de exemplo — sem conta</p>
                                <button
                                    type="button"
                                    onClick={() => enterLocalStudyMode('admin')}
                                    className="w-full rounded-md border border-[#333844] py-2 text-[13px] text-[#E7E9ED] hover:border-[#D97D3D]/50"
                                >
                                    Entrar como gestor
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => enterLocalStudyMode('programmer', 'CNC')}
                                        className="rounded-md py-2 text-[12px] text-[#9DA2AE] hover:text-[#E7E9ED]"
                                    >
                                        Programador CNC
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => enterLocalStudyMode('programmer', 'EDM_FIO')}
                                        className="rounded-md py-2 text-[12px] text-[#9DA2AE] hover:text-[#E7E9ED]"
                                    >
                                        Programador eletrofio
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="rounded-md border border-[#C85558]/30 bg-[rgba(200,85,88,0.08)] px-3 py-2 text-[12px] text-[#C85558]">{error}</p>
                        )}
                        {successMsg && (
                            <p className="rounded-md border border-[#4A9D74]/30 bg-[rgba(74,157,116,0.08)] px-3 py-2 text-[12px] text-[#4A9D74]">{successMsg}</p>
                        )}

                        {mode === 'register' && (
                            <div>
                                <label className={labelCls}>Oficina</label>
                                <div className="relative">
                                    <Factory className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#565B68]" />
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Nome da matrizaria"
                                        className={inputCls}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {(mode === 'login' || mode === 'register' || mode === 'forgot_password') && (
                            <div>
                                <label className={labelCls}>E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#565B68]" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="nome@oficina.com"
                                        className={inputCls}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {(mode === 'login' || mode === 'register' || mode === 'reset_password') && (
                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label className="text-[11px] text-[#7B808F]">{mode === 'reset_password' ? 'Nova senha' : 'Senha'}</label>
                                    {mode === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => { setMode('forgot_password'); setError(''); setSuccessMsg(''); }}
                                            className="text-[11px] text-[#7B808F] hover:text-[#D97D3D]"
                                        >
                                            Esqueci
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#565B68]" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={`${inputCls} pr-10`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565B68] hover:text-[#9DA2AE]"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {mode === 'reset_password' && (
                            <div>
                                <label className={labelCls}>Confirmar senha</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#565B68]" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={inputCls}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {(mode === 'forgot_password' || mode === 'reset_password') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('login');
                                    setError('');
                                    setSuccessMsg('');
                                    if (mode === 'reset_password') useAuthStore.setState({ isResettingPassword: false });
                                }}
                                className="text-[12px] text-[#7B808F] hover:text-[#E7E9ED]"
                            >
                                Voltar ao acesso
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className={`mt-2 h-11 w-full rounded-md bg-[#D97D3D] text-[13px] font-medium text-[#111318] hover:bg-[#c46d32] ${isProcessing ? 'opacity-60' : ''}`}
                        >
                            {isProcessing ? 'Aguarde…' : buttonText}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
