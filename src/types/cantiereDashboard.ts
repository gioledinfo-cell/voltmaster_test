import { CantiereStato } from './index';

export type StatoStockMateriale = 'ottimale' | 'in_esaurimento' | 'critico';
export type StatoAttrezzaturaCantiere = 'operativo' | 'in_manutenzione' | 'da_verificare';
export type CategoriaDocumentoCantiere = 'sicurezza_pos' | 'permessi' | 'certificazioni' | 'contratti';
export type StatoValiditaDocumento = 'valido' | 'in_scadenza' | 'scaduto';

export interface CantiereMaterialeStock {
  id: string;
  nome: string;
  categoria: string;
  quantitaAllocata: number;
  quantitaUtilizzata: number;
  giacenzaRimanente: number;
  unitaMisura: string;
  statoStock: StatoStockMateriale;
  scortaMinimaCantiere?: number;
  ultimoScaricoData?: string;
}

export interface CantiereAttrezzaturaItem {
  id: string;
  codiceUnivoco: string;
  nome: string;
  marcaModello: string;
  matricola: string;
  stato: StatoAttrezzaturaCantiere;
  prossimaRevisioneTaratura: string;
  assegnatoA: string; // es. Operatore o Squadra
  isScadenzaImminente: boolean;
}

export interface CantiereDocumentoItem {
  id: string;
  titolo: string;
  categoria: CategoriaDocumentoCantiere;
  statoValidita: StatoValiditaDocumento;
  dataEmissione: string;
  dataScadenza?: string;
  enteRilascio?: string;
  formato: 'pdf' | 'dwg' | 'p7m' | 'doc';
  dimensioneKb: number;
  codiceProtocollo?: string;
  urlSimulato?: string;
}

export interface CantiereFotoAllegato {
  id: string;
  titolo: string;
  url: string;
  data: string;
  faseLavoro: string;
  caricatoDa: string;
  dimensioneKb: number;
  isOggi?: boolean;
}

export interface CantiereDashboardKPI {
  materialiInEsaurimentoCount: number;
  documentiInScadenzaCount: number;
  fotoCaricateOggiCount: number;
  attrezzatureOperativeCount: number;
  attrezzatureTotaliCount: number;
  oreLavorateTotali: number;
  costoConsuntivato: number;
  budgetTotale: number;
  avanzamentoPercentuale: number;
}

export interface CantiereDashboardData {
  cantiere: {
    id: string;
    codice: string;
    titolo: string;
    clienteNome: string;
    indirizzo: string;
    citta: string;
    stato: CantiereStato;
    capocantiereNome: string;
    responsabilePM: string;
    dataInizio: string;
    dataFinePrevista: string;
    descrizione: string;
    qrCode: string;
  };
  kpi: CantiereDashboardKPI;
  materiali: CantiereMaterialeStock[];
  attrezzature: CantiereAttrezzaturaItem[];
  documenti: CantiereDocumentoItem[];
  foto: CantiereFotoAllegato[];
}
