/**
 * Unified Types for VoltMaster Operational Management (Power Apps Migration)
 */

export interface DipendenteRecord {
  matricola: string;              // Matricola (PK), es. "DIP-001"
  nome: string;                   // Title / Nome
  cognome: string;                // Cognome
  operatoreMicrosoft?: string;    // Operatore_Microsoft (UPN / Email 365)
  qualifica: string;              // Qualifica professionale
  operatoreInCampo: boolean;      // Operatore_In_Campo (true/false)
  tel: string;                    // Tel / cellulare aziendale
}

export interface RifornimentoRecord {
  id: string;                     // ID (PK)
  dataOra: string;                // Data/ora creazione (YYYY-MM-DD HH:mm)
  idVeicolo: string;              // ID_Veicolo (FK)
  targa: string;                  // Targa mezzo
  modelloVeicolo?: string;        // Modello_Veicolo
  operatore: string;              // Operatore (FK con Dipendente)
  quantitaLitri: number;          // Quantità_litri erogati
  kmVeicolo: number;              // Km_veicolo registrati
  nTotalizzatore: number;         // N_totalizzatore pompa/cisterna
  note?: string;                  // Note
  deltaKm?: number;               // Km percorsi dall'ultimo rifornimento (calcolato)
  consumoKmL?: number;            // Consumo calcolato km/L
  consumoL100Km?: number;         // Consumo calcolato L/100km
}

export interface VeicoloRecord {
  id: string;                     // ID (PK)
  targa: string;                  // Targa
  veicolo: string;                // Veicolo (nome sintetico)
  modelloTipologia: string;       // Modello/Tipologia
  euro: string;                   // Euro (es. "Euro 6D-Temp")
  dataAcquisto: string;           // Data_acquisto (YYYY-MM-DD)
  stato: 'Attivo' | 'In Manutenzione' | 'Fermo' | 'Dismesso'; // Stato
  assegnato: string;              // Assegnato (Dipendente o Squadra)
  kmUltimoRifornimento: number;   // Km_veicolo_Ultimo_Rifornimento
  dataUltimoRifornimento: string; // Data_Ultimo_Rifornimento
  note?: string;                  // Note
  storicoRifornimenti?: RifornimentoRecord[]; // Collegamento cronologia
  consumoMedioKmL?: number;       // Media ponderata km/L
  consumoMedioL100Km?: number;    // Media ponderata L/100km
  totaleLitriErogati?: number;    // Somma litri erogati
}

export interface AttrezzaturaRecord {
  id: string;                     // ID (PK)
  idAttrezzo: string;             // ID_Attrezzo (es. "STR-CEI-01")
  idAsset?: string;               // ID_Asset
  tecnoCodice: string;            // Tecno_Codice
  attrezzo: string;               // Attrezzo (categoria / tipologia)
  titolo: string;                 // Titolo (descrizione dettagliata / marca modello)
  posizione: string;              // Posizione (FK con Depositi o Cantieri)
  codMatricola: string;           // Cod Matricola / Seriale
  dAcquisto: string;              // D. Acquisto (YYYY-MM-DD)
  fornitore: string;              // Fornitore
  operResponsabile: string;       // Oper. Responsabi (FK con Dipendente)
  dataGaranzia: string;           // Data Garanzia (YYYY-MM-DD)
  dataManutenzione: string;       // Data_Manutezione (YYYY-MM-DD)
  contenitore?: string;           // Contenitore (Valigia IP67, Cassa metallica, ecc.)
}

export interface DepositoRecord {
  id?: string;                    // ID (PK opzionale)
  titolo: string;                 // Titolo (PK / Nome deposito)
  tecnoCodice: string;            // Tecno_Codice
  tipologia: string;              // Tipologia (Centrale Sede, Hub, Mobile Furgone, Container Cantiere)
}

export interface CantiereRecord {
  id: string;                     // ID (PK)
  codCantiere: string;            // COD_CANTIERE (es. "CNT-2026-01")
  cantiere: string;               // CANTIERE (titolo / descrizione commessa)
  cliente: string;                // CLIENTE (ragione sociale committente)
  codCliente: string;             // COD_CLIENTE
  cantiereAperto: boolean;        // Cantiere_Aperto (true = Sì, false = No)
  assegnato: string;              // Assegnato (Responsabile / Capocantiere)
  dataInizio: string;             // Data_Inizio (YYYY-MM-DD)
}
