export type SemaforoStato = 'scaduto' | 'urgente_15gg' | 'attenzione_30gg' | 'regolare';

export type CategoriaScadenza =
  | 'durc'
  | 'taratura_cei64'
  | 'revisione_veicoli'
  | 'patentini_sicurezza'
  | 'cantieri_sicurezza';

export interface StoricoRinnovoScadenza {
  id: string;
  dataRinnovo: string;
  scadenzaPrecedente: string;
  nuovaScadenza: string;
  operatoreNome: string;
  nuovoProtocollo?: string;
  costo?: number;
  note?: string;
}

export interface ScadenzaItem {
  id: string;
  categoria: CategoriaScadenza;
  titolo: string;
  descrizione: string;
  soggetto: string; // Azienda, Dipendente, Strumento, Veicolo, Subappaltatore
  ruoloORipartizione?: string; // es. "Capocantiere", "Laboratorio Accredia", "Officina MCTC"
  dataScadenza: string; // YYYY-MM-DD
  dataUltimoRinnovo?: string; // YYYY-MM-DD
  priorita: 'alta' | 'media' | 'bassa';
  protocolloONumero?: string; // es. "INPS_38920194", "LAT102-2025/11", "CEI-11-27-2021-04"
  enteRilascio?: string; // es. "INPS / INAIL", "Laboratorio Accredia", "Motorizzazione Civile"
  costoRinnovoPrevisto?: number;
  riferimentoId?: string; // id dipendente, veicolo, attrezzatura o cantiere
  riferimentoTipo?: 'dipendente' | 'veicolo' | 'attrezzatura' | 'cantiere' | 'fornitore';
  documentoAllegatoNome?: string;
  documentoAllegatoUrl?: string;
  note?: string;
  storicoRinnovi?: StoricoRinnovoScadenza[];
}

export interface NotificaSistema {
  id: string;
  scadenzaId?: string;
  tipo: 'alert_scaduto' | 'alert_15gg' | 'alert_30gg' | 'rinnovo_eseguito' | 'sistema';
  livello: 'rosso' | 'arancione' | 'giallo' | 'verde' | 'info';
  titolo: string;
  messaggio: string;
  dataOra: string;
  letta: boolean;
  categoria: CategoriaScadenza | 'generale';
  linkTab?: string;
  giorniRimanenti?: number;
}

/**
 * Calcola lo stato del semaforo e i giorni rimanenti rispetto a una data di riferimento (default 30 Settembre 2026)
 */
export function calcolaSemaforoScadenza(
  dataScadenzaStr: string,
  dataRifStr: string = '2026-09-30'
): { stato: SemaforoStato; giorniRimanenti: number } {
  try {
    const dataScad = new Date(dataScadenzaStr);
    const dataRif = new Date(dataRifStr);

    // Resetta l'ora per comparazione pura di giorni di calendario
    dataScad.setHours(0, 0, 0, 0);
    dataRif.setHours(0, 0, 0, 0);

    const diffTime = dataScad.getTime() - dataRif.getTime();
    const giorniRimanenti = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (giorniRimanenti < 0) {
      return { stato: 'scaduto', giorniRimanenti };
    } else if (giorniRimanenti <= 15) {
      return { stato: 'urgente_15gg', giorniRimanenti };
    } else if (giorniRimanenti <= 30) {
      return { stato: 'attenzione_30gg', giorniRimanenti };
    } else {
      return { stato: 'regolare', giorniRimanenti };
    }
  } catch {
    return { stato: 'regolare', giorniRimanenti: 999 };
  }
}

export function getBadgeColorSemaforo(stato: SemaforoStato): {
  bg: string;
  border: string;
  text: string;
  ring: string;
  iconBg: string;
  label: string;
} {
  switch (stato) {
    case 'scaduto':
      return {
        bg: 'bg-rose-500/15',
        border: 'border-rose-500/50',
        text: 'text-rose-400',
        ring: 'ring-rose-500/40',
        iconBg: 'bg-rose-500',
        label: 'SCADUTO',
      };
    case 'urgente_15gg':
      return {
        bg: 'bg-orange-500/15',
        border: 'border-orange-500/50',
        text: 'text-orange-400',
        ring: 'ring-orange-500/40',
        iconBg: 'bg-orange-500',
        label: 'ALERT 15 GG',
      };
    case 'attenzione_30gg':
      return {
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/50',
        text: 'text-amber-400',
        ring: 'ring-amber-500/40',
        iconBg: 'bg-amber-400',
        label: 'ALERT 30 GG',
      };
    case 'regolare':
    default:
      return {
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/50',
        text: 'text-emerald-400',
        ring: 'ring-emerald-500/40',
        iconBg: 'bg-emerald-400',
        label: 'REGOLARE',
      };
  }
}
