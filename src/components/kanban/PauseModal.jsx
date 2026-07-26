import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAppStore } from '../../store/useAppStore';

const MOTIVOS_PAUSA = [
    'Entrada de outra o.s',
    'Troca de Insumo',
    'Intervalo',
    'Falta de Energia',
    'Manutenção Corretiva',
    'Falta de Material',
    'Falta de Operador',
    'Outros'
];

export default function PauseModal({ isOpen, onClose, onConfirm, osData }) {
    const { estoque, maquinas, operadores, registrarTrocaConsumivel } = useAppStore();

    const [motivo, setMotivo] = useState('');
    const [observacao, setObservacao] = useState('');

    // Estados específicos para Troca de Insumo
    const [trocaMaquina, setTrocaMaquina] = useState('');
    const [trocaInsumo, setTrocaInsumo] = useState('');
    const [trocaOperador, setTrocaOperador] = useState('');

    // Estados específicos para Falta de Energia
    const [horaInicioEnergia, setHoraInicioEnergia] = useState('');
    const [horaFimEnergia, setHoraFimEnergia] = useState('');
    const [aplicarGlobal, setAplicarGlobal] = useState(true);

    // Se a OS já está pausada, o modal serve para "Despausar" (Retomar).
    // O texto e as ações mudam.
    const isAlreadyPaused = osData?.is_pausado || osData?.isPausado;

    const handleSubmit = (e) => {
        e.preventDefault();
        let obsFinal = observacao;

        // Se for Pausa por "Troca de Insumo", exigir os campos
        if (!isAlreadyPaused && motivo === 'Troca de Insumo') {
            if (!trocaMaquina || !trocaInsumo || !trocaOperador) {
                alert("Por favor, preencha a máquina, o insumo e o operador para registrar a troca.");
                return;
            }
            registrarTrocaConsumivel(trocaMaquina, trocaInsumo, trocaOperador);

            const nomeMaquina = maquinas.find(m => m.id === trocaMaquina)?.nome || 'Máquina';
            obsFinal = `Troca de insumo: ${trocaInsumo} na máquina ${nomeMaquina} por ${trocaOperador}. ${observacao}`.trim();
        } else if (!isAlreadyPaused && motivo === 'Falta de Energia') {
            if (!horaInicioEnergia || !horaFimEnergia) {
                alert("Por favor, preencha o horário de início e término da falta de energia.");
                return;
            }

            // Validação simples: fim depois do início
            const [hIni, mIni] = horaInicioEnergia.split(':').map(Number);
            const [hFim, mFim] = horaFimEnergia.split(':').map(Number);
            const inicioMin = hIni * 60 + mIni;
            const fimMin = hFim * 60 + mFim;
            if (isNaN(inicioMin) || isNaN(fimMin) || fimMin <= inicioMin) {
                alert("Horário de retorno deve ser maior que o horário de início.");
                return;
            }

            obsFinal = `Período sem energia: de ${horaInicioEnergia} às ${horaFimEnergia}. ${observacao}`.trim();

            // Pausa retroativa: não muda o estado atual (não deixa a OS em pausa agora).
            onConfirm({
                tipo: 'faltaEnergiaRetroativa',
                horaInicioEnergia,
                horaFimEnergia,
                observacaoPausa: obsFinal,
                aplicarGlobal
            });

            // Reset e saída antecipada
            setMotivo('');
            setObservacao('');
            setTrocaMaquina('');
            setTrocaInsumo('');
            setTrocaOperador('');
            setHoraInicioEnergia('');
            setHoraFimEnergia('');
            return;
        }

        if (isAlreadyPaused) {
            // Retomar
            onConfirm({
                isPausado: false,
                motivoPausa: null,
                observacaoPausa: null,
                dataRetomada: new Date().toISOString()
            });
        } else {
            // Pausar
            onConfirm({
                isPausado: true,
                motivoPausa: motivo,
                observacaoPausa: obsFinal,
                dataPausa: new Date().toISOString()
            });
        }

        // Reset
        setMotivo('');
        setObservacao('');
        setTrocaMaquina('');
        setTrocaInsumo('');
        setTrocaOperador('');
        setHoraInicioEnergia('');
        setHoraFimEnergia('');
        setAplicarGlobal(true);
    };

    if (!osData) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isAlreadyPaused ? `Retomar Produção: ${osData.codigo_peca || osData.codigoPeca}` : `Pausar O.S: ${osData.codigo_peca || osData.codigoPeca}`}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {isAlreadyPaused ? (
                    <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-xl text-slate-300 shadow-xl relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-kanban-green"></div>
                        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Deseja Retomar Produção?</h3>
                        <p className="text-slate-400 text-sm">A workstation será reativada e o cronômetro voltará a contar.</p>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Motivo da Pausa *</label>
                            <select
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                required
                                className="w-full p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 bg-slate-950 text-slate-100 font-bold text-lg [color-scheme:dark]"
                            >
                                <option value="" disabled>Selecione um motivo...</option>
                                {MOTIVOS_PAUSA.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {motivo === 'Outros' && (
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Observação Adicional *</label>
                                <textarea
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                    required
                                    rows={3}
                                    placeholder="Detalhe o motivo da pausa..."
                                    className="w-full p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 text-lg bg-slate-950 placeholder-slate-600"
                                />
                            </div>
                        )}

                        {motivo === 'Falta de Energia' && (
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                                <h4 className="font-extrabold text-slate-100 flex items-center gap-2">
                                    <span className="bg-kanban-red text-white px-2 py-1 rounded text-xs uppercase tracking-widest">Atenção</span>
                                    Registro de Horário Retrospectivo
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-1">Hora Inicial</label>
                                        <input
                                            type="time"
                                            value={horaInicioEnergia}
                                            onChange={(e) => setHoraInicioEnergia(e.target.value)}
                                            required
                                            className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-1">Hora de Retorno</label>
                                        <input
                                            type="time"
                                            value={horaFimEnergia}
                                            onChange={(e) => setHoraFimEnergia(e.target.value)}
                                            required
                                            className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber"
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 flex items-start gap-2 bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                                    <input
                                        id="aplicarGlobalEnergia"
                                        type="checkbox"
                                        checked={aplicarGlobal}
                                        onChange={(e) => setAplicarGlobal(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-kanban-amber focus:ring-kanban-amber"
                                    />
                                    <div>
                                        <label htmlFor="aplicarGlobalEnergia" className="text-xs font-bold text-slate-200">
                                            Deseja registrar esta falta de energia para todo o sistema?
                                        </label>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Aplica este mesmo período de parada a todas as O.S. ativas em Set-up, Corte e Aferição.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {motivo === 'Troca de Insumo' && (
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                                <h4 className="font-extrabold text-kanban-amber flex items-center gap-2">
                                    <span className="bg-kanban-amber text-slate-900 px-2 py-1 rounded text-xs uppercase tracking-widest">Estoque</span>
                                    Registro de Retirada
                                </h4>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Máquina Parada Onde Ocorreu a Troca</label>
                                    <select value={trocaMaquina} onChange={e => setTrocaMaquina(e.target.value)} className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber [color-scheme:dark]" required>
                                        <option value="" disabled>Selecione...</option>
                                        {maquinas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Insumo Utilizado</label>
                                    <select value={trocaInsumo} onChange={e => setTrocaInsumo(e.target.value)} className="w-full p-2 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber [color-scheme:dark]" required>
                                        <option value="" disabled>Selecione o insumo...</option>
                                        {estoque.filter(i => i.quantidade > 0).map(item => (
                                            <option key={item.id} value={item.nome}>{item.nome} (Disp: {item.quantidade})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-1">Operador Responsável</label>
                                    <select value={trocaOperador} onChange={e => setTrocaOperador(e.target.value)} className="w-full min-h-[48px] p-3 border border-slate-800 rounded-lg font-bold text-slate-100 bg-slate-950 focus:outline-none focus:border-kanban-amber [color-scheme:dark] touch-manipulation" required>
                                        <option value="" disabled>Quem efetuou a troca...</option>
                                        {operadores.map(o => <option key={o.id} value={o.nome}>{o.nome}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {(motivo !== '' && motivo !== 'Outros') && (
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Observação Extra (Opcional)</label>
                                <input
                                    type="text"
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                    placeholder="Alguma nota sobre a parada de máquina?"
                                    className="w-full p-3 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 text-lg bg-slate-950 placeholder-slate-600"
                                />
                            </div>
                        )}
                    </>
                )}

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-800 mt-8">
                    <Button type="button" variant="outline" size="lg" onClick={onClose} className="w-1/3">Cancelar</Button>
                    <Button
                        type="submit"
                        variant={isAlreadyPaused ? "success" : "primary"}
                        size="lg"
                        className="w-2/3 shadow-md"
                    >
                        {isAlreadyPaused ? 'Retomar Produção' : 'Confirmar Pausa'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
