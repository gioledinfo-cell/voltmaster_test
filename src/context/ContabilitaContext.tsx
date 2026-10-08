import React, { createContext, useContext } from 'react';
import {
  Cliente,
  Preventivo,
  Cantiere,
  StatoAvanzamentoLavori,
  CertificatoPagamento,
  DocumentoDiTrasporto,
  OrdineInterno,
  StatoOrdine,
  FornitoreAnagrafica,
} from '../types';

export interface ContabilitaContextType {
  // Clienti & Preventivi
  clienti: Cliente[];
  preventivi: Preventivo[];
  addCliente: (c: Omit<Cliente, 'id'>) => Cliente;
  updateCliente: (id: string, updates: Partial<Cliente>) => void;
  addPreventivo: (p: Omit<Preventivo, 'id'>) => Preventivo;
  updatePreventivo: (id: string, updates: Partial<Preventivo>) => void;
  convertPreventivoToCantiere: (prevId: string) => Cantiere | null;

  // SAL (Stato Avanzamento Lavori)
  sals: StatoAvanzamentoLavori[];
  addSal: (sal: Omit<StatoAvanzamentoLavori, 'id'>) => StatoAvanzamentoLavori;
  updateSal: (id: string, updates: Partial<StatoAvanzamentoLavori>) => void;
  deleteSal: (id: string) => void;
  approvaSalDL: (id: string, nomeDL: string, note?: string) => void;
  emettiCertificatoPagamento: (salId: string, cert: CertificatoPagamento) => void;
  liquidaSal: (salId: string, rifFattura?: string) => void;

  // DDT (Documenti di Trasporto)
  ddts: DocumentoDiTrasporto[];
  addDdt: (ddt: Omit<DocumentoDiTrasporto, 'id' | 'numeroDdt'>) => DocumentoDiTrasporto;
  updateDdt: (id: string, updates: Partial<DocumentoDiTrasporto>) => void;
  annullaDdt: (id: string, motivo: string) => void;
  scaricaDdtInMagazzino: (ddtId: string) => void;

  // Ordini Interni & Fornitori
  ordiniInterni: OrdineInterno[];
  fornitori: FornitoreAnagrafica[];
  addOrdineInterno: (ordine: Omit<OrdineInterno, 'id' | 'numero' | 'storicoStati' | 'creatoDa'>) => OrdineInterno;
  updateOrdineInterno: (id: string, updates: Partial<OrdineInterno>) => void;
  deleteOrdineInterno: (id: string) => void;
  transizioneStatoOrdine: (id: string, nuovoStato: StatoOrdine, note?: string, motivoAnnullamento?: string) => void;
  duplicaOrdineInterno: (id: string) => OrdineInterno;
  addCommentoOrdine: (ordineId: string, testo: string) => void;
}

export const ContabilitaContext = createContext<ContabilitaContextType | undefined>(undefined);

export function useContabilita(): ContabilitaContextType {
  const context = useContext(ContabilitaContext);
  if (!context) {
    throw new Error('useContabilita deve essere utilizzato all\'interno di un ContabilitaProvider o AppProvider');
  }
  return context;
}
