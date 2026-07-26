import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import Button from '../components/common/Button';
import { Plus, Package, Archive, AlertTriangle, PenTool, Clock, Trash2 } from 'lucide-react';
import { formatarDataBR, formatarHoras } from '../utils/formatters';
import InsumosLifeChart from '../components/dashboard/InsumosLifeChart';
import MachineConsumptionChart from '../components/dashboard/MachineConsumptionChart';
import ConfirmDeleteEstoqueModal from '../components/estoque/ConfirmDeleteEstoqueModal';

export default function Estoque() {
    const {
        estoque,
        addEstoqueItem,
        consumirEstoqueItem,
        removeEstoqueItem,
        maquinas,
        operadores,
        historicoConsumiveis,
        registrarTrocaConsumivel
    } = useAppStore();

    // Estado Novo Item
    const [novoNome, setNovoNome] = useState('');
    const [novaQtd, setNovaQtd] = useState('');
    const [novoAlerta, setNovoAlerta] = useState('');

    // Estado Deleção de Estoque
    const [itemParaDeletar, setItemParaDeletar] = useState(null);

    // Estado Registro de Troca na Máquina
    const [trocaMaquina, setTrocaMaquina] = useState('');
    const [trocaInsumo, setTrocaInsumo] = useState('');
    const [trocaOperador, setTrocaOperador] = useState('');

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (novoNome.trim() && novaQtd && novoAlerta) {
            try {
                await addEstoqueItem(novoNome.trim(), novaQtd, novoAlerta);
                setNovoNome('');
                setNovaQtd('');
                setNovoAlerta('');
            } catch (err) {
                console.error('Erro ao adicionar item:', err);
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
        await removeEstoqueItem(itemId);
        setItemParaDeletar(null);
    };

    const inputClasses = "w-full p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-1 focus:ring-kanban-amber/50 text-slate-100 text-base font-bold bg-slate-950 placeholder-slate-600 transition-colors";
    const titleClasses = "block text-sm font-bold text-slate-300 mb-2 tracking-wide";
    const cardClasses = "bg-slate-900 rounded-xl shadow-md border border-slate-800 overflow-hidden";
    const headerClasses = "bg-slate-950/50 px-5 py-4 border-b border-slate-800 flex items-center gap-3";

    return (
        <div className="w-full space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-kanban-amber/10 rounded-xl border border-kanban-amber/30">
                        <Package className="w-8 h-8 text-kanban-amber" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-white">Estoque & Consumíveis</h2>
                        <p className="text-slate-400 text-sm mt-0.5">Gerencie o inventário e rastreie a vida útil dos consumíveis instalados.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ---------- INVENTÁRIO ---------- */}
                <div className={`${cardClasses} flex flex-col`}>
                    <div className={headerClasses}>
                        <Archive className="text-slate-300 w-6 h-6" />
                        <h3 className="text-xl font-bold text-white">Inventário Global</h3>
                    </div>

                    <div className="p-5 flex-1 space-y-8 bg-slate-900">
                        {/* Formulário Novo Item */}
                        <form onSubmit={handleAddItem} className="bg-slate-950/50 p-5 rounded-xl border border-slate-800 shadow-sm space-y-4">
                            <h4 className="font-extrabold text-lg text-slate-100">Adicionar / Atualizar Insumo</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={titleClasses}>Nome do Item</label>
                                    <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} className={inputClasses} placeholder="Ex: Fio 0.25mm Latão" required />
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

                        {/* Listagem de Estoque */}
                        <div className="space-y-3">
                            <h4 className="font-extrabold text-lg text-white mb-2 px-1 uppercase tracking-wider">Disponíveis</h4>
                            {estoque.length === 0 ? (
                                <p className="text-sm font-bold tracking-widest uppercase text-slate-500 border border-dashed border-slate-700 rounded-xl py-8 text-center bg-slate-900/50">Estoque vazio.</p>
                            ) : (
                                estoque.map((item) => {
                                    const baixoEstoque = item.quantidade <= item.alerta_minimo;
                                    return (
                                        <div key={item.id} className={`flex items-center justify-between p-4 border rounded-xl bg-slate-950/50 shadow-sm transition-colors hover:border-slate-700 ${baixoEstoque ? 'border-red-500/50' : 'border-slate-800'}`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-extrabold text-lg text-white">{item.nome}</p>
                                                    {baixoEstoque && <AlertTriangle className="w-5 h-5 text-red-500" />}
                                                </div>
                                                <p className="text-xs text-slate-500 font-bold">Alerta: {item.alerta_minimo} unid.</p>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-3xl font-black ${baixoEstoque ? 'text-red-500' : 'text-white'}`}>{item.quantidade}</span>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">unid</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => consumirEstoqueItem(item.id, 1)} className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white p-3 rounded-lg border border-slate-700 font-bold transition-colors shadow-sm" title="Retirar 1 unid. sem vincular a máquina">
                                                        <span className="text-lg leading-none">-1</span>
                                                    </button>
                                                    <button onClick={() => setItemParaDeletar(item.id)} className="bg-slate-900 hover:bg-red-500/10 text-red-500/70 hover:text-red-500 p-3 rounded-lg border border-slate-800 hover:border-red-500/30 transition-colors shadow-sm" title="Excluir item do inventário">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
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
        </div>
    );
}
