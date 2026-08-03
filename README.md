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

---

## 🔥 Principais Recursos da Aplicação

### 🌀 1. Arquitetura Multi-Setor Produtivo
- **`🌀 Centro de Usinagem CNC`**: Kanban, OEE e cálculo de horas direcionados a centros de usinagem de 3 e 5 eixos.
- **`⚡ Eletroerosão a Fio (EDM)`**: Gestão especializada de WEDM, com controle de consumo de fio e acabamento.
- **`🏭 Visão Geral da Fábrica (Diretoria)`**: Visão consolidada de todas as células de produção e ferramentaria.

### 👑 2. Segurança Executiva & Proteção por PIN Master
- Acesso à Visão de Gerente, Indicadores Financeiros da Planta e Parâmetros Globais protegido por **PIN Master de 4 dígitos** configurável em tempo real.
- Bloqueio automático de programadores ao seu setor de atuação (`🔒 KPIs Exclusivos`).

### 💰 3. Motor de Cálculo de Custos Hora por Setor
- Avaliação financeira dinâmica por setor produtivo:
  - `custoHoraCnc`: Custo hora específico para Usinagem CNC (Padrão: R$ 80/h).
  - `custoHoraEdm`: Custo hora específico para Eletroerosão a Fio (Padrão: R$ 120/h).
- Apuração do valor gerado em ciclo, valor total de setup + trabalho, perdas por refugo e custo de tempo morto / pausas.

### 📄 4. Importador Automático de Folhas de Processo CAM (Siemens NX / ShopDocs)
- Leitura automática de HTML de folhas de processo CAM com extração automatizada de tempos de setup, tempos de corte, ferramentas necessárias, códigos de programas G e descritivo da peça.

### 📦 5. Controle de Estoque & Vida Útil de Ferramental
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
- **Hospedagem & CI/CD**: Vercel

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

Abra **http://localhost:5173** no seu navegador. O modo estudo armazena os dados localmente no `localStorage` do navegador para testes sem necessidade de Supabase.

---

## 🗄️ Banco de Dados & Migrações Supabase

Para conectar a uma instância própria do Supabase, execute o script SQL unificado no **SQL Editor** do seu painel Supabase:

- [`supabase_unified_schema.sql`](supabase_unified_schema.sql) — Adiciona o suporte multi-setor (`CNC`, `EDM_FIO`), tabela de programadores, PIN Master e custos hora diferenciados.

---

## 📄 Licença & Créditos

Desenvolvido para **EDM Lean / Módulo CNC** · Todos os direitos reservados © 2026.
