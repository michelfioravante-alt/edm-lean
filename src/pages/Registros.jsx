import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, PlayCircle, PauseCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, History, Calendar, Clock, Download, FileText, X, AlertOctagon, TrendingUp, Activity, Layers, Settings } from 'lucide-react';
import AcompanhamentoModal from '../components/kanban/AcompanhamentoModal';
import { osService } from '../services/osService';

const PAGE_SIZE = 50;

// Gera os últimos 12 meses como opções de filtro
function gerarMeses() {
    const meses = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        meses.push({
            value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: format(d, 'MMMM yyyy', { locale: ptBR })
        });
    }
    return meses;
}

export default function Registros() {
    const { kanban } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOs, setSelectedOs] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [operadorFilter, setOperadorFilter] = useState('');
    const [maquinaFilter, setMaquinaFilter] = useState('');
    const [mesFilter, setMesFilter] = useState('');
    const [page, setPage] = useState(1);
    const [excluidos, setExcluidos] = useState([]);
    const [loadingExcluidos, setLoadingExcluidos] = useState(true);

    // Carrega OS excluídas do Supabase ao abrir a aba
    useEffect(() => {
        osService.fetchExcluidos()
            .then(data => {
                console.log('[Registros] excluidos carregados:', data?.length, data);
                setExcluidos(data);
            })
            .catch(e => console.error('[Registros] fetchExcluidos ERRO:', e.message))
            .finally(() => setLoadingExcluidos(false));
    }, []);

    const mesesDisponiveis = useMemo(() => gerarMeses(), []);

    // Junta todas as O.S. de todas as colunas
    const todasAsOS = useMemo(() => [
        ...(kanban?.aFazer || []).map(os => ({ ...os, statusLocal: 'A fazer' })),
        ...(kanban?.setup || []).map(os => ({ ...os, statusLocal: 'Set-up' })),
        ...(kanban?.emCorte || []).map(os => ({ ...os, statusLocal: 'Em Corte' })),
        ...(kanban?.afericao || []).map(os => ({ ...os, statusLocal: 'Aferição' })),
        ...(kanban?.concluido || []).map(os => ({ ...os, statusLocal: 'Concluído' })),
        // Excluídas vêm de fetch separado ao Supabase (não estão no kanban store)
        ...(excluidos || []).map(os => ({ ...os, statusLocal: 'Excluído' }))
    ], [kanban, excluidos]);

    // Unique values for filter dropdowns
    const maquinasUnicas = useMemo(() =>
        [...new Set(todasAsOS.map(os => os.maquina_nome || os.maquina).filter(Boolean))], [todasAsOS]);
    const operadoresUnicos = useMemo(() =>
        [...new Set(todasAsOS.map(os => os.operador_atual || os.operadorAtual).filter(Boolean))], [todasAsOS]);

    const hasActiveFilters = operadorFilter || maquinaFilter || mesFilter || searchTerm;

    // Filtra
    const filteredOS = useMemo(() => {
        const result = todasAsOS.filter(os => {
            const maquina = os.maquina_nome || os.maquina || '';
            const operador = os.operador_atual || os.operadorAtual || '';
            const codigo = os.codigo_peca || os.codigoPeca || '';
            const cliente = os.cliente || '';
            const dataOS = new Date(os.created_at || os.createdAt || 0);
            const mesDaOS = isNaN(dataOS) ? '' : `${dataOS.getFullYear()}-${String(dataOS.getMonth() + 1).padStart(2, '0')}`;

            const matchSearch = !searchTerm ||
                codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                maquina.toLowerCase().includes(searchTerm.toLowerCase());

            const matchOperador = !operadorFilter || operador === operadorFilter;
            const matchMaquina = !maquinaFilter || maquina === maquinaFilter;
            const matchMes = !mesFilter || mesDaOS === mesFilter;

            return matchSearch && matchOperador && matchMaquina && matchMes;
        });

        result.sort((a, b) =>
            new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
        );
        return result;
    }, [todasAsOS, searchTerm, operadorFilter, maquinaFilter, mesFilter]);

    // Paginação
    const totalPages = Math.max(1, Math.ceil(filteredOS.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageOS = filteredOS.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Reset page when filters change
    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    const handleClearFilters = () => {
        setOperadorFilter('');
        setMaquinaFilter('');
        setMesFilter('');
        setSearchTerm('');
        setPage(1);
    };

    const selectClasses = "w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm font-bold rounded-lg focus:ring-kanban-amber focus:border-kanban-amber p-3 [color-scheme:dark]";

    const getStatusBadge = (os) => {
        const status = os.statusLocal;
        const isPausado = os.is_pausado || os.isPausado;
        const resultadoAfericao = os.resultado_afericao || os.resultadoAfericao;

        if (status === 'Excluído')
            return <span className="px-2 py-1 rounded bg-red-500/20 text-red-500 text-xs font-bold border border-red-500/30 w-max">Cancelado</span>;
        if (isPausado)
            return <span className="px-2 py-1 rounded bg-kanban-red/20 text-kanban-red text-xs font-bold border border-kanban-red/30 flex items-center gap-1 w-max"><PauseCircle className="w-3 h-3" /> PAUSADO</span>;
        if (status === 'Concluído') {
            const isAprovada = resultadoAfericao === 'Aprovada';
            return (
                <span className={`px-2 py-1 rounded text-xs font-bold border flex items-center gap-1 w-max ${isAprovada ? 'bg-kanban-green/20 text-kanban-green border-kanban-green/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
                    <CheckCircle2 className="w-3 h-3" /> {status} ({resultadoAfericao || 'N/A'})
                </span>
            );
        }
        if (status === 'A fazer')
            return <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 w-max">{status}</span>;
        return <span className="px-2 py-1 rounded bg-kanban-cyan/20 text-kanban-cyan text-xs font-bold border border-kanban-cyan/30 flex items-center gap-1 w-max"><PlayCircle className="w-3 h-3" /> {status}</span>;
    };

    return (
        <div className="p-2 sm:p-4 lg:p-7 w-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-kanban-amber/10 rounded-xl border border-kanban-amber/30">
                        <History className="w-8 h-8 text-kanban-amber" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-white">Histórico e Registros</h2>
                        <p className="text-slate-400 text-sm mt-0.5">Rastreabilidade completa de todas as Ordens de Serviço da fábrica.</p>
                    </div>
                </div>
            </div>

            {/* Barra de Ferramentas */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por Peça, Cliente ou Máquina..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:ring-kanban-amber focus:border-kanban-amber block pl-10 p-2.5 placeholder-slate-500"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 hover:opacity-90 rounded-lg border transition-colors font-bold tracking-wide ${showFilters || hasActiveFilters ? 'bg-kanban-amber text-slate-900 border-kanban-amber shadow-[0_0_15px_rgba(245,166,35,0.2)]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
                >
                    <Filter className="w-4 h-4" /> Filtros {hasActiveFilters ? '(Ativos)' : ''}
                </button>
            </div>

            {/* Painel de Filtros Expandido */}
            {showFilters && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-5 shadow-sm">
                    {/* Filtro por Mês */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mês</label>
                        <select value={mesFilter} onChange={handleFilterChange(setMesFilter)} className={selectClasses}>
                            <option value="">Todos os Meses</option>
                            {mesesDisponiveis.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por Operador */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Operador</label>
                        <select value={operadorFilter} onChange={handleFilterChange(setOperadorFilter)} className={selectClasses}>
                            <option value="">Qualquer Operador</option>
                            {operadoresUnicos.map(op => (
                                <option key={op} value={op}>{op}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por Máquina */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Máquina</label>
                        <select value={maquinaFilter} onChange={handleFilterChange(setMaquinaFilter)} className={selectClasses}>
                            <option value="">Qualquer Máquina</option>
                            {maquinasUnicas.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Limpar */}
                    <div className="flex items-end">
                        <button
                            onClick={handleClearFilters}
                            className="w-full p-3 font-bold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            )}

            {/* Contador de resultados */}
            <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    {loadingExcluidos && <Loader2 className="w-3 h-3 animate-spin" />}
                    {filteredOS.length} registro{filteredOS.length !== 1 ? 's' : ''} encontrado{filteredOS.length !== 1 ? 's' : ''}
                    {loadingExcluidos && <span className="text-slate-600">(carregando excluídos...)</span>}
                </p>
                {filteredOS.length > PAGE_SIZE && (
                    <p className="text-xs font-bold text-slate-500">
                        Página {currentPage} de {totalPages}
                    </p>
                )}
            </div>

            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs text-slate-300 uppercase bg-slate-950/50 border-b border-slate-800">
                            <tr>
                                <th scope="col" className="px-6 py-4">Data Início</th>
                                <th scope="col" className="px-6 py-4">Código / Peça</th>
                                <th scope="col" className="px-6 py-4">Cliente</th>
                                <th scope="col" className="px-6 py-4">Máquina</th>
                                <th scope="col" className="px-6 py-4">Operador</th>
                                <th scope="col" className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageOS.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-bold">
                                        Nenhum registro encontrado para essa busca.
                                    </td>
                                </tr>
                            ) : (
                                pageOS.map((os) => (
                                    <tr
                                        key={os.id}
                                        className="bg-slate-900 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedOs(os)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                                            {(() => { const d = new Date(os.created_at || os.createdAt); return isNaN(d) ? '-' : format(d, 'dd/MM/yyyy HH:mm'); })()}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-200 group-hover:text-kanban-amber">
                                            {os.codigo_peca || os.codigoPeca || 'S/N'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                {os.cliente || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {os.maquina_nome || os.maquina || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {os.operador_atual || os.operadorAtual || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-end gap-1">
                                                {getStatusBadge(os)}
                                                {(os.resultadoAfericao === 'Refugo' || os.resultado_afericao === 'Refugo') && (os.motivo_refugo || os.motivoRefugo) && (
                                                    <span className="text-[10px] text-red-500/70 italic text-right max-w-[120px] line-clamp-2">
                                                        "{os.motivo_refugo || os.motivoRefugo}"
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View (Hidden on Desktop) */}
            <div className="md:hidden space-y-4">
                {pageOS.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-bold">
                        Nenhum registro encontrado para essa busca.
                    </div>
                ) : (
                    pageOS.map((os) => (
                        <div
                            key={os.id}
                            onClick={() => setSelectedOs(os)}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-5 active:bg-slate-800 transition-colors shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    {(() => { const d = new Date(os.created_at || os.createdAt); return isNaN(d) ? '-' : format(d, 'dd/MM/yyyy HH:mm'); })()}
                                </div>
                                {getStatusBadge(os)}
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-slate-100 font-mono tracking-tight glow-text-sm">
                                    {os.codigo_peca || os.codigoPeca || 'S/N'}
                                </h3>
                                <p className="text-sm text-slate-400 font-medium">
                                    Cliente: <span className="text-slate-300">{os.cliente || '-'}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                                <div>
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Máquina</div>
                                    <div className="text-sm text-slate-200 font-bold">{os.maquina_nome || os.maquina || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Operador</div>
                                    <div className="text-sm text-slate-200 font-bold">{os.operador_atual || os.operadorAtual || '-'}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Paginação */}
            {
                totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-bold hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" /> Anterior
                        </button>

                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                                .reduce((acc, p, idx, arr) => {
                                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((item, idx) =>
                                    item === '...' ? (
                                        <span key={`dots-${idx}`} className="text-slate-600 font-bold px-1">…</span>
                                    ) : (
                                        <button
                                            key={item}
                                            onClick={() => setPage(item)}
                                            className={`w-9 h-9 rounded-lg font-bold text-sm transition-colors
                                            ${currentPage === item
                                                    ? 'bg-kanban-amber text-slate-900 shadow-[0_0_10px_rgba(245,166,35,0.3)]'
                                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
                                                }`}
                                        >
                                            {item}
                                        </button>
                                    )
                                )}
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-bold hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Próxima <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )
            }

            <AcompanhamentoModal
                isOpen={!!selectedOs}
                onClose={() => setSelectedOs(null)}
                osData={selectedOs}
            />
        </div >
    );
}
