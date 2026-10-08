import {
  DocumentoSicurezzaCantiere,
  IdoneitaSanitariaLavoratore,
  CruscottoSicurezzaCantiere,
  StatoConformitaDURC,
  StatoApprovazionePOS,
} from '../types/sicurezzaCantiere';
import { DIPENDENTI } from './dipendenti';
import { CANTIERI } from './cantieri';

/**
 * Archivio Documenti di Sicurezza di Cantiere (D.Lgs. 81/2008 & Titolo IV Cantieri Temporanei o Mobili)
 */
export const INITIAL_DOCUMENTI_SICUREZZA: DocumentoSicurezzaCantiere[] = [
  // Cantiere CNT-01: Ospedale San Luca
  {
    id: 'SIC-01-DURC',
    cantiereId: 'CNT-01',
    tipo: 'DURC_AZIENDALE',
    titolo: 'DURC On-Line VoltMaster ElettroImpianti S.r.l.',
    soggetto: 'VoltMaster ElettroImpianti S.r.l.',
    partitaIvaCF: '09248100159',
    protocolloNumero: 'INAIL_42891024',
    dataRilascio: '2026-08-10',
    dataScadenza: '2026-12-08',
    stato: 'valido',
    approvatoDa: 'Portale INPS-INAIL',
    dataApprovazione: '2026-08-10',
    noteConformita: 'Regolarità contributiva INPS, INAIL e Cassa Edile attestata.',
    fileAllegatoNome: 'DURC_VoltMaster_Dic2026.pdf',
    obbligatorioPerAccesso: true,
  },
  {
    id: 'SIC-01-POS',
    cantiereId: 'CNT-01',
    tipo: 'POS',
    titolo: 'Piano Operativo di Sicurezza (POS) - Cabina MT/BT Ospedale San Luca',
    soggetto: 'VoltMaster ElettroImpianti S.r.l.',
    protocolloNumero: 'POS-CNT-2026-01-REV2',
    dataRilascio: '2026-01-08',
    stato: 'valido',
    approvatoDa: 'Ing. Laura Valenti (CSE - ASL 2)',
    dataApprovazione: '2026-01-12',
    noteConformita: 'POS conforme all\'Allegato XV D.Lgs 81/08. Valutazione rischio elettrocuzione e interferenze cabina approvata dal CSE.',
    fileAllegatoNome: 'POS_SanLuca_Rev2_Firmato.pdf',
    obbligatorioPerAccesso: true,
  },
  {
    id: 'SIC-01-SUB-DURC',
    cantiereId: 'CNT-01',
    tipo: 'DURC_SUBAPPALTO',
    titolo: 'DURC Subappalto Posa Blindosbarre - Orobica Montaggi S.r.l.',
    soggetto: 'Orobica Montaggi S.r.l.',
    partitaIvaCF: '03819280164',
    subappaltatoreId: 'SUB-ORO-01',
    protocolloNumero: 'INPS_39812491',
    dataRilascio: '2026-09-01',
    dataScadenza: '2026-12-30',
    stato: 'valido',
    approvatoDa: 'CSE Ospedale San Luca',
    dataApprovazione: '2026-09-03',
    noteConformita: 'Autorizzazione al subappalto autorizzata dalla stazione appaltante.',
    fileAllegatoNome: 'DURC_OrobicaMontaggi_Valido.pdf',
    obbligatorioPerAccesso: true,
  },

  // Cantiere CNT-02: Polo Logistico Amazon Hub
  {
    id: 'SIC-02-DURC',
    cantiereId: 'CNT-02',
    tipo: 'DURC_AZIENDALE',
    titolo: 'DURC On-Line VoltMaster - Hub Amazon Novara',
    soggetto: 'VoltMaster ElettroImpianti S.r.l.',
    partitaIvaCF: '09248100159',
    protocolloNumero: 'INAIL_42891024',
    dataRilascio: '2026-08-10',
    dataScadenza: '2026-12-08',
    stato: 'valido',
    approvatoDa: 'Portale INPS-INAIL',
    dataApprovazione: '2026-08-10',
    noteConformita: 'Regolarità contributiva verificata dal portale logistica.',
    fileAllegatoNome: 'DURC_VoltMaster_Novara.pdf',
    obbligatorioPerAccesso: true,
  },
  {
    id: 'SIC-02-POS',
    cantiereId: 'CNT-02',
    tipo: 'POS',
    titolo: 'POS Copertura Fotovoltaico 500kW & Linee Vita',
    soggetto: 'VoltMaster ElettroImpianti S.r.l.',
    protocolloNumero: 'POS-AMZ-2026-02-REV1',
    dataRilascio: '2026-01-25',
    stato: 'valido',
    approvatoDa: 'Geom. Fabrizio Riva (CSE Logistics Real Estate)',
    dataApprovazione: '2026-01-29',
    noteConformita: 'Specifica POS per montaggio in quota con imbracatura di sicurezza EN 361 e verifica ancoraggi EN 795.',
    fileAllegatoNome: 'POS_Fotovoltaico_Novara.pdf',
    obbligatorioPerAccesso: true,
  },

  // Cantiere CNT-03: Complesso Residenziale Le Terrazze
  {
    id: 'SIC-03-POS',
    cantiereId: 'CNT-03',
    tipo: 'POS',
    titolo: 'POS Impianti Domotici & Elettrici Residenziali Le Terrazze',
    soggetto: 'VoltMaster ElettroImpianti S.r.l.',
    protocolloNumero: 'POS-MNZ-2026-03',
    dataRilascio: '2026-02-20',
    stato: 'valido',
    approvatoDa: 'Arch. S. Colombo (CSE)',
    dataApprovazione: '2026-02-26',
    noteConformita: 'Validato.',
    obbligatorioPerAccesso: true,
  },
];

/**
 * Registro Idoneità Sanitaria e Abilitazioni Obbligatorie Lavoratori
 * Calcolato in base al personale registrato in VoltMaster
 */
export function getRegistroIdoneitaDipendenti(): IdoneitaSanitariaLavoratore[] {
  const oggi = new Date('2026-10-08');

  return DIPENDENTI.map((dip, idx) => {
    const dataScadenzaStr = dip.visitaMedicaScadenza || '2027-04-10';
    const scadenzaDate = new Date(dataScadenzaStr);
    const diffDays = Math.round((scadenzaDate.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));

    // Simulazione caso reale di non conformità per test e collaudo (es. DIP-05 apprendista o manutentore scaduto)
    const isVisitaScaduta = diffDays < 0;
    const isVisitaInScadenza = diffDays >= 0 && diffDays <= 30;

    // Controllo patentini in base alle qualifiche
    const patentini = dip.patentini || [];
    const hasPesPav = patentini.some((p) => p.includes('PES') || p.includes('PAV'));
    const hasPle = patentini.some((p) => p.includes('PLE'));
    const hasQuota = patentini.some((p) => p.includes('Quota') || p.includes('quota'));
    const hasPrimoSoccorso = patentini.some((p) => p.includes('Primo Soccorso'));
    const hasAntincendio = patentini.some((p) => p.includes('Antincendio'));

    // Regola blocco di cantiere D.Lgs 81/08:
    // Se la visita medica è scaduta O se un capocantiere non ha PES/PAV, l'accesso è BLOCCATO
    let bloccato = isVisitaScaduta;
    let motivoBlocco: string | undefined;

    if (isVisitaScaduta) {
      bloccato = true;
      motivoBlocco = `Visita medica periodica SCADUTA il ${dataScadenzaStr}. Blocco assoluto di accesso al cantiere ex art. 41 D.Lgs 81/08.`;
    } else if (dip.reparto === 'capocantiere' && !hasPesPav) {
      bloccato = true;
      motivoBlocco = 'Mancanza attestato PES/PAV CEI 11-27 valido per il ruolo di Capocantiere.';
    }

    return {
      dipendenteId: dip.id,
      nomeCompleto: `${dip.nome} ${dip.cognome}`,
      matricola: dip.matricola || `DIP-${String(idx + 1).padStart(2, '0')}`,
      ruoloAziendale: dip.ruoloAziendale,
      reparto: dip.reparto,
      visitaMedicaData: '2025-04-10',
      visitaMedicaScadenza: dataScadenzaStr,
      giorniAllaScadenza: diffDays,
      medicoCompetente: 'Dott.ssa M. Grassi (Specialista Medicina del Lavoro - Iscr. Albo 14092)',
      giudizioIdoneita: isVisitaScaduta
        ? 'scaduta'
        : isVisitaInScadenza
        ? 'idoneo_con_prescrizioni'
        : 'idoneo_totale',
      prescrizioniNote: isVisitaInScadenza ? 'Rinnovo periodico programmato entro 30 giorni' : undefined,
      patentiniAbilitazioni: [
        {
          tipo: 'PES_PAV_PEI',
          denominazione: 'PES/PAV (Norma CEI 11-27 Ed. V)',
          scadenza: '2028-03-15',
          valido: hasPesPav,
        },
        {
          tipo: 'PLE',
          denominazione: 'Piattaforme Aeree PLE (Accordo Stato-Regioni)',
          scadenza: '2027-11-20',
          valido: hasPle,
        },
        {
          tipo: 'LAVORI_IN_QUOTA',
          denominazione: 'Lavori in Quota e DPI III Categoria anticaduta',
          scadenza: '2028-05-10',
          valido: hasQuota || hasPle,
        },
        {
          tipo: 'PRIMO_SOCCORSO',
          denominazione: 'Addetto Primo Soccorso Aziendale Gruppo B/C',
          scadenza: '2027-09-30',
          valido: hasPrimoSoccorso,
        },
        {
          tipo: 'ANTINCENDIO',
          denominazione: 'Addetto Antincendio Rischio Medio (Livello 2)',
          scadenza: '2027-10-15',
          valido: hasAntincendio,
        },
      ],
      tesserinoRiconoscimentoValido: true,
      dpiConsegnatiVerificati: true,
      bloccatoIngresso: bloccato,
      motivoBlocco,
    };
  });
}

/**
 * Calcola il Cruscotto di Conformità per uno specifico cantiere
 */
export function getCruscottoSicurezzaCantiere(cantiereId: string): CruscottoSicurezzaCantiere {
  const cantiere = CANTIERI.find((c) => c.id === cantiereId) || CANTIERI[0];
  const docList = INITIAL_DOCUMENTI_SICUREZZA.filter((d) => d.cantiereId === cantiereId);
  const operatoriRegistro = getRegistroIdoneitaDipendenti();

  // Operatori assegnati a questo cantiere
  const assegnatiIds = cantiere.operatoriAssegnatiIds || [];
  const operatoriCantiere = operatoriRegistro.filter((op) =>
    assegnatiIds.includes(op.dipendenteId)
  );

  const durcDoc = docList.find((d) => d.tipo === 'DURC_AZIENDALE');
  const posDoc = docList.find((d) => d.tipo === 'POS');

  const durcStato: StatoConformitaDURC = durcDoc
    ? durcDoc.stato === 'valido'
      ? 'regolare'
      : durcDoc.stato === 'in_scadenza'
      ? 'in_scadenza'
      : 'scaduto'
    : 'non_presente';

  const posStato: StatoApprovazionePOS = posDoc
    ? posDoc.stato === 'valido'
      ? 'approvato_cse'
      : 'in_revisione'
    : 'da_redigere';

  const opBloccati = operatoriCantiere.filter((o) => o.bloccatoIngresso).length;
  const opInScadenza = operatoriCantiere.filter(
    (o) => !o.bloccatoIngresso && o.giorniAllaScadenza <= 30
  ).length;
  const opIdonei = operatoriCantiere.length - opBloccati;

  let statoGlobale: 'verde_conforme' | 'giallo_attenzione' | 'rosso_bloccato' = 'verde_conforme';
  if (durcStato === 'scaduto' || posStato === 'da_redigere' || opBloccati > 0) {
    statoGlobale = 'rosso_bloccato';
  } else if (durcStato === 'in_scadenza' || opInScadenza > 0 || posStato === 'in_revisione') {
    statoGlobale = 'giallo_attenzione';
  }

  return {
    cantiereId: cantiere.id,
    cantiereTitolo: cantiere.titolo,
    codiceCommessa: cantiere.codice || cantiere.id,
    statoGlobaleCantiere: statoGlobale,
    durcAziendale: {
      protocollo: durcDoc?.protocolloNumero || 'INAIL_42891024',
      scadenza: durcDoc?.dataScadenza || '2026-12-08',
      stato: durcStato,
      giorniRimanenti: 61,
    },
    posCantiere: {
      stato: posStato,
      revisione: posDoc?.protocolloNumero || 'Rev. 2',
      approvatoDa: posDoc?.approvatoDa,
      dataApprovazione: posDoc?.dataApprovazione,
    },
    coordinatoreSicurezzaCSE: 'Ing. Laura Valenti (ASL 2)',
    rsppAziendale: 'Ing. Roberto Fontana (RSPP VoltMaster)',
    medicoCompetente: 'Dott.ssa M. Grassi (Specialista Medicina Lavoro)',
    totaleOperatoriAssegnati: operatoriCantiere.length,
    operatoriIdonei: opIdonei,
    operatoriConAllerta: opInScadenza,
    operatoriBloccati: opBloccati,
    subappaltatoriTotali: docList.filter((d) => d.tipo === 'DURC_SUBAPPALTO').length,
    subappaltatoriInRegola: docList.filter(
      (d) => d.tipo === 'DURC_SUBAPPALTO' && d.stato === 'valido'
    ).length,
    subappaltatoriIrregolari: docList.filter(
      (d) => d.tipo === 'DURC_SUBAPPALTO' && d.stato !== 'valido'
    ).length,
  };
}
