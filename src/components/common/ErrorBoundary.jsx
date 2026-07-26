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
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: '#fef2f2', color: '#991b1b', height: '100vh', boxSizing: 'border-box', overflowY: 'auto' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Ocorreu um Erro Crítico no React</h2>
                    <p>O Kanban sofreu um "White Screen of Death" tentando renderizar um componente com dados inválidos do Banco de Dados.</p>
                    <br />
                    <details style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: '#fee2e2', padding: '16px', borderRadius: '8px' }} open>
                        <summary style={{ fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}>Ver Logs de Erro (Copie isso!)</summary>
                        {this.state.error && this.state.error.toString()}
                        <br /><br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }
        return this.props.children;
    }
}
