import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    MessageCircle, X, ChevronLeft, Copy, Check, Wrench, HelpCircle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { FAQ_TOPICOS, SETORES_SETUP } from '../../utils/assistenteConteudo';

function bolhaAssistente({ children }) {
    return (
        <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-[#262A33] bg-[#1F232B] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#E7E9ED]">
            {children}
        </div>
    );
}

function bolhaUsuario({ children }) {
    return (
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-[#D97D3D]/15 border border-[#D97D3D]/35 px-3.5 py-2.5 text-[13px] leading-relaxed text-[#E7E9ED]">
            {children}
        </div>
    );
}

function Opcoes({ items, disabled }) {
    return (
        <div className="flex flex-wrap gap-2 pt-1">
            {items.map((item) => (
                <button
                    key={item.id || item.label}
                    type="button"
                    disabled={disabled || item.disabled}
                    onClick={item.onClick}
                    className="rounded-lg border border-[#333844] bg-[#181B22] px-3 py-2 text-left text-[12.5px] font-medium text-[#E7E9ED] transition-colors hover:border-[#D97D3D]/50 hover:bg-[#1F232B] disabled:opacity-40"
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

export default function AssistenteFabrica({ onViewChange }) {
    const role = useAuthStore((s) => s.role);
    const codigoConvite = useAuthStore((s) => s.codigoConvite);
    const nomeEmpresa = useAuthStore((s) => s.nomeEmpresa);

    const aberto = useAppStore((s) => s.assistenteAberto);
    const modo = useAppStore((s) => s.assistenteModo);
    const abrirAssistente = useAppStore((s) => s.abrirAssistente);
    const fecharAssistente = useAppStore((s) => s.fecharAssistente);
    const configCarregada = useAppStore((s) => s.configCarregada);
    const recursosCarregados = useAppStore((s) => s.recursosCarregados);
    const configuracoesGlobais = useAppStore((s) => s.configuracoesGlobais);
    const maquinas = useAppStore((s) => s.maquinas);
    const operadores = useAppStore((s) => s.operadores);
    const addMaquina = useAppStore((s) => s.addMaquina);
    const addOperador = useAppStore((s) => s.addOperador);
    const salvarConfiguracoes = useAppStore((s) => s.salvarConfiguracoes);
    const marcarOnboardingConcluido = useAppStore((s) => s.marcarOnboardingConcluido);

    const [passo, setPasso] = useState('inicio');
    const [setores, setSetores] = useState(['CNC']);
    const [faqId, setFaqId] = useState(null);
    const [nomeMaquina, setNomeMaquina] = useState('');
    const [setorMaquina, setSetorMaquina] = useState('CNC');
    const [nomeOperador, setNomeOperador] = useState('');
    const [pinNovo, setPinNovo] = useState('');
    const [busy, setBusy] = useState(false);
    const [erro, setErro] = useState('');
    const [copiado, setCopiado] = useState(false);
    const [log, setLog] = useState([]);
    const autoAbriuRef = useRef(false);
    const scrollRef = useRef(null);

    const joinUrl = codigoConvite
        ? `${window.location.origin}/join/${codigoConvite}`
        : '';

    const setupIncompleto = maquinas.length === 0 || operadores.length === 0;
    const onboardingConcluido = !!configuracoesGlobais?.onboardingConcluido;

    useEffect(() => {
        if (autoAbriuRef.current) return;
        if (role !== 'admin') return;
        if (!configCarregada || !recursosCarregados) return;
        if (onboardingConcluido) return;
        if (!setupIncompleto) return;
        autoAbriuRef.current = true;
        setPasso('inicio');
        abrirAssistente('setup');
    }, [role, configCarregada, recursosCarregados, onboardingConcluido, setupIncompleto, abrirAssistente]);

    useEffect(() => {
        if (!aberto) return;
        if (modo === 'setup') {
            setPasso((p) => (p === 'faq' || p === 'faq_detalhe' ? 'inicio' : p));
            setFaqId(null);
        } else {
            setPasso('faq');
            setFaqId(null);
        }
        setErro('');
    }, [aberto, modo]);

    useEffect(() => {
        if (!aberto) return;
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [aberto, passo, log, faqId, erro]);

    const pushLog = (de, texto) => {
        setLog((prev) => [...prev.slice(-12), { id: `${Date.now()}-${prev.length}`, de, texto }]);
    };

    const concluirOnboarding = async (marcar = true) => {
        try {
            if (marcar) await marcarOnboardingConcluido(true);
        } catch (e) {
            console.warn('onboarding:', e?.message);
        }
    };

    const pularSetup = async () => {
        pushLog('eu', 'Pular por agora');
        await concluirOnboarding(true);
        setPasso('pulado');
    };

    const toggleSetor = (id) => {
        setSetores((prev) => {
            if (prev.includes(id)) {
                if (prev.length === 1) return prev;
                return prev.filter((s) => s !== id);
            }
            return [...prev, id];
        });
    };

    const handleAddMaquina = async () => {
        const nome = nomeMaquina.trim();
        if (!nome) return;
        setBusy(true);
        setErro('');
        try {
            await addMaquina(nome, setorMaquina);
            pushLog('eu', `Máquina: ${nome} (${setorMaquina === 'EDM_FIO' ? 'EDM' : 'CNC'})`);
            setNomeMaquina('');
        } catch (e) {
            setErro(e?.message || 'Falha ao cadastrar máquina');
        } finally {
            setBusy(false);
        }
    };

    const handleAddOperador = async () => {
        const nome = nomeOperador.trim();
        if (!nome) return;
        setBusy(true);
        setErro('');
        try {
            await addOperador(nome, 'TODOS');
            pushLog('eu', `Operador: ${nome}`);
            setNomeOperador('');
        } catch (e) {
            setErro(e?.message || 'Falha ao cadastrar operador');
        } finally {
            setBusy(false);
        }
    };

    const handleSalvarPin = async () => {
        const pin = pinNovo.trim();
        if (!/^\d{4}$/.test(pin)) {
            setErro('Use um PIN de 4 dígitos.');
            return;
        }
        if (pin === '1234') {
            setErro('Escolha um PIN diferente de 1234.');
            return;
        }
        setBusy(true);
        setErro('');
        try {
            const c = useAppStore.getState().configuracoesGlobais;
            await salvarConfiguracoes({
                custoHoraMaquina: c.custoHoraMaquina,
                custoHoraCnc: c.custoHoraCnc,
                custoHoraEdm: c.custoHoraEdm,
                turnos: c.turnos,
                pinOnboarding: pin,
                modoMagazineDefault: c.modoMagazineDefault,
                baixaEstoqueNoSetup: c.baixaEstoqueNoSetup,
                etapasPersonalizadas: c.etapasPersonalizadas,
            });
            pushLog('eu', 'PIN master atualizado');
            setPinNovo('');
            setPasso('terminal');
        } catch (e) {
            setErro(e?.message || 'Falha ao salvar PIN');
        } finally {
            setBusy(false);
        }
    };

    const copiarLink = async () => {
        if (!joinUrl) return;
        try {
            await navigator.clipboard.writeText(joinUrl);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch {
            setErro('Não foi possível copiar. Selecione o link e copie manualmente.');
        }
    };

    const finalizarSetup = async (destino) => {
        await concluirOnboarding(true);
        setPasso('fim');
        if (destino && onViewChange) {
            onViewChange(destino);
            fecharAssistente();
        }
    };

    const abrirFaq = (id) => {
        const t = FAQ_TOPICOS.find((x) => x.id === id);
        if (!t) return;
        if (t.acao === 'abrir_setup') {
            if (role !== 'admin') {
                setFaqId(id);
                setPasso('faq_detalhe');
                return;
            }
            abrirAssistente('setup');
            setPasso('inicio');
            return;
        }
        setFaqId(id);
        setPasso('faq_detalhe');
    };

    const faqAtual = FAQ_TOPICOS.find((x) => x.id === faqId);

    const painel = aberto ? (
        <div
            className="fixed z-[70] flex flex-col overflow-hidden rounded-2xl border border-[#262A33] bg-[#181B22] shadow-[0_16px_48px_rgba(0,0,0,0.45)]
                inset-x-3 bottom-[72px] top-auto max-h-[min(560px,calc(100dvh-96px))]
                sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(560px,calc(100dvh-48px))] sm:w-[380px]"
            role="dialog"
            aria-label="Assistente de fábrica"
        >
            <div className="flex items-center gap-3 border-b border-[#262A33] px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D97D3D]/15 text-[#D97D3D]">
                    {modo === 'setup' ? <Wrench className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-['Space_Grotesk'] text-[14px] font-semibold text-[#E7E9ED]">
                        Assistente de fábrica
                    </p>
                    <p className="truncate text-[11px] text-[#7B808F]">
                        {modo === 'setup' ? 'Configuração guiada' : 'Ajuda e perguntas frequentes'}
                        {nomeEmpresa ? ` · ${nomeEmpresa}` : ''}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fecharAssistente}
                    className="rounded-md p-1.5 text-[#7B808F] hover:bg-[#1F232B] hover:text-[#E7E9ED]"
                    aria-label="Fechar"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {log.map((m) => (
                    m.de === 'eu'
                        ? <div key={m.id}>{bolhaUsuario({ children: m.texto })}</div>
                        : <div key={m.id}>{bolhaAssistente({ children: m.texto })}</div>
                ))}

                {modo === 'setup' && passo === 'inicio' && (
                    <>
                        {bolhaAssistente({
                            children: (
                                <>
                                    Bem-vindo{nomeEmpresa ? ` à ${nomeEmpresa}` : ''}. Vamos cadastrar o mínimo para o chão funcionar: setores, máquinas, operadores, PIN e link do tablet.
                                </>
                            ),
                        })}
                        <Opcoes
                            items={[
                                { id: 'comecar', label: 'Começar configuração', onClick: () => { pushLog('eu', 'Começar'); setPasso('setores'); } },
                                { id: 'pular', label: 'Pular por agora', onClick: pularSetup },
                                { id: 'ajuda', label: 'Só quero tirar dúvidas', onClick: () => abrirAssistente('ajuda') },
                            ]}
                        />
                    </>
                )}

                {modo === 'setup' && passo === 'setores' && (
                    <>
                        {bolhaAssistente({ children: 'Quais setores esta fábrica usa? Pode marcar os dois.' })}
                        <div className="flex flex-wrap gap-2">
                            {SETORES_SETUP.map((s) => {
                                const on = setores.includes(s.id);
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => toggleSetor(s.id)}
                                        className={`rounded-lg border px-3 py-2 text-[12.5px] font-medium ${
                                            on
                                                ? 'border-[#D97D3D] bg-[#D97D3D]/15 text-[#E7E9ED]'
                                                : 'border-[#333844] bg-[#181B22] text-[#9DA2AE]'
                                        }`}
                                    >
                                        {s.rotulo}
                                    </button>
                                );
                            })}
                        </div>
                        <Opcoes
                            items={[
                                {
                                    id: 'ok',
                                    label: 'Continuar',
                                    onClick: () => {
                                        pushLog('eu', setores.map((id) => SETORES_SETUP.find((s) => s.id === id)?.rotulo).join(' + '));
                                        setSetorMaquina(setores[0] || 'CNC');
                                        setPasso('maquinas');
                                    },
                                },
                            ]}
                        />
                    </>
                )}

                {modo === 'setup' && passo === 'maquinas' && (
                    <>
                        {bolhaAssistente({
                            children: maquinas.length === 0
                                ? 'Cadastre ao menos uma máquina. Nome como aparece no chão (ex.: Hermle C42, Charmilles 440).'
                                : `Você tem ${maquinas.length} máquina(s). Pode adicionar outra ou seguir.`,
                        })}
                        <div className="space-y-2 rounded-xl border border-[#262A33] bg-[#111318] p-3">
                            <input
                                value={nomeMaquina}
                                onChange={(e) => setNomeMaquina(e.target.value)}
                                placeholder="Nome da máquina"
                                className="w-full rounded-md border border-[#333844] bg-[#181B22] px-3 py-2 text-[13px] text-[#E7E9ED] outline-none focus:border-[#D97D3D]"
                            />
                            <select
                                value={setorMaquina}
                                onChange={(e) => setSetorMaquina(e.target.value)}
                                className="w-full rounded-md border border-[#333844] bg-[#181B22] px-3 py-2 text-[13px] text-[#E7E9ED]"
                            >
                                {(setores.length ? setores : ['CNC', 'EDM_FIO']).map((id) => (
                                    <option key={id} value={id}>
                                        {id === 'EDM_FIO' ? 'EDM Fio' : 'CNC'}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                disabled={busy || !nomeMaquina.trim()}
                                onClick={handleAddMaquina}
                                className="w-full rounded-md bg-[#D97D3D] py-2 text-[13px] font-medium text-[#111318] disabled:opacity-40"
                            >
                                Adicionar máquina
                            </button>
                        </div>
                        {maquinas.length > 0 && (
                            <ul className="space-y-1 text-[12px] text-[#9DA2AE]">
                                {maquinas.slice(-5).map((m) => (
                                    <li key={m.id}>· {m.nome}</li>
                                ))}
                            </ul>
                        )}
                        <Opcoes
                            disabled={busy}
                            items={[
                                {
                                    id: 'seguir',
                                    label: maquinas.length ? 'Seguir para operadores' : 'Preciso de ao menos 1 máquina',
                                    disabled: maquinas.length === 0,
                                    onClick: () => setPasso('operadores'),
                                },
                            ]}
                        />
                    </>
                )}

                {modo === 'setup' && passo === 'operadores' && (
                    <>
                        {bolhaAssistente({
                            children: operadores.length === 0
                                ? 'Quem opera no chão? Cadastre ao menos um nome — no Setup o cartão pede máquina e operador.'
                                : `${operadores.length} operador(es). Adicione mais ou continue.`,
                        })}
                        <div className="space-y-2 rounded-xl border border-[#262A33] bg-[#111318] p-3">
                            <input
                                value={nomeOperador}
                                onChange={(e) => setNomeOperador(e.target.value)}
                                placeholder="Nome do operador"
                                className="w-full rounded-md border border-[#333844] bg-[#181B22] px-3 py-2 text-[13px] text-[#E7E9ED] outline-none focus:border-[#D97D3D]"
                            />
                            <button
                                type="button"
                                disabled={busy || !nomeOperador.trim()}
                                onClick={handleAddOperador}
                                className="w-full rounded-md bg-[#D97D3D] py-2 text-[13px] font-medium text-[#111318] disabled:opacity-40"
                            >
                                Adicionar operador
                            </button>
                        </div>
                        {operadores.length > 0 && (
                            <ul className="space-y-1 text-[12px] text-[#9DA2AE]">
                                {operadores.slice(-5).map((o) => (
                                    <li key={o.id}>· {o.nome}</li>
                                ))}
                            </ul>
                        )}
                        <Opcoes
                            disabled={busy}
                            items={[
                                {
                                    id: 'pin',
                                    label: operadores.length ? 'Definir PIN master' : 'Cadastre ao menos 1 operador',
                                    disabled: operadores.length === 0,
                                    onClick: () => setPasso('pin'),
                                },
                            ]}
                        />
                    </>
                )}

                {modo === 'setup' && passo === 'pin' && (
                    <>
                        {bolhaAssistente({
                            children: (
                                <>
                                    O PIN master atual é <span className="font-mono text-[#D97D3D]">{configuracoesGlobais?.pinOnboarding || '1234'}</span>.
                                    {' '}Troque o padrão 1234 — ele abre o terminal e a área do gestor.
                                </>
                            ),
                        })}
                        <div className="space-y-2 rounded-xl border border-[#262A33] bg-[#111318] p-3">
                            <input
                                value={pinNovo}
                                onChange={(e) => setPinNovo(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                inputMode="numeric"
                                placeholder="Novo PIN (4 dígitos)"
                                className="w-full rounded-md border border-[#333844] bg-[#181B22] px-3 py-2 font-mono text-[15px] tracking-[0.3em] text-[#E7E9ED] outline-none focus:border-[#D97D3D]"
                            />
                            <button
                                type="button"
                                disabled={busy}
                                onClick={handleSalvarPin}
                                className="w-full rounded-md bg-[#D97D3D] py-2 text-[13px] font-medium text-[#111318] disabled:opacity-40"
                            >
                                Salvar PIN
                            </button>
                        </div>
                        {(configuracoesGlobais?.pinOnboarding || '1234') !== '1234' && (
                            <Opcoes
                                items={[
                                    { id: 'manter', label: 'Manter PIN atual e continuar', onClick: () => setPasso('terminal') },
                                ]}
                            />
                        )}
                    </>
                )}

                {modo === 'setup' && passo === 'terminal' && (
                    <>
                        {bolhaAssistente({
                            children: 'No tablet do chão, abra este link e digite o PIN. Favorito ou modo quiosque ajuda no dia a dia.',
                        })}
                        {joinUrl ? (
                            <div className="rounded-xl border border-[#262A33] bg-[#111318] p-3">
                                <p className="break-all font-mono text-[11px] text-[#9DA2AE]">{joinUrl}</p>
                                <button
                                    type="button"
                                    onClick={copiarLink}
                                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[#333844] py-2 text-[13px] text-[#E7E9ED] hover:border-[#D97D3D]/50"
                                >
                                    {copiado ? <Check className="h-3.5 w-3.5 text-[#4A9D74]" /> : <Copy className="h-3.5 w-3.5" />}
                                    {copiado ? 'Copiado' : 'Copiar link'}
                                </button>
                            </div>
                        ) : (
                            bolhaAssistente({ children: 'Link de convite ainda não carregou. Veja em Configurações → Equipe.' })
                        )}
                        <Opcoes
                            items={[
                                { id: 'os', label: 'Criar primeira O.S.', onClick: () => finalizarSetup('home') },
                                { id: 'kanban', label: 'Ir ao Kanban', onClick: () => finalizarSetup('kanban') },
                                { id: 'fim', label: 'Concluir configuração', onClick: () => finalizarSetup(null) },
                            ]}
                        />
                    </>
                )}

                {modo === 'setup' && passo === 'pulado' && (
                    <>
                        {bolhaAssistente({
                            children: 'Ok. Quando quiser, toque no ícone do assistente → Continuar configuração. Sem máquina e operador o Setup do Kanban fica bloqueado.',
                        })}
                        <Opcoes
                            items={[
                                { id: 'voltar', label: 'Voltar à configuração', onClick: () => setPasso('inicio') },
                                { id: 'fechar', label: 'Fechar', onClick: fecharAssistente },
                            ]}
                        />
                    </>
                )}

                {modo === 'setup' && passo === 'fim' && (
                    <>
                        {bolhaAssistente({
                            children: 'Fábrica pronta para o básico. Dúvidas depois: mesmo ícone, modo Ajuda.',
                        })}
                        <Opcoes
                            items={[
                                { id: 'ajuda', label: 'Ver perguntas frequentes', onClick: () => abrirAssistente('ajuda') },
                                { id: 'fechar', label: 'Fechar', onClick: fecharAssistente },
                            ]}
                        />
                    </>
                )}

                {passo === 'faq' && (
                    <>
                        {bolhaAssistente({
                            children: 'Escolha um assunto. Respostas curtas — sem digitar.',
                        })}
                        <Opcoes
                            items={FAQ_TOPICOS.filter((t) => t.id !== 'setup' || role === 'admin').map((t) => ({
                                id: t.id,
                                label: t.titulo,
                                onClick: () => abrirFaq(t.id),
                            }))}
                        />
                    </>
                )}

                {passo === 'faq_detalhe' && faqAtual && (
                    <>
                        <button
                            type="button"
                            onClick={() => { setPasso('faq'); setFaqId(null); }}
                            className="inline-flex items-center gap-1 text-[12px] text-[#7B808F] hover:text-[#E7E9ED]"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Voltar aos assuntos
                        </button>
                        {bolhaAssistente({
                            children: (
                                <>
                                    <p className="font-medium text-[#D97D3D]">{faqAtual.titulo}</p>
                                    <p className="mt-1.5">{faqAtual.resposta}</p>
                                </>
                            ),
                        })}
                        <Opcoes
                            items={[
                                ...(faqAtual.irPara && onViewChange
                                    ? [{
                                        id: 'nav',
                                        label: faqAtual.cta || 'Ir para a tela',
                                        onClick: () => {
                                            onViewChange(faqAtual.irPara);
                                            fecharAssistente();
                                        },
                                    }]
                                    : []),
                                { id: 'mais', label: 'Outra dúvida', onClick: () => { setPasso('faq'); setFaqId(null); } },
                                ...(role === 'admin'
                                    ? [{ id: 'cfg', label: 'Configuração guiada', onClick: () => { abrirAssistente('setup'); setPasso('inicio'); } }]
                                    : []),
                            ]}
                        />
                    </>
                )}

                {erro ? (
                    <p className="rounded-lg border border-[#C85558]/40 bg-[#C85558]/10 px-3 py-2 text-[12px] text-[#E7A0A2]">{erro}</p>
                ) : null}
            </div>

            <div className="flex gap-2 border-t border-[#262A33] px-3 py-2.5">
                {role === 'admin' && (
                    <button
                        type="button"
                        onClick={() => {
                            if (modo === 'setup') abrirAssistente('ajuda');
                            else { abrirAssistente('setup'); setPasso('inicio'); }
                        }}
                        className="flex-1 rounded-md border border-[#333844] py-2 text-[12px] text-[#9DA2AE] hover:text-[#E7E9ED]"
                    >
                        {modo === 'setup' ? 'Ajuda / FAQ' : 'Configurar fábrica'}
                    </button>
                )}
                <button
                    type="button"
                    onClick={fecharAssistente}
                    className="flex-1 rounded-md border border-[#333844] py-2 text-[12px] text-[#9DA2AE] hover:text-[#E7E9ED]"
                >
                    Fechar
                </button>
            </div>
        </div>
    ) : null;

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    if (aberto) {
                        fecharAssistente();
                        return;
                    }
                    abrirAssistente(role === 'admin' && setupIncompleto && !onboardingConcluido ? 'setup' : 'ajuda');
                }}
                className={`fixed z-[65] flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-colors
                    bottom-[72px] right-4 sm:bottom-6 sm:right-6
                    ${aberto
                        ? 'border-[#D97D3D] bg-[#D97D3D] text-[#111318]'
                        : 'border-[#333844] bg-[#1F232B] text-[#D97D3D] hover:border-[#D97D3D]/60'}`}
                aria-label="Assistente de fábrica"
                title="Assistente de fábrica"
            >
                {aberto ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                {!aberto && setupIncompleto && role === 'admin' && !onboardingConcluido && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#C85558]" />
                )}
            </button>
            {painel ? createPortal(painel, document.body) : null}
        </>
    );
}
