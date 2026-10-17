import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { setorEfetivoProgramador, filtrarEstoqueDoPerfil } from '../constants/roles';
import Button from '../components/common/Button';
import { Plus, Package, Archive, AlertTriangle, PenTool, Clock, Trash2, Wrench, Monitor, ArrowDownCircle, ArrowUpCircle, History, Lock, Search } from 'lucide-react';
import { formatarDataBR, formatarHoras } from '../utils/formatters';
import { UNIDADES_ESTOQUE, precisaPedirEstoque, qtdEstoque, unidadeEstoque } from '../utils/estoque';
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
        fetchMovimentacoesEstoque,
        movimentarEstoque,
    } = useAppStore();

    const role = useAuthStore(state => state.role);
    const setorPadrao = useAuthStore(state => state.setorPadrao);
    const activeSector = useAppStore(state => state.activeSector);
    const isProgrammerLocked = role !== 'admin';
    const effectiveSector = setorEfetivoProgramador(setorPadrao, activeSector);
    const estoqueDoPerfil = filtrarEstoqueDoPerfil(estoque, role, effectiveSector);
    const maquinasDoPerfil = isProgrammerLocked
        ? (maquinas || []).filter((m) => (m.setor || m.tipo) === effectiveSector)
        : (maquinas || []);

    useEffect(() => {
        fetchMovimentacoesEstoque();
    }, [fetchMovimentacoesEstoque]);

    // Estado Novo Item
    const [novoNome, setNovoNome] = useState('');
    const [novaQtd, setNovaQtd] = useState('');
    const [novoAlerta, setNovoAlerta] = useState('');
    const [novoSetor, setNovoSetor] = useState(isProgrammerLocked ? effectiveSector : 'CNC');
    const [novaUnidade, setNovaUnidade] = useState('un');
    const [setorFiltro, setSetorFiltro] = useState(isProgrammerLocked ? effectiveSector : 'TODOS');
    const [buscaEstoque, setBuscaEstoque] = useState('');

    useEffect(() => {
        if (!isProgrammerLocked) return;
        setNovoSetor(effectiveSector);
        setSetorFiltro(effectiveSector);
    }, [isProgrammerLocked, effectiveSector]);

    // Aba ativa sugere o setor do cadastro (evita gravar fio EDM como "Geral")
    useEffect(() => {
        if (isProgrammerLocked) return;
        if (setorFiltro && setorFiltro !== 'TODOS') {
            setNovoSetor(setorFiltro);
            if (setorFiltro === 'EDM_FIO') setNovaUnidade((u) => (u === 'un' ? 'kg' : u));
        }
    }, [isProgrammerLocked, setorFiltro]);

    const escolherSetorCadastro = (setor) => {
        setNovoSetor(setor);
        if (setor === 'EDM_FIO') setNovaUnidade((u) => (u === 'un' ? 'kg' : u));
        else if (setor === 'CNC' || setor === 'TORNO') setNovaUnidade((u) => (u === 'kg' || u === 'm' || u === 'rolo' ? 'un' : u));
    };

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
            const setorSalvar = isProgrammerLocked ? effectiveSector : novoSetor;
            try {
                await addEstoqueItem(novoNome.trim(), novaQtd, novoAlerta, setorSalvar, novaUnidade);
                setNovoNome('');
                setNovaQtd('');
                setNovoAlerta('');
                // Mantém o setor escolhido (não volta para Geral)
                setNovoSetor(isProgrammerLocked ? effectiveSector : setorSalvar);
                if (!isProgrammerLocked && setorSalvar && setorSalvar !== 'TODOS') {
                    setSetorFiltro(setorSalvar);
                }
            } catch (err) {
                setErro(`Não foi possível cadastrar o item: ${err.message}`);
            }
        }
    };


    const handleRegistrarTroca = async (e) => {
        e.preventDefault();
        if (!trocaMaquina || !trocaInsumo || !trocaOperador) return;
        setErro('');
        try {
            await registrarTrocaConsumivel(trocaMaquina, trocaInsumo, trocaOperador);
            setTrocaMaquina('');
            setTrocaInsumo('');
            setTrocaOperador('');
        } catch (err) {
            setErro(err.message || 'Não foi possível registrar a troca.');
        }
    };

    const handleConsumoAvulso = async (item) => {
        setErro('');
        try {
            await movimentarEstoque({
                itemId: item.id,
                tipo: 'saida',
                quantidade: 1,
                motivo: 'Consumo avulso',
            });
        } catch (err) {
            setErro(err.message || 'Não foi possível baixar 1 unidade.');
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

    const inputClasses = "w-full p-2.5 border border-[#262A33] rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-1 focus:ring-kanban-amber/50 text-[#E7E9ED] text-sm font-medium bg-[#111318] placeholder-[#565B68] transition-colors";
    const titleClasses = "block text-xs font-semibold uppercase tracking-wider text-[#7B808F] mb-1.5";
    const cardClasses = "bg-[#181B22] rounded-xl shadow-md border border-[#262A33] overflow-hidden";
    const headerClasses = "bg-[#111318]/80 px-4 py-3 border-b border-[#262A33] flex items-center gap-2.5";

    const ferramentasPorMaquina = (ferramentasMaquina || []).reduce((acc, f) => {
        const key = f.maquinaNome || f.maquina_nome || 'Sem máquina';
        if (!acc[key]) acc[key] = [];
        acc[key].push(f);
        return acc;
    }, {});

    return (
        <div className="w-full space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[#181B22] p-4 rounded-xl border border-[#262A33]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-kanban-amber/10 rounded-lg border border-kanban-amber/30">
                        <Package className="w-5 h-5 text-kanban-amber" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Estoque de insumos</h2>
                        <p className="text-[#7B808F] text-xs mt-0.5">SKU por setor · CNC/Torno podem virar peça física em Ferramental; EDM fio (fio, resina, filtro) fica só aqui e na troca/pausa do kanban.</p>
                    </div>
                </div>
            </div>

            {Object.keys(ferramentasPorMaquina).length > 0 && (
                <div className={cardClasses}>
                    <div className={headerClasses}>
                        <Monitor className="text-[#4A9D74] w-4 h-4" />
                        <h3 className="text-sm font-semibold text-white">Nas máquinas agora</h3>
                    </div>
                    <div className="p-5 grid md:grid-cols-2 gap-4 bg-[#181B22]">
                        {Object.entries(ferramentasPorMaquina).map(([maq, itens]) => (
                            <div key={maq} className="bg-[#111318]/80 border border-[#262A33] rounded-xl p-4">
                                <h4 className="font-bold text-[#4A9D74] mb-3">{maq}</h4>
                                <ul className="space-y-2 text-sm">
                                    {itens.map((f) => (
                                        <li key={f.id} className="flex flex-wrap justify-between gap-2 border-b border-[#262A33]/60 pb-2">
                                            <span className="text-[#E7E9ED] font-medium">
                                                {f.itemNome || f.item_nome}
                                                {f.quantidade > 1 ? ` ×${f.quantidade}` : ''}
                                            </span>
                                            <span className="text-xs text-[#565B68]">
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
                        <Archive className="text-[#E7E9ED] w-4 h-4" />
                        <h3 className="text-sm font-semibold text-white">{isProgrammerLocked ? 'Inventário do setor' : 'Inventário'}</h3>
                    </div>

                    <div className="p-4 flex-1 space-y-6 bg-[#181B22]">
                        {erro && (
                            <p className="bg-[rgba(200,85,88,0.1)] border border-[#C85558]/30 text-[#C85558] text-sm font-bold rounded-lg px-4 py-3">
                                {erro}
                            </p>
                        )}

                        {/* Formulário Novo Item */}
                        <form onSubmit={handleAddItem} className="bg-[#111318]/80 p-4 rounded-xl border border-[#262A33] space-y-3">
                            <h4 className="font-semibold text-sm text-[#E7E9ED]">Cadastrar ou somar SKU</h4>
                            <p className="text-[11px] text-[#565B68]">
                                Mesmo nome + setor soma a quantidade. Fio/resina: escolha <span className="text-[#9DA2AE]">Eletroerosão a Fio</span> — “Geral” é só para fluídos comuns.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={titleClasses}>Nome do Item</label>
                                    <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} className={inputClasses} placeholder={novoSetor === 'EDM_FIO' ? 'Ex: Fio Latão Ø0.25mm, Filtro Resina' : novoSetor === 'TORNO' ? 'Ex: Pastilha CCMT 09T3, Bedame' : novoSetor === 'CNC' ? 'Ex: Fresa Ø6mm, Inserto APMT' : 'Ex: Óleo Solúvel, Graxa Lubrificante'} required />
                                </div>
                                <div className="col-span-2">
                                    <label className={titleClasses}>Setor do Insumo</label>
                                    {isProgrammerLocked ? (
                                        <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-[#262A33] bg-[#111318] text-sm font-bold text-[#E7E9ED]">
                                            <Lock className="w-3.5 h-3.5 text-[#D97D3D] shrink-0" />
                                            {effectiveSector === 'EDM_FIO' ? 'Eletroerosão a Fio' : 'Usinagem CNC'}
                                        </div>
                                    ) : (
                                    <select
                                        value={novoSetor}
                                        onChange={(e) => escolherSetorCadastro(e.target.value)}
                                        className={inputClasses}
                                    >
                                        <option value="TODOS">Geral / Toda Fábrica (Fluídos, Graxas)</option>
                                        <option value="CNC">Usinagem CNC (Fresas, Insertos, Fixação)</option>
                                        <option value="EDM_FIO">Eletroerosão a Fio (Fios, Resinas, Filtros)</option>
                                        <option value="TORNO">Torno CNC (Castanhas, Pastilhas, Bedames)</option>
                                    </select>
                                    )}
                                </div>
                                <div>
                                    <label className={titleClasses}>Qtd. Atual</label>
                                    <input type="number" value={novaQtd} onChange={e => setNovaQtd(e.target.value)} className={inputClasses} min="0" required />
                                </div>
                                <div>
                                    <label className={titleClasses}>Alerta mín.</label>
                                    <input type="number" value={novoAlerta} onChange={e => setNovoAlerta(e.target.value)} className={inputClasses} min="0" required />
                                </div>
                                <div className="col-span-2">
                                    <label className={titleClasses}>Unidade</label>
                                    <select value={novaUnidade} onChange={(e) => setNovaUnidade(e.target.value)} className={inputClasses}>
                                        {UNIDADES_ESTOQUE.map((u) => (
                                            <option key={u.id} value={u.id}>{u.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-kanban-amber text-[#111318] rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors hover:bg-[#c46d32] mt-2">
                                <Plus className="w-4 h-4" />
                                <span>Cadastrar</span>
                            </button>
                        </form>

                        {/* Listagem de Estoque com Filtro por Setor */}
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2 border-b border-[#262A33] pb-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <h4 className="font-semibold text-sm text-white">Insumos</h4>
                                {isProgrammerLocked ? (
                                    <div className="flex items-center gap-2 bg-[#111318] px-3 py-1.5 rounded-lg border border-[#262A33] text-xs font-bold text-[#E7E9ED]">
                                        <Lock className="w-3.5 h-3.5 text-[#D97D3D] shrink-0" />
                                        <span>Somente {effectiveSector === 'EDM_FIO' ? 'EDM Fio' : 'Usinagem CNC'}</span>
                                    </div>
                                ) : (
                                    <div className="flex bg-[#111318] p-1 rounded-lg border border-[#262A33] text-xs font-bold gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setSetorFiltro('TODOS')}
                                            className={`px-3 py-1.5 rounded-md transition-colors ${setorFiltro === 'TODOS' ? 'bg-[#1F232B] text-white shadow-sm' : 'text-[#7B808F] hover:text-[#E7E9ED]'}`}
                                        >
                                            Todos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSetorFiltro('CNC')}
                                            className={`px-3 py-1.5 rounded-md transition-colors ${setorFiltro === 'CNC' ? 'bg-[rgba(123,128,143,0.12)] border border-[#7B808F]/40 text-[#9DA2AE] shadow-sm' : 'text-[#7B808F] hover:text-[#E7E9ED]'}`}
                                        >
                                            CNC
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSetorFiltro('EDM_FIO')}
                                            className={`px-3 py-1.5 rounded-md transition-colors ${setorFiltro === 'EDM_FIO' ? 'bg-[rgba(74,157,116,0.1)] border border-[#4A9D74]/40 text-[#4A9D74] shadow-sm' : 'text-[#7B808F] hover:text-[#E7E9ED]'}`}
                                        >
                                            EDM Fio
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSetorFiltro('TORNO')}
                                            className={`px-3 py-1.5 rounded-md transition-colors ${setorFiltro === 'TORNO' ? 'bg-amber-950 border border-amber-500/40 text-[#D97D3D] shadow-sm' : 'text-[#7B808F] hover:text-[#E7E9ED]'}`}
                                        >
                                            Torno
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-[#565B68] absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="search"
                                    value={buscaEstoque}
                                    onChange={(e) => setBuscaEstoque(e.target.value)}
                                    placeholder="Buscar por nome…"
                                    className="w-full pl-8 pr-3 py-2 bg-[#111318] border border-[#262A33] rounded-lg text-xs text-[#E7E9ED] placeholder-[#565B68]"
                                />
                            </div>
                            </div>

                            {(() => {
                                const estoqueFiltrado = (isProgrammerLocked
                                    ? estoqueDoPerfil
                                    : estoque.filter(i => {
                                    // Aba por setor: só o setor exato. "Geral" aparece só em Todos.
                                    if (setorFiltro === 'TODOS') return true;
                                    return (i.setor || 'TODOS') === setorFiltro;
                                })).filter((i) => {
                                    const q = buscaEstoque.trim().toLowerCase();
                                    if (!q) return true;
                                    return String(i.nome || '').toLowerCase().includes(q);
                                });

                                if (estoqueFiltrado.length === 0) {
                                    return (
                                        <p className="text-xs text-[#565B68] border border-dashed border-[#333844] rounded-xl py-6 text-center">
                                            Nenhum insumo neste filtro.
                                        </p>
                                    );
                                }

                                return estoqueFiltrado.map((item) => {
                                    const baixoEstoque = precisaPedirEstoque(item);
                                    const un = unidadeEstoque(item);
                                    return (
                                        <div key={item.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 border rounded-xl bg-[#111318]/80 shadow-sm transition-colors hover:border-[#333844] gap-3 ${baixoEstoque ? 'border-red-500/50' : 'border-[#262A33]'}`}>
                                            <div className="min-w-0 flex-1 w-full sm:w-auto">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium text-sm text-white leading-snug">{item.nome}</p>
                                                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                                                        item.setor === 'EDM_FIO' 
                                                            ? 'bg-[rgba(74,157,116,0.1)] border-[#4A9D74]/40 text-[#4A9D74]' 
                                                            : item.setor === 'TORNO'
                                                            ? 'bg-amber-950/80 border-amber-500/50 text-[#D97D3D]'
                                                            : item.setor === 'CNC'
                                                            ? 'bg-[rgba(123,128,143,0.12)] border-[#7B808F]/40 text-[#9DA2AE]'
                                                            : 'bg-[#1F232B] border-[#333844] text-[#7B808F]'
                                                    }`}>
                                                        {item.setor === 'EDM_FIO' ? 'EDM Fio' : item.setor === 'TORNO' ? 'Torno' : item.setor === 'CNC' ? 'CNC' : 'Geral'}
                                                    </span>
                                                    {baixoEstoque && (
                                                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border border-[#C99A4A]/50 text-[#C99A4A]">Precisa pedir</span>
                                                    )}
                                                    {baixoEstoque && <AlertTriangle className="w-4 h-4 text-[#C85558] shrink-0" />}
                                                </div>
                                                <p className="text-[11px] text-[#565B68] mt-0.5">Pedir abaixo de {item.alerta_minimo} {un}</p>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#262A33]">
                                                <div className="flex items-center gap-2 sm:flex-col sm:items-center">
                                                    <span className={`text-lg font-semibold tabular-nums ${baixoEstoque ? 'text-[#C85558]' : 'text-white'}`}>{qtdEstoque(item)}</span>
                                                    <span className="text-[10px] font-medium text-[#7B808F]">{un}</span>
                                                </div>
                                                <div className="flex gap-1.5 sm:gap-2 shrink-0">
                                                    <button onClick={() => setMovimentacao({ item, tipo: 'entrada' })} className="bg-[#181B22] hover:bg-kanban-green/10 text-[#7B808F] hover:text-kanban-green p-2 sm:p-3 rounded-lg border border-[#333844] hover:border-kanban-green/30 transition-colors shadow-sm active:scale-95" title="Dar entrada (compra, devolução, ajuste)">
                                                        <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </button>
                                                    <button onClick={() => setMovimentacao({ item, tipo: 'saida' })} className="bg-[#181B22] hover:bg-[#1F232B] text-[#7B808F] hover:text-[#E7E9ED] p-2 sm:p-3 rounded-lg border border-[#333844] transition-colors shadow-sm active:scale-95" title="Dar saída (consumo, perda, ajuste)">
                                                        <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </button>
                                                    <button onClick={() => handleConsumoAvulso(item)} className="bg-[#181B22] hover:bg-[#1F232B] text-[#7B808F] hover:text-[#E7E9ED] p-2 sm:p-3 rounded-lg border border-[#333844] font-bold transition-colors shadow-sm active:scale-95 flex items-center justify-center min-w-[36px] sm:min-w-[44px]" title="Saída de 1 com motivo consumo avulso">
                                                        <span className="text-base sm:text-lg leading-none font-semibold">-1</span>
                                                    </button>
                                                    <button onClick={() => setItemParaDeletar(item.id)} className="bg-[#181B22] hover:bg-[rgba(200,85,88,0.1)] text-[#C85558]/70 hover:text-[#C85558] p-2 sm:p-3 rounded-lg border border-[#262A33] hover:border-[#C85558]/30 transition-colors shadow-sm active:scale-95" title="Excluir item do inventário">
                                                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
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
                            <h4 className="font-semibold text-sm text-white mb-2 flex items-center gap-2">
                                <History className="w-4 h-4 text-[#7B808F]" />
                                Movimentações
                            </h4>
                            {movimentacoesEstoque.length === 0 ? (
                                <p className="text-xs text-[#565B68] border border-dashed border-[#333844] rounded-xl py-6 text-center">
                                    Nenhuma entrada ou saída registrada.
                                </p>
                            ) : (
                                movimentacoesEstoque.slice(0, 15).map((mov) => {
                                    const entrada = mov.tipo === 'entrada';
                                    return (
                                        <div key={mov.id} className="flex items-start gap-3 p-3 bg-[#111318]/80 border border-[#262A33] rounded-xl">
                                            {entrada
                                                ? <ArrowDownCircle className="w-5 h-5 text-kanban-green shrink-0 mt-0.5" />
                                                : <ArrowUpCircle className="w-5 h-5 text-[#C85558] shrink-0 mt-0.5" />}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-[#E7E9ED] text-sm">
                                                    <span className={entrada ? 'text-kanban-green' : 'text-[#C85558]'}>
                                                        {entrada ? '+' : '−'}{mov.quantidade}
                                                    </span>
                                                    {' '}{mov.item_nome}
                                                    {mov.quantidade_resultante != null && (
                                                        <span className="text-[#565B68] font-normal"> · saldo {mov.quantidade_resultante}</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-[#7B808F] mt-0.5">
                                                    {mov.motivo}
                                                    {mov.operador_nome && ` · ${mov.operador_nome}`}
                                                    <span className="text-[#565B68]"> · {formatarDataBR(mov.created_at)}</span>
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
                            <PenTool className="text-kanban-blue w-4 h-4" />
                            <h3 className="text-sm font-semibold text-white">Troca na máquina</h3>
                        </div>

                        <div className="p-5">
                            <form onSubmit={handleRegistrarTroca} className="space-y-5">
                                <div className="p-3 bg-[#7B808F]/10 border border-kanban-blue/20 rounded-lg">
                                    <p className="text-xs text-[#E7E9ED] leading-relaxed">
                                        Baixa 1 unidade e inicia o ciclo de vida na máquina, com horas de corte até a próxima troca.
                                    </p>
                                </div>

                                <div>
                                    <label className={titleClasses}>Máquina Onde Ocorreu a Troca</label>
                                    <select value={trocaMaquina} onChange={e => setTrocaMaquina(e.target.value)} className={inputClasses} required>
                                        <option value="" disabled>Selecione a máquina...</option>
                                        {maquinasDoPerfil.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className={titleClasses}>Consumível Instalado (Retirado do Estoque)</label>
                                    <select value={trocaInsumo} onChange={e => setTrocaInsumo(e.target.value)} className={inputClasses} required>
                                        <option value="" disabled>Selecione o insumo do estoque...</option>
                                        {estoqueDoPerfil.map(i => <option key={i.id} value={i.id}>{i.nome} ({qtdEstoque(i)} {unidadeEstoque(i)})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className={titleClasses}>Operador Responsável</label>
                                    <select value={trocaOperador} onChange={e => setTrocaOperador(e.target.value)} className={`${inputClasses} min-h-[48px] touch-manipulation`} required>
                                        <option value="" disabled>Selecione quem realizou a troca...</option>
                                        {operadores.map(o => <option key={o.id} value={o.nome}>{o.nome}</option>)}
                                    </select>
                                </div>

                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-kanban-amber text-[#111318] rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors hover:bg-[#c46d32] mt-2">
                                    <PenTool className="w-4 h-4" />
                                    <span>Confirmar troca</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ---------- MÉTRICAS / HISTÓRICO RECENTE ---------- */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <Clock className="text-[#D97D3D] w-4 h-4" />
                            <h3 className="text-sm font-semibold text-white">Ciclos de insumo</h3>
                        </div>

                        <div className="p-5 bg-[#181B22] space-y-3 max-h-[400px] overflow-y-auto">
                            {historicoConsumiveis.length === 0 ? (
                                <p className="text-sm text-[#565B68] font-bold text-center py-4">Nenhuma troca registrada nas máquinas ainda.</p>
                            ) : (
                                [...historicoConsumiveis].reverse().slice(0, 5).map(log => {
                                    const isEmUso = !log.dataFim;
                                    return (
                                        <div key={log.id} className={`p-4 border rounded-xl shadow-sm ${isEmUso ? 'bg-[#7B808F]/5 border-kanban-blue/30' : 'bg-[#111318]/80 border-[#262A33]'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-white">{log.itemNome}</h4>
                                                {isEmUso ? (
                                                    <span className="bg-[#7B808F] text-white text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-widest shadow-sm">Ativo</span>
                                                ) : (
                                                    <span className="bg-[#1F232B] text-[#7B808F] text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-widest border border-[#333844]">Finalizado</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-[#7B808F] mb-1">Máquina: <span className="text-[#E7E9ED]">
                                                {maquinas.find(m => m.id === log.maquinaId)?.nome || 'Máquina Removida'}
                                            </span> • Resp: {log.operadorNome}</p>

                                            <div className="flex items-center gap-4 mt-3 bg-[#181B22] p-2 rounded-lg border border-[#262A33]">
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-semibold text-[#565B68] uppercase tracking-widest">Instalado Em</p>
                                                    <p className="text-xs font-bold text-[#E7E9ED]">{formatarDataBR(log.dataInstalacao)}</p>
                                                </div>
                                                {!isEmUso && (
                                                    <div className="flex-1 text-right border-l border-[#262A33] pl-4">
                                                        <p className="text-[10px] font-semibold text-[#565B68] uppercase tracking-widest">Horas Reais</p>
                                                        <p className="text-base font-semibold text-[#D97D3D]">{formatarHoras(log.horasProduzidasSimuladas)} <span className="text-xs font-bold text-[#565B68]">corte</span></p>
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
                            <Wrench className="w-5 h-5 text-[#C85558]" />
                            <h3 className="font-semibold text-white text-sm">Quebras (Kanban)</h3>
                        </div>
                        <div className="p-5 space-y-3 max-h-[320px] overflow-y-auto">
                            {historicoQuebrasEstoque.length === 0 ? (
                                <p className="text-[#565B68] text-sm italic">Nenhuma quebra registrada via Kanban ainda.</p>
                            ) : (
                                [...historicoQuebrasEstoque].slice(0, 8).map((q) => (
                                    <div key={q.id} className="bg-[#111318]/80 border border-[#262A33] rounded-lg p-3 text-sm">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-[#C85558]">{q.itemNome}</span>
                                            <span className="text-[#565B68] text-xs">· {formatarDataBR(q.created_at)}</span>
                                        </div>
                                        <div className="text-xs text-[#7B808F] mt-1 flex flex-wrap gap-x-2">
                                            {q.maquinaNome && <span>{q.maquinaNome}</span>}
                                            {q.operadorNome && <span>· {q.operadorNome}</span>}
                                            {q.codigoPeca && <span>· peça {q.codigoPeca}</span>}
                                        </div>
                                        {(q.horaInicio && q.horaFim) && (
                                            <p className="text-[10px] text-kanban-amber mt-1 font-bold uppercase tracking-wider">
                                                Retroativo: {q.horaInicio} → {q.horaFim}
                                            </p>
                                        )}
                                        {q.observacao && <p className="text-xs text-[#565B68] mt-1">{q.observacao}</p>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* ---------- RELATÓRIOS ANALÍTICOS DE INSUMOS ---------- */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-6 border-t border-[#262A33]">
                {((isProgrammerLocked && effectiveSector === 'EDM_FIO') || (!isProgrammerLocked && (setorFiltro === 'TODOS' || setorFiltro === 'EDM_FIO'))) && (
                    <InsumosLifeChart />
                )}
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
