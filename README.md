# ⚡ EDM Lean — Sistema MES, OEE e Kanban para Ferramentarias & Usinagem

> **Plataforma SaaS Integrada de Gestão Industrial (MES) para Eletroerosão a Fio (WEDM) e Centros de Usinagem CNC.**

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://edmlean.com.br)
[![Supabase](https://img.shields.io/badge/Database-Supabase-emerald?logo=supabase)](https://supabase.com)
[![React 18](https://img.shields.io/badge/Frontend-React%2018-cyan?logo=react)](https://react.dev)
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-100%25%20PASS-brightgreen?logo=puppeteer)](scripts/testar-e2e.mjs)

---

## 🌐 Produção & Demonstração Live

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

### 🧩 3. Aba Moldes — Importação ZW3D / CSV e Fila do Gestor
- **1 folha PDF = 1 peça = 1 kanban**; moldes agrupam peças por `os_grupo_id`.
- **Três modos de importação**: Folhas PDF · Planilha CSV · CSV + PDFs.
- **CSV como fonte confiável** (lista oficial da engenharia); PDF como desenho/folha de processo.
- Peças importadas entram na **fila do molde** (`em_fila`) — só aparecem no Kanban do setor após o gestor **liberar** (individual ou em lote, com confirmação).
- Modelo de planilha: [`public/modelo-importacao-molde.csv`](public/modelo-importacao-molde.csv).

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

### 📄 7. Importador de Folhas de Processo CAM
- **Siemens NX / ShopDocs**: leitura de HTML com extração de tempos, ferramentas e programas G.
- **ZW3D**: parser de PDF (Plano A — revisão manual sempre possível) + import via CSV estruturado.

### 📦 8. Controle de Estoque & Vida Útil de Ferramental
- Registro e controle de vida útil em horas de ferramentas de corte (fresas, brocas, fios).
- Alerta visual de consumo mínimo e registro de quebras/trocas de ferramentas vinculadas à máquina e ao operador.

---

## 🧪 Suíte de Testes End-to-End (E2E)

A aplicação conta com uma suíte de testes E2E automatizados desenvolvida com **Puppeteer**:

- **Testes Desktop (1440px)**: `npm run testar-e2e` (8/8 Passados — 100%)
- **Testes Mobile (390px Touch)**: `npm run testar-e2e:mobile` (10/10 Passados — 100%)

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

# 3. Iniciar servidor de desenvolvimento (Modo Estudo / Local)
npm run dev
```

Abra **http://localhost:5173** (ou a porta indicada no terminal) no navegador. O modo estudo armazena os dados localmente no `localStorage` do navegador para testes sem necessidade de Supabase.

```bash
# Build de produção (mesmo comando usado pela Vercel)
npm run build
```

---

## 🗄️ Banco de Dados & Migrações Supabase

Para conectar a uma instância própria do Supabase, execute o script SQL unificado no **SQL Editor** do seu painel Supabase:

- [`supabase_unified_schema.sql`](supabase_unified_schema.sql) — Multi-setor (`CNC`, `EDM_FIO`), programadores, PIN Master, custos hora e campo `em_fila` para fila de moldes.

---

## 📋 Fluxo resumido — Molde → Produção

```text
Import (CSV/PDF) → Fila do molde (em_fila) → Gestor libera → Kanban do setor
       → Setup → Corte → Aferição → Concluído → Relatório de horas
```

Peças que retornam meses depois: buscar em **Registros** → **Repetir** → revisar Nova O.S. → novo kanban.

---

## 📄 Licença & Créditos

Desenvolvido para **EDM Lean / Módulo CNC** · Todos os direitos reservados © 2026.
