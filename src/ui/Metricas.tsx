import type { Resumo } from '../motor';

const NOME_DO_BLOQUEIO: Record<string, string> = {
  B0: 'sem contato (alcance)',
  B1: 'sem autorização',
  B2: 'limite de 3 avisos',
  B3: 'teto da ocorrência',
};

function real(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Metricas({ resumo, pessoas }: { resumo: Resumo; pessoas: number }) {
  const cobertura = pessoas === 0 ? 0 : Math.round((resumo.pessoasAvisadas / pessoas) * 100);
  const bloqueios = Object.entries(resumo.bloqueiosPorMotivo);

  return (
    <section className="border-t border-slate-200 px-4 py-3 text-sm">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Os números da ocorrência
      </h2>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-slate-500">Cobertura</span>
        <span className="text-right font-medium">
          {cobertura}% · {resumo.pessoasAvisadas} de {pessoas}
        </span>

        <span className="text-slate-500">Custo dos disparos</span>
        <span className="text-right">{real(resumo.custoDisparos)}</span>

        <span className="text-slate-500">Compensações</span>
        <span className="text-right">{real(resumo.custoCompensacoes)}</span>

        <span className="text-slate-500">Custo da ocorrência</span>
        <span className="text-right font-medium">{real(resumo.custoTotal)}</span>
      </div>

      {/* O número da p.3: não é um bloqueio entre outros, é o buraco do sistema. */}
      <div className="mt-3 border-l-2 border-slate-800 bg-slate-50 py-2 pl-3">
        <div className="text-2xl leading-none font-semibold">
          {resumo.semAvisoPorFaltaDeContato}
        </div>
        <div className="text-xs text-slate-600">
          ficaram sem aviso por falta de contato
        </div>
      </div>

      {bloqueios.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-xs text-slate-500">Mensagens bloqueadas, por motivo</div>
          <ul className="space-y-0.5">
            {bloqueios.map(([id, n]) => (
              <li key={id} className="flex justify-between">
                <span className="text-slate-600">
                  <span className="font-mono text-xs">{id}</span> · {NOME_DO_BLOQUEIO[id] ?? id}
                </span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {resumo.cortesPorTeto.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-xs text-slate-500">
            Cortes pelo teto — {resumo.cortesPorTeto.length} pessoas, de{' '}
            {real(resumo.beneficioExtraPedido)} pedidos para {real(resumo.beneficioExtraPago)} pagos
          </div>
          <ul className="space-y-0.5 text-xs">
            {resumo.cortesPorTeto.slice(0, 4).map((c, i) => (
              <li key={i} className="flex justify-between text-slate-600">
                <span>{c.nome}</span>
                <span>−{real(c.valor)}</span>
              </li>
            ))}
            {resumo.cortesPorTeto.length > 4 && (
              <li className="text-slate-400">
                e mais {resumo.cortesPorTeto.length - 4} passageiros sem nome, na mesma ordem
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
