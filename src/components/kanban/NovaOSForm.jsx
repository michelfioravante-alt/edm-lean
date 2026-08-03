import React, { useState } from 'react';
import Button from '../common/Button';
import ImportNxSheet from './ImportNxSheet';
import { useAppStore } from '../../store/useAppStore';
import { minutosParaHorasMin } from '../../utils/nxShopDocParser';
import { Cpu, Zap, Wrench, Plus, Trash2, CheckCircle2 } from 'lucide-react';


/**
 * Nome vindo da folha CAM só preenche o formulário se existir no cadastro —
 * caso contrário o campo ficaria com um valor que o select nem consegue exibir.
 */
function nomeCadastrado(cadastro, nome) {
    const alvo = (nome || '').trim().toLowerCase();
    if (!alvo) return '';
    return cadastro.find((item) => item.nome?.trim().toLowerCase() === alvo)?.nome || '';
}

export default function NovaOSForm({ onClose }) {
    const { maquinas, operadores, programadores, clientes, addCliente, estoque = [] } = useAppStore();
    // maquinas e operadores são selecionados na etapa Set-up (TransitionModal)

    const activeSector = useAppStore(state => state.activeSector);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nxImportMeta, setNxImportMeta] = useState(null);
    const [ferramentasList, setFerramentasList] = useState([]);
    const [clienteWarning, setClienteWarning] = useState(false);
    const [quickEmail, setQuickEmail] = useState('');
    const [quickTelefone, setQuickTelefone] = useState('');
    const [quickSaving, setQuickSaving] = useState(false);

    const [formData, setFormData] = useState({
        setor: activeSector !== 'TODOS' ? activeSector : 'CNC',
        cliente: '',
        codigoPeca: '',
        codigoMolde: '',
        componenteMolde: '',
        numeroPrograma: '',
        dataCriacao: new Date().toISOString().slice(0, 10), // date format YYYY-MM-DD
        prazoEntrega: '',
        tempoEstimadoCorteHoras: '',
        tempoEstimadoCorteMinutos: '',
        tempoEstimadoSetupHoras: '',
        tempoEstimadoSetupMinutos: '',
        programador: '',
        linkDesenho: '',
        isPrioridade: false,
        isRetrabalho: false,
        quantidade: 1,
        totalSetups: 1,
        setupsList: [{ nome: 'OP10 - Desbaste Bruto', horas: '', minutos: '', programa: '' }],
    });


    const handleTotalSetupsChange = (numStr) => {
        const count = Math.max(1, Math.min(10, parseInt(numStr, 10) || 1));

        const presetNames = [
            'OP10 - Desbaste Bruto',
            'OP20 - Acabamento 3D (Pós-Têmpera)',
            'OP30 - Usinagem de Gavetas / Postiços',
            'OP40 - Furação / Machos',
        ];

        setFormData(prev => {
            const currentList = prev.setupsList || [];
            const newList = Array.from({ length: count }, (_, i) => {
                const opNum = (i + 1) * 10;
                const defaultName = presetNames[i] || `OP${opNum} (Virada)`;
                return currentList[i] || { nome: defaultName, horas: '', minutos: '', programa: '' };
            });

            let totalH = prev.tempoEstimadoSetupHoras;
            let totalM = prev.tempoEstimadoSetupMinutos;

            if (count > 1) {
                let totalMinutos = 0;
                newList.forEach(s => {
                    const h = parseInt(s.horas, 10) || 0;
                    const m = parseInt(s.minutos, 10) || 0;
                    totalMinutos += h * 60 + m;
                });
                totalH = totalMinutos > 0 ? String(Math.floor(totalMinutos / 60)) : '';
                totalM = totalMinutos > 0 ? String(totalMinutos % 60) : '';
            }

            return {
                ...prev,
                totalSetups: count,
                setupsList: newList,
                nomesSetups: newList.map(s => s.nome),
                tempoEstimadoSetupHoras: totalH,
                tempoEstimadoSetupMinutos: totalM,
            };
        });
    };

    const handleSetupItemChange = (index, field, value) => {
        setFormData(prev => {
            const newList = (prev.setupsList || []).map((item, i) => {
                if (i !== index) return item;
                return { ...item, [field]: value };
            });

            let totalMinutos = 0;
            newList.forEach(s => {
                const h = parseInt(s.horas, 10) || 0;
                const m = parseInt(s.minutos, 10) || 0;
                totalMinutos += h * 60 + m;
            });

            const totalH = totalMinutos > 0 ? String(Math.floor(totalMinutos / 60)) : '';
            const totalM = totalMinutos > 0 ? String(totalMinutos % 60) : '';

            return {
                ...prev,
                setupsList: newList,
                nomesSetups: newList.map(s => s.nome),
                tempoEstimadoSetupHoras: totalH,
                tempoEstimadoSetupMinutos: totalM,
            };
        });
    };

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

    const handleNxImport = (data) => {
        setNxImportMeta(data);
        if (Array.isArray(data.ferramentas) && data.ferramentas.length > 0) {
            setFerramentasList(data.ferramentas);
        }
        const usinagem = minutosParaHorasMin(data.tempoUsinagemMinutos || 0);
        const setup = minutosParaHorasMin(data.tempoSetupMinutos || 0);
        setFormData((prev) => ({
            ...prev,
            codigoPeca: data.codigoPeca || prev.codigoPeca,
            numeroPrograma: data.numeroPrograma || prev.numeroPrograma,
            cliente: nomeCadastrado(clientes, data.cliente) || prev.cliente,
            programador: nomeCadastrado(programadores, data.programador) || prev.programador,
            tempoEstimadoCorteHoras: usinagem.horas ? String(usinagem.horas) : prev.tempoEstimadoCorteHoras,
            tempoEstimadoCorteMinutos: usinagem.minutos ? String(usinagem.minutos) : prev.tempoEstimadoCorteMinutos,
            tempoEstimadoSetupHoras: setup.horas ? String(setup.horas) : prev.tempoEstimadoSetupHoras,
            tempoEstimadoSetupMinutos: setup.minutos ? String(setup.minutos) : prev.tempoEstimadoSetupMinutos,
        }));
    };

    const handleAddFerramenta = () => {
        setFerramentasList(prev => [
            ...prev,
            { codigoT: `T${String(prev.length + 1).padStart(2, '0')}`, nome: '' }
        ]);
    };

    const handleRemoveFerramenta = (index) => {
        setFerramentasList(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateFerramenta = (index, field, value) => {
        setFerramentasList(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const nxImportData = nxImportMeta
            ? { arquivo: nxImportMeta.arquivo, ferramentas: ferramentasList, operacoes: nxImportMeta.operacoes }
            : (ferramentasList.length > 0 ? { arquivo: 'Manual', ferramentas: ferramentasList, operacoes: [] } : null);

        const novaOS = {
            ...formData,
            status: 'A fazer',
            setup_atual: 1,
            total_setups: parseInt(formData.totalSetups) || 1,
            nomes_setups: formData.setupsList?.map(s => s.nome) || ['OP10'],
            detalhes_setups: formData.setupsList || [],
            nxImport: nxImportData,
        };
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

                {/* Seleção do Setor Produtivo */}
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Setor Produtivo da O.S.</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, setor: 'CNC' }))}
                            className={`px-4 py-3 rounded-xl border font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                formData.setor === 'CNC'
                                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400 shadow-md ring-1 ring-cyan-500'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                        >
                            <Cpu className="w-5 h-5" />
                            <span>Centro de Usinagem CNC</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, setor: 'EDM_FIO' }))}
                            className={`px-4 py-3 rounded-xl border font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                formData.setor === 'EDM_FIO'
                                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-md ring-1 ring-emerald-500'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                        >
                            <Zap className="w-5 h-5" />
                            <span>Eletroerosão a Fio (EDM)</span>
                        </button>
                    </div>
                </div>

                {formData.setor === 'CNC' && (
                    <>
                        <ImportNxSheet onImport={handleNxImport} disabled={isSubmitting} />

                        {/* Cadastro Manual / Edição de Ferramentas */}
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wrench className="w-4 h-4 text-kanban-amber" />
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                                        Lista de Ferramentas / Magazine Previsto
                                    </h4>
                                    {ferramentasList.length > 0 && (
                                        <span className="text-[10px] font-bold bg-kanban-amber/20 text-kanban-amber px-2 py-0.5 rounded-full border border-kanban-amber/30">
                                            {ferramentasList.length} {ferramentasList.length === 1 ? 'ferramenta' : 'ferramentas'}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddFerramenta}
                                    className="text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-kanban-amber px-3 py-1.5 rounded-lg border border-slate-700 hover:border-kanban-amber/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Adicionar Ferramenta</span>
                                </button>
                            </div>

                            {ferramentasList.length === 0 ? (
                                <p className="text-xs text-slate-500 italic py-1">
                                    Nenhuma ferramenta adicionada. Importe a folha CAM acima ou clique em "Adicionar Ferramenta" para especificar o magazine manualmente.
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {ferramentasList.map((f, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                                            <div className="w-20 shrink-0">
                                                <input
                                                    type="text"
                                                    value={f.codigoT || ''}
                                                    onChange={(e) => handleUpdateFerramenta(idx, 'codigoT', e.target.value)}
                                                    placeholder="T01"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-center font-mono text-kanban-amber font-bold outline-none focus:border-kanban-amber"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    list={`estoque-lista-${idx}`}
                                                    value={f.nome || ''}
                                                    onChange={(e) => handleUpdateFerramenta(idx, 'nome', e.target.value)}
                                                    placeholder="Nome ou especificação da ferramenta (ex: Fresa MD D10 4F)"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-kanban-amber"
                                                />
                                                {estoque.length > 0 && (
                                                    <datalist id={`estoque-lista-${idx}`}>
                                                        {estoque.map(item => (
                                                            <option key={item.id} value={item.nome} />
                                                        ))}
                                                    </datalist>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFerramenta(idx)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                                                title="Remover ferramenta"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}


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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold text-slate-300 mb-1.5">Código da Peça *</label>
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
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                Programa CNC (G-Code)
                            </label>
                            <input
                                type="text"
                                name="numeroPrograma"
                                value={formData.numeroPrograma}
                                onChange={handleChange}
                                placeholder="Ex: O1001 / O1001.NC"
                                className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 text-base font-mono uppercase placeholder-slate-600"
                            />
                        </div>
                        <div className="md:col-span-1">
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

                    {/* Identificação de Molde e Componente (Opcional) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                                Código do Molde / Projeto
                                <span className="text-[9px] font-extrabold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 uppercase">OPCIONAL</span>
                            </label>
                            <input
                                type="text"
                                name="codigoMolde"
                                value={formData.codigoMolde}
                                onChange={handleChange}
                                placeholder="Ex: Molde M-2024 ou Proj 804"
                                className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 text-sm font-medium placeholder-slate-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                                Componente do Molde
                                <span className="text-[9px] font-extrabold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 uppercase">OPCIONAL</span>
                            </label>
                            <input
                                type="text"
                                name="componenteMolde"
                                value={formData.componenteMolde}
                                onChange={handleChange}
                                placeholder="Ex: Postiço Macho / Gaveta A"
                                className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 text-slate-100 text-sm font-medium placeholder-slate-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Switches: Prioridade e Retrabalho */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 cursor-pointer group hover:bg-slate-900 transition-colors" onClick={() => setFormData(p => ({ ...p, isPrioridade: !p.isPrioridade }))}>
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

                    <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 cursor-pointer group hover:bg-slate-900 transition-colors" onClick={() => setFormData(p => ({ ...p, isRetrabalho: !p.isRetrabalho }))}>
                        <input
                            type="checkbox"
                            name="isRetrabalho"
                            checked={formData.isRetrabalho}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-2 border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <label className="text-sm font-bold text-amber-300 cursor-pointer group-hover:text-amber-200 transition-colors flex items-center gap-2 relative">
                            🛠️ Retrabalho / Ajuste Fino de Bancada
                        </label>
                    </div>
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
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <label className="block text-sm font-bold text-slate-300 mb-2">Tempo Est. de Usinagem</label>
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

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <label className="block text-sm font-bold text-slate-300 mb-2 mt-1">Tempo Est. de Setup</label>
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

                {/* Programador e Configuração de Setups */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-1.5">Nº de Setups / Viradas de Peça</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={formData.totalSetups}
                            onChange={(e) => handleTotalSetupsChange(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-800 rounded-lg focus:outline-none focus:border-kanban-amber focus:ring-0 bg-slate-950 text-slate-100 text-base font-bold"
                            placeholder="1"
                        />
                    </div>
                </div>

                {formData.totalSetups > 1 && (
                    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-extrabold text-kanban-amber uppercase tracking-wider">
                                Tempos e Nome de cada Setup ({formData.totalSetups} viradas)
                            </label>
                            <span className="text-xs text-slate-400 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                Soma Total: <strong className="text-kanban-amber">{formData.tempoEstimadoSetupHoras || 0}h {formData.tempoEstimadoSetupMinutos || 0}m</strong>
                            </span>
                        </div>
                        <div className="space-y-2">
                            {formData.setupsList?.map((setupItem, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                                    <span className="text-xs font-mono text-slate-500 w-6 font-bold">{idx + 1}º:</span>
                                    <input
                                        type="text"
                                        value={setupItem.nome}
                                        onChange={(e) => handleSetupItemChange(idx, 'nome', e.target.value)}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-kanban-amber outline-none"
                                        placeholder={`OP${(idx + 1) * 10}`}
                                    />
                                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                        <span className="text-xs text-slate-400 font-semibold">Tempo:</span>
                                        <div className="relative w-16">
                                            <input
                                                type="number"
                                                min="0"
                                                value={setupItem.horas}
                                                onChange={(e) => handleSetupItemChange(idx, 'horas', e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 pr-5 text-xs text-center text-white focus:border-kanban-amber outline-none font-bold"
                                            />
                                            <span className="absolute right-1.5 top-1 text-[10px] font-bold text-slate-500">h</span>
                                        </div>
                                        <span className="text-slate-500 font-bold">:</span>
                                        <div className="relative w-16">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={setupItem.minutos}
                                                onChange={(e) => handleSetupItemChange(idx, 'minutos', e.target.value)}
                                                placeholder="00"
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 pr-5 text-xs text-center text-white focus:border-kanban-amber outline-none font-bold"
                                            />
                                            <span className="absolute right-1.5 top-1 text-[10px] font-bold text-slate-500">m</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-slate-800">
                    <Button type="button" variant="outline" size="md" onClick={onClose} className="w-1/3">Cancelar</Button>
                    <Button type="submit" variant="primary" size="md" className="w-2/3 shadow-md" disabled={isSubmitting}>
                        {isSubmitting ? 'Criando...' : 'Criar Ordem'}
                    </Button>
                </div>

            </form>
        </>
    );
}
