-- O.S. mãe + kanbans por setor (programação só no A fazer)
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS programado BOOLEAN;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS valor_orcado NUMERIC;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS os_grupo_id UUID;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS roteiro_ordem INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_ordens_servico_grupo ON ordens_servico (empresa_id, os_grupo_id);

COMMENT ON COLUMN ordens_servico.programado IS 'false = criado pelo gestor, aguarda CAM no A fazer do setor';
COMMENT ON COLUMN ordens_servico.os_grupo_id IS 'Agrupa kanbans da mesma O.S. (molde / projeto)';
COMMENT ON COLUMN ordens_servico.valor_orcado IS 'Valor orçado da O.S. mãe, replicado nos kanbans do grupo';
