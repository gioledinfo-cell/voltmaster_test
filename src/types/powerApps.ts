/**
 * Types & Relational Schemas for Microsoft Power Apps CSV Migration
 * 
 * 7 CSV Datasets:
 * 1. Elenco_dipendeti.csv
 * 2. Elenco_veicoli.csv
 * 3. Attrezzatura.csv
 * 4. Elenco_Depositi.csv
 * 5. Registro_Cantieri (1).csv
 * 6. Registro_carburante.csv
 * 7. Registro_Carico_Carburante_2023.csv
 */

export type CsvDatasetType =
  | 'dipendenti'
  | 'veicoli'
  | 'attrezzature'
  | 'depositi'
  | 'cantieri'
  | 'rifornimenti'
  | 'carichi_carburante';

// 1. Elenco_dipendeti.csv: Matricola (PK), Title (Nome), Cognome, Operatore_Microsoft, Qualifica, Operatore_In_Campo, Attrezzatura_Matricola, Assunzione, Tel
export interface DipendentePA {
  Matricola: string;              // PK, es. "DIP-001" o "104"
  Title: string;                  // Nome, es. "Marco"
  Cognome: string;                // es. "Rossi"
  Operatore_Microsoft?: string;   // account Microsoft / UPN, es. "m.rossi@azienda.it"
  Qualifica: string;              // es. "Caposquadra Elettrico", "Operaio Specializzato"
  Operatore_In_Campo: string;     // "Sì" | "No" o booleano stringa
  Attrezzatura_Matricola?: string;// Matricola attrezzo fisso assegnato
  Assunzione: string;             // Data assunzione YYYY-MM-DD
  Tel: string;                    // Recapito telefonico
}

// 2. Elenco_veicoli.csv: ID (PK), Targa, Veicolo, Modello/Tipologia, Euro, Data_acquisto, Stato, Assegnato, Km_veicolo_Ultimo_Rifornimento, N_tot_Ultimo_Rifornimento, Data_Ultimo_Rifornimento, Operatore_Ultimo_Rifornimento, Qta_Ultimo_Rifornimento, Note
export interface VeicoloPA {
  ID: string;                                   // PK
  Targa: string;                                // es. "FJ482KN"
  Veicolo: string;                              // Nome sintetico, es. "Daily 35 - Squadra A"
  'Modello/Tipologia': string;                  // Modello e allestimento
  Euro: string;                                 // es. "Euro 6D-Temp"
  Data_acquisto: string;                        // YYYY-MM-DD
  Stato: string;                                // "Attivo" | "In Manutenzione" | "Fermo" | "Dismesso"
  Assegnato: string;                            // Dipendente assegnato o squadra
  Km_veicolo_Ultimo_Rifornimento: number;       // Ultimi Km registrati
  N_tot_Ultimo_Rifornimento: number;            // Totalizzatore pompa all'ultimo rifornimento
  Data_Ultimo_Rifornimento: string;             // Data e ora ultimo rifornimento
  Operatore_Ultimo_Rifornimento: string;        // Operatore che ha effettuato l'ultimo rifornimento
  Qta_Ultimo_Rifornimento: number;              // Litri erogati nell'ultimo rifornimento
  Note?: string;
}

// 3. Attrezzatura.csv: ID (PK), ID_Attrezzo, ID_Asset, Tecno_Codice, Attrezzo, Titolo, Posizione, N_Lista, Cod Matricola, D. Acquisto, Fornitore, Oper. Responsabi, Data Demolizione, Data Garanzia, Data_Manutezione, Contenitore
export interface AttrezzaturaPA {
  ID: string;                     // PK
  ID_Attrezzo: string;            // es. "ATT-042"
  ID_Asset?: string;              // Codice Asset inventariale
  Tecno_Codice: string;           // Codice articolo tecnico
  Attrezzo: string;               // Categoria / nome generico es. "Saldatrice Fibra"
  Titolo: string;                 // Descrizione dettagliata / marca modello
  Posizione: string;              // Deposito o Cantiere o Targa Furgone (FK con Elenco_Depositi o Registro_Cantieri)
  N_Lista?: string;               // Numero lista / verbale consegna
  'Cod Matricola': string;        // Matricola / Seriale
  'D. Acquisto': string;          // Data acquisto
  Fornitore: string;              // Fornitore o distributore
  'Oper. Responsabi': string;     // Dipendente responsabile (FK)
  'Data Demolizione'?: string;    // Data dismissione
  'Data Garanzia': string;        // Scadenza garanzia YYYY-MM-DD
  Data_Manutezione: string;       // Prossima manutenzione / taratura YYYY-MM-DD
  Contenitore?: string;           // Valigetta, Cesta, Scaffale
}

// 4. Elenco_Depositi.csv: Titolo (PK/Nome deposito), Tecno_Codice, Tipologia
export interface DepositoPA {
  Titolo: string;                 // PK / Nome deposito, es. "Magazzino Centrale Sede", "Deposito Cantiere Nord"
  Tecno_Codice: string;           // Codice deposito es. "DEP-01"
  Tipologia: string;              // "Centrale" | "Cantiere" | "Mobile Furgone" | "Esterno"
}

// 5. Registro_Cantieri (1).csv: ID (PK), COD_CANTIERE, CANTIERE, CLIENTE, COD_CLIENTE, Cantiere_Aperto, Assegnato, Data_Inizio
export interface CantierePA {
  ID: string;                     // PK
  COD_CANTIERE: string;           // Codice commessa, es. "CNT-2026-01"
  CANTIERE: string;               // Denominazione / oggetto del cantiere
  CLIENTE: string;                // Ragione sociale cliente
  COD_CLIENTE: string;            // Codice anagrafica cliente
  Cantiere_Aperto: string;        // "Sì" | "No" | "TRUE" | "1"
  Assegnato: string;              // Responsabile di cantiere (FK con Dipendenti)
  Data_Inizio: string;            // Data apertura cantiere YYYY-MM-DD
}

// 6. Registro_carburante.csv: ID (PK), Data/ora creazione, ID_Veicolo (FK), Targa, Modello_Veicolo, Operatore, Quantità_litri, Km_veicolo, N_totalizzatore, Note
export interface RifornimentoPA {
  ID: string;                     // PK
  'Data/ora creazione': string;   // Timestamp rifornimento (ISO o YYYY-MM-DD HH:mm)
  ID_Veicolo: string;             // FK con Elenco_veicoli.ID
  Targa: string;                  // Targa mezzo
  Modello_Veicolo: string;        // Modello
  Operatore: string;              // Operatore (FK con Dipendenti)
  Quantità_litri: number;         // Litri erogati
  Km_veicolo: number;             // Contachilometri al momento del pieno
  N_totalizzatore: number;        // Numero progressivo totalizzatore cisterna
  Note?: string;
}

// 7. Registro_Carico_Carburante_2023.csv: Titolo, Data, Operatore, Qta, Qta_Eff, N_Totaliz, Data_Ultimo_Scarico, Operatore_Ultimo_Scarico, Veicolo_Ultimo, Qta_Ultimo_Scarico
export interface CaricoCarburantePA {
  Titolo: string;                 // Numero DDT / Fornitura, es. "Carico Gasolio DDT 2023/182"
  Data: string;                   // Data fornitura
  Operatore: string;              // Responsabile ricezione
  Qta: number;                    // Quantità ordinata litri
  Qta_Eff: number;                // Quantità effettiva scaricata in cisterna
  N_Totaliz: number;              // Totalizzatore prima del carico
  Data_Ultimo_Scarico?: string;   // Data ultimo prelievo
  Operatore_Ultimo_Scarico?: string;
  Veicolo_Ultimo?: string;
  Qta_Ultimo_Scarico?: number;
}

// ========================================================
// ENRICHED / RELATIONAL JOINED INTERFACES (IN MEMORY)
// ========================================================

export interface RifornimentoCalcolato extends RifornimentoPA {
  deltaKm?: number;             // Km percorsi dall'erogazione precedente
  consumoKmL?: number;          // km/l su questa tratta
  consumoL100Km?: number;       // l/100km su questa tratta
  operatoreDipendente?: DipendentePA;
  veicoloRif?: VeicoloPA;
}

export interface VeicoloEnriched extends VeicoloPA {
  autistaDipendente?: DipendentePA;
  storicoRifornimenti: RifornimentoCalcolato[];
  totaleLitriErogati: number;
  kmPercorsiTotaliTracciati: number;
  consumoMedioKmL: number;
  consumoMedioL100Km: number;
  ultimoRifornimento?: RifornimentoCalcolato;
}

export interface AttrezzaturaEnriched extends AttrezzaturaPA {
  depositoCollegato?: DepositoPA;
  cantiereCollegato?: CantierePA;
  operatoreResponsabileObj?: DipendentePA;
  isManutenzioneScaduta: boolean;
  isManutenzioneInScadenza: boolean; // entro 30 giorni
  giorniAllaManutenzione: number;
  isGaranziaScaduta: boolean;
  giorniAllaGaranzia: number;
}

export interface CantierePAEnriched extends CantierePA {
  isAperto: boolean;
  responsabileDipendente?: DipendentePA;
  attrezzaturePresenti: AttrezzaturaPA[];
}

export interface PowerAppsKpis {
  cantieriAperti: number;
  cantieriTotali: number;
  veicoliAttivi: number;
  veicoliTotali: number;
  litriTotaliErogati: number;
  numeroRifornimentiTotali: number;
  attrezzatureManutenzioneInScadenza: number;
  attrezzatureGaranziaInScadenza: number;
  attrezzatureTotali: number;
  dipendentiInCampo: number;
  dipendentiTotali: number;
  carburanteCisternaStimatoLitri: number;
}

export interface TableMetaConfig {
  type: CsvDatasetType;
  fileName: string;
  title: string;
  description: string;
  primaryKey: string;
  expectedHeaders: string[];
}
