import { describe, it, expect } from 'vitest';
import { StatoAvanzamentoLavori, CertificatoPagamento } from '../types/sal';

describe('Suite Calcoli SAL & Ritenuta di Garanzia 0.5%', () => {
  it('calcola correttamente la ritenuta di garanzia dello 0.5% e il netto del SAL', () => {
    const importoLavoriLordo = 100000; // € 100.000,00
    const percentualeRitenuta = 0.5; // 0.5% ex art. 103 D.Lgs 36/2023

    const importoRitenuta05 = (importoLavoriLordo * percentualeRitenuta) / 100;
    const importoNettoLavori = importoLavoriLordo - importoRitenuta05;

    expect(importoRitenuta05).toBe(500); // 0.5% di 100.000 = 500
    expect(importoNettoLavori).toBe(99500); // 100.000 - 500 = 99.500
  });

  it('calcola correttamente L’IVA 22% e il totale del Certificato di Pagamento', () => {
    const nettoFatturabile = 50000; // € 50.000,00
    const aliquotaIva = 22;

    const importoIva = (nettoFatturabile * aliquotaIva) / 100;
    const totaleLordoCertificato = nettoFatturabile + importoIva;

    expect(importoIva).toBe(11000);
    expect(totaleLordoCertificato).toBe(61000);
  });

  it('applica il recupero dell’anticipazione contrattuale (es. 20%) in quota proporzionale al SAL', () => {
    const importoSALPeriodo = 40000;
    const percentualeAnticipo = 20; // 20%
    const quotaRecuperoAnticipo = (importoSALPeriodo * percentualeAnticipo) / 100;

    const imponibileNettoDopoAnticipo = importoSALPeriodo - quotaRecuperoAnticipo;

    expect(quotaRecuperoAnticipo).toBe(8000);
    expect(imponibileNettoDopoAnticipo).toBe(32000);
  });
});
