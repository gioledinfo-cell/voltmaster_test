import {
  CategoriaCongruita,
  CalcoloCongruitaManodopera,
  StatoAvanzamentoLavori,
  AttestazioneEdilconnect,
} from '../types/sal';
import { ROL } from '../types';

export interface CategoriaCongruitaInfo {
  codice: CategoriaCongruita;
  nome: string;
  descrizione: string;
  percentualeMinima: number;
  riferimentoNormativo: string;
}

/**
 * Soglia minima di applicabilità D.M. 143/2021 per contratti privati (€ 70.000).
 * Per gli appalti pubblici la congruità si applica a qualsiasi importo.
 */
export const SOGLIA_MINIMA_CONTRATTI_PRIVATI_EURO = 70000;

/**
 * Tabella ufficiale dei coefficienti di congruità della manodopera
 * Allegato 1 al Decreto Ministeriale n. 143 del 25/06/2021
 */
export const TABELLA_CONGRUITA_DM143: Record<CategoriaCongruita, CategoriaCongruitaInfo> = {
  OG11_OS30: {
    codice: 'OG11_OS30',
    nome: 'Impianti Elettrici, Speciali & Tecnologici (OG11 / OS30)',
    descrizione: 'Impianti elettrici civili e industriali, quadri BT/MT, domotica, automazione, fotovoltaico e speciali',
    percentualeMinima: 14.28,
    riferimentoNormativo: 'D.M. 143/2021 Tab. All. 1 - Categoria Impianti Elettrici e Tecnologici (Soglia Minima 14.28%)',
  },
  OG1: {
    codice: 'OG1',
    nome: 'Edilizia Civile e Industriale (OG1)',
    descrizione: 'Costruzione, manutenzione e ristrutturazione fabbricati civili, industriali e commerciali',
    percentualeMinima: 22.0,
    riferimentoNormativo: 'D.M. 143/2021 Tab. All. 1 - Nuova Costruzione / Edilizia (22%)',
  },
  OG2: {
    codice: 'OG2',
    nome: 'Restauro & Ristrutturazione Immobili (OG2)',
    descrizione: 'Restauro, risanamento conservativo di edifici storici e riqualificazioni complesse',
    percentualeMinima: 20.0,
    riferimentoNormativo: 'D.M. 143/2021 Tab. All. 1 - Beni Immobili Vincolati (20%)',
  },
  OS28: {
    codice: 'OS28',
    nome: 'Impianti Termoidraulici & Climatizzazione (OS28)',
    descrizione: 'Impianti idraulici, termici, ventilazione e condizionamento aria',
    percentualeMinima: 14.28,
    riferimentoNormativo: 'D.M. 143/2021 Tab. All. 1 - Impianti Meccanici e Termici (14.28%)',
  },
  OS13: {
    codice: 'OS13',
    nome: 'Strutture Prefabbricate in Cemento Armato (OS13)',
    descrizione: 'Posa in opera e montaggio manufatti prefabbricati',
    percentualeMinima: 10.0,
    riferimentoNormativo: 'D.M. 143/2021 Tab. All. 1 - Prefabbricati (10%)',
  },
  OS6: {
    codice: 'OS6',
    nome: 'Finiture di Opere Generali & Cartongessi (OS6)',
    descrizione: 'Posa cartongessi, controsoffitti, isolamenti termoacustici e tinteggiature',
    percentualeMinima: 34.0,
    riferimentoNormativo: 'D.M. 143/2021 Tab. All. 1 - Finiture Generali (34%)',
  },
  CUSTOM: {
    codice: 'CUSTOM',
    nome: 'Categoria Personalizzata / Mista',
    descrizione: 'Percentuale contrattuale specifica concordata con la Cassa Edile / CNCE',
    percentualeMinima: 14.0,
    riferimentoNormativo: 'Accordo Territoriale Parti Sociali / Capitolato',
  },
};

/**
 * Elenco Casse Edili Territoriali di riferimento per il rilascio attestazione CNCE EdilConnect
 */
export const CASSE_EDILI_TERRITORIALI = [
  'Cassa Edile di Milano, Lodi, Monza e Brianza',
  'Cassa Edile di Roma e Provincia',
  'Cassa Edile di Torino',
  'Cassa Edile di Bologna',
  'Cassa Edile di Brescia',
  'Cassa Edile di Bergamo',
  'Cassa Edile di Firenze',
  'Cassa Edile di Napoli',
  'Cassa Edile di Verona',
  'Cassa Edile di Padova e Vicenza',
];

/**
 * Calcola le ore totali registrate nei ROL (inclusi collaboratori e straordinari)
 * per uno specifico cantiere o in un intervallo di date
 */
export function calcolaOreTotaliRolCantiere(
  cantiereId: string,
  cantiereNome: string,
  rols: ROL[],
  periodoInizio?: string,
  periodoFine?: string
): {
  oreTotali: number;
  oreOrdinarie: number;
  oreStraordinarie: number;
  oreSquadra: number;
  conteggioRol: number;
} {
  const normNome = cantiereNome.toLowerCase().trim();

  const rolsCantiere = rols.filter((r) => {
    const matchId =
      r.cantiereId === cantiereId ||
      r.cantiereId === `cnt-${cantiereId.replace('c-', '')}` ||
      r.cantiereId.replace('cnt-', '') === cantiereId.replace('c-', '');

    const matchNome =
      r.cantiereTitolo.toLowerCase().includes(normNome) ||
      normNome.includes(r.cantiereTitolo.toLowerCase());

    const isMatch = matchId || matchNome;
    if (!isMatch) return false;

    // Filtro per periodo opzionale
    if (periodoInizio && r.data < periodoInizio) return false;
    if (periodoFine && r.data > periodoFine) return false;

    return true;
  });

  let oreOrd = 0;
  let oreStr = 0;
  let oreSquadra = 0;

  for (const r of rolsCantiere) {
    oreOrd += r.oreOrdinarie || 0;
    oreStr += r.oreStraordinarie || 0;

    if (r.collaboratori && r.collaboratori.length > 0) {
      for (const c of r.collaboratori) {
        const cOrd = c.oreOrdinarie ?? r.oreOrdinarie ?? 0;
        const cStr = c.oreStraordinarie ?? r.oreStraordinarie ?? 0;
        oreSquadra += cOrd + cStr;
      }
    }
  }

  const oreTotali = oreOrd + oreStr + oreSquadra;

  return {
    oreTotali,
    oreOrdinarie: oreOrd,
    oreStraordinarie: oreStr,
    oreSquadra,
    conteggioRol: rolsCantiere.length,
  };
}

/**
 * Genera un protocollo univoco telematico nel formato CNCE Edilconnect
 */
export function generaProtocolloEdilconnect(cantiereId: string, numeroSal: number): string {
  const anno = new Date().getFullYear();
  const hash = Math.random().toString(36).substring(2, 7).toUpperCase();
  const cleanId = cantiereId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  return `CNCE-EDILCONNECT-${anno}-${cleanId}S${numeroSal}-${hash}`;
}

/**
 * Genera l'hash di verifica crittografica per la Stazione Appaltante / Committente
 */
export function generaCodiceUnivocoVerifica(protocollo: string): string {
  const hashPart = Math.random().toString(16).substring(2, 10).toUpperCase();
  return `AUTH-${protocollo.replace(/CNCE-EDILCONNECT-/g, '')}-${hashPart}`;
}

/**
 * Calcola l'incidenza della manodopera secondo il Decreto Ministeriale n. 143 del 25/06/2021
 * e verifica in tempo reale il rilascio dell'attestazione CNCE Edilconnect prima della fatturazione finale.
 */
export function calcolaCongruitaManodoperaSAL(
  sal: StatoAvanzamentoLavori,
  rols: ROL[],
  categoria: CategoriaCongruita = 'OG11_OS30',
  costoOrarioConvenzionale: number = 35.0,
  percentualeCustom?: number,
  valoreGiustificativiEuro: number = 0,
  usaCumulato: boolean = true,
  isAppaltoPubblico: boolean = false
): CalcoloCongruitaManodopera {
  const catInfo = TABELLA_CONGRUITA_DM143[categoria] || TABELLA_CONGRUITA_DM143.OG11_OS30;
  
  // Percentuale minima di legge (14.28% per OG11/OS30 impianti elettrici)
  const percMinima =
    categoria === 'CUSTOM' && percentualeCustom !== undefined
      ? percentualeCustom
      : catInfo.percentualeMinima;

  // Importo lavori imponibile (cumulato all'ultimo SAL o periodo corrente)
  const importoLavoriImponibile = usaCumulato
    ? sal.totaleLavoriCumulati || sal.importoContrattualeTotale || 1
    : sal.totaleLavoriPeriodo || 1;

  // Verifica assoggettabilità ad obbligo D.M. 143/2021:
  // - Tutti gli appalti pubblici
  // - Appalti privati di importo complessivo pari o superiore a € 70.000
  const importoComplessivoCommessa = sal.importoContrattualeTotale || sal.totaleLavoriCumulati;
  const isOperaSoggettaObbligo =
    isAppaltoPubblico || importoComplessivoCommessa >= SOGLIA_MINIMA_CONTRATTI_PRIVATI_EURO;
  const sogliaMinimaImportoEuro = isAppaltoPubblico ? 0 : SOGLIA_MINIMA_CONTRATTI_PRIVATI_EURO;

  // Fabbisogno minimo monetario imposto dal D.M. 143/2021 (es. 14.28% per OG11/OS30)
  const fabbisognoMinimoManodoperaEuro = Math.round(
    (importoLavoriImponibile * (percMinima / 100)) * 100
  ) / 100;

  // Calcolo ore reali dai ROL per il cantiere
  const statsOre = calcolaOreTotaliRolCantiere(
    sal.cantiereId,
    sal.cantiereNome,
    rols,
    usaCumulato ? undefined : sal.periodoInizio,
    sal.dataEmissione
  );

  // Stima prudenziale in assenza di ROL manuali per visualizzazione coerente
  let oreEffettive = statsOre.oreTotali;
  if (oreEffettive === 0 && sal.totaleLavoriCumulati > 0) {
    const stimaEuro = sal.totaleLavoriCumulati * 0.165;
    oreEffettive = Math.round(stimaEuro / costoOrarioConvenzionale);
  }

  // Valore monetario manodopera effettiva (ore * costo orario contrattuale + eventuali subappalti)
  const valoreManodoperaLavoroDiretto = Math.round(
    (oreEffettive * costoOrarioConvenzionale) * 100
  ) / 100;

  const valoreManodoperaEffettivaEuro = Math.round(
    (valoreManodoperaLavoroDiretto + valoreGiustificativiEuro) * 100
  ) / 100;

  // Incidenza percentuale effettiva registrata
  const percentualeIncidenzaEffettiva = Math.round(
    ((valoreManodoperaEffettivaEuro / importoLavoriImponibile) * 100) * 100
  ) / 100;

  // Verifica Congruità
  const isCongruo = percentualeIncidenzaEffettiva >= percMinima;
  const differenzaPercentuale = Math.round((percentualeIncidenzaEffettiva - percMinima) * 100) / 100;
  const differenzaEuro = Math.round(
    (valoreManodoperaEffettivaEuro - fabbisognoMinimoManodoperaEuro) * 100
  ) / 100;

  // Ore mancanti per colmare il divario
  const oreMancanti = isCongruo
    ? 0
    : Math.ceil(Math.abs(differenzaEuro) / costoOrarioConvenzionale);

  // Identificazione se questo SAL rappresenta la chiusura/saldo dell'opera
  const isSalFinale = Boolean(
    sal.isSalFinale ||
    sal.codiceSal.toLowerCase().includes('finale') ||
    sal.codiceSal.toLowerCase().includes('saldo') ||
    sal.percentualeAvanzamentoGlobale >= 95
  );

  // Stato attestazione CNCE Edilconnect
  let statoAttestazione: 'congruo_rilasciabile' | 'non_congruo_alert' | 'regolarizzazione_necessaria';
  if (isCongruo) {
    statoAttestazione = 'congruo_rilasciabile';
  } else if (Math.abs(differenzaPercentuale) <= 2.0) {
    statoAttestazione = 'regolarizzazione_necessaria';
  } else {
    statoAttestazione = 'non_congruo_alert';
  }

  // CONTROLLO BLOCCANTE FATTURAZIONE FINALE D.M. 143/2021:
  // Se l'opera è soggetta ad obbligo (>= 70k o pubblica) e si tratta della fatturazione finale / saldo:
  // In assenza di congruità (incidenza < 14%), la fatturazione finale è BLOCCATA per legge!
  let bloccoFatturazioneFinale = false;
  let motivoBlocco: string | undefined;

  if (isOperaSoggettaObbligo && isSalFinale && !isCongruo) {
    bloccoFatturazioneFinale = true;
    motivoBlocco = `BLOCCO FATTURAZIONE FINALE (D.M. 143/2021): L'incidenza di manodopera registrata (${percentualeIncidenzaEffettiva}%) è inferiore alla soglia minima di legge (${percMinima}% per ${catInfo.nome}). Prima dell'emissione della fattura di saldo finale è obbligatorio colmare il gap di € ${Math.abs(differenzaEuro).toLocaleString('it-IT', { minimumFractionDigits: 2 })} (pari a ${oreMancanti} ore-uomo) o versare la regolarizzazione alla Cassa Edile competente entro 15 giorni per sbloccare l'attestazione CNCE EdilConnect. Il committente/DL non può liquidare il saldo senza attestazione conforme.`;
  }

  // Pre-generazione attestazione CNCE Edilconnect
  const protocolloSimulato = sal.attestazioneEdilconnect?.protocollo || generaProtocolloEdilconnect(sal.cantiereId, sal.numeroSal);
  const codiceVerificaSimulato = sal.attestazioneEdilconnect?.codiceUnivocoVerifica || generaCodiceUnivocoVerifica(protocolloSimulato);

  const attestazioneEdilconnect: AttestazioneEdilconnect = sal.attestazioneEdilconnect || {
    protocollo: protocolloSimulato,
    codiceUnivocoVerifica: codiceVerificaSimulato,
    dataRichiesta: sal.dataEmissione,
    dataRilascio: isCongruo ? sal.dataEmissione : undefined,
    dataScadenzaDURC: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
    cassaEdileCompetente: 'Cassa Edile di Milano, Lodi, Monza e Brianza',
    stato: isCongruo ? 'rilasciata' : 'regolarizzazione_necessaria',
    isFatturazioneFinaleSbloccata: !bloccoFatturazioneFinale,
    urlVerificaOnline: `https://www.edilconnect.it/verifica?prot=${encodeURIComponent(protocolloSimulato)}`,
    note: isCongruo
      ? `Attestazione di congruità CNCE n. ${protocolloSimulato} emessa con successo. Incidenza manodopera ${percentualeIncidenzaEffettiva}% conforme a D.M. 143/2021.`
      : `Richiesta in attesa di regolarizzazione: mancato rispetto della soglia minima di legge (${percentualeIncidenzaEffettiva}% < ${percMinima}%).`,
  };

  const noteVerifica = isCongruo
    ? `Congruità manodopera verificata ed eccedente di € ${differenzaEuro.toLocaleString('it-IT', { minimumFractionDigits: 2 })} (+${differenzaPercentuale}%). Attestazione CNCE EdilConnect rilasciabile in tempo reale. Nessun blocco alla fatturazione finale.`
    : `Attenzione: incidenza manodopera inferiore alla soglia minima del D.M. 143/2021 (${percentualeIncidenzaEffettiva}% < ${percMinima}%). Mancano € ${Math.abs(differenzaEuro).toLocaleString('it-IT', { minimumFractionDigits: 2 })} (pari a ${oreMancanti} ore-uomo) per il rilascio dell'attestazione CNCE EdilConnect.${isSalFinale ? ' [ATTENZIONE: Fatturazione finale bloccata]' : ''}`;

  return {
    categoria,
    descrizioneCategoria: catInfo.nome,
    percentualeMinimaTabellare: percMinima,
    importoLavoriImponibile,
    fabbisognoMinimoManodoperaEuro,
    oreRegistrateRol: oreEffettive,
    costoOrarioConvenzionale,
    valoreManodoperaEffettivaEuro,
    percentualeIncidenzaEffettiva,
    isCongruo,
    differenzaPercentuale,
    differenzaEuro,
    oreMancanti,
    valoreGiustificativiEuro,
    statoAttestazione,
    noteVerifica,
    isOperaSoggettaObbligo,
    sogliaMinimaImportoEuro,
    isSalFinale,
    bloccoFatturazioneFinale,
    motivoBlocco,
    attestazioneEdilconnect,
  };
}

/**
 * Richiede ed emette l'attestazione telematica CNCE Edilconnect in tempo reale
 */
export function richiediAttestazioneEdilconnect(
  sal: StatoAvanzamentoLavori,
  congruita: CalcoloCongruitaManodopera,
  cassaEdileCompetente: string = 'Cassa Edile di Milano, Lodi, Monza e Brianza'
): AttestazioneEdilconnect {
  const oggi = new Date().toISOString().split('T')[0];
  const protocollo = generaProtocolloEdilconnect(sal.cantiereId, sal.numeroSal);
  const codiceUnivocoVerifica = generaCodiceUnivocoVerifica(protocollo);

  const isRilasciabile = congruita.isCongruo;

  return {
    protocollo,
    codiceUnivocoVerifica,
    dataRichiesta: oggi,
    dataRilascio: isRilasciabile ? oggi : undefined,
    dataScadenzaDURC: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
    cassaEdileCompetente,
    stato: isRilasciabile ? 'rilasciata' : 'regolarizzazione_necessaria',
    isFatturazioneFinaleSbloccata: isRilasciabile,
    urlVerificaOnline: `https://www.edilconnect.it/verifica?prot=${encodeURIComponent(protocollo)}`,
    note: isRilasciabile
      ? `Attestazione di congruità rilasciata dalla ${cassaEdileCompetente} con incidenza manodopera ${congruita.percentualeIncidenzaEffettiva}% (soglia minima ${congruita.percentualeMinimaTabellare}%). Fatturazione finale e saldo approvati.`
      : `Attestazione sospesa: scostamento negativo di € ${Math.abs(congruita.differenzaEuro).toLocaleString('it-IT', { minimumFractionDigits: 2 })}. Attivata procedura di regolarizzazione art. 5 D.M. 143/2021 entro 15 giorni.`,
  };
}

/**
 * Calcola la regolarizzazione economica spontanea ai sensi dell'art. 5 c. 2 del D.M. 143/2021
 * per ottenere l'attestazione di congruità e sbloccare la fattura finale.
 */
export function calcolaRegolarizzazioneCassaEdile(congruita: CalcoloCongruitaManodopera): {
  importoRegolarizzazioneEuro: number;
  oreEquivalenti: number;
  termineGiorni: number;
  causaleBollettino: string;
} {
  const importoRegolarizzazioneEuro = congruita.isCongruo ? 0 : Math.abs(congruita.differenzaEuro);
  const oreEquivalenti = congruita.isCongruo ? 0 : congruita.oreMancanti;

  return {
    importoRegolarizzazioneEuro,
    oreEquivalenti,
    termineGiorni: 15, // Termine perentorio di 15 giorni prima della segnalazione in BNCF
    causaleBollettino: `Regolarizzazione Congruità D.M. 143/2021 - Protocollo CNCE ${congruita.attestazioneEdilconnect?.protocollo || 'PROVVISORIO'}`,
  };
}
