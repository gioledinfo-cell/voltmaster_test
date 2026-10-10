import { Cantiere, Cliente, Attrezzatura, Veicolo, ArticoloMagazzino, Dipendente } from './index';
import { FornitoreAnagrafica } from '../data/mockOrdini';

export type ImpostazioniTabId =
  | 'cantieri'
  | 'clienti'
  | 'fornitori'
  | 'attrezzature'
  | 'dispositivi'
  | 'mezzi'
  | 'magazzino'
  | 'operai';

export type DispositivoTipologia =
  | 'tablet'
  | 'smartphone'
  | 'gps_tracker'
  | 'sensore_iot'
  | 'dpi_smart'
  | 'timbratura_badge';

export type DispositivoStato = 'attivo' | 'in_riparazione' | 'disponibile_scorta' | 'dismesso';

export interface DispositivoAziendale {
  id: string;
  codice: string; // es. "DSP-TAB-01"
  tipologia: DispositivoTipologia;
  marcaModello: string; // es. "Samsung Galaxy Tab Active4 Pro Rugged"
  serialeImei: string;
  stato: DispositivoStato;
  assegnatarioTipo: 'utente' | 'cantiere' | 'veicolo' | 'sede';
  assegnatarioId?: string;
  assegnatarioNome: string; // es. "Marco Villa (Capocantiere)"
  cantiereId?: string;
  cantiereNome?: string;
  simNumero?: string; // es. "+39 348 8129032"
  simOperatore?: string; // es. "TIM Business"
  pianoDatiGb?: string; // es. "50 GB 5G"
  dataConsegna: string; // YYYY-MM-DD
  dataRestituzionePrevista?: string;
  note?: string;
  valoreEuro?: number;
  qrCode?: string;
}

export type SubappaltoPosStato = 'approvato_cse' | 'in_revisione' | 'da_presentare' | 'non_richiesto';
export type SubappaltoDurcStato = 'regolare' | 'in_scadenza' | 'scaduto';

export interface SubappaltoAnagrafica {
  id: string;
  ragioneSociale: string;
  partitaIva: string;
  codiceFiscale?: string;
  sedeLegale: string;
  referente: string;
  telefono: string;
  email: string;
  pec?: string;
  categoriaLavorazione: string; // es. "Opere Civili & Scavi", "Cartongessi & REI", "Fibra Ottica"
  cantiereAssegnatoId?: string;
  cantiereAssegnatoNome?: string;
  dataInizioContratto: string;
  dataFineContratto: string;
  importoContratto: number;
  durcProtocollo: string;
  durcScadenza: string;
  durcStato: SubappaltoDurcStato;
  posStato: SubappaltoPosStato;
  numeroOperatoriInCantiere: number;
  congruitaManodopera: boolean; // D.M. 143/2021
  note?: string;
}

export interface FornitoreCompleto extends FornitoreAnagrafica {
  codiceFiscale?: string;
  pec?: string;
  iban?: string;
  condizioniPagamento?: string; // es. "Bonifico 60 gg d.f. f.m."
  scontoApplicatoPercentuale?: number;
  durcProtocollo?: string;
  durcScadenza?: string;
  durcStato?: 'regolare' | 'in_scadenza' | 'scaduto';
  certificazioni?: string[]; // es. ["ISO 9001", "SOA OG11", "SOA OS30"]
  ratingQualita?: number; // 1 to 5
  note?: string;
}

export interface ImportValidationResult<T> {
  success: boolean;
  importedItems: T[];
  updatedCount: number;
  insertedCount: number;
  errors: {
    row: number;
    column?: string;
    message: string;
    rawRowData: Record<string, any>;
  }[];
  totalParsed: number;
}
