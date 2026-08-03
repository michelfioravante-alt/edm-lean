import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Pencil, Zap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

/** Mantém a lista de nomes do tamanho do nº de setups, preservando os já digitados. */
function ajustarNomes(nomes, total) {
    return Array.from({ length: total }, (_, i) => nomes[i] || `OP${(i + 1) * 10}`);
}

export default function EditOSModal({ isOpen, onClose, osData }) {
    const { editOrdemServico, programadores, clientes } = useAppStore();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [ajustarTemposPorQuantidade, setAjustarTemposPorQuantidade] = useState(true);

    const [form, setForm] = useState({
        cliente: '',
        codigoPeca: '',
        prazoEntrega: '',
        tempoEstimadoCorteHoras: '',
        tempoEstimadoCorteMinutos: '',
        tempoEstimadoSetupHoras: '',
        tempoEstimadoSetupMinutos: '',
        programador: '',
        linkDesenho: '',
        isPrioridade: false,
        quantidade: 1,
        codigoMolde: '',
        componenteMolde: '',
        numeroPrograma: '',
        totalSetups: 1,
        nomesSetups: [],
    });

    // Re-popula o formulário sempre que o modal abre ou troca de O.S
    // Colocado ANTES de qualquer early-return para respeitar as regras dos Hooks
    useEffect(() => {
        if (isOpen && osData) {
            const total = parseInt(osData.total_setups ?? osData.totalSetups ?? 1) || 1;
            const nomes = osData.nomes_setups || osData.nomesSetups || [];
            setForm({
                cliente: osData.cliente || '',
                codigoPeca: osData.codigo_peca || osData.codigoPeca || '',
                prazoEntrega: (osData.prazo_entrega || osData.prazoEntrega || '').slice(0, 10),
                tempoEstimadoCorteHoras: String(osData.tempo_estimado_corte_horas ?? osData.tempoEstimadoCorteHoras ?? ''),
                tempoEstimadoCorteMinutos: String(osData.tempo_estimado_corte_minutos ?? osData.tempoEstimadoCorteMinutos ?? ''),
                tempoEstimadoSetupHoras: String(osData.tempo_estimado_setup_horas ?? osData.tempoEstimadoSetupHoras ?? ''),
                tempoEstimadoSetupMinutos: String(osData.tempo_estimado_setup_minutos ?? osData.tempoEstimadoSetupMinutos ?? ''),
                programador: osData.programador_nome || osData.programador || '',
                linkDesenho: osData.link_desenho || osData.linkDesenho || '',
                isPrioridade: osData.is_prioridade ?? osData.isPrioridade ?? false,
                quantidade: osData.quantidade || 1,
                codigoMolde: osData.codigo_molde || osData.codigoMolde || '',
                componenteMolde: osData.componente_molde || osData.componenteMolde || '',
                numeroPrograma: osData.numero_programa || osData.numeroPrograma || '',
                totalSetups: total,
                nomesSetups: ajustarNomes(nomes, total),
            });
            setAjustarTemposPorQuantidade(true);
            setError('');
        }
    }, [isOpen, osData?.id]);

    if (!osData) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Only digits for time fields
        if (name.includes('tempo') && value !== '' && !/^\d+$/.test(value)) return;
        if (name.includes('Minutos') && value !== '' && parseInt(value) > 59) return;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.cliente.trim() || !form.codigoPeca.trim()) {
            setError('Cliente e Código da Peça são obrigatórios.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const originalQuantidade = osData.quantidade || 1;
            const novaQuantidade = parseInt(form.quantidade, 10) || originalQuantidade;

            let payload = { ...form };

            // Se a quantidade mudou e a opção estiver ligada, recalcula tempos estimados proporcionalmente
            if (
                ajustarTemposPorQuantidade &&
                originalQuantidade > 0 &&
                novaQuantidade > 0 &&
                novaQuantidade !== originalQuantidade
            ) {
                const fator = novaQuantidade / originalQuantidade;

                const corteHOrig = osData.tempo_estimado_corte_horas ?? osData.tempoEstimadoCorteHoras ?? 0;
                const corteMOrig = osData.tempo_estimado_corte_minutos ?? osData.tempoEstimadoCorteMinutos ?? 0;
                const setupHOrig = osData.tempo_estimado_setup_horas ?? osData.tempoEstimadoSetupHoras ?? 0;
                const setupMOrig = osData.tempo_estimado_setup_minutos ?? osData.tempoEstimadoSetupMinutos ?? 0;

                const corteTotalMinOrig = (parseInt(corteHOrig, 10) || 0) * 60 + (parseInt(corteMOrig, 10) || 0);
                const setupTotalMinOrig = (parseInt(setupHOrig, 10) || 0) * 60 + (parseInt(setupMOrig, 10) || 0);

                const corteTotalMinNovo = Math.round(corteTotalMinOrig * fator);
                const setupTotalMinNovo = Math.round(setupTotalMinOrig * fator);

                payload.tempoEstimadoCorteHoras = String(Math.floor(corteTotalMinNovo / 60));
                payload.tempoEstimadoCorteMinutos = String(corteTotalMinNovo % 60);
                payload.tempoEstimadoSetupHoras = String(Math.floor(setupTotalMinNovo / 60));
                payload.tempoEstimadoSetupMinutos = String(setupTotalMinNovo % 60);
            }

            const detalhes = osData.detalhes_setups || osData.detalhesSetups || [];
            payload.detalhesSetups = form.nomesSetups.map((nome, i) => ({ ...(detalhes[i] || {}), nome }));

            // Reduzir o nº de setups não pode deixar a O.S. apontando para um setup inexistente.
            const setupAtual = parseInt(osData.setup_atual ?? osData.setupAtual ?? 1) || 1;
            if (setupAtual > form.totalSetups) payload.setupAtual = form.totalSetups;

            await editOrdemServico(osData.id, payload);
            onClose();
        } catch (err) {
            setError('Erro ao salvar: ' + err.message);
        }
        setSaving(false);
    };

    const inputCls = 'w-full px-3 py-2.5 border border-slate-700 bg-slate-950 rounded-lg text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-kanban-amber transition-colors';
    const labelCls = 'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar O.S" maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Cliente + Código */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Cliente <span className="text-kanban-amber">*</span></label>
                        <input
                            type="text"
                            name="cliente"
                            list="edit-clientes-lista"
                            value={form.cliente}
                            onChange={handleChange}
                            required
                            placeholder="Nome do cliente"
                            className={inputCls}
                        />
                        <datalist id="edit-clientes-lista">
                            {clientes.map(c => <option key={c.id} value={c.nome} />)}
                        </datalist>
                    </div>
                    <div>
                        <label className={labelCls}>Código da Peça <span className="text-kanban-amber">*</span></label>
                        <input
                            type="text"
                            name="codigoPeca"
                            value={form.codigoPeca}
                            onChange={handleChange}
                            required
                            placeholder="Ex: PN-12345"
                            className={`${inputCls} uppercase`}
                        />
                    </div>
                </div>

                {/* Prazo + Programador */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Prazo de Entrega</label>
                        <input
                            type="date"
                            name="prazoEntrega"
                            value={form.prazoEntrega}
                            onChange={handleChange}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Programador</label>
                        <select
                            name="programador"
                            value={form.programador}
                            onChange={handleChange}
                            className={inputCls}
                        >
                            <option value="">— Nenhum —</option>
                            {programadores.map(p => (
                                <option key={p.id} value={p.nome}>{p.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tempos estimados */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tempos Estimados</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Corte — Horas</label>
                            <input type="text" inputMode="numeric" name="tempoEstimadoCorteHoras"
                                value={form.tempoEstimadoCorteHoras} onChange={handleChange}
                                placeholder="0" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Corte — Minutos</label>
                            <input type="text" inputMode="numeric" name="tempoEstimadoCorteMinutos"
                                value={form.tempoEstimadoCorteMinutos} onChange={handleChange}
                                placeholder="0" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Set-up — Horas</label>
                            <input type="text" inputMode="numeric" name="tempoEstimadoSetupHoras"
                                value={form.tempoEstimadoSetupHoras} onChange={handleChange}
                                placeholder="0" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Set-up — Minutos</label>
                            <input type="text" inputMode="numeric" name="tempoEstimadoSetupMinutos"
                                value={form.tempoEstimadoSetupMinutos} onChange={handleChange}
                                placeholder="0" className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Link Desenho + Quantidade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Link / Caminho do Desenho</label>
                        <input
                            type="text"
                            name="linkDesenho"
                            value={form.linkDesenho}
                            onChange={handleChange}
                            placeholder="\\servidor\pasta\arquivo.dxf"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Quantidade de Peças</label>
                        <input
                            type="number"
                            name="quantidade"
                            min="1"
                            value={form.quantidade}
                            onChange={handleChange}
                            placeholder="Ex: 5"
                            className={inputCls}
                        />
                        {osData.quantidade > 0 && parseInt(form.quantidade || '0', 10) !== (osData.quantidade || 1) && (
                            <div className="mt-2 flex items-start gap-2 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                                <input
                                    id="ajustar-tempos-quantidade"
                                    type="checkbox"
                                    checked={ajustarTemposPorQuantidade}
                                    onChange={(e) => setAjustarTemposPorQuantidade(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-kanban-amber focus:ring-kanban-amber"
                                />
                                <div className="text-[11px] leading-snug text-slate-400">
                                    <label htmlFor="ajustar-tempos-quantidade" className="font-bold text-slate-200 block">
                                        Ajustar tempos estimados proporcionalmente?
                                    </label>
                                    <span>
                                        De {osData.quantidade} → {form.quantidade || osData.quantidade} peças. Setup e Corte serão multiplicados por esse fator.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Identificação CNC */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identificação CNC</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelCls}>Nº do Programa</label>
                            <input
                                type="text"
                                name="numeroPrograma"
                                value={form.numeroPrograma}
                                onChange={handleChange}
                                placeholder="Ex: O1001"
                                className={`${inputCls} font-mono uppercase`}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Código do Molde</label>
                            <input
                                type="text"
                                name="codigoMolde"
                                value={form.codigoMolde}
                                onChange={handleChange}
                                placeholder="Ex: M-2024"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Componente</label>
                            <input
                                type="text"
                                name="componenteMolde"
                                value={form.componenteMolde}
                                onChange={handleChange}
                                placeholder="Ex: Postiço Macho"
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Nº de Setups / Viradas de Peça</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={form.totalSetups}
                            onChange={(e) => {
                                const total = Math.min(10, Math.max(1, parseInt(e.target.value) || 1));
                                setForm(p => ({ ...p, totalSetups: total, nomesSetups: ajustarNomes(p.nomesSetups, total) }));
                            }}
                            className={`${inputCls} md:w-40`}
                        />
                    </div>

                    {form.totalSetups > 1 && (
                        <div className="space-y-2">
                            {form.nomesSetups.map((nome, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-500 w-14 shrink-0">Setup {i + 1}</span>
                                    <input
                                        type="text"
                                        value={nome}
                                        onChange={(e) => {
                                            const nomes = [...form.nomesSetups];
                                            nomes[i] = e.target.value;
                                            setForm(p => ({ ...p, nomesSetups: nomes }));
                                        }}
                                        placeholder={`OP${(i + 1) * 10}`}
                                        className={inputCls}
                                    />
                                </div>
                            ))}
                            <p className="text-[11px] text-slate-500">
                                Os tempos de cada setup não mudam aqui — o total de set-up é o campo acima.
                            </p>
                        </div>
                    )}
                </div>

                {/* Prioridade */}
                <div className="flex items-center pb-1">
                    <label className="flex items-center gap-3 cursor-pointer select-none group">
                        <div
                            className={`w-11 h-6 rounded-full transition-colors flex items-center ${form.isPrioridade ? 'bg-red-500' : 'bg-slate-700'}`}
                            onClick={() => setForm(p => ({ ...p, isPrioridade: !p.isPrioridade }))}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow mx-1 transition-transform ${form.isPrioridade ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-sm font-bold text-slate-300">
                            {form.isPrioridade ? '🔴 Alta Prioridade' : 'Prioridade Normal'}
                        </span>
                    </label>
                </div>

                {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 font-bold">
                        {error}
                    </p>
                )}

                <div className="flex justify-end gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 text-sm font-extrabold bg-kanban-amber hover:bg-yellow-400 text-slate-900 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4" />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form >
        </Modal >
    );
}
