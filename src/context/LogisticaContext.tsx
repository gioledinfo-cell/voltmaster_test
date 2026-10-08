import React, { createContext, useContext } from 'react';
import {
  ArticoloMagazzino,
  MovimentoMagazzino,
  Attrezzatura,
  Veicolo,
  RichiestaMateriali,
} from '../types';
import { DepositoRecord, RifornimentoRecord } from '../types/gestioneOperativa';
import { PaccoZonaVerde } from '../types/zonaVerde';
import { ArticoloListinoFornitore } from '../data/listinoFornitore';

export interface LogisticaContextType {
  // Magazzino & Materiali
  magazzino: ArticoloMagazzino[];
  movimenti: MovimentoMagazzino[];
  addArticoloMagazzino: (a: Omit<ArticoloMagazzino, 'id'> & { id?: string }) => ArticoloMagazzino;
  addArticoliMagazzinoBatch: (articoli: (Omit<ArticoloMagazzino, 'id'> & { id?: string })[]) => number;
  updateArticoloMagazzino: (id: string, updates: Partial<ArticoloMagazzino>) => void;
  addMovimento: (m: Omit<MovimentoMagazzino, 'id'>) => void;

  // Listino Fornitore (RemaTarlazzi)
  listinoFornitore: ArticoloListinoFornitore[];
  updateListinoFornitore: (items: ArticoloListinoFornitore[]) => void;

  // Attrezzature & Flotta Mezzi
  attrezzature: Attrezzatura[];
  veicoli: Veicolo[];
  depositi: DepositoRecord[];
  rifornimenti: RifornimentoRecord[];
  addAttrezzatura: (a: Omit<Attrezzatura, 'id'>) => Attrezzatura;
  updateAttrezzatura: (id: string, updates: Partial<Attrezzatura>) => void;
  addVeicolo: (v: Omit<Veicolo, 'id'>) => Veicolo;
  updateVeicolo: (id: string, updates: Partial<Veicolo>) => void;
  setVeicoliList: (list: Veicolo[]) => void;
  addRifornimento: (r: Omit<RifornimentoRecord, 'id'>) => RifornimentoRecord;
  addDeposito: (dep: Omit<DepositoRecord, 'id'>) => DepositoRecord;

  // Pacchi Logistica Zona Verde
  pacchiZonaVerde: PaccoZonaVerde[];
  addPaccoZonaVerde: (pacco: Omit<PaccoZonaVerde, 'id' | 'numeroPacco' | 'dataCreazione'>) => PaccoZonaVerde;
  updatePaccoZonaVerde: (id: string, updates: Partial<PaccoZonaVerde>) => void;

  // Richieste Materiali da Cantiere
  richiesteMateriali: RichiestaMateriali[];
  addRichiestaMateriali: (richiesta: Omit<RichiestaMateriali, 'id' | 'numero' | 'notifica'>) => RichiestaMateriali;
  updateRichiestaMateriali: (id: string, updates: Partial<RichiestaMateriali>) => void;
}

export const LogisticaContext = createContext<LogisticaContextType | undefined>(undefined);

export function useLogistica(): LogisticaContextType {
  const context = useContext(LogisticaContext);
  if (!context) {
    throw new Error('useLogistica deve essere utilizzato all\'interno di un LogisticaProvider o AppProvider');
  }
  return context;
}
