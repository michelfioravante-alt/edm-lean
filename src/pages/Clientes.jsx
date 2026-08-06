import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
    Plus, Trash2, Search, Briefcase, Mail, Phone, Users, AlertTriangle,
    Pencil, Eye, Calendar, FileText, TrendingUp, Clock, UserPlus, X,
    CheckCircle2, Cpu, Zap, RotateCw, ExternalLink, ChevronRight
} from 'lucide-react';
import Modal from '../components/common/Modal';
import { format } from 'date-fns';

export default function Clientes() {
    const { clientes, addCliente, editCliente, removeCliente, fetchClientStats } = useAppStore();

    // Form state for adding primary client info
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [contatos, setContatos] = useState([]); // [{ id, nome, cargo, email, telefone }]
    const [newContatoNome, setNewContatoNome] = useState('');
    const [newContatoCargo, setNewContatoCargo] = useState('');
    const [newContatoEmail, setNewContatoEmail] = useState('');
    const [newContatoTelefone, setNewContatoTelefone] = useState('');
    const [showAddContatoForm, setShowAddContatoForm] = useState(false);

    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');

    // State for editing
    const [editingCliente, setEditingCliente] = useState(null);
    const [editNome, setEditNome] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editTelefone, setEditTelefone] = useState('');
    const [editContatos, setEditContatos] = useState([]);
    const [editContatoNome, setEditContatoNome] = useState('');
    const [editContatoCargo, setEditContatoCargo] = useState('');
    const [editContatoEmail, setEditContatoEmail] = useState('');
    const [editContatoTelefone, setEditContatoTelefone] = useState('');
    const [showEditContatoForm, setShowEditContatoForm] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Custom delete confirmation state
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Search/filter
    const [busca, setBusca] = useState('');

    // Details / Kanban History Modal State
    const [viewingStats, setViewingStats] = useState(null); // client object
    const [statsData, setStatsData] = useState([]);
    const [statsLoading, setStatsLoading] = useState(false);
    const [activeTabStats, setActiveTabStats] = useState('todas'); // 'todas' | 'ativas' | 'concluidas'

    const clientesFiltrados = clientes.filter(c => {
        const term = busca.toLowerCase();
        const matchName = c.nome.toLowerCase().includes(term);
        const matchEmail = (c.email || '').toLowerCase().includes(term);
        const matchPhone = (c.telefone || '').includes(term);
        const matchContatos = (c.contatos || []).some(ct =>
            (ct.nome || '').toLowerCase().includes(term) ||
            (ct.email || '').toLowerCase().includes(term) ||
            (ct.telefone || '').includes(term)
        );
        return matchName || matchEmail || matchPhone || matchContatos;
    });

    const handleAddContatoToList = () => {
        if (!newContatoNome.trim()) return;
        setContatos(prev => [
            ...prev,
            {
                id: String(Date.now()),
                nome: newContatoNome.trim(),
                cargo: newContatoCargo.trim(),
                email: newContatoEmail.trim(),
                telefone: newContatoTelefone.trim()
            }
        ]);
        setNewContatoNome('');
        setNewContatoCargo('');
        setNewContatoEmail('');
        setNewContatoTelefone('');
        setShowAddContatoForm(false);
    };

    const handleRemoveContatoFromList = (id) => {
        setContatos(prev => prev.filter(c => c.id !== id));
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!nome.trim()) return;
        setSaving(true);
        try {
            await addCliente({
                nome: nome.trim(),
                email: email.trim(),
                telefone: telefone.trim(),
                contatos: contatos
            });
            setNome('');
            setEmail('');
            setTelefone('');
            setContatos([]);
            setFeedback('Cliente adicionado com sucesso!');
            setTimeout(() => setFeedback(''), 2500);
        } catch (err) {
            setFeedback('Erro: ' + (err?.message || 'Falha ao salvar.'));
            setTimeout(() => setFeedback(''), 3500);
        } finally {
            setSaving(false);
        }
    };

    const handleOpenEdit = (c) => {
        setEditingCliente(c);
        setEditNome(c.nome);
        setEditEmail(c.email || '');
        setEditTelefone(c.telefone || '');
        setEditContatos(Array.isArray(c.contatos) ? [...c.contatos] : []);
        setShowEditContatoForm(false);
    };

    const handleAddEditContatoToList = () => {
        if (!editContatoNome.trim()) return;
        setEditContatos(prev => [
            ...prev,
            {
                id: String(Date.now()),
                nome: editContatoNome.trim(),
                cargo: editContatoCargo.trim(),
                email: editContatoEmail.trim(),
                telefone: editContatoTelefone.trim()
            }
        ]);
        setEditContatoNome('');
        setEditContatoCargo('');
        setEditContatoEmail('');
        setEditContatoTelefone('');
        setShowEditContatoForm(false);
    };

    const handleRemoveEditContatoFromList = (id) => {
        setEditContatos(prev => prev.filter(c => c.id !== id));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editNome.trim() || !editingCliente) return;
        setUpdating(true);
        try {
            await editCliente(editingCliente.id, {
                nome: editNome.trim(),
                email: editEmail.trim(),
                telefone: editTelefone.trim(),
                contatos: editContatos
            });
            setEditingCliente(null);
            setFeedback('Cliente atualizado com sucesso!');
            setTimeout(() => setFeedback(''), 2500);
        } catch (err) {
            alert('Erro ao atualizar: ' + err.message);
        }
        setUpdating(false);
    };

    const handleRemove = (id, nomeCliente) => {
        setConfirmDelete({ id, nome: nomeCliente });
    };

    const confirmHandleRemove = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        await removeCliente(confirmDelete.id);
        setDeleting(false);
        setConfirmDelete(null);
    };

    const handleOpenStats = async (client) => {
        setViewingStats(client);
        setStatsLoading(true);
        setActiveTabStats('todas');
        try {
            const data = await fetchClientStats(client.nome);
            setStatsData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Erro ao carregar histórico do cliente:", err);
            setStatsData([]);
        } finally {
            setStatsLoading(false);
        }
    };

    const getStatsSummary = () => {
        if (!statsData) return { total: 0, last30Days: 0, concluded: 0, active: 0 };
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        return {
            total: statsData.length,
            last30Days: statsData.filter(os => os.created_at && new Date(os.created_at) >= thirtyDaysAgo).length,
            concluded: statsData.filter(os => os.status === 'Concluído').length,
            active: statsData.filter(os => os.status !== 'Concluído' && os.status !== 'Excluído').length
        };
    };

    const inputCls = 'w-full px-3 py-2.5 border border-slate-700 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber text-slate-100 text-sm placeholder-slate-600 transition-colors';
    const labelCls = 'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5';

    return (
        <div className="min-h-full flex flex-col gap-6 w-full pb-8 font-sans">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-kanban-teal/10 rounded-xl border border-kanban-teal/30 shrink-0">
                        <Users className="w-7 h-7 sm:w-8 sm:h-8 text-kanban-teal" />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white">Clientes & Contatos</h2>
                        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar cliente ou contato..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-kanban-amber transition-colors"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Add Client Form */}
                <div className="xl:col-span-1">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden sticky top-4 shadow-lg">
                        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-kanban-amber" />
                                <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Novo Cliente</h3>
                            </div>
                        </div>
                        <form onSubmit={handleAdd} className="p-4 sm:p-5 space-y-4">
                            <div>
                                <label className={labelCls}>
                                    Nome da Empresa / Razão Social <span className="text-kanban-amber">*</span>
                                </label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={nome}
                                        onChange={e => setNome(e.target.value)}
                                        placeholder="Ex: Stihl do Brasil"
                                        className={`${inputCls} pl-9`}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>E-mail Principal</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="contato@empresa.com"
                                            className={`${inputCls} pl-9`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>Telefone Principal</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            type="tel"
                                            value={telefone}
                                            onChange={e => setTelefone(e.target.value)}
                                            placeholder="(11) 99999-9999"
                                            className={`${inputCls} pl-9`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Seção de Múltiplos Contatos */}
                            <div className="pt-3 border-t border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <UserPlus className="w-4 h-4 text-kanban-teal" /> Contatos Adicionais ({contatos.length})
                                    </span>
                                    {!showAddContatoForm && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddContatoForm(true)}
                                            className="text-xs font-bold text-kanban-amber hover:underline flex items-center gap-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Adicionar Contato
                                        </button>
                                    )}
                                </div>

                                {/* Lista de contatos adicionados */}
                                {contatos.length > 0 && (
                                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                        {contatos.map(ct => (
                                            <div key={ct.id} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                                                <div>
                                                    <p className="font-bold text-slate-200">{ct.nome} {ct.cargo && <span className="text-slate-500 font-normal">({ct.cargo})</span>}</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{ct.email || ct.telefone || 'Sem contato direto'}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveContatoFromList(ct.id)}
                                                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Formulário de adição rápida de contato secundário */}
                                {showAddContatoForm && (
                                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-amber-400 uppercase">Novo Contato Secundário</span>
                                            <button type="button" onClick={() => setShowAddContatoForm(false)} className="text-slate-500 hover:text-slate-300">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                placeholder="Nome (ex: João)"
                                                value={newContatoNome}
                                                onChange={e => setNewContatoNome(e.target.value)}
                                                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Cargo (ex: PCP/Compras)"
                                                value={newContatoCargo}
                                                onChange={e => setNewContatoCargo(e.target.value)}
                                                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="email"
                                                placeholder="E-mail"
                                                value={newContatoEmail}
                                                onChange={e => setNewContatoEmail(e.target.value)}
                                                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Telefone/WhatsApp"
                                                value={newContatoTelefone}
                                                onChange={e => setNewContatoTelefone(e.target.value)}
                                                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddContatoToList}
                                            disabled={!newContatoNome.trim()}
                                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black rounded text-xs uppercase"
                                        >
                                            Confirmar Contato
                                        </button>
                                    </div>
                                )}
                            </div>

                            {feedback && !editingCliente && (
                                <p className={`text-xs font-bold text-center py-2 rounded-lg ${feedback.startsWith('Erro') ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                                    {feedback}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={saving || !nome.trim()}
                                className="w-full bg-kanban-amber hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-extrabold py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                {saving ? 'Salvando...' : 'Cadastrar Cliente'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Clients List (Cards no Mobile / Tabela no Desktop) */}
                <div className="xl:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">
                                Clientes Cadastrados
                                {busca && (
                                    <span className="ml-2 text-kanban-amber font-normal normal-case text-xs">
                                        — {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </h3>
                            <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                                Clique para abrir o histórico
                            </span>
                        </div>

                        {clientesFiltrados.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
                                <Users className="w-10 h-10 opacity-40" />
                                <p className="font-bold text-sm">
                                    {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {clientesFiltrados.map(c => {
                                    const totalContatos = (c.contatos || []).length;
                                    return (
                                        <div
                                            key={c.id}
                                            className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors group cursor-pointer"
                                            onClick={() => handleOpenStats(c)}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                
                                                {/* Nome e Indicador */}
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kanban-teal/20 to-teal-900/30 border border-kanban-teal/30 flex items-center justify-center shrink-0 mt-0.5">
                                                        <span className="text-kanban-teal font-black text-sm">
                                                            {c.nome.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-black text-white text-base group-hover:text-amber-400 transition-colors">{c.nome}</h4>
                                                            {totalContatos > 0 && (
                                                                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                                                    +{totalContatos} contato{totalContatos > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Dados de Contato Visíveis no Mobile e Desktop */}
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs font-semibold">
                                                            {c.email ? (
                                                                <a
                                                                    href={`mailto:${c.email}`}
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                                                                >
                                                                    <Mail className="w-3.5 h-3.5 text-kanban-teal shrink-0" />
                                                                    <span>{c.email}</span>
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-500 text-xs italic">Sem e-mail</span>
                                                            )}

                                                            {c.telefone ? (
                                                                <a
                                                                    href={`tel:${c.telefone}`}
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                                                                >
                                                                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                                    <span>{c.telefone}</span>
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-500 text-xs italic">Sem telefone</span>
                                                            )}
                                                        </div>

                                                        {/* Exibição rápida de contatos secundários se existirem */}
                                                        {totalContatos > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {c.contatos.slice(0, 2).map((ct, i) => (
                                                                    <span key={i} className="text-[11px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                                                                        👤 {ct.nome} {ct.cargo ? `(${ct.cargo})` : ''}: <strong className="text-slate-300">{ct.telefone || ct.email}</strong>
                                                                    </span>
                                                                ))}
                                                                {totalContatos > 2 && (
                                                                    <span className="text-[10px] text-slate-500 italic">+{totalContatos - 2} mais</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Botões de Ação */}
                                                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-950">
                                                    <span className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 sm:hidden">
                                                        Ver Histórico O.S. <ChevronRight className="w-3.5 h-3.5" />
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenStats(c); }}
                                                            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-kanban-teal rounded-lg border border-slate-800 transition-all flex items-center gap-1 text-xs font-bold"
                                                            title="Ver histórico de Kanbans"
                                                        >
                                                            <Eye className="w-4 h-4 text-kanban-teal" />
                                                            <span className="hidden sm:inline">Histórico</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(c); }}
                                                            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg border border-slate-800 transition-all"
                                                            title="Editar cliente"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemove(c.id, c.nome); }}
                                                            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg border border-slate-800 transition-all"
                                                            title="Remover cliente"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Client Modal */}
            <Modal
                isOpen={!!editingCliente}
                onClose={() => setEditingCliente(null)}
                title={`Editar: ${editingCliente?.nome}`}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleUpdate} className="space-y-4 font-sans">
                    <div>
                        <label className={labelCls}>Nome da Empresa <span className="text-kanban-amber">*</span></label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                value={editNome}
                                onChange={e => setEditNome(e.target.value)}
                                className={`${inputCls} pl-9`}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>E-mail Principal</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={e => setEditEmail(e.target.value)}
                                    className={`${inputCls} pl-9`}
                                    placeholder="opcional"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Telefone Principal</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                    type="tel"
                                    value={editTelefone}
                                    onChange={e => setEditTelefone(e.target.value)}
                                    className={`${inputCls} pl-9`}
                                    placeholder="opcional"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Editar Contatos Secundários */}
                    <div className="pt-3 border-t border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <UserPlus className="w-4 h-4 text-kanban-teal" /> Contatos Adicionais ({editContatos.length})
                            </span>
                            {!showEditContatoForm && (
                                <button
                                    type="button"
                                    onClick={() => setShowEditContatoForm(true)}
                                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Adicionar Contato
                                </button>
                            )}
                        </div>

                        {editContatos.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {editContatos.map(ct => (
                                    <div key={ct.id} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                                        <div>
                                            <p className="font-bold text-slate-200">{ct.nome} {ct.cargo && <span className="text-slate-500 font-normal">({ct.cargo})</span>}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{ct.email || ct.telefone || 'Sem contato direto'}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveEditContatoFromList(ct.id)}
                                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showEditContatoForm && (
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-400 uppercase">Novo Contato</span>
                                    <button type="button" onClick={() => setShowEditContatoForm(false)} className="text-slate-500 hover:text-slate-300">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nome"
                                        value={editContatoNome}
                                        onChange={e => setEditContatoNome(e.target.value)}
                                        className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Cargo"
                                        value={editContatoCargo}
                                        onChange={e => setEditContatoCargo(e.target.value)}
                                        className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="email"
                                        placeholder="E-mail"
                                        value={editContatoEmail}
                                        onChange={e => setEditContatoEmail(e.target.value)}
                                        className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Telefone"
                                        value={editContatoTelefone}
                                        onChange={e => setEditContatoTelefone(e.target.value)}
                                        className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddEditContatoToList}
                                    disabled={!editContatoNome.trim()}
                                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black rounded text-xs uppercase"
                                >
                                    Incluir na Lista
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setEditingCliente(null)}
                            className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={updating || !editNome.trim()}
                            className="px-6 py-2 text-sm font-extrabold bg-kanban-amber hover:bg-yellow-400 text-slate-900 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {updating ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Custom Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-white text-lg">Excluir Cliente</h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Tem certeza que deseja excluir <span className="font-bold text-white">"{confirmDelete.nome}"</span>?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmHandleRemove}
                                disabled={deleting}
                                className="px-5 py-2 text-sm font-extrabold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Client Stats & Full Kanban History Modal */}
            <Modal
                isOpen={!!viewingStats}
                onClose={() => { setViewingStats(null); setStatsData([]); }}
                title={`Histórico Completo: ${viewingStats?.nome}`}
                maxWidth="max-w-3xl"
            >
                {statsLoading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-kanban-teal/20 border-t-kanban-teal rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold text-sm tracking-widest animate-pulse">CARREGANDO HISTÓRICO DE O.S....</p>
                    </div>
                ) : (
                    <div className="space-y-5 font-sans">
                        {/* Banner do Cliente */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h3 className="text-lg font-black text-white">{viewingStats?.nome}</h3>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-semibold text-slate-400">
                                    {viewingStats?.email && <span>📧 {viewingStats.email}</span>}
                                    {viewingStats?.telefone && <span>📞 {viewingStats.telefone}</span>}
                                </div>
                            </div>
                            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 uppercase">
                                Cliente Ativo
                            </span>
                        </div>

                        {/* Contatos Cadastrados do Cliente */}
                        {Array.isArray(viewingStats?.contatos) && viewingStats.contatos.length > 0 && (
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                                <span className="text-xs font-extrabold uppercase text-amber-400 block tracking-wider">
                                    Contatos Cadastrados ({viewingStats.contatos.length})
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {viewingStats.contatos.map((ct, idx) => (
                                        <div key={idx} className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-0.5">
                                            <p className="font-bold text-white">{ct.nome} {ct.cargo && <span className="text-slate-400 font-normal">({ct.cargo})</span>}</p>
                                            {ct.email && <p className="text-[11px] text-slate-300">📧 {ct.email}</p>}
                                            {ct.telefone && <p className="text-[11px] text-slate-300">📞 {ct.telefone}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Grid de Métricas do Cliente */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                                <FileText className="w-5 h-5 text-amber-400 mb-1 opacity-60" />
                                <p className="text-2xl font-black text-white">{getStatsSummary()?.total || 0}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de O.S.</p>
                            </div>
                            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl border-l-kanban-teal border-l-2">
                                <TrendingUp className="w-5 h-5 text-kanban-teal mb-1 opacity-60" />
                                <p className="text-2xl font-black text-white">{getStatsSummary()?.last30Days || 0}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Últimos 30 Dias</p>
                            </div>
                            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                                <Clock className="w-5 h-5 text-cyan-400 mb-1 opacity-60" />
                                <p className="text-2xl font-black text-cyan-400">{getStatsSummary()?.active || 0}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Em Andamento</p>
                            </div>
                            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1 opacity-60" />
                                <p className="text-2xl font-black text-emerald-400">{getStatsSummary()?.concluded || 0}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Concluídas</p>
                            </div>
                        </div>

                        {/* Filtros de Abas do Histórico de Kanbans */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 pt-2">
                            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">
                                Ordens de Serviço (Kanbans)
                            </h4>
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                                <button
                                    onClick={() => setActiveTabStats('todas')}
                                    className={`px-3 py-1 rounded font-bold transition-colors ${activeTabStats === 'todas' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Todas ({statsData.length})
                                </button>
                                <button
                                    onClick={() => setActiveTabStats('ativas')}
                                    className={`px-3 py-1 rounded font-bold transition-colors ${activeTabStats === 'ativas' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Ativas ({getStatsSummary().active})
                                </button>
                                <button
                                    onClick={() => setActiveTabStats('concluidas')}
                                    className={`px-3 py-1 rounded font-bold transition-colors ${activeTabStats === 'concluidas' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Concluídas ({getStatsSummary().concluded})
                                </button>
                            </div>
                        </div>

                        {/* Lista do Histórico de Kanbans */}
                        {statsData.length === 0 ? (
                            <p className="text-xs font-bold text-slate-500 border border-dashed border-slate-800 p-8 rounded-xl text-center">
                                Nenhum Kanban / O.S. localizado para este cliente.
                            </p>
                        ) : (
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {statsData
                                    .filter(os => {
                                        if (activeTabStats === 'ativas') return os.status !== 'Concluído' && os.status !== 'Excluído';
                                        if (activeTabStats === 'concluidas') return os.status === 'Concluído';
                                        return true;
                                    })
                                    .map(os => {
                                        const setorName = os.setor || 'CNC';
                                        const statusColor = os.status === 'Concluído'
                                            ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400'
                                            : os.status === 'Em Usinagem' || os.status === 'Em Corte'
                                            ? 'bg-cyan-950 border-cyan-500/50 text-cyan-400'
                                            : os.status === 'Set-up' || os.status === 'Setup'
                                            ? 'bg-amber-950 border-amber-500/50 text-amber-400'
                                            : 'bg-slate-900 border-slate-700 text-slate-300';

                                        return (
                                            <div key={os.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                                            setorName === 'EDM_FIO'
                                                                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                                                                : setorName === 'TORNO'
                                                                ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                                                                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
                                                        }`}>
                                                            {setorName === 'EDM_FIO' ? '⚡ EDM Fio' : setorName === 'TORNO' ? '⚙️ Torno' : '🌀 CNC'}
                                                        </span>
                                                        <span className="font-extrabold text-white text-sm">{os.codigo_peca || 'Sem código'}</span>
                                                        {os.quantidade > 1 && (
                                                            <span className="text-xs text-slate-400 font-semibold">({os.quantidade_concluida || 0}/{os.quantidade} unid)</span>
                                                        )}
                                                    </div>

                                                    <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                                                        {os.status}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-900 gap-2">
                                                    <div>
                                                        <span>Máquina: <strong className="text-slate-200">{os.maquina_nome || os.maquina || 'Não atribuída'}</strong></span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[11px]">
                                                        <span>Criado: <strong className="text-slate-300">{os.created_at ? format(new Date(os.created_at), 'dd/MM/yyyy') : '-'}</strong></span>
                                                        {os.prazo_entrega && (
                                                            <span>Prazo: <strong className="text-amber-400">{format(new Date(os.prazo_entrega), 'dd/MM/yyyy')}</strong></span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}

                        <div className="pt-3 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => { setViewingStats(null); setStatsData([]); }}
                                className="px-5 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                            >
                                Fechar Histórico
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
