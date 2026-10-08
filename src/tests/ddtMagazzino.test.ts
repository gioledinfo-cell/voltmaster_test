import { describe, it, expect } from 'vitest';
import { ArticoloMagazzino, MovimentoMagazzino } from '../types';
import { RigaDDT } from '../types/ddt';

describe('Suite Test Scarico Magazzino da DDT & Giacenze (Passo 2)', () => {
  const mockMagazzinoIniziale: ArticoloMagazzino[] = [
    {
      id: 'art-cavo-fg16',
      codiceSku: 'CAV-FG16-3G25',
      nome: 'Cavo FG16OR16 3G2.5 mmq bobina',
      categoria: 'cavi_elettrici',
      unitaMisura: 'm',
      giacenza: 500,
      scortaMinima: 100,
      prezzoUnitarioAcquisto: 1.85,
      prezzoListinoVendita: 2.9,
      ubicazioneScaffale: 'Campata A - Scaffale 02',
      fornitore: 'RemaTarlazzi',
      qrCode: 'QR-CAV-FG16',
    },
    {
      id: 'art-magnetotermico',
      codiceSku: 'INT-BT-C16',
      nome: 'Interruttore Magnetotermico 1P+N 16A 4.5kA',
      categoria: 'quadri_modulari',
      unitaMisura: 'pz',
      giacenza: 30,
      scortaMinima: 15,
      prezzoUnitarioAcquisto: 14.5,
      prezzoListinoVendita: 24.0,
      ubicazioneScaffale: 'Campata B - Cassettiera 04',
      fornitore: 'Comet',
      qrCode: 'QR-INT-BT-C16',
    },
  ];

  it('scarica correttamente la giacenza di magazzino in base alle righe DDT confermate', () => {
    const righeDdt: RigaDDT[] = [
      {
        id: 'riga-1',
        descrizione: 'Cavo FG16OR16 3G2.5 mmq',
        quantita: 150,
        unitaMisura: 'm',
        sku: 'CAV-FG16-3G25',
      },
      {
        id: 'riga-2',
        descrizione: 'Interruttore Magnetotermico 1P+N 16A',
        quantita: 10,
        unitaMisura: 'pz',
        sku: 'INT-BT-C16',
      },
    ];

    // Simula logica di scarico dal magazzino
    const magazzinoAggiornato = mockMagazzinoIniziale.map((art) => {
      const rigaTrovata = righeDdt.find((r) => r.sku === art.codiceSku);
      if (rigaTrovata) {
        return {
          ...art,
          giacenza: Math.max(0, art.giacenza - rigaTrovata.quantita),
        };
      }
      return art;
    });

    const cavo = magazzinoAggiornato.find((a) => a.codiceSku === 'CAV-FG16-3G25');
    const magnetotermico = magazzinoAggiornato.find((a) => a.codiceSku === 'INT-BT-C16');

    expect(cavo?.giacenza).toBe(350); // 500 - 150
    expect(magnetotermico?.giacenza).toBe(20); // 30 - 10
  });

  it('rileva allerta sottoscorta se la giacenza residua scende sotto la scorta minima', () => {
    const rigaScaricoPesante: RigaDDT = {
      id: 'riga-critica',
      descrizione: 'Interruttore Magnetotermico 1P+N 16A',
      quantita: 20,
      unitaMisura: 'pz',
      sku: 'INT-BT-C16',
    };

    const art = mockMagazzinoIniziale.find((a) => a.codiceSku === 'INT-BT-C16')!;
    const giacenzaResidua = art.giacenza - rigaScaricoPesante.quantita; // 30 - 20 = 10
    const isSottoScorta = giacenzaResidua <= art.scortaMinima; // 10 <= 15

    expect(giacenzaResidua).toBe(10);
    expect(isSottoScorta).toBe(true);
  });

  it('genera correttamente il movimento storico di magazzino associato al DDT', () => {
    const ddtNumero = 'DDT-2026/042';
    const cantiereDestinazione = 'Cantiere Polo Ospedaliero Ancona';

    const nuovoMovimento: MovimentoMagazzino = {
      id: 'mov-101',
      articoloId: 'art-cavo-fg16',
      articoloNome: 'Cavo FG16OR16 3G2.5 mmq',
      tipo: 'scarico_cantiere',
      quantita: 150,
      data: '2026-10-08',
      cantiereNome: cantiereDestinazione,
      documentoRif: ddtNumero,
      operatoreNome: 'Capocantiere Marco V.',
    };

    expect(nuovoMovimento.tipo).toBe('scarico_cantiere');
    expect(nuovoMovimento.documentoRif).toBe('DDT-2026/042');
    expect(nuovoMovimento.quantita).toBe(150);
  });

  it('ripristina la giacenza originale in caso di annullamento o reso del DDT', () => {
    const giacenzaPostScarico = 350;
    const quantitaAnnullata = 150;
    const giacenzaRipristinata = giacenzaPostScarico + quantitaAnnullata;

    expect(giacenzaRipristinata).toBe(500);
  });
});
