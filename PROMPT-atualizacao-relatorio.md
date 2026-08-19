# Prompt para atualizar o relatório visual

Copie o bloco abaixo para a sessão onde o relatório de sete páginas é editado.

---

Você vai atualizar o relatório visual de sete páginas da Central de Transparência
(`fluxo-central-transparencia.pdf`) para que ele corresponda ao protótipo que foi construído.
Até agora o relatório era a fonte da verdade; a partir de agora o código é, porque foi ao
implementar que as contradições apareceram.

**Não mude** o layout, a paleta, a tipografia, a estrutura de páginas nem o tom do texto: são
sete páginas de relatório executivo em português, sem emoji, com rodapé de fonte em cada uma e
uma ressalva honesta por página. Mude **apenas** o conteúdo listado abaixo. Onde eu der um texto
entre aspas, use-o literalmente: são as strings que o sistema realmente produz.

## Página 1 — a mesma falha, duas respostas

1. **Os freios passaram de três para cinco.** O bloco "OS TRÊS FREIOS DO SISTEMA" vira "OS
   CINCO FREIOS DO SISTEMA". O primeiro dos novos entra **antes de todos**, na frente de permissão:

   > **CAMINHO ATÉ A PESSOA.** Antes de perguntar qualquer outra coisa, o sistema pergunta se
   > existe por onde chegar até o passageiro. Sem contato cadastrado nenhuma mensagem sai — nem
   > o aviso da viagem que ele comprou. O sistema passa a avisar a equipe do terminal e o painel
   > de partidas, e registra que não conseguiu falar com a pessoa.

   Este é o freio que mais aparece no protótipo e o que a página 3 inteira discute. Ele estar
   ausente da lista de freios era a maior incoerência do relatório.

   O segundo entra **logo depois de permissão**:

   > **CASO ABERTO.** Quem tem uma reclamação sem solução não recebe convite comercial nenhum
   > enquanto ela não for resolvida. A mensagem que reconhece a falha e chama o atendente continua
   > saindo — essa é atendimento, não propaganda, e não depende de o cliente ter autorizado
   > receber ofertas. O que espera é a oferta, nunca o atendimento.

2. **O cartão da Mariana ganha a ligação.** Hoje ele lista três decisões e nenhuma é ligação. A
   regra de quebra manda somar ligação de atendente para os grupos 1 e 2, e ela é do grupo 1.
   Acrescente como quarto item: "Ligação de um atendente em até 10 minutos".

3. **O cartão do Carlos perde o reembolso.** Hoje lista "Reembolso integral e remarcação sem
   taxa". Reembolso integral é a compensação de cancelamento; nenhuma regra de quebra o prevê, e
   o protótipo não o concede. Troque por: "Crédito de 30% e remarcação sem taxa" — igual ao da
   Mariana, porque a compensação da quebra não muda com o grupo. O que muda para ele é o texto e
   o prazo da ligação.

4. **A ligação do Carlos ganha prazo próprio.** Troque "Avisar em até 2 minutos, com ligação de
   um atendente" por dois itens: "Avisar em até 2 minutos pelo aplicativo de mensagens" e
   "Ligação de um atendente em até 5 minutos". Os 5 minutos vêm de uma regra criada para o grupo
   5, que a página 7 já descreve como "atendimento caso a caso, um a um" — o relatório dava essa
   ligação a ele sem dizer de que regra ela saía.

5. **Os dois textos de mensagem passam a ser estes, literalmente:**

   > **Mariana** — "Mariana, o veículo das 06h30 na Capital–Interior teve falha mecânica. Já
   > acionamos a troca e a saída passa para 07h15. Seu assento está garantido. Um crédito de 30% entra na sua
   > conta hoje e a remarcação fica livre, sem taxa."

   > **Carlos** — "Carlos, houve falha mecânica no veículo das 06h30 na Capital–Interior e a
   > saída passa para 07h15. Na sua última viagem você ficou sem informação, e isso não vai se repetir: um
   > atendente está com o seu caso e liga em cinco minutos. Um crédito de 30% entra na sua conta
   > hoje e a remarcação fica livre, sem taxa."

6. **A régua de quatro avisos** (duas horas antes, na saída, na estrada, na chegada) não foi
   implementada: só existe a mensagem de pré-embarque. Ou marque o bloco como "previsto, ainda
   não construído", ou reduza-o ao pré-embarque e à pesquisa de nota, que existem de verdade.
   Não deixe como está, porque hoje ele descreve como pronto algo que não roda.

## Página 2 — o freio de gasto

7. **A conta inteira muda, porque a antiga não fechava.** A coluna de reembolso implicava
   passagem de R$ 155 (1.395 ÷ 9); a de crédito extra implicava cerca de R$ 63 por pessoa, que é
   40% da passagem e não os 20% da regra. Mantivemos o teto de R$ 2.000, que está na regra, e a
   passagem passou a R$ 310 — o que também exigiu dar identidade à linha. Substitua a tabela
   "A CONTA INTEIRA DA OCORRÊNCIA" por:

   | Grupo de passageiros | Pessoas | Dinheiro de volta | Crédito extra pedido | Crédito extra pago |
   |---|---|---|---|---|
   | Viajam toda semana | 9 | R$ 2.790 | R$ 558 | R$ 558 |
   | Viajam todo mês | 18 | R$ 5.580 | R$ 1.116 | R$ 1.116 |
   | Viajam raramente ou é a primeira vez | 15 | R$ 4.650 | R$ 930 | R$ 310 |
   | **Total da ocorrência** | **42** | **R$ 13.020** | **R$ 2.604** | **R$ 1.984** |

8. **Os números do corte:** "Dentro do limite · R$ 2.000 / Acima do limite · R$ 640 cortados"
   vira "Pago · R$ 1.984 / Cortado pelo teto · R$ 620". E o total pago não é R$ 2.000 redondos
   porque o corte para assim que passa do teto — não dá para cortar fração de pessoa.

9. **Não são mais quinze pessoas sem crédito, são dez.** A frase "foi por isso que quinze pessoas
   ficaram sem ele" vira "foi por isso que dez pessoas ficaram sem ele". Cinco da faixa de menor
   frequência mantiveram o crédito: o corte parou antes de alcançá-las.

10. **O cabeçalho da ocorrência** ganha a identidade da linha, que sustenta a tarifa de R$ 310:
    "Cancelamento da viagem das 06h00 · linha capital–sul, 780 quilômetros · passagem de R$ 310 ·
    42 passageiros a bordo · nenhum veículo reserva na garagem".

11. **As três mensagens da página passam a ser a mesma, com o nome trocado.** Hoje a página traz
    três textos distintos para Ana Paula, Beatriz e Diego. O motor escolhe o texto por ocorrência e
    tom, não por perfil, e os três têm o mesmo tom — a diferença entre eles aparece na compensação,
    não na redação. Isso foi decidido: o relatório mostra o mesmo texto três vezes. Use estes:

    > **Ana Paula** — "Ana Paula, a viagem das 06h00 na Capital–Sul foi cancelada por falta de
    > veículo. Seu lugar já está reservado na saída das 08h00 e o valor volta integral hoje. Um crédito de 20% fica na sua
    > conta pelo transtorno."

    > **Beatriz** — "Beatriz, a viagem das 06h00 na Capital–Sul foi cancelada por falta de veículo.
    > Seu lugar já está reservado na saída das 08h00 e o valor volta integral hoje."

    > **Diego** — "Diego, a viagem das 06h00 na Capital–Sul foi cancelada por falta de veículo.
    > Seu lugar já está reservado na saída das 08h00 e o valor volta integral hoje."

    A frase a mais da Ana Paula é o crédito de 20% que ela manteve e os outros dois perderam para o
    teto. Repetir o texto e variar só a última frase é o ponto da página, não um defeito dela: prova
    que o corte do teto muda o que o passageiro lê, sem que ninguém reescreva mensagem à mão.

## Página 3 — quem compra no guichê fica sem aviso

12. **O texto do Diego muda em uma palavra.** O protótipo foi ajustado para escrever horário à
    brasileira (23h50, não 23:50) e para dizer qual saída atrasou, que era o que a página já fazia
    melhor que o código. Sobrou uma diferença, o nome da linha:

    > "Diego, a saída das 22h30 **na Capital–Nordeste** atrasou e sai às 23h50. Você pode esperar na
    > praça de alimentação e avisamos quinze minutos antes do embarque. Um crédito de 15% já está na
    > sua conta."

13. **O que o sistema fez pela Rosa** passa a ser exatamente estes dois textos, que são o que sai
    no painel e no guichê:

    > **Painel de partidas** — "Capital–Nordeste · plataforma 12 · nova saída 23h50 · atraso
    > confirmado"

    > **Instrução ao guichê** — "Anunciar na plataforma 12: Capital–Nordeste atrasada, nova saída
    > 23h50. Informar um a um os passageiros sem contato cadastrado e recolher um telefone para o
    > próximo aviso."

    Repare que a instrução ao guichê **não promete crédito nenhum**, e isso é deliberado: a própria
    página já mostra "depositar o crédito de 15% na conta" como barrado para ela. Prometer no
    guichê o que o sistema barrou seria contradizer a página no meio dela mesma.

## Página 4 — a reconquista

14. **A mensagem do Jorge continua como está, e agora o protótipo a sustenta.** Quando escrevi este
    prompt, o convite saía genérico — "a sua linha", com um horário inventado — porque o gatilho de
    win-back nasce de uma revisão mensal de quem sumiu e não carrega viagem nenhuma. Isso foi
    construído depois: cada passageiro passou a ter uma linha habitual, e cada linha, um registro do
    que mudou nela. O texto que sai hoje é este, e a página não precisa mudar:

    > "Jorge, faz tempo que você não viaja com a gente. Na Capital–Interior, agora há saída também
    > às 19h, com poltrona que reclina mais. Se quiser experimentar, a próxima viagem sai com 25% de
    > desconto até domingo."

15. **O caminho "sumiu logo depois de uma falha" ganhou uma personagem e uma regra.** Quando escrevi
    este prompt, o terceiro caminho da página — quem sumiu depois de uma falha recebe desculpa antes
    de oferta — estava desenhado e nunca disparava: o único passageiro com caso aberto era o Carlos,
    e o freio da autorização barrava tudo antes. Isso foi resolvido com uma decisão de política:
    **resolver o caso de quem pagou é atendimento, não propaganda**, e portanto não depende de
    autorização comercial. A base legal é o contrato de transporte que falhou.

    A página passa a ter quatro respostas para a mesma revisão mensal, e vale mostrar as quatro,
    porque juntas elas separam três perguntas que costumam andar embaralhadas:

    | Quem | O que recebe | O que fica retido, e por quê |
    |---|---|---|
    | Jorge | convite, com o que mudou na linha dele | nada |
    | **Helena** (nova) | desculpa e ligação de atendente | o convite, só pelo caso aberto |
    | Carlos | desculpa e ligação de atendente | o convite, pelo caso aberto e pela falta de autorização |
    | Sandra | nada | tudo: não há caminho até ela nem autorização |

    **Helena é nova e existe por um motivo:** ela autorizou receber ofertas e tem caso aberto, então
    é a única em que o caso aberto aparece sozinho como motivo da retenção. No Carlos os dois
    motivos se sobrepõem, e quem olha só o cartão dele conclui que é a falta de autorização que
    segura o convite — quando na verdade nem resolver a autorização o liberaria. Acrescente-a à
    página com este perfil: 52 anos, quatro viagens em dois anos, sumiu há cinco meses, compra pelo
    aplicativo, autorizou receber ofertas, e a última viagem dela foi cancelada sem realocação, com
    o caso aberto até hoje. Grupo 5 · Feridos pela Operação, como o Carlos.

    O texto que ela e o Carlos recebem é este:

    > "{Nome}, sua última viagem na {linha} terminou mal e o caso continua aberto do nosso lado.
    > Antes de qualquer oferta queremos resolver isso: um atendente liga para você ainda hoje."

    Repare que **não há oferta nenhuma na mensagem**, de propósito: desculpa e oferta na mesma
    mensagem estragam as duas, que é o que a própria página já dizia em "Trocar os dois estraga a
    mensagem".

## Página 5 — o grupo esquecido

16. **A mensagem da Letícia** confere e fica como está. Sobre o Marcos, acrescente o que o sistema
    faz em vez de enviar: "Registrado em lista à parte — o contato fora do digital depende de
    decisão de uma pessoa". Hoje a página diz que nada sai, mas não diz o que fica registrado.

## Página 6 — o grupo sem campanha

17. **O padrão detectado do Wilson.** A página diz "Três passagens compradas e não usadas em seis
    meses", mas o próprio cartão diz que ele comprou seis e embarcou em duas, o que dá quatro.
    Três é o limiar da regra, quatro é o caso dele. Corrija para "Quatro passagens compradas e não
    usadas em seis meses · limiar da regra: três".

## Página 7 — o mapa

18. **A política do grupo 5** ganha o prazo que a regra nova define: "Desculpa com algo concreto e
    atendimento caso a caso, um a um, com ligação em até cinco minutos".

19. **A tabela dos seis conjuntos** ganha a Helena: o grupo 5 passa a ter dois representantes,
    "Carlos, Helena", e a nota de rodapé passa de sete para oito personagens cobrindo os seis
    conjuntos. O elenco agora é de doze pessoas, não onze.

20. **O quadro de duas perguntas** está correto e não muda. Ele foi o que mais se confirmou na
    implementação: os doze passageiros caem exatamente nos quatro quadrantes descritos, e o Marcos
    continua sendo o único caso em que autorização e alcance apontam para lados diferentes. A
    Helena entra no quadrante "tudo pode" — e é justamente ela que mostra que **caber no quadrante
    de cima à esquerda não basta**: o caso aberto retém o convite dela mesmo ali.

## Ao terminar

Liste, em não mais que dez linhas, o que você mudou. Não há mais decisão em aberto para você tomar:
o item 15 pede que você registre uma pergunta na página, não que a responda. Se encontrar no relatório alguma outra afirmação que o protótipo não sustenta,
diga qual — não conserte sozinho.
