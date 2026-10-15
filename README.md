# ⚡ EDM Lean — Sistema MES, OEE e Kanban para Ferramentarias & Usinagem

> **Plataforma SaaS Integrada de Gestão Industrial (MES) para Eletroerosão a Fio (WEDM) e Centros de Usinagem CNC.**

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://edmlean.com.br)
[![Supabase](https://img.shields.io/badge/Database-Supabase-emerald?logo=supabase)](https://supabase.com)
[![React 18](https://img.shields.io/badge/Frontend-React%2018-cyan?logo=react)](https://react.dev)

---

## 🌐 Produção

- **Domínio Oficial**: [https://edmlean.com.br](https://edmlean.com.br)
- **Repositório GitHub**: [michelfioravante-alt/edm-lean](https://github.com/michelfioravante-alt/edm-lean)

O deploy na Vercel é automático a cada push na branch `main`.

---

## 🔥 Principais Recursos da Aplicação

### 🌀 1. Arquitetura Multi-Setor Produtivo
- **`🌀 Centro de Usinagem CNC`**: Kanban, OEE e cálculo de horas direcionados a centros de usinagem.
- **`⚡ Eletroerosão a Fio (EDM)`**: Gestão especializada de WEDM, com controle de consumo de fio e acabamento.
- **`🏭 Visão Geral da Fábrica (Diretoria)`**: Visão consolidada de todas as células de produção e ferramentaria.

### 👑 2. Segurança Executiva & Proteção por PIN Master
- Acesso à Visão de Gestor, Indicadores Financeiros da Planta e Parâmetros Globais protegido por **PIN Master de 4 dígitos** configurável em tempo real.
- Bloqueio automático de programadores ao seu setor de atuação (`🔒 KPIs Exclusivos`).

### 🧩 3. Aba Moldes — Cadastro manual e fila do gestor
- Moldes agrupam peças por `os_grupo_id` (kanbans pai/filho).
- Cadastro **manual** das peças e do roteiro em Nova O.S. → Molde.
- Peças entram na **fila do molde** (`em_fila`) — só aparecem no Kanban do setor após o gestor **liberar** (individual ou em lote).

### ⏱️ 4. Horas Máquina — Referência para Orçamentos
- Foco em **horas máquina reais** (setup, corte, aferição, pausas), não em substituir o preço comercial.
- **Relatório ao concluir peça**: modal automático no Kanban com breakdown de tempos, eficiência CAM e export CSV.
- **Relatório de molde**: totais, barras por setor e tabela por peça na aba Moldes.
- **Referência interna em R$** (opcional): horas × taxa configurada por setor — apenas apoio interno.

### 🔁 5. Histórico & Repetir Peça
- **Registros**: busca no banco por peça, cliente ou molde — inclui execuções fora do kanban ativo (ex.: concluídas há meses).
- Botão **Repetir**: abre Nova O.S. pré-preenchida com dados e tempos da última execução.
- **Nova O.S.**: ao digitar o código, sugere execuções anteriores e permite copiar os dados com um clique.
- Cada repetição gera um **kanban novo** independente, com `parent_id` ligado à O.S. de origem.

### 💰 6. Motor de Cálculo de Custos Hora por Setor
- Avaliação financeira dinâmica por setor produtivo:
  - `custoHoraCnc`: Custo hora específico para Usinagem CNC (Padrão: R$ 80/h).
  - `custoHoraEdm`: Custo hora específico para Eletroerosão a Fio (Padrão: R$ 120/h).
- Apuração do valor gerado em ciclo, valor total de setup + trabalho, perdas por refugo e custo de tempo morto / pausas.

### 📄 7. Folha e tempos no cartão
- Anexo de print/imagem da peça no cartão e na folha A4.
- Tempos previstos (setup/corte) digitados na abertura ou na programação; calculadora WEDM opcional para eletrofio.

### 📦 8. Controle de Estoque & Vida Útil de Ferramental
- Registro e controle de vida útil em horas de ferramentas de corte (fresas, brocas, fios).
- Alerta visual de consumo mínimo e registro de quebras/trocas de ferramentas vinculadas à máquina e ao operador.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons, Chart.js, React-ChartJS-2
- **Gerenciamento de Estado**: Zustand
- **Backend & Realtime**: Supabase (PostgreSQL 17, Row Level Security, Auth & Realtime Subscriptions)
- **Hospedagem & CI/CD**: Vercel (deploy automático via GitHub)

---

## 🚀 Como Rodar Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/michelfioravante-alt/edm-lean.git
cd edm-lean

# 2. Instalar dependências
npm install

# 3. Copiar .env.example para .env e preencher a URL e a chave anon do Supabase

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

Abra **http://localhost:5173** (ou a porta indicada no terminal) no navegador.

```bash
# Build de produção (mesmo comando usado pela Vercel)
npm run build
```

---

## 🗄️ Banco de Dados & Migrações Supabase

Para conectar a uma instância própria do Supabase, execute os scripts de [`supabase/sql/`](supabase/sql/) no **SQL Editor** do painel, **na ordem numérica** (`01_schema.sql` → `15_relogio_servidor.sql`). Todos são idempotentes depois do `01`.

---

## 📋 Fluxo resumido — Molde → Produção

```text
Nova O.S. (molde/peças manuais) → Fila do molde (em_fila) → Gestor libera → Kanban do setor
       → Setup → Corte → Aferição → Concluído → Relatório de horas
```

Peças que retornam meses depois: buscar em **Registros** → **Repetir** → revisar Nova O.S. → novo kanban.

---

## 📄 Licença & Créditos

Desenvolvido para **EDM Lean / Módulo CNC** · Todos os direitos reservados © 2026.
