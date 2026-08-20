// Regeneração do conteúdo de IA da v2 (spec v2, seção 6.4).
//
// Este script NÃO faz parte do protótipo. Ele roda fora da apresentação, à mão,
// quando os fatos da demo mudam; o `npm run build` não o inclui e o protótipo não
// o importa. Rodar com:
//
//     node --experimental-strip-types scripts/gerar_conteudo_v2.ts        # só registra
//     node --experimental-strip-types scripts/gerar_conteudo_v2.ts --gerar # chama o modelo
//
// Sem `--gerar`, o script apenas reescreve `conteudo-v2/` a partir do que já está
// aprovado em `src/dadosV2.ts` — prompt montado, pacote de fatos e saída aprovada.
// Com `--gerar`, ele precisa de uma chamada de modelo, que é o único ponto de rede
// do repositório inteiro e existe só aqui, nunca no runtime da interface.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PACOTES_DE_FATOS,
  PROMPT_COPILOTO,
  PROMPT_REDATOR,
  PROPOSTA_CARLOS,
  DOSSIE_CARLOS,
  REDACOES_IA,
} from '../src/dadosV2.ts';
import { validarRedacao } from '../src/validador.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'conteudo-v2');

/** Monta o prompt final substituindo o pacote de fatos travados. */
export function montarPromptDoRedator(passageiroId: string): string {
  const fatos = PACOTES_DE_FATOS[passageiroId];
  if (!fatos) throw new Error(`sem pacote de fatos para ${passageiroId}`);
  return PROMPT_REDATOR.replace('{{FATOS}}', JSON.stringify(fatos, null, 2));
}

export function montarPromptDoCopiloto(): string {
  const dossie = Object.fromEntries(DOSSIE_CARLOS.map((l) => [l.campo, l.valor]));
  return PROMPT_COPILOTO.replace('{{DOSSIE}}', JSON.stringify(dossie, null, 2)).replace(
    '{{TETO}}',
    JSON.stringify(
      {
        reembolso: 'pendente, fora do teto',
        remarcacao: 'sem taxa, fora do teto',
        cortesia: 'até R$ 90 (exemplo)',
      },
      null,
      2,
    ),
  );
}

/**
 * O passo manual. Não há cliente de LLM embutido de propósito: quem regenera
 * escolhe o modelo, cola o prompt, e traz de volta a saída bruta para o registro.
 * A saída bruta entra em `conteudo-v2/saida-bruta.md` e só vira constante em
 * `src/dadosV2.ts` depois de passar pelo validador e pela revisão da equipe
 * (seção 9, ponto 2: o tom do texto do Carlos precisa de aprovação humana).
 */
async function chamarModelo(_prompt: string): Promise<string> {
  throw new Error(
    'geração automática não configurada: cole o prompt impresso por este script no modelo ' +
      'escolhido, salve a saída bruta em conteudo-v2/saida-bruta.md e só então promova o texto ' +
      'a constante em src/dadosV2.ts.',
  );
}

function registrar() {
  mkdirSync(DESTINO, { recursive: true });

  const prompts = Object.keys(PACOTES_DE_FATOS)
    .map((id) => `## Pacote ${PACOTES_DE_FATOS[id].id}\n\n\`\`\`\n${montarPromptDoRedator(id)}\n\`\`\``)
    .join('\n\n');

  writeFileSync(
    join(DESTINO, 'prompt-redator.md'),
    `# Prompt do agente redator (F1)\n\nGerado por scripts/gerar_conteudo_v2.ts a partir de src/dadosV2.ts.\n\n${prompts}\n`,
  );

  writeFileSync(
    join(DESTINO, 'prompt-copiloto.md'),
    `# Prompt do copiloto da ouvidoria (F2)\n\nGerado por scripts/gerar_conteudo_v2.ts a partir de src/dadosV2.ts.\n\n\`\`\`\n${montarPromptDoCopiloto()}\n\`\`\`\n`,
  );

  writeFileSync(
    join(DESTINO, 'pacote-de-fatos.json'),
    JSON.stringify(PACOTES_DE_FATOS, null, 2) + '\n',
  );

  const vereditos = Object.entries(REDACOES_IA).map(([id, r]) => {
    const v = validarRedacao(PACOTES_DE_FATOS[id], r);
    return `## ${r.id}\n\n- passageiro: ${id}\n- veredito: ${v.valido ? 'aprovada' : 'descartada'}${
      v.motivo ? `\n- motivo: ${v.motivo}` : ''
    }\n\n> ${r.texto}\n`;
  });

  writeFileSync(
    join(DESTINO, 'saida-aprovada.md'),
    `# Saídas embutidas no protótipo\n\nConferidas pelo validador de fatos a cada rodada de teste.\n\n${vereditos.join(
      '\n',
    )}\n## ${PROPOSTA_CARLOS.id}\n\n> ${PROPOSTA_CARLOS.texto}\n`,
  );

  console.log(`registro reescrito em ${DESTINO}`);
}

if (process.argv.includes('--gerar')) {
  await chamarModelo(montarPromptDoRedator('p-01'));
} else {
  registrar();
}
