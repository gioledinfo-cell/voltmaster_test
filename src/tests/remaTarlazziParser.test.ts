import { describe, it, expect } from 'vitest';
import {
  parsePriceNumber,
  normalizeUnitaMisura,
  guessCategoryFromDescription,
  applyRemaTarlazziDiffsToListinoFornitore,
  RemaTarlazziDiffItem,
} from '../utils/remaTarlazziParser';

describe('Suite Parser & Sconti Listino RemaTarlazzi', () => {
  it('converte correttamente stringhe di prezzo in formato italiano ed europeo', () => {
    expect(parsePriceNumber('3,45')).toBe(3.45);
    expect(parsePriceNumber('1.250,50 €')).toBe(1250.5);
    expect(parsePriceNumber('39,73')).toBe(39.73);
    expect(parsePriceNumber(370.29)).toBe(370.29);
    expect(parsePriceNumber('')).toBe(0);
  });

  it('normalizza le unità di misura secondo le convenzioni di cantiere', () => {
    expect(normalizeUnitaMisura('NR')).toBe('pz');
    expect(normalizeUnitaMisura('N.')).toBe('pz');
    expect(normalizeUnitaMisura('ML')).toBe('m');
    expect(normalizeUnitaMisura('MT')).toBe('m');
    expect(normalizeUnitaMisura('KT')).toBe('kit');
    expect(normalizeUnitaMisura('CONF')).toBe('conf');
  });

  it('deduce la categoria merceologica corretta dalla descrizione dell’articolo', () => {
    expect(guessCategoryFromDescription('Cavo FG16OR16 3G2.5 mm²')).toBe('cavi_elettrici');
    expect(guessCategoryFromDescription('Interruttore Magnetotermico 1P+N C16')).toBe('quadri_modulari');
    expect(guessCategoryFromDescription('Living Now Deviatore Connesso')).toBe('apparecchi_comando');
    expect(guessCategoryFromDescription('Tubo corrugato ICTA d.20mm')).toBe('tubi_canaline');
    expect(guessCategoryFromDescription('Pannello LED 60x60 34W')).toBe('illuminazione');
    expect(guessCategoryFromDescription('Inverter Fotovoltaico 6kW')).toBe('fotovoltaico_accumulo');
  });

  it('aggiorna i prezzi del listino fornitore in base ai diffs ricevuti dal file Excel', () => {
    const existingListino = [
      {
        id: '1',
        codiceFornitore: 'AM4003C',
        marchio: 'BTicino',
        descrizione: 'Deviatore Matix Connesso',
        unitaMisura: 'pz',
        prezzoAcquisto: 30.0,
        prezzoListino: 50.0,
        fornitore: 'RemaTarlazzi',
        categoria: 'apparecchi_comando',
      },
    ];

    const diffs: RemaTarlazziDiffItem[] = [
      {
        id: '1',
        status: 'updated',
        item: {
          codiceSku: 'AM4003C',
          nome: 'Deviatore Matix Connesso 1P 10AX',
          prezzoUnitarioAcquisto: 39.73,
          prezzoListinoVendita: 53.19,
          unitaMisura: 'pz',
          barcodeEan: '8012199991001',
          categoria: 'apparecchi_comando',
          fornitore: 'RemaTarlazzi',
        },
        oldPrezzoAcquisto: 30.0,
        newPrezzoAcquisto: 39.73,
        oldPrezzoListino: 50.0,
        newPrezzoListino: 53.19,
      },
    ];

    const updatedListino = applyRemaTarlazziDiffsToListinoFornitore(diffs, existingListino);

    expect(updatedListino.length).toBe(1);
    expect(updatedListino[0].prezzoAcquisto).toBe(39.73);
    expect(updatedListino[0].prezzoListino).toBe(53.19);
    expect(updatedListino[0].barcodeEan).toBe('8012199991001');
  });
});
