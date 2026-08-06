import React, { useState } from 'react';
import { Sparkles, X, ChevronUp, ShieldCheck } from 'lucide-react';
import { isLocalMode } from '../../local/mode';
import { useAuthStore } from '../../store/useAuthStore';

const RECURSOS_POR_VISAO = {
    kanban: {
        titulo: '📋 Quadro Kanban Multisetor',
        descricao: 'Gestão visual em tempo real para Usinagem CNC, Eletroerosão a Fio (WEDM) e Tornos.',
        destaques: [
            '⚡ Calculadora de Perímetros WEDM integrada na abertura de novas O.S. de EDM.',
            '📑 Importação automática de Folhas de Processo CAM (UG NX, Mastercam) para CNC e Torno.',
            '⏱️ Cronometragem real de fases (Setup, Usinagem, Inspeção FPY) com registro de paradas.',
            '🔒 Visão Restrita por Perfil: Operador e Programador veem seu módulo; Gerente vê toda a fábrica.'
        ]
    },
    dashboard: {
        titulo: '📊 Painel de Eficiência Operacional & Financeiro',
        descricao: 'Métricas em tempo real de aderência aos tempos de CAM e retorno financeiro.',
        destaques: [
            '💰 Faturamento Gerado vs. Custo de Tempo Morto por Máquina e por Setor.',
            '📈 Eficiência Operacional Real: Compara tempo estimado orçado com tempo real cronometrado.',
            '🎯 Aprovação FPY (First Pass Yield): Taxa de qualidade da primeira inspeção dimensional.',
            '⚙️ Filtros dinâmicos por Setor Produtivo, Turnos de Trabalho e Períodos.'
        ]
    },
    estoque: {
        titulo: '📦 Controle de Insumos Produtivos',
        descricao: 'Gestão de consumíveis específicos por setor com alerta de estoque mínimo.',
        destaques: [
            '⚡ Insumos EDM: Fios de latão, resinas deionizadoras e filtros de água.',
            '🌀 Insumos CNC e Torno: Fresas de metal duro, pastilhas/inserts e óleos de corte.',
            '🏢 Insumos Gerais: Fluídos e lubrificantes compartilhados com toda a fábrica.',
            '⚠️ Alerta automático de reabastecimento antes de parar o processo produtivo.'
        ]
    },
    ferramental: {
        titulo: '🔧 Gestão de Ferramental & Vida Útil',
        descricao: 'Rastreio de vida útil de ferramentas de corte por horas de usinagem.',
        destaques: [
            '⏱️ Alerta de Desgaste: Notifica o operador antes da quebra da ferramenta.',
            '💥 Registro de Histórico de Quebras e substituição no magazine da máquina.',
            '🎯 Otimização de Setup: Evita avarias na peça por ferramenta gasta.'
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
                    className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl shadow-[0_8px_25px_rgba(245,158,11,0.35)] hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer border border-amber-300/40"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-slate-950 animate-bounce" />
                        <span>💡 Destaques do Sistema (Modo Demo)</span>
                    </div>
                    <ChevronUp className="w-4 h-4 text-slate-950" />
                </button>
            ) : (
                <div className="bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/50 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] p-4 sm:p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Sparkles className="w-5 h-5 shrink-0" />
                            <h4 className="font-extrabold text-sm text-white tracking-wide">{infoAtual.titulo}</h4>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                            aria-label="Fechar guia"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {infoAtual.descricao}
                    </p>

                    <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                            O que este módulo entrega:
                        </span>
                        <ul className="space-y-2 text-slate-300 font-medium">
                            {infoAtual.destaques.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 leading-tight">
                                    <span className="text-emerald-400 shrink-0 font-bold">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                        <span className="flex items-center gap-1 text-slate-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Perfil Ativo: <strong className="text-amber-400">{role === 'admin' ? 'Gerente (Visão Total)' : `Prog. ${setorPadrao}`}</strong>
                        </span>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-amber-400 hover:underline text-xs"
                        >
                            Minimizar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
