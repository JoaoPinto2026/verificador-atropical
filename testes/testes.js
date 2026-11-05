// Testes das regras: node testes/testes.js
var v = require("../launchevent.js");
var ok = 0, falhou = 0;

function caso(nome, dados, esperaContem, esperaNaoContem) {
  var p = v.analisarEmail(dados);
  var txt = p.join(" | ");
  var bom = true;
  (esperaContem || []).forEach(function (s) { if (txt.indexOf(s) < 0) bom = false; });
  (esperaNaoContem || []).forEach(function (s) { if (txt.indexOf(s) >= 0) bom = false; });
  if (bom) ok++; else falhou++;
  console.log((bom ? "OK   " : "FALHA") + " " + nome + "\n      -> " + (txt || "(sem alertas)"));
}

var cliente = ["cliente@gmail.com"];

caso("Voo ida e volta só com um nº de voo, sem bagagem nem cancelamento", {
  assunto: "Confirmação da sua viagem a Paris",
  corpo: "Bom dia,\nConfirmamos a reserva dos voos ida e volta Porto-Paris.\nIda: TP438 dia 12/03 às 07h05.\nRegresso dia 18/03 às 19:40.\nCumprimentos",
  nAnexos: 0, destinatarios: cliente
}, ["voo de regresso", "bagagem", "código de reserva", "Falta a política de cancelamento"]);

caso("Voo completo", {
  assunto: "Confirmação voos Paris",
  corpo: "Confirmamos a reserva PNR: X7K2LM\nIda: TP438 12/03 07:05 OPO-ORY\nRegresso: TP439 18/03 19:40\nBagagem: 1 mala de 23 kg de porão por pessoa.\nCancelamento: até 30 dias antes sem custos; depois disso 100% não reembolsável.",
  nAnexos: 0, destinatarios: cliente
}, [], ["Falta", "incompleta"]);

caso("Cancelamento incompleto (sem prazos nem valores)", {
  assunto: "Proposta hotel Algarve",
  corpo: "Segue proposta para o Hotel Vilamoura, de 10/07 a 17/07, quarto duplo em meia pensão.\nTotal: 1.250 €.\nO cancelamento está sujeito às condições do hotel.",
  nAnexos: 0, destinatarios: cliente
}, ["faltam prazos e penalizações"]);

caso("Hotel sem regime, quarto nem datas", {
  assunto: "Confirmação de alojamento",
  corpo: "Confirmamos o seu alojamento no Hotel Lisboa Plaza. Cancelamento gratuito até 7 dias antes.",
  nAnexos: 0, destinatarios: cliente
}, ["datas", "regime", "tipo de quarto"]);

caso("Refere anexo sem anexo", {
  assunto: "Documentos de viagem",
  corpo: "Olá, segue em anexo o voucher do transfer.",
  nAnexos: 0, destinatarios: cliente
}, ["anexo"]);

caso("Refere anexo com anexo", {
  assunto: "Documentos de viagem",
  corpo: "Olá, segue em anexo o voucher do transfer.",
  nAnexos: 1, destinatarios: cliente
}, [], ["anexo"]);

caso("Pagamento sem data nem meio", {
  assunto: "Pagamento da reserva",
  corpo: "Para garantir a reserva falta o pagamento do sinal de 300 €.",
  nAnexos: 0, destinatarios: cliente
}, ["data limite", "forma de pagamento"], ["valor a pagar"]);

caso("Pagamento completo com IBAN válido (não confunde com nº de voo)", {
  assunto: "Pagamento",
  corpo: "Pagamento do sinal de 300 € até 15/11 por transferência.\nIBAN: PT50 0002 0123 1234 5678 9015 4",
  nAnexos: 0, destinatarios: cliente
}, [], ["Falta", "IBAN"]);

caso("IBAN com dígito errado", {
  assunto: "Pagamento",
  corpo: "Pagamento de 300 € até 15/11. IBAN: PT50 0002 0123 1234 5678 9015 5",
  nAnexos: 0, destinatarios: cliente
}, ["IBAN inválido"]);

caso("Email interno não é verificado", {
  assunto: "",
  corpo: "Confirmamos o voo, segue em anexo.",
  nAnexos: 0, destinatarios: ["colega@turitropical.com"]
}, [], ["Falta", "anexo", "Assunto"]);

caso("Histórico citado é ignorado", {
  assunto: "RE: Pedido",
  corpo: "Obrigado, fico a aguardar.\n\nDe: Cliente <cliente@gmail.com>\nEnviado: 4 nov\nPreciso de voo para Roma, segue anexo o passaporte.",
  nAnexos: 0, destinatarios: cliente
}, [], ["Falta", "anexo"]);

caso("Email normal sem temas de viagem", {
  assunto: "Bom dia",
  corpo: "Olá, ligo-lhe amanhã de manhã. Cumprimentos, RNAVT 2016",
  nAnexos: 0, destinatarios: cliente
}, [], ["Falta"]);

caso("Assunto vazio", {
  assunto: "", corpo: "Olá", nAnexos: 0, destinatarios: cliente
}, ["Assunto vazio"]);

console.log("\nMensagem de exemplo no Outlook:\n" + v.mensagemAlerta(v.analisarEmail({
  assunto: "Confirmação", corpo: "Confirmamos o voo ida e volta TP438 para Paris. Segue em anexo.", nAnexos: 0, destinatarios: cliente
}), 500));
console.log("\n" + ok + " OK, " + falhou + " falhas");
process.exit(falhou ? 1 : 0);
