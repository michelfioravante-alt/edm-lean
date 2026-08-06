import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/common/Button';
import { Plus, Trash2, Settings2, Zap, ShieldCheck, Users, Monitor, Bot, DollarSign, Copy, Wrench } from 'lucide-react';
import { ESTRATEGIA_FERRAMENTAL_OPTIONS } from '../constants/cncProcess';

export default function ConfigSettings() {
    const {
        configuracoesGlobais, atualizarConfiguracoes, salvarConfiguracoes,
        fetchConfiguracoes, fetchMaquinas, fetchOperadores, fetchProgramadores, fetchAutoKanbans, fetchUsuarios,
        maquinas, addMaquina, removeMaquina,
        operadores, addOperador, removeOperador,
        programadores, addProgramador, removeProgramador,
        kanbansAutomaticos, addKanbanAutomatico, removeKanbanAutomatico,
        usuarios, updateUserRole
    } = useAppStore();

    const { user, empresaId, codigoConvite } = useAuthStore();

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
    });


    // As remoções são disparadas direto do onClick; sem isso uma falha do service
    // vira promise rejeitada no console e a tela não muda nem avisa nada.
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
    }

    const handleAddTurno = (e) => {
        if (e) e.preventDefault();
        const nomeTrim = (novoTurnoNome || '').trim();
        if (nomeTrim) {
            setTurnosLocal(prev => [
                ...prev,
                { id: `t${Date.now()}`, nome: nomeTrim, inicio: '08:00', fim: '18:00' }
            ]);
            setNovoTurnoNome('');
            setToastMsg('Turno adicionado à lista! Clique em "Salvar Turnos" abaixo para gravar no banco.');
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
            setToastMsg('Custo Hora Atualizado com Sucesso!');
        } catch (err) {
            setToastMsg('Erro ao salvar: ' + err.message);
        }
        setTimeout(() => setToastMsg(''), 3500);
    };

    const handleSalvarTurnos = async (e) => {
        e.preventDefault();
        try {
            await salvarConfiguracoes(configuracaoDaTela());
            setToastMsg('Janelas de Turnos Salvas com Sucesso!');
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
            setToastMsg('Erro: Limite do plano atingido. Entre em contato para adicionar mais máquinas.');
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
                    <form onSubmit={handleSalvarCustoHora} className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 shadow-sm space-y-6">
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">Custos Hora Diferenciados por Setor (R$/h)</h4>
                            <p className="text-xs font-medium text-slate-400">Defina a taxa horária de cada tecnologia para obter relatórios de rentabilidade fabril 100% realistas.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className={titleClasses}>
                                    🌀 Usinagem CNC (R$/h)
                                </label>
                                <div className="relative mt-2">
                                    <span className="absolute left-4 top-3.5 text-cyan-400 font-extrabold text-sm">R$</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={custoHoraCncLocal}
                                        onChange={e => setCustoHoraCncLocal(e.target.value)}
                                        className={`${inputClasses} pl-10 border-cyan-500/30 focus:border-cyan-400`}
                                    />
                                </div>
                                <span className="block text-[10px] text-slate-500 mt-1">Usinagem 3, 4 e 5 eixos.</span>
                            </div>

                            <div>
                                <label className={titleClasses}>
                                    ⚡ Eletroerosão a Fio (R$/h)
                                </label>
                                <div className="relative mt-2">
                                    <span className="absolute left-4 top-3.5 text-emerald-400 font-extrabold text-sm">R$</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={custoHoraEdmLocal}
                                        onChange={e => setCustoHoraEdmLocal(e.target.value)}
                                        className={`${inputClasses} pl-10 border-emerald-500/30 focus:border-emerald-400`}
                                    />
                                </div>
                                <span className="block text-[10px] text-slate-500 mt-1">Inclui fio de latão + desionizador.</span>
                            </div>

                            <div>
                                <label className={titleClasses}>
                                    🏭 Custo Padrão / Geral (R$/h)
                                </label>
                                <div className="relative mt-2">
                                    <span className="absolute left-4 top-3.5 text-indigo-400 font-extrabold text-sm">R$</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={custoHoraLocal}
                                        onChange={e => setCustoHoraLocal(e.target.value)}
                                        className={`${inputClasses} pl-10`}
                                    />
                                </div>
                                <span className="block text-[10px] text-slate-500 mt-1">Bancada, ajuste e outros.</span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" variant="primary" size="lg" className="px-8 h-[48px] shadow-sm whitespace-nowrap">
                                Salvar Custos por Setor
                            </Button>
                        </div>
                    </form>


                    <form onSubmit={handleSalvarMagazine} className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 shadow-sm space-y-4">
                        <div>
                            <label className={titleClasses}>
                                <Wrench className="inline w-4 h-4 mr-1 text-kanban-amber" />
                                Ferramentas — modo padrão
                                <span className="block text-xs font-normal text-slate-500 mt-1">
                                    Padrão ao entrar no Setup; cada O.S. pode mudar (ex.: peça longa = magazine completo).
                                </span>
                            </label>
                            <div className="space-y-2 mt-3">
                                {ESTRATEGIA_FERRAMENTAL_OPTIONS.map((opt) => (
                                    <label key={opt.key} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${modoMagazineLocal === opt.key ? 'border-kanban-amber bg-kanban-amber/10' : 'border-slate-800'}`}>
                                        <input
                                            type="radio"
                                            name="modoMagazine"
                                            checked={modoMagazineLocal === opt.key}
                                            onChange={() => setModoMagazineLocal(opt.key)}
                                            className="mt-1"
                                        />
                                        <div>
                                            <span className="font-bold text-slate-200 text-sm">{opt.label}</span>
                                            <p className="text-xs text-slate-500">{opt.hint}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <label className="flex items-start gap-2 mt-4 text-sm text-slate-400">
                                <input
                                    type="checkbox"
                                    checked={baixaEstoqueSetupLocal}
                                    onChange={(e) => setBaixaEstoqueSetupLocal(e.target.checked)}
                                    className="mt-1"
                                />
                                <span>Descontar estoque ao montar magazine completo no setup (senão só registra na máquina; quebra desconta depois)</span>
                            </label>
                        </div>
                        <Button type="submit" variant="primary" size="lg">Salvar preferências de ferramentas</Button>
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
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTurno(e);
                                            }
                                        }}
                                        placeholder="Ex: Turno da Madrugada"
                                        className={inputClasses}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleAddTurno}
                                    variant="primary"
                                    size="lg"
                                    className="px-5 shadow-sm h-[52px] shrink-0"
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
                        <form onSubmit={handleAddMaquina} className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 w-full">
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
                            <div className="w-full sm:w-48">
                                <label className={titleClasses}>Setor da Máquina</label>
                                <select
                                    value={novaMaquinaSetor}
                                    onChange={e => setNovaMaquinaSetor(e.target.value)}
                                    className={inputClasses}
                                >
                                    <option value="CNC">🌀 CNC</option>
                                    <option value="EDM_FIO">⚡ EDM Fio</option>
                                    <option value="TORNO">⚙️ Torno CNC</option>
                                </select>
                            </div>
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="px-5 shadow-sm h-[52px] w-full sm:w-auto"
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
                                        <div className="flex items-center gap-3">
                                            <p className="font-extrabold text-lg text-white">{m.nome}</p>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                                m.setor === 'EDM_FIO' 
                                                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
                                                    : m.setor === 'TORNO'
                                                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                                                    : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
                                            }`}>
                                                {m.setor === 'EDM_FIO' ? '⚡ EDM Fio' : m.setor === 'TORNO' ? '⚙️ Torno' : '🌀 CNC'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removerComAviso(() => removeMaquina(m.id), 'máquina')}
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
                            <form onSubmit={handleAddProgramador} className="flex flex-col sm:flex-row gap-3 items-end">
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
                                <div className="w-full sm:w-48">
                                    <label className={titleClasses}>Setor do Programador</label>
                                    <select
                                        value={novoProgramadorSetor}
                                        onChange={e => setNovoProgramadorSetor(e.target.value)}
                                        className={inputClasses}
                                    >
                                        <option value="CNC">🌀 CNC</option>
                                        <option value="EDM_FIO">⚡ EDM Fio</option>
                                        <option value="TORNO">⚙️ Torno CNC</option>
                                        <option value="TODOS">🏢 Todos (Toda Fábrica)</option>
                                    </select>
                                </div>
                                <Button type="submit" variant="primary" size="lg" className="px-5 shadow-sm h-[52px] w-full sm:w-auto" disabled={!novoProgramador.trim()}>
                                    <Plus className="w-6 h-6" />
                                </Button>
                            </form>

                            <ul className="space-y-3">
                                {programadores.map((prog) => (
                                    <li key={prog.id} className="flex items-center justify-between bg-slate-950/50 px-4 py-3 border border-slate-800 rounded-lg group">
                                        <div className="flex items-center gap-3">
                                            <span className="font-extrabold text-lg text-white">{prog.nome}</span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                                prog.setor === 'EDM_FIO' 
                                                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
                                                    : prog.setor === 'TORNO'
                                                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                                                    : prog.setor === 'CNC'
                                                    ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
                                                    : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-400'
                                            }`}>
                                                {prog.setor === 'EDM_FIO' ? '⚡ EDM Fio' : prog.setor === 'TORNO' ? '⚙️ Torno' : prog.setor === 'CNC' ? '🌀 CNC' : '🏢 Toda Fábrica'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removerComAviso(() => removeProgramador(prog.id), 'programador')}
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
                                                onClick={() => removerComAviso(() => removeKanbanAutomatico(kb.id), 'rotina')}
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
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome e Setor do Operador</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            value={novoOperador}
                                            onChange={e => setNovoOperador(e.target.value)}
                                            placeholder="Ex: Pedro Oliveira"
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-bold focus:border-kanban-blue outline-none transition-all placeholder:text-slate-700 shadow-sm"
                                        />
                                        <select
                                            value={novoOperadorSetor}
                                            onChange={e => setNovoOperadorSetor(e.target.value)}
                                            className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-3 text-white font-bold text-xs focus:border-kanban-blue outline-none cursor-pointer"
                                        >
                                            <option value="TODOS">🏢 Todos (Toda Fábrica)</option>
                                            <option value="CNC">🌀 Centro de Usinagem CNC</option>
                                            <option value="EDM_FIO">⚡ Eletroerosão a Fio (EDM)</option>
                                            <option value="TORNO">⚙️ Torno CNC</option>
                                        </select>
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
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-200">{op.nome}</span>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                                    op.setor === 'EDM_FIO' 
                                                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
                                                        : op.setor === 'TORNO'
                                                        ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                                                        : op.setor === 'CNC'
                                                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
                                                        : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-400'
                                                }`}>
                                                    {op.setor === 'EDM_FIO' ? '⚡ EDM Fio' : op.setor === 'TORNO' ? '⚙️ Torno' : op.setor === 'CNC' ? '🌀 CNC' : '🏢 Toda Fábrica'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removerComAviso(() => removeOperador(op.id), 'operador')}
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
                                    <label className="block text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">2. Defina o PIN Master da Fábrica & Terminais</label>
                                    <p className="text-[10px] font-bold text-slate-500 mb-3">Este PIN de 4 dígitos é usado para proteger o acesso à Visão de Gerência/Financeira e para conectar terminais de fábrica.</p>
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex-1">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
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
                                                    await salvarConfiguracoes(configuracaoDaTela());
                                                    setToastMsg('PIN Master atualizado com sucesso!');
                                                    setTimeout(() => setToastMsg(''), 2500);
                                                } catch (err) {
                                                    setToastMsg('Erro ao salvar PIN: ' + err.message);
                                                    setTimeout(() => setToastMsg(''), 3500);
                                                }
                                            }}
                                            className="px-4 py-3 bg-kanban-amber text-slate-950 font-black border border-amber-400 rounded-xl shrink-0 text-xs uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-md"
                                        >
                                            Salvar PIN Master
                                        </button>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-tight">
                                        Qualquer alteração aqui passa a valer imediatamente no modal de desbloqueio de gerência e nos terminais.
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
                <div className={`fixed bottom-6 right-6 ${toastMsg.startsWith('Erro') ? 'bg-red-600 border-red-500' : 'bg-emerald-600 border-emerald-500'} text-white border px-6 py-3 rounded-xl shadow-2xl font-extrabold translate-y-0 transition-all flex items-center gap-3 z-50`}>
                    <Zap className="w-5 h-5 text-white/90" />
                    {toastMsg}
                </div>
            )}
        </div>
    );
}
