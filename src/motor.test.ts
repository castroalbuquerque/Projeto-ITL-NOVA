import { describe, expect, it } from 'vitest';
import { PASSAGEIROS, passageiroPorId, viagemPorId } from './dados';
import { decidir, ordemDeCorte, resumoDaOcorrencia, type Gatilho } from './motor';

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
    // A Beatriz é quem carrega o B1 sozinho: tem caminho, não autorizou, e nada
    // deve ao passageiro que justifique falar com ela assim mesmo.
    const beatriz = por(
      decidir({ tipo: 'winback', passageiroId: 'p-04' }, null, PASSAGEIROS),
      'p-04',
    );
    expect(beatriz.enviar).toBe(false);
    expect(beatriz.regrasAplicadas).not.toContain('R6');
    expect(beatriz.regrasBloqueadas).toContainEqual({
      id: 'B1',
      motivo: 'R6: sem autorização para mensagem comercial',
    });
    // Sem mensagem que possa sair, não há compensação a conceder nem a custear.
    expect(beatriz.compensacoes).toHaveLength(0);

    // O Carlos autoriza ser procurado: o aviso da viagem sai, e o que retém o
    // convite comercial é a reclamação em aberto.
    const carlos = por(decidir(quebra, v01, PASSAGEIROS), 'p-02');
    expect(carlos.enviar).toBe(true);
    expect(carlos.regrasAplicadas).toContain('R2');
    expect(carlos.tom).toBe('reconquista'); // reconhece a ocorrência anterior

    const winback = por(decidir({ tipo: 'winback', passageiroId: 'p-02' }, null, PASSAGEIROS), 'p-02');
    expect(winback.regrasAplicadas).not.toContain('R6'); // o convite comercial não sai
    expect(winback.regrasBloqueadas).toContainEqual({
      id: 'B4',
      motivo: 'R6: há caso aberto, convite comercial só depois de resolvê-lo',
    });
    // e resolver o caso aberto dele é atendimento, não propaganda
    expect(winback.regrasAplicadas).toContain('R6b');
    expect(winback.chaveMensagem).toBe('winback:reparador');
    expect(winback.compensacoes).toHaveLength(0);
  });

  it('na ocorrência, o aviso da viagem passa e a oferta de retorno é barrada', () => {
    // O que a demonstração precisa mostrar no canhoto do Carlos: o aviso da
    // viagem que ele pagou sai, e o convite comercial que a regra quis fazer
    // junto aparece barrado, com o motivo escrito.
    const carlos = por(decidir(quebra, v01, PASSAGEIROS), 'p-02');
    expect(carlos.enviar).toBe(true);
    expect(carlos.regrasAplicadas).toContain('R2');
    expect(carlos.regrasAplicadas).not.toContain('R9');
    expect(carlos.regrasBloqueadas).toContainEqual({
      id: 'B4',
      motivo: 'R9: há caso aberto, convite comercial só depois de resolvê-lo',
    });
    expect(carlos.compensacoes.map((c) => c.tipo)).not.toContain('desconto de retorno de 20%');

    // O pacote dele é o da seção 3.3 da spec: reembolso da viagem que ficou em
    // aberto e remarcação sem taxa, os dois fora do teto. Crédito na conta, não.
    expect(carlos.compensacoes.map((c) => c.tipo)).toEqual([
      'reembolso da viagem anterior',
      'remarcação sem taxa',
    ]);
    expect(carlos.compensacoes.every((c) => c.foraDoTeto)).toBe(true);

    // E não alcança quem nunca foi ferido pela operação: a Mariana, do grupo 1,
    // não recebe convite nenhum na quebra, e por isso não tem o que barrar.
    const mariana = por(decidir(quebra, v01, PASSAGEIROS), 'p-01');
    expect(mariana.regrasBloqueadas).toHaveLength(0);

    const resumo = resumoDaOcorrencia(quebra, v01, PASSAGEIROS);
    expect(resumo.bloqueiosPorMotivo['B4']).toBe(1); // o número "1 barrada por freio"
  });

  it('a compensação só entra no custo depois do envio confirmado', () => {
    // Enquanto ninguém clica em Confirmar envio, a mensagem não saiu e o
    // benefício não foi concedido: ele aparece como pendente, não como custo.
    const semConfirmar = resumoDaOcorrencia(quebra, v01, PASSAGEIROS);
    expect(semConfirmar.custoCompensacoes).toBe(0);
    expect(semConfirmar.custoDisparos).toBe(0);
    expect(semConfirmar.custoCompensacoesPendentes).toBeGreaterThan(0);
    expect(semConfirmar.enviosConfirmados).toBe(0);

    const comMariana = resumoDaOcorrencia(quebra, v01, PASSAGEIROS, {}, { 'p-01': true });
    expect(comMariana.custoCompensacoes).toBe(47); // só o crédito dela
    expect(comMariana.enviosConfirmados).toBe(1);
    expect(comMariana.custoCompensacoesPendentes).toBe(
      semConfirmar.custoCompensacoesPendentes - 47,
    );

    // O teto, esse, continua sendo conferido sobre o que a regra decidiu: a
    // conta precisa aparecer antes de gastar, não depois.
    expect(semConfirmar.beneficioExtraPedido).toBe(comMariana.beneficioExtraPedido);
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

// p.4: o convite de retorno se apoia no que mudou na linha do passageiro
describe('win-back', () => {
  it('convida com o que mudou na linha, e não alcança quem não autorizou', () => {
    const jorge = por(decidir({ tipo: 'winback', passageiroId: 'p-07' }, null, PASSAGEIROS), 'p-07');
    expect(jorge.enviar).toBe(true);
    expect(jorge.chaveMensagem).toBe('winback:reconquista');
    expect(jorge.compensacoes.map((c) => c.tipo)).toEqual(['oferta dirigida de 25%']);
    expect(passageiroPorId('p-07').linhaHabitual).toBe('Capital–Interior');

    // Helena autorizou e tem caso aberto: a desculpa sai, e só o convite espera.
    // É o único passageiro em que o caso aberto aparece sozinho como motivo.
    const helena = por(decidir({ tipo: 'winback', passageiroId: 'p-12' }, null, PASSAGEIROS), 'p-12');
    expect(helena.enviar).toBe(true);
    expect(helena.chaveMensagem).toBe('winback:reparador');
    expect(helena.compensacoes).toHaveLength(0);
    expect(helena.regrasBloqueadas.map((b) => b.id)).toEqual(['B4']);

    // Carlos autoriza ser procurado, e mesmo assim o convite espera: é o caso
    // aberto que o retém, sozinho — o mesmo motivo da Helena.
    const carlos = por(decidir({ tipo: 'winback', passageiroId: 'p-02' }, null, PASSAGEIROS), 'p-02');
    expect(carlos.regrasBloqueadas.map((b) => b.id)).toEqual(['B4']);
  });
});

// A ordem de corte é usada também pelo painel do lote da v2 (seção 5.3): quem
// corta é o motor, não o agente.
describe('ordem de corte do teto', () => {
  it('corta do menos frequente para o mais, até caber no teto', () => {
    const { pedido, pago, cortes } = ordemDeCorte(
      [
        { nome: 'quem viaja sempre', frequencia: 80, valor: 600 },
        { nome: 'quem viaja às vezes', frequencia: 20, valor: 600 },
        { nome: 'quem viaja pouco', frequencia: 2, valor: 600 },
      ],
      1000,
    );
    expect(pedido).toBe(1800);
    expect(cortes.map((c) => c.nome)).toEqual(['quem viaja pouco', 'quem viaja às vezes']);
    expect(pago).toBe(600);
  });

  it('não corta nada quando o pedido cabe no teto', () => {
    const r = ordemDeCorte([{ nome: 'alguém', frequencia: 1, valor: 100 }], 2000);
    expect(r.cortes).toHaveLength(0);
    expect(r.pago).toBe(100);
  });
});
