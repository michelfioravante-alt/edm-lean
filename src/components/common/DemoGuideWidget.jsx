import React, { useEffect, useState } from 'react';
import { Sparkles, X, ChevronUp, ChevronRight, ShieldCheck, Lightbulb } from 'lucide-react';
import { isLocalMode } from '../../local/mode';
import { useAuthStore } from '../../store/useAuthStore';

const STORAGE_COLLAPSE = 'edm-lean-demo-guia-recolhido';
const STORAGE_WELCOME = 'edm-lean-demo-guia-viu-boasvindas';

const GUIA = {
    _boasVindas: {
        titulo: 'Fábrica de exemplo — 2 minutos',
        descricao: 'Isto não é cadastro. É a Precision Tools no seu navegador: moldes, CNC, eletrofio, têmpera e estoque já preenchidos. Nada vai para a nuvem.',
        passos: [
            'Gestor (PIN 1234 no topo): abre no Inicio — avisos, atrasos e o que esta na maquina.',
            'CNC / EDM Fio no topo: ve so o quadro daquela maquina, para programar e operar.',
            'Arraste um cartao, abra uma ficha, mexa a vontade. “Restaurar exemplos” na faixa amarela zera tudo.',
        ],
        dica: 'Comece pelo Inicio se for gestor. A Carteira e a lista completa. Programador vai ao Kanban.',
    },
    home: {
        titulo: 'Inicio — sala de comando',
        descricao: 'Primeira tela do gestor: o que precisa de acao agora, nao o historico.',
        passos: [
            'Os numeros do topo abrem a Carteira ja filtrada (atraso, CAM, terceiro, peca pronta).',
            'Avisos vermelhos e amarelos: prazo, maquina parada, estoque, terceiro acima da media.',
            'As tres filas curtas levam ao Kanban ou a Carteira. A lista completa continua no menu Carteira.',
        ],
        dica: 'Se a lista de avisos estiver vazia, o chao esta sob controle. Dashboard e para a semana, nao para o turno.',
    },
    carteira: {
        titulo: 'Carteira — a O.S. mãe',
        descricao: 'Uma linha = um molde ou uma peça. Não é o cartão da máquina.',
        passos: [
            'Olhe a coluna Gargalo: é o kanban que está parado agora (CNC, fio ou terceiro).',
            'Filtro “Em terceiro”: peça em tratamento térmico, com fornecedor e dias lá.',
            'Clique na linha: caminho da peça. Laser, retífica, torno e montagem são marcos — toque para marcar feito, sem abrir quadro.',
            '“Ver no quadro” leva ao Kanban daquele setor.',
        ],
        dica: 'Valor orçado só aparece para o gestor. Programador não vê R$.',
    },
    kanban: {
        titulo: 'Kanban — CNC, fio e envio',
        descricao: 'Quadro de verdade só em CNC e eletrofio. Externo no gestor é logística (a enviar / no terceiro / voltou), não usinagem.',
        passos: [
            'Cartão em A fazer com faixa “A programar”: abra e informe setup + usinagem/corte CAM. Sem isso a eficiência fica em branco.',
            'Arraste para Prep. ferramental e depois para usinagem/corte: o relógio real começa.',
            'No detalhe: print, folha de processo, previsto × real.',
            'Torno, retífica, laser e montagem não têm aba — estão no roteiro da carteira.',
        ],
        dica: 'Troque CNC ↔ EDM Fio no topo do quadro (gestor) ou no seletor de perfil da demo.',
    },
    dashboard: {
        titulo: 'Painel — previsto versus real',
        descricao: 'Eficiência CAM = (setup + corte previstos) ÷ (setup + corte reais). Acima de 100% = mais rápido que o programa.',
        passos: [
            'Só entram horas de máquina. Aferição e pausa não entram no %.',
            'Sem tempo previsto no kanban, aquele cartão não conta no indicador.',
            'Filtre o setor. Programador vê só o dele, sem faturamento.',
        ],
        dica: 'Programe um cartão, mova até concluir e volte aqui: o número muda.',
    },
    estoque: {
        titulo: 'Estoque do setor',
        descricao: 'Consumível da máquina, não almoxarifado geral.',
        passos: [
            'Programador CNC não vê fio de latão; EDM não vê fresa.',
            'Troca de ferramenta na pausa baixa o item se a config pedir.',
            'Alerta mínimo: peça que falta para não parar o turno.',
        ],
        dica: 'Cadastre o insumo no setor certo (CNC ou EDM Fio).',
    },
    ferramental: {
        titulo: 'Ferramental e vida',
        descricao: 'Ferramenta no magazine, horas na máquina, quebra.',
        passos: [
            'Vincule a ferramenta à máquina ativa.',
            'Quebra gera histórico — dá para ver peça e operador.',
            'Ajuda a não usinar com fresa no fim de vida.',
        ],
        dica: 'Use junto com a pausa “Troca de ferramenta” no Kanban.',
    },
    clientes: {
        titulo: 'Clientes da carteira',
        descricao: 'Nome que aparece na O.S. e no autocomplete.',
        passos: [
            'Na nova O.S. o gestor escolhe cliente da lista, a própria fábrica ou “Outros”.',
            'Programador só vê o nome, sem e-mail nem telefone.',
        ],
        dica: 'Só o gestor cadastra contato.',
    },
    registros: {
        titulo: 'Registros — o que já saiu',
        descricao: 'O.S. concluídas ou excluídas, para auditoria.',
        passos: [
            'Filtre por setor. Programador só vê o próprio.',
            'Compare setup/corte previstos com os reais da ficha.',
        ],
        dica: 'Não é o quadro do dia — é o arquivo.',
    },
    configuracoes: {
        titulo: 'Máquinas, pessoas e terceiro',
        descricao: 'Parque, programadores, operadores, valor hora e fornecedores externos.',
        passos: [
            'Máquina: CNC, EDM Fio ou Laser (laser é marco, não quadro).',
            'Fornecedores: usados na carteira ao mandar para o terceiro.',
            'PIN 1234 nesta demo libera a visão gestor.',
        ],
        dica: 'Custo/hora CNC e EDM alimenta o R$ da carteira (só gestor).',
    },
};

function rotaDoPerfil(role) {
    if (role === 'admin') {
        return ['home', 'carteira', 'kanban', 'dashboard', 'estoque', 'ferramental', 'clientes', 'registros', 'configuracoes'];
    }
    return ['kanban', 'dashboard', 'estoque', 'ferramental', 'registros'];
}

export default function DemoGuideWidget({ activeView, onViewChange }) {
    const role = useAuthStore((s) => s.role);
    const setorPadrao = useAuthStore((s) => s.setorPadrao);
    const rota = rotaDoPerfil(role);

    const [aberto, setAberto] = useState(false);
    const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);

    useEffect(() => {
        if (!isLocalMode()) return;
        try {
            const jaViu = localStorage.getItem(STORAGE_WELCOME) === '1';
            if (!jaViu) {
                setMostrarBoasVindas(true);
                setAberto(true);
            }
        } catch {
            setAberto(false);
        }
    }, []);

    if (!isLocalMode()) return null;

    const chave = mostrarBoasVindas ? '_boasVindas' : (GUIA[activeView] ? activeView : 'kanban');
    const bloco = GUIA[chave];
    const idxRota = Math.max(0, rota.indexOf(activeView));
    const proximaTela = rota[(idxRota + 1) % rota.length];
    const perfilTxt = role === 'admin'
        ? 'Gestor'
        : `Programador ${setorPadrao === 'EDM_FIO' ? 'eletrofio' : 'CNC'}`;

    const persistirVisto = () => {
        try {
            localStorage.setItem(STORAGE_WELCOME, '1');
            localStorage.setItem(STORAGE_COLLAPSE, '1');
        } catch { /* ignore */ }
    };

    const fechar = () => {
        setAberto(false);
        setMostrarBoasVindas(false);
        persistirVisto();
    };

    const abrir = () => {
        setAberto(true);
        try { localStorage.removeItem(STORAGE_COLLAPSE); } catch { /* ignore */ }
    };

    const irProximo = () => {
        try { localStorage.setItem(STORAGE_WELCOME, '1'); } catch { /* ignore */ }
        setMostrarBoasVindas(false);
        if (proximaTela && onViewChange) onViewChange(proximaTela);
    };

    const comecarAqui = () => {
        try { localStorage.setItem(STORAGE_WELCOME, '1'); } catch { /* ignore */ }
        setMostrarBoasVindas(false);
        const destino = role === 'admin' ? 'home' : 'kanban';
        if (onViewChange && activeView !== destino) onViewChange(destino);
    };

    const nPasso = mostrarBoasVindas ? 0 : idxRota + 1;

    return (
        <div className="fixed bottom-16 md:bottom-5 right-4 z-40 max-w-sm w-[calc(100vw-32px)] sm:w-[22rem] font-sans">
            {!aberto ? (
                <button
                    type="button"
                    onClick={abrir}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#D97D3D] hover:bg-[#c46d32] text-[#111318] font-semibold rounded-[8px] shadow-[0_8px_24px_rgba(217,125,61,0.28)] text-[11px] uppercase tracking-wider cursor-pointer"
                >
                    <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Guia da demo
                    </span>
                    <ChevronUp className="w-4 h-4" />
                </button>
            ) : (
                <div className="bg-[#181B22] border border-[#D97D3D]/45 rounded-[10px] shadow-[0_16px_40px_rgba(0,0,0,0.7)] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#D97D3D]">
                                {mostrarBoasVindas ? 'Primeira visita' : `Tela ${nPasso} de ${rota.length}`}
                            </p>
                            <h4 className="text-sm font-semibold text-[#E7E9ED] mt-0.5 leading-snug">{bloco.titulo}</h4>
                        </div>
                        <button type="button" onClick={fechar} className="p-1 rounded-[6px] text-[#7B808F] hover:text-[#E7E9ED] hover:bg-[#262A33] cursor-pointer" aria-label="Fechar guia">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-xs text-[#9DA2AE] leading-relaxed">{bloco.descricao}</p>

                    <ol className="space-y-2 bg-[#111318] p-3 rounded-[7px] border border-[#262A33] text-xs text-[#C7CAD1]">
                        {bloco.passos.map((p, i) => (
                            <li key={i} className="flex gap-2 leading-snug">
                                <span className="shrink-0 w-4 h-4 rounded-full bg-[#D97D3D]/20 text-[#D97D3D] text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                <span>{p}</span>
                            </li>
                        ))}
                    </ol>

                    {bloco.dica && (
                        <p className="flex gap-1.5 text-[11px] text-[#C99A4A] leading-snug">
                            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            {bloco.dica}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                        {mostrarBoasVindas ? (
                            <button type="button" onClick={comecarAqui} className="flex-1 min-h-[40px] px-3 rounded-[7px] bg-[#D97D3D] text-[#111318] text-[11px] font-semibold uppercase tracking-wider cursor-pointer">
                                Começar nesta tela
                            </button>
                        ) : (
                            <button type="button" onClick={irProximo} className="flex-1 min-h-[40px] px-3 rounded-[7px] bg-[#D97D3D] text-[#111318] text-[11px] font-semibold uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-1">
                                Próxima tela
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="pt-2 border-t border-[#262A33] flex items-center justify-between text-[11px] text-[#7B808F]">
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#4A9D74]" />
                            Você está como <strong className="text-[#E7E9ED] font-medium">{perfilTxt}</strong>
                        </span>
                        <button type="button" onClick={fechar} className="text-[#D97D3D] cursor-pointer hover:underline">Recolher</button>
                    </div>
                </div>
            )}
        </div>
    );
}
