import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/common/Button';
import { 
    Plus, Trash2, Settings2, Zap, ShieldCheck, Users, Monitor, 
    DollarSign, Copy, Wrench, Clock, RefreshCw, Cpu, Layers 
} from 'lucide-react';
import { ESTRATEGIA_FERRAMENTAL_OPTIONS } from '../constants/cncProcess';
import { TIPOS_SERVICO_EXTERNO, rotuloTipoServicoExterno, slugEtapaPersonalizada } from '../constants/osWorkflow';
import { PAPEIS_CONVITE, papelFromId, rotuloPapelConvite, gerarPinConvite, pinConviteLivre } from '../utils/papeisAcesso';
import { rotinasParaSetor, rotinaPorId, rotuloSetorMaquina, agruparMaquinasPorSetor } from '../constants/rotinasManutencao';

export default function ConfigSettings() {
    const {
        configuracoesGlobais, salvarConfiguracoes, salvarEtapasPersonalizadas,
        fetchConfiguracoes, fetchMaquinas, fetchOperadores, fetchProgramadores, fetchAutoKanbans, fetchUsuarios, fetchConvites,
        maquinas, addMaquina, removeMaquina,
        operadores, addOperador, removeOperador,
        programadores, addProgramador, removeProgramador,
        kanbansAutomaticos, addKanbanAutomatico, removeKanbanAutomatico,
        usuarios, convites, criarConvite, revogarConvite, atualizarPinConvite,
        fornecedores, addFornecedor, removeFornecedor, fetchFornecedores,
    } = useAppStore();

    const { user, codigoConvite } = useAuthStore();

    const [activeTab, setActiveTab] = useState('geral'); // 'geral' | 'recursos' | 'equipe' | 'automacao'

    // Carrega dados ao montar a página
    useEffect(() => {
        fetchConfiguracoes();
        fetchMaquinas();
        fetchOperadores();
        fetchProgramadores();
        fetchAutoKanbans();
        fetchUsuarios();
        fetchConvites();
        fetchFornecedores();
    }, []);

    // Estado Local das Configs Globais
    const [custoHoraLocal, setCustoHoraLocal] = useState(configuracoesGlobais?.custoHoraMaquina || 50);
    const [custoHoraCncLocal, setCustoHoraCncLocal] = useState(configuracoesGlobais?.custoHoraCnc || 80);
    const [custoHoraEdmLocal, setCustoHoraEdmLocal] = useState(configuracoesGlobais?.custoHoraEdm || 120);
    const [toastMsg, setToastMsg] = useState('');
    const [turnosLocal, setTurnosLocal] = useState(configuracoesGlobais?.turnos || [
        { id: 't1', nome: 'Turno 1', inicio: '07:30', fim: '15:30' },
        { id: 't2', nome: 'Turno 2', inicio: '15:30', fim: '23:30' },
        { id: 't3', nome: 'Turno 3', inicio: '23:30', fim: '07:30' }
    ]);
    const [pinLocal, setPinLocal] = useState(configuracoesGlobais?.pinOnboarding ?? '1234');
    const [conviteNome, setConviteNome] = useState('');
    const [convitePapel, setConvitePapel] = useState('cnc');
    const [convitePin, setConvitePin] = useState(() => gerarPinConvite([], '1234'));
    const [pinGeradoAgora, setPinGeradoAgora] = useState(null);
    const [pinEdicao, setPinEdicao] = useState({});
    const [modoMagazineLocal, setModoMagazineLocal] = useState(configuracoesGlobais?.modoMagazineDefault || 'individual');
    const [baixaEstoqueSetupLocal, setBaixaEstoqueSetupLocal] = useState(configuracoesGlobais?.baixaEstoqueNoSetup ?? false);
    const [novaEtapaCfg, setNovaEtapaCfg] = useState('');

    // Sincroniza o estado local sempre que configuracoesGlobais for carregado/atualizado
    useEffect(() => {
        if (configuracoesGlobais) {
            if (configuracoesGlobais.custoHoraMaquina !== undefined) {
                setCustoHoraLocal(configuracoesGlobais.custoHoraMaquina);
            }
            if (configuracoesGlobais.custoHoraCnc !== undefined) {
                setCustoHoraCncLocal(configuracoesGlobais.custoHoraCnc);
            }
            if (configuracoesGlobais.custoHoraEdm !== undefined) {
                setCustoHoraEdmLocal(configuracoesGlobais.custoHoraEdm);
            }
            if (Array.isArray(configuracoesGlobais.turnos) && configuracoesGlobais.turnos.length > 0) {
                setTurnosLocal(configuracoesGlobais.turnos);
            }
            if (configuracoesGlobais.pinOnboarding !== undefined) {
                setPinLocal(configuracoesGlobais.pinOnboarding);
            }
            if (configuracoesGlobais.modoMagazineDefault) {
                setModoMagazineLocal(configuracoesGlobais.modoMagazineDefault);
            }
            if (configuracoesGlobais.baixaEstoqueNoSetup !== undefined) {
                setBaixaEstoqueSetupLocal(configuracoesGlobais.baixaEstoqueNoSetup);
            }
        }
    }, [configuracoesGlobais]);

    const configuracaoDaTela = () => ({
        custoHoraMaquina: parseFloat(custoHoraLocal) || configuracoesGlobais?.custoHoraMaquina || 50,
        custoHoraCnc: parseFloat(custoHoraCncLocal) || configuracoesGlobais?.custoHoraCnc || 80,
        custoHoraEdm: parseFloat(custoHoraEdmLocal) || configuracoesGlobais?.custoHoraEdm || 120,
        turnos: turnosLocal,
        pinOnboarding: pinLocal || configuracoesGlobais?.pinOnboarding || '1234',
        modoMagazineDefault: modoMagazineLocal,
        baixaEstoqueNoSetup: baixaEstoqueSetupLocal,
    });

    const removerComAviso = async (acao, rotulo) => {
        try {
            await acao();
        } catch (err) {
            setToastMsg(`Erro ao remover ${rotulo}: ${err.message}`);
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const handleSalvarMagazine = async (e) => {
        e.preventDefault();
        try {
            await salvarConfiguracoes({
                ...configuracaoDaTela(),
                modoMagazineDefault: modoMagazineLocal,
                baixaEstoqueNoSetup: baixaEstoqueSetupLocal,
            });
            setToastMsg('Preferências de ferramentas salvas!');
        } catch (err) {
            setToastMsg('Erro ao salvar: ' + err.message);
        }
        setTimeout(() => setToastMsg(''), 3500);
    };

    const handleTurnoChange = (index, field, value) => {
        const novosTurnos = [...turnosLocal];
        novosTurnos[index] = { ...novosTurnos[index], [field]: value };
        setTurnosLocal(novosTurnos);
    };

    const handleAddTurno = (e) => {
        if (e) e.preventDefault();
        const nomeTrim = (novoTurnoNome || '').trim();
        if (nomeTrim) {
            setTurnosLocal(prev => [
                ...prev,
                { id: `t${Date.now()}`, nome: nomeTrim, inicio: '08:00', fim: '18:00' }
            ]);
            setNovoTurnoNome('');
            setToastMsg('Turno adicionado! Clique em "Salvar Turnos" para gravar.');
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const handleRemoveTurno = (idToRemove) => {
        setTurnosLocal(turnosLocal.filter(t => t.id !== idToRemove));
    };

    const handleSalvarCustoHora = async (e) => {
        e.preventDefault();
        try {
            await salvarConfiguracoes(configuracaoDaTela());
            setToastMsg('Custos Hora Atualizados com Sucesso!');
        } catch (err) {
            setToastMsg('Erro ao salvar: ' + err.message);
        }
        setTimeout(() => setToastMsg(''), 3500);
    };

    const handleSalvarTurnos = async (e) => {
        e.preventDefault();
        try {
            await salvarConfiguracoes(configuracaoDaTela());
            setToastMsg('Turnos Salvos com Sucesso!');
        } catch (err) {
            setToastMsg('Erro ao salvar: ' + err.message);
        }
        setTimeout(() => setToastMsg(''), 3500);
    };

    const [novaMaquinaNome, setNovaMaquinaNome] = useState('');
    const [novaMaquinaSetor, setNovaMaquinaSetor] = useState('CNC');
    const [novoOperador, setNovoOperador] = useState('');
    const [novoOperadorSetor, setNovoOperadorSetor] = useState('TODOS');
    const [novoProgramador, setNovoProgramador] = useState('');
    const [novoProgramadorSetor, setNovoProgramadorSetor] = useState('CNC');
    const [novoTurnoNome, setNovoTurnoNome] = useState('');
    const [novoFornecedorNome, setNovoFornecedorNome] = useState('');
    const [novoFornecedorTipo, setNovoFornecedorTipo] = useState('tratamento');

    // Kanban Automático State
    const [kbTipo, setKbTipo] = useState('');
    const [kbOutros, setKbOutros] = useState('');
    const [kbMaquina, setKbMaquina] = useState('');
    const [kbDias, setKbDias] = useState('');

    const handleAddMaquina = async (e) => {
        e.preventDefault();
        const limite = configuracoesGlobais?.limiteMaquinas ?? 999;
        if (maquinas.length >= limite) {
            setToastMsg('Erro: Limite do plano atingido.');
            setTimeout(() => setToastMsg(''), 4000);
            return;
        }
        const nomeTrim = novaMaquinaNome.trim();
        if (!nomeTrim) return;

        if (maquinas.some(m => (m.nome || '').toLowerCase() === nomeTrim.toLowerCase())) {
            setToastMsg('Erro: Máquina "' + nomeTrim + '" já cadastrada!');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }

        try {
            await addMaquina(nomeTrim, novaMaquinaSetor);
            setNovaMaquinaNome('');
            setToastMsg('Máquina adicionada com sucesso!');
            setTimeout(() => setToastMsg(''), 2500);
        } catch (err) {
            setToastMsg('Erro: ' + (err?.message || 'Falha ao adicionar máquina'));
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const handleAddFornecedor = async (e) => {
        e.preventDefault();
        const nomeTrim = novoFornecedorNome.trim();
        if (!nomeTrim) return;
        try {
            await addFornecedor({ nome: nomeTrim, tipo: novoFornecedorTipo });
            setNovoFornecedorNome('');
            setToastMsg('Fornecedor cadastrado.');
            setTimeout(() => setToastMsg(''), 2500);
        } catch (err) {
            setToastMsg('Erro: ' + (err?.message || 'Falha ao cadastrar fornecedor'));
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const handleAddOperador = async (e) => {
        e.preventDefault();
        const nomeTrim = novoOperador.trim();
        if (!nomeTrim) return;

        if (operadores.some(o => (o.nome || '').toLowerCase() === nomeTrim.toLowerCase())) {
            setToastMsg('Erro: Operador "' + nomeTrim + '" já cadastrado!');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }

        try {
            await addOperador(nomeTrim, novoOperadorSetor);
            setNovoOperador('');
            setToastMsg('Operador adicionado com sucesso!');
            setTimeout(() => setToastMsg(''), 2500);
        } catch (err) {
            setToastMsg('Erro: ' + (err?.message || 'Falha ao adicionar operador'));
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const handleAddProgramador = async (e) => {
        e.preventDefault();
        const nomeTrim = novoProgramador.trim();
        if (!nomeTrim) return;

        if (programadores.some(p => (p.nome || '').toLowerCase() === nomeTrim.toLowerCase())) {
            setToastMsg('Erro: Programador "' + nomeTrim + '" já cadastrado!');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }

        try {
            await addProgramador(nomeTrim, novoProgramadorSetor);
            setNovoProgramador('');
            setToastMsg('Programador adicionado com sucesso!');
            setTimeout(() => setToastMsg(''), 2500);
        } catch (err) {
            setToastMsg('Erro: ' + (err?.message || 'Falha ao adicionar programador'));
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const pinMestre = pinLocal || configuracoesGlobais?.pinOnboarding || '1234';
    const pinsEmUso = (convites || []).map((c) => c.pin);

    const sugerirPinConvite = () => {
        setConvitePin(gerarPinConvite(pinsEmUso, pinMestre));
    };

    const handleCriarConvite = async (e) => {
        e.preventDefault();
        const nome = conviteNome.trim();
        if (!nome) return;
        const papel = papelFromId(convitePapel);
        const conflito = pinConviteLivre(convitePin, pinsEmUso, pinMestre);
        if (conflito) {
            setToastMsg(conflito);
            setTimeout(() => setToastMsg(''), 3500);
            return;
        }
        try {
            const created = await criarConvite({
                nome,
                funcao: papel.funcao,
                setorPadrao: papel.setor,
                pin: String(convitePin),
            });
            setConviteNome('');
            setConvitePin(gerarPinConvite([created.pin, ...pinsEmUso], pinMestre));
            setPinGeradoAgora({ nome: created.nome, pin: created.pin, papel: rotuloPapelConvite(created) });
            setToastMsg('Convite criado. Entregue o PIN em mãos — sem e-mail.');
            setTimeout(() => setToastMsg(''), 3500);
        } catch (err) {
            setToastMsg('Erro ao criar convite: ' + (err?.message || ''));
            setTimeout(() => setToastMsg(''), 4000);
        }
    };

    const handleSalvarPinConvite = async (convite) => {
        const novo = pinEdicao[convite.id] ?? convite.pin;
        const conflito = pinConviteLivre(novo, pinsEmUso, pinMestre, convite.pin);
        if (conflito) {
            setToastMsg(conflito);
            setTimeout(() => setToastMsg(''), 3500);
            return;
        }
        try {
            await atualizarPinConvite(convite.id, String(novo));
            setPinEdicao((prev) => {
                const next = { ...prev };
                delete next[convite.id];
                return next;
            });
            setToastMsg('PIN atualizado.');
            setTimeout(() => setToastMsg(''), 2500);
        } catch (err) {
            setToastMsg('Erro ao salvar PIN: ' + (err?.message || ''));
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const maquinaRotina = useMemo(
        () => (maquinas || []).find((m) => m.nome === kbMaquina) || null,
        [maquinas, kbMaquina]
    );
    const setorRotina = maquinaRotina?.setor || 'CNC';
    const opcoesRotina = useMemo(() => rotinasParaSetor(setorRotina), [setorRotina]);
    const maquinasPorSetor = useMemo(() => agruparMaquinasPorSetor(maquinas), [maquinas]);

    const handleAddKanbanAuto = async (e) => {
        e.preventDefault();
        if (!kbTipo || !kbDias) {
            setToastMsg('Erro: Escolha a rotina, a máquina e o intervalo.');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }
        const diasInt = parseInt(kbDias, 10);
        if (isNaN(diasInt) || diasInt <= 0) {
            setToastMsg('Erro: Informe um número de dias maior que zero.');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }
        if (!kbMaquina) {
            setToastMsg('Erro: Vincule a rotina a uma máquina.');
            setTimeout(() => setToastMsg(''), 3000);
            return;
        }
        const rotina = rotinaPorId(kbTipo, setorRotina);
        const titulo = kbTipo === 'outros'
            ? (kbOutros.trim() || 'Rotina personalizada')
            : (rotina?.label || kbTipo);
        const descricao = kbOutros.trim() && kbTipo !== 'outros'
            ? `${titulo} — ${kbOutros.trim()}`
            : titulo;

        try {
            await addKanbanAutomatico({
                tipo: kbTipo,
                descricao,
                maquinaNome: kbMaquina,
                diasIntervalo: diasInt
            });
            setKbTipo('');
            setKbOutros('');
            setKbMaquina('');
            setKbDias('');
            setToastMsg('Rotina criada. O cartão entra no quadro do setor da máquina, no vencimento.');
            setTimeout(() => setToastMsg(''), 3500);
        } catch (err) {
            setToastMsg('Erro: ' + (err?.message || 'Falha ao adicionar rotina'));
            setTimeout(() => setToastMsg(''), 3500);
        }
    };

    const inputClasses = "w-full p-2.5 border border-[#262A33] rounded-xl focus:outline-none focus:border-kanban-amber focus:ring-1 focus:ring-kanban-amber/50 text-[#E7E9ED] text-sm font-medium bg-[#111318] placeholder-[#565B68] transition-colors";
    const titleClasses = "block text-xs font-semibold uppercase tracking-wider text-[#7B808F] mb-2";
    const cardClasses = "bg-[#181B22]/90 rounded-2xl shadow-lg border border-[#262A33]/80 overflow-hidden";
    const headerClasses = "bg-[#111318]/80 px-6 py-4 border-b border-[#262A33]/80 flex items-center justify-between";

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header da Página */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181B22]/60 p-4 rounded-2xl border border-[#262A33]/80">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                        <Settings2 className="w-5 h-5 text-kanban-amber" />
                        Configurações da fábrica
                    </h2>
                    <p className="text-[#7B808F] mt-0.5 text-xs font-medium">
                        Gerencie parâmetros de custos, máquinas CNC/EDM/Torno, equipe e rotinas de manutenção.
                    </p>
                </div>

                {/* Seletor de Abas Estilo Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-[#111318] border border-[#262A33] rounded-xl overflow-x-auto">
                    {[
                        { id: 'geral', label: 'Geral & Custos', icon: DollarSign },
                        { id: 'recursos', label: 'Máquinas & CAM', icon: Cpu },
                        { id: 'equipe', label: 'Equipe & Acessos', icon: Users },
                        { id: 'automacao', label: 'Rotinas de máquina', icon: Wrench },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    active
                                        ? 'bg-kanban-amber text-[#111318] shadow-md font-semibold'
                                        : 'text-[#7B808F] hover:text-[#E7E9ED] hover:bg-[#181B22]'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ========== ABA 1: GERAL & CUSTOS ========== */}
            {activeTab === 'geral' && (
                <div className="space-y-6 animate-modal-in">
                    {/* Custos Hora */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <DollarSign className="text-[#4A9D74] w-5 h-5" />
                                <h3 className="text-sm font-semibold text-white">Valor hora por setor (R$/h)</h3>
                            </div>
                            <span className="text-[10px] font-mono bg-[rgba(74,157,116,0.1)] text-[#4A9D74] px-2.5 py-1 rounded-full border border-[#4A9D74]/30 font-semibold">
                                BASE FINANCEIRA
                            </span>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSalvarCustoHora} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="bg-[#111318]/80 p-4 rounded-xl border border-[#262A33]/80">
                                        <label className={titleClasses}>Usinagem CNC (R$/h)</label>
                                        <div className="relative mt-2">
                                            <span className="absolute left-3.5 top-3 text-[#9DA2AE] font-semibold text-sm">R$</span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                value={custoHoraCncLocal}
                                                onChange={e => setCustoHoraCncLocal(e.target.value)}
                                                className={`${inputClasses} pl-10 border-[#7B808F]/30 focus:border-[#D97D3D]`}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-[#111318]/80 p-4 rounded-xl border border-[#262A33]/80">
                                        <label className={titleClasses}>Eletroerosão a Fio (R$/h)</label>
                                        <div className="relative mt-2">
                                            <span className="absolute left-3.5 top-3 text-[#4A9D74] font-semibold text-sm">R$</span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                value={custoHoraEdmLocal}
                                                onChange={e => setCustoHoraEdmLocal(e.target.value)}
                                                className={`${inputClasses} pl-10 border-[#4A9D74]/30 focus:border-[#4A9D74]`}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-[#111318]/80 p-4 rounded-xl border border-[#262A33]/80">
                                        <label className={titleClasses}>Custo Padrão / Geral (R$/h)</label>
                                        <div className="relative mt-2">
                                            <span className="absolute left-3.5 top-3 text-[#7B808F] font-semibold text-sm">R$</span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                value={custoHoraLocal}
                                                onChange={e => setCustoHoraLocal(e.target.value)}
                                                className={`${inputClasses} pl-10`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" variant="primary" size="md" className="px-6 shadow-sm">
                                        Salvar valor hora
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Layers className="text-[#D97D3D] w-5 h-5" />
                                <h3 className="text-sm font-semibold text-white">Etapas do roteiro da peça</h3>
                            </div>
                            <span className="text-[10px] font-mono bg-[rgba(217,125,61,0.1)] text-[#D97D3D] px-2.5 py-1 rounded-full border border-[#D97D3D]/30 font-semibold">
                                CAMINHO
                            </span>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-[12px] text-[#7B808F] leading-relaxed">
                                CNC, eletrofio e serviço externo geram cartão no quadro. O restante — laser, retífica, torno, montagem ou o que você cadastrar — entra só no caminho da peça.
                            </p>
                            {(configuracoesGlobais?.etapasPersonalizadas || []).length === 0 && (
                                <p className="text-[12px] text-[#565B68]">Nenhuma etapa personalizada ainda. Ex.: Corte a laser, polimento, solda.</p>
                            )}
                            <ul className="space-y-2">
                                {(configuracoesGlobais?.etapasPersonalizadas || []).map((et) => (
                                    <li key={et.id} className="flex items-center gap-2">
                                        <input
                                            defaultValue={et.label}
                                            key={`${et.id}-${et.label}`}
                                            onBlur={(e) => {
                                                const nome = e.target.value.trim();
                                                if (!nome || nome === et.label) return;
                                                const next = (configuracoesGlobais.etapasPersonalizadas || []).map((x) =>
                                                    x.id === et.id ? { ...x, label: nome } : x
                                                );
                                                salvarEtapasPersonalizadas(next);
                                            }}
                                            className={inputClasses}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => salvarEtapasPersonalizadas(
                                                (configuracoesGlobais.etapasPersonalizadas || []).filter((x) => x.id !== et.id)
                                            )}
                                            className="p-2 text-[#565B68] hover:text-[#C85558] cursor-pointer"
                                            title="Remover do catálogo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <form
                                className="flex flex-wrap gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const nome = novaEtapaCfg.trim();
                                    if (!nome) return;
                                    const lista = configuracoesGlobais?.etapasPersonalizadas || [];
                                    if (lista.some((x) => x.label.toLowerCase() === nome.toLowerCase())) {
                                        setNovaEtapaCfg('');
                                        return;
                                    }
                                    let id = slugEtapaPersonalizada(nome);
                                    if (lista.some((x) => x.id === id)) id = `${id}_${Date.now().toString(36).slice(-4)}`;
                                    salvarEtapasPersonalizadas([...lista, { id, label: nome, kind: 'marco', geraCartao: false }]);
                                    setNovaEtapaCfg('');
                                }}
                            >
                                <input
                                    value={novaEtapaCfg}
                                    onChange={(e) => setNovaEtapaCfg(e.target.value)}
                                    placeholder="Nome da etapa, ex.: Corte a laser"
                                    className={`${inputClasses} flex-1 min-w-[200px]`}
                                />
                                <Button type="submit" variant="primary" size="md" className="px-4">
                                    <Plus className="w-4 h-4 mr-1 inline" /> Cadastrar etapa
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Preferências de Magazine Ferramental */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Wrench className="text-kanban-amber w-5 h-5" />
                                <h3 className="text-sm font-semibold text-white">Estratégia Ferramental & Magazine CNC</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSalvarMagazine} className="space-y-5">
                                <div className="space-y-3">
                                    {ESTRATEGIA_FERRAMENTAL_OPTIONS.map((opt) => (
                                        <label key={opt.key} className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${modoMagazineLocal === opt.key ? 'border-kanban-amber/60 bg-kanban-amber/10' : 'border-[#262A33]/80 hover:bg-[#111318]/70'}`}>
                                            <input
                                                type="radio"
                                                name="modoMagazine"
                                                checked={modoMagazineLocal === opt.key}
                                                onChange={() => setModoMagazineLocal(opt.key)}
                                                className="mt-1 accent-amber-500"
                                            />
                                            <div>
                                                <span className="font-bold text-[#E7E9ED] text-sm">{opt.label}</span>
                                                <p className="text-xs text-[#7B808F] mt-0.5">{opt.hint}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <label className="flex items-start gap-3 p-3 bg-[#111318]/70 border border-[#262A33]/80 rounded-xl text-xs text-[#E7E9ED] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={baixaEstoqueSetupLocal}
                                        onChange={(e) => setBaixaEstoqueSetupLocal(e.target.checked)}
                                        className="mt-0.5 accent-amber-500"
                                    />
                                    <span>Descontar estoque de fresas/insertos automaticamente ao montar magazine completo no setup</span>
                                </label>

                                <div className="flex justify-end">
                                    <Button type="submit" variant="primary" size="md">Salvar Preferências Ferramental</Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Turnos */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Clock className="text-[#7B808F] w-5 h-5" />
                                <h3 className="text-sm font-semibold text-white">Dimensionamento de Turnos</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSalvarTurnos} className="space-y-6">
                                <div className="flex gap-3 items-end bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl">
                                    <div className="flex-1">
                                        <label className={titleClasses}>Adicionar Novo Turno</label>
                                        <input
                                            type="text"
                                            value={novoTurnoNome}
                                            onChange={e => setNovoTurnoNome(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTurno(e);
                                                }
                                            }}
                                            placeholder="Ex: Turno da Noite"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleAddTurno}
                                        variant="primary"
                                        size="md"
                                        className="px-4 h-[44px] shrink-0"
                                        disabled={!novoTurnoNome.trim()}
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {turnosLocal.map((turno, index) => (
                                        <div key={turno.id} className="bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl relative group">
                                            <div className="flex items-center justify-between mb-3">
                                                <input
                                                    type="text"
                                                    value={turno.nome}
                                                    onChange={(e) => handleTurnoChange(index, 'nome', e.target.value)}
                                                    className="font-semibold text-white bg-transparent border-b border-transparent hover:border-[#333844] focus:border-kanban-amber focus:outline-none px-1 text-sm w-2/3"
                                                />
                                                {turnosLocal.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTurno(turno.id)}
                                                        className="text-[#565B68] hover:text-[#C85558] transition-colors p-1"
                                                        title="Remover Turno"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-semibold text-[#565B68] uppercase tracking-widest mb-1">Início</label>
                                                    <input
                                                        type="time"
                                                        value={turno.inicio}
                                                        onChange={(e) => handleTurnoChange(index, 'inicio', e.target.value)}
                                                        className="w-full p-2 border border-[#262A33] rounded-lg text-[#E7E9ED] text-xs font-bold bg-[#181B22] focus:border-kanban-amber outline-none"
                                                        required
                                                    />
                                                </div>
                                                <span className="text-[#565B68] font-bold mt-4">-</span>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-semibold text-[#565B68] uppercase tracking-widest mb-1">Fim</label>
                                                    <input
                                                        type="time"
                                                        value={turno.fim}
                                                        onChange={(e) => handleTurnoChange(index, 'fim', e.target.value)}
                                                        className="w-full p-2 border border-[#262A33] rounded-lg text-[#E7E9ED] text-xs font-bold bg-[#181B22] focus:border-kanban-amber outline-none"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" variant="primary" size="md">
                                        Salvar Turnos
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== ABA 2: RECURSOS (MÁQUINAS & PROGRAMADORES) ========== */}
            {activeTab === 'recursos' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-modal-in">
                    {/* Máquinas */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Monitor className="text-[#9DA2AE] w-5 h-5" />
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Máquinas do Parque Fabril</h3>
                                    <p className="text-xs font-bold text-[#565B68]">
                                        {maquinas.length} máquinas cadastradas
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <form onSubmit={handleAddMaquina} className="flex flex-col sm:flex-row gap-3 items-end bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl">
                                <div className="flex-1 w-full">
                                    <label className={titleClasses}>Identificação da Máquina</label>
                                    <input
                                        type="text"
                                        value={novaMaquinaNome}
                                        onChange={e => setNovaMaquinaNome(e.target.value)}
                                        placeholder="Ex: ROMI D800 / Charmilles"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="w-full sm:w-44">
                                    <label className={titleClasses}>Setor Produtivo</label>
                                    <select
                                        value={novaMaquinaSetor}
                                        onChange={e => setNovaMaquinaSetor(e.target.value)}
                                        className={inputClasses}
                                    >
                                        <option value="CNC">Centro CNC</option>
                                        <option value="EDM_FIO">EDM Fio</option>
                                        <option value="LASER">Laser</option>
                                        <option value="TORNO">Torno CNC</option>
                                    </select>
                                </div>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    className="px-4 h-[44px] w-full sm:w-auto shrink-0"
                                    disabled={!novaMaquinaNome.trim()}
                                >
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </form>

                            <div className="space-y-2.5">
                                <h4 className="text-xs font-semibold text-[#565B68] uppercase tracking-widest">Máquinas Ativas</h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {maquinas.map((m) => (
                                        <div key={m.id} className="flex items-center justify-between bg-[#111318]/80 px-4 py-3 border border-[#262A33]/80 rounded-xl group hover:border-[#333844] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <p className="font-bold text-sm text-white">{m.nome}</p>
                                                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                                                    m.setor === 'EDM_FIO' 
                                                        ? 'bg-[rgba(74,157,116,0.1)] border-[#4A9D74]/40 text-[#4A9D74]' 
                                                        : m.setor === 'TORNO'
                                                        ? 'bg-amber-950/80 border-amber-500/50 text-[#D97D3D]'
                                                        : 'bg-[rgba(123,128,143,0.12)] border-[#7B808F]/40 text-[#9DA2AE]'
                                                }`}>
                                                    {m.setor === 'EDM_FIO' ? 'EDM Fio' : m.setor === 'TORNO' ? 'Torno' : m.setor === 'LASER' ? 'Laser' : 'CNC'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removerComAviso(() => removeMaquina(m.id), 'máquina')}
                                                className="text-[#565B68] hover:text-[#C85558] p-1.5 rounded-lg transition-colors"
                                                title="Remover máquina"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {maquinas.length === 0 && (
                                        <p className="text-xs text-[#565B68] border border-dashed border-[#262A33] rounded-xl py-6 text-center">Nenhuma máquina cadastrada.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Programadores */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Layers className="text-[#D97D3D] w-5 h-5" />
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Programadores CAM</h3>
                                    <p className="text-xs font-bold text-[#565B68]">
                                        {programadores.length} programadores cadastrados
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <form onSubmit={handleAddProgramador} className="flex flex-col sm:flex-row gap-3 items-end bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl">
                                <div className="flex-1 w-full">
                                    <label className={titleClasses}>Nome do Programador</label>
                                    <input
                                        type="text"
                                        value={novoProgramador}
                                        onChange={e => setNovoProgramador(e.target.value)}
                                        placeholder="Ex: Roberto CAM"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="w-full sm:w-44">
                                    <label className={titleClasses}>Setor de Atuação</label>
                                    <select
                                        value={novoProgramadorSetor}
                                        onChange={e => setNovoProgramadorSetor(e.target.value)}
                                        className={inputClasses}
                                    >
                                        <option value="CNC">CNC</option>
                                        <option value="EDM_FIO">EDM Fio</option>
                                        <option value="TORNO">Torno</option>
                                        <option value="TODOS">Toda Fábrica</option>
                                    </select>
                                </div>
                                <Button type="submit" variant="primary" size="md" className="px-4 h-[44px] w-full sm:w-auto shrink-0" disabled={!novoProgramador.trim()}>
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </form>

                            <div className="space-y-2.5">
                                <h4 className="text-xs font-semibold text-[#565B68] uppercase tracking-widest">Programadores Ativos</h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {programadores.map((prog) => (
                                        <div key={prog.id} className="flex items-center justify-between bg-[#111318]/80 px-4 py-3 border border-[#262A33]/80 rounded-xl group hover:border-[#333844] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-sm text-white">{prog.nome}</span>
                                                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                                                    prog.setor === 'EDM_FIO' 
                                                        ? 'bg-[rgba(74,157,116,0.1)] border-[#4A9D74]/40 text-[#4A9D74]' 
                                                        : prog.setor === 'TORNO'
                                                        ? 'bg-amber-950/80 border-amber-500/50 text-[#D97D3D]'
                                                        : prog.setor === 'CNC'
                                                        ? 'bg-[rgba(123,128,143,0.12)] border-[#7B808F]/40 text-[#9DA2AE]'
                                                        : 'bg-[#1F232B] border-[#333844] text-[#7B808F]'
                                                }`}>
                                                    {prog.setor === 'EDM_FIO' ? 'EDM Fio' : prog.setor === 'TORNO' ? 'Torno' : prog.setor === 'CNC' ? 'CNC' : 'Toda Fábrica'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removerComAviso(() => removeProgramador(prog.id), 'programador')}
                                                className="text-[#565B68] hover:text-[#C85558] p-1.5 rounded-lg transition-colors"
                                                title="Remover programador"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {programadores.length === 0 && (
                                        <p className="text-xs text-[#565B68] text-center border border-dashed border-[#262A33] rounded-xl py-6">Nenhum programador cadastrado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${cardClasses} lg:col-span-2`}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Wrench className="text-[#C99A4A] w-5 h-5" />
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Fornecedores externos</h3>
                                    <p className="text-xs font-bold text-[#565B68]">
                                        {(fornecedores || []).length} cadastrados — usados na carteira (quem recebeu a peça)
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <form onSubmit={handleAddFornecedor} className="flex flex-col sm:flex-row gap-3 items-end bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl">
                                <div className="flex-1 w-full">
                                    <label className={titleClasses}>Empresa</label>
                                    <input
                                        type="text"
                                        value={novoFornecedorNome}
                                        onChange={(e) => setNovoFornecedorNome(e.target.value)}
                                        placeholder="Ex: TT Vale do Sinos"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="w-full sm:w-56">
                                    <label className={titleClasses}>Tipo</label>
                                    <select value={novoFornecedorTipo} onChange={(e) => setNovoFornecedorTipo(e.target.value)} className={inputClasses}>
                                        {TIPOS_SERVICO_EXTERNO.map((t) => (
                                            <option key={t.id} value={t.id}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button type="submit" variant="primary" size="md" className="px-4 h-[44px] w-full sm:w-auto shrink-0" disabled={!novoFornecedorNome.trim()}>
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </form>
                            <div className="space-y-2">
                                {(fornecedores || []).map((f) => (
                                    <div key={f.id} className="flex items-center justify-between bg-[#111318]/80 px-4 py-3 border border-[#262A33]/80 rounded-xl">
                                        <div>
                                            <p className="font-bold text-sm text-white">{f.nome}</p>
                                            <p className="text-[10px] text-[#7B808F] uppercase">{rotuloTipoServicoExterno(f.tipo)}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removerComAviso(() => removeFornecedor(f.id), 'fornecedor')}
                                            className="text-[#565B68] hover:text-[#C85558] p-1.5 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {(!fornecedores || !fornecedores.length) && (
                                    <p className="text-xs text-[#565B68] border border-dashed border-[#262A33] rounded-xl py-6 text-center">Nenhum fornecedor cadastrado.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== ABA 3: EQUIPE & ACESSOS ========== */}
            {activeTab === 'equipe' && (
                <div className="space-y-8 animate-modal-in">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Operadores do Chão de Fábrica */}
                        <div className={cardClasses}>
                            <div className={headerClasses}>
                                <div className="flex items-center gap-3">
                                    <Users className="text-kanban-amber w-5 h-5" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Operadores de Chão de Fábrica</h3>
                                        <p className="text-xs font-bold text-[#565B68]">Usado na assinatura de setup, troca e inspeções</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <form onSubmit={handleAddOperador} className="space-y-3 bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl">
                                    <label className={titleClasses}>Nome e Setor do Operador</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            value={novoOperador}
                                            onChange={e => setNovoOperador(e.target.value)}
                                            placeholder="Ex: Pedro Oliveira"
                                            className={inputClasses}
                                        />
                                        <select
                                            value={novoOperadorSetor}
                                            onChange={e => setNovoOperadorSetor(e.target.value)}
                                            className={inputClasses + " sm:w-48"}
                                        >
                                            <option value="TODOS">Toda Fábrica</option>
                                            <option value="CNC">Centro CNC</option>
                                            <option value="EDM_FIO">EDM Fio</option>
                                            <option value="TORNO">Torno CNC</option>
                                        </select>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="h-[44px] px-4 shrink-0"
                                            disabled={!novoOperador.trim()}
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </form>

                                <div className="space-y-2">
                                    <h5 className="text-[10px] font-semibold text-[#565B68] uppercase tracking-widest">
                                        Operadores Registrados ({operadores.length})
                                    </h5>
                                    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                        {operadores.map((op) => (
                                            <div key={op.id} className="flex items-center justify-between bg-[#111318]/80 px-4 py-2.5 border border-[#262A33]/80 rounded-xl group hover:border-[#333844] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-sm text-[#E7E9ED]">{op.nome}</span>
                                                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                                                        op.setor === 'EDM_FIO' 
                                                            ? 'bg-[rgba(74,157,116,0.1)] border-[#4A9D74]/40 text-[#4A9D74]' 
                                                            : op.setor === 'TORNO'
                                                            ? 'bg-amber-950/80 border-amber-500/50 text-[#D97D3D]'
                                                            : op.setor === 'CNC'
                                                            ? 'bg-[rgba(123,128,143,0.12)] border-[#7B808F]/40 text-[#9DA2AE]'
                                                            : 'bg-[#1F232B] border-[#333844] text-[#7B808F]'
                                                    }`}>
                                                        {op.setor === 'EDM_FIO' ? 'EDM Fio' : op.setor === 'TORNO' ? 'Torno' : op.setor === 'CNC' ? 'CNC' : 'Toda Fábrica'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => removerComAviso(() => removeOperador(op.id), 'operador')}
                                                    className="text-[#565B68] hover:text-[#C85558] p-1.5 rounded-lg transition-colors"
                                                    title="Remover nome"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {operadores.length === 0 && (
                                            <p className="text-xs text-[#565B68] italic text-center py-6 border border-dashed border-[#262A33] rounded-xl">Nenhum operador cadastrado.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PIN Master & Link de Entrada */}
                        <div className={cardClasses}>
                            <div className={headerClasses}>
                                <div className="flex items-center gap-3">
                                    <Zap className="text-[#D97D3D] w-5 h-5" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Terminais de Fábrica & PIN</h3>
                                        <p className="text-xs font-bold text-[#565B68]">Acesso simplificado sem necessidade de senha</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="bg-[#111318]/80 p-4 rounded-xl border border-[#262A33]/80 space-y-2">
                                    <p className="text-[10px] font-bold text-[#7B808F] uppercase tracking-widest">
                                        Link de Entrada Direta para Terminais
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs text-kanban-blue font-mono truncate select-all flex-1 bg-[#181B22] p-2.5 rounded-lg border border-[#262A33]">
                                            {`${window.location.origin}/join/${codigoConvite}`}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/join/${codigoConvite}`);
                                                setToastMsg('Link copiado!');
                                                setTimeout(() => setToastMsg(''), 2000);
                                            }}
                                            className="p-2.5 bg-[#1F232B] hover:bg-[#333844] rounded-lg text-[#E7E9ED] hover:text-[#E7E9ED] transition-all shrink-0"
                                            title="Copiar Link"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-[#111318]/80 p-4 rounded-xl border border-[#262A33]/80 space-y-3">
                                    <label className="block text-xs font-semibold text-[#D97D3D] uppercase tracking-widest">PIN Master da Fábrica</label>
                                    <p className="text-xs text-[#7B808F]">PIN mestre da fábrica (tablets genéricos e autorizações). Convites individuais da equipe ficam abaixo — cada pessoa tem o próprio PIN.</p>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D97D3D]" />
                                            <input
                                                type="text"
                                                maxLength={4}
                                                value={pinLocal}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                    setPinLocal(val);
                                                }}
                                                className="w-full bg-[#181B22] border border-[#262A33] rounded-xl py-2.5 pl-10 pr-3 text-white font-mono font-semibold text-lg tracking-[0.3em] focus:border-kanban-amber outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    await salvarConfiguracoes(configuracaoDaTela());
                                                    setToastMsg('PIN Master atualizado!');
                                                    setTimeout(() => setToastMsg(''), 2500);
                                                } catch (err) {
                                                    setToastMsg('Erro ao salvar PIN: ' + err.message);
                                                    setTimeout(() => setToastMsg(''), 3500);
                                                }
                                            }}
                                            className="px-4 py-2.5 bg-kanban-amber text-[#111318] font-semibold rounded-xl text-xs uppercase tracking-widest hover:bg-[#c46d32] transition-colors shadow-sm"
                                        >
                                            Salvar PIN
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Convites sem e-mail */}
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-[#4A9D74] w-5 h-5" />
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Convites da equipe</h3>
                                    <p className="text-xs font-bold text-[#565B68]">Nome + setor. Sem e-mail: a pessoa abre o link da fábrica e digita o PIN.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <form onSubmit={handleCriarConvite} className="flex flex-col sm:flex-row gap-3 items-end bg-[#111318]/80 p-4 border border-[#262A33]/80 rounded-xl">
                                <div className="flex-1 w-full">
                                    <label className={titleClasses}>Nome da pessoa</label>
                                    <input
                                        type="text"
                                        value={conviteNome}
                                        onChange={(e) => setConviteNome(e.target.value)}
                                        placeholder="Ex: Ana Silva"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="w-full sm:w-52">
                                    <label className={titleClasses}>Setor / papel</label>
                                    <select
                                        value={convitePapel}
                                        onChange={(e) => setConvitePapel(e.target.value)}
                                        className={inputClasses}
                                    >
                                        {PAPEIS_CONVITE.map((p) => (
                                            <option key={p.id} value={p.id}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full sm:w-36">
                                    <label className={titleClasses}>PIN (4 dígitos)</label>
                                    <div className="flex gap-1.5">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={convitePin}
                                            onChange={(e) => setConvitePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            className={`${inputClasses} font-mono tracking-[0.25em] text-center`}
                                        />
                                        <button
                                            type="button"
                                            onClick={sugerirPinConvite}
                                            className="p-2.5 bg-[#1F232B] hover:bg-[#333844] rounded-xl text-[#E7E9ED] shrink-0"
                                            title="Sugerir outro PIN"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <Button type="submit" variant="primary" size="md" className="px-4 h-[44px] w-full sm:w-auto shrink-0" disabled={!conviteNome.trim() || String(convitePin).length !== 4}>
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </form>

                            {pinGeradoAgora && (
                                <div className="bg-[rgba(74,157,116,0.1)] border border-[#4A9D74]/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-[#4A9D74] uppercase tracking-widest">PIN deste convite — entregue agora</p>
                                        <p className="text-sm text-white mt-1">
                                            {pinGeradoAgora.nome} · {pinGeradoAgora.papel} · <span className="font-mono tracking-[0.3em] text-lg">{pinGeradoAgora.pin}</span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(pinGeradoAgora.pin);
                                            setToastMsg('PIN copiado!');
                                            setTimeout(() => setToastMsg(''), 2000);
                                        }}
                                        className="px-3 py-2 bg-[#1F232B] rounded-lg text-xs font-semibold text-[#E7E9ED] flex items-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" /> Copiar PIN
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2">
                                {(convites || []).map((c) => {
                                    const pinAtual = pinEdicao[c.id] ?? c.pin;
                                    const pinMudou = String(pinAtual) !== String(c.pin);
                                    return (
                                    <div key={c.id} className="flex items-center justify-between gap-3 bg-[#111318]/80 px-4 py-3 border border-[#262A33]/80 rounded-xl">
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-white truncate">{c.nome}</p>
                                            <p className="text-[10px] text-[#7B808F] uppercase tracking-widest">
                                                {rotuloPapelConvite(c)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={4}
                                                value={pinAtual}
                                                onChange={(e) => setPinEdicao((prev) => ({ ...prev, [c.id]: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                                className="w-[88px] bg-[#181B22] border border-[#262A33] rounded-lg py-1.5 px-2 text-white font-mono font-semibold tracking-[0.25em] text-center text-sm focus:border-kanban-amber outline-none"
                                                title="PIN editável"
                                            />
                                            {pinMudou && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSalvarPinConvite(c)}
                                                    disabled={String(pinAtual).length !== 4}
                                                    className="px-2 py-1.5 bg-kanban-amber text-[#111318] text-[10px] font-semibold uppercase rounded-lg disabled:opacity-40"
                                                >
                                                    Salvar
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!window.confirm(`Revogar acesso de ${c.nome}?`)) return;
                                                    try {
                                                        await revogarConvite(c.id);
                                                        setToastMsg('Convite revogado.');
                                                    } catch (err) {
                                                        setToastMsg('Erro: ' + err.message);
                                                    }
                                                    setTimeout(() => setToastMsg(''), 2500);
                                                }}
                                                className="p-1.5 text-[#565B68] hover:text-[#C85558] rounded-lg"
                                                title="Revogar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    );
                                })}
                                {(!convites || !convites.length) && (
                                    <p className="text-xs text-[#565B68] border border-dashed border-[#262A33] rounded-xl py-6 text-center">Nenhum convite ativo.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {usuarios?.length > 0 && (
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Users className="text-[#7B808F] w-5 h-5" />
                                <h3 className="text-sm font-semibold text-white">Contas já vinculadas</h3>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(usuarios || []).map((u) => (
                                    <div key={u.id} className="p-4 bg-[#111318]/80 border border-[#262A33]/80 rounded-xl flex items-center justify-between hover:border-[#333844] transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-lg ${u.funcao === 'admin' ? 'bg-amber-500/15 text-[#D97D3D] border border-amber-500/30' : 'bg-[#1F232B] text-[#7B808F]'}`}>
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-white truncate max-w-[140px]">{u.nome || u.email || 'Usuário'}</p>
                                                <p className="text-[9px] font-semibold text-[#565B68] uppercase tracking-widest">{u.funcao === 'admin' ? 'Gestor' : 'Programador'}</p>
                                            </div>
                                        </div>

                                        {u.id !== user?.id && (
                                            <button
                                                onClick={async () => {
                                                    if (!window.confirm(`Remover ${u.email || u.nome}?`)) return;
                                                    const { removeUserFromEquipe } = useAppStore.getState();
                                                    try {
                                                        await removeUserFromEquipe(u.id);
                                                        setToastMsg('Conta removida!');
                                                    } catch (err) {
                                                        setToastMsg('Erro ao remover conta: ' + err.message);
                                                    }
                                                    setTimeout(() => setToastMsg(''), 3000);
                                                }}
                                                className="p-1.5 text-[#565B68] hover:text-[#C85558] rounded-lg transition-colors"
                                                title="Remover conta"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    )}
                </div>
            )}

            {/* ========== ABA 4: ROTINAS DE MANUTENÇÃO ========== */}
            {activeTab === 'automacao' && (
                <div className="space-y-6 animate-modal-in">
                    <div className={cardClasses}>
                        <div className={headerClasses}>
                            <div className="flex items-center gap-3">
                                <Wrench className="text-[#4A9D74] w-5 h-5" />
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Rotina de manutenção por máquina</h3>
                                    <p className="text-xs font-bold text-[#565B68]">
                                        Não é O.S. de peça. No vencimento, o cartão entra no quadro do setor da máquina (CNC, eletrofio, torno…).
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleAddKanbanAuto} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                <div>
                                    <label className={titleClasses}>Máquina</label>
                                    <select
                                        value={kbMaquina}
                                        onChange={(e) => {
                                            const nome = e.target.value;
                                            setKbMaquina(nome);
                                            const setor = (maquinas || []).find((m) => m.nome === nome)?.setor || 'CNC';
                                            const ids = rotinasParaSetor(setor).map((r) => r.id);
                                            if (kbTipo && !ids.includes(kbTipo)) {
                                                setKbTipo('');
                                                setKbDias('');
                                            }
                                        }}
                                        className={inputClasses}
                                        required
                                    >
                                        <option value="">Selecione a máquina…</option>
                                        {maquinasPorSetor.map((g) => (
                                            <optgroup key={g.setor} label={g.label}>
                                                {g.maquinas.map((m) => (
                                                    <option key={m.id} value={m.nome}>{m.nome}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    {maquinaRotina && (
                                        <p className="text-[10px] text-[#7B808F] mt-1.5 uppercase tracking-wider">
                                            Quadro: {rotuloSetorMaquina(setorRotina)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className={titleClasses}>Serviço</label>
                                    <select
                                        value={kbTipo}
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            setKbTipo(id);
                                            const r = rotinaPorId(id, setorRotina);
                                            if (r?.dias) setKbDias(String(r.dias));
                                        }}
                                        className={inputClasses}
                                        required
                                        disabled={!kbMaquina}
                                    >
                                        <option value="" disabled>{kbMaquina ? 'Selecione o serviço…' : 'Escolha a máquina primeiro'}</option>
                                        {opcoesRotina.map((r) => (
                                            <option key={r.id} value={r.id}>{r.label}</option>
                                        ))}
                                    </select>
                                    {rotinaPorId(kbTipo, setorRotina)?.hint && (
                                        <p className="text-[10px] text-[#7B808F] mt-1.5">{rotinaPorId(kbTipo, setorRotina).hint}</p>
                                    )}
                                </div>

                                <div>
                                    <label className={titleClasses}>Repetir a cada</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={kbDias}
                                            onChange={(e) => setKbDias(e.target.value)}
                                            min="1"
                                            className={inputClasses + ' pr-12'}
                                            placeholder="30"
                                            required
                                        />
                                        <span className="absolute right-3 top-3 text-[#565B68] font-bold text-xs">dias</span>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <label className={titleClasses}>{kbTipo === 'outros' ? 'Descrição' : 'Obs. (opcional)'}</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={kbOutros}
                                            onChange={(e) => setKbOutros(e.target.value)}
                                            className={inputClasses}
                                            placeholder={kbTipo === 'outros' ? 'Ex: troca de encoder' : 'Detalhe, se precisar'}
                                            required={kbTipo === 'outros'}
                                        />
                                        <Button type="submit" variant="primary" size="md" className="px-4 shrink-0 h-[46px]">
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-[#565B68] uppercase tracking-widest px-1">
                            Rotinas ativas ({kanbansAutomaticos.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kanbansAutomaticos.map((kb) => {
                                const maq = (maquinas || []).find((m) => m.nome === kb.maquinaNome);
                                const setor = maq?.setor || null;
                                return (
                                <div key={kb.id} className="flex flex-col justify-between bg-[#181B22]/90 p-5 border border-[#262A33]/80 rounded-xl hover:border-[#333844] transition-colors">
                                    <div>
                                        <div className="flex items-start justify-between mb-3 gap-2">
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="inline-flex items-center gap-1.5 bg-kanban-teal/10 text-[#4A9D74] border border-[#4A9D74]/20 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                    <RefreshCw className="w-3 h-3" /> A cada {kb.diasIntervalo} d
                                                </span>
                                                {setor && (
                                                    <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-[#333844] text-[#9DA2AE]">
                                                        {rotuloSetorMaquina(setor)}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removerComAviso(() => removeKanbanAutomatico(kb.id), 'rotina')}
                                                className="text-[#565B68] hover:text-[#C85558] rounded p-1 transition-colors"
                                                title="Remover rotina"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="font-bold text-base text-white leading-snug mb-2">{kb.descricao}</p>
                                        <div className="flex items-center gap-2">
                                            <Monitor className="w-3.5 h-3.5 text-[#565B68]" />
                                            <p className="text-xs font-bold text-[#7B808F] uppercase tracking-wider">{kb.maquinaNome || 'Máquina não definida'}</p>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}

                            {kanbansAutomaticos.length === 0 && (
                                <p className="col-span-full text-xs text-[#565B68] border border-dashed border-[#262A33] rounded-xl text-center py-8">
                                    Nenhuma rotina. Cadastre por máquina: preventiva CNC, resina do fio, lubrificação do torno…
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Feedback */}
            {toastMsg && (
                <div className={`fixed bottom-6 right-6 ${toastMsg.startsWith('Erro') ? 'bg-[#C85558] border-red-500' : 'bg-[#4A9D74] border-[#4A9D74]'} text-white border px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2.5 z-[300] animate-modal-in`}>
                    <Zap className="w-4 h-4 text-white/80" />
                    {toastMsg}
                </div>
            )}
        </div>
    );
}
