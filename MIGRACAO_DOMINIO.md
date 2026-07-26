# Guia Detalhado: Migrar EDM Lean para Domínio no Registro.br

Este guia explica passo a passo como colocar o app no seu domínio registrado no **Registro.br** (ex: `edmlean.com.br`, `minhaempresa.com.br`).

---

## Visão geral do processo

1. **Vercel** — Adicionar o domínio e obter as instruções de DNS
2. **Registro.br** — Configurar os registros DNS (A e CNAME)
3. **Supabase** — Configurar as URLs de autenticação
4. **Testar** — Verificar se tudo funciona

**Tempo estimado:** 30–60 minutos (mais 24–48h para propagação do DNS)

---

# PARTE 1 — Vercel

## Passo 1.1: Acessar o projeto

1. Abra o navegador e acesse **[vercel.com](https://vercel.com)**
2. Faça login na sua conta
3. Clique no projeto **edm-lean** (ou o nome que você deu ao projeto)

> **Se o projeto ainda não estiver na Vercel:**  
> Conecte o repositório Git (GitHub/GitLab/Bitbucket) à Vercel e faça o primeiro deploy antes de continuar.

---

## Passo 1.2: Adicionar o domínio

1. No menu lateral, clique em **Settings**
2. Clique em **Domains**
3. No campo **Add**, digite seu domínio completo, por exemplo:
   - `edmlean.com.br` (domínio raiz)
   - ou `app.minhaempresa.com.br` (subdomínio)
4. Clique em **Add** ou pressione Enter

---

## Passo 1.3: Ver as instruções de DNS

A Vercel vai mostrar o que você precisa configurar no Registro.br.

### Para domínio raiz (ex: `edmlean.com.br`)

Você verá algo como:

| Tipo  | Nome | Valor              |
|-------|------|--------------------|
| **A** | `@`  | `76.76.21.21`      |

- **Tipo A** = associa o domínio a um endereço IP
- **Nome `@`** = representa o domínio raiz (sem www)
- **Valor `76.76.21.21`** = IP dos servidores da Vercel

### Para usar também `www` (ex: `www.edmlean.com.br`)

A Vercel pode pedir um registro adicional:

| Tipo    | Nome | Valor                  |
|---------|------|------------------------|
| **CNAME** | `www` | `cname.vercel-dns.com` |

**Anote esses valores** — você vai usá-los no Registro.br.

---

# PARTE 2 — Registro.br

## Passo 2.1: Acessar o painel

1. Acesse **[registro.br](https://registro.br)**
2. Clique em **Entrar** (canto superior direito)
3. Faça login com seu CPF/CNPJ e senha

---

## Passo 2.2: Localizar seu domínio

1. Na tela inicial, você verá a lista de domínios
2. Clique no **domínio** que deseja configurar (ex: `edmlean.com.br`)

---

## Passo 2.3: Acessar a zona DNS

O Registro.br oferece duas formas de configurar DNS:

### Opção A — Zona DNS (recomendado)

1. Na página do domínio, procure a seção **DNS** ou **Servidores DNS**
2. Clique em **Alterar zona DNS** ou **Configurar zona DNS** ou **Editar zona**
3. Se aparecer a opção de usar a **zona do Registro.br**, ative-a (geralmente é o padrão para domínios novos)

### Opção B — Servidores DNS da Vercel

Se preferir delegar todo o DNS à Vercel:

1. Clique em **Alterar Servidores DNS**
2. Nos campos **Servidor 1** e **Servidor 2**, coloque:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
3. Salve e pule para a **Parte 3** (Supabase)

> **Nota:** Com a Opção B, a Vercel gerencia todo o DNS. Com a Opção A, você mantém o DNS no Registro.br e só adiciona os registros necessários.

---

## Passo 2.4: Adicionar o registro A (domínio raiz)

Se você escolheu a **Opção A** (zona DNS no Registro.br):

1. Na tela de edição da zona DNS, clique em **Nova entrada** ou **Adicionar registro**
2. Preencha:
   - **Nome / Entrada / Host:** deixe em branco ou use `@` (significa o domínio raiz)
   - **Tipo:** `A`
   - **Valor / Destino / Aponta para:** `76.76.21.21`
   - **TTL:** pode deixar o padrão (ex: 3600)
3. Salve a entrada

### Exemplo de como pode aparecer no Registro.br

| Nome | Tipo | Valor        |
|------|------|--------------|
| @    | A    | 76.76.21.21  |

---

## Passo 2.5: Adicionar o registro CNAME (www) — opcional

Se quiser que `www.seudominio.com.br` também funcione:

1. Clique em **Nova entrada** novamente
2. Preencha:
   - **Nome:** `www`
   - **Tipo:** `CNAME`
   - **Valor / Destino:** `cname.vercel-dns.com`
3. Salve

### Exemplo

| Nome | Tipo  | Valor                 |
|------|-------|-----------------------|
| www  | CNAME | cname.vercel-dns.com  |

---

## Passo 2.6: Remover registros conflitantes

Se o domínio já tinha outros registros (ex: de hospedagem antiga):

1. Verifique se existe outro registro **A** para `@`
2. Se existir, **remova** ou edite para usar `76.76.21.21`
3. Deve haver **apenas um** registro A para o domínio raiz

---

## Passo 2.7: Salvar e aguardar propagação

1. Clique em **Salvar** ou **Aplicar alterações**
2. A propagação do DNS pode levar de **alguns minutos a 48 horas**
3. Em geral, domínios novos propagam mais rápido (15–30 minutos)

### Como verificar se propagou

No computador, abra o **Prompt de Comando** (Windows) ou **Terminal** (Mac) e digite:

```
nslookup seudominio.com.br
```

Se aparecer o IP `76.76.21.21`, o DNS já está correto.

---

# PARTE 3 — Supabase

## Passo 3.1: Acessar o painel

1. Acesse **[supabase.com/dashboard](https://supabase.com/dashboard)**
2. Faça login
3. Clique no projeto do **EDM Lean**

---

## Passo 3.2: Configurar Site URL

1. No menu lateral, clique em **Authentication**
2. Clique em **URL Configuration**
3. No campo **Site URL**, coloque a URL principal do app:
   ```
   https://seudominio.com.br
   ```
   (substitua pelo seu domínio real, **sem** barra no final)

---

## Passo 3.3: Configurar Redirect URLs

1. Na mesma tela, localize **Redirect URLs**
2. Clique em **Add URL** para cada linha abaixo (se ainda não existir):

```
https://seudominio.com.br
https://seudominio.com.br/**
https://www.seudominio.com.br
https://www.seudominio.com.br/**
```

O `**` significa “qualquer caminho” (ex: `/dashboard`, `/join/ABC123`).

3. Clique em **Save** para salvar

---

# PARTE 4 — Voltar à Vercel e verificar

## Passo 4.1: Verificar o domínio

1. Volte ao projeto na Vercel
2. Vá em **Settings** → **Domains**
3. Ao lado do seu domínio, deve aparecer **Valid Configuration** (ou ícone de verificação)
4. Se ainda estiver **Pending**, clique em **Verify** e aguarde alguns minutos

---

## Passo 4.2: Forçar HTTPS (opcional)

A Vercel costuma ativar HTTPS automaticamente. Se quiser garantir:

1. Em **Domains**, clique no seu domínio
2. Verifique se **Enforce HTTPS** está ativado

---

# PARTE 5 — Testes

## Passo 5.1: Testar o site

1. Abra o navegador em modo anônimo/privado
2. Acesse `https://seudominio.com.br`
3. O app EDM Lean deve carregar

---

## Passo 5.2: Testar o login

1. Na tela de login, digite seu e-mail e senha
2. Clique em **Entrar**
3. Se aparecer erro de "Invalid redirect URL", volte ao Supabase e confira se a URL exata está em **Redirect URLs**

---

## Passo 5.3: Testar o link de convite

1. Vá em **Configurações** no app
2. Copie o link de convite (Join)
3. Abra em outra aba ou envie para outro dispositivo
4. O link deve abrir no novo domínio e funcionar normalmente

---

# Checklist final

Marque conforme for concluindo:

- [ ] Domínio adicionado na Vercel
- [ ] Registro A criado no Registro.br (`@` → `76.76.21.21`)
- [ ] Registro CNAME criado (se usar www): `www` → `cname.vercel-dns.com`
- [ ] DNS propagado (testado com `nslookup`)
- [ ] Domínio verificado na Vercel (Valid Configuration)
- [ ] Site URL configurada no Supabase
- [ ] Redirect URLs configuradas no Supabase
- [ ] Site acessível em `https://seudominio.com.br`
- [ ] Login funcionando
- [ ] Link de convite funcionando

---

# Problemas comuns e soluções

## O domínio não carrega / "Site não encontrado"

- Aguarde até 48h para a propagação do DNS
- Confirme os registros no Registro.br (A e CNAME)
- Use [whatsmydns.net](https://www.whatsmydns.net) para ver se o DNS já propagou globalmente

## "Invalid redirect URL" ao fazer login

- No Supabase, em **Redirect URLs**, adicione exatamente a URL que aparece na barra do navegador (com `https://`)
- Inclua também a versão com `/**` no final

## Certificado SSL / HTTPS não funciona

- A Vercel emite o certificado automaticamente após a verificação do domínio
- Pode levar alguns minutos; aguarde e tente novamente

## O domínio raiz funciona, mas www não

- Verifique se o registro CNAME para `www` está correto no Registro.br
- Na Vercel, em **Domains**, adicione também `www.seudominio.com.br` como domínio

## Registro.br: "Não consigo editar a zona DNS"

- Alguns domínios vêm com DNS em outro provedor
- Em **Alterar Servidores DNS**, você pode trocar para os servidores do Registro.br e depois editar a zona
- Ou use a **Opção B** (servidores da Vercel) descrita no Passo 2.3

---

# Resumo dos valores para copiar

Substitua `seudominio.com.br` pelo seu domínio real.

### Registro.br — Zona DNS

| Nome | Tipo  | Valor                 |
|------|-------|-----------------------|
| @    | A     | 76.76.21.21           |
| www  | CNAME | cname.vercel-dns.com  |

### Supabase — URL Configuration

**Site URL:**
```
https://seudominio.com.br
```

**Redirect URLs:**
```
https://seudominio.com.br
https://seudominio.com.br/**
https://www.seudominio.com.br
https://www.seudominio.com.br/**
```

---

Se algo não funcionar como esperado, descreva o que você fez e qual mensagem de erro aparece, para ajustarmos o guia ou o próximo passo.
