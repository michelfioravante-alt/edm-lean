import React, { useState } from 'react';
import { Sparkles, X, ChevronUp, ShieldCheck } from 'lucide-react';
import { isLocalMode } from '../../local/mode';
import { useAuthStore } from '../../store/useAuthStore';

const RECURSOS_POR_VISAO = {
    kanban: {
        titulo: 'Quadro Kanban Multisetor',
        descricao: 'Gestão visual em tempo real para Usinagem CNC, Eletroerosão a Fio (WEDM) e Tornos.',
        destaques: [
            'Calculadora de Perímetros WEDM integrada na abertura de novas O.S. de EDM.',
            'Importação automática de Folhas de Processo CAM (UG NX, Mastercam) para CNC e Torno.',
            'Cronometragem real de fases (Setup, Usinagem, Inspeção FPY) com registro de paradas.',
            'Visão Restrita por Perfil: Operador e Programador veem seu módulo; Gerente vê toda a fábrica.'
        ]
    },
    dashboard: {
        titulo: 'Painel de Eficiência Operacional & Financeiro',
        descricao: 'Métricas em tempo real de aderência aos tempos de CAM e retorno financeiro.',
        destaques: [
            'Faturamento Gerado vs. Custo de Tempo Morto por Máquina e por Setor.',
            'Eficiência Operacional Real: Compara tempo estimado orçado com tempo real cronometrado.',
            'Aprovação FPY (First Pass Yield): Taxa de qualidade da primeira inspeção dimensional.',
            'Filtros dinâmicos por Setor Produtivo, Turnos de Trabalho e Períodos.'
        ]
    },
    estoque: {
        titulo: 'Controle de Insumos Produtivos',
        descricao: 'Gestão de consumíveis específicos por setor com alerta de estoque mínimo.',
        destaques: [
            'Insumos EDM: Fios de latão, resinas deionizadoras e filtros de água.',
            'Insumos CNC e Torno: Fresas de metal duro, pastilhas/inserts e óleos de corte.',
            'Insumos Gerais: Fluídos e lubrificantes compartilhados com toda a fábrica.',
            'Alerta automático de reabastecimento antes de parar o processo produtivo.'
        ]
    },
    ferramental: {
        titulo: 'Gestão de Ferramental & Vida Útil',
        descricao: 'Rastreio de vida útil de ferramentas de corte por horas de usinagem.',
        destaques: [
            'Alerta de Desgaste: Notifica o operador antes da quebra da ferramenta.',
            'Registro de Histórico de Quebras e substituição no magazine da máquina.',
            'Otimização de Setup: Evita avarias na peça por ferramenta gasta.'
        ]
    },
    clientes: {
        titulo: 'Gestão de Clientes & Histórico de Kanbans',
        descricao: 'Cadastre clientes com múltiplos contatos e consulte todo o histórico de ordens de serviço.',
        destaques: [
            'Múltiplos Contatos: Cadastre contatos por departamento (PCP, Compras, Engenharia).',
            'Histórico de Kanbans: Clique no cliente para levantar todas as O.S. ativas e concluídas.',
            'Métricas Exclusivas: Total de O.S., volume nos últimos 30 dias e taxa de entrega.',
            'Contatos no Mobile: Visualização completa de telefone e e-mail no celular.'
        ]
    },
    registros: {
        titulo: 'Histórico & Rastreabilidade de Registros',
        descricao: 'Consulta detalhada e auditoria de todas as ordens de serviço finalizadas.',
        destaques: [
            'Busca e Filtros Avançados: Localize O.S. por cliente, código de peça ou setor.',
            'Relatório de Desempenho: Compare tempos de setup, corte e tempo morto.',
            'Restauração de O.S.: Possibilidade de reativar ordens finalizadas.'
        ]
    }
};

export default function DemoGuideWidget({ activeView }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const role = useAuthStore(s => s.role);
    const setorPadrao = useAuthStore(s => s.setorPadrao);

    if (!isLocalMode()) return null;

    const infoAtual = RECURSOS_POR_VISAO[activeView] || RECURSOS_POR_VISAO.kanban;

    return (
        <div className="fixed bottom-16 md:bottom-5 right-4 z-40 max-w-sm sm:max-w-md w-[calc(100vw-32px)] sm:w-auto font-sans transition-all duration-300">
            {!isExpanded ? (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 px-4 py-2.5 bg-[#D97D3D] hover:bg-[#c46d32] text-[#111318] font-bold rounded-[8px] shadow-[0_8px_25px_rgba(217,125,61,0.25)] hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer border border-[#D97D3D]"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Destaques do Sistema (Modo Demo)</span>
                    </div>
                    <ChevronUp className="w-4 h-4" />
                </button>
            ) : (
                <div className="bg-[#181B22] backdrop-blur-md border border-[#D97D3D]/40 rounded-[10px] shadow-[0_15px_40px_rgba(0,0,0,0.7)] p-4 sm:p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div className="flex items-start justify-between gap-3 border-b border-[#262A33] pb-3">
                        <div className="flex items-center gap-2 text-[#D97D3D]">
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <h4 className="font-semibold text-sm text-[#E7E9ED] tracking-wide">{infoAtual.titulo}</h4>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-1 rounded-[6px] text-[#7B808F] hover:text-[#E7E9ED] hover:bg-[#262A33] transition-colors shrink-0 cursor-pointer"
                            aria-label="Fechar guia"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-xs text-[#9DA2AE] font-medium leading-relaxed">
                        {infoAtual.descricao}
                    </p>

                    <div className="space-y-2 bg-[#111318] p-3 rounded-[7px] border border-[#262A33] text-xs">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D97D3D] block mb-1">
                            O que este módulo entrega:
                        </span>
                        <ul className="space-y-2 text-[#9DA2AE] font-medium">
                            {infoAtual.destaques.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 leading-tight">
                                    <span className="text-[#4A9D74] shrink-0 font-bold">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-2 border-t border-[#262A33] flex items-center justify-between text-[11px] text-[#7B808F] font-semibold">
                        <span className="flex items-center gap-1.5 text-[#9DA2AE]">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#4A9D74]" />
                            Perfil Ativo: <strong className="text-[#D97D3D]">{role === 'admin' ? 'Gerente (Visão Total)' : `Prog. ${setorPadrao}`}</strong>
                        </span>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-[#D97D3D] hover:underline text-xs cursor-pointer"
                        >
                            Minimizar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
