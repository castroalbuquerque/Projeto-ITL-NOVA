import { describe, expect, it } from 'vitest';
import { PASSAGEIROS, passageiroPorId, viagemPorId } from './dados';
import { decidir, resumoDaOcorrencia, type Gatilho } from './motor';

const v01 = viagemPorId('v-01'); // quebra: Mariana e Carlos
const v02 = viagemPorId('v-02'); // cancelamento: Ana Paula, Beatriz, Diego + 39 de fundo
const v03 = viagemPorId('v-03'); // atraso noturno: Diego e Rosa

const quebra: Gatilho = {
  tipo: 'ocorrencia',
  ocorrencia: 'quebra',
  minutosImpacto: 45,
  viagemId: 'v-01',
};
const cancelamento: Gatilho = {
  tipo: 'ocorrencia',
  ocorrencia: 'cancelamento',
  minutosImpacto: 120,
  viagemId: 'v-02',
};
const atrasoNoturno: Gatilho = {
  tipo: 'ocorrencia',
  ocorrencia: 'atraso',
  minutosImpacto: 80,
  viagemId: 'v-03',
};

const por = (ds: ReturnType<typeof decidir>, id: string) => ds.find((d) => d.passageiroId === id)!;

describe('motor de regras', () => {
  it('quebra gera compensação', () => {
    const mariana = por(decidir(quebra, v01, PASSAGEIROS), 'p-01');
    expect(mariana.enviar).toBe(true);
    expect(mariana.compensacoes.map((c) => c.tipo)).toContain('crédito de 30%');
    expect(mariana.compensacoes.find((c) => c.tipo === 'crédito de 30%')!.valorEstimado).toBe(47);
  });

  it('passageiro sem contato não recebe mensagem nenhuma, mas gera ação de terminal', () => {
    const rosa = por(decidir(atrasoNoturno, v03, PASSAGEIROS), 'p-06');
    expect(passageiroPorId('p-06').temContato).toBe(false);
    expect(rosa.enviar).toBe(false);
    expect(rosa.canais).toHaveLength(0);
    expect(rosa.acoesTerminal).toEqual(['painel:atraso', 'guiche:atraso']);
    expect(rosa.regrasBloqueadas.map((b) => b.id)).toContain('B0');

    const resumo = resumoDaOcorrencia(atrasoNoturno, v03, PASSAGEIROS);
    expect(resumo.semAvisoPorFaltaDeContato).toBe(1);
  });

  it('com contato e sem autorização: recebe aviso de viagem e não recebe convite', () => {
    const carlos = por(decidir(quebra, v01, PASSAGEIROS), 'p-02');
    expect(carlos.enviar).toBe(true);
    expect(carlos.regrasAplicadas).toContain('R2');
    expect(carlos.tom).toBe('reconquista'); // reconhece a ocorrência anterior

    const convite = por(decidir({ tipo: 'winback', passageiroId: 'p-02' }, null, PASSAGEIROS), 'p-02');
    expect(convite.enviar).toBe(false);
    expect(convite.regrasBloqueadas).toContainEqual({
      id: 'B1',
      motivo: 'R6: sem autorização para mensagem comercial',
    });
  });

  it('teto degrada só o benefício extra, começando pelo menos frequente', () => {
    const decisoes = decidir(cancelamento, v02, PASSAGEIROS);
    const extras = (id: string) =>
      por(decisoes, id).compensacoes.filter((c) => !c.foraDoTeto).map((c) => c.tipo);

    expect(extras('p-05')).toHaveLength(0); // Diego, zero viagens: cortado primeiro
    expect(extras('p-04')).toHaveLength(0); // Beatriz, três viagens: cortada em seguida
    expect(extras('p-03')).toEqual(['crédito de 20%']); // Ana Paula, 88 viagens: intacta

    const resumo = resumoDaOcorrencia(cancelamento, v02, PASSAGEIROS);
    expect(resumo.beneficioExtraPedido).toBe(2604);
    expect(resumo.beneficioExtraPago).toBeLessThanOrEqual(2000);
    expect(resumo.cortesPorTeto[0].nome).toBe('Diego');
    expect(resumo.cortesPorTeto[1].nome).toBe('Beatriz');
  });

  it('reembolso e lugar em outro horário nunca são cortados', () => {
    const decisoes = decidir(cancelamento, v02, PASSAGEIROS);
    for (const id of ['p-03', 'p-04', 'p-05']) {
      const tipos = por(decisoes, id).compensacoes.map((c) => c.tipo);
      expect(tipos).toContain('reembolso integral');
      expect(tipos).toContain('lugar em outro horário');
    }
    const resumo = resumoDaOcorrencia(cancelamento, v02, PASSAGEIROS);
    expect(resumo.cortesPorTeto.some((c) => /reembolso|lugar/.test(c.nome))).toBe(false);
  });

  it('marco não dispara para quem já é do grupo 1', () => {
    const ana = passageiroPorId('p-03');
    expect(ana.grupo).toBe(1);
    expect(ana.viagens4m).toBeGreaterThanOrEqual(5);
    expect(ana.gastoEmAlta).toBe(true); // cumpre tudo, menos não ser do grupo 1

    const dela = por(decidir({ tipo: 'marco', passageiroId: 'p-03' }, null, PASSAGEIROS), 'p-03');
    expect(dela.enviar).toBe(false);
    expect(dela.regrasAplicadas).toHaveLength(0);

    const leticia = por(decidir({ tipo: 'marco', passageiroId: 'p-09' }, null, PASSAGEIROS), 'p-09');
    expect(leticia.regrasAplicadas).toContain('R7');
  });
});

// conferência do B2, que só aparece quando a viagem já acumulou avisos
describe('limite de mensagens', () => {
  it('barra o quarto aviso da mesma viagem e não conta ação de terminal', () => {
    const g: Gatilho = {
      tipo: 'ocorrencia',
      ocorrencia: 'quebra',
      minutosImpacto: 45,
      viagemId: 'v-01',
    };
    const comTres = por(decidir(g, viagemPorId('v-01'), PASSAGEIROS, { 'p-01': 3 }), 'p-01');
    expect(comTres.enviar).toBe(false);
    expect(comTres.regrasBloqueadas.map((b) => b.id)).toEqual(['B2', 'B2']);

    const rosa = por(
      decidir(
        { tipo: 'ocorrencia', ocorrencia: 'atraso', minutosImpacto: 80, viagemId: 'v-03' },
        viagemPorId('v-03'),
        PASSAGEIROS,
        { 'p-06': 3 },
      ),
      'p-06',
    );
    expect(rosa.acoesTerminal).toHaveLength(2); // terminal sai mesmo com o limite estourado
    expect(rosa.regrasBloqueadas.map((b) => b.id)).toEqual(['B0']);
  });
});
