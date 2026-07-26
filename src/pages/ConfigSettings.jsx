import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/common/Button';
import { Plus, Trash2, Settings2, Zap, ShieldCheck, Users, Monitor, Bot, DollarSign, Copy } from 'lucide-react';

export default function ConfigSettings() {
    const {
        configuracoesGlobais, atualizarConfiguracoes, salvarConfiguracoes,
        maquinas, addMaquina, removeMaquina,
        operadores, addOperador, removeOperador,
        programadores, addProgramador, removeProgramador,
        kanbansAutomaticos, addKanbanAutomatico, removeKanbanAutomatico,
        usuarios, updateUserRole
    } = useAppStore();

    const { user, empresaId, codigoConvite } = useAuthStore();

    // Estado Local das Configs Globais (Para não engasgar o Input c/ Supastore em cada tecla)
    const [custoHoraLocal, setCustoHoraLocal] = useState(configuracoesGlobais?.custoHoraMaquina || 50);
    const [toastMsg, setToastMsg] = useState('');
    const [turnosLocal, setTurnosLocal] = useState(configuracoesGlobais?.turnos || [
        { id: 't1', nome: 'Turno 1', inicio: '07:30', fim: '15:30' },
        { id: 't2', nome: 'Turno 2', inicio: '15:30', fim: '23:30' },
        { id: 't3', nome: 'Turno 3', inicio: '23:30', fim: '07:30' }
    ]);
    const [pinLocal, setPinLocal] = useState(configuracoesGlobais?.pinOnboarding ?? '1234');

    // Mantém o pinLocal sincronizado com o valor vindo do Supabase
    useEffect(() => {
        if (configuracoesGlobais?.pinOnboarding) {
            setPinLocal(configuracoesGlobais.pinOnboarding);
        }
    }, [configuracoesGlobais?.pinOnboarding]);

    const handleTurnoChange = (index, field, value) => {
        const novosTurnos = [...turnosLocal];
        novosTurnos[index] = { ...novosTurnos[index], [field]: value };
        setTurnosLocal(novosTurnos);
    }

    const handleAddTurno = (e) => {
        e.preventDefault();
        if (novoTurnoNome.trim()) {
            setTurnosLocal([
                ...turnosLocal,
                { id: `t${Date.now()}`, nome: novoTurnoNome.trim(), inicio: '08:00', fim: '18:00' }
            ]);
            setNovoTurnoNome('');
        }
    };

    const handleRemoveTurno = (idToRemove) => {
        setTurnosLocal(turnosLocal.filter(t => t.id !== idToRemove));
    };

    const handleSalvarCustoHora = async (e) => {
        e.preventDefault();
        try {
            await salvarConfiguracoes({
                custoHoraMaquina: parseFloat(custoHoraLocal) || 50,
                turnos: configuracoesGlobais?.turnos || turnosLocal,
                pinOnboarding: configuracoesGlobais?.pinOnboarding ?? pinLocal ?? '1234'
            });
            setToastMsg('Custo Hora Atualizado com Sucesso!');
        } catch (err) {
            setToastMsg('Erro ao salvar: ' + err.message);
        }
        setTimeout(() => setToastMsg(''), 3500);
    };

    const handleSalvarTurnos = async (e) => {
        e.preventDefault();
        try {
            await salvarConfiguracoes({
                custoHoraMaquina: configuracoesGlobais?.custoHoraMaquina || custoHoraLocal,
                turnos: turnosLocal,
                pinOnboarding: configuracoesGlobais?.pinOnboarding ?? pinLocal ?? '1234'
            });
            setToastMsg('Janelas de Turnos Salvas com Sucesso!');
        } catch (err) {
            setToastMsg('Erro ao salvar: ' + err.message);
        }
        setTimeout(() => setToastMsg(''), 3500);
    };

    const [novaMaquinaNome, setNovaMaquinaNome] = useState('');
    const [novoOperador, setNovoOperador] = useState('');
    const [novoProgramador, setNovoProgramador] = useState('');
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
            setToastMsg('Limite do plano atingido. Entre em contato para adicionar mais máquinas.');
            setTimeout(() => setToastMsg(''), 4000);
            return;
        }
        const nomeTrim = novaMaquinaNome.trim();
        if (nomeTrim && !maquinas.some(m => m.nome === nomeTrim)) {
            try {
                await addMaquina(nomeTrim);
                setNovaMaquinaNome('');
                setToastMsg('Máquina adicionada!');
                setTimeout(() => setToastMsg(''), 2500);
            } catch (err) {
                setToastMsg('Erro: ' + err.message);
                setTimeout(() => setToastMsg(''), 3500);
            }
        }
    };

    const handleAddOperador = async (e) => {
        e.preventDefault();
        if (novoOperador.trim()) {
            try {
                await addOperador(novoOperador.trim());
                setNovoOperador('');
                setToastMsg('Operador adicionado!');
                setTimeout(() => setToastMsg(''), 2500);
            } catch (err) {
                setToastMsg('Erro: ' + err.message);
                setTimeout(() => setToastMsg(''), 3500);
            }
        }
    };

    const handleAddProgramador = async (e) => {
        e.preventDefault();
        if (novoProgramador.trim()) {
            try {
                await addProgramador(novoProgramador.trim());
                setNovoProgramador('');
                setToastMsg('Programador adicionado!');
                setTimeout(() => setToastMsg(''), 2500);
            } catch (err) {
                setToastMsg('Erro: ' + err.message);
                setTimeout(() => setToastMsg(''), 3500);
            }
        }
    };

    const handleAddKanbanAuto = async (e) => {
        e.preventDefault();
        if (kbTipo && kbDias) {
            const diasInt = parseInt(kbDias);
            if (diasInt > 0) {
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
                    setToastMsg('Regra Automática adicionada!');
                    setTimeout(() => setToastMsg(''), 2500);
                } catch (err) {
                    setToastMsg('Erro: ' + err.message);
                    setTimeout(() => setToastMsg(''), 3500);
                }
            }
        }
    };

    const inputClasses = "w-full p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-1 focus:ring-kanban-amber/50 text-slate-100 text-base font-bold bg-slate-950 placeholder-slate-600 transition-colors";
    const titleClasses = "block text-sm font-bold text-slate-300 mb-2 tracking-wide";
    const cardClasses = "bg-slate-900 rounded-xl shadow-md border border-slate-800 overflow-hidden";
    const headerClasses = "bg-slate-950/50 px-5 py-4 border-b border-slate-800 flex items-center gap-3";

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div>
                <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                    <Settings2 className="w-8 h-8 text-kanban-amber" />
                    Configurações do Sistema
                </h2>
                <p className="text-slate-400 mt-2 text-base font-medium">
                    Gerencie recursos e rotinas automáticas de manutenção no chão de fábrica.
                </p>
            </div>

            {/* ---------- PARÂMETROS FINANCEIROS (DASHBOARD) ---------- */}
            <div className={cardClasses}>
                <div className={headerClasses}>
                    <DollarSign className="text-emerald-600 w-6 h-6" />
                    <h3 className="text-xl font-bold text-white">Parâmetros Financeiros e OEE</h3>
                </div>
                <div className="p-5 flex flex-col gap-6">
                    <form onSubmit={handleSalvarCustoHora} className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div className="w-full lg:w-2/3">
                            <label className={titleClasses}>
                                Custo Hora / Máquina (R$)
                                <span className="block text-xs font-normal text-slate-500 mt-1 mb-3">Sua Despesa Operacional Fixa por Hora. Usado para provisionamento e painel Custo-Benefício.</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-500 font-extrabold text-sm">R$</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={custoHoraLocal}
                                    onChange={e => setCustoHoraLocal(e.target.value)}
                                    className={`${inputClasses} pl-10`}
                                />
                            </div>
                        </div>
                        <Button type="submit" variant="primary" size="lg" className="px-8 h-[52px] shadow-sm whitespace-nowrap">
                            Salvar Custo
                        </Button>
                    </form>

                    <form onSubmit={handleSalvarTurnos} className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 shadow-sm">
                        <div className="w-full">
                            <label className={titleClasses}>
                                Dimensionamento de Turnos
                                <span className="block text-xs font-normal text-slate-500 mt-1 mb-4">Gerencie as janelas de tempo de sua fábrica. O Dashboard cruza esse escopo nas medições analíticas.</span>
                            </label>

                            <div className="flex gap-3 items-end mb-6 bg-slate-900 p-4 border border-slate-800 rounded-xl shadow-sm">
                                <div className="flex-1">
                                    <label className={titleClasses}>Adicionar Novo Turno</label>
                                    <input
                                        type="text"
                                        value={novoTurnoNome}
                                        onChange={e => setNovoTurnoNome(e.target.value)}
                                        placeholder="Ex: Turno da Madrugada"
                                        className={inputClasses}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleAddTurno}
                                    variant="primary"
                                    size="lg"
                                    className="px-5 shadow-sm h-[52px]"
                                    disabled={!novoTurnoNome.trim()}
                                >
                                    <Plus className="w-6 h-6" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                {turnosLocal.map((turno, index) => (
                                    <div key={turno.id} className="bg-slate-950/50 p-4 border border-slate-800 rounded-lg shadow-sm relative group">
                                        <div className="flex items-center justify-between mb-3">
                                            <input
                                                type="text"
                                                value={turno.nome}
                                                onChange={(e) => handleTurnoChange(index, 'nome', e.target.value)}
                                                className="font-extrabold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-kanban-amber focus:outline-none px-1 w-2/3"
                                            />
                                            {turnosLocal.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTurno(turno.id)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                    title="Remover Turno"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Início</label>
                                                <input
                                                    type="time"
                                                    value={turno.inicio}
                                                    onChange={(e) => handleTurnoChange(index, 'inicio', e.target.value)}
                                                    className="w-full p-2 border border-slate-700 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-1 focus:ring-kanban-amber/50 text-slate-100 font-bold bg-slate-900"
                                                    required
                                                />
                                            </div>
                                            <span className="text-slate-400 font-bold mt-5">-</span>
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Fim</label>
                                                <input
                                                    type="time"
                                                    value={turno.fim}
                                                    onChange={(e) => handleTurnoChange(index, 'fim', e.target.value)}
                                                    className="w-full p-2 border border-slate-700 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-1 focus:ring-kanban-amber/50 text-slate-100 font-bold bg-slate-900"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {turnosLocal.length === 0 && (
                                    <div className="col-span-full p-6 text-center border border-dashed border-slate-700 rounded-lg text-slate-400 font-bold bg-slate-900/50">
                                        Nenhum turno configurado. O Dashboard analisará o dia inteiro.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end mt-4 pt-4 border-t border-slate-800">
                            <Button type="submit" variant="primary" size="lg" className="px-8 h-[52px] shadow-sm whitespace-nowrap">
                                Salvar Turnos
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ---------- MÁQUINAS ---------- */}
                <div className={cardClasses}>
                    <div className={headerClasses}>
                        <Monitor className="text-slate-700 w-6 h-6" />
                        <div>
                            <h3 className="text-xl font-bold text-white">Máquinas (EDM)</h3>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">
                                {maquinas.length} / {(configuracoesGlobais?.limiteMaquinas ?? 999) < 999 ? configuracoesGlobais.limiteMaquinas : '∞'} máquinas
                            </p>
                        </div>
                    </div>

                    <div className="p-5 space-y-8">
                        {maquinas.length >= (configuracoesGlobais?.limiteMaquinas ?? 999) && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-amber-200 text-sm font-bold">
                                Limite do plano atingido. Entre em contato para adicionar mais máquinas.
                            </div>
                        )}
                        <form onSubmit={handleAddMaquina} className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className={titleClasses}>Adicionar Nova Máquina</label>
                                <input
                                    type="text"
                                    value={novaMaquinaNome}
                                    onChange={e => setNovaMaquinaNome(e.target.value)}
                                    placeholder="Nome ou identificação"
                                    className={inputClasses}
                                    disabled={maquinas.length >= (configuracoesGlobais?.limiteMaquinas ?? 999)}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="px-5 shadow-sm h-[52px]"
                                disabled={!novaMaquinaNome.trim() || maquinas.length >= (configuracoesGlobais?.limiteMaquinas ?? 999)}
                            >
                                <Plus className="w-6 h-6" />
                            </Button>
                        </form>

                        <div>
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Cadastradas</h4>
                            <ul className="space-y-3">
                                {maquinas.map((m) => (
                                    <li key={m.id} className="flex items-center justify-between bg-slate-950/50 px-4 py-3 border border-slate-800 rounded-lg group">
                                        <p className="font-extrabold text-lg text-white">{m.nome}</p>
                                        <button
                                            onClick={() => removeMaquina(m.id)}
                                            className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"
                                            title="Remover máquina"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </li>
                                ))}
                                {maquinas.length === 0 && (
                                    <p className="text-base text-slate-400 border border-dashed border-slate-700 rounded-xl py-6 text-center font-bold bg-slate-900/50">Nenhuma máquina cadastrada.</p>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ---------- RECURSOS HUMANOS (PROGRAMADORES) ---------- */}
                <div className="space-y-6">
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <Users className="text-kanban-amber w-6 h-6" />
                            <h3 className="text-xl font-bold text-white">Programadores</h3>
                        </div>

                        <div className="p-5 space-y-6">
                            <form onSubmit={handleAddProgramador} className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <label className={titleClasses}>Adicionar Programador</label>
                                    <input
                                        type="text"
                                        value={novoProgramador}
                                        onChange={e => setNovoProgramador(e.target.value)}
                                        placeholder="Nome do Programador"
                                        className={inputClasses}
                                    />
                                </div>
                                <Button type="submit" variant="primary" size="lg" className="px-5 shadow-sm h-[52px]" disabled={!novoProgramador.trim()}>
                                    <Plus className="w-6 h-6" />
                                </Button>
                            </form>

                            <ul className="space-y-3">
                                {programadores.map((prog) => (
                                    <li key={prog.id} className="flex items-center justify-between bg-slate-950/50 px-4 py-3 border border-slate-800 rounded-lg group">
                                        <span className="font-extrabold text-lg text-white">{prog.nome}</span>
                                        <button
                                            onClick={() => removeProgramador(prog.id)}
                                            className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"
                                            title="Remover programador"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </li>
                                ))}
                                {programadores.length === 0 && (
                                    <p className="text-base text-slate-400 text-center border border-dashed border-slate-700 rounded-xl py-4 font-bold bg-slate-900/50">Nenhum programador.</p>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* ---------- KANBANS AUTOMÁTICOS ---------- */}
            <div className={cardClasses}>
                <div className={headerClasses}>
                    <Bot className="text-kanban-teal w-6 h-6" />
                    <h3 className="text-xl font-bold text-white">Kanbans Automáticos (Manutenção & Rotinas)</h3>
                </div>

                <div className="p-5">
                    <form onSubmit={handleAddKanbanAuto} className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                            <div className="col-span-1 md:col-span-2 space-y-4">
                                <div>
                                    <label className={titleClasses}>Tipo de Rotina / Kanban</label>
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
                                </div>
                                {kbTipo === 'Outros' && (
                                    <div className="mt-4">
                                        <label className={titleClasses}>Descrição Personalizada</label>
                                        <input
                                            type="text"
                                            value={kbOutros}
                                            onChange={(e) => setKbOutros(e.target.value)}
                                            className={inputClasses}
                                            placeholder="Ex: Troca de Fluido Refrigerante"
                                            required
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className={titleClasses}>Máquina Associada</label>
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
                            </div>

                            <div className="flex flex-col">
                                <label className={titleClasses}>Gatilho de Criação</label>
                                <div className="flex gap-3 items-center">
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            value={kbDias}
                                            onChange={(e) => setKbDias(e.target.value)}
                                            min="1"
                                            className={inputClasses + " pr-12"}
                                            placeholder="Ex: 30"
                                            required
                                        />
                                        <span className="absolute right-4 top-3.5 text-slate-500 font-extrabold text-sm">dias</span>
                                    </div>
                                    <Button type="submit" variant="primary" size="lg" className="px-6 h-[52px] shadow-sm">
                                        <Plus className="w-6 h-6" />
                                    </Button>
                                </div>
                                <p className="text-xs font-bold text-slate-500 mt-3 pl-1 leading-snug">O sistema gerará um Kanban automaticamente neste ciclo.</p>
                            </div>
                        </div>
                    </form>

                    <div className="space-y-4">
                        <h4 className="font-extrabold text-lg text-white mb-2 px-1 uppercase tracking-wider">Rotinas Ativas</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kanbansAutomaticos.map((kb) => (
                                <div key={kb.id} className="flex flex-col justify-between bg-slate-950/50 p-5 border border-slate-800 rounded-xl shadow-sm hover:border-kanban-amber transition-colors group">
                                    <div>
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="inline-block bg-kanban-amber text-slate-900 border border-kanban-amber/20 text-xs font-extrabold px-3 py-1.5 rounded-md uppercase tracking-wider shadow-sm">
                                                A cada {kb.diasIntervalo} dias
                                            </span>
                                            <button
                                                onClick={() => removeKanbanAutomatico(kb.id)}
                                                className="text-slate-400 hover:bg-red-100 hover:text-red-500 rounded p-1.5 transition-colors"
                                                title="Remover rotina"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <p className="font-extrabold text-lg text-white leading-tight">{kb.descricao}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Monitor className="w-3.5 h-3.5 text-slate-500" />
                                            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">{kb.maquinaNome || 'Máquina não definida'}</p>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">ID: {kb.id}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {kanbansAutomaticos.length === 0 && (
                            <p className="text-base text-slate-400 border border-dashed border-slate-700 rounded-xl text-center font-bold py-10 bg-slate-900/50">
                                Nenhuma rotina automática programada. As rotinas programadas aparecerão na linha do Kanban 'A fazer'.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ---------- GESTÃO DA EQUIPE (UNIFICADO) ---------- */}
            <div className={cardClasses}>
                <div className={headerClasses}>
                    <Users className="text-kanban-amber w-6 h-6" />
                    <h3 className="text-xl font-bold text-white">Gestão da Equipe (Operadores e Acessos)</h3>
                </div>

                <div className="p-6">
                    {/* Gestão Dual: Manual + Link */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
                        {/* Lado A: Cadastro Manual (Lista de nomes da equipe) */}
                        <div className="bg-slate-950/40 p-8 rounded-3xl border border-slate-800 shadow-inner group transition-all hover:border-slate-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-kanban-blue/20 rounded-xl flex items-center justify-center border border-kanban-blue/30">
                                    <Plus className="w-5 h-5 text-kanban-blue" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">Cadastrar nomes de operadores</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lista usada para selecionar quem operou a máquina ou fez a troca</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddOperador} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome a exibir nos registros</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={novoOperador}
                                            onChange={e => setNovoOperador(e.target.value)}
                                            placeholder="Ex: Pedro Oliveira"
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-bold focus:border-kanban-blue outline-none transition-all placeholder:text-slate-700 shadow-sm"
                                        />
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="bg-kanban-blue hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-95 transition-all h-[52px]"
                                            disabled={!novoOperador.trim()}
                                        >
                                            <Plus className="w-6 h-6" />
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            <div className="mt-8">
                                <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-kanban-blue rounded-full"></div>
                                    Lista de operadores para registro ({operadores.length})
                                </h5>
                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {operadores.map((op) => (
                                        <div key={op.id} className="flex items-center justify-between bg-slate-900/50 px-4 py-3 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors">
                                            <span className="font-bold text-slate-200">{op.nome}</span>
                                            <button
                                                onClick={() => removeOperador(op.id)}
                                                className="text-slate-600 hover:text-red-500 p-2 rounded-lg transition-colors"
                                                title="Remover nome da lista"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {operadores.length === 0 && (
                                        <p className="text-xs text-slate-600 italic text-center py-6 border border-dashed border-slate-800 rounded-xl">Nenhum nome cadastrado na lista.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Lado B: Acesso de Terminais (Link + PIN) */}
                        <div className="bg-slate-950/40 p-8 rounded-3xl border border-slate-800 shadow-inner relative overflow-hidden transition-all hover:border-slate-700">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-kanban-amber/5 blur-[60px] rounded-full"></div>

                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="w-10 h-10 bg-kanban-amber/20 rounded-xl flex items-center justify-center border border-kanban-amber/30">
                                    <Zap className="w-5 h-5 text-kanban-amber" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">Acesso de terminais (Kanban)</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Use este link + PIN para liberar telas de Kanban em qualquer dispositivo</p>
                                </div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="bg-slate-900/80 px-4 py-4 rounded-xl border border-slate-800 mb-3 shadow-inner space-y-3">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        1. Copie e envie este link para o terminal
                                    </p>
                                    <div className="flex items-center overflow-hidden">
                                        <code className="text-sm text-kanban-blue font-mono truncate select-all flex-1">
                                            {`${window.location.origin}/join/${codigoConvite}`}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/join/${codigoConvite}`);
                                                setToastMsg('Link copiado!');
                                                setTimeout(() => setToastMsg(''), 2000);
                                            }}
                                            className="ml-3 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all shadow-sm"
                                            title="Copiar Link"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        O terminal abrirá uma tela pedindo apenas o PIN abaixo. Não é necessário e‑mail ou senha.
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-slate-800/50">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">2. Defina o PIN de Segurança do terminal</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex-1">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                            <input
                                                type="text"
                                                maxLength={4}
                                                value={pinLocal}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    // Garante no máximo 4 dígitos
                                                    val = val.slice(0, 4);
                                                    setPinLocal(val);
                                                }}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white font-black text-xl tracking-[0.3em] focus:border-kanban-amber outline-none shadow-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    await salvarConfiguracoes({
                                                        custoHoraMaquina: configuracoesGlobais?.custoHoraMaquina || custoHoraLocal,
                                                        turnos: configuracoesGlobais?.turnos || turnosLocal,
                                                        pinOnboarding: pinLocal || '1234'
                                                    });
                                                    setToastMsg('PIN atualizado com sucesso!');
                                                    setTimeout(() => setToastMsg(''), 2500);
                                                } catch (err) {
                                                    setToastMsg('Erro ao salvar PIN: ' + err.message);
                                                    setTimeout(() => setToastMsg(''), 3500);
                                                }
                                            }}
                                            className="px-3 py-2 bg-kanban-amber/10 border border-kanban-amber/20 rounded-lg shrink-0 text-[10px] font-black text-kanban-amber uppercase tracking-widest hover:bg-kanban-amber/20 transition-colors"
                                        >
                                            Salvar PIN
                                        </button>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-tight">
                                        O operador só entra no Kanban se estiver com o link desta empresa e souber este PIN.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-14">
                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            Contas de Acesso (Login com E-mail)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(usuarios || []).map((u) => (
                                <div key={u.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-all shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${u.funcao === 'admin' ? 'bg-kanban-amber/20 text-kanban-amber' : 'bg-slate-800 text-slate-400'}`}>
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-black text-white truncate max-w-[140px]">{u.email || 'Usuário'}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{u.funcao === 'admin' ? 'Admin Master' : 'Acesso Full'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {u.id !== user?.id && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Remover ${u.email}?`)) {
                                                        const { removeUserFromEquipe } = useAppStore.getState();
                                                        removeUserFromEquipe(u.id);
                                                        setToastMsg('Conta removido!');
                                                        setTimeout(() => setToastMsg(''), 2000);
                                                    }
                                                }}
                                                className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Remover conta da fábrica"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Toast Feedback mechanism */}
            {toastMsg && (
                <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl font-bold translate-y-0 transition-transform flex items-center gap-3 z-50">
                    <Zap className="w-5 h-5 text-emerald-200" />
                    {toastMsg}
                </div>
            )}
        </div>
    );
}
