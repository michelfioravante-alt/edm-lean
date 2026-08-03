import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { isLocalMode } from '../local/mode';
import { Mail, Lock, Zap, ShieldCheck, Factory, Eye, EyeOff, Layout, KeyRound, ArrowLeft } from 'lucide-react';

export default function Login({ initialMode = 'login', onBack }) {
    const { login, signUp, requestPasswordReset, updatePassword, isResettingPassword, enterLocalStudyMode } = useAuthStore();

    // 'login' | 'register' | 'forgot_password' | 'reset_password'
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
        if (isResettingPassword) {
            setMode('reset_password');
        }
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
                if (res.error?.includes('Email not confirmed')) {
                    setError('E-mail não confirmado. Verifique sua caixa de entrada.');
                } else {
                    setError(res.error);
                }
            }
            // Se logar com sucesso, o useAuthStore cuida do redirecionamento pelo App.jsx
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
            if (password !== confirmPassword) {
                setError('As senhas não coincidem.');
                setIsProcessing(false);
                return;
            }
            if (password.length < 6) {
                setError('A senha deve ter no mínimo 6 caracteres.');
                setIsProcessing(false);
                return;
            }
            const res = await updatePassword(password);
            if (res.success) {
                setSuccessMsg('Senha atualizada com sucesso!');
                useAuthStore.setState({ isResettingPassword: false });
                window.location.hash = ''; // Limpar o hash da URL
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
            case 'forgot_password': return { title: 'Recuperar Acesso', subtitle: 'Enviaremos um link seguro para o seu e-mail' };
            case 'reset_password': return { title: 'Nova Senha', subtitle: 'Defina sua nova senha de acesso' };
            case 'login':
            default: return { title: 'Bem-vindo', subtitle: 'Acesso restrito ao sistema' };
        }
    };
    const header = getHeader();

    const getButtonText = () => {
        switch (mode) {
            case 'register': return 'Criar minha conta industrial';
            case 'forgot_password': return 'Enviar link de recuperação';
            case 'reset_password': return 'Confirmar nova senha';
            case 'login':
            default: return 'Entrar no Sistema';
        }
    };

    return (
        <div
            className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-kanban-amber/30"
            style={{
                backgroundImage: "url('/fundo-edm.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Botão de Voltar ao Site (Altamente Visível e Acessível) */}
            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-2xl text-sm font-semibold transition-all shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                >
                    <ArrowLeft size={16} className="text-kanban-amber" />
                    <span>Voltar ao Site</span>
                </button>
            )}

            {/* BACKGROUND EFFECTS */}
            <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-kanban-amber/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[100px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(15,23,42,0)_0%,rgba(2,6,23,1)_80%)]"></div>
            </div>

            <div className="w-full max-w-[440px] z-10 flex flex-col gap-8">
                {/* BRANDING SECTION */}
                <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 bg-kanban-amber rounded-[2rem] border border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.2)] flex items-center justify-center relative group overflow-hidden transition-transform duration-500 hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* CONCEPT LOGO: Trend Line + Spark/Wire */}
                            <svg viewBox="0 0 100 100" className="w-14 h-14 relative z-10 drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Trend Line (Efficiency/Growth) - Dark for contrast */}
                                <path d="M20 70L40 50L55 60L85 25" stroke="#0a0c0f" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="opacity-90" />

                                {/* Spark / Wire (The "Fio") - White for contrast */}
                                <path d="M45 40L55 60" stroke="white" strokeWidth="10" strokeLinecap="round" className="animate-pulse" />
                            </svg>
                        </div>
                        {/* Shadow highlight */}
                        <div className="absolute -bottom-2 inset-x-0 mx-auto w-12 h-1 bg-kanban-amber blur-lg opacity-80"></div>
                    </div>

                    <h1 className="text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
                        CNC LEAN <span className="w-2 h-2 bg-kanban-amber rounded-full"></span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg mt-3 leading-relaxed max-w-[320px]">
                        Gestão Lean para Centros de Usinagem CNC.
                    </p>
                </div>

                {/* FORM CARD */}
                <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/50 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {header.title}
                            </h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                {header.subtitle}
                            </p>
                        </div>

                        {mode === 'login' || mode === 'register' ? (
                            <div className="flex gap-2 items-center">
                                <div className="bg-slate-950/50 p-1.5 rounded-full border border-slate-800 flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${mode === 'login' ? 'bg-kanban-amber text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Login
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${mode === 'register' ? 'bg-kanban-amber text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Criar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('login');
                                    setError('');
                                    setSuccessMsg('');
                                    if (mode === 'reset_password') {
                                        useAuthStore.setState({ isResettingPassword: false });
                                    }
                                }}
                                className="px-4 py-1.5 bg-slate-950/50 rounded-full border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider hover:text-white transition-all flex items-center justify-center"
                            >
                                Voltar
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isLocalMode() && (

                            <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl text-center space-y-2">
                                <p className="text-xs font-bold text-emerald-400">
                                    💡 Teste local ativado! Você pode acessar o sistema instantaneamente sem senha.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => enterLocalStudyMode('admin')}
                                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <span>⚡ Entrar no Sistema sem Senha (Modo Estudo)</span>
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-bold text-center animate-in shake duration-500">
                                {error}
                            </div>
                        )}


                        {successMsg && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-xs font-bold text-center animate-bounce-in">
                                {successMsg}
                            </div>
                        )}

                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            {mode === 'register' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fábrica / Empresa</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <Factory className="h-5 w-5 text-slate-600 group-focus-within:text-kanban-amber transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={e => setCompanyName(e.target.value)}
                                            placeholder="Nome da sua fábrica ou código"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-950/80 border border-slate-800 rounded-2xl focus:outline-none focus:border-kanban-amber focus:ring-4 focus:ring-kanban-amber/5 text-slate-100 font-bold placeholder-slate-700 transition-all outline-none"
                                            required={mode === 'register'}
                                        />
                                    </div>
                                </div>
                            )}

                            {(mode === 'login' || mode === 'register' || mode === 'forgot_password') && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                        E-mail
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-600 group-focus-within:text-kanban-amber transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="seu.nome@empresa.com"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-950/80 border border-slate-800 rounded-2xl focus:outline-none focus:border-kanban-amber focus:ring-4 focus:ring-kanban-amber/5 text-slate-100 font-bold placeholder-slate-700 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {(mode === 'login' || mode === 'register' || mode === 'reset_password') && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            {mode === 'reset_password' ? 'Nova Senha' : 'Senha de Acesso'}
                                        </label>
                                        {mode === 'login' && (
                                            <button
                                                type="button"
                                                onClick={() => { setMode('forgot_password'); setError(''); setSuccessMsg(''); }}
                                                className="text-[10px] font-bold text-kanban-amber/70 hover:text-kanban-amber uppercase tracking-widest transition-colors"
                                            >
                                                Esqueci
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-600 group-focus-within:text-kanban-amber transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-14 py-4 bg-slate-950/80 border border-slate-800 rounded-2xl focus:outline-none focus:border-kanban-amber focus:ring-4 focus:ring-kanban-amber/5 text-slate-100 font-bold placeholder-slate-700 transition-all outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-4 p-1 text-slate-600 hover:text-kanban-amber transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {mode === 'reset_password' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                        Confirmar Nova Senha
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <KeyRound className="h-5 w-5 text-slate-600 group-focus-within:text-kanban-amber transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-14 py-4 bg-slate-950/80 border border-slate-800 rounded-2xl focus:outline-none focus:border-kanban-amber focus:ring-4 focus:ring-kanban-amber/5 text-slate-100 font-bold placeholder-slate-700 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className={`w-full h-[60px] bg-kanban-amber hover:bg-amber-400 text-slate-900 font-black px-8 rounded-2xl transition-all shadow-xl hover:shadow-kanban-amber/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden ${isProcessing ? 'opacity-80 cursor-not-allowed' : ''}`}
                        >
                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-[-20deg]"></div>

                            {isProcessing ? (
                                <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <>
                                    <span className="uppercase tracking-[0.1em] text-sm">
                                        {getButtonText()}
                                    </span>
                                    {mode === 'login' && <Zap className="w-4 h-4 fill-slate-900 group-hover:scale-110 transition-transform" />}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {isLocalMode() && mode === 'login' && (
                    <button
                        type="button"
                        onClick={() => enterLocalStudyMode('admin')}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm transition-all shadow-md"
                    >
                        Entrar no Modo Demonstração Interativo (Sem Login)
                    </button>
                )}



                <div className="flex flex-col items-center gap-6 mt-2 opacity-50 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TLS 1.3 Secure</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-sky-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cloud Powered</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                        &copy; 2026 CNC Lean • Precision Software Solutions
                    </p>
                </div>
            </div>
        </div>
    );
}

// ICON FALLBACK (if Database is missing from lucide)
function Database(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5V19A9 3 0 0 0 21 19V5" />
            <path d="M3 12A9 3 0 0 0 21 12" />
        </svg>
    );
}
