<div align="center">

# ⚙️ EDM Lean — Plataforma SaaS de Gestão de Produção

**Solução SaaS para digitalização e controle de operações de usinagem de precisão com cálculo automático de OEE e metodologia Lean.**

[![Demo](https://img.shields.io/badge/🔗_Demo-edmlean.com.br-2E7D32?style=for-the-badge)](https://www.edmlean.com.br/)

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=000)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## 📌 Contexto e Problema

Operações de usinagem de precisão — em especial as que utilizam máquinas de Eletroerosão a Fio (Wire EDM) — ainda controlam a produção por meio de registros em papel, quadros brancos ou planilhas. Esse modelo gera **opacidade operacional**: paradas não rastreadas, ausência de métricas de eficiência e perda de informação na troca de turnos.

Com base em mapeamento de processos AS-IS/TO-BE via BPMN (Bizagi), este projeto digitalizou o fluxo operacional de uma ferramentaria real, consolidando as práticas de Lean Manufacturing em uma plataforma acessível via navegador.

---

## 💡 Solução Desenvolvida

| Funcionalidade | Descrição |
|:---------------|:----------|
| **Kanban de Ordens de Serviço** | Visão visual do fluxo produtivo: Fila → Preparação → Em Corte → Inspeção → Concluído |
| **Cálculo de OEE** | Disponibilidade × Performance × Qualidade calculados automaticamente por máquina |
| **Registro de Paradas (Sistema Andon)** | Rastreamento de setups, paradas não planejadas e tempos não produtivos com motivo obrigatório |
| **Gestão Multi-tenant** | Organizações isoladas com controle de acesso por convite de e-mail ou domínio |
| **Segurança de Dados** | Row Level Security (RLS) nativo do PostgreSQL garantindo isolamento total entre tenants |
| **Dados em Tempo Real** | Atualizações via Supabase Realtime Websockets — sem necessidade de recarregamento de página |

---

## 📈 Resultados Operacionais Comprovados

Após implementação e validação em ciclo produtivo real de Eletroerosão a Fio (WEDM):

| Indicador | Antes | Depois | Variação |
|:----------|:------|:-------|:---------|
| **OEE (Eficácia Geral do Equipamento)** | 48% | 61% | **↑ 27,1%** |
| **Lead Time do Ciclo Produtivo** | Linha de base | -25% | **↓ 25%** |
| **Índice de Atrasos na Entrega** | Linha de base | -77,1% | **↓ 77,1%** |
| **Tempo de Parada por Falta de Insumos** | Linha de base | -87,5% | **↓ 87,5%** |

---

## 🏗️ Arquitetura Técnica

**Frontend:** React 18 com Vite e TypeScript. Gestão de estado global com Zustand. Interface construída com Tailwind CSS.

**Backend & Dados:** Supabase (PostgreSQL) com Row Level Security (RLS) para isolamento de dados entre organizações. Supabase Realtime Websockets para sincronização instantânea entre dispositivos.

**Modelo de Negócio:** Arquitetura Multi-tenant, permitindo que múiltiplas empresas utilizem a plataforma com dados completamente isolados.

**Infraestrutura:** Deploy via Vercel com domínio próprio (edmlean.com.br).

---

## 🛠️ Stack Completa

| Camada | Tecnologia |
|:-------|:-----------|
| Framework | React 18 + Vite |
| Linguagem | TypeScript |
| Estado Global | Zustand |
| Estilização | Tailwind CSS |
| Backend / Banco | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| Deploy | Vercel (domínio próprio) |

---

<div align="center">

**Michel Fioravante** — Especialista em Automação e Processos

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/michel-fioravante/)
[![GitHub](https://img.shields.io/badge/Portfólio-GitHub-000?style=flat-square&logo=github&logoColor=white)](https://github.com/michelfioravante-alt)

</div>
