import { describe, it, expect } from 'vitest';
import { Preventivo, VoceMaterialePreventivo, VoceManodoperaPreventivo } from '../types';

describe('Suite Test Calcolo Economico Modulare Preventivi (VoltMaster)', () => {
  it('calcola correttamente il subtotale materiali applicando il ricarico percentuale', () => {
    const materiali: VoceMaterialePreventivo[] = [
      {
        id: 'mat-1',
        descrizione: 'Cavo FG16OR12 3G2.5',
        unitaMisura: 'm',
        quantita: 100,
        costoAcquistoUnitario: 2.0,
        ricaricoPercentuale: 30, // 30% ricarico -> 2.60 €/m vendita
        prezzoVenditaUnitario: 2.6,
        totaleCosto: 200.0,
        totaleVendita: 260.0,
      },
      {
        id: 'mat-2',
        descrizione: 'Quadro IP65 24 mod',
        unitaMisura: 'pz',
        quantita: 2,
        costoAcquistoUnitario: 50.0,
        ricaricoPercentuale: 30, // 50 * 1.30 = 65 €/pz vendita
        prezzoVenditaUnitario: 65.0,
        totaleCosto: 100.0,
        totaleVendita: 130.0,
      },
    ];

    const subtotaleCosto = materiali.reduce((acc, m) => acc + m.totaleCosto, 0);
    const subtotaleVendita = materiali.reduce((acc, m) => acc + m.totaleVendita, 0);

    expect(subtotaleCosto).toBe(300.0);
    expect(subtotaleVendita).toBe(390.0);
    expect(subtotaleVendita - subtotaleCosto).toBe(90.0); // Margine lordo materiali
  });

  it('calcola correttamente il subtotale manodopera moltiplicando ore stimate e tariffa oraria', () => {
    const tariffaOraria = 35.0; // €/h
    const manodopera: VoceManodoperaPreventivo[] = [
      {
        id: 'man-1',
        descrizione: 'Posa passerelle e canalizzazioni',
        oreStimate: 10,
        tariffaOrariaApplicata: tariffaOraria,
        totale: 350.0,
      },
      {
        id: 'man-2',
        descrizione: 'Cablaggio quadri e collaudo CEI 64-8',
        oreStimate: 6,
        tariffaOrariaApplicata: tariffaOraria,
        totale: 210.0,
      },
    ];

    const totaleOre = manodopera.reduce((acc, m) => acc + m.oreStimate, 0);
    const subtotaleManodopera = manodopera.reduce((acc, m) => acc + m.totale, 0);

    expect(totaleOre).toBe(16);
    expect(subtotaleManodopera).toBe(560.0);
  });

  it('applica correttamente sconto commerciale e calcolo imponibile netto + IVA', () => {
    const subtotaleMateriali = 1000.0;
    const subtotaleManodopera = 500.0;
    const baseTotale = subtotaleMateriali + subtotaleManodopera; // 1500.00 €

    // Sconto 10%
    const percSconto = 10;
    const quotaSconto = (baseTotale * percSconto) / 100; // 150.00 €
    const imponibileNetto = baseTotale - quotaSconto; // 1350.00 €

    // IVA 22%
    const aliquotaIva = 22;
    const quotaIva = Number(((imponibileNetto * aliquotaIva) / 100).toFixed(2)); // 297.00 €
    const totalePreventivoFinale = Number((imponibileNetto + quotaIva).toFixed(2)); // 1647.00 €

    expect(baseTotale).toBe(1500.0);
    expect(quotaSconto).toBe(150.0);
    expect(imponibileNetto).toBe(1350.0);
    expect(quotaIva).toBe(297.0);
    expect(totalePreventivoFinale).toBe(1647.0);
  });

  it('applica correttamente maggiorazione per urgenza e aliquota IVA agevolata 10%', () => {
    const subtotaleMateriali = 2000.0;
    const subtotaleManodopera = 1000.0;
    const baseTotale = 3000.0;

    // Maggiorazione 5% per lavoro notturno/festivo
    const percMaggiorazione = 5;
    const quotaMaggiorazione = (baseTotale * percMaggiorazione) / 100; // 150.00 €
    const imponibileNetto = baseTotale + quotaMaggiorazione; // 3150.00 €

    // IVA 10% agevolata
    const aliquotaIva = 10;
    const quotaIva = Number(((imponibileNetto * aliquotaIva) / 100).toFixed(2)); // 315.00 €
    const totalePreventivoFinale = imponibileNetto + quotaIva; // 3465.00 €

    expect(imponibileNetto).toBe(3150.0);
    expect(quotaIva).toBe(315.0);
    expect(totalePreventivoFinale).toBe(3465.0);
  });
});
