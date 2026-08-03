# CNC Lean — Módulo Centro de Usinagem

Fork local do **EDM Lean**, adaptado para **máquinas de centro de usinagem (CNC)**. Mesma arquitetura, design e layout; fluxo e módulos ajustados para ferramental, usinagem e inspeção.

## Início rápido — modo estudo (sem Supabase)

```powershell
cd "C:\Users\Usuario\Desktop\Módulo CNC"
npm install
npm run dev
```

Abra **http://localhost:5174** (porta diferente do EDM Lean, que usa 5173).

Na landing page, clique em **Explorar modo estudo (sem cadastro)**. Os dados ficam salvos no navegador (localStorage).

Para restaurar os exemplos: banner amarelo → **Restaurar exemplos**.

---

## Quando for conectar ao Supabase

1. Crie um projeto Supabase separado
2. No `.env`: `VITE_LOCAL_MODE=false` + credenciais
3. Execute, nesta ordem: `supabase_schema.sql`, `supabase_ferramental.sql`, `supabase_cnc_campos.sql` e `supabase_estoque_movimentacoes.sql`

O `supabase_cnc_campos.sql` é **obrigatório**: adiciona as colunas de multi-setup, molde, import CAM e tratamento térmico. Sem ele o Supabase rejeita a criação de O.S. com erro de coluna inexistente.

O `supabase_estoque_movimentacoes.sql` também é **obrigatório**: cria a tabela de entradas/saídas de estoque e a função `movimentar_estoque`. Sem ele a tela de Estoque não consegue dar entrada de material.

## Fluxo Kanban (proposta inicial)

| Coluna | Status no banco | Descrição |
|--------|-----------------|-----------|
| A fazer | `A fazer` | Fila de OPs / peças aguardando |
| Prep. Ferramental | `Prep. Ferramental` | Montagem de ferramentas, offsets, fixture |
| Em Usinagem | `Em Usinagem` | Ciclo automático em execução |
| Inspeção | `Inspeção` | Conferência dimensional / acabamento |
| Concluído | `Concluído` | Peça liberada |

Ajuste os labels em `src/constants/cncProcess.js` conforme mapear o processo real.

## Módulo Ferramental (novo)

- Cadastro de fresas, brocas, inserts, etc.
- Vida útil em horas + alerta
- Registro de **quebra de ferramenta** com máquina e operador
- Histórico de eventos

## Documentação

- `docs/FLUXO_CNC.md` — rascunho do processo para você validar com a operação

## Stack

React 18 · Vite · Zustand · Tailwind · Supabase · Chart.js

---

Baseado no [EDM Lean](https://github.com/michelfioravante-alt/edm-lean).
