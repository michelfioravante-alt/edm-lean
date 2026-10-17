import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import CalculadoraTempoModal from '../common/CalculadoraTempoModal';
import { useAppStore } from '../../store/useAppStore';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import {
    lerChecklistFerramentas,
    lerLinkPrograma,
    novaLinhaChecklist,
    estoqueFerramentasDoSetor,
    serializarChecklistFerramentas,
} from '../../utils/ferramentasChecklist';

export default function ProgramarKanbanModal({ isOpen, onClose, osData }) {
    const { programadores, estoque, fetchEstoque, editOrdemServico, notificarApp } = useAppStore();
    const [saving, setSaving] = useState(false);
    const [showCalc, setShowCalc] = useState(false);
    const setorRaw = osData?.setor || 'CNC';
    const setor = String(setorRaw).toUpperCase();
    const itensEstoque = estoqueFerramentasDoSetor(estoque, setor === 'TORNO' ? 'CNC' : setor);

    const [form, setForm] = useState({
        programador: '',
        tempoEstimadoCorteHoras: '',
        tempoEstimadoCorteMinutos: '',
        tempoEstimadoSetupHoras: '',
        tempoEstimadoSetupMinutos: '',
        numeroPrograma: '',
        linkPrograma: '',
        totalSetups: 1,
            nomesSetups: ['OP10'],
        checklistFerramentas: [],
    });

    useEffect(() => {
        if (!isOpen || !osData) return;
        fetchEstoque?.();
        setForm({
            programador: osData.programador || osData.programador_nome || '',
            tempoEstimadoCorteHoras: String(osData.tempo_estimado_corte_horas ?? ''),
            tempoEstimadoCorteMinutos: String(osData.tempo_estimado_corte_minutos ?? ''),
            tempoEstimadoSetupHoras: String(osData.tempo_estimado_setup_horas ?? ''),
            tempoEstimadoSetupMinutos: String(osData.tempo_estimado_setup_minutos ?? ''),
            numeroPrograma: osData.numero_programa || '',
            linkPrograma: lerLinkPrograma(osData),
            totalSetups: osData.total_setups || 1,
            nomesSetups: Array.isArray(osData.nomes_setups) && osData.nomes_setups.length
                ? osData.nomes_setups
                : ['OP10'],
            checklistFerramentas: lerChecklistFerramentas(osData),
        });
    }, [isOpen, osData?.id, fetchEstoque]);

    if (!isOpen || !osData) return null;

    const inputCls = 'w-full px-3 py-2 border border-[#262A33] bg-[#111318] rounded-[8px] text-[#E7E9ED] text-sm focus:outline-none focus:border-[#D97D3D] [color-scheme:dark]';
    const labelCls = 'block text-[10px] font-semibold text-[#565B68] uppercase tracking-wider mb-1.5';
    const isEdm = setor === 'EDM_FIO' || setor.includes('EDM') || setor.includes('FIO');
    const isCnc = setor === 'CNC' || setor === 'TORNO' || (!isEdm && setor !== 'EXTERNO');
    const linkDesenho = osData.link_desenho || '';
    const programadoresDoSetor = (programadores || []).filter((p) => !p.setor || p.setor === 'TODOS' || p.setor === setor);

    const setLinha = (index, patch) => {
        setForm((p) => {
            const next = [...(p.checklistFerramentas || [])];
            next[index] = { ...next[index], ...patch };
            return { ...p, checklistFerramentas: next };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const checklist = serializarChecklistFerramentas(
                (form.checklistFerramentas || []).filter((r) => r.estoqueItemId || r.estoque_item_id || r.nome),
            );
            await editOrdemServico(osData.id, {
                programador: form.programador,
                tempoEstimadoCorteHoras: form.tempoEstimadoCorteHoras,
                tempoEstimadoCorteMinutos: form.tempoEstimadoCorteMinutos,
                tempoEstimadoSetupHoras: form.tempoEstimadoSetupHoras,
                tempoEstimadoSetupMinutos: form.tempoEstimadoSetupMinutos,
                numeroPrograma: form.numeroPrograma,
                linkPrograma: form.linkPrograma || null,
                checklistFerramentas: checklist,
                programado: true,
            });
            onClose();
        } catch (err) {
            notificarApp(err?.message || 'Não foi possível salvar a programação.');
        }
        setSaving(false);
    };

    return (
        <>
        <Modal isOpen={isOpen} onClose={onClose} title={`Programar: ${osData.codigo_peca || ''}`} maxWidth="max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-[#7B808F]">
                    {isEdm
                        ? 'O gestor já deixou o desenho da peça. Aqui o programador de fio solta o programa (ISO/NC), o caminho na rede e os tempos. Sem isso o cartão não vai para preparação.'
                        : 'O gestor só abriu o cartão. Digite os tempos previstos, o checklist do estoque e o caminho do programa na rede.'}
                </p>

                {linkDesenho ? (
                    <div className="bg-[#111318] border border-[#262A33] rounded-[8px] p-3">
                        <p className={labelCls}>Desenho da peça (O.S. da gestão)</p>
                        <p className="text-xs font-mono text-[#9DA2AE] break-all">{linkDesenho}</p>
                        <p className="text-[10px] text-[#565B68] mt-1">Não substitua isso pelo programa. São arquivos diferentes.</p>
                    </div>
                ) : (
                    <p className="text-[11px] text-[#C99A4A]">Esta O.S. ainda não tem caminho de desenho — peça à gestão completar. O programa CAM/WEDM você preenche abaixo.</p>
                )}

                <div>
                    <label className={labelCls}>Programador</label>
                    <select value={form.programador} onChange={(e) => setForm((p) => ({ ...p, programador: e.target.value }))} className={inputCls}>
                        <option value="">— Selecionar —</option>
                        {programadoresDoSetor.map((p) => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                    </select>
                </div>

                {isEdm && (
                    <button type="button" onClick={() => setShowCalc(true)} className="text-xs font-semibold text-[#4A9D74] flex items-center gap-1 cursor-pointer min-h-[44px]">
                        <Calculator className="w-3.5 h-3.5" /> Calculadora WEDM
                    </button>
                )}

                <div>
                    <label className={labelCls}>{isEdm ? 'Nº do programa (na máquina de fio)' : 'Nº do programa (na máquina)'}</label>
                    <input value={form.numeroPrograma} onChange={(e) => setForm((p) => ({ ...p, numeroPrograma: e.target.value }))} className={inputCls} placeholder={isEdm ? 'W1001' : 'O1001'} />
                </div>

                <div>
                    <label className={labelCls}>Caminho do programa (rede / pasta)</label>
                    <input
                        value={form.linkPrograma}
                        onChange={(e) => setForm((p) => ({ ...p, linkPrograma: e.target.value }))}
                        className={inputCls}
                        placeholder={isEdm ? '\\\\servidor\\wedm\\programas\\W1001.NC' : '\\\\servidor\\cnc\\programas\\O1001.NC'}
                    />
                    <p className="text-[10px] text-[#565B68] mt-1">Arquivo do programa, não o desenho. Só existe depois desta programação. O cartão passa a mostrar Programado.</p>
                </div>

                {isCnc && (
                    <div className="border border-[#262A33] rounded-[8px] p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className={`${labelCls} mb-0`}>Checklist de ferramentas (estoque)</label>
                            <button
                                type="button"
                                onClick={() => setForm((p) => ({ ...p, checklistFerramentas: [...(p.checklistFerramentas || []), novaLinhaChecklist()] }))}
                                className="text-[#D97D3D] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-3 h-3" /> Adicionar
                            </button>
                        </div>
                        <p className="text-[11px] text-[#7B808F]">Lista do estoque. O operador marca no set-up; para montar outra, devolve o cartão para set-up.</p>
                        {(form.checklistFerramentas || []).map((row, idx) => (
                            <div key={row.id || idx} className="grid grid-cols-12 gap-2 items-center">
                                <input
                                    className={`${inputCls} col-span-2 py-1.5 text-xs font-mono`}
                                    placeholder="T01"
                                    value={row.slot || ''}
                                    onChange={(e) => setLinha(idx, { slot: e.target.value })}
                                />
                                <select
                                    className={`${inputCls} col-span-9 py-1.5 text-xs`}
                                    value={row.estoqueItemId || ''}
                                    onChange={(e) => {
                                        const item = itensEstoque.find((i) => i.id === e.target.value);
                                        setLinha(idx, { estoqueItemId: e.target.value, nome: item?.nome || row.nome });
                                    }}
                                >
                                    <option value="">{row.nome && !row.estoqueItemId ? `(CAM) ${row.nome}` : 'Ferramenta do estoque...'}</option>
                                    {itensEstoque.map((item) => (
                                        <option key={item.id} value={item.id}>{item.nome} ({item.quantidade})</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => setForm((p) => ({ ...p, checklistFerramentas: p.checklistFerramentas.filter((_, i) => i !== idx) }))} className="col-span-1 text-[#565B68] hover:text-[#C85558] cursor-pointer">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {!(form.checklistFerramentas || []).length && (
                            <p className="text-[11px] text-[#565B68] italic">Nenhuma ferramenta ainda. Importe a folha ou adicione do estoque.</p>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>Setup (h / min)</label>
                        <div className="flex gap-2">
                            <input inputMode="numeric" value={form.tempoEstimadoSetupHoras} onChange={(e) => setForm((p) => ({ ...p, tempoEstimadoSetupHoras: e.target.value }))} className={inputCls} placeholder="h" />
                            <input inputMode="numeric" value={form.tempoEstimadoSetupMinutos} onChange={(e) => setForm((p) => ({ ...p, tempoEstimadoSetupMinutos: e.target.value }))} className={inputCls} placeholder="min" />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>{isEdm ? 'Corte a fio (h / min)' : 'Usinagem (h / min)'}</label>
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
        <Modal
            isOpen={showCalc}
            onClose={() => setShowCalc(false)}
            title="Calculadora WEDM"
            maxWidth="max-w-md"
            overlayClassName="z-[210]"
        >
            <CalculadoraTempoModal
                initialQuantidade={parseInt(osData.quantidade, 10) || 1}
                onCalculate={(h, m) => {
                    setForm((p) => ({ ...p, tempoEstimadoCorteHoras: String(h), tempoEstimadoCorteMinutos: String(m) }));
                    setShowCalc(false);
                }}
                onClose={() => setShowCalc(false)}
            />
        </Modal>
        </>
    );
}
