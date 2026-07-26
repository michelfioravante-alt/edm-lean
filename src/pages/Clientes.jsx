import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, Trash2, Search, Briefcase, Mail, Phone, Users, AlertTriangle, Pencil, Eye, Calendar, FileText, TrendingUp, Clock } from 'lucide-react';
import Modal from '../components/common/Modal';

export default function Clientes() {
    const { clientes, addCliente, editCliente, removeCliente } = useAppStore();

    // Form state for adding
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');

    // State for editing
    const [editingCliente, setEditingCliente] = useState(null); // null | client object
    const [editNome, setEditNome] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editTelefone, setEditTelefone] = useState('');
    const [updating, setUpdating] = useState(false);

    // Custom delete confirmation state
    const [confirmDelete, setConfirmDelete] = useState(null); // null | { id, nome }
    const [deleting, setDeleting] = useState(false);

    // Search/filter
    const [busca, setBusca] = useState('');
    const { fetchClientStats } = useAppStore();

    // Details Modal State
    const [viewingStats, setViewingStats] = useState(null); // client object
    const [statsData, setStatsData] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const clientesFiltrados = clientes.filter(c =>
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(busca.toLowerCase()) ||
        (c.telefone || '').includes(busca)
    );

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!nome.trim()) return;
        setSaving(true);
        try {
            await addCliente({ nome: nome.trim(), email: email.trim(), telefone: telefone.trim() });
            setNome('');
            setEmail('');
            setTelefone('');
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
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editNome.trim() || !editingCliente) return;
        setUpdating(true);
        try {
            await editCliente(editingCliente.id, {
                nome: editNome.trim(),
                email: editEmail.trim(),
                telefone: editTelefone.trim()
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
        try {
            const data = await fetchClientStats(client.nome);
            setStatsData(data);
        } catch (err) {
            console.error("Erro ao carregar stats:", err);
        } finally {
            setStatsLoading(false);
        }
    };

    const getStatsSummary = () => {
        if (!statsData) return null;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        return {
            total: statsData.length,
            last30Days: statsData.filter(os => new Date(os.created_at) >= thirtyDaysAgo).length,
            concluded: statsData.filter(os => os.status === 'Concluído').length,
            active: statsData.filter(os => os.status !== 'Concluído' && os.status !== 'Excluído').length
        };
    };

    const inputCls = 'w-full px-3 py-2.5 border border-slate-700 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber text-slate-100 text-sm placeholder-slate-600 transition-colors';
    const labelCls = 'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5';

    return (
        <div className="min-h-full flex flex-col gap-6 w-full pb-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-kanban-teal/10 rounded-xl border border-kanban-teal/30">
                        <Users className="w-8 h-8 text-kanban-teal" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-white">Clientes</h2>
                        <p className="text-slate-400 text-sm mt-0.5">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar por nome, e-mail ou telefone..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-kanban-amber transition-colors"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Add Client Form */}
                <div className="xl:col-span-1">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden sticky top-4">
                        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-kanban-amber" />
                            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Novo Cliente</h3>
                        </div>
                        <form onSubmit={handleAdd} className="p-5 space-y-4">
                            <div>
                                <label className={labelCls}>
                                    Nome <span className="text-kanban-amber">*</span>
                                </label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={nome}
                                        onChange={e => setNome(e.target.value)}
                                        placeholder="Nome da empresa ou pessoa"
                                        className={`${inputCls} pl-9`}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>
                                    E-mail <span className="text-slate-600 normal-case font-normal">(opcional)</span>
                                </label>
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
                                <label className={labelCls}>
                                    Telefone <span className="text-slate-600 normal-case font-normal">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                    <input
                                        type="tel"
                                        value={telefone}
                                        onChange={e => setTelefone(e.target.value)}
                                        placeholder="(99) 99999-9999"
                                        className={`${inputCls} pl-9`}
                                    />
                                </div>
                            </div>

                            {feedback && !editingCliente && (
                                <p className={`text-xs font-bold text-center py-2 rounded-lg ${feedback.startsWith('Erro') ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                                    {feedback}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={saving || !nome.trim()}
                                className="w-full bg-kanban-amber hover:bg-yellow-400 disabled:opacity-50 text-slate-900 font-extrabold py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                {saving ? 'Salvando...' : 'Adicionar Cliente'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Clients Table */}
                <div className="xl:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/50">
                            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                                Clientes Cadastrados
                                {busca && (
                                    <span className="ml-2 text-kanban-amber font-normal normal-case text-xs">
                                        — {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''} para "{busca}"
                                    </span>
                                )}
                            </h3>
                        </div>

                        {clientesFiltrados.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
                                <Users className="w-10 h-10 opacity-40" />
                                <p className="font-bold text-sm">
                                    {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
                                </p>
                                {!busca && (
                                    <p className="text-xs text-slate-600">Use o formulário ao lado para adicionar seu primeiro cliente.</p>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-xs uppercase text-slate-500 tracking-widest">
                                            <th className="text-left px-5 py-3 font-bold">Cliente</th>
                                            <th className="text-left px-5 py-3 font-bold hidden md:table-cell">E-mail</th>
                                            <th className="text-left px-5 py-3 font-bold hidden sm:table-cell">Telefone</th>
                                            <th className="text-left px-5 py-3 font-bold">Notif.</th>
                                            <th className="px-5 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {clientesFiltrados.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-800/40 transition-colors group">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-kanban-teal/10 border border-kanban-teal/20 flex items-center justify-center shrink-0">
                                                            <span className="text-kanban-teal font-black text-xs">
                                                                {c.nome.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="font-bold text-white">{c.nome}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 hidden md:table-cell">
                                                    {c.email ? (
                                                        <a href={`mailto:${c.email}`} className="text-slate-300 hover:text-kanban-amber transition-colors flex items-center gap-1.5">
                                                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                                                            {c.email}
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs italic">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 hidden sm:table-cell">
                                                    {c.telefone ? (
                                                        <a href={`tel:${c.telefone}`} className="text-slate-300 hover:text-kanban-amber transition-colors flex items-center gap-1.5">
                                                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                                                            {c.telefone}
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs italic">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {(c.email || c.telefone) ? (
                                                        <span className="text-xs font-bold text-kanban-teal bg-kanban-teal/10 px-2 py-0.5 rounded-full">✓ Pronto</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">Sem contato</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleOpenStats(c)}
                                                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-kanban-teal p-1.5 rounded-lg hover:bg-teal-500/10 transition-all"
                                                            title="Ver estatísticas"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEdit(c)}
                                                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-kanban-amber p-1.5 rounded-lg hover:bg-amber-500/10 transition-all"
                                                            title="Editar cliente"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemove(c.id, c.nome)}
                                                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                                                            title="Remover cliente"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Client Modal */}
            <Modal
                isOpen={!!editingCliente}
                onClose={() => setEditingCliente(null)}
                title="Editar Cliente"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className={labelCls}>Nome <span className="text-kanban-amber">*</span></label>
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
                    <div>
                        <label className={labelCls}>E-mail</label>
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
                        <label className={labelCls}>Telefone</label>
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

                    <div className="flex justify-end gap-3 pt-4">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-white text-lg">Excluir Cliente</h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Tem certeza que deseja excluir <span className="font-bold text-white">"{confirmDelete.nome}"</span>?
                                    Esta ação não pode ser desfeita.
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

            {/* Client Stats Modal */}
            <Modal
                isOpen={!!viewingStats}
                onClose={() => { setViewingStats(null); setStatsData(null); }}
                title={`Histórico: ${viewingStats?.nome}`}
                maxWidth="max-w-lg"
            >
                {statsLoading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-kanban-teal/20 border-t-kanban-teal rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold text-sm tracking-widest animate-pulse">ANALISANDO DADOS...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Registration Date Banner */}
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-900 rounded-lg text-slate-500">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Registrado em</p>
                                    <p className="text-sm font-bold text-slate-200">
                                        {viewingStats?.created_at ? new Date(viewingStats.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Data não disponível'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
                                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">Ativo</span>
                            </div>
                        </div>

                        {/* Grid de Métricas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                                <FileText className="w-5 h-5 text-kanban-amber mb-2 opacity-50" />
                                <p className="text-2xl font-black text-white">{getStatsSummary()?.total || 0}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total de O.S.</p>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl border-l-kanban-teal border-l-2">
                                <TrendingUp className="w-5 h-5 text-kanban-teal mb-2 opacity-50" />
                                <p className="text-2xl font-black text-white">{getStatsSummary()?.last30Days || 0}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Últimos 30 dias</p>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                                <Clock className="w-5 h-5 text-slate-500 mb-2 opacity-50" />
                                <p className="text-2xl font-black text-slate-200">{getStatsSummary()?.active || 0}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Em Aberto</p>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                                <Plus className="w-5 h-5 text-emerald-500 mb-2 opacity-50" />
                                <p className="text-2xl font-black text-slate-200">{getStatsSummary()?.concluido || 0}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concluídas</p>
                            </div>
                        </div>

                        {/* Footer / CTA */}
                        <div className="pt-4 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => { setViewingStats(null); setStatsData(null); }}
                                className="px-5 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                            >
                                Fechar Detalhes
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
