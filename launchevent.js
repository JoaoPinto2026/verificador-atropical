/*
 * Verificador de Emails — A Tropical
 * Corre dentro do Outlook, no momento em que o colaborador carrega em "Enviar".
 * Nada sai do computador: o email é analisado localmente, sem IA e sem custos.
 *
 * Escrito em JavaScript simples (ES5) para funcionar também no Outlook clássico do Windows.
 */

/* =====================================================================
 * 1. CONFIGURAÇÃO — edite aqui
 * ===================================================================== */
var CONFIG = {
  // Emails enviados apenas para colegas deste domínio não são verificados
  dominioInterno: "turitropical.com",
  ignorarEmailsInternos: true,

  // Ligar/desligar cada verificação (true = ativa)
  regras: {
    assuntoVazio: true,
    anexoEmFalta: true,
    voo: true,
    hotel: true,
    cancelamento: true,
    pagamento: true,
    ibanInvalido: true
  },

  // Texto do botão que volta ao email para corrigir
  textoBotaoCorrigir: "Rever email"
};

/* =====================================================================
 * 2. PADRÕES DE TEXTO
 * ===================================================================== */
var P = {
  // Contexto do email
  voo: /\b(voos?|flights?|embarque|bilhetes? a[eé]reos?|e-?tickets?|companhia a[eé]rea|boarding)\b/i,
  hotel: /\b(hot[eé]is|hotel|alojamento|estadia|resort|pousada|aparthotel|accommodation)\b/i,
  pacote: /\b(pacote|circuito|cruzeiro|viagem organizada|tour)\b/i,
  confirmacao: /(confirmad[ao]s?|confirma[cç][aã]o|confirmamos|emitid[ao]s?|e-?ticket|booking confirm)/i,
  proposta: /\b(or[cç]amentos?|propostas?|cota[cç][aã]o|quotation|quote)\b/i,
  cancelamento: /(cancelamento|cancelar|cancela-?se|anula[cç][aã]o|desist[eê]ncia|cancellation)/i,
  pagamento: /\b(pagamentos?|pagar|sinal|liquida[cç][aã]o|liquidar|transfer[eê]ncia|valor em d[ií]vida|payment)\b/i,
  anexo: /(em anexo|segue anexo|seguem anexos?|seguem em anexo|anexamos|envio em anexo|ver anexo|anexo (o|a|os|as) |attached|attachment)/i,
  regresso: /\b(regresso|volta|ida e volta|return)\b/i,

  // Dados concretos
  // Nº de voo: código IATA (2 caracteres, maiúsculas) + 1 a 4 dígitos — ex.: TP1234, FR 8341, U2 7621
  numVoo: /\b(?:[A-Z]{2}|[A-Z][0-9]|[0-9][A-Z])\s?\d{1,4}\b/g,
  hora: /(\b\d{1,2}\s?[:h]\s?\d{2}\b|\b\d{1,2}h\b)/i,
  bagagem: /(bagage(m|ns)|malas?\b|baggage|luggage|kg de por[aã]o|s[oó] bagagem de m[aã]o)/i,
  codReserva: /(reserva|localizador|pnr|booking ref(erence)?|c[oó]digo)\s*(n\.?\s?º|nº|n\.?o|:|-)?\s*[A-Z0-9]{5,8}\b/i,
  data: /(\b\d{1,2}\s?[\/\-.]\s?\d{1,2}(?:\s?[\/\-.]\s?\d{2,4})?\b(?!\s?(?:€|eur))|\b\d{1,2}\s+(?:de\s+)?(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-zç]*\b)/gi,
  regime: /(pequeno[- ]almo[cç]o|meia[- ]pens[aã]o|pens[aã]o completa|tudo inclu[ií]do|all[- ]inclusive|s[oó] alojamento|bed (and|&) breakfast|half board|full board|regime)/i,
  regimeSigla: /\b(APA|MP|PC|TI|SA|BB|HB|FB|AI)\b/,
  quarto: /(quartos?|rooms?|duplo|single|individual|twin|triplo|su[ií]te)/i,
  prazo: /(\d+\s*(dias?|horas?|h|semanas?)\b|at[eé]\s+(ao\s+dia\s+|dia\s+)?\d{1,2}\s?[\/\-.]\s?\d{1,2}|at[eé]\s+\d{1,2}\s+de\s+[a-zç]+|days?|hours?)/i,
  penalizacao: /(\d+([.,]\d+)?\s*%|€\s*\d|\d\s*(€|eur\b|euros\b)|reembols|penaliza|gastos de cancelamento|n[aã]o reembols[aá]vel|sem custos|gratuit|refund|non[- ]refundable|free of charge)/i,
  valor: /(€\s*\d|\d\s*(€|eur\b|euros\b))/i,
  dataLimite: /(at[eé]\s+(ao\s+dia\s+|dia\s+)?\d{1,2}|data limite|prazo|antes d[aoe]|\d+\s*dias|deadline|until|by\s+\d)/i,
  meioPagamento: /(iban|\bPT\s?50|refer[eê]ncia|entidade|mb\s?way|multibanco|cart[aã]o|link de pagamento|paypal|numer[aá]rio)/i,
  iban: /\bPT\s?50(?:\s?\d){21}\b/g,
  ibanDeclarado: /IBAN\s*:?\s*([A-Z]{2}\s?\d{2}(?:\s?[A-Z0-9]){11,30})/gi,

  // Início de texto citado (respostas / reencaminhamentos)
  citacao: /^\s*(De|From|Enviado|Sent|Para|To)\s*:|^\s*-{2,}\s*(Original Message|Mensagem original|Forwarded message|Mensagem reencaminhada)|^\s*(Em|On)\s.+(escreveu|wrote)\s*:\s*$/i
};

/* =====================================================================
 * 3. ANÁLISE (função pura — testável fora do Outlook)
 * ===================================================================== */

// Remove o histórico citado para analisar só o que o colaborador escreveu
function textoNovo(corpo) {
  var linhas = (corpo || "").replace(/\r/g, "").split("\n");
  var out = [];
  for (var i = 0; i < linhas.length; i++) {
    if (P.citacao.test(linhas[i])) break;
    if (/^\s*>/.test(linhas[i])) continue;
    out.push(linhas[i]);
  }
  return out.join("\n");
}

function ibanValido(iban) {
  var s = iban.replace(/\s/g, "").toUpperCase();
  if (s.length < 15 || s.length > 34) return false;
  if (s.substr(0, 2) === "PT" && s.length !== 25) return false;
  s = s.substr(4) + s.substr(0, 4);
  var resto = 0;
  for (var i = 0; i < s.length; i++) {
    var c = s.charAt(i);
    var n = (c >= "A" && c <= "Z") ? String(c.charCodeAt(0) - 55) : c;
    for (var j = 0; j < n.length; j++) {
      resto = (resto * 10 + Number(n.charAt(j))) % 97;
    }
  }
  return resto === 1;
}

function contarDistintos(re, texto) {
  var m = texto.match(re) || [];
  var vistos = {};
  var n = 0;
  for (var i = 0; i < m.length; i++) {
    var k = m[i].replace(/\s/g, "").toUpperCase();
    if (!vistos[k]) { vistos[k] = true; n++; }
  }
  return n;
}

/*
 * dados = { assunto, corpo, nAnexos, destinatarios: [emails] }
 * devolve lista de problemas (strings curtas)
 */
function analisarEmail(dados) {
  var R = CONFIG.regras;
  var problemas = [];
  var assunto = dados.assunto || "";
  var corpo = textoNovo(dados.corpo || "");
  var tudo = assunto + "\n" + corpo;

  if (CONFIG.ignorarEmailsInternos && dados.destinatarios && dados.destinatarios.length) {
    var internos = true;
    for (var d = 0; d < dados.destinatarios.length; d++) {
      var e = String(dados.destinatarios[d] || "").toLowerCase();
      if (e.slice(-(CONFIG.dominioInterno.length + 1)) !== "@" + CONFIG.dominioInterno) { internos = false; break; }
    }
    if (internos) return [];
  }

  if (R.assuntoVazio && !assunto.replace(/\s/g, "")) problemas.push("Assunto vazio");

  if (R.anexoEmFalta && P.anexo.test(corpo) && !dados.nAnexos) {
    problemas.push("Refere um anexo, mas o email não tem anexos");
  }

  // IBAN (verificado antes e retirado do texto para não ser confundido com nº de voo)
  var ibans = (corpo.match(P.iban) || []);
  var m;
  P.ibanDeclarado.lastIndex = 0;
  while ((m = P.ibanDeclarado.exec(corpo)) !== null) ibans.push(m[1]);
  if (R.ibanInvalido) {
    for (var b = 0; b < ibans.length; b++) {
      if (!ibanValido(ibans[b])) { problemas.push("IBAN inválido — confirme os dígitos"); break; }
    }
  }
  var semIban = tudo.replace(P.iban, " ").replace(P.ibanDeclarado, " ");

  var eVoo = P.voo.test(tudo);
  var eHotel = P.hotel.test(tudo);
  var ePacote = P.pacote.test(tudo);
  var eConfirmacao = P.confirmacao.test(tudo);
  var eProposta = P.proposta.test(tudo);

  // --- Voo ---
  if (R.voo && eVoo) {
    var nVoos = contarDistintos(P.numVoo, semIban);
    if (nVoos === 0) problemas.push("Falta o nº do voo (ex.: TP1234)");
    else if (nVoos === 1 && P.regresso.test(corpo)) problemas.push("Falta o nº do voo de regresso");
    if (!P.hora.test(corpo)) problemas.push("Faltam os horários do voo");
    if (!P.bagagem.test(corpo)) problemas.push("Falta a bagagem incluída");
    if (eConfirmacao && !P.codReserva.test(corpo)) problemas.push("Falta o código de reserva (PNR/localizador)");
  }

  // --- Hotel ---
  if (R.hotel && eHotel && (eConfirmacao || eProposta)) {
    if (contarDistintos(P.data, corpo) < 2) problemas.push("Faltam as datas de check-in e check-out");
    if (!P.regime.test(corpo) && !P.regimeSigla.test(corpo)) problemas.push("Falta o regime (APA, MP, PC, TI...)");
    if (!P.quarto.test(corpo)) problemas.push("Falta o tipo de quarto");
  }

  // --- Cancelamento ---
  if (R.cancelamento) {
    if (P.cancelamento.test(corpo)) {
      // Analisa só o excerto à volta da palavra "cancelamento"
      var idx = corpo.search(P.cancelamento);
      var excerto = corpo.substr(idx, 400);
      var faltaPrazo = !P.prazo.test(excerto);
      var faltaPen = !P.penalizacao.test(excerto);
      if (faltaPrazo && faltaPen) problemas.push("Política de cancelamento incompleta: faltam prazos e penalizações");
      else if (faltaPrazo) problemas.push("Política de cancelamento incompleta: faltam os prazos");
      else if (faltaPen) problemas.push("Política de cancelamento incompleta: faltam as penalizações (% ou €)");
    } else if ((eConfirmacao || eProposta) && (eVoo || eHotel || ePacote)) {
      problemas.push("Falta a política de cancelamento");
    }
  }

  // --- Pagamento ---
  if (R.pagamento && P.pagamento.test(corpo)) {
    if (!P.valor.test(corpo)) problemas.push("Falta o valor a pagar (€)");
    if (!P.dataLimite.test(corpo)) problemas.push("Falta a data limite de pagamento");
    if (!P.meioPagamento.test(corpo)) problemas.push("Falta a forma de pagamento (IBAN, referência MB...)");
  }

  return problemas;
}

function mensagemAlerta(problemas, max) {
  var cab = "Antes de enviar, confirme:\n";
  var txt = cab;
  for (var i = 0; i < problemas.length; i++) {
    var linha = "• " + problemas[i] + "\n";
    if ((txt + linha).length > max - 40) { txt += "• (+" + (problemas.length - i) + " outros)\n"; break; }
    txt += linha;
  }
  return txt + "\nSe estiver tudo certo, pode enviar na mesma.";
}

/* =====================================================================
 * 4. LIGAÇÃO AO OUTLOOK
 * ===================================================================== */
function lerEmail(item, callback) {
  var dados = { assunto: "", corpo: "", nAnexos: 0, destinatarios: [] };
  var pendentes = 5;
  function feito() { pendentes--; if (pendentes === 0) callback(dados); }
  function addRecip(r) {
    if (r && r.status === Office.AsyncResultStatus.Succeeded && r.value) {
      for (var i = 0; i < r.value.length; i++) dados.destinatarios.push(r.value[i].emailAddress);
    }
  }
  item.subject.getAsync(function (r) { if (r.status === Office.AsyncResultStatus.Succeeded) dados.assunto = r.value || ""; feito(); });
  item.body.getAsync(Office.CoercionType.Text, function (r) { if (r.status === Office.AsyncResultStatus.Succeeded) dados.corpo = r.value || ""; feito(); });
  item.to.getAsync(function (r) { addRecip(r); feito(); });
  item.cc.getAsync(function (r) { addRecip(r); feito(); });
  if (item.getAttachmentsAsync) {
    item.getAttachmentsAsync(function (r) {
      if (r.status === Office.AsyncResultStatus.Succeeded && r.value) {
        // Ignora imagens embutidas (logótipos da assinatura)
        var n = 0;
        for (var i = 0; i < r.value.length; i++) if (!r.value[i].isInline) n++;
        dados.nAnexos = n;
      } else { dados.nAnexos = 1; } // em caso de dúvida, não acusa falta de anexo
      feito();
    });
  } else { dados.nAnexos = 1; feito(); }
}

// Executado automaticamente ao carregar em "Enviar"
function onMessageSendHandler(event) {
  try {
    lerEmail(Office.context.mailbox.item, function (dados) {
      var problemas = [];
      try { problemas = analisarEmail(dados); } catch (e) { problemas = []; }
      if (!problemas.length) { event.completed({ allowEvent: true }); return; }
      var md = mensagemAlerta(problemas, 500);
      event.completed({
        allowEvent: false,
        errorMessage: md.replace(/\n/g, " ").replace(/\s{2,}/g, " ").substr(0, 500),
        errorMessageMarkdown: md.replace(/\n/g, "\n\n").replace(/• /g, "- ").substr(0, 500),
        cancelLabel: CONFIG.textoBotaoCorrigir
      });
    });
  } catch (e) {
    // Nunca bloquear o envio por erro do verificador
    event.completed({ allowEvent: true });
  }
}

// Botão "Verificar email" na barra do Outlook (verificação manual antes de enviar)
function verificarAgora(event) {
  var item = Office.context.mailbox.item;
  lerEmail(item, function (dados) {
    var problemas = [];
    try { problemas = analisarEmail(dados); } catch (e) { problemas = []; }
    var msg;
    if (problemas.length) {
      msg = problemas.length + " em falta: " + problemas.join("; ");
      if (msg.length > 150) msg = msg.substr(0, 147) + "...";
      item.notificationMessages.replaceAsync("verificacao", { type: Office.MailboxEnums.ItemNotificationMessageType.ErrorMessage, message: msg }, function () { event.completed(); });
    } else {
      item.notificationMessages.replaceAsync("verificacao", { type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage, message: "Verificação OK — não foi detetada informação em falta.", icon: "Icon.16x16", persistent: false }, function () { event.completed(); });
    }
  });
}

if (typeof Office !== "undefined" && Office.actions) {
  Office.actions.associate("onMessageSendHandler", onMessageSendHandler);
  Office.actions.associate("verificarAgora", verificarAgora);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { analisarEmail: analisarEmail, ibanValido: ibanValido, textoNovo: textoNovo, mensagemAlerta: mensagemAlerta, CONFIG: CONFIG };
}
