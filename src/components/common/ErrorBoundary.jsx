import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 font-sans select-none">
                    <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 text-center">
                        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Ops! Ocorreu um Erro Inesperado</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                A aplicação encontrou uma falha de renderização. Seus dados no Supabase estão seguros.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={this.handleReload}
                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                                Recarregar Aplicação
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-all border border-slate-700 active:scale-95 cursor-pointer"
                            >
                                Tentar Novamente
                            </button>
                        </div>

                        {this.state.error && (
                            <details className="text-left bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-400 overflow-x-auto">
                                <summary className="font-bold text-slate-300 cursor-pointer mb-2 focus:outline-none">
                                    Ver Detalhes Técnicos do Erro
                                </summary>
                                <div className="text-red-400 font-bold mb-1">{this.state.error.toString()}</div>
                                <div className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-500">
                                    {this.state.errorInfo?.componentStack}
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

