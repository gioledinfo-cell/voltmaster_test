/**
 * Tipologie e interfacce per la Fatturazione Elettronica SDI (FPR12 / FPA12)
 * Conforme alle Specifiche Tecniche dell'Agenzia delle Entrate v1.8
 */

export type TipoDocumentoFattura =
  | 'TD01' // Fattura ordinaria
  | 'TD02' // Acconto/Anticipo su fattura
  | 'TD04' // Nota di credito
  | 'TD24' // Fattura differita (da DDT o Rapportini di Lavoro)
  | 'TD27'; // Autofattura per autoconsumo

export type RegimeFiscale =
  | 'RF01' // Ordinario
  | 'RF02' // Contribuenti minimi
  | 'RF19'; // Forfettario

export type NaturaEsenzioneIVA =
  | 'N1' // Escluse ex art. 15
  | 'N2.2' // Non soggette
  | 'N3.5' // Non imponibili
  | 'N4' // Esenti
  | 'N6.3' // Reverse Charge - Subappalto nel settore edile
  | 'N6.8' // Reverse Charge - Operazioni settore energetico
  | 'N7'; // Iva assolta in altro stato UE

export type EsigibilitaIVA = 'I' | 'D' | 'S'; // Immediata | Differita | Split Payment (P.A. ed enti pubblici)

export type ModalitaPagamento =
  | 'MP01' // Contanti
  | 'MP05' // Bonifico Bancario
  | 'MP08' // Carta di pagamento
  | 'MP12' // RIBA
  | 'MP19'; // SEPA Direct Debit (SDD)

export interface DatiAnagraficiAzienda {
  partitaIva: string;
  codiceFiscale: string;
  denominazione: string;
  regimeFiscale: RegimeFiscale;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  nazione: string;
  codiceDestinatario?: string; // 7 caratteri (o "0000000" con PEC)
  pecDestinatario?: string;
  numeroRea?: string;
  capitaleSociale?: number;
}

export interface RigaDettaglioFattura {
  numeroLinea: number;
  tipoCessionePrestazione?: 'SC' | 'PR' | 'AB' | 'AC';
  descrizione: string;
  quantita: number;
  unitaMisura: string; // 'ORE', 'PZ', 'CORPO', 'MT', 'KG'
  prezzoUnitario: number;
  prezzoTotale: number;
  aliquotaIva: number; // 22, 10, 4, 0
  natura?: NaturaEsenzioneIVA; // Obbligatorio se IVA = 0
  riferimentoRolId?: string;
  riferimentoDdtId?: string;
  riferimentoDdtNumero?: string;
}

export interface DatiRiepilogoIva {
  aliquotaIva: number;
  imponibile: number;
  imposta: number;
  esigibilitaIva: EsigibilitaIVA;
  natura?: NaturaEsenzioneIVA;
  riferimentoNormativo?: string;
}

export interface FatturaElettronicaDocument {
  id: string;
  progressivoInvio: string; // es. "00042"
  tipoDocumento: TipoDocumentoFattura;
  numeroFattura: string; // es. "2026/042"
  dataFattura: string; // YYYY-MM-DD
  cantiereId: string;
  cantiereTitolo: string;
  clienteId: string;
  clienteNome: string;
  
  // Anagrafiche Cedente & Cessionario
  cedente: DatiAnagraficiAzienda;
  cessionario: DatiAnagraficiAzienda;

  // Riferimenti
  codiceCIG?: string;
  codiceCUP?: string;
  numeroOrdineAcquisto?: string;
  ddtCollegati: { id: string; numero: string; data: string }[];
  rolCollegati: { id: string; numero: string; data: string; ore: number }[];

  // Contenuto economico
  linee: RigaDettaglioFattura[];
  riepilogoIva: DatiRiepilogoIva[];
  totaleImponibile: number;
  totaleImposta: number;
  totaleDocumento: number;

  // Dati Pagamento
  modalitaPagamento: ModalitaPagamento;
  scadenzaPagamento: string;
  ibanAccredito: string;

  // Stato SDI
  statoSdi: 'bozza' | 'generata' | 'inviata_sdi' | 'consegnata' | 'scartata';
  dataInvioSdi?: string;
  identificativoSdi?: string;
  messaggioSdi?: string;
  xmlGenerato?: string;
}
