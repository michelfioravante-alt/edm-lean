# EDM Lean

SaaS de gestão de produção para **eletroerosão a fio**, com quadro Kanban em tempo real, indicadores (OEE, lead time, refugo, consumo de insumos), estoque, clientes e multi-empresa (multi-tenant).

Repositório **privado** — uso em portfólio. Credenciais e ambiente de produção **não** estão versionados.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| Gráficos | Chart.js / react-chartjs-2 |
| Backend / Auth / DB | Supabase (PostgreSQL, Auth, Realtime, RLS) |
| Deploy | Vercel (SPA com rewrite para `index.html`) |

---

## Funcionalidades principais

- **Kanban** — colunas (A fazer, Set-up, Em corte, Aferição, Concluído), drag-and-drop, pausas, split de O.S., devoluções e acompanhamento.
- **Dashboard (admin)** — KPIs e gráficos de produção, máquinas, operadores, qualidade e insumos.
- **Operadores** — acesso por código da empresa + PIN (validado no servidor via RPC).
- **Estoque, clientes, registros** — cadastros e histórico ligados à empresa logada.
- **Planos** — trial piloto (30 dias) com bloqueio de UI após expiração.
- **Realtime** — atualização do quadro entre dispositivos via Supabase Realtime.

---

## Estrutura do repositório

```
src/              Código da aplicação (pages, components, services, store)
public/           Assets estáticos e PWA manifest
docs/             Documentação auxiliar (ex.: integrações)
supabase_*.sql    Schema e migrations para o SQL Editor do Supabase
.env.example      Variáveis necessárias (copiar para .env local)
vercel.json       Configuração de deploy na Vercel
```

Arquivos **ignorados pelo Git** (veja `.gitignore`): `.env`, `node_modules/`, `dist/`, `.vercel/`, exports locais de webhook n8n.

---

## Rodar localmente

1. **Node.js** 18+ instalado.
2. Clone o repositório e instale dependências:

   ```bash
   npm install
   ```

3. Copie o exemplo de ambiente e preencha com os dados do **Supabase → Project Settings → API**:

   ```bash
   cp .env.example .env
   ```

   Variáveis:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Inicie o dev server:

   ```bash
   npm run dev
   ```

5. Build de produção:

   ```bash
   npm run build
   ```

---

## Supabase

1. Crie um projeto no [Supabase](https://supabase.com).
2. No **SQL Editor**, execute na ordem que fizer sentido para o seu banco:
   - `supabase_schema.sql` (base)
   - `supabase_migration_limite_maquinas.sql` e `supabase_realtime_fix.sql`, se ainda não aplicados
3. Em **Authentication → Providers**, habilite **Anonymous Sign-Ins** (login de terminal operador).
4. Configure **RLS** conforme os scripts — a anon key no frontend é pública por design; a segurança está nas policies.

---

## Deploy (Vercel)

1. Conecte o repositório à Vercel.
2. Defina as mesmas variáveis `VITE_*` no painel do projeto.
3. Após mudanças no código, faça **push** no Git ou **Redeploy** manual para publicar.

---

## Segurança

- **Nunca** commite `.env` ou chaves `service_role`.
- Scripts auxiliares na raiz (`audit_db.js`, etc.) usam `dotenv` apenas na sua máquina.
- A chave **anon** aparece no bundle do site em produção; proteja dados com **RLS** e RPCs no Supabase.

---

## Licença

Código proprietário — uso restrito ao titular do projeto. Entre em contato para licenciamento ou demonstração.
