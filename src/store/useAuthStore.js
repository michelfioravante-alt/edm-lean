import { create } from 'zustand';
import { supabase } from '../services/supabase';

// Evita registrar vários listeners (React Strict Mode monta o App duas vezes no dev)
let authStateSubscription = null;

export const useAuthStore = create((set, get) => ({
    user: null, // Objeto de usuário do Supabase Auth
    role: null, // Papel ('admin' ou 'operador') vindo da tabela perfis
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

        // No mobile, rede lenta pode fazer getSession/fetchUserProfile travar. Após 12s, libera a tela (evita loading eterno).
        const SAFETY_TIMEOUT_MS = 12000;
        const safetyTimer = setTimeout(() => {
            if (!get().isInitialized) set({ isInitialized: true });
        }, SAFETY_TIMEOUT_MS);

        // Registrar o listener ANTES de getSession, para não perder o evento ao voltar do link de confirmação
        if (!authStateSubscription) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                // No mobile, SIGNED_IN pode disparar no refresh de token anônimo.
                // Só buscamos perfil se houver usuário e não estivermos já no meio de um cadastro.
                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user && !get().signUpInProgress) {
                    await get().fetchUserProfile(session.user);
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
                .select('funcao, empresa_id')
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
                role: data?.funcao || 'operador',
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

    login: async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            // O onAuthStateChange vai assumir a partir daqui e chamar fetchUserProfile
            return { success: true };

        } catch (err) {
            return { success: false, error: 'Erro inesperado de servidor' };
        }
    },

    signUp: async (email, password, companyNameOrCode) => {
        set({ signUpInProgress: true });
        try {
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
                return { success: false, error: authError.message };
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
                // Se der erro aqui, ideal seria limpar o auth user criado, mas fica complexo no client-side.
                set({ signUpInProgress: false });
                return { success: false, error: 'Erro ao inicializar perfil: ' + rpcError.message };
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
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin, // Volta pro index, o onAuthStateChange pegará PASSWORD_RECOVERY
            });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Erro inesperado ao solicitar redefinição' };
        }
    },

    updatePassword: async (newPassword) => {
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Erro inesperado ao atualizar a senha' };
        }
    },

    loginComoOperador: async (inviteCode, pin) => {
        try {
            const normalizedCode = (inviteCode || '').trim().toUpperCase();

            // 1. Criar / obter sessão anônima do Supabase Auth para este terminal
            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
            if (anonError) {
                throw anonError;
            }

            const anonUser = anonData?.user;
            if (!anonUser) {
                throw new Error('Falha ao criar sessão anônima do terminal.');
            }

            // 2. Chamar RPC segura no servidor que valida o PIN e vincula o perfil à empresa sem expor RLS
            const { data: companyRows, error: rpcError } = await supabase.rpc('vincular_perfil_operador', {
                p_invite_code: normalizedCode,
                p_pin: pin,
                p_nome: 'Terminal de Produção'
            });

            if (rpcError) {
                throw new Error(rpcError.message || 'PIN de Segurança incorreto.');
            }

            if (!companyRows || companyRows.length === 0) {
                throw new Error('Empresa não identificada.');
            }

            const company = companyRows[0];

            // 3. Define estado IMEDIATAMENTE com os dados seguros retornados pelo servidor
            set({
                user: anonUser,
                role: 'operador',
                empresaId: company.empresa_id || company.id,
                nomeEmpresa: company.nome_fantasia || 'Fábrica',
                codigoConvite: company.codigo_convite || normalizedCode,
                plano: company.plano || 'piloto',
                dataCriacao: company.created_at || null,
                isInitialized: true
            });

            // 4. Carrega dados iniciais da planta
            const app = (await import('./useAppStore')).useAppStore.getState();
            setTimeout(() => {
                app.fetchOperadores?.();
                app.fetchProgramadores?.();
                app.fetchMaquinas?.();
                app.fetchEstoque?.();
                app.fetchKanbanDadosInicial?.();
            }, 150);

            return { success: true };
        } catch (err) {
            console.error('loginComoOperador error:', err);
            return { success: false, error: 'Falha no acesso: ' + (err.message || 'Erro de rede') };
        }
    },

    logout: async () => {
        // Atualiza estado imediatamente para feedback visual instantâneo (evita atraso no mobile)
        set({ user: null, role: null, empresaId: null, nomeEmpresa: null, codigoConvite: null });
        supabase.auth.signOut().catch((e) => console.warn('signOut em background:', e.message));
    }
}));
