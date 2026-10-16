# EDM Lean — Kanban de chão de fábrica para ferramentaria e usinagem

> Software de shop floor para equipes pequenas: kanban por setor, roteiro da peça, folha de processo, horas máquina e estoque de ferramenta — sem o peso de um ERP.

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://edmlean.com.br)
[![Supabase](https://img.shields.io/badge/Database-Supabase-emerald?logo=supabase)](https://supabase.com)
[![React 18](https://img.shields.io/badge/Frontend-React%2018-cyan?logo=react)](https://react.dev)

---

## Produção

- **Domínio**: [https://edmlean.com.br](https://edmlean.com.br)
- **Repositório**: [michelfioravante-alt/edm-lean](https://github.com/michelfioravante-alt/edm-lean)

O deploy na Vercel é automático a cada push na branch `main`.

---

## Principais recursos

### 1. Multi-setor produtivo
- **Centro de Usinagem CNC**: kanban, tempos e horas máquina.
- **Eletroerosão a Fio (EDM)**: fluxo WEDM, consumo de fio e acabamento.
- **Visão do gestor**: consolidado da fábrica (carteira, home, indicadores).

Indicadores usam **eficiência CAM** (previsto ÷ horas reais de setup + corte), FPY, lead time e WIP — **não** OEE clássico (disponibilidade de turno), porque turno, hora extra e máquina ligada à noite sem operador distorcem esse cálculo nestas empresas.

### 2. PIN Master e acesso por setor
- Visão de gestor, indicadores e parâmetros protegidos por **PIN Master de 4 dígitos** (gate de tela, não cofre corporativo).
- Programadores ficam no setor de atuação; terminal de chão entra via `/join/{código}` + PIN.

### 3. Aba Moldes — Cadastro manual e fila do gestor
- Moldes agrupam peças por `os_grupo_id` (kanbans pai/filho).
- Cadastro **manual** das peças e do roteiro em Nova O.S. → Molde.
- Peças entram na **fila do molde** (`em_fila`) — só aparecem no Kanban do setor após o gestor **liberar** (individual ou em lote).

### 4. Horas máquina — Referência para orçamentos
- Foco em **horas máquina reais** (setup, corte, aferição, pausas), não em substituir o preço comercial.
- **Relatório ao concluir peça**: breakdown de tempos, eficiência CAM e export CSV.
- **Relatório de molde**: totais, barras por setor e tabela por peça na aba Moldes.
- **Referência interna em R$** (opcional): horas × taxa configurada por setor.

### 5. Histórico e repetir peça
- **Registros**: busca no banco por peça, cliente ou molde — inclui execuções fora do kanban ativo.
- **Repetir**: abre Nova O.S. pré-preenchida com a última execução.
- Cada repetição gera um **kanban novo**, com `parent_id` ligado à O.S. de origem.

### 6. Custo hora por setor
- `custoHoraCnc` / `custoHoraEdm` (e demais setores) para apoio interno.
- Valor gerado em ciclo, setup + trabalho, refugo e tempo morto / pausas.

### 7. Folha e tempos no cartão
- Anexo de print/imagem no cartão e na folha A4.
- Tempos previstos na abertura ou na programação; calculadora WEDM opcional para eletrofio.

### 8. Estoque e vida útil de ferramental
- Vida útil em horas (fresas, brocas, fios).
- Alertas de mínimo, quebras/trocas vinculadas à máquina e ao operador.

### 9. Kanban — concluídos recentes
- No quadro, **Concluído** mostra só as últimas ~48 h (máx. 20 cartões).
- Histórico antigo fica no banco e aparece em **Registros** / busca — não some.

---

## Tecnologias

- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons, Chart.js
- **Estado**: Zustand
- **Backend & Realtime**: Supabase (PostgreSQL, RLS, Auth, Realtime)
- **Hospedagem**: Vercel (deploy automático via GitHub)

---

## Como rodar localmente

```bash
git clone https://github.com/michelfioravante-alt/edm-lean.git
cd edm-lean
npm install
# Copiar .env.example → .env (URL e chave anon do Supabase)
npm run dev
```

Abra **http://localhost:5173** (ou a porta do terminal).

```bash
npm run build
```

---

## Banco de dados (Supabase)

Execute os scripts de [`supabase/sql/`](supabase/sql/) no **SQL Editor**, **na ordem** (`01_schema.sql` → `17_regras_no_banco.sql`). Todos são idempotentes depois do `01`.

### Checklist de cliente novo (onboarding)

1. Projeto Supabase com scripts `01`→`17` aplicados.
2. Auth: e-mail/senha; se usar terminal de chão, habilitar **Anonymous sign-ins**.
3. Em **Authentication → Providers → Email**: senha mínima **8+**; se o plano permitir, ligar **Leaked password protection** (HaveIBeenPwned — Pro).
4. Em **Authentication → Rate Limits**: manter limites padrão (ou mais apertados) para login/recover.
5. Criar conta gestor; confirmar e-mail se estiver ligado.
6. Trocar PIN padrão `1234`; gerar link `/join/{código}`.
7. Smoke test: criar O.S. → mover → pausar → concluir → abrir Registros.

---

## Fluxo resumido — Molde → Produção

```text
Nova O.S. (molde/peças manuais) → Fila do molde (em_fila) → Gestor libera → Kanban do setor
       → Setup → Corte → Aferição → Concluído → Relatório de horas
```

Peças que voltam meses depois: **Registros** → **Repetir** → revisar Nova O.S. → novo kanban.

---

## Licença

Desenvolvido para **EDM Lean / Módulo CNC** · Todos os direitos reservados © 2026.
