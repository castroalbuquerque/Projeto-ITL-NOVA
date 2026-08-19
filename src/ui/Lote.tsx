import { useState } from 'react';
import { AVISO_DE_EXEMPLO, LOTE, LOTE_COM_ESTOURO, PASSOS_DO_ORQUESTRADOR } from '../dadosV2';
import { ordemDeCorte } from '../motor';

function real(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * F3 — orquestrador de ocorrência (seção 5). A sequência que na v1 era implícita
 * vira um lote único: afetados, regras, freios, redações, custo contra o teto e
 * um clique de aprovação. O agente prepara; quem aprova é uma pessoa.
 */
export function PainelDoLote({
  aprovado,
  aoAprovar,
  aoFechar,
}: {
  aprovado: boolean;
  aoAprovar: () => void;
  aoFechar: () => void;
}) {
  const [caso, setCaso] = useState<string | null>(null);
  const [estouro, setEstouro] = useState(false);

  const dentroDoTeto = LOTE.custoCompensacao <= LOTE.teto;
  const corte = ordemDeCorte(LOTE_COM_ESTOURO.candidatos, LOTE_COM_ESTOURO.teto);

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Orquestrador · lote da ocorrência
        </span>
        <button
          onClick={aoFechar}
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-slate-800"
        >
          Voltar à conversa
        </button>
      </div>

      <div className="space-y-4 p-4">
        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="text-sm font-medium">{LOTE.titulo}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{AVISO_DE_EXEMPLO}</p>
          <ol className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            {PASSOS_DO_ORQUESTRADOR.map((passo, i) => (
              <li key={passo} className="flex items-center gap-1">
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{passo}</span>
                {i < PASSOS_DO_ORQUESTRADOR.length - 1 && <span className="text-slate-300">→</span>}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <tbody>
              {LOTE.indicadores.map((ind) => (
                <tr key={ind.rotulo} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-1.5 text-slate-600">
                    {ind.rotulo}
                    {ind.detalhe && <span className="text-slate-400"> · {ind.detalhe}</span>}
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums whitespace-nowrap">
                    {ind.valor}
                    {ind.exemplo && (
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        · {AVISO_DE_EXEMPLO}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            className={`border-t px-3 py-2 text-sm ${
              dentroDoTeto
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            {dentroDoTeto
              ? `Fecha dentro do teto: ${real(LOTE.custoCompensacao)} de ${real(LOTE.teto)}, sobram ${real(LOTE.teto - LOTE.custoCompensacao)}.`
              : `Estoura o teto: ${real(LOTE.custoCompensacao)} contra ${real(LOTE.teto)}.`}
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-2">
          <button
            onClick={aoAprovar}
            disabled={aprovado}
            className="rounded border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {aprovado ? 'Lote aprovado' : 'Aprovar lote'}
          </button>
          <button
            onClick={() => setCaso(caso ? null : 'aberto')}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:border-slate-800"
          >
            Revisar caso a caso
          </button>
          <button
            onClick={() => setEstouro((v) => !v)}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:border-slate-800"
          >
            {estouro ? 'Esconder variação com estouro de teto' : 'Ver variação com estouro de teto'}
          </button>
        </section>

        {aprovado && (
          <div className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm">
            <div className="font-medium">Lote aprovado pelo operador</div>
            <div className="text-slate-600">
              A tela "Os números da ocorrência", à direita, está preenchida com estes mesmos
              números. Nada foi enviado: este é um protótipo.
            </div>
          </div>
        )}

        {caso && (
          <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            Revisar caso a caso volta para a conversa da ocorrência, mensagem por mensagem, com o
            canhoto da decisão ao lado — é a tela da v1, que o lote resume.
          </div>
        )}

        {estouro && (
          <section className="rounded-lg border border-red-200 bg-white p-3">
            <h3 className="text-sm font-medium">{LOTE_COM_ESTOURO.titulo}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Benefício extra pedido {real(corte.pedido)} · teto {real(LOTE_COM_ESTOURO.teto)} ·
              pago {real(corte.pago)}. O corte é do motor de regras, não do agente: começa por quem
              viaja menos e para assim que couber no teto.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Fora do teto, nunca cortados: {LOTE_COM_ESTOURO.foraDoTeto.join(' · ')}.
            </p>
            <ul className="mt-2 space-y-0.5 text-xs">
              {corte.cortes.slice(0, 5).map((c, i) => (
                <li key={i} className="flex justify-between text-slate-600">
                  <span>
                    {i + 1}º corte · {c.nome}
                  </span>
                  <span className="tabular-nums">−{real(c.valor)}</span>
                </li>
              ))}
              {corte.cortes.length > 5 && (
                <li className="text-slate-400">
                  e mais {corte.cortes.length - 5} passageiros, na mesma ordem
                </li>
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
