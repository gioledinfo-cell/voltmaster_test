export type StatoSAL =
  | 'bozza'
  | 'inviato_dl'
  | 'approvato_dl'
  | 'certificato_emesso'
  | 'liquidato';

export interface VoceLibrettoSAL {
  id: string;
  codiceTariffa: string; // es. "E.01.10", "NP.02", "CEI-64/04"
  descrizione: string;
  unitaMisura: 'm' | 'cad' | 'a_corpo' | 'mq' | 'kg' | 'h';
  quantitaContrattuale: number;
  prezzoUnitario: number;
  importoContrattuale: number;
  // Dati di avanzamento
  quantitaPrecedente: number;
  quantitaPeriodo: number;
  quantitaTotale: number;
  percentualeAvanzamento: number; // 0 - 100
  importoPeriodo: number;
  importoTotaleCumulato: number;
  noteMisure?: string; // Libretto misure analitico (es. "Dorsale mt 125 da Quadro QG a montante est")
}

export interface CertificatoPagamento {
  numeroCertificato: string; // es. "CERT-PAG-2026/01"
  dataCertificato: string;
  totaleLavoriMaturatiPeriodo: number;
  totaleLavoriMaturatiCumulati: number;
  recuperoAnticipazionePercentuale: number; // es. 10%
  recuperoAnticipazioneImporto: number;
  ritenutaGaranziaPercentuale: number; // es. 0.5% (infortuni) o 5%
  ritenutaGaranziaImporto: number;
  altreDetrazioni: number;
  importoNettoLiquidare: number;
  aliquotaIva: number; // 10 o 22
  importoIva: number;
  totaleLordoLiquidare: number;
  direttoreLavoriNome: string;
  riferimentoFattura?: string;
  noteLiquidazione?: string;
  stato: 'emesso' | 'inviato_amministrazione' | 'pagato';
  congruitaVerificata?: boolean;
  protocolloCnce?: string;
  isFatturaFinale?: boolean;
}

// ----------------------------------------------------
// D.M. 143/2021 · CONGRUITÀ DELL'INCIDENZA DELLA MANODOPERA
// ----------------------------------------------------

export type CategoriaCongruita =
  | 'OG11_OS30' // Impianti Elettrici / Tecnologici (14.28%)
  | 'OG1'       // Edilizia Civile e Industriale (22.00%)
  | 'OG2'       // Restauro e Ristrutturazione Beni Immobili (20.00%)
  | 'OS28'      // Impianti Idrotermosanitari & Climatizzazione (14.28%)
  | 'OS13'      // Strutture Prefabbricate in c.a. (10.00%)
  | 'OS6'       // Finiture di Opere Generali / Cartongessi (34.00%)
  | 'CUSTOM';   // Altra categoria personalizzata

export interface AttestazioneEdilconnect {
  protocollo: string; // es. "CNCE-EDILCONNECT-2026-MI-849201"
  codiceUnivocoVerifica: string; // Hash/Codice univoco di sicurezza per committenza e DL
  dataRichiesta: string;
  dataRilascio?: string;
  dataScadenzaDURC?: string;
  cassaEdileCompetente: string; // es. "Cassa Edile di Milano, Lodi, Monza e Brianza"
  stato: 'rilasciata' | 'in_valutazione' | 'non_richiesta' | 'regolarizzazione_necessaria' | 'respinta';
  isFatturazioneFinaleSbloccata: boolean;
  note?: string;
  urlVerificaOnline?: string;
}

export interface CalcoloCongruitaManodopera {
  categoria: CategoriaCongruita;
  descrizioneCategoria: string;
  percentualeMinimaTabellare: number; // es. 14.28 (%)
  importoLavoriImponibile: number;    // Importo Lavori Imponibile del SAL o Totale Cantiere (€)
  fabbisognoMinimoManodoperaEuro: number; // importoLavori * (percentualeMinima / 100)
  
  // Dati reali ricavati dall'incrocio con i ROL (Rapporti Ore)
  oreRegistrateRol: number;          // Ore totali registrate (ord + str + squadra)
  costoOrarioConvenzionale: number;  // es. 35.00 €/h (tariffa oraria contrattuale CNCE/Cassa Edile)
  valoreManodoperaEffettivaEuro: number; // oreRegistrateRol * costoOrarioConvenzionale
  percentualeIncidenzaEffettiva: number; // (valoreManodoperaEffettivaEuro / importoLavoriImponibile) * 100
  
  // Esito di Congruità D.M. 143/2021
  isCongruo: boolean;                // percentualeIncidenzaEffettiva >= percentualeMinimaTabellare
  differenzaPercentuale: number;     // percentualeIncidenzaEffettiva - percentualeMinimaTabellare (+/-)
  differenzaEuro: number;            // valoreManodoperaEffettivaEuro - fabbisognoMinimoManodoperaEuro (+ surplus, - gap)
  oreMancanti: number;               // Se isCongruo === false: ore-uomo mancanti da giustificare
  
  // Giustificativi e note
  valoreGiustificativiEuro?: number; // Fatture subappalto/noli a caldo/forniture con posa
  noteVerifica?: string;
  statoAttestazione: 'congruo_rilasciabile' | 'non_congruo_alert' | 'regolarizzazione_necessaria';

  // Verifica D.M. 143/2021 & CNCE Edilconnect in tempo reale
  isOperaSoggettaObbligo: boolean;   // True se appalto pubblico o contratto privato >= € 70.000
  sogliaMinimaImportoEuro: number;   // 70.000 per privati, 0 per pubblici
  isSalFinale: boolean;              // True se è il SAL di chiusura/saldo prima della fattura finale
  bloccoFatturazioneFinale: boolean; // True se obbligatorio e non congruo: blocca fatturazione finale
  motivoBlocco?: string;             // Motivazione chiara del blocco per l'amministrazione
  attestazioneEdilconnect?: AttestazioneEdilconnect; // Dati attestazione CNCE Edilconnect
}

export interface StatoAvanzamentoLavori {
  id: string;
  numeroSal: number; // 1, 2, 3...
  codiceSal: string; // es. "SAL-01", "SAL-02 (Finale)"
  cantiereId: string;
  cantiereNome: string;
  committenteNome: string;
  dataEmissione: string;
  periodoInizio: string;
  periodoFine: string;
  importoContrattualeTotale: number;
  totaleLavoriPrecedenti: number;
  totaleLavoriPeriodo: number;
  totaleLavoriCumulati: number;
  percentualeAvanzamentoGlobale: number;
  stato: StatoSAL;
  voci: VoceLibrettoSAL[];
  certificatoPagamento?: CertificatoPagamento;
  congruitaManodopera?: CalcoloCongruitaManodopera; // Calcolo D.M. 143/2021
  isSalFinale?: boolean; // Contrassegna se è il SAL di saldo prima della fatturazione finale
  attestazioneEdilconnect?: AttestazioneEdilconnect; // Certificato CNCE Edilconnect rilasciato
  ritenutaGaranziaPercentuale?: number;
  ritenutaGaranziaImporto?: number;
  aliquotaIvaPercentuale?: number;
  note?: string;
  vociLibrettoMisure?: any[];
  redattoDa: string;
  approvatoDirettoreLavori?: {
    nome: string;
    dataOra: string;
    note?: string;
  };
  noteGenerali?: string;
}
