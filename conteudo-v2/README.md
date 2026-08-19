# conteudo-v2

Registro da pré-computação das saídas de IA da v2 (spec v2, seções 3.4 e 6.3).

| Arquivo | O que é |
|---|---|
| `prompt-redator.md` | prompt do agente redator (F1), um bloco por pacote de fatos |
| `prompt-copiloto.md` | prompt do copiloto da ouvidoria (F2) |
| `pacote-de-fatos.json` | os fatos travados que o agente não pode alterar |
| `saida-bruta.md` | proveniência da rodada e a redação reprovada pelo validador |
| `saida-aprovada.md` | o que está embutido no protótipo, com o veredito de cada texto |

Tudo aqui é gerado por `npm run gerar:conteudo` a partir de `src/dadosV2.ts`, menos
`saida-bruta.md`, que é o registro manual da rodada de geração.

Nada nesta pasta é lido pelo protótipo em tempo de execução: o conteúdo que vai para a tela é o
de `src/dadosV2.ts`, e o `npm run build` não inclui esta pasta nem `scripts/`.
