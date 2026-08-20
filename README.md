# Central de Transparência

Protótipo funcional de comunicação proativa no transporte rodoviário. Exercício acadêmico.

Dado um evento, existe uma lógica explícita que decide **quem é avisado, quando, com que tom e
com qual compensação** — e essa lógica muda conforme o perfil do passageiro e conforme existir ou
não caminho até ele. O ativo do protótipo é o motor de regras, visível na tela. A conversa é só a
evidência.

## Como rodar

```bash
npm install
npm run dev            # interface em http://localhost:5173
npm test               # 19 asserções: motor, ordem de corte e validador de fatos
npm run build          # typecheck e build de produção
npm run gerar:conteudo # reescreve o registro de conteudo-v2/ a partir de src/dadosV2.ts
```

Sem backend, sem `.env`, sem chamada a API em runtime, sem biblioteca de componentes, sem router.
Estado em `useState` no `App.tsx`. Nada é persistido: recarregar a página zera tudo.

A v2 acrescenta três funcionalidades de IA agêntica sem mudar nada disso: as saídas de IA são
pré-computadas, embutidas como constantes em `src/dadosV2.ts`, e o protótipo continua sem nenhuma
chamada de modelo em tempo de execução. Ver `SPEC-central-transparencia-v2.md`.

### O que a v2 acrescenta

| # | Funcionalidade | Onde está na tela |
|---|---|---|
| F1 | Agente redator de mensagens | toggle "quem escreve" no topo da conversa, e o bloco *Redação* no canhoto |
| F2 | Copiloto da ouvidoria ativa | botão *Abrir no copiloto*, na fila de casos |
| F3 | Orquestrador de ocorrência | *Painel do lote*, na coluna da esquerda |

O agente redige, monta e prepara; o livro de regras continua decidindo valor, elegibilidade e
envio. Toda ação de agente passa por aprovação humana visível: o toggle, os três botões do
copiloto e o *Aprovar lote*.

## O que é real e o que é simulado

Texto da seção 7 da `SPEC-central-transparencia-v2.md`, o mesmo que aparece no protótipo, no botão
do cabeçalho.

**O que é real:** a lógica de decisão (regras, freios, ordem de corte) funciona de verdade e pode
ser conferida passo a passo. Os textos marcados como "redação por IA" foram efetivamente gerados
por inteligência artificial a partir dessas regras — gerados antes da apresentação e embutidos
aqui, não ao vivo.

**O que é simulado:** passageiros, viagens, ocorrências e valores são inventados; nenhuma mensagem
é enviada de fato; o efeito de "digitação" é reproduzido, não gerado na hora.

**O que ainda é aposta:** que personalização por IA reduza evasão é hipótese, como todo o programa.
Validar exige piloto em linha real com grupo de controle — e, para a IA, medir taxa de erro de
redação, custo por disparo e latência em escala, o que seis mensagens de demonstração não provam.

Em números: os 12 passageiros, as 3 viagens e as 29 mensagens de template foram escritos à mão para
o exercício; `decidir()` é função pura e roda sem interface, exercitada pelos testes. Não há
localização por satélite, sistema de clientes nem persistência. As duas proporções de alcance por
canal de compra (67% e 27%) saíram da base inventada do exercício.

## Estrutura

```
src/
  dados.ts          tipos, 12 passageiros, 3 viagens, banco de 29 mensagens
  dadosV2.ts        v2: fatos travados, redações de IA, dossiê, painel do lote, prompts
  motor.ts          10 regras como array de objetos, decidir(), bloqueios, custos, ordemDeCorte()
  validador.ts      v2: confere a redação de IA contra os fatos travados
  redacao.ts        v2: decide se a mensagem exibida vem do template ou do agente
  motor.test.ts     10 asserções
  validador.test.ts 9 asserções
  App.tsx           três colunas e todo o estado
  ui/
    Conversa.tsx    bolhas, horários, ações de terminal, substituição de placeholders
    Inspetor.tsx    o canhoto: regras aplicadas, bloqueadas, motivo de cada bloqueio e a redação
    Metricas.tsx    cobertura, custo, bloqueios por motivo, quem ficou sem aviso
    PosViagem.tsx   pesquisa de nota 0–10 e fila de casos
    Etiqueta.tsx    etiqueta de grupo, com marcador apagado para quem está fora dos conjuntos
    Streaming.tsx   v2: streaming simulado, 40 a 60 ms por palavra, sobre texto estático
    Copiloto.tsx    v2: dossiê, proposta e os botões aprovar / editar / recusar
    Lote.tsx        v2: painel do lote, aprovação e a variação com estouro de teto
    Honestidade.tsx v2: o quadro "o que é real e o que é simulado"
scripts/
  gerar_conteudo_v2.ts   monta prompt e pacote de fatos; a chamada de modelo é manual
conteudo-v2/             prompt, fatos, saída bruta e saída aprovada, versionados
```

### As regras

| # | Gatilho | Condição | Canal | Prazo | Tom | Compensação |
|---|---|---|---|---|---|---|
| R1 | ocorrência | atraso > 60 min | whatsapp | 3 min | reparador | crédito 15% |
| R2 | ocorrência | quebra de veículo | whatsapp | 2 min | reparador | crédito 30% + remarcação livre |
| R3 | ocorrência | quebra + grupo 1 ou 2 | + ligação | 10 min | reparador | idem R2 |
| R3b | ocorrência | quebra + grupo 5 | + ligação | 5 min | reparador | idem R2 |
| R4 | ocorrência | mudança de plataforma | whatsapp | imediato | informativo | nenhuma |
| R5 | ocorrência | cancelamento | whatsapp | 1 min | reparador | reembolso + lugar em outro horário + crédito 20% |
| R6 | win-back | sem viajar há > 120 dias | whatsapp | — | reconquista | oferta dirigida |
| R6b | win-back | sem viajar há > 120 dias **e** caso aberto | whatsapp | — | reparador | nenhuma: primeiro resolve |
| R7 | marco | 5 viagens em 4 meses **e** gasto em alta **e** grupo ≠ 1 | whatsapp | 24 h | informativo | subida de classe por 30 dias |
| R8 | padrão | 3 passagens não usadas em 6 meses | **nenhum** | — | — | nenhuma |

A R8 é a mais importante do conjunto e não envia nada: registra o padrão e abre caso de
investigação. Existe para provar que o motor sabe decidir não agir.

### Os bloqueios, nesta ordem

- **B0 · alcance.** Sem contato cadastrado, nenhuma mensagem sai — nem transacional. Degrada para
  painel do terminal e instrução ao guichê, que custam zero e não contam para o limite de três.
- **B1 · autorização.** Sem consentimento, bloqueia só o que é comercial (R6 e R7). Aviso sobre a
  viagem comprada sempre passa.
- **B2 · limite.** Máximo 3 mensagens por passageiro por viagem.
- **B4 · caso aberto.** Convite comercial só depois de resolver o que ficou em aberto. Resolver o
  caso de quem pagou é atendimento, não propaganda: a mensagem da regra 6b passa mesmo sem
  autorização comercial, porque a base legal é o contrato de transporte que falhou. O que espera é
  a oferta, não o atendimento. O número é identidade, não posição: este bloqueio corre logo depois
  do B1.
- **B3 · teto.** Benefício extra limitado a R$ 2.000 por ocorrência. Reembolso e lugar em outro
  horário ficam fora do teto — são direito de quem pagou. Ao estourar, corta o benefício extra
  começando pelo menos frequente, e registra cada corte com nome e valor.

B0 e B1 respondem perguntas diferentes e não devem ser fundidos: alcance decide se qualquer
mensagem sai, autorização decide só se pode haver mensagem comercial. Os dois bloqueios se acumulam
— quem não tem contato nem autorização aparece barrado duas vezes, com dois motivos distintos.

## Roteiro de demonstração, 7 minutos

Um roteiro só, com a v1 e a v2 na mesma ordem em que a história se conta: primeiro a decisão, depois
quem escreve, depois a escala. Cada passo diz onde clicar. Se houver só quatro minutos, faça os
passos 1 a 5 e o 11 — são eles que sustentam o argumento inteiro.

1. **A quebra, e por que dois passageiros recebem textos diferentes** (~40 s). Viagem
   *Capital–Interior*, botão *Quebra de veículo*. Mariana e Carlos são avisados de formas
   diferentes na mesma falha: ela no tom reparador, com crédito de 30%; ele no de reconquista, que
   reconhece a viagem anterior sem aviso. Clique em cada um e leia o canhoto à direita: a ligação
   dela sai em 10 minutos pela R3, a dele em 5 pela R3b. É a v1 inteira em um clique — o motor
   decide, a conversa é só a evidência.
2. **A mesma quebra, escrita por IA** (~45 s). No topo da conversa, o seletor *quem escreve* está
   em *Template (v1)*: os textos escritos à mão. Troque para *Redação por IA (v2)*: os mesmos
   Mariana e Carlos, agora com o texto do agente entrando palavra a palavra. Clique em cada um e
   leia o bloco *Redação* no canhoto — `Fatos validados: horário ✓ · valor ✓ · nome ✓ · canal ✓`.
   O agente escreveu ao redor de fatos que não pode alterar.
3. **A redação que foi descartada** (~30 s). Ainda em modo IA, desça até o Diego: a redação sai com
   07h05 onde o fato travado diz 07h15, o validador a barra antes de qualquer exibição como
   enviada, ela aparece riscada e o template da v1 é enviado no lugar. O canhoto registra o motivo.
   É a cena que separa personalização bonita de personalização controlada.
4. **O lote inteiro, e a conta contra o teto** (~40 s). Coluna da esquerda, *Orquestrador (v2)* →
   *Painel do lote*: 42 afetados, 31 com mensagem pronta, 11 pelo terminal, 1 barrada pelo freio de
   permissão, 1 redação descartada, R$ 1.840 contra um teto de R$ 2.000. Clique em *Aprovar lote* e
   olhe a coluna da direita: a tela "Os números da ocorrência" está preenchida com os mesmos
   números. *Ver variação com estouro de teto* mostra a ordem de corte, aplicada pelo motor de
   regras e não pelo agente. Os números do lote ficam na tela até você clicar em *Resetar*.
5. **A ouvidoria: a fila e o copiloto** (~70 s). *Voltar à conversa* e, na fila de casos à direita,
   clique em *Abrir no copiloto* no caso do Carlos — ele está no topo porque a reclamação de seis
   meses nunca foi respondida. Dossiê montado, proposta em streaming e a nota de guardrail
   explicando por que a oferta de retorno ficou de fora. Clique em *Editar*, troque uma palavra,
   clique em *Aprovar texto editado*: nada sai sem esse clique. Para ver a fila crescer pelo
   caminho da v1, volte à conversa, clique em *Concluir viagem* e dê nota 4 ao Carlos — o caso
   entra com prioridade elevada e prazo de 24 h; a mesma nota para Mariana entra com 72 h.
6. **Cancelamento com teto, na Capital–Sul** (~60 s). *Resetar*, troque a viagem e dispare
   *Cancelamento*. Ana Paula mantém o crédito de 20%; Beatriz e Diego perdem o seu. Nos números:
   R$ 2.604 pedidos, R$ 1.984 pagos, 10 cortes, começando pelos dois de menos histórico. Reembolso
   e lugar em outro horário permanecem nas três decisões — o teto não os alcança.
7. **Atraso noturno, na Capital–Nordeste** (~40 s). Resete e dispare *Atraso longo*. Diego é avisado
   em 3 minutos. Rosa, do grupo mais valioso da base, não recebe nada: sai painel de partidas e
   instrução ao guichê, com moldura diferente porque não é conversa. A cobertura cai para 50% e o
   número em destaque marca 1.
8. **Marco: Letícia e Marcos** (~40 s). Em *gatilho de pessoa*, escolha Letícia e dispare *Marco* —
   convite de subida de classe, sem desconto e sem pedir nada em troca. Troque para Marcos, mesmo
   ritmo de viagem e autorização dada, e dispare de novo: B0. Ele é o caso que separa alcance de
   autorização; nos outros dez, as duas coisas andam juntas.
9. **Win-back, quatro respostas** (~50 s). Dispare *Win-back* para os quatro que sumiram. Jorge
   recebe o convite, ancorado no que mudou na linha que ele usava. Helena e Carlos recebem desculpa
   e nenhuma oferta, porque cada um tem um caso aberto — e o convite deles fica retido, ela só pelo
   caso (B4), ele pelo caso e pela falta de autorização (B1 e B4). Sandra não recebe nada: B0 e B1.
   A mensagem de reparação alcança Carlos sem que ele tenha autorizado nada, e é esse o ponto:
   resolver o caso de quem pagou é atendimento, não propaganda.
10. **Padrão de não embarque: Wilson** (~25 s). Dispare *Padrão de não embarque*. R8 aplicada,
    nenhuma mensagem, registro interno de caso para investigação. É o motor decidindo não agir.
11. **Fechamento: o que é real e o que é simulado** (~20 s). Botão no canto direito do cabeçalho.
    A lógica de decisão roda de verdade; os textos de IA foram gerados antes da apresentação e
    embutidos aqui; passageiros, viagens e valores são inventados; e a hipótese de que isso reduz
    evasão continua sendo hipótese.

## Hipóteses não validadas

1. Comunicação proativa reduzir evasão é **hipótese**, não resultado. Boa parte do churn em
   rodoviário é preço, malha e tempo porta a porta.
2. Validar exigiria piloto A/B numa linha, com grupo de controle sem régua, medindo recompra
   em 90 dias — não pesquisa de satisfação.
3. Régua agressiva gera opt-out. Daí o B2.
4. Compensação pode custar mais que o LTV preservado. Daí o B3.
5. LGPD: mensagem transacional tem base legal na execução do contrato; win-back e convite de
   marco são marketing e exigem consentimento. Daí o B1.
6. **O campo de autorização não existe na base de dados do exercício.** Foi criado por nós.
   O alcance de canal, esse sim, está nos dados.
7. **Os seis grupos são convenção, não descoberta.** Três métodos foram testados e nenhum
   encontrou grupos naturais; o método de densidade classificou o grupo 6 inteiro como caso
   isolado. Servem para priorizar, não para afirmar que existem seis tipos de passageiro.
8. **O perfil do Carlos foi corrigido** em relação ao documento original do projeto: quem está
   no grupo 5 viaja pouco. Quem viaja sempre e sofre falha quase nunca vai embora.
9. Dados sintéticos escritos à mão e mensagens pré-geradas. Nada aqui é evidência empírica.

## Onde o código divergiu do relatório visual

O relatório de sete páginas será atualizado depois desta implementação. As divergências que
apareceram ao programar, e que precisam entrar na próxima versão dele:

- **Página 2, as contas do cancelamento.** A coluna de reembolso implicava passagem de R$ 155
  (1.395÷9), mas a de crédito extra implicava cerca de R$ 63 por pessoa — 40% da passagem, não os
  20% da regra. Mantivemos o teto de R$ 2.000 e a passagem da linha foi para R$ 310, que é o que
  faz o teto encostar. Os totais passam a ser R$ 2.604 pedidos, R$ 620 cortados e R$ 1.984 pagos,
  contra R$ 2.640 / R$ 640 / R$ 2.000 do relatório. O desfecho é o mesmo: Beatriz e Diego cortados,
  Ana Paula intacta.
- **Página 1, o cartão do Carlos.** O relatório dá ligação de atendente a ele, do grupo 5, e não a
  Mariana, do grupo 1 — o inverso da regra 3. Resolvemos com a R3b, que estende a ligação ao grupo
  5 com prazo de 5 minutos, o que também corresponde à política de "atendimento caso a caso" que a
  página 7 atribui ao grupo. Mariana passa a receber ligação também.
- **Página 1, ainda o Carlos.** O cartão lista "reembolso integral" numa quebra. Reembolso é a
  compensação do cancelamento; nenhuma regra de quebra o prevê. Tratamos como erro do relatório.
- **Página 3, a instrução ao guichê.** A mesma página mostra "depositar o crédito de 15%" barrado
  para a Rosa, então a instrução ao guichê não pode prometer crédito a quem não o recebe. Ela agora
  manda recolher um telefone para o próximo aviso, que é a recomendação da própria página.
- **O pacote de fatos do Carlos, na v2.** A seção 3.3 da spec v2 trava, para a mensagem dele numa
  quebra, "reembolso integral + remarcação sem taxa + ligação de atendente". A R2 do motor não
  prevê reembolso em quebra — reembolso é compensação de cancelamento, e é a mesma divergência já
  anotada aqui sobre o cartão do Carlos na página 1 do relatório. Os fatos travados de
  `src/dadosV2.ts` seguem a spec v2, e não o motor, para que o texto aprovado da spec passe pelo
  validador. Se a decisão for o contrário, muda uma constante (`PACOTES_DE_FATOS['p-02']`) e o
  texto precisa ser regerado.
- **O limite de 4 frases.** A seção 3.4 o coloca como instrução do prompt e a 3.1 manda o validador
  conferir fatos travados; o texto aprovado do Carlos, na própria spec, tem 5 frases. O validador
  registra o excesso no canhoto sem descartar a redação.
- **Diego na viagem da quebra.** A cena obrigatória da seção 3.3 é dele, numa ocorrência em que a
  v1 não o colocava. Ele passa a viajar também na v-01.
- **A régua de quatro avisos da página 1** (duas horas antes, na saída, na estrada, na chegada) não
  foi implementada: só existe a mensagem de pré-embarque, porque a lista de gatilhos da interface
  não inclui os outros três momentos.
