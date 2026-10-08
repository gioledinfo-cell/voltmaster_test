import { DepositoRecord } from '../types/gestioneOperativa';

/**
 * 4. DEPOSITI - Archivio Reale Sedi e Stoccaggi (Elenco_Depositi.csv)
 * Mappa: Titolo, Tecno_Codice, Tipologia
 */
export const DEPOSITI: DepositoRecord[] = [
  {
    titolo: 'Deposito Centrale Sede',
    tecnoCodice: 'DEP-01-CENT',
    tipologia: 'Centrale Sede',
  },
  {
    titolo: 'Deposito Hub Nord',
    tecnoCodice: 'DEP-02-NORD',
    tipologia: 'Hub Territoriale',
  },
  {
    titolo: 'Furgone Daily FJ482KN',
    tecnoCodice: 'DEP-FURG-01',
    tipologia: 'Mobile Furgone',
  },
  {
    titolo: 'Furgone Transit FL334MM',
    tecnoCodice: 'DEP-FURG-03',
    tipologia: 'Mobile Furgone',
  },
  {
    titolo: 'Container Cantiere Ospedale',
    tecnoCodice: 'DEP-CNT-HOSP',
    tipologia: 'Container Cantiere',
  },
];
