import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/common/Button';
import { 
    Plus, Trash2, Settings2, Zap, ShieldCheck, Users, Monitor, 
    Bot, DollarSign, Copy, Wrench, Clock, RefreshCw, Cpu, Layers 
} from 'lucide-react';
import { ESTRATEGIA_FERRAMENTAL_OPTIONS } from '../constants/cncProcess';

export default function ConfigSettings() {
    const {
        configuracoesGlobais, salvarConfiguracoes,
        fetchConfiguracoes, fetchMaquinas, fetchOperadores, fetchProgramadores, fetchAutoKanbans, fetchUsuarios,
        maquinas, addMaquina, removeMaquina,
        operadores, addOperador, removeOperador,
        programadores, addProgramador, removeProgramador,
        kanbansAutomaticos, addKanbanAutomatico, removeKanbanAutomatico,
        usuarios
    } = useAppStore();

    const { user, codigoConvite } = useAuthStore();

    const [activeTab, setActiveTab] = useState('geral'); // 'geral' | 'recursos' | 'equipe' | 'automacao'

    // Carrega dados ao montar a página
    useEffect(() => {
        fetchConfiguracoes();
        fetchMaquinas();
        fetchOperadores();
        fetchProgramadores();
        fetchAutoKanbans();
        fetchUsuarios();
    }, []);

    // Estado Local das Configs Globais
    const [custoHoraLocal, setCustoHoraLocal] = useState(configuracoesGlobais?.custoHoraMaquina || 50);
    const [custoHoraCncLocal, setCustoHoraCncLocal] = useState(configuracoesGlobais?.custoHoraCnc || 80);
    const [custoHoraEdmLocal, setCustoHoraEdmLocal] = useState(configuracoesGlobais?.custoHoraEdm || 120);
    const [toastMsg, setToastMsg] = useState('');
    const [turnosLocal, setTurnosLocal] = useState(configuracoesGlobais?.turnos || [
        { id: 't1', nome: 'Turno 1', inicio: '07:30', fim: '15:30' },
        { id: 't2', nome: 'Turno 2', inicio: '15:30', fim: '23:30' },
        { id: 't3', nome: 'Turno 3', inicio: '23:30', fim: '07:30' }
    ]);
    const [pinLocal, setPinLocal] = useState(configuracoesGlobais?.pinOnboarding ?? '1234');
    const [modoMagazineLocal, setModoMagazineLocal] = useState(configuracoesGlobais?.modoMagazineDefault || 'individual');
    const [baixaEstoqueSetupLocal, setBaixaEstoqueSetupLocal] = useState(configuracoesGlobais?.baixaEstoqueNoSetup ?? false);

    // Sincroniza o estado local sempre que configuracoesGlobais for carregado/atualizado
    useEffect(() => {
        if (configuracoesGlobais) {
            if (configuracoesGlobais.custoHoraMaquina !== undefined) {
                setCustoHoraLocal(configuracoesGlobais.custoHoraMaquina);
            }
            if (configuracoesGlobais.custoHoraCnc !== undefined) {
                setCustoHoraCncLocal(configuracoesGlobais.custoHoraCnc);
            }
            if (configuracoesGlobais.custoHoraEdm !== undefined) {
                setCustoHoraEdmLocal(configuracoesGlobais.custoHoraEdm);
            }
            if (Array.isArray(configuracoesGlobais.turnos) && configuracoesGlobais.turnos.length > 0) {
                setTurnosLocal(configuracoesGlobais.turnos);
            }
            if (configuracoesGlobais.pinOnboarding !== undefined) {
                setPinLocal(configuracoesGlobais.pinOnboarding);
            }
            if (configuracoesGlobais.modoMagazineDefault) {
                setModoMagazineLocal(configuracoesGlobais.modoMagazineDefault);
            }
            if (configuracoesGlobais.baixaEstoqueNoSetup !== undefined) {
                setBaixaEstoqueSetupLocal(configuracoesGlobais.baixaEstoqueNoSetup);
            }
        }
    }, [configuracoesGlobais]);

    const configuracaoDaTela = () => ({
        custoHoraMaquina: parseFloat(custoHoraLocal) || configuracoesGlobais?.custoHoraMaquina || 50,
        custoHoraCnc: parseFloat(custoHoraCncLocal) || configuracoesGlobais?.custoHoraCnc || 80,
        custoHoraEdm: parseFloat(custoHoraEdmLocal) || configuracoesGlobais?.custoHoraEdm || 120,
        turnos: turnosLocal,
        pinOnboarding: pinLocal || configuracoesGlobais?.pinOnboarding || '1234',
        modoMagazineDefault: modoMagazineLocal,
        baixaEstoqueNoSetup: baixaEstoqueSetupLocal,
    });

    const removerComAviso = async (acao, rotulo) => {
        try {
            await acao();
        } catch (err) {
            setToastMsg(`Erro ao remover ${rotulo}: ${err.message}`);
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const handleSalvarMagazine = async (e) => {
        e.preventDefault();
        try {
            await salvarConfiguracoes({
                ...configuracaoDaTela(),
                modoMagazineDefault: modoMagazineLocal,
                baixaEstoqueNoSetup: baixaEstoqueSetupLocal,
            });
            setToastMsg('Preferências de ferramentas salvas!');
        } catch (err) {
            setToastMsg('Erro ao salvar: ' + err.message);
        }
        setTimeout(() => setToastMsg(''), 3500);
    };

    const handleTurnoChange = (index, field, value) => {
        const novosTurnos = [...turnosLocal];
        novosTurnos[index] = { ...novosTurnos[index], [field]: value };
        setTurnosLocal(novosTurnos);
    };

    const handleAddTurno = (e) => {
        if (e) e.preventDefault();
        const nomeTrim = (novoTurnoNome || '').trim();
        if (nomeTrim) {
            setTurnosLocal(prev => [
                ...prev,
                { id: `t${Date.now()}`, nome: nomeTrim, inicio: '08:00', fim: '18:00' }
            ]);
            setNovoTurnoNome('');
            setToastMsg('Turno adicionado! Clique em "Salvar Turnos" para gravar.');
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const handleRemoveTurno = (idToRemove) => {
        setTurnosLocal(turnosLocal.filter(t => t.id !== idToRemove));
    };

    const handleSalvarCustoHora = async (e) => {
        e.preventDefault();
        try {
            await salvarConfiguracoes(configuracaoDaTela());
            setToastMsg('Custos Hora Atualizados com Sucesso!');
        } catch (err) {
            setToastMsg('Erro ao salvar: ' + err.message);
        }
        setTimeout(() => setToastMsg(''), 3500);
    };

    const handleSalvarTurnos = async (e) => {
        e.preventDefault();
        try {
            await salvarConfiguracoes(configuracaoDaTela());
            setToastMsg('Turnos Salvos com Sucesso!');
        } catch (err) {
            setToastMsg('Erro ao salvar: ' + err.message);
        }
        setTimeout(() => setToastMsg(''), 3500);
    };

    const [novaMaquinaNome, setNovaMaquinaNome] = useState('');
    const [novaMaquinaSetor, setNovaMaquinaSetor] = useState('CNC');
    const [novoOperador, setNovoOperador] = useState('');
    const [novoOperadorSetor, setNovoOperadorSetor] = useState('TODOS');
    const [novoProgramador, setNovoProgramador] = useState('');
    const [novoProgramadorSetor, setNovoProgramadorSetor] = useState('CNC');
    const [novoTurnoNome, setNovoTurnoNome] = useState('');

    // Kanban Automático State
    const [kbTipo, setKbTipo] = useState('');
    const [kbOutros, setKbOutros] = useState('');
    const [kbMaquina, setKbMaquina] = useState('');
    const [kbDias, setKbDias] = useState('');

    const handleAddMaquina = async (e) => {
        e.preventDefault();
        const limite = configuracoesGlobais?.limiteMaquinas ?? 999;
        if (maquinas.length >= limite) {
            setToastMsg('Erro: Limite do plano atingido.');
            setTimeout(() => setToastMsg(''), 4000);
            return;
        }
        const nomeTrim = novaMaquinaNome.trim();
        if (!nomeTrim) return;

        if (maquinas.some(m => (m.nome || '').toLowerCase() === nomeTrim.toLowerCase())) {
            setToastMsg('Erro: Máquina "' + nomeTrim + '" já cadastrada!');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }

        try {
            await addMaquina(nomeTrim, novaMaquinaSetor);
            setNovaMaquinaNome('');
            setToastMsg('Máquina adicionada com sucesso!');
            setTimeout(() => setToastMsg(''), 2500);
        } catch (err) {
            setToastMsg('Erro: ' + (err?.message || 'Falha ao adicionar máquina'));
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const handleAddOperador = async (e) => {
        e.preventDefault();
        const nomeTrim = novoOperador.trim();
        if (!nomeTrim) return;

        if (operadores.some(o => (o.nome || '').toLowerCase() === nomeTrim.toLowerCase())) {
            setToastMsg('Erro: Operador "' + nomeTrim + '" já cadastrado!');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }

        try {
            await addOperador(nomeTrim, novoOperadorSetor);
            setNovoOperador('');
            setToastMsg('Operador adicionado com sucesso!');
            setTimeout(() => setToastMsg(''), 2500);
        } catch (err) {
            setToastMsg('Erro: ' + (err?.message || 'Falha ao adicionar operador'));
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const handleAddProgramador = async (e) => {
        e.preventDefault();
        const nomeTrim = novoProgramador.trim();
        if (!nomeTrim) return;

        if (programadores.some(p => (p.nome || '').toLowerCase() === nomeTrim.toLowerCase())) {
            setToastMsg('Erro: Programador "' + nomeTrim + '" já cadastrado!');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }

        try {
            await addProgramador(nomeTrim, novoProgramadorSetor);
            setNovoProgramador('');
            setToastMsg('Programador adicionado com sucesso!');
            setTimeout(() => setToastMsg(''), 2500);
        } catch (err) {
            setToastMsg('Erro: ' + (err?.message || 'Falha ao adicionar programador'));
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const handleAddKanbanAuto = async (e) => {
        e.preventDefault();
        if (!kbTipo || !kbDias) {
            setToastMsg('Erro: Preencha a rotina e a quantidade de dias.');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }
        const diasInt = parseInt(kbDias);
        if (isNaN(diasInt) || diasInt <= 0) {
            setToastMsg('Erro: Informe um número de dias maior que zero.');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }

        try {
            await addKanbanAutomatico({
                tipo: kbTipo,
                descricao: kbTipo === 'Outros' ? kbOutros : kbOutros || kbTipo,
                maquinaNome: kbMaquina,
                diasIntervalo: diasInt
            });
            setKbTipo('');
            setKbOutros('');
            setKbMaquina('');
            setKbDias('');
            setToastMsg('Rotina de Kanban Automático adicionada!');
            setTimeout(() => setToastMsg(''), 2500);
        } catch (err) {
            setToastMsg('Erro: ' + (err?.message || 'Falha ao adicionar rotina'));
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const inputClasses = "w-full p-3 border border-[#262A33] rounded-xl focus:outline-none focus:border-kanban-amber focus:ring-1 focus:ring-kanban-amber/50 text-[#E7E9ED] text-sm font-bold bg-[#111318] placeholder-[#565B68] transition-colors";
    const titleClasses = "block text-xs font-semibold uppercase tracking-wider text-[#7B808F] mb-2";
    const cardClasses = "bg-[#181B22]/90 rounded-2xl shadow-lg border border-[#262A33]/80 overflow-hidden";
    const headerClasses = "bg-[#111318]/80 px-6 py-4 border-b border-[#262A33]/80 flex items-center justify-between";

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header da Página */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181B22]/60 p-6 rounded-2xl border border-[#262A33]/80">
                <div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-white flex items-center gap-3">
                        <Settings2 className="w-8 h-8 text-kanban-amber" />
                        Configurações da Fábrica
                    </h2>
                    <p className="text-[#7B808F] mt-1 text-sm font-medium">
                        Gerencie parâmetros de custos, máquinas CNC/EDM/Torno, equipe e rotinas de manutenção.
                    </p>
                </div>

                {/* Seletor de Abas Estilo Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-[#111318] border border-[#262A33] rounded-xl overflow-x-auto">
                    {[
                        { id: 'geral', label: 'Geral & Custos', icon: DollarSign },
                        { id: 'recursos', label: 'Máquinas & CAM', icon: Cpu },
                        { id: 'equipe', label: 'Equipe & Acessos', icon: Users },
                        { id: 'automacao', label: 'Rotinas / Automação', icon: Bot },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    active
                                        ? 'bg-kanban-amber text-[#111318] shadow-md font-semibold'
                                        : 'text-[#7B808F] hover:text-[#E7E9ED] hover:bg-[#181B22]'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ========== ABA 1: GERAL & CUSTOS ========== */}
            {activeTab === 'geral' && (
                <div className="space-y-6 animate-modal-in">
                    {/* Custos Hora */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <DollarSign className="text-emerald-500 w-5 h-5" />
                                <h3 className="text-lg font-bold text-white">Taxas Horárias por Setor (R$/h)</h3>
                            </div>
                            <span className="text-[10px] font-mono bg-[rgba(74,157,116,0.1)] text-[#4A9D74] px-2.5 py-1 rounded-full border border-[#4A9D74]/30 font-semibold">
                                BASE FINANCEIRA
                            </span>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSalvarCustoHora} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="bg-[#111318]/80 p-4 rounded-xl border border-[#262A33]/80">
                                        <label className={titleClasses}>Usinagem CNC (R$/h)</label>
                                        <div className="relative mt-2">
                                            <span className="absolute left-3.5 top-3 text-cyan-400 font-semibold text-sm">R$</span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                value={custoHoraCncLocal}
                                                onChange={e => setCustoHoraCncLocal(e.target.value)}
                                                className={`${inputClasses} pl-10 border-cyan-500/30 focus:border-cyan-400`}
                                            />
                                        </div>
                                        <span className="block text-[10px] text-[#565B68] mt-2">Centro de Usinagem 3, 4 e 5 eixos.</span>
                                    </div>

                                    <div className="bg-[#111318]/80 p-4 rounded-xl border border-[#262A33]/80">
                                        <label className={titleClasses}>Eletroerosão a Fio (R$/h)</label>
                                        <div className="relative mt-2">
                                            <span className="absolute left-3.5 top-3 text-[#4A9D74] font-semibold text-sm">R$</span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                value={custoHoraEdmLocal}
                                                onChange={e => setCustoHoraEdmLocal(e.target.value)}
                                                className={`${inputClasses} pl-10 border-[#4A9D74]/30 focus:border-emerald-400`}
                                            />
                                        </div>
                                        <span className="block text-[10px] text-[#565B68] mt-2">Inclui fio de latão + desionizador.</span>
                                    </div>

                                    <div className="bg-[#111318]/80 p-4 rounded-xl border border-[#262A33]/80">
                                        <label className={titleClasses}>Custo Padrão / Geral (R$/h)</label>
                                        <div className="relative mt-2">
                                            <span className="absolute left-3.5 top-3 text-indigo-400 font-semibold text-sm">R$</span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                value={custoHoraLocal}
                                                onChange={e => setCustoHoraLocal(e.target.value)}
                                                className={`${inputClasses} pl-10`}
                                            />
                                        </div>
                                        <span className="block text-[10px] text-[#565B68] mt-2">Torno CNC, bancada e ajuste.</span>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" variant="primary" size="md" className="px-6 shadow-sm">
                                        Salvar Custos por Setor
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Preferências de Magazine Ferramental */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Wrench className="text-kanban-amber w-5 h-5" />
                                <h3 className="text-lg font-bold text-white">Estratégia Ferramental & Magazine CNC</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSalvarMagazine} className="space-y-5">
                                <div className="space-y-3">
                                    {ESTRATEGIA_FERRAMENTAL_OPTIONS.map((opt) => (
                                        <label key={opt.key} className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${modoMagazineLocal === opt.key ? 'border-kanban-amber/60 bg-kanban-amber/10' : 'border-[#262A33]/80 hover:bg-[#111318]/70'}`}>
                                            <input
                                                type="radio"
                                                name="modoMagazine"
                                                checked={modoMagazineLocal === opt.key}
                                                onChange={() => setModoMagazineLocal(opt.key)}
                                                className="mt-1 accent-amber-500"
                                            />
                                            <div>
                                                <span className="font-bold text-[#E7E9ED] text-sm">{opt.label}</span>
                                                <p className="text-xs text-[#7B808F] mt-0.5">{opt.hint}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <label className="flex items-start gap-3 p-3 bg-[#111318]/70 border border-[#262A33]/80 rounded-xl text-xs text-[#E7E9ED] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={baixaEstoqueSetupLocal}
                                        onChange={(e) => setBaixaEstoqueSetupLocal(e.target.checked)}
                                        className="mt-0.5 accent-amber-500"
                                    />
                                    <span>Descontar estoque de fresas/insertos automaticamente ao montar magazine completo no setup</span>
                                </label>

                                <div className="flex justify-end">
                                    <Button type="submit" variant="primary" size="md">Salvar Preferências Ferramental</Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Turnos */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Clock className="text-[#7B808F] w-5 h-5" />
                                <h3 className="text-lg font-bold text-white">Dimensionamento de Turnos</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSalvarTurnos} className="space-y-6">
                                <div className="flex gap-3 items-end bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl">
                                    <div className="flex-1">
                                        <label className={titleClasses}>Adicionar Novo Turno</label>
                                        <input
                                            type="text"
                                            value={novoTurnoNome}
                                            onChange={e => setNovoTurnoNome(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTurno(e);
                                                }
                                            }}
                                            placeholder="Ex: Turno da Noite"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleAddTurno}
                                        variant="primary"
                                        size="md"
                                        className="px-4 h-[44px] shrink-0"
                                        disabled={!novoTurnoNome.trim()}
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {turnosLocal.map((turno, index) => (
                                        <div key={turno.id} className="bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl relative group">
                                            <div className="flex items-center justify-between mb-3">
                                                <input
                                                    type="text"
                                                    value={turno.nome}
                                                    onChange={(e) => handleTurnoChange(index, 'nome', e.target.value)}
                                                    className="font-semibold text-white bg-transparent border-b border-transparent hover:border-[#333844] focus:border-kanban-amber focus:outline-none px-1 text-sm w-2/3"
                                                />
                                                {turnosLocal.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTurno(turno.id)}
                                                        className="text-[#565B68] hover:text-[#C85558] transition-colors p-1"
                                                        title="Remover Turno"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-semibold text-[#565B68] uppercase tracking-widest mb-1">Início</label>
                                                    <input
                                                        type="time"
                                                        value={turno.inicio}
                                                        onChange={(e) => handleTurnoChange(index, 'inicio', e.target.value)}
                                                        className="w-full p-2 border border-[#262A33] rounded-lg text-[#E7E9ED] text-xs font-bold bg-[#181B22] focus:border-kanban-amber outline-none"
                                                        required
                                                    />
                                                </div>
                                                <span className="text-[#565B68] font-bold mt-4">-</span>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-semibold text-[#565B68] uppercase tracking-widest mb-1">Fim</label>
                                                    <input
                                                        type="time"
                                                        value={turno.fim}
                                                        onChange={(e) => handleTurnoChange(index, 'fim', e.target.value)}
                                                        className="w-full p-2 border border-[#262A33] rounded-lg text-[#E7E9ED] text-xs font-bold bg-[#181B22] focus:border-kanban-amber outline-none"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" variant="primary" size="md">
                                        Salvar Turnos
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== ABA 2: RECURSOS (MÁQUINAS & PROGRAMADORES) ========== */}
            {activeTab === 'recursos' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-modal-in">
                    {/* Máquinas */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Monitor className="text-cyan-400 w-5 h-5" />
                                <div>
                                    <h3 className="text-lg font-bold text-white">Máquinas do Parque Fabril</h3>
                                    <p className="text-xs font-bold text-[#565B68]">
                                        {maquinas.length} máquinas cadastradas
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <form onSubmit={handleAddMaquina} className="flex flex-col sm:flex-row gap-3 items-end bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl">
                                <div className="flex-1 w-full">
                                    <label className={titleClasses}>Identificação da Máquina</label>
                                    <input
                                        type="text"
                                        value={novaMaquinaNome}
                                        onChange={e => setNovaMaquinaNome(e.target.value)}
                                        placeholder="Ex: ROMI D800 / Charmilles"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="w-full sm:w-44">
                                    <label className={titleClasses}>Setor Produtivo</label>
                                    <select
                                        value={novaMaquinaSetor}
                                        onChange={e => setNovaMaquinaSetor(e.target.value)}
                                        className={inputClasses}
                                    >
                                        <option value="CNC">Centro CNC</option>
                                        <option value="EDM_FIO">EDM Fio</option>
                                        <option value="TORNO">Torno CNC</option>
                                    </select>
                                </div>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    className="px-4 h-[44px] w-full sm:w-auto shrink-0"
                                    disabled={!novaMaquinaNome.trim()}
                                >
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </form>

                            <div className="space-y-2.5">
                                <h4 className="text-xs font-semibold text-[#565B68] uppercase tracking-widest">Máquinas Ativas</h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {maquinas.map((m) => (
                                        <div key={m.id} className="flex items-center justify-between bg-[#111318]/80 px-4 py-3 border border-[#262A33]/80 rounded-xl group hover:border-[#333844] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <p className="font-bold text-sm text-white">{m.nome}</p>
                                                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                                                    m.setor === 'EDM_FIO' 
                                                        ? 'bg-emerald-950/80 border-emerald-500/50 text-[#4A9D74]' 
                                                        : m.setor === 'TORNO'
                                                        ? 'bg-amber-950/80 border-amber-500/50 text-[#D97D3D]'
                                                        : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
                                                }`}>
                                                    {m.setor === 'EDM_FIO' ? 'EDM Fio' : m.setor === 'TORNO' ? 'Torno' : 'CNC'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removerComAviso(() => removeMaquina(m.id), 'máquina')}
                                                className="text-[#565B68] hover:text-[#C85558] p-1.5 rounded-lg transition-colors"
                                                title="Remover máquina"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {maquinas.length === 0 && (
                                        <p className="text-xs text-[#565B68] border border-dashed border-[#262A33] rounded-xl py-6 text-center">Nenhuma máquina cadastrada.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Programadores */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Layers className="text-[#D97D3D] w-5 h-5" />
                                <div>
                                    <h3 className="text-lg font-bold text-white">Programadores CAM</h3>
                                    <p className="text-xs font-bold text-[#565B68]">
                                        {programadores.length} programadores cadastrados
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <form onSubmit={handleAddProgramador} className="flex flex-col sm:flex-row gap-3 items-end bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl">
                                <div className="flex-1 w-full">
                                    <label className={titleClasses}>Nome do Programador</label>
                                    <input
                                        type="text"
                                        value={novoProgramador}
                                        onChange={e => setNovoProgramador(e.target.value)}
                                        placeholder="Ex: Roberto CAM"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="w-full sm:w-44">
                                    <label className={titleClasses}>Setor de Atuação</label>
                                    <select
                                        value={novoProgramadorSetor}
                                        onChange={e => setNovoProgramadorSetor(e.target.value)}
                                        className={inputClasses}
                                    >
                                        <option value="CNC">CNC</option>
                                        <option value="EDM_FIO">EDM Fio</option>
                                        <option value="TORNO">Torno</option>
                                        <option value="TODOS">Toda Fábrica</option>
                                    </select>
                                </div>
                                <Button type="submit" variant="primary" size="md" className="px-4 h-[44px] w-full sm:w-auto shrink-0" disabled={!novoProgramador.trim()}>
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </form>

                            <div className="space-y-2.5">
                                <h4 className="text-xs font-semibold text-[#565B68] uppercase tracking-widest">Programadores Ativos</h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {programadores.map((prog) => (
                                        <div key={prog.id} className="flex items-center justify-between bg-[#111318]/80 px-4 py-3 border border-[#262A33]/80 rounded-xl group hover:border-[#333844] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-sm text-white">{prog.nome}</span>
                                                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                                                    prog.setor === 'EDM_FIO' 
                                                        ? 'bg-emerald-950/80 border-emerald-500/50 text-[#4A9D74]' 
                                                        : prog.setor === 'TORNO'
                                                        ? 'bg-amber-950/80 border-amber-500/50 text-[#D97D3D]'
                                                        : prog.setor === 'CNC'
                                                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
                                                        : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-400'
                                                }`}>
                                                    {prog.setor === 'EDM_FIO' ? 'EDM Fio' : prog.setor === 'TORNO' ? 'Torno' : prog.setor === 'CNC' ? 'CNC' : 'Toda Fábrica'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removerComAviso(() => removeProgramador(prog.id), 'programador')}
                                                className="text-[#565B68] hover:text-[#C85558] p-1.5 rounded-lg transition-colors"
                                                title="Remover programador"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {programadores.length === 0 && (
                                        <p className="text-xs text-[#565B68] text-center border border-dashed border-[#262A33] rounded-xl py-6">Nenhum programador cadastrado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== ABA 3: EQUIPE & ACESSOS ========== */}
            {activeTab === 'equipe' && (
                <div className="space-y-8 animate-modal-in">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Operadores do Chão de Fábrica */}
                        <div className={cardClasses}>
                            <div className={headerClasses}>
                                <div className="flex items-center gap-3">
                                    <Users className="text-kanban-amber w-5 h-5" />
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Operadores de Chão de Fábrica</h3>
                                        <p className="text-xs font-bold text-[#565B68]">Usado na assinatura de setup, troca e inspeções</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <form onSubmit={handleAddOperador} className="space-y-3 bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl">
                                    <label className={titleClasses}>Nome e Setor do Operador</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            value={novoOperador}
                                            onChange={e => setNovoOperador(e.target.value)}
                                            placeholder="Ex: Pedro Oliveira"
                                            className={inputClasses}
                                        />
                                        <select
                                            value={novoOperadorSetor}
                                            onChange={e => setNovoOperadorSetor(e.target.value)}
                                            className={inputClasses + " sm:w-48"}
                                        >
                                            <option value="TODOS">Toda Fábrica</option>
                                            <option value="CNC">Centro CNC</option>
                                            <option value="EDM_FIO">EDM Fio</option>
                                            <option value="TORNO">Torno CNC</option>
                                        </select>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="h-[44px] px-4 shrink-0"
                                            disabled={!novoOperador.trim()}
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </form>

                                <div className="space-y-2">
                                    <h5 className="text-[10px] font-semibold text-[#565B68] uppercase tracking-widest">
                                        Operadores Registrados ({operadores.length})
                                    </h5>
                                    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                        {operadores.map((op) => (
                                            <div key={op.id} className="flex items-center justify-between bg-[#111318]/80 px-4 py-2.5 border border-[#262A33]/80 rounded-xl group hover:border-[#333844] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-sm text-[#E7E9ED]">{op.nome}</span>
                                                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                                                        op.setor === 'EDM_FIO' 
                                                            ? 'bg-emerald-950/80 border-emerald-500/50 text-[#4A9D74]' 
                                                            : op.setor === 'TORNO'
                                                            ? 'bg-amber-950/80 border-amber-500/50 text-[#D97D3D]'
                                                            : op.setor === 'CNC'
                                                            ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
                                                            : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-400'
                                                    }`}>
                                                        {op.setor === 'EDM_FIO' ? 'EDM Fio' : op.setor === 'TORNO' ? 'Torno' : op.setor === 'CNC' ? 'CNC' : 'Toda Fábrica'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => removerComAviso(() => removeOperador(op.id), 'operador')}
                                                    className="text-[#565B68] hover:text-[#C85558] p-1.5 rounded-lg transition-colors"
                                                    title="Remover nome"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {operadores.length === 0 && (
                                            <p className="text-xs text-[#565B68] italic text-center py-6 border border-dashed border-[#262A33] rounded-xl">Nenhum operador cadastrado.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PIN Master & Link de Entrada */}
                        <div className={cardClasses}>
                            <div className={headerClasses}>
                                <div className="flex items-center gap-3">
                                    <Zap className="text-[#D97D3D] w-5 h-5" />
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Terminais de Fábrica & PIN</h3>
                                        <p className="text-xs font-bold text-[#565B68]">Acesso simplificado sem necessidade de senha</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="bg-[#111318]/80 p-4 rounded-xl border border-[#262A33]/80 space-y-2">
                                    <p className="text-[10px] font-bold text-[#7B808F] uppercase tracking-widest">
                                        Link de Entrada Direta para Terminais
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs text-kanban-blue font-mono truncate select-all flex-1 bg-[#181B22] p-2.5 rounded-lg border border-[#262A33]">
                                            {`${window.location.origin}/join/${codigoConvite}`}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/join/${codigoConvite}`);
                                                setToastMsg('Link copiado!');
                                                setTimeout(() => setToastMsg(''), 2000);
                                            }}
                                            className="p-2.5 bg-[#1F232B] hover:bg-[#333844] rounded-lg text-[#E7E9ED] hover:text-[#E7E9ED] transition-all shrink-0"
                                            title="Copiar Link"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-[#111318]/80 p-4 rounded-xl border border-[#262A33]/80 space-y-3">
                                    <label className="block text-xs font-semibold text-[#D97D3D] uppercase tracking-widest">PIN Master da Fábrica</label>
                                    <p className="text-xs text-[#7B808F]">PIN de 4 dígitos para liberação do Kanban nos tablets e autorizações administrativas.</p>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D97D3D]" />
                                            <input
                                                type="text"
                                                maxLength={4}
                                                value={pinLocal}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                    setPinLocal(val);
                                                }}
                                                className="w-full bg-[#181B22] border border-[#262A33] rounded-xl py-2.5 pl-10 pr-3 text-white font-mono font-semibold text-lg tracking-[0.3em] focus:border-kanban-amber outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    await salvarConfiguracoes(configuracaoDaTela());
                                                    setToastMsg('PIN Master atualizado!');
                                                    setTimeout(() => setToastMsg(''), 2500);
                                                } catch (err) {
                                                    setToastMsg('Erro ao salvar PIN: ' + err.message);
                                                    setTimeout(() => setToastMsg(''), 3500);
                                                }
                                            }}
                                            className="px-4 py-2.5 bg-kanban-amber text-[#111318] font-semibold rounded-xl text-xs uppercase tracking-widest hover:bg-[#c46d32] transition-colors shadow-sm"
                                        >
                                            Salvar PIN
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contas de Acesso com E-mail */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-emerald-500 w-5 h-5" />
                                <h3 className="text-lg font-bold text-white">Contas de Acesso (Login com E-mail)</h3>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(usuarios || []).map((u) => (
                                    <div key={u.id} className="p-4 bg-[#111318]/80 border border-[#262A33]/80 rounded-xl flex items-center justify-between hover:border-[#333844] transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-lg ${u.funcao === 'admin' ? 'bg-amber-500/15 text-[#D97D3D] border border-amber-500/30' : 'bg-[#1F232B] text-[#7B808F]'}`}>
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-white truncate max-w-[140px]">{u.email || 'Usuário'}</p>
                                                <p className="text-[9px] font-semibold text-[#565B68] uppercase tracking-widest">{u.funcao === 'admin' ? 'Admin Master' : 'Acesso Padrão'}</p>
                                            </div>
                                        </div>

                                        {u.id !== user?.id && (
                                            <button
                                                onClick={async () => {
                                                    if (!window.confirm(`Remover ${u.email}?`)) return;
                                                    const { removeUserFromEquipe } = useAppStore.getState();
                                                    try {
                                                        await removeUserFromEquipe(u.id);
                                                        setToastMsg('Conta removida!');
                                                    } catch (err) {
                                                        setToastMsg('Erro ao remover conta: ' + err.message);
                                                    }
                                                    setTimeout(() => setToastMsg(''), 3000);
                                                }}
                                                className="p-1.5 text-[#565B68] hover:text-[#C85558] rounded-lg transition-colors"
                                                title="Remover conta"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== ABA 4: AUTOMAÇÃO & MANUTENÇÃO ========== */}
            {activeTab === 'automacao' && (
                <div className="space-y-6 animate-modal-in">
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Bot className="text-kanban-teal w-5 h-5" />
                                <div>
                                    <h3 className="text-lg font-bold text-white">Nova Rotina Periódica Automática</h3>
                                    <p className="text-xs font-bold text-[#565B68]">O sistema criará automaticamente cartões no Kanban no ciclo programado</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleAddKanbanAuto} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className={titleClasses}>Tipo de Rotina</label>
                                    <select
                                        value={kbTipo}
                                        onChange={(e) => setKbTipo(e.target.value)}
                                        className={inputClasses}
                                        required
                                    >
                                        <option value="" disabled>Selecione uma rotina...</option>
                                        <option value="Manutenção Preditiva">Manutenção Preditiva</option>
                                        <option value="Alinhamento de Fio">Alinhamento de Fio</option>
                                        <option value="Manutenção Corretiva">Manutenção Corretiva</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                    {kbTipo === 'Outros' && (
                                        <div className="mt-3">
                                            <input
                                                type="text"
                                                value={kbOutros}
                                                onChange={(e) => setKbOutros(e.target.value)}
                                                className={inputClasses}
                                                placeholder="Descrição personalizada"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className={titleClasses}>Máquina Vinculada</label>
                                    <select
                                        value={kbMaquina}
                                        onChange={(e) => setKbMaquina(e.target.value)}
                                        className={inputClasses}
                                        required
                                    >
                                        <option value="" disabled>Selecione a máquina...</option>
                                        {maquinas.map(m => (
                                            <option key={m.id} value={m.nome}>{m.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={titleClasses}>Intervalo do Gatilho</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                value={kbDias}
                                                onChange={(e) => setKbDias(e.target.value)}
                                                min="1"
                                                className={inputClasses + " pr-12"}
                                                placeholder="30"
                                                required
                                            />
                                            <span className="absolute right-3 top-3 text-[#565B68] font-bold text-xs">dias</span>
                                        </div>
                                        <Button type="submit" variant="primary" size="md" className="px-4 shrink-0">
                                            <Plus className="w-5 h-5 mr-1" /> Criar
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Lista de Rotinas Ativas */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-[#565B68] uppercase tracking-widest px-1">
                            Rotinas Ativas ({kanbansAutomaticos.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kanbansAutomaticos.map((kb) => (
                                <div key={kb.id} className="flex flex-col justify-between bg-[#181B22]/90 p-5 border border-[#262A33]/80 rounded-xl hover:border-[#333844] transition-colors group">
                                    <div>
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="inline-flex items-center gap-1.5 bg-kanban-teal/10 text-kanban-teal border border-kanban-teal/20 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                <RefreshCw className="w-3 h-3" /> A cada {kb.diasIntervalo} dias
                                            </span>
                                            <button
                                                onClick={() => removerComAviso(() => removeKanbanAutomatico(kb.id), 'rotina')}
                                                className="text-[#565B68] hover:text-[#C85558] rounded p-1 transition-colors"
                                                title="Remover rotina"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="font-bold text-base text-white leading-snug mb-2">{kb.descricao}</p>
                                        <div className="flex items-center gap-2">
                                            <Monitor className="w-3.5 h-3.5 text-[#565B68]" />
                                            <p className="text-xs font-bold text-[#7B808F] uppercase tracking-wider">{kb.maquinaNome || 'Máquina não definida'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {kanbansAutomaticos.length === 0 && (
                                <p className="col-span-full text-xs text-[#565B68] border border-dashed border-[#262A33] rounded-xl text-center py-8">
                                    Nenhuma rotina automática programada.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Feedback */}
            {toastMsg && (
                <div className={`fixed bottom-6 right-6 ${toastMsg.startsWith('Erro') ? 'bg-[#C85558] border-red-500' : 'bg-emerald-600 border-emerald-500'} text-white border px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2.5 z-[300] animate-modal-in`}>
                    <Zap className="w-4 h-4 text-white/80" />
                    {toastMsg}
                </div>
            )}
        </div>
    );
}
