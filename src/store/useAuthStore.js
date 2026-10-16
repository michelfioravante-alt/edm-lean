import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { checarThrottleAuth, mensagemErroAuth, senhaAceitavel } from '../utils/authThrottle';
import { normalizarRole } from '../constants/roles';

// Evita registrar vários listeners (React Strict Mode monta o App duas vezes no dev)
let authStateSubscription = null;

export const useAuthStore = create((set, get) => ({
    user: null, // Objeto de usuário do Supabase Auth
    role: null, // 'admin' (gestor) | 'programmer'
    empresaId: null, // ID da empresa atrelada ao usuário
    nomeEmpresa: null, // Nome da empresa (nome_fantasia)
    codigoConvite: null,
    plano: 'piloto', // 'piloto' | 'pro'
    dataCriacao: null, // Data de criação da empresa
    isInitialized: false, // Flag para saber se já checamos a sessão inicial
    signUpInProgress: false, // Flag para evitar race condition no cadastro
    isResettingPassword: false, // Flag para exibir o fluxo de redefinição no Login

    // Inicializa a escuta de sessão (deve ser chamado no App.jsx uma vez)
    initializeAuth: async () => {
        if (window.location.hash.includes('type=recovery') || window.location.href.includes('type=recovery')) {
            set({ isResettingPassword: true });
        }

        const SAFETY_TIMEOUT_MS = 12000;
        const safetyTimer = setTimeout(() => {
            if (!get().isInitialized) set({ isInitialized: true });
        }, SAFETY_TIMEOUT_MS);

        // Registrar o listener ANTES de getSession
        if (!authStateSubscription) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                // No mobile, SIGNED_IN pode disparar no refresh de token anônimo.
                // Só buscamos perfil se houver usuário e não estivermos já no meio de um cadastro.
                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user && !get().signUpInProgress) {
                    setTimeout(() => {
                        get().fetchUserProfile(session.user);
                    }, 0);
                } else if (event === 'SIGNED_OUT') {
                    set({ user: null, role: null, empresaId: null, nomeEmpresa: null, codigoConvite: null, signUpInProgress: false });
                } else if (event === 'PASSWORD_RECOVERY') {
                    set({ isResettingPassword: true });
                    window.location.hash = '#reset-password';
                }
            });
            authStateSubscription = subscription;
        }

        try {
            let { data: { session } } = await supabase.auth.getSession();

            // Se voltou do link de confirmação, o token pode estar no hash e o cliente processa de forma assíncrona
            if (!session?.user && typeof window !== 'undefined' && window.location.hash?.includes('access_token')) {
                await new Promise(r => setTimeout(r, 400));
                const retry = await supabase.auth.getSession();
                session = retry.data.session;
                if (session?.user && window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            }

            if (session?.user) {
                await get().fetchUserProfile(session.user);
            } else {
                set({ isInitialized: true, user: null, role: null, empresaId: null });
            }
        } finally {
            clearTimeout(safetyTimer);
        }
    },

    // Busca o perfil estendido (empresa_id e funcao) no banco de dados
    fetchUserProfile: async (authUser) => {
        try {
            const { data, error } = await supabase
                .from('perfis')
                .select('funcao, empresa_id, setor_padrao')
                .eq('id', authUser.id)
                .single();

            if (error) throw error;

            // Busca dados da empresa (código, nome, plano e data de criação)
            const { data: companyData } = await supabase
                .from('empresas')
                .select('codigo_convite, nome_fantasia, plano, created_at')
                .eq('id', data.empresa_id)
                .single();

            set({
                user: authUser,
                role: normalizarRole(data?.funcao),
                setorPadrao: data?.setor_padrao || (data?.funcao === 'admin' ? 'TODOS' : 'CNC'),
                empresaId: data?.empresa_id,
                nomeEmpresa: companyData?.nome_fantasia || 'Fábrica',
                codigoConvite: companyData?.codigo_convite || data.empresa_id?.slice(0, 8).toUpperCase(),
                plano: companyData?.plano || 'piloto',
                dataCriacao: companyData?.created_at || null,
                isInitialized: true
            });
        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error.message);
            // IMPORTANTE: Se já temos um empresaId (ex: setado no loginComoOperador), 
            // não limpamos o estado em caso de erro de rede/refresh no mobile.
            if (!get().empresaId) {
                set({ user: authUser, role: null, empresaId: null, isInitialized: true });
            } else {
                set({ isInitialized: true });
            }
        }
    },

    setSetorPadrao: (setor) => {
        localStorage.setItem('cnc-lean-setor-padrao', setor);
        set({ setorPadrao: setor });
    },

    login: async (email, password) => {
        try {
            const throttle = checarThrottleAuth('login');
            if (!throttle.ok) return { success: false, error: throttle.error };

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, error: mensagemErroAuth(error) };
            }

            // Garante perfil mesmo se o listener atrasar (evita tela de login eternamente)
            if (data?.user) {
                await get().fetchUserProfile(data.user);
            }
            return { success: true };

        } catch (err) {
            return { success: false, error: mensagemErroAuth(err) || 'Erro inesperado de servidor' };
        }
    },

    signUp: async (email, password, companyNameOrCode) => {
        set({ signUpInProgress: true });
        try {
            const throttle = checarThrottleAuth('signup', { minIntervalMs: 2000, maxPorJanela: 5, janelaMs: 60 * 60 * 1000 });
            if (!throttle.ok) {
                set({ signUpInProgress: false });
                return { success: false, error: throttle.error };
            }
            const senha = senhaAceitavel(password);
            if (!senha.ok) {
                set({ signUpInProgress: false });
                return { success: false, error: senha.error };
            }

            const input = companyNameOrCode.trim();

            // 1. Criar o usuário no Supabase Auth
            // emailRedirectTo: para onde o usuário volta após clicar no link de confirmação no e-mail
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            });

            if (authError) {
                set({ signUpInProgress: false });
                return { success: false, error: mensagemErroAuth(authError) };
            }
            if (!authData.user) {
                set({ signUpInProgress: false });
                return { success: false, error: 'Erro ao criar usuário.' };
            }

            // IMPORTANTE: Verificar se o email precisa de confirmação
            // No Supabase, se 'Confirm Email' estiver ligado, authData.session será nulo,
            // mas o usuário é criado. Precisamos rodar nossa RPC segura.

            // 2. Chamar RPC Segura para criar Empresa/Perfil ignorando RLS
            const { error: rpcError } = await supabase.rpc('registrar_conta_inicial', {
                p_user_id: authData.user.id,
                p_email: email,
                p_company_name_or_code: input
            });

            if (rpcError) {
                console.error("Erro na RPC de cadastro:", rpcError);
                // Usuário Auth pode ter sido criado; sem admin API não dá para apagar daqui.
                set({ signUpInProgress: false });
                const msg = rpcError.message || '';
                if (/does not exist|schema cache|registrar_conta_inicial/i.test(msg)) {
                    return {
                        success: false,
                        error: 'Banco incompleto: falta rodar as migrações SQL (01→16) no Supabase desta conta.',
                    };
                }
                return {
                    success: false,
                    error: mensagemErroAuth(rpcError) || ('Não foi possível criar a empresa/perfil: ' + msg),
                };
            }

            set({ signUpInProgress: false });

            // Verificar se ele foi logado direto ou se precisa confirmar o email
            if (!authData.session) {
                return { success: true, requiresEmailConfirmation: true };
            }

            // Se confirm email for OFF e ele logou direto: carregamos o perfil AGORA
            // para o App re-renderizar e sair da tela de Login (evita ficar travado em "Conta criada com sucesso")
            await get().fetchUserProfile(authData.user);
            return { success: true, requiresEmailConfirmation: false };
        } catch (err) {
            console.error('Signup error:', err);
            set({ signUpInProgress: false });
            return { success: false, error: 'Erro inesperado no cadastro: ' + err.message };
        }
    },

    requestPasswordReset: async (email) => {
        try {
            const throttle = checarThrottleAuth('recover', { minIntervalMs: 5000, maxPorJanela: 4, janelaMs: 60 * 60 * 1000 });
            if (!throttle.ok) return { success: false, error: throttle.error };

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin, // Volta pro index, o onAuthStateChange pegará PASSWORD_RECOVERY
            });
            if (error) return { success: false, error: mensagemErroAuth(error) };
            // Mesma mensagem com ou sem e-mail cadastrado (não vazar existência da conta)
            return { success: true };
        } catch (err) {
            return { success: false, error: mensagemErroAuth(err) || 'Erro inesperado ao solicitar redefinição' };
        }
    },

    updatePassword: async (newPassword) => {
        try {
            const senha = senhaAceitavel(newPassword);
            if (!senha.ok) return { success: false, error: senha.error };
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) return { success: false, error: mensagemErroAuth(error) };
            return { success: true };
        } catch (err) {
            return { success: false, error: mensagemErroAuth(err) || 'Erro inesperado ao atualizar a senha' };
        }
    },

    loginComoOperador: async (inviteCode, pin) => {
        try {
            const throttle = checarThrottleAuth('pin', { minIntervalMs: 800, maxPorJanela: 12, janelaMs: 5 * 60 * 1000 });
            if (!throttle.ok) return { success: false, error: throttle.error };

            const normalizedCode = (inviteCode || '').trim().toUpperCase();

            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
            if (anonError) {
                const m = anonError.message || '';
                if (/anonymous|Anon|disabled|not enabled/i.test(m)) {
                    throw new Error('Acesso de terminal desligado no Supabase (Anonymous sign-ins). Peça ao gestor para habilitar.');
                }
                throw anonError;
            }
            const anonUser = anonData?.user;
            if (!anonUser) throw new Error('Falha ao criar sessão do terminal.');

            let row = null;
            const novo = await supabase.rpc('vincular_acesso_por_pin', {
                p_invite_code: normalizedCode,
                p_pin: pin,
            });
            const rpcAusente = novo.error && /does not exist|schema cache|vincular_acesso_por_pin/i.test(novo.error.message || '');
            if (!novo.error && novo.data && (Array.isArray(novo.data) ? novo.data[0] : novo.data)) {
                row = Array.isArray(novo.data) ? novo.data[0] : novo.data;
            } else if (rpcAusente) {
                const { data: companyRows, error: rpcError } = await supabase.rpc('vincular_perfil_operador', {
                    p_invite_code: normalizedCode,
                    p_pin: pin,
                    p_nome: 'Terminal de Produção'
                });
                if (rpcError) throw new Error(rpcError.message || 'PIN de Segurança incorreto.');
                if (!companyRows || companyRows.length === 0) throw new Error('Empresa não identificada.');
                row = { ...companyRows[0], funcao: 'programmer', setor_padrao: 'CNC' };
            } else if (novo.error) {
                throw new Error(novo.error.message || 'PIN de Segurança incorreto.');
            } else {
                throw new Error('Empresa não identificada.');
            }

            set({
                user: anonUser,
                role: normalizarRole(row.funcao),
                setorPadrao: row.setor_padrao || (row.funcao === 'admin' ? 'TODOS' : 'CNC'),
                empresaId: row.empresa_id || row.id,
                nomeEmpresa: row.nome_fantasia || 'Fábrica',
                codigoConvite: row.codigo_convite || normalizedCode,
                plano: row.plano || 'piloto',
                dataCriacao: row.created_at || null,
                isInitialized: true
            });

            return { success: true };
        } catch (err) {
            console.error('loginComoOperador error:', err);
            return { success: false, error: 'Falha no acesso: ' + mensagemErroAuth(err) };
        }
    },

    logout: async () => {
        set({ user: null, role: null, empresaId: null, nomeEmpresa: null, codigoConvite: null });
        supabase.auth.signOut().catch((e) => console.warn('signOut em background:', e.message));
    }
}));

