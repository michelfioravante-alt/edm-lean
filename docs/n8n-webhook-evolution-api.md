# Webhook n8n para Evolution API (WhatsApp)

Guia para criar um **webhook novo** no n8n que recebe mensagens da **Evolution API** e deixa os dados prontos para o fluxo da cafeteria.

---

## Parte 1 – Criar o Webhook no n8n

### 1.1 Adicionar o nó Webhook

1. No seu workflow, **remova** (ou desative) o nó antigo "Webhook - Mensagem WhatsApp".
2. Arraste um novo nó **Webhook** para o canvas.
3. Configure:
   - **HTTP Method:** `POST`
   - **Path:** `evolution-whatsapp` (ou outro nome, ex: `cafeteria`)
   - **Response Mode:** `When Last Node Finishes` (resposta quando o fluxo terminar)
   - **Response Code:** `200`

### 1.2 Obter a URL do webhook

- Depois de salvar o workflow, o n8n mostra a **URL de produção** do webhook.
- Formato típico:
  - **n8n em nuvem:** `https://seu-app.n8n.cloud/webhook/evolution-whatsapp`
  - **n8n local (com ngrok):** `https://xxxx.ngrok.io/webhook/evolution-whatsapp`

**Importante:** A Evolution API precisa conseguir acessar essa URL pela internet. Se o n8n estiver só no seu PC, use [ngrok](https://ngrok.com/) para expor a URL.

---

## Parte 2 – Configurar o webhook na Evolution API

A Evolution API pode estar instalada por você (Docker/VPS) ou em um serviço que oferece Evolution (hosting). Em ambos os casos você precisa **registrar a URL** na instância do WhatsApp.

### 2.1 Endpoint usado

- **Método:** `POST`
- **URL base:** a que você usa para a Evolution API (ex: `https://sua-evolution.com` ou `http://IP:8080`)
- **Caminho:** `/webhook/set/[NOME_DA_INSTANCIA]`

Exemplo:  
`POST https://sua-evolution.com/webhook/set/minha-instancia`

### 2.2 Corpo da requisição (JSON)

Envie este JSON (troque `SUA_URL_DO_N8N` pela URL do webhook do n8n):

```json
{
  "enabled": true,
  "url": "SUA_URL_DO_N8N",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": [
    "MESSAGES_UPSERT"
  ]
}
```

- **url:** URL completa do webhook do n8n (ex: `https://seu-app.n8n.cloud/webhook/evolution-whatsapp`).
- **events:** `MESSAGES_UPSERT` = quando chega (ou é enviada) uma mensagem. Só esse evento já basta para atendimento.
- **webhook_base64:** `false` = mídia vem por URL; se quiser base64, use `true`.

### 2.3 Como enviar

- **Opção A – Postman / Insomnia:**  
  Crie uma requisição `POST` para `https://sua-evolution.com/webhook/set/minha-instancia`, coloque o JSON acima no body e envie. Use o header de API Key se a Evolution exige.

- **Opção B – cURL (terminal):**

```bash
curl -X POST "https://sua-evolution.com/webhook/set/minha-instancia" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_API_KEY_DA_EVOLUTION" \
  -d '{
    "enabled": true,
    "url": "https://seu-app.n8n.cloud/webhook/evolution-whatsapp",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

Substitua:
- `minha-instancia` pelo nome da sua instância.
- `SUA_API_KEY_DA_EVOLUTION` pela chave que a Evolution pede (se tiver).
- A URL pelo seu webhook real do n8n.

Depois disso, toda mensagem que chegar no WhatsApp dessa instância será enviada para o n8n.

---

## Parte 3 – O que o n8n recebe (estrutura do body)

O body que chega no Webhook (evento `MESSAGES_UPSERT`) costuma vir nesse formato:

```json
{
  "event": "messages.upsert",
  "instance": "nome-da-instancia",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "id_da_mensagem"
    },
    "pushName": "Nome do Cliente",
    "message": { ... },
    "messageType": "conversation",
    "messageTimestamp": 1234567890
  }
}
```

- **Só processar mensagens recebidas:** use `data.key.fromMe === false`.
- **Número do cliente:** `data.key.remoteJid` (ex: `5511999999999@s.whatsapp.net`).
- **Nome:** `data.pushName`.
- **Conteúdo:**
  - **Texto:** `data.message.conversation` ou `data.message.extendedTextMessage.text`
  - **Áudio:** `data.message.audioMessage` (pode ter `url` ou base64)
  - **Imagem:** `data.message.imageMessage` (idem)

---

## Parte 4 – Normalizar no n8n (nó "Set" ou "Code")

Logo após o nó **Webhook**, coloque um nó **Code (JavaScript)** para:

1. Ignorar mensagens **enviadas por você** (`fromMe === true`).
2. Extrair número, nome, tipo e conteúdo (texto, ou indicação de áudio/imagem).
3. Deixar um formato padrão para o resto do fluxo: `userId`, `nomeCliente`, `tipoMensagem`, `conteudoTexto`, `urlMidia`.

Assim, o restante do workflow (IA, cardápio, resposta) sempre recebe os mesmos campos.

O arquivo `normalizar-evolution.js` (na pasta deste projeto) traz um exemplo de código que você pode colar no nó Code.

---

## Resumo rápido

| Onde              | O que fazer |
|-------------------|-------------|
| **n8n**           | Criar nó Webhook (POST), path ex: `evolution-whatsapp`, copiar a URL. |
| **Evolution API** | `POST /webhook/set/{instancia}` com `url` = URL do n8n e `events: ["MESSAGES_UPSERT"]`. |
| **n8n**           | Depois do Webhook, usar Code (ou Set) para normalizar e filtrar `fromMe === false`. |

Depois disso, o próximo nó do fluxo pode ser o que processa com IA, lê o cardápio e monta a resposta.
