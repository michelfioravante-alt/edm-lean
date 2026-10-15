import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, PlayCircle, PauseCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, History, Calendar, Clock, Download, FileText, X, AlertOctagon, TrendingUp, Activity, Layers, Settings, RotateCcw } from 'lucide-react';
import AcompanhamentoModal from '../components/kanban/AcompanhamentoModal';
import NovaOSForm from '../components/kanban/NovaOSForm';
import { COLUMN_LABELS } from '../constants/cncProcess';
import { osService } from '../services/osService';
import { useAuthStore } from '../store/useAuthStore';
import { filtrarPorSetorDoPerfil } from '../constants/roles';
import { resumoHorasOs } from '../utils/horasProducao';


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
    const config = useAppStore((s) => s.configuracoesGlobais);
    const role = useAuthStore((s) => s.role);
    const activeSector = useAppStore((s) => s.activeSector);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOs, setSelectedOs] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [operadorFilter, setOperadorFilter] = useState('');
    const [maquinaFilter, setMaquinaFilter] = useState('');
    const [mesFilter, setMesFilter] = useState('');
    const [page, setPage] = useState(1);
    const [excluidos, setExcluidos] = useState([]);
    const [loadingExcluidos, setLoadingExcluidos] = useState(true);
    const [historicoBanco, setHistoricoBanco] = useState([]);
    const [loadingHistorico, setLoadingHistorico] = useState(false);
    const [repetirOs, setRepetirOs] = useState(null);
    const [novaOsOpen, setNovaOsOpen] = useState(false);

    // Carrega OS excluídas do Supabase ao abrir a aba
    useEffect(() => {
        osService.fetchExcluidos()
            .then(data => setExcluidos(data))
            .catch(e => console.error('[Registros] fetchExcluidos ERRO:', e.message))
            .finally(() => setLoadingExcluidos(false));
    }, []);

    // Busca no banco peças fora do kanban (ex.: concluídas há mais de 48h)
    useEffect(() => {
        const term = searchTerm.trim();
        if (term.length < 2) {
            setHistoricoBanco([]);
            return undefined;
        }
        const timer = window.setTimeout(() => {
            setLoadingHistorico(true);
            osService.searchHistorico({ term, limit: 40 })
                .then((rows) => setHistoricoBanco(filtrarPorSetorDoPerfil(rows, role, activeSector)))
                .catch(() => setHistoricoBanco([]))
                .finally(() => setLoadingHistorico(false));
        }, 400);
        return () => window.clearTimeout(timer);
    }, [searchTerm, role, activeSector]);

    const mesesDisponiveis = useMemo(() => gerarMeses(), []);

    // Junta todas as O.S. de todas as colunas
    const todasAsOS = useMemo(() => [
        ...(kanban?.aFazer || []).map(os => ({ ...os, statusLocal: COLUMN_LABELS.aFazer })),
        ...(kanban?.setup || []).map(os => ({ ...os, statusLocal: COLUMN_LABELS.setup })),
        ...(kanban?.emCorte || []).map(os => ({ ...os, statusLocal: COLUMN_LABELS.emCorte })),
        ...(kanban?.afericao || []).map(os => ({ ...os, statusLocal: COLUMN_LABELS.afericao })),
        ...(kanban?.concluido || []).map(os => ({ ...os, statusLocal: COLUMN_LABELS.concluido })),
        // Excluídas vêm de fetch separado ao Supabase (não estão no kanban store)
        ...(excluidos || []).map(os => ({ ...os, statusLocal: 'Excluído' }))
    ], [kanban, excluidos]);

    const osDoPerfil = useMemo(() => filtrarPorSetorDoPerfil(todasAsOS, role, activeSector), [todasAsOS, role, activeSector]);

    const idsNoKanban = useMemo(() => new Set(osDoPerfil.map((os) => os.id)), [osDoPerfil]);

    const execucoesAnteriores = useMemo(() => {
        if (!searchTerm.trim() || searchTerm.trim().length < 2) return [];
        return historicoBanco.filter((os) => !idsNoKanban.has(os.id));
    }, [historicoBanco, idsNoKanban, searchTerm]);

    // Unique values for filter dropdowns
    const maquinasUnicas = useMemo(() =>
        [...new Set(osDoPerfil.map(os => os.maquina_nome).filter(Boolean))], [osDoPerfil]);
    const operadoresUnicos = useMemo(() =>
        [...new Set(osDoPerfil.map(os => os.operador_atual).filter(Boolean))], [osDoPerfil]);

    const hasActiveFilters = operadorFilter || maquinaFilter || mesFilter || searchTerm;

    // Filtra
    const filteredOS = useMemo(() => {
        const result = osDoPerfil.filter(os => {
            const maquina = os.maquina_nome || '';
            const operador = os.operador_atual || '';
            const codigo = os.codigo_peca || '';
            const cliente = os.cliente || '';
            const dataOS = new Date(os.created_at || 0);
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
            new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        return result;
    }, [osDoPerfil, searchTerm, operadorFilter, maquinaFilter, mesFilter]);

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

    const abrirRepetirPeca = (os, e) => {
        e?.stopPropagation?.();
        setRepetirOs(os);
        setNovaOsOpen(true);
    };

    const fecharNovaOsRepetir = () => {
        setNovaOsOpen(false);
        setRepetirOs(null);
    };

    const selectClasses = "w-full bg-[#111318] border border-[#262A33] text-[#E7E9ED] text-sm font-medium rounded-lg focus:ring-kanban-amber focus:border-kanban-amber p-2.5 [color-scheme:dark]";

    const getStatusBadge = (os) => {
        const status = os.statusLocal;
        const isPausado = os.is_pausado;
        const resultadoAfericao = os.resultado_afericao;

        if (status === 'Excluído')
            return <span className="px-2 py-0.5 rounded bg-[rgba(200,85,88,0.12)] text-[#C85558] text-[10px] font-semibold border border-[#C85558]/30 w-max">Cancelado</span>;
        if (isPausado)
            return <span className="px-2 py-0.5 rounded bg-[#C85558]/20 text-[#C85558] text-[10px] font-semibold border border-kanban-red/30 flex items-center gap-1 w-max"><PauseCircle className="w-3 h-3" /> Pausado</span>;
        if (status === 'Concluído') {
            const isAprovada = resultadoAfericao === 'Aprovada';
            return (
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 w-max ${isAprovada ? 'bg-kanban-green/20 text-kanban-green border-kanban-green/30' : 'bg-[rgba(200,85,88,0.12)] text-[#C85558] border-[#C85558]/30'}`}>
                    <CheckCircle2 className="w-3 h-3" /> {status} ({resultadoAfericao || 'N/A'})
                </span>
            );
        }
        if (status === 'A fazer')
            return <span className="px-2 py-1 rounded bg-[#1F232B] text-[#E7E9ED] text-xs font-medium border border-[#333844] w-max">{status}</span>;
        return <span className="px-2 py-0.5 rounded bg-kanban-cyan/20 text-[#4A9D74] text-[10px] font-semibold border border-kanban-cyan/30 flex items-center gap-1 w-max"><PlayCircle className="w-3 h-3" /> {status}</span>;
    };

    return (
        <div className="w-full space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[#181B22] p-4 rounded-xl border border-[#262A33]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-kanban-amber/10 rounded-lg border border-kanban-amber/30">
                        <History className="w-5 h-5 text-kanban-amber" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Histórico e registros</h2>
                        <p className="text-xs text-[#7B808F] mt-0.5">
                            {role === 'admin'
                                ? 'Todas as O.S. da fábrica.'
                                : `Somente o setor ${activeSector === 'EDM_FIO' ? 'eletrofio' : 'CNC'}. O histórico completo fica com o gestor.`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Barra de Ferramentas */}
            <div className="flex bg-[#181B22] border border-[#262A33] rounded-xl p-4 mb-4 gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#565B68]" />
                    <input
                        type="text"
                        placeholder="Buscar por Peça, Cliente, Molde ou Máquina..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full bg-[#111318] border border-[#262A33] text-[#E7E9ED] text-sm rounded-lg focus:ring-kanban-amber focus:border-kanban-amber block pl-10 p-2.5 placeholder-[#565B68]"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 hover:opacity-90 rounded-lg border transition-colors text-sm font-semibold ${showFilters || hasActiveFilters ? 'bg-kanban-amber text-[#111318] border-kanban-amber' : 'bg-[#1F232B] hover:bg-[#333844] text-[#E7E9ED] border-[#333844]'}`}
                >
                    <Filter className="w-4 h-4" /> Filtros {hasActiveFilters ? '(Ativos)' : ''}
                </button>
            </div>

            {/* Painel de Filtros Expandido */}
            {showFilters && (
                <div className="bg-[#181B22] border border-[#262A33] rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-5 shadow-sm">
                    {/* Filtro por Mês */}
                    <div>
                        <label className="block text-xs font-semibold text-[#7B808F] uppercase tracking-wider mb-1.5">Mês</label>
                        <select value={mesFilter} onChange={handleFilterChange(setMesFilter)} className={selectClasses}>
                            <option value="">Todos os Meses</option>
                            {mesesDisponiveis.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por Operador */}
                    <div>
                        <label className="block text-xs font-semibold text-[#7B808F] uppercase tracking-wider mb-1.5">Operador</label>
                        <select value={operadorFilter} onChange={handleFilterChange(setOperadorFilter)} className={selectClasses}>
                            <option value="">Qualquer Operador</option>
                            {operadoresUnicos.map(op => (
                                <option key={op} value={op}>{op}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por Máquina */}
                    <div>
                        <label className="block text-xs font-semibold text-[#7B808F] uppercase tracking-wider mb-1.5">Máquina</label>
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
                            className="w-full p-2.5 text-sm font-semibold text-[#7B808F] hover:text-[#E7E9ED] bg-[#1F232B]/50 hover:bg-[#1F232B] border border-[#333844]/50 rounded-lg transition-colors"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            )}

            {/* Contador de resultados */}
            <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-medium text-[#565B68] flex items-center gap-2">
                    {loadingExcluidos && <Loader2 className="w-3 h-3 animate-spin" />}
                    {filteredOS.length} registro{filteredOS.length !== 1 ? 's' : ''} encontrado{filteredOS.length !== 1 ? 's' : ''}
                    {loadingExcluidos && <span className="text-[#565B68]">(carregando excluídos...)</span>}
                </p>
                {filteredOS.length > PAGE_SIZE && (
                    <p className="text-xs font-medium text-[#565B68]">
                        Página {currentPage} de {totalPages}
                    </p>
                )}
            </div>

            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block bg-[#181B22] border border-[#262A33] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[#7B808F]">
                        <thead className="text-xs text-[#E7E9ED] uppercase bg-[#111318]/80 border-b border-[#262A33]">
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
                                    <td colSpan="6" className="px-6 py-8 text-center text-[#565B68] text-sm">
                                        Nenhum registro encontrado para essa busca.
                                    </td>
                                </tr>
                            ) : (
                                pageOS.map((os) => (
                                    <tr
                                        key={os.id}
                                        className="bg-[#181B22] border-b border-[#262A33] hover:bg-[#1F232B]/50 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedOs(os)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                                            {(() => { const d = new Date(os.created_at); return isNaN(d) ? '-' : format(d, 'dd/MM/yyyy HH:mm'); })()}
                                        </td>
                                        <td className="px-6 py-3 font-mono text-sm font-medium text-[#E7E9ED] group-hover:text-kanban-amber">
                                            {os.codigo_peca || 'S/N'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                {os.cliente || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {os.maquina_nome || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {os.operador_atual || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-end gap-1">
                                                {getStatusBadge(os)}
                                                {os.resultado_afericao === 'Refugo' && (os.motivo_refugo) && (
                                                    <span className="text-[10px] text-[#C85558]/70 italic text-right max-w-[120px] line-clamp-2">
                                                        "{os.motivo_refugo}"
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
                    <div className="bg-[#181B22] border border-[#262A33] rounded-xl p-6 text-center text-[#565B68] text-sm">
                        Nenhum registro encontrado para essa busca.
                    </div>
                ) : (
                    pageOS.map((os) => (
                        <div
                            key={os.id}
                            onClick={() => setSelectedOs(os)}
                            className="bg-[#181B22] border border-[#262A33] rounded-xl p-5 active:bg-[#1F232B] transition-colors shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-[10px] font-medium uppercase tracking-wider text-[#565B68]">
                                    {(() => { const d = new Date(os.created_at); return isNaN(d) ? '-' : format(d, 'dd/MM/yyyy HH:mm'); })()}
                                </div>
                                {getStatusBadge(os)}
                            </div>

                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-[#E7E9ED] font-mono tracking-tight">
                                    {os.codigo_peca || 'S/N'}
                                </h3>
                                <p className="text-sm text-[#7B808F] font-medium">
                                    Cliente: <span className="text-[#E7E9ED]">{os.cliente || '-'}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#262A33]">
                                <div>
                                    <div className="text-[10px] font-medium uppercase tracking-wider text-[#565B68] mb-1">Máquina</div>
                                    <div className="text-sm text-[#E7E9ED] font-medium">{os.maquina_nome || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-medium uppercase tracking-wider text-[#565B68] mb-1">Operador</div>
                                    <div className="text-sm text-[#E7E9ED] font-medium">{os.operador_atual || '-'}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {(searchTerm.trim().length >= 2 && (loadingHistorico || execucoesAnteriores.length > 0)) ? (
                <div className="bg-[#181B22] border border-[#262A33] rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#262A33] flex items-center justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold text-[#E7E9ED] flex items-center gap-2">
                                <History className="w-4 h-4 text-kanban-amber" />
                                Execuções anteriores no banco
                            </p>
                            <p className="text-[11px] text-[#7B808F] mt-0.5">
                                Peças já concluídas ou fora do kanban ativo — referência de horas para orçamento.
                            </p>
                        </div>
                        {loadingHistorico ? <Loader2 className="w-4 h-4 animate-spin text-[#565B68]" /> : null}
                    </div>
                    {!loadingHistorico && execucoesAnteriores.length === 0 ? (
                        <p className="px-5 py-4 text-sm text-[#565B68]">Nenhuma execução anterior encontrada além do kanban atual.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-[#7B808F]">
                                <thead className="text-xs text-[#E7E9ED] uppercase bg-[#111318]/80 border-b border-[#262A33]">
                                    <tr>
                                        <th className="px-5 py-3">Data</th>
                                        <th className="px-5 py-3">Peça</th>
                                        <th className="px-5 py-3">Molde</th>
                                        <th className="px-5 py-3">Cliente</th>
                                        <th className="px-5 py-3 text-right">Horas máq.</th>
                                        {role === 'admin' && <th className="px-5 py-3 text-right">Ref. interna</th>}
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {execucoesAnteriores.map((os) => {
                                        const hr = resumoHorasOs(os, config || {});
                                        const d = new Date(os.created_at);
                                        return (
                                            <tr
                                                key={os.id}
                                                className="border-b border-[#262A33] hover:bg-[#1F232B]/50 cursor-pointer"
                                                onClick={() => setSelectedOs({ ...os, statusLocal: os.status || 'Arquivada' })}
                                            >
                                                <td className="px-5 py-3 text-xs whitespace-nowrap">
                                                    {isNaN(d) ? '—' : format(d, 'dd/MM/yyyy', { locale: ptBR })}
                                                </td>
                                                <td className="px-5 py-3 font-mono text-[#E7E9ED]">{hr.codigo}</td>
                                                <td className="px-5 py-3">{hr.molde}</td>
                                                <td className="px-5 py-3">{hr.cliente}</td>
                                                <td className="px-5 py-3 text-right font-mono text-[#D97D3D]">{hr.formatado.totalReal}</td>
                                                {role === 'admin' && <td className="px-5 py-3 text-right text-[#9DA2AE]">{hr.formatado.referenciaInterna}</td>}
                                                <td className="px-5 py-3 text-xs">{os.status || '—'}</td>
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => abrirRepetirPeca(os, e)}
                                                        className="inline-flex items-center gap-1 rounded-md border border-[#D97D3D]/40 px-2 py-1 text-[10px] font-semibold text-[#D97D3D] hover:bg-[#D97D3D]/10"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        Repetir
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : null}

            {/* Paginação */}
            {
                totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#181B22] border border-[#262A33] rounded-lg text-[#E7E9ED] text-sm font-semibold hover:bg-[#1F232B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                                        <span key={`dots-${idx}`} className="text-[#565B68] font-bold px-1">…</span>
                                    ) : (
                                        <button
                                            key={item}
                                            onClick={() => setPage(item)}
                                            className={`w-8 h-8 rounded-lg font-semibold text-sm transition-colors
                                            ${currentPage === item
                                                    ? 'bg-kanban-amber text-[#111318] shadow-[0_0_10px_rgba(245,166,35,0.3)]'
                                                    : 'bg-[#181B22] border border-[#262A33] text-[#7B808F] hover:bg-[#1F232B]'
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
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#181B22] border border-[#262A33] rounded-lg text-[#E7E9ED] text-sm font-semibold hover:bg-[#1F232B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

            <NovaOSForm
                isOpen={novaOsOpen}
                onClose={fecharNovaOsRepetir}
                initialFromHistorico={repetirOs}
                onCreated={() => fecharNovaOsRepetir()}
            />
        </div >
    );
}
