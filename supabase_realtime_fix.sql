-- ========================================================
-- EDM LEAN - FIX OPERADORES NO MOBILE + REALTIME
-- Execute no SQL Editor do Supabase
-- ========================================================

-- 0. RPC para criar cliente (bypass RLS - funciona com operador anônimo no mobile)
CREATE OR REPLACE FUNCTION public.criar_cliente_empresa(
    p_nome text,
    p_email text DEFAULT NULL,
    p_telefone text DEFAULT NULL
)
RETURNS public.clientes AS $$
DECLARE
    v_empresa_id uuid;
    v_cliente public.clientes;
BEGIN
    v_empresa_id := get_user_empresa_id();
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    INSERT INTO public.clientes (empresa_id, nome, email, telefone)
    VALUES (v_empresa_id, trim(p_nome), nullif(trim(coalesce(p_email,'')), ''), nullif(trim(coalesce(p_telefone,'')), ''))
    RETURNING * INTO v_cliente;
    RETURN v_cliente;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1. RPC para buscar operadores (bypass RLS - funciona com operador anônimo)
CREATE OR REPLACE FUNCTION public.buscar_operadores_empresa()
RETURNS SETOF public.operadores AS $$
    SELECT * FROM public.operadores
    WHERE empresa_id = get_user_empresa_id()
    ORDER BY created_at ASC;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 1. Policy para operador anônimo criar perfil (login terminal)
DROP POLICY IF EXISTS "Usuários inserem próprio perfil" ON public.perfis;
CREATE POLICY "Usuários inserem próprio perfil" 
ON public.perfis FOR INSERT 
WITH CHECK (id = auth.uid());

-- 2. Adicionar tabelas à publicação Realtime (CRÍTICO para Kanban mobile/desktop sincronizar)
-- ordens_servico e maquinas são essenciais - sem isso o Realtime não funciona!
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ordens_servico;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.maquinas;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.operadores;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.programadores;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Policy de INSERT para operadores (admin cadastra em Configurações)
-- Se der erro "already exists", pode ignorar
DROP POLICY IF EXISTS "Usuários inserem Operadores na sua empresa" ON public.operadores;
CREATE POLICY "Usuários inserem Operadores na sua empresa" 
ON public.operadores FOR INSERT 
WITH CHECK (empresa_id = get_user_empresa_id());
