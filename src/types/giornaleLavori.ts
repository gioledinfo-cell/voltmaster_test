import { ROLMeteo } from './index';

export interface FotoCantiereGiornale {
  id: string;
  url: string;
  didascalia: string;
  oraScatto: string;
  categoria: 'strutture' | 'impianti' | 'sicurezza' | 'imprevisto' | 'collaudo';
}

export interface MaestranzaGiornale {
  id: string;
  nome: string;
  ruolo: string; // es. Capocantiere, Operaio Specializzato, Subappaltatore
  ditta: string; // es. VoltMaster S.r.l., EuroMontaggi Impianti, EdilScavi S.r.l.
  oreSvolte: number;
  presente: boolean;
}

export interface ImprevistoGiornale {
  id: string;
  oraRiscontro: string;
  descrizione: string;
  causa: 'meteo' | 'fornitore' | 'variante_dl' | 'sicurezza' | 'guasto_mezzo';
  oreFermo: number;
  azioniIntraprese: string;
}

export interface GiornaleLavoriItem {
  id: string;
  numeroVerbale: string; // es. "GL-2026-084"
  data: string; // YYYY-MM-DD
  cantiereId: string;
  cantiereTitolo: string;
  clienteNome: string;
  direttoreLavoriNome: string; // es. "Ing. Roberto Fontana"
  capocantiereNome: string; // es. "Marco Rossi"
  
  faseGanttId?: string;
  faseGanttTitolo?: string;
  
  meteo: ROLMeteo;
  lavorazioniEseguite: string;
  quantitaPosata?: string;
  avanzamentoPercentuale: number; // 0-100
  
  maestranze: MaestranzaGiornale[];
  imprevisti: ImprevistoGiornale[];
  attrezzature: { nome: string; matricolaTarga?: string; oreUtilizzo: number; operatoreUtilizzatore?: string }[];
  
  fotoGalleria: FotoCantiereGiornale[];
  noteSicurezzaDL?: string;
  
  statoApprovazioneDL: 'in_attesa' | 'approvato_dl' | 'contestato';
  firmaDLDataUrl?: string;
  firmaDLDataOra?: string;
  firmaCapocantiereDataUrl?: string;
  firmaCapocantiereDataOra?: string;
  sigilloDigitaleHash?: string;
}
