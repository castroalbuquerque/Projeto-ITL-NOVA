import { passageiroPorId, type Passageiro, type Viagem } from '../dados';
import { Etiqueta } from './Etiqueta';

export interface Caso {
  passageiroId: string;
  /** Ausente no caso que já estava aberto antes de qualquer pesquisa. */
  nota?: number;
  titulo?: string;
  ocorrencia: string;
  prazoHoras: number;
  prioridade: 'elevada' | 'normal';
}

export const NOTA_DE_CASO = 6; // nota igual ou abaixo disto abre caso

export function casosDe(
  notas: Record<string, number>,
  ocorrenciaPorViagem: Record<string, string>,
): Caso[] {
  const casos: Caso[] = [];
  for (const [chave, nota] of Object.entries(notas)) {
    if (nota > NOTA_DE_CASO) continue;
    const [viagemId, passageiroId] = chave.split(':');
    const p = passageiroPorId(passageiroId);
    // Quem já tinha reclamação sem solução entra na frente (p.1 do relatório).
    const elevada = p.ocorrenciasAbertas > 0;
    casos.push({
      passageiroId,
      nota,
      ocorrencia: ocorrenciaPorViagem[viagemId] ?? 'viagem sem ocorrência registrada',
      prazoHoras: elevada ? 24 : 72,
      prioridade: elevada ? 'elevada' : 'normal',
    });
  }
  return casos.sort(
    (a, b) =>
      Number(b.prioridade === 'elevada') - Number(a.prioridade === 'elevada') ||
      (a.nota ?? 0) - (b.nota ?? 0),
  );
}

/** Pesquisa de nota, na chegada. Quem não tem contato não é perguntado. */
export function Pesquisa({
  viagem,
  alvos,
  notas,
  aoResponder,
}: {
  viagem: Viagem;
  alvos: Passageiro[];
  notas: Record<string, number>;
  aoResponder: (passageiroId: string, nota: number) => void;
}) {
  return (
    <section className="px-4 pb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-500">
          Chegada · {viagem.linha} · pesquisa de nota
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-3">
        {alvos.map((p) => {
          const nota = notas[`${viagem.id}:${p.id}`];
          const semContato = !p.temContato;
          return (
            <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{p.nome}</span>
                <Etiqueta p={p} />
              </div>

              {semContato ? (
                <div className="border-l-4 border-amber-400 bg-amber-50 px-3 py-2">
                  <div className="mb-0.5 font-mono text-[10px] tracking-wide text-amber-700 uppercase">
                    B0 · alcance · não é mensagem
                  </div>
                  <div className="text-sm text-slate-800">
                    Sem contato cadastrado: a pesquisa não pode ser enviada e esta viagem fica sem
                    nota.
                  </div>
                </div>
              ) : (
                <>
                  <div className="max-w-prose rounded-lg rounded-tl-none bg-emerald-50 px-3 py-2 text-sm text-slate-800">
                    {p.nome}, você chegou. De 0 a 10, o quanto recomendaria esta viagem a alguém?
                    Responda com um número; se for baixo, um atendente procura você.
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Array.from({ length: 11 }, (_, n) => (
                      <button
                        key={n}
                        onClick={() => aoResponder(p.id, n)}
                        className={`h-7 w-7 rounded border text-xs ${
                          nota === n
                            ? n <= NOTA_DE_CASO
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-slate-800 bg-slate-800 text-white'
                            : 'border-slate-200 hover:border-slate-500'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {nota !== undefined && (
                    <div className="mt-1 text-xs text-slate-500">
                      nota {nota} ·{' '}
                      {nota <= NOTA_DE_CASO
                        ? 'abre caso na ouvidoria'
                        : 'nenhum caso aberto'}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function FilaDeCasos({
  casos,
  aoAbrir,
}: {
  casos: Caso[];
  /** Abre o caso no copiloto da ouvidoria (F2). */
  aoAbrir?: (passageiroId: string) => void;
}) {
  if (casos.length === 0) return null;
  return (
    <section className="border-t border-slate-200 px-4 py-3">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Fila de casos · {casos.length}
      </h2>
      <ul className="space-y-2">
        {casos.map((c, i) => {
          const p = passageiroPorId(c.passageiroId);
          const elevada = c.prioridade === 'elevada';
          return (
            <li
              key={`${c.passageiroId}-${i}`}
              className={`rounded border-l-4 p-2 text-xs ${
                elevada ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-slate-50'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{p.nome}</span>
                {c.nota !== undefined && <span className="tabular-nums">nota {c.nota}</span>}
              </div>
              {c.titulo && <div className="text-slate-700">{c.titulo}</div>}
              <div className="text-slate-600">{c.ocorrencia}</div>
              <div className="mt-1 flex justify-between text-slate-500">
                <span>
                  {elevada ? 'prioridade elevada · ocorrência aberta' : 'prioridade normal'}
                </span>
                <span>responder em {c.prazoHoras} h</span>
              </div>
              {aoAbrir && (
                <button
                  onClick={() => aoAbrir(c.passageiroId)}
                  className="mt-1.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:border-slate-800"
                >
                  Abrir no copiloto
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
