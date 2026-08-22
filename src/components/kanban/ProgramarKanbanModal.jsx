import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ImportNxSheet from './ImportNxSheet';
import CalculadoraTempoModal from '../common/CalculadoraTempoModal';
import { useAppStore } from '../../store/useAppStore';
import { minutosParaHorasMin } from '../../utils/nxShopDocParser';
import { Calculator } from 'lucide-react';

export default function ProgramarKanbanModal({ isOpen, onClose, osData }) {
    const { programadores, editOrdemServico } = useAppStore();
    const [saving, setSaving] = useState(false);
    const [showCalc, setShowCalc] = useState(false);
    const setor = osData?.setor || 'CNC';

    const [form, setForm] = useState({
        programador: '',
        tempoEstimadoCorteHoras: '',
        tempoEstimadoCorteMinutos: '',
        tempoEstimadoSetupHoras: '',
        tempoEstimadoSetupMinutos: '',
        numeroPrograma: '',
        totalSetups: 1,
        nomesSetups: ['OP10'],
        nxImport: null,
    });

    useEffect(() => {
        if (!isOpen || !osData) return;
        setForm({
            programador: osData.programador || osData.programador_nome || '',
            tempoEstimadoCorteHoras: String(osData.tempo_estimado_corte_horas ?? osData.tempoEstimadoCorteHoras ?? ''),
            tempoEstimadoCorteMinutos: String(osData.tempo_estimado_corte_minutos ?? osData.tempoEstimadoCorteMinutos ?? ''),
            tempoEstimadoSetupHoras: String(osData.tempo_estimado_setup_horas ?? osData.tempoEstimadoSetupHoras ?? ''),
            tempoEstimadoSetupMinutos: String(osData.tempo_estimado_setup_minutos ?? osData.tempoEstimadoSetupMinutos ?? ''),
            numeroPrograma: osData.numero_programa || osData.numeroPrograma || '',
            totalSetups: osData.total_setups || osData.totalSetups || 1,
            nomesSetups: osData.nomes_setups || osData.nomesSetups || ['OP10'],
            nxImport: osData.nx_import || osData.nxImport || null,
        });
    }, [isOpen, osData?.id]);

    if (!osData) return null;

    const inputCls = 'w-full px-3 py-2 border border-[#262A33] bg-[#111318] rounded-[8px] text-[#E7E9ED] text-sm focus:outline-none focus:border-[#D97D3D] [color-scheme:dark]';
    const labelCls = 'block text-[10px] font-semibold text-[#565B68] uppercase tracking-wider mb-1.5';

    const handleNxImport = (data) => {
        const corte = minutosParaHorasMin(data.tempoUsinagemMinutos || 0);
        const setup = minutosParaHorasMin(data.tempoSetupMinutos || 0);
        setForm((p) => ({
            ...p,
            nxImport: data,
            tempoEstimadoCorteHoras: String(corte.horas || ''),
            tempoEstimadoCorteMinutos: String(corte.minutos || ''),
            tempoEstimadoSetupHoras: String(setup.horas || ''),
            tempoEstimadoSetupMinutos: String(setup.minutos || ''),
            numeroPrograma: data.numeroPrograma || data.codigoPeca || p.numeroPrograma,
            programador: data.programador || p.programador,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await editOrdemServico(osData.id, {
                ...form,
                programado: true,
            });
            onClose();
        } catch (err) {
            alert(err?.message || 'Não foi possível salvar a programação.');
        }
        setSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Programar: ${osData.codigo_peca || osData.codigoPeca || ''}`} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-[#7B808F]">Este kanban já está em A fazer. Aqui entra CAM, tempos e programa — não a criação da O.S.</p>

                <div>
                    <label className={labelCls}>Programador</label>
                    <select value={form.programador} onChange={(e) => setForm((p) => ({ ...p, programador: e.target.value }))} className={inputCls}>
                        <option value="">— Selecionar —</option>
                        {programadores.map((p) => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                    </select>
                </div>

                {(setor === 'CNC' || setor === 'TORNO') && (
                    <ImportNxSheet onImport={handleNxImport} />
                )}

                {setor === 'EDM_FIO' && (
                    <div>
                        <button type="button" onClick={() => setShowCalc((v) => !v)} className="text-xs font-semibold text-[#4A9D74] flex items-center gap-1 cursor-pointer">
                            <Calculator className="w-3.5 h-3.5" /> Calculadora WEDM
                        </button>
                        {showCalc && (
                            <div className="mt-2">
                                <CalculadoraTempoModal
                                    onCalculate={(h, m) => setForm((p) => ({ ...p, tempoEstimadoCorteHoras: String(h), tempoEstimadoCorteMinutos: String(m) }))}
                                    onClose={() => setShowCalc(false)}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className={labelCls}>Nº do programa</label>
                    <input value={form.numeroPrograma} onChange={(e) => setForm((p) => ({ ...p, numeroPrograma: e.target.value }))} className={inputCls} placeholder="O1001" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>Setup (h / min)</label>
                        <div className="flex gap-2">
                            <input inputMode="numeric" value={form.tempoEstimadoSetupHoras} onChange={(e) => setForm((p) => ({ ...p, tempoEstimadoSetupHoras: e.target.value }))} className={inputCls} placeholder="h" />
                            <input inputMode="numeric" value={form.tempoEstimadoSetupMinutos} onChange={(e) => setForm((p) => ({ ...p, tempoEstimadoSetupMinutos: e.target.value }))} className={inputCls} placeholder="min" />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Usinagem (h / min)</label>
                        <div className="flex gap-2">
                            <input inputMode="numeric" value={form.tempoEstimadoCorteHoras} onChange={(e) => setForm((p) => ({ ...p, tempoEstimadoCorteHoras: e.target.value }))} className={inputCls} placeholder="h" />
                            <input inputMode="numeric" value={form.tempoEstimadoCorteMinutos} onChange={(e) => setForm((p) => ({ ...p, tempoEstimadoCorteMinutos: e.target.value }))} className={inputCls} placeholder="min" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-[#262A33]">
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="primary" className="flex-[2]" disabled={saving}>
                        {saving ? 'Salvando...' : 'Liberar para set-up'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
