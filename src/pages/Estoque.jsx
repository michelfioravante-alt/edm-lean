import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/common/Button';
import { Plus, Package, Archive, AlertTriangle, PenTool, Clock, Trash2, Wrench, Monitor, ArrowDownCircle, ArrowUpCircle, History, Lock } from 'lucide-react';
import { formatarDataBR, formatarHoras } from '../utils/formatters';
import InsumosLifeChart from '../components/dashboard/InsumosLifeChart';
import MachineConsumptionChart from '../components/dashboard/MachineConsumptionChart';
import ConfirmDeleteEstoqueModal from '../components/estoque/ConfirmDeleteEstoqueModal';
import MovimentarEstoqueModal from '../components/estoque/MovimentarEstoqueModal';

export default function Estoque() {
    const {
        estoque,
        addEstoqueItem,
        consumirEstoqueItem,
        removeEstoqueItem,
        maquinas,
        operadores,
        historicoConsumiveis,
        historicoQuebrasEstoque,
        ferramentasMaquina,
        registrarTrocaConsumivel,
        movimentacoesEstoque,
        fetchMovimentacoesEstoque
    } = useAppStore();

    const role = useAuthStore(state => state.role);
    const setorPadrao = useAuthStore(state => state.setorPadrao);
    const isProgrammerLocked = role !== 'admin';
    const effectiveSector = (setorPadrao && setorPadrao !== 'TODOS') ? setorPadrao : 'CNC';

    useEffect(() => {
        fetchMovimentacoesEstoque();
    }, [fetchMovimentacoesEstoque]);

    // Estado Novo Item
    const [novoNome, setNovoNome] = useState('');
    const [novaQtd, setNovaQtd] = useState('');
    const [novoAlerta, setNovoAlerta] = useState('');
    const [novoSetor, setNovoSetor] = useState(isProgrammerLocked ? effectiveSector : 'TODOS');
    const [setorFiltro, setSetorFiltro] = useState(isProgrammerLocked ? effectiveSector : 'TODOS');

    // Estado Deleção de Estoque
    const [itemParaDeletar, setItemParaDeletar] = useState(null);
    const [erro, setErro] = useState('');

    // Movimentação (entrada/saída) — guarda o item e o tipo com que o modal abre
    const [movimentacao, setMovimentacao] = useState(null);

    // Estado Registro de Troca na Máquina
    const [trocaMaquina, setTrocaMaquina] = useState('');
    const [trocaInsumo, setTrocaInsumo] = useState('');
    const [trocaOperador, setTrocaOperador] = useState('');

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (novoNome.trim() && novaQtd && novoAlerta) {
            setErro('');
            try {
                await addEstoqueItem(novoNome.trim(), novaQtd, novoAlerta, novoSetor);
                setNovoNome('');
                setNovaQtd('');
                setNovoAlerta('');
                setNovoSetor('TODOS');
            } catch (err) {
                setErro(`Não foi possível cadastrar o item: ${err.message}`);
            }
        }
    };


    const handleRegistrarTroca = (e) => {
        e.preventDefault();
        if (trocaMaquina && trocaInsumo && trocaOperador) {
            registrarTrocaConsumivel(trocaMaquina, trocaInsumo, trocaOperador);
            setTrocaMaquina('');
            setTrocaInsumo('');
            setTrocaOperador('');
        }
    };

    const handleConfirmDelete = async (itemId) => {
        setErro('');
        try {
            await removeEstoqueItem(itemId);
        } catch (err) {
            setErro(`Não foi possível excluir o item: ${err.message}`);
        }
        setItemParaDeletar(null);
    };

    const inputClasses = "w-full p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-1 focus:ring-kanban-amber/50 text-slate-100 text-base font-bold bg-slate-950 placeholder-slate-600 transition-colors";
    const titleClasses = "block text-sm font-bold text-slate-300 mb-2 tracking-wide";
    const cardClasses = "bg-slate-900 rounded-xl shadow-md border border-slate-800 overflow-hidden";
    const headerClasses = "bg-slate-950/50 px-5 py-4 border-b border-slate-800 flex items-center gap-3";

    const ferramentasPorMaquina = (ferramentasMaquina || []).reduce((acc, f) => {
        const key = f.maquinaNome || f.maquina_nome || 'Sem máquina';
        if (!acc[key]) acc[key] = [];
        acc[key].push(f);
        return acc;
    }, {});

    return (
        <div className="w-full space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-kanban-amber/10 rounded-xl border border-kanban-amber/30">
                        <Package className="w-8 h-8 text-kanban-amber" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-white">Estoque de Ferramentas</h2>
                        <p className="text-slate-400 text-sm mt-0.5">Controle por tipo e quantidade (ex: 10 fresas D8). Quebras no Kanban descontam automaticamente.</p>
                    </div>
                </div>
            </div>

            {Object.keys(ferramentasPorMaquina).length > 0 && (
                <div className={cardClasses}>
                    <div className={headerClasses}>
                        <Monitor className="text-kanban-teal w-6 h-6" />
                        <h3 className="text-xl font-bold text-white">Ferramentas nas máquinas (agora)</h3>
                    </div>
                    <div className="p-5 grid md:grid-cols-2 gap-4 bg-slate-900">
                        {Object.entries(ferramentasPorMaquina).map(([maq, itens]) => (
                            <div key={maq} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                                <h4 className="font-bold text-kanban-teal mb-3">{maq}</h4>
                                <ul className="space-y-2 text-sm">
                                    {itens.map((f) => (
                                        <li key={f.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-800/60 pb-2">
                                            <span className="text-slate-200 font-medium">
                                                {f.itemNome || f.item_nome}
                                                {f.quantidade > 1 ? ` ×${f.quantidade}` : ''}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {f.slot ? `${f.slot} · ` : ''}
                                                {f.codigoPeca || f.codigo_peca ? `OP ${f.codigoPeca || f.codigo_peca}` : ''}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ---------- INVENTÁRIO ---------- */}
                <div className={`${cardClasses} flex flex-col`}>
                    <div className={headerClasses}>
                        <Archive className="text-slate-300 w-6 h-6" />
                        <h3 className="text-xl font-bold text-white">Inventário Global</h3>
                    </div>

                    <div className="p-5 flex-1 space-y-8 bg-slate-900">
                        {erro && (
                            <p className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold rounded-lg px-4 py-3">
                                {erro}
                            </p>
                        )}

                        {/* Formulário Novo Item */}
                        <form onSubmit={handleAddItem} className="bg-slate-950/50 p-5 rounded-xl border border-slate-800 shadow-sm space-y-4">
                            <h4 className="font-extrabold text-lg text-slate-100">Adicionar / Atualizar Insumo</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={titleClasses}>Nome do Item</label>
                                    <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} className={inputClasses} placeholder={novoSetor === 'EDM_FIO' ? 'Ex: Fio Latão Ø0.25mm, Filtro Resina' : novoSetor === 'TORNO' ? 'Ex: Pastilha CCMT 09T3, Bedame' : novoSetor === 'CNC' ? 'Ex: Fresa Ø6mm, Insert APMT' : 'Ex: Óleo Solúvel, Graxa Lubrificante'} required />
                                </div>
                                <div className="col-span-2">
                                    <label className={titleClasses}>Setor do Insumo</label>
                                    <select
                                        value={novoSetor}
                                        onChange={e => setNovoSetor(e.target.value)}
                                        className={inputClasses}
                                    >
                                        <option value="TODOS">🏢 Geral / Toda Fábrica (Fluídos, Graxas)</option>
                                        <option value="CNC">🌀 Usinagem CNC (Fresas, Inserts, Fixação)</option>
                                        <option value="EDM_FIO">⚡ Eletroerosão a Fio (Fios, Resinas, Filtros)</option>
                                        <option value="TORNO">⚙️ Torno CNC (Castanhas, Pastilhas, Bedames)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={titleClasses}>Qtd. Atual</label>
                                    <input type="number" value={novaQtd} onChange={e => setNovaQtd(e.target.value)} className={inputClasses} min="0" required />
                                </div>
                                <div>
                                    <label className={titleClasses}>Alerta Mín.</label>
                                    <input type="number" value={novoAlerta} onChange={e => setNovoAlerta(e.target.value)} className={inputClasses} min="0" required />
                                </div>
                            </div>
                            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-kanban-amber text-slate-900 rounded-lg px-6 py-3 font-bold uppercase tracking-widest cursor-pointer transition-colors hover:bg-amber-400 shadow-sm mt-4">
                                <Plus className="w-5 h-5" />
                                <span>Cadastrar Item</span>
                            </button>
                        </form>

                        {/* Listagem de Estoque com Filtro por Setor */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <h4 className="font-extrabold text-lg text-white uppercase tracking-wider">Insumos Disponíveis</h4>
                                {isProgrammerLocked ? (
                                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-bold text-slate-200">
                                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Estoque: {effectiveSector === 'EDM_FIO' ? '⚡ EDM Fio' : effectiveSector === 'TORNO' ? '⚙️ Torno CNC' : '🌀 Usinagem CNC'} + 🏢 Geral</span>
                                    </div>
                                ) : (
                                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-bold gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setSetorFiltro('TODOS')}
                                            className={`px-3 py-1.5 rounded-md transition-colors ${setorFiltro === 'TODOS' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            🏢 Todos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSetorFiltro('CNC')}
                                            className={`px-3 py-1.5 rounded-md transition-colors ${setorFiltro === 'CNC' ? 'bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            🌀 CNC
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSetorFiltro('EDM_FIO')}
                                            className={`px-3 py-1.5 rounded-md transition-colors ${setorFiltro === 'EDM_FIO' ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            ⚡ EDM Fio
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSetorFiltro('TORNO')}
                                            className={`px-3 py-1.5 rounded-md transition-colors ${setorFiltro === 'TORNO' ? 'bg-amber-950 border border-amber-500/40 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            ⚙️ Torno
                                        </button>
                                    </div>
                                )}
                            </div>

                            {(() => {
                                const estoqueFiltrado = estoque.filter(i => {
                                    if (isProgrammerLocked) {
                                        return !i.setor || i.setor === 'TODOS' || i.setor === effectiveSector;
                                    }
                                    if (setorFiltro === 'TODOS') return true;
                                    if (!i.setor || i.setor === 'TODOS') return true;
                                    return i.setor === setorFiltro;
                                });

                                if (estoqueFiltrado.length === 0) {
                                    return (
                                        <p className="text-sm font-bold tracking-widest uppercase text-slate-500 border border-dashed border-slate-700 rounded-xl py-8 text-center bg-slate-900/50">
                                            Nenhum insumo encontrado para este setor.
                                        </p>
                                    );
                                }

                                return estoqueFiltrado.map((item) => {
                                    const baixoEstoque = item.quantidade <= item.alerta_minimo;
                                    return (
                                        <div key={item.id} className={`flex items-center justify-between p-4 border rounded-xl bg-slate-950/50 shadow-sm transition-colors hover:border-slate-700 ${baixoEstoque ? 'border-red-500/50' : 'border-slate-800'}`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-extrabold text-lg text-white">{item.nome}</p>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                                        item.setor === 'EDM_FIO' 
                                                            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
                                                            : item.setor === 'TORNO'
                                                            ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                                                            : item.setor === 'CNC'
                                                            ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
                                                            : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-400'
                                                    }`}>
                                                        {item.setor === 'EDM_FIO' ? '⚡ EDM Fio' : item.setor === 'TORNO' ? '⚙️ Torno' : item.setor === 'CNC' ? '🌀 CNC' : '🏢 Geral'}
                                                    </span>
                                                    {baixoEstoque && <AlertTriangle className="w-5 h-5 text-red-500" />}
                                                </div>
                                                <p className="text-xs text-slate-500 font-bold mt-1">Alerta: {item.alerta_minimo} unid.</p>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-3xl font-black ${baixoEstoque ? 'text-red-500' : 'text-white'}`}>{item.quantidade}</span>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">unid</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setMovimentacao({ item, tipo: 'entrada' })} className="bg-slate-900 hover:bg-kanban-green/10 text-slate-400 hover:text-kanban-green p-3 rounded-lg border border-slate-700 hover:border-kanban-green/30 transition-colors shadow-sm" title="Dar entrada (compra, devolução, ajuste)">
                                                        <ArrowDownCircle className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => setMovimentacao({ item, tipo: 'saida' })} className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white p-3 rounded-lg border border-slate-700 transition-colors shadow-sm" title="Dar saída (consumo, perda, ajuste)">
                                                        <ArrowUpCircle className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => consumirEstoqueItem(item.id, 1)} className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white p-3 rounded-lg border border-slate-700 font-bold transition-colors shadow-sm" title="Retirar 1 unid. sem vincular a máquina">
                                                        <span className="text-lg leading-none">-1</span>
                                                    </button>
                                                    <button onClick={() => setItemParaDeletar(item.id)} className="bg-slate-900 hover:bg-red-500/10 text-red-500/70 hover:text-red-500 p-3 rounded-lg border border-slate-800 hover:border-red-500/30 transition-colors shadow-sm" title="Excluir item do inventário">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>


                        {/* Movimentações recentes */}
                        <div className="space-y-3">
                            <h4 className="font-extrabold text-lg text-white mb-2 px-1 uppercase tracking-wider flex items-center gap-2">
                                <History className="w-5 h-5 text-slate-400" />
                                Movimentações
                            </h4>
                            {movimentacoesEstoque.length === 0 ? (
                                <p className="text-sm font-bold tracking-widest uppercase text-slate-500 border border-dashed border-slate-700 rounded-xl py-8 text-center bg-slate-900/50">
                                    Nenhuma entrada ou saída registrada.
                                </p>
                            ) : (
                                movimentacoesEstoque.slice(0, 15).map((mov) => {
                                    const entrada = mov.tipo === 'entrada';
                                    return (
                                        <div key={mov.id} className="flex items-start gap-3 p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                                            {entrada
                                                ? <ArrowDownCircle className="w-5 h-5 text-kanban-green shrink-0 mt-0.5" />
                                                : <ArrowUpCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-slate-100 text-sm">
                                                    <span className={entrada ? 'text-kanban-green' : 'text-red-400'}>
                                                        {entrada ? '+' : '−'}{mov.quantidade}
                                                    </span>
                                                    {' '}{mov.item_nome}
                                                    {mov.quantidade_resultante != null && (
                                                        <span className="text-slate-500 font-normal"> · saldo {mov.quantidade_resultante}</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {mov.motivo}
                                                    {mov.operador_nome && ` · ${mov.operador_nome}`}
                                                    <span className="text-slate-600"> · {formatarDataBR(mov.created_at)}</span>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* ---------- REGISTRO DE TROCA (MÁQUINA) ---------- */}
                <div className="space-y-6">
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <PenTool className="text-kanban-blue w-6 h-6" />
                            <h3 className="text-xl font-bold text-white">Registrar Troca na Máquina</h3>
                        </div>

                        <div className="p-5">
                            <form onSubmit={handleRegistrarTroca} className="space-y-5">
                                <div className="p-4 bg-kanban-blue/10 border-2 border-kanban-blue/20 rounded-xl">
                                    <p className="text-sm font-bold text-white leading-snug">
                                        Vincule a retirada de um insumo a uma máquina. O sistema encerrará a contagem do insumo antigo e passará a monitorar a <strong>vida útil real</strong> deste novo item baseado no tempo da máquina Em Corte.
                                    </p>
                                </div>

                                <div>
                                    <label className={titleClasses}>Máquina Onde Ocorreu a Troca</label>
                                    <select value={trocaMaquina} onChange={e => setTrocaMaquina(e.target.value)} className={inputClasses} required>
                                        <option value="" disabled>Selecione a máquina...</option>
                                        {maquinas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className={titleClasses}>Consumível Instalado (Retirado do Estoque)</label>
                                    <select value={trocaInsumo} onChange={e => setTrocaInsumo(e.target.value)} className={inputClasses} required>
                                        <option value="" disabled>Selecione o insumo do estoque...</option>
                                        {estoque.map(i => <option key={i.id} value={i.nome}>{i.nome} (Disp: {i.quantidade})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className={titleClasses}>Operador Responsável</label>
                                    <select value={trocaOperador} onChange={e => setTrocaOperador(e.target.value)} className={`${inputClasses} min-h-[48px] touch-manipulation`} required>
                                        <option value="" disabled>Selecione quem realizou a troca...</option>
                                        {operadores.map(o => <option key={o.id} value={o.nome}>{o.nome}</option>)}
                                    </select>
                                </div>

                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-kanban-amber text-slate-900 rounded-lg px-6 py-3 font-bold uppercase tracking-widest cursor-pointer transition-colors hover:bg-amber-400 shadow-sm mt-4">
                                    <PenTool className="w-5 h-5" />
                                    <span>Confirmar Troca e Iniciar Ciclo</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ---------- MÉTRICAS / HISTÓRICO RECENTE ---------- */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <Clock className="text-kanban-purple w-6 h-6" />
                            <h3 className="text-xl font-bold text-white">Visão de Rendimento</h3>
                        </div>

                        <div className="p-5 bg-slate-900 space-y-3 max-h-[400px] overflow-y-auto">
                            {historicoConsumiveis.length === 0 ? (
                                <p className="text-sm text-slate-500 font-bold text-center py-4">Nenhuma troca registrada nas máquinas ainda.</p>
                            ) : (
                                [...historicoConsumiveis].reverse().slice(0, 5).map(log => {
                                    const isEmUso = !log.dataFim;
                                    return (
                                        <div key={log.id} className={`p-4 border rounded-xl shadow-sm ${isEmUso ? 'bg-kanban-blue/5 border-kanban-blue/30' : 'bg-slate-950/50 border-slate-800'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-extrabold text-white">{log.itemNome}</h4>
                                                {isEmUso ? (
                                                    <span className="bg-kanban-blue text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-sm">Ativo</span>
                                                ) : (
                                                    <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest border border-slate-700">Finalizado</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-slate-400 mb-1">Máquina: <span className="text-slate-200">
                                                {maquinas.find(m => m.id === log.maquinaId)?.nome || 'Máquina Removida'}
                                            </span> • Resp: {log.operadorNome}</p>

                                            <div className="flex items-center gap-4 mt-3 bg-slate-900 p-2 rounded-lg border border-slate-800">
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Instalado Em</p>
                                                    <p className="text-xs font-bold text-slate-300">{formatarDataBR(log.dataInstalacao)}</p>
                                                </div>
                                                {!isEmUso && (
                                                    <div className="flex-1 text-right border-l border-slate-800 pl-4">
                                                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Horas Reais</p>
                                                        <p className="text-base font-black text-kanban-purple">{formatarHoras(log.horasProduzidasSimuladas)} <span className="text-xs font-bold text-slate-500">corte</span></p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <Wrench className="w-5 h-5 text-red-400" />
                            <h3 className="font-extrabold text-white text-lg">Histórico de Quebras (estoque)</h3>
                        </div>
                        <div className="p-5 space-y-3 max-h-[320px] overflow-y-auto">
                            {historicoQuebrasEstoque.length === 0 ? (
                                <p className="text-slate-500 text-sm italic">Nenhuma quebra registrada via Kanban ainda.</p>
                            ) : (
                                [...historicoQuebrasEstoque].slice(0, 8).map((q) => (
                                    <div key={q.id} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-sm">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-red-400">{q.itemNome}</span>
                                            <span className="text-slate-500 text-xs">· {formatarDataBR(q.created_at)}</span>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-2">
                                            {q.maquinaNome && <span>{q.maquinaNome}</span>}
                                            {q.operadorNome && <span>· {q.operadorNome}</span>}
                                            {q.codigoPeca && <span>· peça {q.codigoPeca}</span>}
                                        </div>
                                        {(q.horaInicio && q.horaFim) && (
                                            <p className="text-[10px] text-kanban-amber mt-1 font-bold uppercase tracking-wider">
                                                Retroativo: {q.horaInicio} → {q.horaFim}
                                            </p>
                                        )}
                                        {q.observacao && <p className="text-xs text-slate-500 mt-1">{q.observacao}</p>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* ---------- RELATÓRIOS OEE ANALÍTICOS DE INSUMOS ---------- */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
                <InsumosLifeChart />
                <MachineConsumptionChart />
            </div>

            <ConfirmDeleteEstoqueModal
                isOpen={!!itemParaDeletar}
                onClose={() => setItemParaDeletar(null)}
                onConfirm={() => handleConfirmDelete(itemParaDeletar)}
                itemName={estoque.find(i => i.id === itemParaDeletar)?.nome || ''}
            />

            <MovimentarEstoqueModal
                isOpen={!!movimentacao}
                onClose={() => setMovimentacao(null)}
                item={movimentacao?.item}
                tipoInicial={movimentacao?.tipo}
            />
        </div>
    );
}
