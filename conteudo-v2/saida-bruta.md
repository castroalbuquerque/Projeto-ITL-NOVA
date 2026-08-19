# Saída bruta do agente

Registro exigido pela seção 6.3 da spec v2: prompt, pacote de fatos, saída bruta e
saída aprovada versionados junto do código.

## Proveniência desta rodada

Os textos embutidos em `src/dadosV2.ts` são os que constam das seções 3.3 e 4.2 da
`SPEC-central-transparencia-v2.md`, redigidos com auxílio de modelo de linguagem durante a
escrita da spec e trazidos daqui para o protótipo sem alteração de conteúdo. **Não houve, até
agora, uma rodada de geração executada por este repositório**: `scripts/gerar_conteudo_v2.ts`
monta o prompt e o pacote de fatos e para antes da chamada de modelo, que é manual por decisão
de projeto (o protótipo não pode ter cliente de LLM, nem em ferramenta de apoio).

Quando a rodada real acontecer, este arquivo deve passar a conter, para cada texto: modelo e
versão, data, temperatura, prompt exato e a resposta do modelo copiada sem edição — antes de
qualquer revisão humana. O que estiver em `saida-aprovada.md` é o que foi para a tela.

## Redação descartada pelo validador (F1, mensagem 3)

Saída bruta para o pacote `fatos-diego-quebra`, reprovada antes de qualquer exibição como
mensagem enviada:

> Diego, a saída das 06h30 foi remarcada para 07h05 por falha mecânica no veículo. Seu assento
> continua garantido na mesma plataforma e um crédito de 30% já entrou na sua conta.

Veredito do validador: `horário divergente do fato travado (07h05 ≠ 07h15)`.
Destino: descartada, template da v1 enviado no lugar, motivo registrado no canhoto.

Ela fica no repositório de propósito. É a evidência de que o descarte não é encenação: o texto
existe, o erro é real, e quem quiser conferir roda `npm test`.

## Pendência aberta (seção 9, ponto 2)

O reconhecimento explícito de falha no texto do Carlos tem implicação de admissão de
responsabilidade e ainda precisa do aval de quem responde pela comunicação. Até lá, o texto está
no protótipo como proposta, não como texto aprovado para uso real.
