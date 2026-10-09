/**
 * Tipologie per Diagramma di Gantt, Cronoprogramma Commesse
 * e Calendario Allocazione Risorse con Rilevamento Conflitti (Overbooking)
 */

export type TipoRisorsaGantt = 'dipendente' | 'attrezzatura' | 'veicolo';

export interface AllocazioneRisorsa {
  id: string;
  cantiereId: string;
  cantiereTitolo: string;
  codiceCommessa?: string;
  lavorazioneFaseId?: string;
  faseDescrizione: string; // es. "Allacciamento cabina MT/BT", "Posa canale cavi con PLE"
  
  tipoRisorsa: TipoRisorsaGantt;
  risorsaId: string;
  risorsaNome: string;
  risorsaDettaglio?: string; // Ruolo aziendale, targa veicolo, matricola PLE
  
  dataInizio: string; // YYYY-MM-DD
  dataFine: string;   // YYYY-MM-DD
  oraInizio?: string; // es. "08:00"
  oraFine?: string;   // es. "17:00"
  
  statoAllocazione: 'confermata' | 'pianificata' | 'in_corso' | 'completata';
  priorita: 'normale' | 'alta' | 'bloccante';
  percentualeCompletamento?: number;
  note?: string;
}

export interface ConflittoRisorsa {
  id: string;
  risorsaId: string;
  risorsaNome: string;
  tipoRisorsa: TipoRisorsaGantt;
  dataConflitto: string; // YYYY-MM-DD
  allocazioneA: {
    id: string;
    cantiereId: string;
    cantiereTitolo: string;
    fase: string;
    orario?: string;
  };
  allocazioneB: {
    id: string;
    cantiereId: string;
    cantiereTitolo: string;
    fase: string;
    orario?: string;
  };
  gravita: 'critico_overbooking' | 'avviso_orario';
  messaggio: string;
}

export interface MilestoneGantt {
  id: string;
  cantiereId: string;
  titolo: string;
  dataPrevista: string;
  completata: boolean;
  tipo: 'collaudo' | 'allaccio_enel' | 'sal_intermedio' | 'consegna_dico';
}

export interface FaseGanttCantiere {
  id: string;
  cantiereId: string;
  cantiereTitolo: string;
  titoloFase: string;
  categoriaFase?: 'opere_murarie_tracce' | 'posa_cavi_tubazioni' | 'infilaggio_attestazione' | 'montaggio_apparecchiature' | 'collaudo_certificazione';
  salRiferimento?: string; // es. "SAL #1 — 30% Imponibile"
  salId?: string;
  importoFaseEuro?: number;
  dataInizio: string;
  dataFine: string;
  percentualeAvanzamento: number; // 0 - 100
  coloreBarra?: string;
  dipendentiAssegnati: string[];
  attrezzatureAssegnate: string[];
  veicoliAssegnati: string[];
  stato: 'non_iniziata' | 'in_corso' | 'in_ritardo' | 'completata';
}
