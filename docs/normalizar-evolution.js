// Cole este código no nó "Code" do n8n, logo após o nó Webhook.
// Entrada: o body que a Evolution API envia no evento MESSAGES_UPSERT.

const body = $input.first().json.body || $input.first().json;

// Só processar mensagens RECEBIDAS (não as que você enviou)
if (body?.data?.key?.fromMe === true) {
  return []; // Encerra o fluxo para essa execução
}

const data = body?.data || {};
const key = data.key || {};
const message = data.message || {};
const messageType = (data.messageType || '').toLowerCase();

// Número do cliente (remoteJid: "5511999999999@s.whatsapp.net")
let userId = (key.remoteJid || '').replace('@s.whatsapp.net', '').replace('@g.us', '');
const nomeCliente = data.pushName || 'Cliente';

let tipoMensagem = 'texto';
let conteudoTexto = '';
let urlMidia = '';

// Texto
if (message.conversation) {
  conteudoTexto = message.conversation;
} else if (message.extendedTextMessage?.text) {
  conteudoTexto = message.extendedTextMessage.text;
}
// Áudio
else if (message.audioMessage) {
  tipoMensagem = 'audio';
  urlMidia = message.audioMessage.url || message.audioMessage.directPath || '';
  conteudoTexto = '(Áudio enviado pelo cliente - transcrever depois)';
}
// Imagem
else if (message.imageMessage) {
  tipoMensagem = 'imagem';
  urlMidia = message.imageMessage.url || message.imageMessage.directPath || '';
  conteudoTexto = message.imageMessage.caption || '(Imagem enviada pelo cliente)';
}
// Outros tipos podem ser adicionados aqui (videoMessage, documentMessage, etc.)
else {
  conteudoTexto = '(Tipo de mensagem não tratado)';
}

return [{
  json: {
    userId,
    nomeCliente,
    tipoMensagem,
    conteudoTexto,
    urlMidia,
    messageId: key.id,
    instance: body.instance,
    raw: body
  }
}];
