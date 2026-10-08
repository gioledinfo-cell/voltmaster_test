/**
 * Modulo Sicurezza di Cantiere & Conformità Normativa D.Lgs. 81/2008
 * Gestione integrata di:
 * - DURC (Aziendale e Subappaltatori)
 * - P.O.S. (Piano Operativo di Sicurezza) & P.S.C.
 * - Idoneità Sanitaria Lavoratori & Scadenzario Visite Mediche
 * - Abilitazioni Specifiche (PES/PAV/PEI, PLE, Lavori in quota, Primo Soccorso, Antincendio)
 */

export type StatoConformitaDURC = 'regolare' | 'in_scadenza' | 'scaduto' | 'non_presente';

export type StatoApprovazionePOS =
  | 'approvato_cse'     // Validato dal Coordinatore Sicurezza Esecuzione
  | 'in_revisione'      // Osservazioni da integrare
  | 'trasmesso'         // Inviato in attesa di parere
  | 'da_redigere'       // Mancante o non ancora emesso
  | 'non_richiesto';    // Manutenzioni non soggette a Titolo IV

export type TipoDocumentoSicurezza =
  | 'DURC_AZIENDALE'
  | 'DURC_SUBAPPALTO'
  | 'POS'
  | 'PSC'
  | 'NOMINA_RSPP'
  | 'NOMINA_CSE'
  | 'NOMINA_RLS'
  | 'DICO_DM37'
  | 'PIANO_EMERGENZA'
  | 'VALUTAZIONE_RUMORE_VIBRAZIONI';

export interface DocumentoSicurezzaCantiere {
  id: string;
  cantiereId: string;
  tipo: TipoDocumentoSicurezza;
  titolo: string;
  soggetto: string;           // Ragione Sociale Impresa o Nome Professionista
  partitaIvaCF?: string;
  subappaltatoreId?: string;
  protocolloNumero?: string;  // es. "INPS_39821094" o "POS-2026-01-REV2"
  dataRilascio: string;       // YYYY-MM-DD
  dataScadenza?: string;      // YYYY-MM-DD
  stato: 'valido' | 'in_scadenza' | 'scaduto' | 'da_approvare';
  approvatoDa?: string;       // es. "Ing. Roberto Fontana (CSE)"
  dataApprovazione?: string;
  noteConformita?: string;
  fileAllegatoNome?: string;
  fileAllegatoUrl?: string;
  obbligatorioPerAccesso: boolean;
}

export interface IdoneitaSanitariaLavoratore {
  dipendenteId: string;
  nomeCompleto: string;
  matricola?: string;
  ruoloAziendale: string;
  reparto: string;
  visitaMedicaData: string;
  visitaMedicaScadenza: string;
  giorniAllaScadenza: number;
  medicoCompetente: string;
  giudizioIdoneita: 'idoneo_totale' | 'idoneo_con_prescrizioni' | 'temporaneamente_non_idoneo' | 'scaduta';
  prescrizioniNote?: string;
  patentiniAbilitazioni: {
    tipo: 'PES_PAV_PEI' | 'PLE' | 'LAVORI_IN_QUOTA' | 'PRIMO_SOCCORSO' | 'ANTINCENDIO' | 'CARRELLI';
    denominazione: string;
    scadenza: string;
    valido: boolean;
  }[];
  tesserinoRiconoscimentoValido: boolean;
  dpiConsegnatiVerificati: boolean;
  bloccatoIngresso: boolean;
  motivoBlocco?: string;
}

export interface CruscottoSicurezzaCantiere {
  cantiereId: string;
  cantiereTitolo: string;
  codiceCommessa: string;
  statoGlobaleCantiere: 'verde_conforme' | 'giallo_attenzione' | 'rosso_bloccato';
  
  // DURC Status
  durcAziendale: {
    protocollo: string;
    scadenza: string;
    stato: StatoConformitaDURC;
    giorniRimanenti: number;
  };
  
  // POS Status
  posCantiere: {
    stato: StatoApprovazionePOS;
    revisione: string;
    approvatoDa?: string;
    dataApprovazione?: string;
  };
  
  // CSE & Figure
  coordinatoreSicurezzaCSE: string;
  rsppAziendale: string;
  medicoCompetente: string;

  // Statistiche Lavoratori
  totaleOperatoriAssegnati: number;
  operatoriIdonei: number;
  operatoriConAllerta: number;
  operatoriBloccati: number;

  // Subappalti
  subappaltatoriTotali: number;
  subappaltatoriInRegola: number;
  subappaltatoriIrregolari: number;
}
