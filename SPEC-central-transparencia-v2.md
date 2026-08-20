# Spec — Central de Transparência v2: IA Agêntica no Protótipo

**Projeto:** Estratégia de Retenção e Experiência do Cliente · Transporte Rodoviário Interestadual (Grupo 1)
**Documento-base:** Protótipo "Central de Transparência" (fluxocentraltransparencia_1.pdf) · Deck de Segmentação · Relatório de Clusterização
**Versão:** 2.1 — revisada depois da implementação
**Data:** 20/08/2026 (2.0 em 19/08/2026)

---

## 0. O que mudou da 2.0 para a 2.1

A 2.0 foi escrita antes do código. Implementada, ela discordou do protótipo em dois pontos, e
quem estava errado era o documento — estas correções alinham a spec ao que o motor de regras
decide de fato, que é a autoridade do projeto.

1. **O que retém a oferta ao Carlos.** A 2.0 dizia que a oferta de retorno era barrada por falta
   de consentimento. Na base do exercício ele autoriza ser procurado, e o que retém o convite é a
   reclamação em aberto: convite comercial só depois de resolver o que se deve. Seções 3.3, 4.2 e
   5.2 corrigidas. Quem separa consentimento de dívida na base é a Beatriz, barrada só pela falta
   de autorização.
2. **A confirmação de envio.** A 2.0 não descrevia o gesto que transforma uma decisão em mensagem.
   Toda mensagem nasce como rascunho e só sai depois de um clique, e a compensação só conta como
   concedida — e como custo — depois dele. Seção 3.5, nova.

A cena do freio continua na demonstração, com o motivo trocado: em vez de "não posso falar com
você", o sistema diz "não vou te vender nada enquanto te devo uma resposta". O argumento fica mais
forte, não mais fraco.

## 1. Objetivo

Atualizar o protótipo da Central de Transparência (v1) incorporando três funcionalidades de IA agêntica, demonstráveis em tela, **sem chamada de LLM ao vivo**. Todas as saídas de IA são pré-computadas (geradas uma única vez, offline, com os prompts e guardrails reais) e embutidas no protótipo com streaming simulado.

A v2 mantém intactos os fundamentos da v1:

1. O livro de regras continua sendo a autoridade de decisão. Os agentes **redigem, montam e preparam** — nunca decidem valor de compensação, elegibilidade ou envio.
2. Os três freios do sistema (permissão do cliente, limite de 3 avisos, teto de compensação) permanecem e passam a barrar também as saídas dos agentes.
3. O quadro "o que é real e o que é simulado" é atualizado, não removido (seção 7).
4. Compatibilidade com a Trava 1 da governança ("sem automação cega no 1º ciclo"): toda ação dos agentes passa por aprovação humana visível na tela.

## 2. Escopo da v2

| # | Funcionalidade | Tela-base da v1 | Tipo de demo |
|---|---|---|---|
| F1 | Agente Redator de mensagens | "A conversa" + "Canhoto da decisão" | Cena principal |
| F2 | Copiloto da Ouvidoria Ativa | "Fila de casos" (nova tela de caso) | Cena principal |
| F3 | Orquestrador de ocorrência | "Números da ocorrência" | Fechamento de escala |

**Fora de escopo da v2:** agente conversacional de remarcação self-service (conflita com a promessa "Fast-Track sem robôs"); triagem automática de pós-venda; score de propensão; qualquer chamada de API em tempo real durante a apresentação.

---

## 3. F1 — Agente Redator de Mensagens

### 3.1 Comportamento

Para cada mensagem que o livro de regras decide enviar, o agente recebe um **pacote de fatos travados** (nome, segmento, tipo de falha, horário novo, compensação decidida pela regra, histórico relevante) e redige o texto final. O agente não pode alterar nenhum fato — apenas o texto ao redor deles.

Antes da exibição, um **validador programático** confere se todos os fatos travados aparecem corretos na redação. Se qualquer fato divergir, o sistema descarta a redação e cai para o template da v1, registrando o motivo no canhoto.

### 3.2 Interação em tela

1. Toggle no topo da tela de conversa: **"Template (v1)" ↔ "Redação por IA (v2)"**, lado a lado ou alternado.
2. No modo v2, o texto entra com streaming simulado (efeito de digitação, conteúdo pré-computado).
3. O canhoto da decisão ganha um bloco novo por mensagem:
   - `Redação: gerada por IA`
   - `Fatos validados: horário ✓ · valor ✓ · nome ✓ · canal ✓`
   - ou, no caso de falha: `Redação por IA descartada — motivo: [fato divergente]. Enviado template padrão.`

### 3.3 Conteúdo pré-computado

**Ocorrência de referência (mesma da v1):** quebra do veículo às 06h12 · linha capital–interior · saída 06h30 remarcada para 07h15.

**Mensagem 1 — Mariana (Grupo Âncora · autorizou ofertas · compensação decidida pela regra: crédito de 30% + assento garantido):**

> Bom dia, Mariana. O ônibus das 06h30 teve uma falha mecânica e já estamos trocando o veículo — a nova saída é às 07h15, mesma plataforma. Seu assento de sempre está garantido, e como você viaja com a gente toda quinzena, um crédito de 30% já foi para a sua conta, sem precisar pedir. Se preferir remarcar, é sem taxa e sem fila: basta responder esta mensagem.

**Mensagem 2 — Carlos (Grupo Feridos pela Operação · autoriza ser procurado · compensação decidida pela regra: reembolso da viagem que ficou em aberto + remarcação sem taxa + ligação de atendente, os três fora do teto; oferta de retorno BARRADA pelo freio de caso aberto):**

> Carlos, aqui é a [Empresa]. O veículo das 06h30 teve falha mecânica e a nova saída é às 07h15. Sabemos que na sua última viagem conosco você ficou sem nenhuma informação numa situação como esta — e isso não vai se repetir. Seu reembolso integral já está disponível, a remarcação é sem taxa, e um atendente com o seu histórico em mãos vai ligar em até cinco minutos. Você não vai precisar explicar nada duas vezes.

**Mensagem 3 — cena de falha do guardrail (obrigatória na demo):**

O agente gera uma redação com horário incorreto (07h05 em vez de 07h15). Exibir a redação descartada em cinza/riscado:

> ~~Diego, a saída das 06h30 foi remarcada para 07h05...~~

Canhoto: `Redação por IA descartada — horário divergente do fato travado (07h05 ≠ 07h15). Enviado template padrão.` Em seguida, exibir o template v1 efetivamente "enviado". Esta cena transforma o argumento da demo de "personalização bonita" em "personalização controlada".

### 3.4 Prompt de geração (registrado no repositório, não exibido na demo)

O prompt usado na pré-computação deve ser versionado junto desta spec, contendo: papel do agente, pacote de fatos travados em JSON, instruções de tom por segmento (Âncora: reconhecimento de frequência; Feridos: reconhecimento explícito da falha anterior, sem oferta comercial), proibição de inventar fatos, limite de tamanho (máx. 4 frases).

### 3.5 Confirmação de envio e o momento em que a compensação existe

Nenhuma mensagem sai sozinha, nem no modo template nem no modo IA. Cada mensagem aparece na
conversa marcada como **rascunho**, com um botão `Confirmar envio` ao lado. É a Trava 1 aplicada à
mensagem, do mesmo jeito que os três botões do copiloto (F2) e o `Aprovar lote` (F3) a aplicam ao
caso e ao lote.

O clique não muda só o rótulo: enquanto ele não vem, **a compensação não foi concedida**. O canhoto
a mostra como *pendente de confirmação de envio*, e ela não entra no custo da ocorrência — os
números separam *compensações concedidas* de *pendentes*. Confirmado o envio, o valor entra.

O teto é a exceção deliberada: continua sendo conferido sobre o que a regra **decidiu** conceder,
antes de qualquer clique. A conta contra o limite precisa aparecer antes de gastar, não depois — é
para isso que ela serve.

Uma consequência para quem apresenta: a tela abre com custo zero e tudo pendente. Isso é o
argumento, não um defeito — nada existe para o passageiro, nem a conta, antes de uma pessoa
apertar o botão.

---

## 4. F2 — Copiloto da Ouvidoria Ativa

### 4.1 Comportamento

Ao abrir um caso da fila (Grupo Feridos, 418 clientes — tratamento caso a caso já é a política aprovada), o copiloto apresenta:

1. **Dossiê montado automaticamente:** histórico de viagens, incidente que originou a evasão, gasto histórico, o que já foi oferecido antes, teto de compensação disponível para o caso.
2. **Proposta de ação:** texto de desculpas personalizado + benefício concreto **dentro do teto** (o valor vem da regra; o copiloto escolhe apenas a forma de apresentar).
3. **Painel de aprovação do atendente:** botões `Aprovar` · `Editar` · `Recusar e escrever do zero`. Nada sai sem clique humano — a Trava 1 vira botão na tela.

### 4.2 Conteúdo pré-computado — Caso Carlos

**Dossiê (dados fictícios da base sintética, valores marcados como exemplo):**

| Campo | Valor |
|---|---|
| Cliente | Carlos, 45 anos · perfil corporativo |
| Segmento | Grupo 5 — Feridos pela Operação |
| Histórico | 3 viagens · 2ª terminou em quebra sem aviso · sem contato há 6 meses |
| Gasto histórico | R$ 612 (exemplo) |
| Reclamação anterior | Aberta e **não respondida** — motivo da prioridade na fila |
| Consentimento | Autorizou ser procurado · oferta **retida pelo caso aberto**, não pela permissão |
| Teto disponível (regra) | Reembolso pendente + remarcação sem taxa + 1 cortesia até R$ 90 (exemplo) |

**Proposta do copiloto (texto pré-computado, aguardando aprovação):**

> Carlos, meu nome é [Atendente] e estou com o seu caso em mãos. Em [mês], o seu ônibus quebrou na estrada e você ficou sem qualquer aviso nosso — e depois ainda registrou uma reclamação que nunca foi respondida. Isso foi uma falha nossa, duas vezes. Quero corrigir o que der: seu reembolso daquela viagem está liberado agora, e se você decidir nos dar outra chance, a próxima remarcação é sem taxa e sem burocracia, direto comigo neste número. Sem robô, sem fila.

**Nota de guardrail exibida no painel:** `Oferta comercial (desconto de retorno) omitida — há reclamação em aberto, e convite comercial só depois de resolvê-la. Resolvido o caso, a oferta pode entrar na conversa.`

### 4.3 Cena de demo

1. Atendente abre a fila → caso do Carlos no topo (reclamação antiga sem solução fura a fila, regra já existente na v1).
2. Dossiê e proposta aparecem montados (streaming simulado no texto da proposta).
3. Atendente clica `Editar`, troca uma palavra, clica `Aprovar`. A edição humana faz parte do roteiro — mostra que o copiloto propõe e a pessoa decide.

---

## 5. F3 — Orquestrador de Ocorrência

### 5.1 Comportamento

Quando uma ocorrência entra, o orquestrador executa a sequência que na v1 era implícita e a apresenta como **um lote único para aprovação**: afetados identificados → regras aplicadas → freios checados → mensagens redigidas (via F1) → custo total calculado contra o teto → resumo para o operador aprovar em um clique.

### 5.2 Conteúdo pré-computado — Painel do lote

**Ocorrência:** quebra 06h12 · veículo com 42 passageiros (exemplo).

| Indicador | Valor |
|---|---|
| Passageiros afetados | 42 |
| Com contato cadastrado → mensagem pronta | 31 |
| Sem contato → equipe do terminal + painel acionados | 11 |
| Mensagens barradas por freio | 1 (oferta de retorno ao Carlos — reclamação em aberto) |
| Redações descartadas pelo validador → template | 1 (horário divergente) |
| Custo de compensação do lote | R$ 1.840 |
| Teto da ocorrência | R$ 2.000 |
| Tempo estimado da falha ao 1º aviso | 2 min |
| Ação pendente | **[ Aprovar lote ]** · [ Revisar caso a caso ] |

Após o clique em `Aprovar lote`, a tela "Números da ocorrência" da v1 é preenchida com os mesmos números — mostrando que o orquestrador alimenta a tela que o comitê já conhece.

### 5.3 Regra de exibição

Se o custo do lote estourasse o teto, o painel deve mostrar a ordem de corte da v1 (corta primeiro quem viaja pouco; nunca corta reembolso nem reacomodação) aplicada pelo sistema de regras — **não** pelo agente. Incluir uma variação pré-computada com estouro de teto como cena opcional, se houver tempo na apresentação.

---

## 6. Requisitos técnicos e de implementação

1. **Artefato único:** HTML/JS autocontido (mesma stack do protótipo v1), sem dependência de rede em tempo de apresentação. Todo conteúdo de IA embutido como constantes JSON.
2. **Streaming simulado:** efeito de digitação por caractere/palavra (40–60 ms), com indicador visual "gerando…". Nunca rotular como chamada ao vivo.
3. **Pré-computação real:** as saídas devem ser geradas de fato por LLM, uma vez, a partir dos prompts versionados. Guardar no repositório: prompt, pacote de fatos, saída bruta, saída aprovada. Isso sustenta a afirmação "este texto foi gerado por IA a partir destas regras" sem teatro.
4. **Reprodutibilidade:** script de geração (`gerar_conteudo_v2.py` ou equivalente) commitado, permitindo regenerar as saídas se os fatos da demo mudarem.
5. **Sem dados reais:** apenas os passageiros fictícios da base sintética. Nenhum dado pessoal verdadeiro nos prompts nem nas telas.

## 7. Atualização do quadro "O que é real e o que é simulado"

Substituir o texto da v1 pelo seguinte (ou equivalente aprovado pela equipe):

> **O que é real:** a lógica de decisão (regras, freios, ordem de corte) funciona de verdade e pode ser conferida passo a passo. Os textos marcados como "redação por IA" foram efetivamente gerados por inteligência artificial a partir dessas regras — gerados antes da apresentação e embutidos aqui, não ao vivo.
> **O que é simulado:** passageiros, viagens, ocorrências e valores são inventados; nenhuma mensagem é enviada de fato; o efeito de "digitação" é reproduzido, não gerado na hora.
> **O que ainda é aposta:** que personalização por IA reduza evasão é hipótese, como todo o programa. Validar exige piloto em linha real com grupo de controle — e, para a IA, medir taxa de erro de redação, custo por disparo e latência em escala, o que seis mensagens de demonstração não provam.

## 8. Critérios de aceitação

1. As três funcionalidades rodam offline, sem nenhuma requisição de rede durante a apresentação.
2. O toggle template/IA (F1) alterna o mesmo par Mariana/Carlos da v1, evidenciando o contraste em uma tela.
3. A cena de falha do guardrail (F1, msg 3) está presente e o canhoto registra o descarte com motivo legível.
4. O caso Carlos (F2) só é concluído após clique humano em `Aprovar`; o fluxo `Editar` está funcional na demo.
5. O painel do lote (F3) fecha a conta contra o teto e alimenta a tela "Números da ocorrência" existente.
6. O quadro de honestidade atualizado (seção 7) aparece no protótipo.
7. Prompts, fatos e saídas estão versionados no repositório junto desta spec.

## 9. Riscos e pontos abertos

1. **Risco de sobrepromessa:** o discurso da apresentação deve distinguir "lógica funcionando" de "capacidade operacional". A demo valida demonstrabilidade, não viabilidade em escala (8.000 clientes, centenas de ocorrências).
2. **Ponto aberto — tom por segmento:** os textos pré-computados desta spec são propostas; a equipe deve revisá-los antes de congelar (especialmente o reconhecimento explícito de falha no texto do Carlos, que tem implicação de admissão de responsabilidade — validar com quem responde pela comunicação).
3. **Ponto aberto — valores de exemplo:** gasto histórico do Carlos (R$ 612), cortesia (R$ 90) e tamanho do lote (42) são ilustrativos e devem ser marcados como tal na tela, no padrão da v1 ("os valores são de exemplo").
4. **Ponto aberto — dono da frente:** como as Lacunas 1 e 2 do deck de governança seguem abertas (dono executivo e cronograma), esta spec não define prazo de implementação.
