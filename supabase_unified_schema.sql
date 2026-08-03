-- ====================================================================
-- MIGRACAO UNIFICADA MULTI-SETOR (EDM LEAN + CNC LEAN)
-- Adiciona suporte a isolamento por setor produtivo (EDM_FIO, CNC, etc)
-- ====================================================================

-- 1. Adicionar coluna 'setor' na tabela de maquinas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maquinas' AND column_name='setor') THEN
        ALTER TABLE maquinas ADD COLUMN setor TEXT DEFAULT 'CNC';
    END IF;
END $$;

-- 2. Adicionar coluna 'setor' na tabela de ordens_servico
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='setor') THEN
        ALTER TABLE ordens_servico ADD COLUMN setor TEXT DEFAULT 'CNC';
    END IF;
END $$;

-- 3. Adicionar coluna 'setor' na tabela de operadores
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operadores' AND column_name='setor') THEN
        ALTER TABLE operadores ADD COLUMN setor TEXT DEFAULT 'TODOS';
    END IF;
END $$;

-- 4. Adicionar coluna 'setor' na tabela de estoque_itens
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='estoque_itens' AND column_name='setor') THEN
        ALTER TABLE estoque_itens ADD COLUMN setor TEXT DEFAULT 'TODOS';
    END IF;
END $$;

-- 5. Adicionar coluna 'setor' na tabela de programadores
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programadores' AND column_name='setor') THEN
        ALTER TABLE programadores ADD COLUMN setor TEXT DEFAULT 'CNC';
    END IF;
END $$;

-- 6. Adicionar coluna 'setor_padrao' no perfil do usuario
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfis' AND column_name='setor_padrao') THEN
        ALTER TABLE perfis ADD COLUMN setor_padrao TEXT DEFAULT 'CNC';
    END IF;
END $$;


-- 6. Índices de busca por setor para otimizar queries
CREATE INDEX IF NOT EXISTS idx_ordens_servico_setor ON ordens_servico (empresa_id, setor, status);
CREATE INDEX IF NOT EXISTS idx_maquinas_setor ON maquinas (empresa_id, setor);
CREATE INDEX IF NOT EXISTS idx_operadores_setor ON operadores (empresa_id, setor);
CREATE INDEX IF NOT EXISTS idx_estoque_itens_setor ON estoque_itens (empresa_id, setor);

COMMENT ON COLUMN ordens_servico.setor IS 'Setor produtivo responsável por esta O.S. (ex: CNC, EDM_FIO)';
COMMENT ON COLUMN maquinas.setor IS 'Setor produtivo ao qual esta maquina pertence (ex: CNC, EDM_FIO)';
COMMENT ON COLUMN operadores.setor IS 'Setor produtivo do operador (ex: CNC, EDM_FIO, TODOS)';
COMMENT ON COLUMN estoque_itens.setor IS 'Setor produtivo do insumo/ferramenta (ex: CNC, EDM_FIO, TODOS)';
