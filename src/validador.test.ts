import { describe, expect, it } from 'vitest';
import { PACOTES_DE_FATOS, REDACOES_IA } from './dadosV2';
import { linhaDeFatosValidados, validarRedacao, type Redacao } from './validador';

const fatosMariana = PACOTES_DE_FATOS['p-01'];
const fatosCarlos = PACOTES_DE_FATOS['p-02'];
const fatosDiego = PACOTES_DE_FATOS['p-05'];

/** Redação aprovada de alguém, com uma alteração pontual para o teste. */
function comTexto(base: Redacao, texto: string): Redacao {
  return { ...base, texto };
}

describe('validador de fatos travados', () => {
  it('aprova a redação da Mariana com os quatro fatos conferidos', () => {
    const v = validarRedacao(fatosMariana, REDACOES_IA['p-01']);
    expect(v.valido).toBe(true);
    expect(v.motivo).toBeNull();
    expect(linhaDeFatosValidados(v)).toBe('horário ✓ · valor ✓ · nome ✓ · canal ✓');
  });

  it('aprova a redação do Carlos e confirma que o freio comercial alcança o agente', () => {
    // A liberação comercial está travada no pacote de fatos — no Carlos, pelo
    // caso em aberto — e o agente não pode destravá-la escrevendo.
    const v = validarRedacao(fatosCarlos, REDACOES_IA['p-02']);
    expect(v.valido).toBe(true);
    expect(fatosCarlos.ofertaComercialLiberada).toBe(false);
    expect(v.checagens.find((c) => c.campo === 'oferta')!.ok).toBe(true);
  });

  it('descarta a redação do Diego com o motivo legível do horário divergente', () => {
    const v = validarRedacao(fatosDiego, REDACOES_IA['p-05']);
    expect(v.valido).toBe(false);
    expect(v.motivo).toBe('horário divergente do fato travado (07h05 ≠ 07h15)');
    expect(linhaDeFatosValidados(v)).toContain('horário ✗');
  });

  it('descarta quando o nome não é o do pacote de fatos', () => {
    const v = validarRedacao(
      fatosMariana,
      comTexto(
        REDACOES_IA['p-01'],
        'Bom dia, Marina. A saída das 06h30 passou para 07h15 e o seu assento segue garantido, com crédito de 30% na conta.',
      ),
    );
    expect(v.valido).toBe(false);
    expect(v.motivo).toBe('nome travado (Mariana) não aparece na redação');
  });

  it('descarta quando o valor da compensação diverge do que a regra decidiu', () => {
    const v = validarRedacao(
      fatosMariana,
      comTexto(
        REDACOES_IA['p-01'],
        'Bom dia, Mariana. A saída das 06h30 passou para 07h15, seu assento está garantido e um crédito de 20% já entrou na conta.',
      ),
    );
    expect(v.valido).toBe(false);
    expect(v.motivo).toContain('crédito de 30%');
  });

  it('descarta quando o canal não é o que a regra decidiu', () => {
    const v = validarRedacao(fatosMariana, { ...REDACOES_IA['p-01'], canal: 'sms' });
    expect(v.valido).toBe(false);
    expect(v.motivo).toBe('canal divergente do fato travado (sms ≠ whatsapp)');
  });

  it('descarta oferta comercial escrita para quem não autorizou', () => {
    const v = validarRedacao(
      fatosCarlos,
      comTexto(
        REDACOES_IA['p-02'],
        'Carlos, o veículo das 06h30 teve falha mecânica e a nova saída é às 07h15. Seu reembolso integral está disponível, a remarcação é sem taxa e um atendente liga em cinco minutos. E na volta você tem 25% de desconto.',
      ),
    );
    expect(v.valido).toBe(false);
    expect(v.motivo).toContain('oferta comercial em redação sem consentimento');
  });

  it('registra o tamanho acima do limite do prompt sem descartar a redação', () => {
    // O limite de 4 frases é instrução do prompt (seção 3.4), não fato travado
    // (seção 3.1): fica no canhoto e não derruba sozinho a mensagem.
    const carlos = validarRedacao(fatosCarlos, REDACOES_IA['p-02']);
    const tamanho = carlos.checagens.find((c) => c.campo === 'tamanho')!;
    expect(tamanho.ok).toBe(false);
    expect(tamanho.bloqueante).toBe(false);
    expect(carlos.valido).toBe(true);
  });

  it('todas as redações do módulo de conteúdo têm veredito estável', () => {
    // Guarda contra edição futura do texto embutido: quem passa continua passando,
    // e a cena de falha continua falhando.
    const esperado: Record<string, boolean> = { 'p-01': true, 'p-02': true, 'p-05': false };
    for (const [id, valido] of Object.entries(esperado)) {
      expect(validarRedacao(PACOTES_DE_FATOS[id], REDACOES_IA[id]).valido).toBe(valido);
    }
  });
});
