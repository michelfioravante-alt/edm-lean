import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/common/Button';
import {
    Plus, Trash2, Settings2, Zap, ShieldCheck, Users, Monitor,
    Bot, DollarSign, Copy, Clock, Cpu, Key, Link2, RefreshCw,
    AlertCircle
} from 'lucide-react';

// ─── Input / Label helpers ───────────────────────────────────────────────────
const inputCls = "w-full p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-1 focus:ring-kanban-amber/30 text-slate-100 text-sm font-semibold bg-slate-950 placeholder-slate-600 transition-colors";
const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5";

function SectionHeader({ icon: Icon, color = 'text-kanban-amber', title, subtitle }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-base font-extrabold text-white leading-none">{title}</h3>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function EmptyState({ label }) {
    return (
        <div className="border border-dashed border-slate-800 rounded-xl py-8 text-center">
            <p className="text-slate-600 text-sm font-bold">{label}</p>
        </div>
    );
}

function ResourceItem({ name, onRemove, accent = 'bg-slate-800 text-slate-300' }) {
    return (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-lg group hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-black ${accent}`}>
                    {name.charAt(0).toUpperCase()}
                </span>
                <span className="font-semibold text-slate-200 text-sm">{name}</span>
            </div>
            <button
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

function AddRow({ placeholder, value, onChange, onSubmit, disabled }) {
    return (
        <form onSubmit={onSubmit} className="flex gap-2">
            <input type="text" value={value} onChange={onChange} placeholder={placeholder}
                className={inputCls + " flex-1"} disabled={disabled} />
            <button type="submit" disabled={!value.trim() || disabled}
                className="px-4 py-2 bg-kanban-amber hover:bg-yellow-400 text-slate-900 font-extrabold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm shrink-0">
                <Plus className="w-4 h-4" />
            </button>
        </form>
    );
}

const TABS = [
    { id: 'parametros', label: 'Parâmetros', icon: DollarSign },
    { id: 'recursos', label: 'Máquinas & Turnos', icon: Cpu },
    { id: 'equipe', label: 'Equipe & Acesso', icon: Users },
    { id: 'automacao', label: 'Automação', icon: Bot },
];

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
    const [activeTab, setActiveTab] = useState('parametros');
    const [toastMsg, setToastMsg] = useState('');

    useEffect(() => {
        fetchConfiguracoes(); fetchMaquinas(); fetchOperadores();
        fetchProgramadores(); fetchAutoKanbans(); fetchUsuarios();
    }, []);

    const toast = (msg, ms = 2500) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), ms); };

    // Parâmetros state
    const [custoHoraLocal, setCustoHoraLocal] = useState(configuracoesGlobais?.custoHoraMaquina || 50);
    const [turnosLocal, setTurnosLocal] = useState(configuracoesGlobais?.turnos || [
        { id: 't1', nome: 'Turno 1', inicio: '07:30', fim: '15:30' },
        { id: 't2', nome: 'Turno 2', inicio: '15:30', fim: '23:30' },
        { id: 't3', nome: 'Turno 3', inicio: '23:30', fim: '07:30' }
    ]);
    const [pinLocal, setPinLocal] = useState(configuracoesGlobais?.pinOnboarding ?? '1234');
    const [novoTurnoNome, setNovoTurnoNome] = useState('');

    useEffect(() => {
        if (configuracoesGlobais) {
            if (configuracoesGlobais.custoHoraMaquina !== undefined) setCustoHoraLocal(configuracoesGlobais.custoHoraMaquina);
            if (Array.isArray(configuracoesGlobais.turnos) && configuracoesGlobais.turnos.length > 0) setTurnosLocal(configuracoesGlobais.turnos);
            if (configuracoesGlobais.pinOnboarding !== undefined) setPinLocal(configuracoesGlobais.pinOnboarding);
        }
    }, [configuracoesGlobais]);

    const handleTurnoChange = (index, field, value) => {
        const t = [...turnosLocal]; t[index] = { ...t[index], [field]: value }; setTurnosLocal(t);
    };
    const handleAddTurno = (e) => {
        if (e) e.preventDefault();
        const nome = (novoTurnoNome || '').trim();
        if (!nome) return;
        setTurnosLocal(prev => [...prev, { id: `t${Date.now()}`, nome, inicio: '08:00', fim: '18:00' }]);
        setNovoTurnoNome('');
        toast('Turno adicionado. Clique em "Salvar Turnos".');
    };
    const handleSalvarCustoHora = async (e) => {
        e.preventDefault();
        try {
            await salvarConfiguracoes({ custoHoraMaquina: parseFloat(custoHoraLocal) || 50, turnos: configuracoesGlobais?.turnos || turnosLocal, pinOnboarding: configuracoesGlobais?.pinOnboarding ?? pinLocal ?? '1234' });
            toast('Custo/hora salvo!');
        } catch (err) { toast('Erro: ' + err.message, 3500); }
    };
    const handleSalvarTurnos = async (e) => {
        e.preventDefault();
        try {
            await salvarConfiguracoes({ custoHoraMaquina: configuracoesGlobais?.custoHoraMaquina || custoHoraLocal, turnos: turnosLocal, pinOnboarding: configuracoesGlobais?.pinOnboarding ?? pinLocal ?? '1234' });
            toast('Turnos salvos!');
        } catch (err) { toast('Erro: ' + err.message, 3500); }
    };

    // Recursos state
    const [novaMaquinaNome, setNovaMaquinaNome] = useState('');
    const [novoProgramador, setNovoProgramador] = useState('');
    const handleAddMaquina = async (e) => {
        e.preventDefault();
        const limite = configuracoesGlobais?.limiteMaquinas ?? 999;
        const nome = novaMaquinaNome.trim();
        if (!nome) return;
        if (maquinas.length >= limite) { toast('Limite do plano atingido.', 3500); return; }
        if (maquinas.some(m => m.nome?.toLowerCase() === nome.toLowerCase())) { toast('Máquina já cadastrada!', 3000); return; }
        try { await addMaquina(nome); setNovaMaquinaNome(''); toast('Máquina adicionada!'); }
        catch (err) { toast('Erro: ' + err.message, 3500); }
    };
    const handleAddProgramador = async (e) => {
        e.preventDefault();
        const nome = novoProgramador.trim();
        if (!nome) return;
        if (programadores.some(p => p.nome?.toLowerCase() === nome.toLowerCase())) { toast('Já cadastrado!', 2500); return; }
        try { await addProgramador(nome); setNovoProgramador(''); toast('Programador adicionado!'); }
        catch (err) { toast('Erro: ' + err.message, 3500); }
    };

    // Equipe state
    const [novoOperador, setNovoOperador] = useState('');
    const handleAddOperador = async (e) => {
        e.preventDefault();
        const nome = novoOperador.trim();
        if (!nome) return;
        if (operadores.some(o => o.nome?.toLowerCase() === nome.toLowerCase())) { toast('Já cadastrado!', 2500); return; }
        try { await addOperador(nome); setNovoOperador(''); toast('Operador adicionado!'); }
        catch (err) { toast('Erro: ' + err.message, 3500); }
    };

    // Automação state
    const [kbTipo, setKbTipo] = useState('');
    const [kbOutros, setKbOutros] = useState('');
    const [kbMaquina, setKbMaquina] = useState('');
    const [kbDias, setKbDias] = useState('');
    const handleAddKanbanAuto = async (e) => {
        e.preventDefault();
        if (!kbTipo || !kbDias) { toast('Preencha rotina e dias.', 3000); return; }
        const dias = parseInt(kbDias);
        if (isNaN(dias) || dias <= 0) { toast('Dias inválido.', 3000); return; }
        try {
            const descricao = kbTipo === 'Outros' ? kbOutros : kbTipo;
            await addKanbanAutomatico({ descricao, diasIntervalo: dias, maquinaNome: kbMaquina });
            setKbTipo(''); setKbOutros(''); setKbMaquina(''); setKbDias('');
            toast('Rotina criada!');
        } catch (err) { toast('Erro: ' + err.message, 3500); }
    };

    return (
        <div className="w-full pb-10 flex flex-col gap-0">

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-kanban-amber/10 rounded-xl border border-kanban-amber/20">
                    <Settings2 className="w-7 h-7 text-kanban-amber" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-white leading-none">Configurações</h2>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">Parâmetros operacionais, equipe e automações da fábrica</p>
                </div>
            </div>

            <div className="flex gap-0 border-b border-slate-800 mb-8 overflow-x-auto no-scrollbar">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all -mb-px ${active ? 'border-kanban-amber text-kanban-amber' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}>
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'parametros' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <SectionHeader icon={DollarSign} color="text-emerald-400" title="Custo Hora / Máquina" subtitle="Base para cálculo financeiro no Dashboard" />
                        <form onSubmit={handleSalvarCustoHora} className="space-y-4">
                            <div>
                                <label className={labelCls}>Valor por hora (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-3 text-slate-500 font-bold text-sm">R$</span>
                                    <input type="number" min="1" step="0.01" value={custoHoraLocal} onChange={e => setCustoHoraLocal(e.target.value)} className={inputCls + " pl-10"} />
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">Usado para calcular o valor gerado por O.S aprovadas e o custo de refugos e pausas no Dashboard.</p>
                            <div className="flex justify-end">
                                <button type="submit" className="px-6 py-2.5 bg-kanban-amber hover:bg-yellow-400 text-slate-900 font-extrabold rounded-lg transition-colors text-sm">Salvar</button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <SectionHeader icon={Clock} color="text-kanban-steel" title="Janelas de Turno" subtitle="Usado para filtro de turno no Dashboard" />
                        <form onSubmit={handleSalvarTurnos} className="space-y-4">
                            <div className="flex gap-2">
                                <input type="text" value={novoTurnoNome} onChange={e => setNovoTurnoNome(e.target.value)}
                                    placeholder="Nome do turno (ex: Turno Noturno)" className={inputCls + " flex-1 text-xs"}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTurno(e))} />
                                <button type="button" onClick={handleAddTurno} disabled={!novoTurnoNome.trim()}
                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg border border-slate-700 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {turnosLocal.map((t, idx) => (
                                    <div key={t.id} className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                                        <input type="text" value={t.nome} onChange={e => handleTurnoChange(idx, 'nome', e.target.value)}
                                            className="flex-1 bg-transparent text-white text-sm font-bold focus:outline-none min-w-0" />
                                        <input type="time" value={t.inicio} onChange={e => handleTurnoChange(idx, 'inicio', e.target.value)}
                                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded-md px-2 py-1 focus:outline-none focus:border-kanban-amber w-[90px]" />
                                        <span className="text-slate-600 text-xs">–</span>
                                        <input type="time" value={t.fim} onChange={e => handleTurnoChange(idx, 'fim', e.target.value)}
                                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded-md px-2 py-1 focus:outline-none focus:border-kanban-amber w-[90px]" />
                                        {turnosLocal.length > 1 && (
                                            <button type="button" onClick={() => setTurnosLocal(turnosLocal.filter(x => x.id !== t.id))}
                                                className="text-slate-700 hover:text-red-400 transition-colors p-1">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {turnosLocal.length === 0 && <EmptyState label="Nenhum turno configurado." />}
                            </div>
                            <div className="flex justify-end pt-1">
                                <button type="submit" className="px-6 py-2.5 bg-kanban-amber hover:bg-yellow-400 text-slate-900 font-extrabold rounded-lg transition-colors text-sm">Salvar Turnos</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'recursos' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-5">
                        <SectionHeader icon={Monitor} color="text-kanban-teal" title="Máquinas EDM"
                            subtitle={`${maquinas.length} / ${(configuracoesGlobais?.limiteMaquinas ?? 999) < 999 ? configuracoesGlobais.limiteMaquinas : 'ilimitadas'} cadastradas`} />
                        {maquinas.length >= (configuracoesGlobais?.limiteMaquinas ?? 999) && (
                            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2.5 text-xs font-bold text-amber-300">
                                <AlertCircle className="w-4 h-4 shrink-0" />Limite do plano atingido.
                            </div>
                        )}
                        <AddRow placeholder="Nome ou identificação da máquina" value={novaMaquinaNome}
                            onChange={e => setNovaMaquinaNome(e.target.value)} onSubmit={handleAddMaquina}
                            disabled={maquinas.length >= (configuracoesGlobais?.limiteMaquinas ?? 999)} />
                        <div className="space-y-2 flex-1">
                            {maquinas.map(m => <ResourceItem key={m.id} name={m.nome} accent="bg-kanban-teal/10 text-kanban-teal" onRemove={() => removeMaquina(m.id)} />)}
                            {maquinas.length === 0 && <EmptyState label="Nenhuma máquina cadastrada." />}
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-5">
                        <SectionHeader icon={Users} color="text-kanban-amber" title="Programadores CNC/EDM" subtitle="Responsáveis pelo setup e programação das O.S." />
                        <AddRow placeholder="Nome do programador" value={novoProgramador}
                            onChange={e => setNovoProgramador(e.target.value)} onSubmit={handleAddProgramador} />
                        <div className="space-y-2 flex-1">
                            {programadores.map(p => <ResourceItem key={p.id} name={p.nome} accent="bg-kanban-amber/10 text-kanban-amber" onRemove={() => removeProgramador(p.id)} />)}
                            {programadores.length === 0 && <EmptyState label="Nenhum programador cadastrado." />}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'equipe' && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-5">
                            <SectionHeader icon={Users} color="text-kanban-steel" title="Operadores de Chão" subtitle="Lista para seleção nos registros de O.S." />
                            <AddRow placeholder="Nome do operador (ex: João Silva)" value={novoOperador}
                                onChange={e => setNovoOperador(e.target.value)} onSubmit={handleAddOperador} />
                            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                                {operadores.map(op => <ResourceItem key={op.id} name={op.nome} accent="bg-kanban-steel/10 text-kanban-steel" onRemove={() => removeOperador(op.id)} />)}
                                {operadores.length === 0 && <EmptyState label="Nenhum operador cadastrado." />}
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-kanban-amber/5 blur-[60px] rounded-full pointer-events-none" />
                            <SectionHeader icon={Link2} color="text-kanban-amber" title="Acesso de Terminais" subtitle="Link + PIN para liberar o Kanban em qualquer dispositivo" />
                            <div className="space-y-5 relative z-10">
                                <div>
                                    <label className={labelCls}>1. Link de acesso</label>
                                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                                        <code className="text-xs text-kanban-steel font-mono truncate flex-1 select-all">
                                            {`${window.location.origin}/join/${codigoConvite}`}
                                        </code>
                                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${codigoConvite}`); toast('Link copiado!', 2000); }}
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors shrink-0">
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1.5">O operador acessa este link e insere o PIN — sem e-mail ou senha.</p>
                                </div>
                                <div>
                                    <label className={labelCls}>2. PIN de segurança</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                            <input type="text" maxLength={4} value={pinLocal}
                                                onChange={e => setPinLocal(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white font-black text-xl tracking-[0.5em] focus:border-kanban-amber outline-none transition-colors" />
                                        </div>
                                        <button onClick={async () => {
                                            try {
                                                await salvarConfiguracoes({ custoHoraMaquina: configuracoesGlobais?.custoHoraMaquina || custoHoraLocal, turnos: configuracoesGlobais?.turnos || turnosLocal, pinOnboarding: pinLocal || '1234' });
                                                toast('PIN salvo!');
                                            } catch (err) { toast('Erro: ' + err.message, 3500); }
                                        }} className="px-4 py-3 bg-kanban-amber/10 border border-kanban-amber/20 rounded-lg text-xs font-extrabold text-kanban-amber uppercase tracking-wider hover:bg-kanban-amber/20 transition-colors shrink-0">
                                            Salvar PIN
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <SectionHeader icon={ShieldCheck} color="text-emerald-400" title="Contas com Login" subtitle="Usuários com acesso por e-mail e senha" />
                        {(usuarios || []).length === 0 ? <EmptyState label="Nenhum usuário encontrado." /> : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {(usuarios || []).map(u => (
                                    <div key={u.id} className="flex items-center gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors group">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${u.funcao === 'admin' ? 'bg-kanban-amber/20 text-kanban-amber' : 'bg-slate-800 text-slate-400'}`}>
                                            {(u.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{u.email || 'Usuário'}</p>
                                            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${u.funcao === 'admin' ? 'text-kanban-amber' : 'text-slate-500'}`}>
                                                {u.funcao === 'admin' ? '★ Admin' : 'Operador'}
                                            </span>
                                        </div>
                                        {u.id !== user?.id && (
                                            <button onClick={() => { if (window.confirm(`Remover ${u.email}?`)) { const { removeUserFromEquipe } = useAppStore.getState(); removeUserFromEquipe(u.id); toast('Conta removida.'); } }}
                                                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 p-1 rounded-lg transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'automacao' && (
                <div className="flex flex-col gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <SectionHeader icon={Bot} color="text-kanban-teal" title="Nova Rotina Automática" subtitle="O sistema criará um Kanban de manutenção no ciclo configurado" />
                        <form onSubmit={handleAddKanbanAuto} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelCls}>Tipo de rotina</label>
                                <select value={kbTipo} onChange={e => setKbTipo(e.target.value)} className={inputCls} required>
                                    <option value="" disabled>Selecionar...</option>
                                    <option value="Manutenção Preditiva">Manutenção Preditiva</option>
                                    <option value="Alinhamento de Fio">Alinhamento de Fio</option>
                                    <option value="Manutenção Corretiva">Manutenção Corretiva</option>
                                    <option value="Outros">Outros...</option>
                                </select>
                                {kbTipo === 'Outros' && (
                                    <input type="text" value={kbOutros} onChange={e => setKbOutros(e.target.value)}
                                        className={inputCls + " mt-2"} placeholder="Descrição personalizada" required />
                                )}
                            </div>
                            <div>
                                <label className={labelCls}>Máquina associada</label>
                                <select value={kbMaquina} onChange={e => setKbMaquina(e.target.value)} className={inputCls} required>
                                    <option value="" disabled>Selecionar...</option>
                                    {maquinas.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Intervalo (dias)</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input type="number" value={kbDias} onChange={e => setKbDias(e.target.value)}
                                            min="1" placeholder="30" className={inputCls + " pr-12"} required />
                                        <span className="absolute right-3 top-3 text-slate-500 text-xs font-bold">dias</span>
                                    </div>
                                    <button type="submit" className="px-4 py-2 bg-kanban-teal hover:bg-teal-400 text-slate-900 font-extrabold rounded-lg transition-colors text-sm flex items-center gap-1.5 shrink-0">
                                        <Plus className="w-4 h-4" />Criar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Rotinas Ativas ({kanbansAutomaticos.length})</h4>
                        {kanbansAutomaticos.length === 0 ? <EmptyState label="Nenhuma rotina programada." /> : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {kanbansAutomaticos.map(kb => (
                                    <div key={kb.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="inline-flex items-center gap-1 bg-kanban-teal/10 text-kanban-teal border border-kanban-teal/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                <RefreshCw className="w-2.5 h-2.5" />A cada {kb.diasIntervalo}d
                                            </span>
                                            <button onClick={() => removeKanbanAutomatico(kb.id)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 p-1 rounded-lg transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="font-bold text-white text-sm mb-2">{kb.descricao}</p>
                                        <div className="flex items-center gap-1.5">
                                            <Monitor className="w-3 h-3 text-slate-500" />
                                            <p className="text-xs text-slate-500">{kb.maquinaNome || 'Sem máquina'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {toastMsg && (
                <div className={`fixed bottom-6 right-6 ${toastMsg.startsWith('Erro') ? 'bg-red-600 border-red-500' : 'bg-emerald-600 border-emerald-500'} text-white border px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2.5 z-[300]`}
                    style={{ animation: 'modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                    <Zap className="w-4 h-4 text-white/80" />{toastMsg}
                </div>
            )}
        </div>
    );
}
