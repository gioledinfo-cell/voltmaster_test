export type StatoDDT = 'bozza' | 'in_viaggio' | 'consegnato' | 'annullato';

export type CausaleDDT =
  | 'installazione_cantiere' // Conto Lavorazione / Posa in opera cantiere
  | 'vendita_materiale'      // Vendita diretta con posa
  | 'conto_visione'          // C/Visione e prova tecnica
  | 'reso_magazzino'         // Reso eccedenze da cantiere a magazzino
  | 'riparazione_garanzia';  // Invio a riparazione / taratura

export type AspettoBeniDDT =
  | 'a_vista_colli'
  | 'cartoni_imballati'
  | 'bobine_cavi'
  | 'pallet_fasciato'
  | 'sfuso_cassonato';

export type PortoDDT = 'franco' | 'assegnato';

export type TipoVettoreDDT = 'mezzo_proprio_mittente' | 'vettore_terzo' | 'ritiro_cliente';

export interface RigaDDT {
  id: string;
  articoloId?: string;
  sku: string;
  descrizione: string;
  unitaMisura: string;
  quantita: number;
  valoreUnitario?: number;
  valoreTotale?: number;
  lottoMatricola?: string;
  note?: string;
}

export interface DocumentoDiTrasporto {
  id: string;
  numeroDdt: string;           // es. "DDT-2026/048"
  dataEmissione: string;       // YYYY-MM-DD
  // Alias di compatibilità
  numero?: string;
  data?: string;
  causale?: string;
  articoli?: RigaDDT[];
  oraPartenza?: string;        // HH:mm
  stato: StatoDDT;
  
  // Mittente (Fisso VoltMaster)
  mittenteRagioneSociale: string;
  mittenteIndirizzo: string;
  mittentePiva: string;
  
  // Destinazione Cantiere & Cliente
  cantiereId: string;
  cantiereNome: string;
  cantiereIndirizzo: string;
  cantiereCitta: string;
  clienteNome: string;
  clientePivaCodFisc: string;
  
  // Trasporto & Vettore (D.P.R. 472/96)
  causaleTrasporto: CausaleDDT;
  aspettoBeni: AspettoBeniDDT;
  numeroColli: number;
  pesoTotaleKg: number;
  porto: PortoDDT;
  tipoVettore: TipoVettoreDDT;
  vettoreRagioneSociale?: string;
  
  // Associazione Veicolo & Conducente
  veicoloId?: string;
  veicoloTarga?: string;
  veicoloModello?: string;
  autistaNome?: string;
  
  // Dettaglio Merci
  righe: RigaDDT[];
  annotazioni?: string;
  
  // Firme grafometriche & ricezione
  firmaMittente?: string;           // Data URL PNG
  firmaVettore?: string;            // Data URL PNG
  firmaDestinatario?: string;       // Data URL PNG
  nomeRiceventeCantiere?: string;
  dataOraRicezione?: string;
  
  scaricaMagazzino: boolean;        // Se true, genera scarico automatico giacenze
  creatoDa: {
    id: string;
    name: string;
  };
}
