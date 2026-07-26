# Plano de evolução do produto – contexto e objetivo

Documento para repasse a outra IA: resume o contexto do projeto, o objetivo da evolução e o plano detalhado das mudanças discutidas.

---

## 1. Contexto do projeto

### 1.1 O que é o produto hoje

- **Nome atual:** EDM Lean (pode ser generalizado depois).
- **Tipo:** aplicação web SaaS para gestão visual da produção (Kanban) em oficinas de usinagem.
- **Origem:** protótipo de pós-graduação (Gestão, Qualidade e Engenharia de Processos – PUC-RS), hoje em produção, utilizado por usuários reais.
- **URL:** https://edmlean.com.br
- **Stack:** React (Vite), Tailwind, Zustand, Supabase (Auth + Postgres + Realtime), deploy na Vercel.

### 1.2 Funcionalidades atuais

- **Kanban de ordens de serviço (OS):** fluxo em 5 colunas – A fazer → Set-up → Em Corte → Aferição → Concluído.
- **Cadastros:** clientes, operadores, máquinas, programadores, estoque (itens/insumos).
- **Por OS:** cliente, código da peça, quantidade, prazos, link do desenho, tempos estimados (set-up + corte), prioridade, máquina e operador atribuídos na transição.
- **Pausas:** registro de motivo e período; integração com troca de consumível por máquina (ex.: fio EDM).
- **Histórico de consumíveis:** troca de insumo por máquina, vida útil (baseada em tempo “Em Corte”).
- **Dashboard (admin):** KPIs, gráficos (horas por máquina, produção por operador, lead time, refugo, etc.).
- **Multi-empresa (multi-tenant):** cada empresa com seus dados; auth com confirmação de e-mail; perfis admin e operador.
- **Realtime:** sincronização de OS entre usuários; debounce e otimizações de egress já aplicadas.

### 1.3 O que já foi feito nesta conversa (não repetir)

- Otimizações de egress no Supabase (polling 30s, um fetch ao voltar à aba, debounce no realtime, limit 1000 em `fetchAllAtivas`).
- Timeout de 12s no mobile para evitar loading infinito na inicialização do auth.
- Ajustes de verificação de e-mail (emailRedirectTo, mensagens, fluxo de confirmação).
- Regra na RPC `registrar_conta_inicial` para só tratar 8 caracteres como código de convite quando for alfanumérico maiúsculo (evitar “nome de empresa” virar operador).
- Nenhuma mudança estrutural de “generalização” ou “projetos” foi implementada ainda.

---

## 2. Objetivo da evolução

Transformar o produto de **foco em EDM a fio** para um **sistema mais generalista**, atendendo:

- **Centros de usinagem** e **máquinas convencionais** (não só EDM).
- **Moldes e matrizes:** uma OS = uma “parte” de um projeto maior (molde/matriz); o gerente precisa ver o projeto como um todo e a ligação entre as OS.
- **Separação clara por operador e gerente:** operador vê só “sua máquina”; gerente vê o todo e pode ver Kanban por máquina.
- **Mesma peça em várias máquinas:** rastrear em qual máquina a peça está e quanto tempo levou em cada uma (histórico por máquina; ação “transferir para próxima máquina”).
- **Kanban por máquina para o gerente:** visão por máquina sem poluir a tela (aba por máquina ou um Kanban com linhas por máquina – swimlane).

Tudo isso **em fases**, para não sobrecarregar e permitir validar com clientes entre as etapas.

---

## 3. O que já é genérico no código (manter)

- Fluxo do Kanban (A fazer, Set-up, Em Corte, Aferição, Concluído) – “Em Corte” pode ser renomeado para “Em Usinagem” ou “Processo”.
- Ordem de serviço: cliente, código peça, quantidade, prazos, link desenho, tempos estimados (set-up + processo), máquina, operador.
- Cadastros: máquinas, operadores, programadores, clientes, estoque (genéricos).
- Dashboard: conceito de horas (setup + processo), lead time, refugo – genérico.
- Multi-empresa, auth, roles – genérico.

---

## 4. O que é específico de EDM (ajustar ou esconder)

| Onde | O que está EDM-específico | Ação sugerida |
|------|----------------------------|----------------|
| ConfigSettings.jsx | Título “Máquinas (EDM)” | Trocar para “Máquinas” ou “Equipamentos”. |
| ConfigSettings.jsx | Kanbans automáticos: opção “Alinhamento de Fio” | Trocar para opções genéricas (ex.: Manutenção, Troca de ferramenta, Outros) ou só “Outros” + descrição. |
| Motivos de pausa (se houver “Alinhamento de Fio”) | Opção EDM | Incluir opções genéricas (Troca de ferramenta, Ajuste, Aguardando material, etc.). |
| Labels no app | “Em Corte” / “Corte” | Renomear para “Em Usinagem” / “Processo” (ou “Usinagem”) nas telas; no banco pode manter `emCorte` internamente. |
| CalculadoraTempoModal | Perímetro (mm), passes, rendimento (mm/min) – modelo EDM a fio | Manter para quem usa EDM; para generalista: esconder ou mostrar só quando “tipo EDM” ou substituir por calculadora CNC simples (tempo por peça × quantidade + setup). |
| Login / marca | “Eletroerosão a Fio”, “EDM Lean” | Já combinado em outro contexto: texto genérico (“gestão para chão de fábrica” / “oficinas de usinagem”) onde fizer sentido. |
| Estoque / histórico consumíveis | Textos “vida útil em corte”, “horas de corte” | Para CNC: usar “tempo de máquina” ou “horas de processo” (só rótulos). |

---

## 5. Plano em fases (detalhado)

### Fase 1 – Generalização (baixo esforço)

**Objetivo:** produto apresentável para centro de usinagem e ferramentaria, sem mudar modelo de dados.

- **Texto/UI:**
  - Trocar “Em Corte” → “Em Usinagem” (ou “Processo”) em todos os lugares visíveis ao usuário (Sidebar, Column, Card, Modal, Dashboard, etc.). Manter `emCorte` no código/banco se for mais simples.
  - Trocar “Corte” em labels (tempo estimado, gráficos) → “Usinagem” ou “Processo”.
  - ConfigSettings: “Máquinas (EDM)” → “Máquinas”.
  - Opções de Kanban automático: remover “Alinhamento de Fio”; usar opções genéricas (Manutenção Preditiva/Corretiva, Troca de ferramenta, Outros).
  - Motivos de pausa: incluir opções genéricas; remover ou deixar “Alinhamento de Fio” só se houver tipo de processo EDM no futuro.
- **Calculadora:**
  - Manter CalculadoraTempoModal (fio) para não quebrar quem usa EDM.
  - Opção A: esconder o botão “Calcular Tempo de Corte” em um contexto “genérico” ou mostrar só para “EDM” se houver flag.  
  - Opção B: adicionar uma “Calculadora CNC” simples: tempo por peça (min) × quantidade + tempo de setup (min) → preencher campos de tempo estimado (usinagem/setup) na OS. O programador traz o tempo do NX/CAM e usa só para multiplicar por quantidade.
- **Arquivos principais a tocar:** `ConfigSettings.jsx`, `NovaOSForm.jsx`, `EditOSModal.jsx`, `TransitionModal.jsx`, `Card.jsx`, `Column.jsx`, `MobileNav.jsx`, `PauseModal.jsx` (motivos), componentes do Dashboard (labels dos gráficos), `CalculadoraTempoModal.jsx` e onde ela é chamada. Buscar por “Corte”, “Em Corte”, “corte”, “EDM”, “Fio”.

---

### Fase 2 – Projetos (moldes/matrizes)

**Objetivo:** agrupar várias OS em um “projeto” (molde/matriz) e dar visão por projeto ao gerente.

- **Banco (Supabase):**
  - Nova tabela `projetos`: `id`, `empresa_id`, `nome`, `codigo` (opcional), `cliente` (opcional), `prazo_entrega` (opcional), `created_at`. RLS por `empresa_id`.
  - Em `ordens_servico`: adicionar coluna opcional `projeto_id` (FK para `projetos`, ON DELETE SET NULL).
- **Backend/Services:**
  - Serviço (ex.: `projetosService.js`) para listar, criar, editar, excluir projetos (sempre escopado por `empresa_id`).
- **UI:**
  - Tela ou seção “Projetos”: listar projetos; ao clicar em um projeto, listar as OS desse projeto (com status de cada uma). Pode ser uma página nova acessível pelo menu (admin).
  - No formulário de nova OS e na edição de OS: campo opcional “Projeto” (dropdown com projetos da empresa ou “Novo projeto” que abre um modal rápido).
  - Cards do Kanban podem exibir um indicador do projeto (ex.: badge com nome ou código do projeto) quando `projeto_id` estiver preenchido.
- **Relatório/visão:** na tela do projeto, mostrar resumo (ex.: X de Y partes concluídas, lista de OS com status). Opcional: prazo do projeto e indicador de atraso.

---

### Fase 3 – Visão operador vs gerente e “minha máquina”

**Objetivo:** operador ver só as OS da(s) sua(s) máquina(s); gerente ver tudo; telas iniciais diferentes.

- **Banco:**
  - Definir vínculo operador ↔ máquina. Opção simples: na tabela `operadores` adicionar `maquina_id` (FK para `maquinas`, opcional). Ou: tabela `operador_maquinas` (N:N) se um operador puder operar várias máquinas. Para MVP, uma máquina por operador (`maquina_id` em `operadores`) pode bastar.
  - Quem usa o app como “operador” pode ser o perfil com `funcao = 'operador'` no `perfis`; precisamos saber qual “operador” (linha da tabela operadores) ou qual máquina está ligado a esse usuário. Se hoje o login operador é por “terminal” (PIN + código empresa), o vínculo pode ser: ao fazer login como operador, escolher ou ter configurado “minha máquina”. Ou o perfil do usuário (perfis) ter `maquina_id` opcional para operadores.
- **Lógica:**
  - Se usuário é admin: vê todas as OS (comportamento atual).
  - Se usuário é operador e tem `maquina_id` (ou máquina configurada): filtrar Kanban por `maquina_nome` = nome da máquina vinculada (ou `maquina_id` se normalizar). Comparar com a lista de máquinas para obter o nome a partir do id.
- **Telas iniciais:**
  - Operador: ao abrir o app, primeira tela = Kanban filtrado por “minha máquina” (visão “Meu trabalho”). Pode ser a mesma rota do Kanban com um parâmetro ou estado “filterByMyMachine = true”.
  - Gerente (admin): tela inicial = Kanban completo (todas as OS) ou um dashboard resumo (com link “Ver Kanban completo”). Definir qual é o default (ex.: Kanban completo).
- **UI:** menu/sidebar pode exibir para operador “Meu trabalho” (Kanban filtrado) e para admin “Kanban” (completo) e “Dashboard”. Garantir que a rota ou estado inicial mude conforme o role.

---

### Fase 4 – Mesma peça em várias máquinas (histórico por máquina)

**Objetivo:** registrar em qual máquina a peça está e quanto tempo ficou em cada uma; gerente ver “onde está” e “tempo por máquina”.

- **Banco:**
  - Nova tabela `os_historico_maquinas` (ou nome similar): `id`, `ordem_servico_id` (FK), `empresa_id`, `maquina_id` ou `maquina_nome`, `timestamp_entrada`, `timestamp_saida`, `tempo_setup_minutos`, `tempo_processo_minutos` (ou calcular a partir dos timestamps). RLS por `empresa_id`.
  - Opcional: em `ordens_servico` manter `maquina_nome` (máquina atual); o histórico guarda as máquinas anteriores.
- **Fluxo:**
  - Quando o operador “sai” da máquina atual (ex.: concluiu a usinagem naquela máquina e vai passar para outra), disparar ação “Transferir para próxima máquina”:
    - Gravar na tabela de histórico: máquina atual, `timestamp_entrada` (já existente na OS ou no momento da transição para “Em Corte”), `timestamp_saida` = agora, tempos de setup e processo (podem vir de `tempos_fases` da OS).
    - Atualizar a OS: definir próxima máquina (`maquina_nome`), voltar status para “Set-up” (ou “A fazer”), zerar ou ajustar timestamps da nova etapa.
  - Se houver roteiro (lista de máquinas na OS), a “próxima máquina” pode ser sugerida; senão, o operador escolhe no dropdown.
- **UI:**
  - Botão ou ação no card/modal “Transferir para próxima máquina” (visível quando a OS está em “Em Usinagem” ou “Aferição”, por exemplo). Abre um pequeno modal: selecionar próxima máquina, confirmar.
  - Na tela de detalhe da OS (ou em relatório): exibir tabela “Tempo por máquina” com base em `os_historico_maquinas`.
- **Roteiro (opcional, fase 4b):** campo na OS ou tabela `os_roteiro` com sequência de máquinas (ordem, maquina_id). Assim a UI pode sugerir “Próxima: Fresa 02” e o gerente vê “Etapa 2/3”.

---

### Fase 5 – Kanban por máquina (visão gerente)

**Objetivo:** gerente poder ver o Kanban filtrado por máquina, sem poluir a tela.

- **Opção A – Aba/dropdown por máquina:**
  - Na visão “Kanban”, se usuário for admin, exibir um seletor “Ver por máquina” com dropdown (ou abas) listando as máquinas. Ao selecionar uma máquina, o Kanban exibido usa apenas as OS em que `maquina_nome` = máquina selecionada. Mesmas colunas (A fazer, Set-up, Em Usinagem, Aferição, Concluído).
- **Opção B – Swimlane (uma linha por máquina):**
  - Um único Kanban com as mesmas colunas, mas as linhas agrupadas por máquina. Cada linha = uma máquina; dentro de cada célula (coluna), os cards daquela máquina. Assim o gerente vê todas as máquinas numa tela, com menos poluição do que N Kanbans completos lado a lado.
- **Recomendação discutida:** evitar vários Kanbans completos na mesma tela; preferir aba (uma máquina por vez) ou swimlane (uma grade com linhas = máquinas).
- **Implementação:** reutilizar o mesmo estado do Kanban (ordens_servico já carregadas); no front, filtrar por `maquina_nome` antes de distribuir nos buckets das colunas. Para swimlane, agrupar por máquina e depois por status.

---

## 6. Calculadora CNC (complementar à de fio)

- **Objetivo:** para centro de usinagem, o tempo costuma vir do CAM (ex.: NX). O app não calcula o tempo de usinagem; apenas ajuda a preencher “tempo total” a partir de tempo por peça e quantidade.
- **Campos sugeridos:** tempo por peça (min), quantidade, tempo de setup (min) opcional. Fórmula: `(tempo_por_peça * quantidade) + setup` → converter para horas e minutos e preencher os campos de tempo estimado da OS (usinagem e, se aplicável, setup).
- **Onde:** mesmo modal ou um segundo botão no formulário de nova OS (ex.: “Calcular tempo (CNC)” ao lado do “Calcular tempo (Fio)” para quem tem os dois).

---

## 7. Resumo da ordem de execução sugerida

1. **Fase 1 – Generalização:** textos, rótulos, opções genéricas, calculadora CNC simples (e eventualmente esconder calculadora de fio em modo “genérico” se houver).
2. **Fase 2 – Projetos:** tabela `projetos`, `projeto_id` na OS, tela de projetos e lista de OS por projeto, campo Projeto no formulário da OS.
3. **Fase 3 – Operador vs gerente:** vínculo operador–máquina, filtro “minha máquina” no Kanban para operador, tela inicial diferente por role.
4. **Fase 4 – Histórico por máquina:** tabela de histórico, ação “Transferir para próxima máquina”, relatório/tela “tempo por máquina”.
5. **Fase 5 – Kanban por máquina:** aba ou swimlane para o gerente.

---

## 8. Observações técnicas rápidas

- **Banco:** Supabase (Postgres). Todas as tabelas com RLS por `empresa_id`. Função `get_user_empresa_id()` já existe.
- **Front:** estado global do Kanban em `useAppStore.js`; serviços em `src/services/`; telas em `src/pages/`, componentes em `src/components/`.
- **Nomenclatura interna:** no código/banco pode permanecer `emCorte`; a mudança é de rótulos na UI para “Usinagem”/“Processo”.
- **Performance:** filtros por `projeto_id` e `maquina_nome` são simples; histórico por máquina cresce com uso, mas é padrão (índices por `ordem_servico_id` e `empresa_id`).

---

## 9. Objetivo em uma frase

Evoluir o EDM Lean de um sistema focado em EDM a fio para um **sistema generalista de Kanban de produção para oficinas de usinagem** (convencional, CNC, centros de usinagem, EDM), com **projetos (moldes/matrizes)**, **visão operador (minha máquina) vs gerente (visão do todo)**, **rastreio da mesma peça em várias máquinas** e **visão do Kanban por máquina para o gerente**, em fases, sem quebrar o que já funciona.

---

## 10. Como as duas IAs vão programar juntas

Para evitar conflito e duplicação, seguir este combinado:

### 10.1 Regra de ouro

- **Só uma IA mexe em um arquivo por vez.** Não dividir o mesmo arquivo entre as duas ao mesmo tempo.
- **Uma fase (ou um bloco de tarefas) por IA por vez.** Quando uma terminar, o usuário passa o contexto para a outra.

### 10.2 Formas de dividir o trabalho

**Opção A – Por fase (recomendada)**  
- **IA 1 (ex.: Cursor):** Fase 1 (generalização). Ao terminar, escreve um **“Handoff”** (ver abaixo).  
- **IA 2:** Lê o plano + handoff, faz Fase 2 (projetos). Depois escreve handoff.  
- **IA 1:** Retoma com Fase 3 (operador vs gerente), e assim por diante.  
- O usuário alterna entre as duas conforme a fase.

**Opção B – Por camada na mesma fase**  
- **IA 1:** Banco (SQL no Supabase) + serviços (ex.: `projetosService.js`).  
- **IA 2:** UI (páginas, componentes, formulários) que consomem esse serviço.  
- Combinar antes: “Fase 2: eu faço tabela + RLS + projetosService; você faz a tela de projetos e o campo no formulário da OS.”

**Opção C – Por domínio**  
- **IA 1:** Tudo que for “texto e opções” (labels, dropdowns, motivos de pausa, ConfigSettings).  
- **IA 2:** Tudo que for “nova funcionalidade” (projetos, histórico por máquina, etc.).  
- Útil quando as duas estão ativas no mesmo período, mas cada uma em arquivos diferentes.

### 10.3 Handoff (passagem de bastão)

Quando uma IA terminar um bloco de trabalho, ela deve deixar um **resumo curto** (no chat ou num arquivo `HANDOFF.md` na raiz do projeto):

- **O que foi feito:** ex.: “Fase 1: trocados todos os rótulos Corte → Usinagem; removido Alinhamento de Fio; adicionada Calculadora CNC em NovaOSForm.”
- **Arquivos alterados:** lista de caminhos (ex.: `src/pages/ConfigSettings.jsx`, `src/components/kanban/NovaOSForm.jsx`).
- **O que a próxima IA deve saber:** ex.: “O campo de tempo na OS continua sendo `tempo_estimado_corte_*` no banco; só a label na tela mudou para ‘Usinagem’.”
- **Se aplicável:** “Nenhum SQL foi rodado” ou “Foi criada a tabela X; a próxima fase pode usar.”

O usuário **cola esse handoff** (ou o conteúdo de `HANDOFF.md`) na conversa da outra IA junto com o plano, para ela continuar de onde parou.

### 10.4 Arquivo HANDOFF.md (opcional)

Na raiz do projeto pode existir um arquivo **`HANDOFF.md`** que as duas IAs atualizam ao terminar uma etapa:

```markdown
# Handoff – última atualização

**Data:** [quando terminou]
**Quem fez:** [Fase 1 / IA Cursor]
**Resumo:** [2–3 linhas]
**Arquivos alterados:** [lista]
**Próximo passo:** Fase 2 – Projetos (tabela + projeto_id + tela).
```

A IA que for continuar lê esse arquivo primeiro, além do `PLANO_EVOLUCAO_PRODUTO.md`.

### 10.5 O que você (usuário) faz

1. **Definir quem faz o quê** – ex.: “Cursor, você faz Fase 1. Outra IA, você faz Fase 2 depois que eu mandar o handoff.”
2. **Passar o plano** – ambas têm acesso ao `PLANO_EVOLUCAO_PRODUTO.md` (ou ao texto copiado).
3. **Passar o handoff** – depois de cada etapa, copiar o resumo da IA que terminou e colar na conversa da que vai continuar.
4. **Evitar que as duas mexam no mesmo arquivo ao mesmo tempo** – se precisar, diga: “não altere o arquivo X, a outra IA está mexendo”.

Assim as duas “programam juntas” de forma ordenada, sem conflito e sem retrabalho.

---

*Documento gerado com base na conversa do usuário com a IA. Projeto: EDM Lean (edmlean.com.br). Stack: React (Vite), Zustand, Supabase, Vercel.*
