import { useState } from 'react';
import { QUADRO_DE_HONESTIDADE } from '../dadosV2';

/**
 * O quadro da seção 7: atualizado para a v2, não removido. Fica no cabeçalho,
 * a um clique de qualquer tela — é o contrato do protótipo com quem assiste.
 */
export function QuadroDeHonestidade() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:border-slate-800"
      >
        O que é real e o que é simulado
      </button>

      {aberto && (
        <div
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-300 bg-white p-5 shadow-lg"
          >
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">O que é real e o que é simulado</h2>
              <button
                onClick={() => setAberto(false)}
                className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:border-slate-800"
              >
                Fechar
              </button>
            </div>
            <div className="space-y-3">
              {QUADRO_DE_HONESTIDADE.map((bloco) => (
                <section key={bloco.titulo} className="border-l-2 border-slate-800 pl-3">
                  <h3 className="text-sm font-medium">{bloco.titulo}</h3>
                  <p className="text-sm text-slate-600">{bloco.texto}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
