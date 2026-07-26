-- ========================================================
-- EDM LEAN - LIMITE DE MÁQUINAS POR PLANO
-- Cole o código abaixo no SQL Editor do Supabase e clique em Run.
-- ========================================================
-- limite_maquinas: máximo de máquinas permitidas por empresa.
-- 999 = ilimitado (piloto). 2, 3, 4... = limite do plano pago.
--
-- COMO DEFINIR O LIMITE PARA UM CLIENTE PAGO:
-- 1. Vá em Table Editor → configuracoes_empresa
-- 2. Encontre a linha da empresa (empresa_id)
-- 3. Edite limite_maquinas: 2 (até 2 máq), 3, 4, 5...
-- ========================================================

do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='configuracoes_empresa' and column_name='limite_maquinas') then
        alter table public.configuracoes_empresa add column limite_maquinas integer default 999;
        comment on column public.configuracoes_empresa.limite_maquinas is 'Máx máquinas. 999=ilimitado. 2,3,4...=plano pago.';
    end if;
end $$;

update public.configuracoes_empresa set limite_maquinas = 999 where limite_maquinas is null;

-- ========================================================
-- TRIGGER: Bloqueia INSERT em maquinas quando limite atingido
-- Garante validação no backend mesmo se alguém tentar burlar o front.
-- ========================================================

create or replace function public.check_limite_maquinas()
returns trigger as $$
declare
    v_limite int;
    v_count int;
begin
    select coalesce(limite_maquinas, 999) into v_limite
    from public.configuracoes_empresa
    where empresa_id = NEW.empresa_id;
    v_limite := coalesce(v_limite, 999);

    select count(*) into v_count from public.maquinas where empresa_id = NEW.empresa_id;

    if v_count >= v_limite then
        raise exception 'Limite do plano atingido (% máquinas). Entre em contato para adicionar mais.', v_limite;
    end if;
    return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_check_limite_maquinas on public.maquinas;
create trigger trg_check_limite_maquinas
    before insert on public.maquinas
    for each row execute function public.check_limite_maquinas();
