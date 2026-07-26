import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAppStore } from '../../store/useAppStore';

export default function TransitionModal({ isOpen, onClose, onConfirm, targetColumnTitle, destCol }) {
    const { maquinas, operadores } = useAppStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMaquina, setSelectedMaquina] = useState('');
    const [selectedOperador, setSelectedOperador] = useState('');

    // Ao abrir o modal (Set-up), recarrega operadores e máquinas em background (não bloqueia)
    useEffect(() => {
        if (isOpen && destCol !== 'emCorte') {
            const state = useAppStore.getState();
            state.fetchOperadores?.();
            state.fetchMaquinas?.();
        }
    }, [isOpen, destCol]);

    // Checkboxes used for 'emCorte'
    const [checkFixacao, setCheckFixacao] = useState(false);
    const [checkZerar, setCheckZerar] = useState(false);
    const [checkPrograma, setCheckPrograma] = useState(false);

    const isEmCorte = destCol === 'emCorte';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        if (isEmCorte) {
            onConfirm({
                timestampEntradaCorte: new Date().toISOString()
            });
            setCheckFixacao(false);
            setCheckZerar(false);
            setCheckPrograma(false);
        } else {
            onConfirm({
                maquina_nome: selectedMaquina,
                operador_atual: selectedOperador,
                timestampEntradaSetup: new Date().toISOString()
            });
            setSelectedMaquina('');
            setSelectedOperador('');
        }
    };

    const isCorteReady = checkFixacao && checkZerar && checkPrograma;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Movendo para ${targetColumnTitle}...`}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {isEmCorte ? (
                    <>
                        <p className="text-base text-slate-400 mb-6 font-medium">
                            Antes de iniciar o corte, confirme as etapas:
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
                        <p className="text-base text-slate-400 mb-6 font-medium">
                            Para iniciar esta etapa, direcione o recurso responsável.
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-100 mb-2">Selecione a Máquina</label>
                                <select
                                    value={selectedMaquina}
                                    onChange={(e) => setSelectedMaquina(e.target.value)}
                                    required
                                    className="w-full min-h-[48px] p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 bg-slate-950 text-slate-100 font-bold text-lg [color-scheme:dark] touch-manipulation"
                                >
                                    <option value="" disabled>Escolha na lista...</option>
                                    {maquinas.map(m => (
                                        <option key={m.id} value={m.nome}>{m.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-100 mb-2">Operador Responsável</label>
                                <select
                                    value={selectedOperador}
                                    onChange={(e) => setSelectedOperador(e.target.value)}
                                    required
                                    className="w-full min-h-[48px] p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 bg-slate-950 text-slate-100 font-bold text-lg [color-scheme:dark] touch-manipulation"
                                >
                                    <option value="" disabled>Escolha na lista...</option>
                                    {operadores.map(op => (
                                        <option key={op.id} value={op.nome}>{op.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
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
