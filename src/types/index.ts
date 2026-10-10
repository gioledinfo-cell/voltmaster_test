import { RifornimentoRecord } from './gestioneOperativa';
export * from './gestioneOperativa';
export type UserRole = 'amministratore' | 'responsabile' | 'operatore' | 'cliente';

export type CompanyDepartment = 
  | 'contabilita'       // 3 persone: Amministrazione & Contabilità
  | 'ufficio_tecnico'   // 4 persone: Ufficio Tecnico & PM
  | 'capocantiere'      // 4 persone: Capi Cantiere / Op. Specializzati
  | 'operaio'           // 4 persone: Operai Elettricisti
  | 'apprendista'       // 5 persone: Apprendisti
  | 'hr';               // Risorse Umane, Formazione & Compliance

export type AppInterfaceMode = 
  | 'contabilita'       // Vista Amministrazione & Contabilità (3 dipendenti)
  | 'ufficio_tecnico'   // Vista Ufficio Tecnico & PM (4 dipendenti)
  | 'cantiere_mobile'   // Vista Cantiere & Smartphone Campo (13 dipendenti: 4 capi, 4 operai, 5 apprendisti)
  | 'cliente_portal'    // Portale Esterno Clienti (20+ clienti)
  | 'magazzino_portale'; // Portale Magazzino & Logistica (Materiali, Attrezzatura, Veicoli)

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  reparto?: CompanyDepartment;
  phone?: string;
  avatar?: string;
  qualifiche?: string[]; // es. PES, PAV, PEI, Lavori in quota
  assignedClientId?: string; // se il ruolo è cliente, collegato a un cliente specifico
}

export interface Cliente {
  id: string;
  ragioneSociale: string;
  referente: string;
  email: string;
  telefono: string;
  indirizzo: string;
  citta: string;
  cap?: string;
  provincia?: string;
  partitaIva: string;
  codiceFiscale?: string;
  codiceUnivocoSdi?: string;
  pec?: string;
  note?: string;
}

export type CantiereStato = 'in_attesa' | 'in_corso' | 'collaudo' | 'completato' | 'sospeso';

export interface DispositivoInstallato {
  id: string;
  nome: string;
  codice: string;
  tipo: string; // Quadro elettrico, Inverter, Inverter FV, Batteria, Lampade emergenza, Colonnina EV, Differenziale generale
  ubicazione: string;
  dataInstallazione: string;
  garanziaScadenza: string;
  matricola: string;
  stato: 'funzionante' | 'da_collaudare' | 'anomalia';
}

export interface MaterialeAssegnato {
  materialeId: string;
  nome: string;
  quantita: number;
  unitaMisura: string;
  dataAssegnazione: string;
  utilizzato: number;
}

export interface Cantiere {
  id: string;
  codice: string; // es. CNT-2026-001
  titolo: string;
  clienteId: string;
  clienteNome: string;
  indirizzo: string;
  citta: string;
  stato: CantiereStato;
  avanzamentoPercentuale: number;
  dataInizio: string;
  dataFinePrevista: string;
  dataFineEffettiva?: string;
  responsabileId: string;
  responsabileNome: string;
  operatoriAssegnatiIds: string[];
  budgetTotale: number;
  costiConsuntivati: number;
  descrizione: string;
  qrCode: string;
  dispositivi: DispositivoInstallato[];
  materialiAssegnati: MaterialeAssegnato[];
  noteSicurezza?: string;
  // Geofencing GPS per Auto-Selezione ROL & Campo
  lat?: number;
  lng?: number;
  coordinate?: { lat: number; lng: number };
  raggioGeofenceMetri?: number; // es. 300 - 500 metri
  // Flag sicurezza & isolamento permessi
  datiFinanziariRiservati?: boolean;
  // Mappatura Registro_Cantieri.csv
  codCantiere?: string;
  cantiere?: string;
  cliente?: string;
  codCliente?: string;
  cantiereAperto?: boolean;
  assegnato?: string;
}

export type PreventivoStato = 'bozza' | 'inviato' | 'accettato' | 'rifiutato' | 'scaduto';

export interface VoceMaterialePreventivo {
  id: string;
  articoloId?: string; // id opzionale da catalogo magazzino
  codiceSku?: string;
  descrizione: string;
  unitaMisura: string;
  quantita: number;
  costoAcquistoUnitario: number;
  ricaricoPercentuale?: number; // % ricarico specifico riga (opzionale)
  prezzoVenditaUnitario: number; // calcolato: costo * (1 + ricarico/100)
  totaleCosto: number; // quantita * costoAcquistoUnitario
  totaleVendita: number; // quantita * prezzoVenditaUnitario
}

export interface VoceManodoperaPreventivo {
  id: string;
  descrizione: string;
  oreStimate: number;
  tariffaOrariaApplicata: number; // €/h applicata
  totale: number; // oreStimate * tariffaOrariaApplicata
}

export interface VocePreventivo {
  id: string;
  descrizione: string;
  categoria: 'materiale' | 'manodopera' | 'noleggio' | 'pratica_tecnica';
  quantita: number;
  unitaMisura: string;
  prezzoUnitario: number;
  totale: number;
  costoAcquistoUnitario?: number;
  ricaricoPercentuale?: number;
}

export interface Preventivo {
  id: string;
  numero: string; // es. PREV-2026-042
  clienteId: string;
  clienteNome: string;
  oggetto: string;
  dataEmissione: string;
  dataScadenza: string;
  stato: PreventivoStato;
  voci: VocePreventivo[];
  
  // Dati di calcolo economico modulare
  materiali?: VoceMaterialePreventivo[];
  manodopera?: VoceManodoperaPreventivo[];
  tariffaOraria: number; // default es. 35.00 €/ora
  percentualeRicaricoMateriali: number; // default globale es. 30%
  tipoAggiustamento?: 'sconto' | 'maggiorazione'; // toggle sconto (-) o maggiorazione (+)
  percentualeScontoMaggiorazione: number; // valore % (es. 5%)
  aliquotaIva: number; // % IVA (22, 10, 4, 0...)
  
  subtotaleMaterialiCosto?: number;
  subtotaleMateriali: number; // Prezzo complessivo vendita materiali
  subtotaleManodopera: number; // Totale Ore * Tariffa Oraria
  totaleLavorazioni?: number; // subtotaleMateriali + subtotaleManodopera
  quotaScontoMaggiorazione?: number; // importo dello sconto o maggiorazione
  totaleImponibile: number; // imponibile netto dopo sconto/maggiorazione
  imponibile: number; // alias retro-compatibile con totaleImponibile
  ivaPercentuale: number; // alias retro-compatibile con aliquotaIva
  ivaImporto: number; // Quota IVA
  totaleIvato: number; // TOTALE PREVENTIVO FINALE (IVA inclusa)
  totale: number; // alias retro-compatibile con totaleIvato
  
  note: string;
  cantiereIdCreato?: string; // se convertito in cantiere
}

export type LavorazioneStato = 'da_fare' | 'in_corso' | 'completata';
export type Priorita = 'bassa' | 'media' | 'alta' | 'urgente';

export interface Lavorazione {
  id: string;
  cantiereId: string;
  titolo: string;
  descrizione: string;
  fase: string; // es. Posa tubazioni, Infilaggio cavi, Montaggio quadri, Collaudo e verifiche CEI
  priorita: Priorita;
  stato: LavorazioneStato;
  operatoriAssegnatiIds: string[];
  oreStimate: number;
  oreLavorate: number;
  dataScadenza: string;
  completataIl?: string;
}

export type ROLStato = 'bozza' | 'inviato' | 'approvato' | 'respinto';

export type ROLWorkType = 'cantiere' | 'officina' | 'manutenzione_riparazione';

export interface TravelDetails {
  hasTravel?: boolean;
  travelHours?: number;
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleName?: string;
  customVehicleName?: string;
  route: string;
  km?: number;
}

export interface ROLCollaboratore {
  id: string; // ID utente o dipendente
  nome: string;
  ruolo?: string; // es. Capocantiere, Operaio Specializzato, Apprendista, Tecnico
  oreOrdinarie?: number;
  oreStraordinarie?: number;
  note?: string;
  isSubappalto?: boolean;
  dittaSubappalto?: string;
}

export type CondizioneMeteo =
  | 'sereno'
  | 'parzialmente_nuvoloso'
  | 'coperto'
  | 'pioggia'
  | 'temporale'
  | 'neve_gelo'
  | 'vento_forte';

export interface ROLMeteo {
  condizione: CondizioneMeteo;
  temperaturaMin?: number;
  temperaturaMax?: number;
  noteMeteo?: string;
  impraticabilitaCantiere?: boolean;
}

export interface ROLAttrezzatura {
  id: string;
  attrezzaturaId?: string;
  nome: string;
  matricolaOTarga?: string;
  oreUtilizzo: number;
  operatoreNome?: string;
  note?: string;
}

export interface ROLImprevisto {
  id: string;
  descrizione: string;
  oreFermo?: number;
  causa: 'committenza' | 'meteo' | 'fornitore' | 'sicurezza' | 'tecnica';
  risolto: boolean;
}

export interface ROLTurnoOrario {
  oraInizio?: string; // es. "07:30"
  oraFine?: string;   // es. "16:30"
  pausaMinuti?: number; // es. 60
}

export interface ROL {
  id: string;
  rolId?: string; // Payload alias (es. ROL-2026-10-001)
  numero: string; // es. ROL-2026-0188
  data: string;
  date?: string; // Payload alias
  operatoreId: string;
  operatorId?: string; // Payload alias
  operatoreNome: string;
  operatorName?: string; // Payload alias
  // Squadra / altri utenti o dipendenti che hanno lavorato insieme
  collaboratori?: ROLCollaboratore[];
  cantiereId: string;
  cantiereTitolo: string;
  clienteNome: string;

  // Nuove Aree e Tipologie di Lavorazione
  workType?: ROLWorkType; // "cantiere" | "officina" | "manutenzione_riparazione"
  subActivity?: string;   // sotto-attività specifica
  activityDescription?: string; // Descrizione dispositivo / dettagli riparazione

  lavorazioneId?: string;
  lavorazioneTitolo?: string;
  attivitaLibera?: string;

  // Turno Orario di Cantiere e Meteo Ambientale
  turnoOrario?: ROLTurnoOrario;
  meteo?: ROLMeteo;

  // Stato Avanzamento Lavori Giornaliero
  avanzamentoPercentuale?: number; // Avanzamento % stimato della lavorazione/fase (0-100)
  quantitaPosata?: string; // es. "120m cavo FG16OR12 5G16 + 4 cuscini REI"

  // Attrezzature, Mezzi & Macchinari
  attrezzature?: ROLAttrezzatura[];

  // Imprevisti, Fermi Cantiere & Sicurezza
  imprevisti?: ROLImprevisto[];
  noteSicurezza?: string; // DPI verificati, coordinamento interferenze, messa a terra/tensione

  // Ore Lavoro & Gestione Ore di Viaggio
  oreOrdinarie: number;
  oreStraordinarie: number;
  hoursWork?: number; // Ore Lavoro effettive

  hasTravel?: boolean; // Opzionale, disattivato di default (false)
  hoursTravel?: number; // Ore viaggio (se hasTravel === true)
  travelDetails?: TravelDetails | null; // Dettagli tratta, mezzo, km

  oreTotali: number; // Totale dinamico (oreOrd + oreStr + (hasTravel ? hoursTravel : 0))
  totalHours?: number; // Alias payload

  // Dettagli Intervento / Ricambi e Foto
  partsReplaced?: string; // Note/elenco ricambi o componenti sostituiti
  photos?: string[]; // Foto dell'intervento o componente sostituito

  descrizioneLavori: string;
  materiali?: {
    nome: string;
    quantita: number;
    unita?: string;
    prezzoUnitario?: number;
    codiceArticolo?: string;
  }[];
  materialiUtilizzati?: {
    nome: string;
    quantita: number;
    unita: string;
    prezzoUnitario?: number;
    codiceArticolo?: string;
  }[];
  noteOperatore?: string;
  stato: ROLStato;
  
  // Opzione firma e invio al cliente (disattivata di default: false)
  abilitaFirmaEInvioCliente?: boolean;

  // Firma cliente touch
  firmaClientePresente: boolean;
  firmaClienteNome?: string;
  firmaClienteDataUrl?: string;
  firmaClienteTimestamp?: string;
  firmaOperatoreDataUrl?: string;
  bloccatoModifiche: boolean;

  // Sigillo Crittografico & Valore Probatorio (ex art. 2702 c.c.)
  sigilloDigitale?: {
    sha256Hash: string; // Hash SHA-256 calcolato sui dati integrali del rapporto + firma
    improntaTimestamp: string; // Timestamp ISO 8601 di apposizione del sigillo
    algoritmo: 'SHA-256';
    firmatarioNome: string;
    firmatarioRuolo: string; // 'Committente / DL'
    codiceVerificaUnivoco: string; // Codice breve alfanumerico es. "VLT-ROL-2026-F93A-7B01"
    dispositivoFirma?: string; // Informazioni browser / terminale
    coordinateGpsFirma?: { lat: number; lng: number };
    validoLegale: boolean;
  };

  // Note amministrazione
  noteApprovazione?: string;
  approvatoDaId?: string;
  approvatoIl?: string;

  // Invio email e report PDF
  emailInviataIl?: string;
  emailDestinatario?: string;
  pdfReportGenerato?: boolean;
}

export interface Dipendente {
  id: string;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  reparto: CompanyDepartment; // 'contabilita' | 'ufficio_tecnico' | 'capocantiere' | 'operaio' | 'apprendista'
  ruoloAziendale: string; // es. Capocantiere Elettrico, Elettricista Specializzato, Manutentore Impianti, Apprendista
  telefono: string;
  email: string;
  dataAssunzione: string;
  costoOrario: number;
  costoRiservato?: boolean;
  patentini: string[]; // es. PES-PAV-PEI (Norma CEI 11-27), PLE, Primo Soccorso, Antincendio
  oreLavorateMeseCorrente: number;
  ferieDisponibiliGiorni: number;
  permessiDisponibiliOre: number;
  veicoloAssegnatoId?: string;
  visitaMedicaScadenza?: string;
  // Mappatura Elenco_dipendeti.csv
  matricola?: string;
  operatoreMicrosoft?: string;
  qualifica?: string;
  operatoreInCampo?: boolean;
  tel?: string;
}

export interface ArticoloMagazzino {
  id: string;
  codiceSku: string;
  nome: string;
  categoria: 'cavi_elettrici' | 'quadri_modulari' | 'apparecchi_comando' | 'tubi_canaline' | 'illuminazione' | 'fotovoltaico_accumulo' | 'materiale_vario';
  giacenza: number;
  scortaMinima: number;
  unitaMisura: string;
  prezzoUnitarioAcquisto: number;
  prezzoListinoVendita: number;
  ubicazioneScaffale: string;
  fornitore: string;
  qrCode: string;
  fotoUrl?: string;
  immagineUrl?: string;
  siglaMarchio?: string;
  barcodeEan?: string;
  quantitaConfezione?: number;
}

export interface MovimentoMagazzino {
  id: string;
  data: string;
  tipo: 'carico_fornitore' | 'scarico_cantiere' | 'reso_cantiere' | 'rettifica';
  articoloId: string;
  articoloNome: string;
  quantita: number;
  cantiereId?: string;
  cantiereNome?: string;
  operatoreNome: string;
  documentoRif?: string;
}

export type AttrezzaturaStato = 'disponibile' | 'assegnata' | 'in_manutenzione' | 'taratura_scaduta';

export interface Attrezzatura {
  id: string;
  codiceUnivoco: string;
  nome: string; // es. Strumento Multifunzione CEI 64-8 Asita, Termocamera Flir E6, Pinza Amperometrica, Piega-tubi idraulico, Scala isolata 5mt
  marcaModello: string;
  matricola: string;
  stato: AttrezzaturaStato;
  assegnataA?: {
    tipo: 'cantiere' | 'dipendente';
    id: string;
    nome: string;
  };
  dataAcquisto: string;
  prossimaTaratura: string;
  storicoManutenzioni: {
    data: string;
    descrizione: string;
    esito: string;
    costo?: number;
  }[];
  qrCode: string;
  fotoUrl?: string;
  immagineUrl?: string;
  // Mappatura Attrezzatura.csv
  idAttrezzo?: string;
  idAsset?: string;
  tecnoCodice?: string;
  attrezzo?: string;
  titolo?: string;
  posizione?: string;
  codMatricola?: string;
  dAcquisto?: string;
  fornitore?: string;
  operResponsabile?: string;
  dataGaranzia?: string;
  dataManutenzione?: string;
  contenitore?: string;
}

export interface Veicolo {
  id: string;
  targa: string;
  modello: string; // es. Iveco Daily 35C15 Allestito Elettricisti, Fiat Doblò Cargo Maxi
  kmAttuali: number;
  autistaAssegnatoId?: string;
  autistaAssegnatoNome?: string;
  scadenzaRevisione: string;
  scadenzaAssicurazione: string;
  scadenzaBollo: string;
  scadenzaTagliandoKm: number;
  dataAcquisto?: string;
  stato: 'in_servizio' | 'in_officina' | 'fermo';
  qrCode: string;
  fotoUrl?: string;
  immagineUrl?: string;
  storicoInterventi: {
    data: string;
    tipo: 'tagliando' | 'gomme' | 'riparazione' | 'revisione';
    km: number;
    costo: number;
    officina: string;
  }[];
  // Mappatura Elenco_veicoli.csv & Rifornimenti
  veicolo?: string;
  modelloTipologia?: string;
  tipo?: string;
  portataKg?: number;
  euro?: string;
  statoPowerApps?: string;
  assegnato?: string;
  kmUltimoRifornimento?: number;
  dataUltimoRifornimento?: string;
  note?: string;
  storicoRifornimenti?: RifornimentoRecord[];
  consumoMedioKmL?: number;
  consumoMedioL100Km?: number;
  totaleLitriErogati?: number;
}

export type TipoDocumento = 'schema_elettrico' | 'dico_conformita' | 'foto_cantiere' | 'verbale_collaudo' | 'manuale_tecnico' | 'fattura_sal';

export interface DocumentoTecnico {
  id: string;
  titolo: string;
  tipo: TipoDocumento;
  formato: 'pdf' | 'dwg' | 'jpg' | 'png' | 'zip';
  dimensioneKb: number;
  dataCaricamento: string;
  caricatoDa: string;
  cantiereId?: string;
  cantiereTitolo?: string;
  dispositivoId?: string;
  dispositivoNome?: string;
  urlSimulato: string;
  descrizione?: string;
}

export interface SegnalazioneCliente {
  id: string;
  cantiereId: string;
  cantiereTitolo: string;
  clienteId: string;
  clienteNome: string;
  data: string;
  titolo: string;
  descrizione: string;
  priorita: Priorita;
  stato: 'aperta' | 'in_gestione' | 'risolta';
  rispostaAzienda?: string;
}

// ==========================================
// SEZIONE: ORDINI INTERNI (FORNITORI & CLIENTI)
// ==========================================

export type TipoOrdine = 'fornitore' | 'cliente';

export type StatoOrdine =
  | 'bozza'
  | 'inviato'
  | 'confermato'
  | 'in_transito'
  | 'consegnato'
  | 'chiuso'
  | 'annullato';

export type PrioritaOrdine = 'bassa' | 'media' | 'alta' | 'urgente';

export type TipologiaRigaOrdine = 'materiale' | 'attrezzatura' | 'mezzo';

export interface RipartizioneCantiereRiga {
  cantiereId: string;
  cantiereNome: string;
  quantita: number;
  note?: string;
}

export interface RigaOrdine {
  id: string;
  tipologia: TipologiaRigaOrdine;
  codice: string; // SKU materiale, matricola attrezzatura o targa mezzo
  descrizione: string;
  quantitaTotale: number;
  unitaMisura: string; // m, pz, kit, gg, ore, n.
  prezzoUnitario?: number;
  subtotale?: number;
  note?: string;
  // Suddivisione su più cantieri con quantità parziali per riga
  ripartizioniCantieri?: RipartizioneCantiereRiga[];
}

export interface AllegatoOrdine {
  id: string;
  nomeFile: string;
  tipo: 'preventivo' | 'ddt' | 'foto' | 'fattura' | 'altro';
  dimensioneKb: number;
  dataCaricamento: string;
  urlSimulato: string;
}

export interface TransizioneStatoOrdine {
  stato: StatoOrdine;
  dataOra: string;
  utenteId: string;
  utenteNome: string;
  note?: string;
  motivoAnnullamento?: string;
}

export interface CommentoOrdine {
  id: string;
  dataOra: string;
  utenteId: string;
  utenteNome: string;
  ruolo?: string;
  testo: string;
}

export interface OrdineInterno {
  id: string;
  numero: string; // es. ORD-FORN-2026-081 o ORD-CLI-2026-042
  tipo: TipoOrdine; // 'fornitore' (approvvigionamento) o 'cliente' (fornitura/noleggio)
  destinatarioId: string;
  destinatarioRagioneSociale: string;
  destinatarioEmail?: string;
  destinatarioTelefono?: string;
  destinatarioIndirizzo?: string;

  cantiereRiferimentoId: string; // Deposito o Cantiere principale di consegna
  cantiereRiferimentoNome: string;

  dataOrdine: string; // YYYY-MM-DD
  dataConsegnaPrevista: string; // YYYY-MM-DD
  dataConsegnaEffettiva?: string;

  priorita: PrioritaOrdine;
  stato: StatoOrdine;

  noteGenerali?: string;
  righe: RigaOrdine[];
  allegati: AllegatoOrdine[];
  storicoStati: TransizioneStatoOrdine[];
  commenti?: CommentoOrdine[];

  importoTotale: number;
  valuta: string;
  creatoDa: {
    id: string;
    name: string;
  };
}

// ==========================================
// SEZIONE: PRESENZE, TIMESHEET & SICUREZZA CANTIERE (D.Lgs 81/08)
// ==========================================

export type TipoPresenza = 'ordinaria' | 'straordinario' | 'trasferta' | 'ferie' | 'malattia' | 'permesso';
export type StatoPresenza = 'bozza' | 'confermata' | 'approvata';

export interface PresenzaCantiere {
  id: string;
  data: string; // YYYY-MM-DD
  dipendenteId: string;
  dipendenteNome: string;
  mansione: string;
  squadra?: string; // es. "Squadra Cablaggi & MT", "Squadra Posa Canali", "Squadra Fotovoltaico"
  ditta: 'interna' | string; // 'interna' oppure nome subappalto
  cantiereId: string;
  cantiereNome: string;
  lavorazioneId?: string;
  lavorazioneTitolo?: string;
  oraIngresso: string; // es. "08:00"
  oraUscita: string;   // es. "17:00"
  oreOrdinarie: number; // es. 8
  oreStraordinarie: number; // es. 1.5
  oreViaggioTrasferta?: number;
  costoOrario: number;
  costoTotaleGiornaliero: number; // calcolato: (oreOrd * costo) + (oreStr * costo * 1.3)
  costoRiservato?: boolean;
  buonoPasto: boolean;
  indennitaTrasferta: number;
  // Conformità e sicurezza D.Lgs 81/08
  dpiVerificati: boolean; // Elmetto, Scarpe S3, Guanti dielettrici, Occhiali
  idoneitaMedicaValida: boolean;
  tesserinoRiconoscimento: boolean;
  forzaInserimento?: boolean;
  bloccoSicurezza?: boolean;
  note?: string;
  approvatoDa?: string; // Nome Capocantiere / PM
  stato: StatoPresenza;
}

// ==========================================
// UNIFIED RE-EXPORTS FOR MODULAR TYPES
// ==========================================
export * from './gestioneOperativa';
export * from './powerApps';
export * from './sal';
export * from './scadenze';
export * from './cantiereDashboard';
export * from './preview';
export * from './ddt';
export * from './gpsScan';
export * from './richiestaMateriali';
export * from './zonaVerde';
export * from './sicurezzaCantiere';
export type { ArticoloListinoFornitore } from '../data/listinoFornitore';
export type { FornitoreAnagrafica } from '../data/mockOrdini';
