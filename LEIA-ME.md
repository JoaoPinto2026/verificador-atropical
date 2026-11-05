# Verificador de Emails A Tropical — Suplemento Outlook

Quando um colaborador carrega em **Enviar**, o Outlook verifica o email e, se faltar informação, mostra um aviso com o que falta. O colaborador pode **Corrigir** ou **Enviar na mesma**.

- **Custo: 0 €.** Não usa IA nem serviços pagos. As regras correm dentro do Outlook.
- **Privacidade:** o conteúdo dos emails nunca sai do computador do colaborador.
- **Emails internos** (só para @turitropical.com) não são verificados.
- Há também um botão **Verificar email** na barra, para verificar antes de enviar.

## O que é verificado

| Situação detetada no email | Alerta se faltar |
|---|---|
| Fala de voo / bilhete / embarque | Nº do voo (e do regresso, se ida e volta), horários, bagagem, PNR (se for confirmação) |
| Confirmação/proposta de hotel ou alojamento | Datas de check-in e check-out, regime (APA, MP, PC, TI...), tipo de quarto |
| Menciona cancelamento | Prazos (dias/datas) e penalizações (% ou €) |
| Confirmação/proposta de viagem sem falar em cancelamento | Política de cancelamento |
| Fala de pagamento / sinal | Valor (€), data limite, forma de pagamento (IBAN, referência MB...) |
| Contém um IBAN | Verifica os dígitos de controlo. Deteta IBANs mal escritos |
| Diz "em anexo" | Se não houver nenhum anexo |
| Sempre | Assunto vazio |

O histórico citado nas respostas (abaixo de "De:" / "From:") é ignorado.

---

## Instalação (cerca de 30 minutos, uma única vez)

### Passo 1 — Publicar os ficheiros (gratuito, GitHub Pages)
O Outlook precisa de ler os ficheiros a partir de um endereço `https://`.

1. Crie uma conta gratuita em **github.com** (ou use a que já tem).
2. Crie um repositório **público** chamado `verificador-atropical`.
3. Carregue todos os ficheiros desta pasta (**Add file → Upload files**), mantendo a pasta `assets/`.
4. Vá a **Settings → Pages → Branch: `main` / `(root)` → Save**.
5. Após 1 a 2 minutos, o endereço fica disponível: `https://<utilizador>.github.io/verificador-atropical/`
   Confirme abrindo `.../testar.html` no browser.

> O repositório público mostra apenas o código e as regras. Nenhum email nem dado de cliente fica lá.

### Passo 2 — Ajustar o manifest
No ficheiro `manifest.xml`, substitua **todas** as ocorrências de
`https://SEU-UTILIZADOR.github.io/verificador-atropical`
pelo seu endereço do passo 1 (Localizar e Substituir, por exemplo no Bloco de Notas). Na linha `<AppDomain>`, substitua `https://SEU-UTILIZADOR.github.io`.

Opcional: validar o manifest no seu PC com `npx office-addin-manifest validate manifest.xml`.

### Passo 3 — Testar só na sua conta
1. Abra o **Outlook na web** (outlook.office.com).
2. Abra este endereço: **https://aka.ms/olksideload** → **Os meus suplementos** → **Adicionar um suplemento personalizado** → **Adicionar a partir de ficheiro** → escolha `manifest.xml`.
3. Escreva um email de teste para um endereço externo, por exemplo: *"Confirmamos o voo TP438, segue em anexo"*, sem anexo. Carregue em Enviar: deve aparecer o alerta.

### Passo 4 — Instalar para toda a equipa
1. Entre em **admin.microsoft.com** com uma conta de administrador.
2. **Definições → Aplicações integradas → Carregar aplicações personalizadas**.
3. Tipo: **Suplemento do Office** → **Carregar ficheiro de manifesto** → `manifest.xml`.
4. Escolha os utilizadores (ou "Toda a organização") e conclua.
5. Pode demorar **até 24 horas** a aparecer para todos. Não é preciso instalar nada nos computadores.

### Compatibilidade
- ✅ Outlook na web, **novo Outlook** para Windows, Outlook para Mac (versão recente)
- ✅ Outlook clássico para Windows com o **Microsoft 365** atualizado (versão 2206 ou superior)
- ⚠️ Telemóvel (iOS/Android): o alerta automático pode não funcionar. Os emails enviados pelo telemóvel seguem sem verificação.

---

## Afinar as regras

Toda a lógica está em **`launchevent.js`**:

- **Ligar/desligar regras**: no bloco `CONFIG.regras`, ponha `false` na regra que quiser desativar.
- **Palavras-chave e padrões**: no bloco `P` (secção 2). Por exemplo, para considerar "transfer" como serviço que exige cancelamento, acrescente `transfer` ao padrão `pacote`.
- **Testar antes de publicar**: abra `testar.html` no browser, cole um email real e veja o alerta.
- **Testes automáticos**: `node testes/testes.js`.

Depois de alterar, volte a carregar `launchevent.js` no GitHub. A equipa recebe a nova versão automaticamente (pode ser necessário reiniciar o Outlook). **Não é preciso reinstalar o manifest.**

### Sugestão de arranque
Durante as primeiras 2 a 3 semanas, peça à equipa que lhe reencaminhe os casos em que:
- o alerta apareceu sem razão (falso alarme): afrouxar o padrão;
- faltava algo e não houve alerta: acrescentar um padrão.

## Ficheiros

| Ficheiro | Função |
|---|---|
| `manifest.xml` | Registo do suplemento no Outlook/Microsoft 365 |
| `launchevent.js` | Regras e verificação (o único ficheiro a editar) |
| `commands.html` | Carrega o verificador no Outlook web/novo/Mac |
| `taskpane.html` | Página informativa do suplemento |
| `testar.html` | Página para testar regras com emails reais |
| `testes/testes.js` | Testes automáticos das regras |
| `assets/` | Ícones |
