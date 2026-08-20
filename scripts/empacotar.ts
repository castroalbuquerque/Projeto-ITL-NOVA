// Empacota o protótipo em um único arquivo HTML, para baixar e abrir com duplo
// clique — sem instalar nada, sem servidor e sem internet. É o "artefato único
// autocontido" que a seção 6.1 da spec v2 pede.
//
// Rodar com: npm run empacotar
//
// O que ele faz: costura o CSS, o JavaScript e o ícone gerados por
// `vite build --config vite.config.pacote.ts` dentro do index.html, e escreve o
// resultado em pacote/. Nenhuma requisição sobra no arquivo final.

import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEM = join(RAIZ, 'dist-pacote');
const DESTINO = join(RAIZ, 'pacote');
const ARQUIVO = 'central-de-transparencia-v2.html';

/** `</script>` dentro do JavaScript fecharia a tag cedo demais. */
function protegerFechamento(js: string): string {
  return js.replace(/<\/script/gi, '<\\/script');
}

function ler(nome: string): string {
  return readFileSync(join(ORIGEM, nome), 'utf-8');
}

function empacotar() {
  const css = ler('pacote.css');
  const js = ler('pacote.js');
  const icone = ler('favicon.svg');

  let html = ler('index.html');

  // Todas as substituições usam função em vez de texto: `$&` e `$'` dentro do
  // CSS ou do JavaScript são padrões especiais de String.replace e inflariam o
  // arquivo com pedaços repetidos da própria página.
  const iconeEmBase64 = Buffer.from(icone).toString('base64');

  html = html
    .replace('<html lang="en">', () => '<html lang="pt-BR">')
    .replace(
      /<link rel="icon"[^>]*>/,
      () =>
        `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${iconeEmBase64}" />`,
    )
    .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>\n${css}\n</style>`)
    .replace(/<script type="module"[^>]*><\/script>/, () => '');

  // Conferido antes de injetar o JavaScript: depois disso, qualquer `src=` é
  // string dentro do código empacotado, não referência da página.
  const sobraram = html.match(/(src|href)="(?!data:)[^"]+"/g);
  if (sobraram) {
    throw new Error(`ainda há arquivo externo referenciado: ${sobraram.join(', ')}`);
  }

  html = html.replace(
    '</body>',
    () => `  <script>\n${protegerFechamento(js)}\n</script>\n  </body>`,
  );

  mkdirSync(DESTINO, { recursive: true });
  const caminho = join(DESTINO, ARQUIVO);
  writeFileSync(caminho, html);

  const kb = Math.round(statSync(caminho).size / 1024);
  console.log(`pacote/${ARQUIVO} — ${kb} kB, um arquivo só, abre com duplo clique`);
}

empacotar();
