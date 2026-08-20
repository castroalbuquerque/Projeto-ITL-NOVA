import { useEffect, useMemo, useState } from 'react';
import { ROTULO_DE_GERACAO, msDaPalavra } from '../dadosV2';

/**
 * Streaming simulado (seção 6.2): 40 a 60 ms por palavra sobre texto que já
 * existe como constante. Não há chamada de modelo aqui, nem em lugar nenhum do
 * runtime — o efeito é de digitação, e a spec proíbe rotulá-lo como geração ao vivo.
 */
export function useStreamingDeTexto(texto: string, ativo: boolean) {
  const palavras = useMemo(() => texto.split(' '), [texto]);
  const [reveladas, setReveladas] = useState(ativo ? 0 : palavras.length);

  useEffect(() => {
    if (!ativo) {
      setReveladas(palavras.length);
      return;
    }
    setReveladas(0);
    let i = 0;
    let cancelado = false;
    let id = 0;
    const proxima = () => {
      if (cancelado) return;
      i += 1;
      setReveladas(i);
      if (i < palavras.length) id = window.setTimeout(proxima, msDaPalavra(i));
    };
    id = window.setTimeout(proxima, msDaPalavra(0));
    return () => {
      cancelado = true;
      window.clearTimeout(id);
    };
  }, [ativo, palavras]);

  return {
    visivel: palavras.slice(0, reveladas).join(' '),
    gerando: reveladas < palavras.length,
  };
}

export function TextoEmStreaming({
  texto,
  ativo,
  className,
  rotulo,
}: {
  texto: string;
  ativo: boolean;
  className?: string;
  /** Etiqueta à esquerda do indicador, na linha de cima do texto. */
  rotulo?: string;
}) {
  const { visivel, gerando } = useStreamingDeTexto(texto, ativo);
  return (
    <div>
      {(rotulo !== undefined || gerando) && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] tracking-wide text-slate-500 uppercase">
            {rotulo ?? ''}
          </span>
          <IndicadorDeGeracao ativo={gerando} />
        </div>
      )}
      <div className={className}>
        {visivel}
        {gerando && <span className="ml-0.5 inline-block animate-pulse text-slate-400">▍</span>}
      </div>
    </div>
  );
}

/** Indicador visual enquanto o texto entra. Nunca diz "ao vivo". */
export function IndicadorDeGeracao({ ativo }: { ativo: boolean }) {
  if (!ativo) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-violet-700">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
      {ROTULO_DE_GERACAO}
    </span>
  );
}
