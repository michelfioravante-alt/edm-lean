import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAppStore } from '../../store/useAppStore';
import { ESTRATEGIA_FERRAMENTAL_OPTIONS } from '../../constants/cncProcess';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function TransitionModal({ isOpen, onClose, onConfirm, targetColumnTitle, destCol, osData }) {
    const { maquinas, operadores, estoque, configuracoesGlobais, activeSector } = useAppStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMaquina, setSelectedMaquina] = useState('');
    const [selectedOperador, setSelectedOperador] = useState('');
    const [checkedCamTools, setCheckedCamTools] = useState({});

    const osSector = osData?.setor || activeSector || 'CNC';

    const filteredMaquinas = maquinas.filter(m => {
        if (!m.setor || m.setor === 'TODOS' || osSector === 'TODOS') return true;
        return m.setor === osSector;
    });

    const filteredOperadores = operadores.filter(op => {
        if (!op.setor || op.setor === 'TODOS' || osSector === 'TODOS') return true;
        return op.setor === osSector;
    });


    const isEmCorte = destCol === 'emCorte';
    const isSetup = destCol === 'setup';

    const ferramentasCam = osData?.nxImport?.ferramentas || osData?.nx_import?.ferramentas || [];

    const [estrategiaFerramental, setEstrategiaFerramental] = useState(
        configuracoesGlobais?.modoMagazineDefault || 'individual'
    );
    const [baixarEstoqueSetup, setBaixarEstoqueSetup] = useState(
        configuracoesGlobais?.baixaEstoqueNoSetup ?? false
    );
    const [itensMagazine, setItensMagazine] = useState([{ estoqueItemId: '', quantidade: 1, slot: '' }]);

    useEffect(() => {
        if (isOpen && isSetup) {
            setEstrategiaFerramental(configuracoesGlobais?.modoMagazineDefault || 'individual');
            setBaixarEstoqueSetup(configuracoesGlobais?.baixaEstoqueNoSetup ?? false);
            setCheckedCamTools({});
        }
    }, [isOpen, isSetup, configuracoesGlobais?.modoMagazineDefault, configuracoesGlobais?.baixaEstoqueNoSetup]);

    useEffect(() => {
        if (isOpen && destCol !== 'emCorte') {
            const state = useAppStore.getState();
            state.fetchOperadores?.();
            state.fetchMaquinas?.();
            state.fetchEstoque?.();
        }
    }, [isOpen, destCol]);

    const [checkFixacao, setCheckFixacao] = useState(false);
    const [checkZerar, setCheckZerar] = useState(false);
    const [checkPrograma, setCheckPrograma] = useState(false);

    const addLinhaMagazine = () => {
        setItensMagazine((prev) => [...prev, { estoqueItemId: '', quantidade: 1, slot: '' }]);
    };

    const updateLinhaMagazine = (index, field, value) => {
        setItensMagazine((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    };

    const removeLinhaMagazine = (index) => {
        setItensMagazine((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        if (isEmCorte) {
            onConfirm({
                timestampEntradaCorte: new Date().toISOString(),
            });
            setCheckFixacao(false);
            setCheckZerar(false);
            setCheckPrograma(false);
        } else {
            const payload = {
                maquina_nome: selectedMaquina,
                operador_atual: selectedOperador,
                timestampEntradaSetup: new Date().toISOString(),
            };

            if (isSetup) {
                payload.estrategia_ferramental = estrategiaFerramental;
                if (estrategiaFerramental === 'lote') {
                    const itensValidos = itensMagazine
                        .filter((i) => i.estoqueItemId && i.quantidade > 0)
                        .map((i) => {
                            const item = estoque.find((e) => e.id === i.estoqueItemId);
                            return {
                                estoqueItemId: i.estoqueItemId,
                                itemNome: item?.nome || '',
                                quantidade: parseInt(i.quantidade) || 1,
                                slot: i.slot?.trim() || null,
                            };
                        });
                    payload.magazineLote = {
                        itens: itensValidos,
                        baixarEstoque: baixarEstoqueSetup,
                    };
                }
            }

            onConfirm(payload);
            setSelectedMaquina('');
            setSelectedOperador('');
            setItensMagazine([{ estoqueItemId: '', quantidade: 1, slot: '' }]);
        }

        setTimeout(() => setIsSubmitting(false), 300);
    };

    const isCorteReady = checkFixacao && checkZerar && checkPrograma;
    const codigoPeca = osData?.codigo_peca || osData?.codigoPeca || '';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Movendo para ${targetColumnTitle}...`}
            maxWidth={isSetup ? 'max-w-lg' : 'max-w-md'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {isEmCorte ? (
                    <>
                        <p className="text-base text-slate-400 mb-6 font-medium">
                            Antes de iniciar a usinagem, confirme as etapas:
                        </p>
                        <div className="space-y-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <label className="flex items-center gap-4 cursor-pointer text-lg font-bold text-slate-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50">
                                <input type="checkbox" className="rounded-md border-2 border-slate-700 text-kanban-teal focus:ring-kanban-teal w-6 h-6 bg-slate-950"
                                    checked={checkFixacao} onChange={(e) => setCheckFixacao(e.target.checked)} />
                                Fixação correta na máquina
                            </label>
                            <label className="flex items-center gap-4 cursor-pointer text-lg font-bold text-slate-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50">
                                <input type="checkbox" className="rounded-md border-2 border-slate-700 text-kanban-teal focus:ring-kanban-teal w-6 h-6 bg-slate-950"
                                    checked={checkZerar} onChange={(e) => setCheckZerar(e.target.checked)} />
                                Referências zeradas e prontas
                            </label>
                            <label className="flex items-center gap-4 cursor-pointer text-lg font-bold text-slate-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50">
                                <input type="checkbox" className="rounded-md border-2 border-slate-700 text-kanban-teal focus:ring-kanban-teal w-6 h-6 bg-slate-950"
                                    checked={checkPrograma} onChange={(e) => setCheckPrograma(e.target.checked)} />
                                Programa carregado corretamente
                            </label>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-base text-slate-400 mb-4 font-medium">
                            Direcione máquina e operador{codigoPeca ? ` para ${codigoPeca}` : ''}.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-100 mb-2">Máquina</label>
                                <select
                                    value={selectedMaquina}
                                    onChange={(e) => setSelectedMaquina(e.target.value)}
                                    required
                                    className="w-full min-h-[48px] p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber bg-slate-950 text-slate-100 font-bold [color-scheme:dark]"
                                >
                                    <option value="" disabled>Escolha na lista...</option>
                                    {filteredMaquinas.map((m) => (
                                        <option key={m.id} value={m.nome}>{m.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-100 mb-2">Operador</label>
                                <select
                                    value={selectedOperador}
                                    onChange={(e) => setSelectedOperador(e.target.value)}
                                    required
                                    className="w-full min-h-[48px] p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber bg-slate-950 text-slate-100 font-bold [color-scheme:dark]"
                                >
                                    <option value="" disabled>Escolha na lista...</option>
                                    {filteredOperadores.map((op) => (
                                        <option key={op.id} value={op.nome}>{op.nome}</option>
                                    ))}
                                </select>

                            </div>
                        </div>

                        {isSetup && (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 mt-4">
                                <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">Estratégia de ferramentas</h4>
                                <p className="text-xs text-slate-500">Escolha por O.S. — ex.: peça longa noturna = magazine completo.</p>

                                <div className="space-y-2">
                                    {ESTRATEGIA_FERRAMENTAL_OPTIONS.map((opt) => (
                                        <label
                                            key={opt.key}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${estrategiaFerramental === opt.key ? 'border-kanban-amber bg-kanban-amber/10' : 'border-slate-800 hover:border-slate-700'}`}
                                        >
                                            <input
                                                type="radio"
                                                name="estrategia"
                                                value={opt.key}
                                                checked={estrategiaFerramental === opt.key}
                                                onChange={() => setEstrategiaFerramental(opt.key)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <span className="font-bold text-slate-200 text-sm">{opt.label}</span>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{opt.hint}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {ferramentasCam.length > 0 && (
                                    <div className="bg-slate-950 border border-kanban-amber/40 rounded-xl p-3.5 space-y-2 mt-3 animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between">
                                            <h5 className="font-extrabold text-kanban-amber text-xs uppercase tracking-wider flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-kanban-amber" />
                                                Ferramentas Exigidas pelo CAM ({ferramentasCam.length})
                                            </h5>
                                        </div>
                                        <p className="text-[11px] text-slate-400">Marque as ferramentas conforme for conferindo a presença no magazine da máquina:</p>
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                            {ferramentasCam.map((f, i) => (
                                                <label key={i} className="flex items-center gap-2.5 bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-xs text-slate-200 cursor-pointer hover:border-slate-700 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!checkedCamTools[i]}
                                                        onChange={(e) => setCheckedCamTools(prev => ({ ...prev, [i]: e.target.checked }))}
                                                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-kanban-amber focus:ring-0 cursor-pointer"
                                                    />
                                                    <span className="font-mono text-kanban-amber font-bold">{f.codigoT || `T${String(i + 1).padStart(2, '0')}`}</span>
                                                    <span className="font-medium text-slate-200 truncate">{f.nome || 'Ferramenta de usinagem'}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {estrategiaFerramental === 'lote' && (
                                    <div className="space-y-3 pt-2 border-t border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Magazine desta O.S.</span>
                                            <button type="button" onClick={addLinhaMagazine} className="text-kanban-amber text-xs font-bold flex items-center gap-1">
                                                <Plus className="w-3 h-3" /> Adicionar
                                            </button>
                                        </div>

                                        {itensMagazine.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                                <div className="col-span-6">
                                                    <select
                                                        value={row.estoqueItemId}
                                                        onChange={(e) => updateLinhaMagazine(idx, 'estoqueItemId', e.target.value)}
                                                        className="w-full p-2 text-xs border border-slate-800 rounded-lg bg-slate-950 text-slate-100 [color-scheme:dark]"
                                                    >
                                                        <option value="">Ferramenta...</option>
                                                        {estoque.filter((i) => i.quantidade > 0).map((item) => (
                                                            <option key={item.id} value={item.id}>{item.nome} ({item.quantidade})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={row.quantidade}
                                                        onChange={(e) => updateLinhaMagazine(idx, 'quantidade', e.target.value)}
                                                        className="w-full p-2 text-xs border border-slate-800 rounded-lg bg-slate-950 text-slate-100"
                                                        title="Qtd"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="text"
                                                        placeholder="T01"
                                                        value={row.slot}
                                                        onChange={(e) => updateLinhaMagazine(idx, 'slot', e.target.value)}
                                                        className="w-full p-2 text-xs border border-slate-800 rounded-lg bg-slate-950 text-slate-100"
                                                    />
                                                </div>
                                                {itensMagazine.length > 1 && (
                                                    <button type="button" onClick={() => removeLinhaMagazine(idx)} className="col-span-1 p-2 text-slate-600 hover:text-red-400">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        <label className="flex items-start gap-2 text-xs text-slate-400">
                                            <input
                                                type="checkbox"
                                                checked={baixarEstoqueSetup}
                                                onChange={(e) => setBaixarEstoqueSetup(e.target.checked)}
                                                className="mt-0.5"
                                            />
                                            <span>Descontar do estoque agora (senão só registra o que está na máquina; quebra desconta depois)</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                <div className="pt-6 flex justify-end gap-3 mt-8 border-t border-slate-800">
                    <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={isSubmitting} className="w-1/3">Cancelar</Button>
                    <Button type="submit" variant="primary" size="lg" disabled={(isEmCorte && !isCorteReady) || isSubmitting} className="w-2/3 shadow-md">
                        {isSubmitting ? 'Confirmando...' : 'Confirmar Ação'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
