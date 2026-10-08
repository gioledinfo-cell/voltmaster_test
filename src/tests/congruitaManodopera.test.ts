import { describe, it, expect } from 'vitest';
import {
  calcolaCongruitaManodoperaSAL,
  SOGLIA_MINIMA_CONTRATTI_PRIVATI_EURO,
  TABELLA_CONGRUITA_DM143,
} from '../services/congruitaService';
import { StatoAvanzamentoLavori } from '../types/sal';
import { ROL } from '../types';

describe('Suite Congruità Manodopera (D.M. 143/2021 - CNCE Edilconnect)', () => {
  const mockSal: StatoAvanzamentoLavori = {
    id: 'sal-001',
    cantiereId: 'cnt-001',
    cantiereNome: 'Cantiere Osp. San Raffaele',
    numeroSal: 1,
    codiceSal: 'SAL-01',
    dataEmissione: '2026-10-01',
    periodoInizio: '2026-09-01',
    periodoFine: '2026-09-30',
    importoContrattualeTotale: 120000, // > 70k soglia
    totaleLavoriPrecedenti: 0,
    totaleLavoriCumulati: 100000,
    totaleLavoriPeriodo: 100000,
    committenteNome: 'Ospedale San Raffaele',
    redattoDa: 'Ing. Marco Bianchi',
    voci: [],
    ritenutaGaranziaPercentuale: 0.5,
    ritenutaGaranziaImporto: 500,
    aliquotaIvaPercentuale: 22,
    percentualeAvanzamentoGlobale: 83.3,
    stato: 'approvato_dl',
    note: '',
    vociLibrettoMisure: [],
  };

  const mockRolsConformi: ROL[] = [
    {
      id: 'rol-1',
      numero: 'ROL-001',
      data: '2026-09-15',
      operatoreId: 'op-1',
      operatoreNome: 'Marco Bianchi',
      cantiereId: 'cnt-001',
      cantiereTitolo: 'Cantiere Osp. San Raffaele',
      clienteNome: 'Ospedale',
      oreOrdinarie: 250, // 250 ore * € 35 = € 8.750
      oreStraordinarie: 20, // 20 ore * € 35 = € 700
      oreTotali: 270,
      descrizioneLavori: 'Posa cavi e quadri',
      stato: 'approvato',
      firmaClientePresente: true,
      bloccatoModifiche: true,
      collaboratori: [
        {
          id: 'op-2',
          nome: 'Luigi Rossi',
          oreOrdinarie: 200,
          oreStraordinarie: 10,
        },
      ],
    },
  ];

  it('verifica soglia minima di applicabilità contratti privati a € 70.000', () => {
    expect(SOGLIA_MINIMA_CONTRATTI_PRIVATI_EURO).toBe(70000);
  });

  it('conferma la percentuale minima tabellare D.M. 143/2021 per OG11/OS30 al 14.28%', () => {
    const info = TABELLA_CONGRUITA_DM143.OG11_OS30;
    expect(info.percentualeMinima).toBe(14.28);
  });

  it('calcola correttamente la congruità manodopera con esito CONGRUO', () => {
    // 100.000€ imponibile * 14.28% = 14.280€ manodopera richiesta
    // Ore nei ROL: (270 + 210) = 480 ore * € 35 = 16.800€ (> 14.280€) -> CONGRUO
    const calcolo = calcolaCongruitaManodoperaSAL(
      mockSal,
      mockRolsConformi,
      'OG11_OS30',
      35.0
    );

    expect(calcolo.isOperaSoggettaObbligo).toBe(true);
    expect(calcolo.fabbisognoMinimoManodoperaEuro).toBe(14280);
    expect(calcolo.valoreManodoperaEffettivaEuro).toBeGreaterThanOrEqual(14280);
    expect(calcolo.isCongruo).toBe(true);
    expect(calcolo.bloccoFatturazioneFinale).toBe(false);
  });

  it('rileva NON CONGRUO e attiva il blocco della fatturazione finale se sotto la soglia minima al SAL finale', () => {
    const salFinaleSottoSoglia: StatoAvanzamentoLavori = {
      ...mockSal,
      isSalFinale: true,
      codiceSal: 'SAL-FINALE',
      totaleLavoriCumulati: 100000,
    };

    // Soli ROL per 100 ore * € 35 = € 3.500 (< € 14.280)
    const rolsSottoSoglia: ROL[] = [
      {
        id: 'rol-2',
        numero: 'ROL-002',
        data: '2026-09-20',
        operatoreId: 'op-1',
        operatoreNome: 'Marco Bianchi',
        cantiereId: 'cnt-001',
        cantiereTitolo: 'Cantiere Osp. San Raffaele',
        clienteNome: 'Ospedale',
        oreOrdinarie: 100,
        oreStraordinarie: 0,
        oreTotali: 100,
        descrizioneLavori: 'Posa minima',
        stato: 'approvato',
        firmaClientePresente: true,
        bloccatoModifiche: true,
      },
    ];

    const calcolo = calcolaCongruitaManodoperaSAL(
      salFinaleSottoSoglia,
      rolsSottoSoglia,
      'OG11_OS30',
      35.0
    );

    expect(calcolo.isCongruo).toBe(false);
    expect(calcolo.bloccoFatturazioneFinale).toBe(true);
    expect(calcolo.motivoBlocco).toContain('BLOCCO FATTURAZIONE FINALE');
    expect(calcolo.oreMancanti).toBeGreaterThan(0);
  });
});
