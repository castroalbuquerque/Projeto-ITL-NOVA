import { etiquetaDeGrupo, type Passageiro } from '../dados';

/**
 * Etiqueta de grupo. Quem está fora dos conjuntos aparece com o marcador
 * apagado — a p.7 é explícita em que estar fora não é um sétimo grupo.
 */
export function Etiqueta({ p }: { p: Passageiro }) {
  const fora = p.grupo === null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${fora ? 'bg-slate-300' : 'bg-slate-600'}`}
      />
      <span className={fora ? 'text-slate-400' : 'text-slate-600'}>{etiquetaDeGrupo(p)}</span>
    </span>
  );
}
