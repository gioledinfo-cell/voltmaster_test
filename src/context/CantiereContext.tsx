import React, { createContext, useContext } from 'react';
import {
  Cantiere,
  ROL,
  Lavorazione,
  Dipendente,
  PresenzaCantiere,
  DocumentoTecnico,
  SegnalazioneCliente,
} from '../types';
import { ScadenzaItem } from '../types/scadenze';

export interface CantiereContextType {
  // State
  cantieri: Cantiere[];
  selectedCantiereId: string | null;
  setSelectedCantiereId: (id: string | null) => void;
  rols: ROL[];
  lavorazioni: Lavorazione[];
  dipendenti: Dipendente[];
  presenze: PresenzaCantiere[];
  documenti: DocumentoTecnico[];
  segnalazioni: SegnalazioneCliente[];
  scadenze: ScadenzaItem[];

  // Mutators
  addCantiere: (c: Omit<Cantiere, 'id'>) => Cantiere;
  updateCantiere: (id: string, updates: Partial<Cantiere>) => void;
  addROL: (rol: Omit<ROL, 'id' | 'numero'>) => ROL;
  updateROL: (id: string, updates: Partial<ROL>) => void;
  approveROL: (id: string, note?: string) => void;
  rejectROL: (id: string, note: string) => void;
  addLavorazione: (l: Omit<Lavorazione, 'id'>) => Lavorazione;
  updateLavorazione: (id: string, updates: Partial<Lavorazione>) => void;
  addDocumento: (doc: Omit<DocumentoTecnico, 'id'>) => DocumentoTecnico;
  addSegnalazione: (seg: Omit<SegnalazioneCliente, 'id'>) => SegnalazioneCliente;
  updateSegnalazione: (id: string, updates: Partial<SegnalazioneCliente>) => void;
  addPresenza: (presenza: Omit<PresenzaCantiere, 'id'>) => void;
  updatePresenza: (id: string, updates: Partial<PresenzaCantiere>) => void;
  deletePresenza: (id: string) => void;
  timbraturaRapidaSquadra: (cantiereId: string, squadraNome: string, dipendentiIds: string[], data?: string) => void;
  approvaPresenza: (id: string, approvatoreNome: string) => void;
  addScadenza: (scadenza: Omit<ScadenzaItem, 'id'>) => ScadenzaItem;
  updateScadenza: (id: string, updates: Partial<ScadenzaItem>) => void;
  deleteScadenza: (id: string) => void;
  rinnovaScadenza: (id: string, nuovaData: string, note?: string, nuovoProtocollo?: string, costo?: number) => void;
}

export const CantiereContext = createContext<CantiereContextType | undefined>(undefined);

export function useCantiere(): CantiereContextType {
  const context = useContext(CantiereContext);
  if (!context) {
    throw new Error('useCantiere deve essere utilizzato all\'interno di un CantiereProvider o AppProvider');
  }
  return context;
}
