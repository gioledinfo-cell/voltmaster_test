/**
 * Tipi per la Gestione Segnacolli, Pacchi e Logistica "Zona Verde"
 * Progetto: VoltMaster - Gestionale Impianti Elettrici
 */

export type StatoTransitoPacco =
  | 'PRONTO_ZONA_VERDE'
  | 'CARICATO_SU_MEZZO'
  | 'CONSEGNATO_CANTIERE';

export interface RigaMaterialePacco {
  sku: string;
  descrizione: string;
  quantita: number;
  um: string;
  matricola?: string;
  confermato?: boolean;
}

export type TipoImballoPacco =
  | 'Pallet'
  | 'Scatola'
  | 'Bobina Cavi'
  | 'Cassa Metallica'
  | 'Collo Sfuso'
  | 'Bancale Termoretraibile';

export interface PaccoZonaVerde {
  id: string; // es. "PK-2026-042"
  numeroCollo?: string; // es. "Collo 1 di 2"
  numeroColliTotali?: number; // es. 2
  qrCode: string; // stringa univoca, es. "VM-PACKAGE:PK-2026-042"
  
  // Dati Cantiere e Destinazione
  cantiereId: string;
  cantiereTitolo: string;
  codiceCantiere: string;
  indirizzoCantiere: string;
  clienteNome?: string;

  // Logistica & Trasporto
  furgoneAssegnato?: string; // Targa e modello es. "FIAT Ducato (GN 412 KL)"
  furgoneId?: string;
  operatoreRitiro?: string; // Tecnico o autista designato
  operatoreRitiroId?: string;

  // Preparazione Magazzino
  dataPreparazione: string; // YYYY-MM-DD
  magazzinierePreparatore: string;
  tipoImballo?: TipoImballoPacco;
  pesoKg?: number;

  // Contenuto distinta
  righeMateriale: RigaMaterialePacco[];
  noteDiCarico?: string; // Note operative (es. "Maneggiare con cura quadri cablati")

  // Tracciamento stato transito
  statoTransito: StatoTransitoPacco;
  timestampCarico?: string; // ISO string o data formattata
  operatoreCaricoId?: string;
  operatoreCaricoNome?: string;
  timestampConsegna?: string;
  ddtRiferimentoId?: string;
  richiestaMaterialiRiferimentoId?: string;
}
