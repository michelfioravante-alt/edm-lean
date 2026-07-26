import React, { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import CalculadoraTempoModal from '../common/CalculadoraTempoModal';
import { Calculator } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function NovaOSForm({ onClose }) {
    const { maquinas, operadores, programadores, clientes, addCliente } = useAppStore();
    // maquinas e operadores são selecionados na etapa Set-up (TransitionModal)

    const [isCalcOpen, setIsCalcOpen] = useState(false);
    // Warning state for unregistered clients
    const [clienteWarning, setClienteWarning] = useState(false); // null | 'ask' | 'register'
    const [quickEmail, setQuickEmail] = useState('');
    const [quickTelefone, setQuickTelefone] = useState('');
    const [quickSaving, setQuickSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        cliente: '',
        codigoPeca: '',
        dataCriacao: new Date().toISOString().slice(0, 10), // date format YYYY-MM-DD
        prazoEntrega: '',
        tempoEstimadoCorteHoras: '',
        tempoEstimadoCorteMinutos: '',
        tempoEstimadoSetupHoras: '',
        tempoEstimadoSetupMinutos: '',
        programador: '',
        linkDesenho: '',
        isPrioridade: false,
        quantidade: 1
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validação estrita para os campos de tempo (apenas números positivos)
        if (name.includes('tempoEstimado')) {
            if (value !== '' && (!/^\d+$/.test(value) || parseInt(value) < 0)) return;

            // Validação extra para minutos (0-59)
            if (name.includes('Minutos') && value !== '' && parseInt(value) > 59) return;
        }

        // Checkbox handling
        if (e.target.type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: e.target.checked }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        // Reset warning whenever client field changes
        if (name === 'cliente') setClienteWarning(false);
    };

    // Called when user leaves the client field
    const handleClienteBlur = () => {
        const typed = formData.cliente.trim();
        if (!typed) return;
        const isRegistered = clientes.some(
            c => c.nome.toLowerCase() === typed.toLowerCase()
        );
        if (!isRegistered) setClienteWarning('ask');
    };

    const handleQuickRegister = async () => {
        if (!formData.cliente.trim() || quickSaving) return;

        setQuickSaving(true);
        try {
            await addCliente({
                nome: formData.cliente.trim(),
                email: quickEmail.trim(),
                telefone: quickTelefone.trim()
            });
            // Sucesso
            setClienteWarning(false);
            setQuickEmail('');
            setQuickTelefone('');
        } catch (err) {
            console.error('Erro ao cadastrar cliente rápido:', err);
            alert(err?.message || 'Erro ao cadastrar cliente. Verifique a conexão.');
        } finally {
            setQuickSaving(false);
        }
    };

    const handleApplyCalculatedTime = (horas, minutos, novaQuantidade) => {
        setFormData(prev => ({
            ...prev,
            tempoEstimadoCorteHoras: horas.toString(),
            tempoEstimadoCorteMinutos: minutos.toString(),
            quantidade: novaQuantidade !== undefined ? novaQuantidade : prev.quantidade
        }));
        setIsCalcOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const novaOS = { ...formData, status: 'A fazer' };
        const { addOrdemServico } = useAppStore.getState();

        setIsSubmitting(true);
        // Modo otimista: coloca a O.S. na lista na hora e fecha o modal; o salvamento segue em background.
        addOrdemServico(novaOS, {
            optimistic: true,
            onError: (err) => {
                const msg = err?.message === 'TIMEOUT'
                    ? 'A conexão está lenta. A O.S. pode ter sido criada — confira a lista em alguns segundos.'
                    : (err?.message || 'Não foi possível criar a O.S. Verifique a conexão e tente de novo.');
                alert(msg);
                console.error('Erro ao criar OS:', err);
            }
        });
        onClose();
        setIsSubmitting(false);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5">Cliente</label>
                        <input
                            type="text"
                            name="cliente"
                            list="clientes-lista"
                            value={formData.cliente}
                            onChange={handleChange}
                            onBlur={handleClienteBlur}
                            required
                            placeholder="Selecione ou digite o nome"
                            className={`w-full px-3 py-2 border bg-slate-950 rounded-lg focus:outline-none focus:ring-0 text-slate-100 text-base placeholder-slate-600 transition-colors ${clienteWarning ? 'border-amber-500' : 'border-slate-800 focus:border-kanban-amber'
                                }`}
                        />
                        <datalist id="clientes-lista">
                            {clientes.map(c => (
                                <option key={c.id} value={c.nome} />
                            ))}
                        </datalist>

                        {/* Warning: unregistered client */}
                        {clienteWarning === 'ask' && (
                            <div className="mt-2 flex items-center gap-3 bg-amber-950/40 border border-amber-500/50 rounded-lg px-3 py-2">
                                <span className="text-amber-400 text-sm font-bold flex-1">
                                    ⚠️ Cliente não cadastrado. Deseja cadastrar?
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setClienteWarning('register')}
                                    className="text-xs font-extrabold bg-kanban-amber text-slate-900 px-3 py-1.5 rounded-md hover:bg-yellow-400 transition-colors"
                                >Sim</button>
                                <button
                                    type="button"
                                    onClick={() => setClienteWarning(false)}
                                    className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                                >Não</button>
                            </div>
                        )}

                        {/* Inline quick-register form */}
                        {clienteWarning === 'register' && (
                            <div className="mt-3 bg-slate-900 border border-kanban-amber/40 rounded-xl p-4 space-y-3">
                                <p className="text-xs font-extrabold text-kanban-amber uppercase tracking-wider">Cadastro Rápido de Cliente</p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="email"
                                        value={quickEmail}
                                        onChange={e => setQuickEmail(e.target.value)}
                                        placeholder="E-mail (opcional)"
                                        className="flex-1 min-h-[44px] px-3 py-2 border border-slate-700 bg-slate-950 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-kanban-amber touch-manipulation"
                                    />
                                    <input
                                        type="tel"
                                        value={quickTelefone}
                                        onChange={e => setQuickTelefone(e.target.value)}
                                        placeholder="Telefone (opcional)"
                                        className="flex-1 min-h-[44px] px-3 py-2 border border-slate-700 bg-slate-950 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-kanban-amber touch-manipulation"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setClienteWarning(false)}
                                        className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-md border border-slate-700 hover:border-slate-500 transition-colors"
                                    >Cancelar</button>
                                    <button
                                        type="button"
                                        onClick={handleQuickRegister}
                                        disabled={quickSaving}
                                        className="text-xs font-extrabold bg-kanban-amber text-slate-900 px-4 py-2.5 min-h-[44px] rounded-md hover:bg-yellow-400 transition-colors disabled:opacity-60 touch-manipulation"
                                    >{quickSaving ? 'Salvando...' : 'Salvar Cliente'}</button>
                                </div>
                                {/* Name preview */}
                                <p className="text-[10px] text-slate-500">
                                    Nome: <span className="font-bold text-slate-300">{formData.cliente.trim()}</span>
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-slate-300 mb-1.5">Código da Peça</label>
                            <input
                                type="text"
                                name="codigoPeca"
                                value={formData.codigoPeca}
                                onChange={handleChange}
                                required
                                placeholder="Ex: PN-12345"
                                className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 text-base uppercase placeholder-slate-600"
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-sm font-bold text-slate-300 mb-1.5">Quantidade</label>
                            <input
                                type="number"
                                name="quantidade"
                                value={formData.quantidade}
                                onChange={handleChange}
                                min="1"
                                required
                                className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 text-base font-bold text-center"
                            />
                        </div>
                    </div>
                </div>

                {/* Switch Prioridade */}
                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 w-max cursor-pointer group hover:bg-slate-900 transition-colors" onClick={() => setFormData(p => ({ ...p, isPrioridade: !p.isPrioridade }))}>
                    <input
                        type="checkbox"
                        name="isPrioridade"
                        checked={formData.isPrioridade}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-2 border-slate-700 bg-slate-950 text-red-500 focus:ring-red-500 focus:ring-offset-slate-900 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <label className="text-sm font-bold text-slate-300 cursor-pointer group-hover:text-white transition-colors flex items-center gap-2 relative">
                        💥 Marcar como Prioridade
                    </label>
                </div>

                {/* Endereço do Desenho Técnico */}
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-2">
                        Link / Caminho do Desenho (DXF/DWG)
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded tracking-widest uppercase">OPCIONAL</span>
                    </label>
                    <input
                        type="text"
                        name="linkDesenho"
                        value={formData.linkDesenho}
                        onChange={handleChange}
                        placeholder="Ex: Z:\Engenharia\Projetos\Peca_123.dxf ou link do Google Drive"
                        className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 text-sm font-medium placeholder-slate-600"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tempo de Corte */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <label className="flex items-center justify-between text-sm font-bold text-slate-300 mb-2">
                            <span>Tempo Est. de Corte</span>
                            <button
                                type="button"
                                onClick={() => setIsCalcOpen(true)}
                                className="text-slate-900 bg-kanban-amber hover:bg-yellow-400 px-2 py-1 text-xs font-bold rounded flex items-center gap-1 shadow-sm transition-colors active:scale-95 border-2 border-kanban-amber hover:border-yellow-400"
                            >
                                <Calculator className="w-3 h-3" />
                                Calc. Múltiplo
                            </button>
                        </label>
                        <div className="flex gap-2 items-center mt-1">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    name="tempoEstimadoCorteHoras"
                                    value={formData.tempoEstimadoCorteHoras}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-3 py-2 pr-7 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-center text-lg font-bold text-slate-100 placeholder-slate-600"
                                />
                                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">h</span>
                            </div>
                            <span className="text-slate-400 font-extrabold text-xl">:</span>
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    name="tempoEstimadoCorteMinutos"
                                    value={formData.tempoEstimadoCorteMinutos}
                                    onChange={handleChange}
                                    placeholder="00"
                                    min="0" max="59"
                                    className="w-full px-3 py-2 pr-7 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-center text-lg font-bold text-slate-100 placeholder-slate-600"
                                />
                                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">m</span>
                            </div>
                        </div>
                    </div>

                    {/* Tempo de Set-Up */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <label className="block text-sm font-bold text-slate-300 mb-2 mt-1">Tempo Est. de Set-Up</label>
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    name="tempoEstimadoSetupHoras"
                                    value={formData.tempoEstimadoSetupHoras}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-3 py-2 pr-7 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-center text-lg font-bold text-slate-100 placeholder-slate-600"
                                />
                                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">h</span>
                            </div>
                            <span className="text-slate-400 font-extrabold text-xl">:</span>
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    name="tempoEstimadoSetupMinutos"
                                    value={formData.tempoEstimadoSetupMinutos}
                                    onChange={handleChange}
                                    placeholder="00"
                                    min="0" max="59"
                                    className="w-full px-3 py-2 pr-7 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-center text-lg font-bold text-slate-100 placeholder-slate-600"
                                />
                                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">m</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Datas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5">Data de Criação</label>
                        <input
                            type="date"
                            name="dataCriacao"
                            value={formData.dataCriacao}
                            disabled
                            className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-900 text-slate-500 cursor-not-allowed font-medium text-base [color-scheme:dark]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5">Prazo de Entrega (Deadline)</label>
                        <input
                            type="date"
                            name="prazoEntrega"
                            value={formData.prazoEntrega}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 font-semibold text-base [color-scheme:dark]"
                        />
                    </div>
                </div>

                <hr className="border-t border-slate-800 border-dashed my-1" />

                {/* Listas Suspensas (Dropdowns) */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5">Programador Responsável</label>
                        <select
                            name="programador"
                            value={formData.programador}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 bg-slate-950 text-slate-100 text-base font-bold [color-scheme:dark]"
                        >
                            <option value="" disabled className="bg-slate-900 text-slate-400">Selecione um profissional...</option>
                            {programadores.map(p => (
                                <option key={p.id} value={p.nome} className="bg-slate-900 text-slate-100 hover:bg-slate-800">{p.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-slate-800">
                    <Button type="button" variant="outline" size="md" onClick={onClose} className="w-1/3">Cancelar</Button>
                    <Button type="submit" variant="primary" size="md" className="w-2/3 shadow-md" disabled={isSubmitting}>
                        {isSubmitting ? 'Criando...' : 'Criar Ordem'}
                    </Button>
                </div>

            </form>

            <Modal
                isOpen={isCalcOpen}
                onClose={() => setIsCalcOpen(false)}
                title="Calcular Tempo de Corte"
                maxWidth="max-w-xl"
            >
                <CalculadoraTempoModal
                    onCalculate={handleApplyCalculatedTime}
                    onClose={() => setIsCalcOpen(false)}
                    initialQuantidade={formData.quantidade}
                />
            </Modal>
        </>
    );
}
