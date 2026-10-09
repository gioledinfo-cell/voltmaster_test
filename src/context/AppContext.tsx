import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  AppInterfaceMode,
  UserRole,
  Cliente,
  Cantiere,
  Preventivo,
  Lavorazione,
  ROL,
  Dipendente,
  ArticoloMagazzino,
  MovimentoMagazzino,
  Attrezzatura,
  Veicolo,
  DocumentoTecnico,
  SegnalazioneCliente,
  OrdineInterno,
  StatoOrdine,
  TransizioneStatoOrdine,
  PresenzaCantiere,
  PaccoZonaVerde,
  StatoTransitoPacco,
} from '../types';
import { MOCK_PACCHI_ZONA_VERDE } from '../data/mockPacchiZonaVerde';
import { playSuccessChime } from '../utils/audioChime';
import { RichiestaMateriali, StatoRichiestaMateriali, PrioritaRichiesta } from '../types/richiestaMateriali';
import { INITIAL_RICHIESTE_MATERIALI } from '../data/mockRichiesteMateriali';
import { StatoAvanzamentoLavori, CertificatoPagamento } from '../types/sal';
import { ScadenzaItem, NotificaSistema, calcolaSemaforoScadenza, StoricoRinnovoScadenza } from '../types/scadenze';
import { DocumentoDiTrasporto, StatoDDT, RigaDDT } from '../types/ddt';
import { INITIAL_DDTS } from '../data/mockDdt';
import { ScanEventRecord, GeoLocationPoint, ScanEntityType } from '../types/gpsScan';
import { INITIAL_GPS_SCANS } from '../data/mockGpsScans';
import { getBrowserGpsPosition } from '../services/geolocationService';
import { apiService } from '../services/apiService';
import { useAuth } from './AuthContext';
import {
  INITIAL_USERS,
  INITIAL_CLIENTI,
  INITIAL_PREVENTIVI,
  INITIAL_LAVORAZIONI,
  INITIAL_ROLS,
  INITIAL_MAGAZZINO,
  INITIAL_MOVIMENTI,
  INITIAL_DOCUMENTI,
  INITIAL_SEGNALAZIONI,
} from '../data/mockData';
import {
  INITIAL_ORDINI_INTERNI,
  INITIAL_FORNITORI,
  FornitoreAnagrafica,
} from '../data/mockOrdini';
import { INITIAL_PRESENZE } from '../data/mockPresenze';
import { INITIAL_SALS } from '../data/mockSal';
import { INITIAL_SCADENZE, INITIAL_NOTIFICHE } from '../data/mockScadenze';
import { DIPENDENTI } from '../data/dipendenti';
import { VEICOLI } from '../data/veicoli';
import { ATTREZZATURE } from '../data/attrezzatura';
import { DEPOSITI } from '../data/depositi';
import { CANTIERI } from '../data/cantieri';
import { RIFORNIMENTI } from '../data/rifornimenti';
import { DepositoRecord, RifornimentoRecord } from '../types/gestioneOperativa';
import { ArticoloListinoFornitore, LISTINO_REMATARLAZZI } from '../data/listinoFornitore';
import {
  saveActiveDataToOfflineCache,
  getOfflineCacheMetadataSync,
  OfflineCacheMetadata,
} from '../services/offlineCacheService';
import { generateUniqueId } from '../utils/idGenerator';
import { CantiereContext, CantiereContextType, useCantiere } from './CantiereContext';
import { LogisticaContext, LogisticaContextType, useLogistica } from './LogisticaContext';
import { ContabilitaContext, ContabilitaContextType, useContabilita } from './ContabilitaContext';

export { useCantiere } from './CantiereContext';
export { useLogistica } from './LogisticaContext';
export { useContabilita } from './ContabilitaContext';

export type NavigationTab =
  | 'dashboard'
  | 'cantieri'
  | 'preventivi'
  | 'lavorazioni'
  | 'rol'
  | 'magazzino'
  | 'attrezzature'
  | 'veicoli'
  | 'dipendenti'
  | 'documenti'
  | 'cliente_portal'
  | 'flusso_cantiere'
  | 'organigramma'
  | 'contabilita_kpi'
  | 'portale_magazzino'
  | 'ordini_interni'
  | 'ordini_fornitori'
  | 'ordini_clienti'
  | 'presenze_cantiere'
  | 'sal_cantiere'
  | 'scadenziario'
  | 'ddt_trasporto'
  | 'mappa_gps'
  | 'powerapps_flotta_asset'
  | 'richieste_materiali'
  | 'sicurezza_cantiere'
  | 'gantt_squadre'
  | 'giornale_lavori'
  | 'fatturazione_elettronica';

export interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

export interface QRModalData {
  title: string;
  code: string;
  subtitle?: string;
  type: 'cantiere' | 'materiale' | 'attrezzatura' | 'veicolo';
}

interface AppContextType {
  currentUser: User;
  setCurrentRole: (role: UserRole) => void;
  interfaceMode: AppInterfaceMode;
  setInterfaceMode: (mode: AppInterfaceMode) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  
  // Data State
  clienti: Cliente[];
  cantieri: Cantiere[];
  preventivi: Preventivo[];
  lavorazioni: Lavorazione[];
  rols: ROL[];
  dipendenti: Dipendente[];
  magazzino: ArticoloMagazzino[];
  movimenti: MovimentoMagazzino[];
  attrezzature: Attrezzatura[];
  veicoli: Veicolo[];
  depositi: DepositoRecord[];
  rifornimenti: RifornimentoRecord[];
  documenti: DocumentoTecnico[];
  segnalazioni: SegnalazioneCliente[];

  // Listino Fornitore (RemaTarlazzi)
  listinoFornitore: ArticoloListinoFornitore[];
  updateListinoFornitore: (items: ArticoloListinoFornitore[]) => void;

  // Mutators
  addCliente: (c: Omit<Cliente, 'id'>) => Cliente;
  updateCliente: (id: string, updates: Partial<Cliente>) => void;
  addCantiere: (c: Omit<Cantiere, 'id'>) => Cantiere;
  updateCantiere: (id: string, updates: Partial<Cantiere>) => void;
  
  addPreventivo: (p: Omit<Preventivo, 'id'>) => Preventivo;
  updatePreventivo: (id: string, updates: Partial<Preventivo>) => void;
  convertPreventivoToCantiere: (prevId: string) => Cantiere | null;

  addLavorazione: (l: Omit<Lavorazione, 'id'>) => Lavorazione;
  updateLavorazione: (id: string, updates: Partial<Lavorazione>) => void;

  addROL: (rol: Omit<ROL, 'id' | 'numero'>) => ROL;
  updateROL: (id: string, updates: Partial<ROL>) => void;
  approveROL: (id: string, note?: string) => void;
  rejectROL: (id: string, note: string) => void;

  addArticoloMagazzino: (a: Omit<ArticoloMagazzino, 'id'> & { id?: string }) => ArticoloMagazzino;
  addArticoliMagazzinoBatch: (articoli: (Omit<ArticoloMagazzino, 'id'> & { id?: string })[]) => number;
  updateArticoloMagazzino: (id: string, updates: Partial<ArticoloMagazzino>) => void;
  addMovimento: (m: Omit<MovimentoMagazzino, 'id'>) => void;

  addAttrezzatura: (a: Omit<Attrezzatura, 'id'>) => Attrezzatura;
  updateAttrezzatura: (id: string, updates: Partial<Attrezzatura>) => void;

  updateVeicolo: (id: string, updates: Partial<Veicolo>) => void;
  addVeicolo: (v: Omit<Veicolo, 'id'>) => Veicolo;
  setVeicoliList: (list: Veicolo[]) => void;
  addRifornimento: (r: Omit<RifornimentoRecord, 'id'>) => RifornimentoRecord;
  addDeposito: (dep: Omit<DepositoRecord, 'id'>) => DepositoRecord;

  addDocumento: (doc: Omit<DocumentoTecnico, 'id'>) => DocumentoTecnico;
  addSegnalazione: (seg: Omit<SegnalazioneCliente, 'id'>) => SegnalazioneCliente;
  updateSegnalazione: (id: string, updates: Partial<SegnalazioneCliente>) => void;

  // Ordini Interni & Fornitori
  ordiniInterni: OrdineInterno[];
  fornitori: FornitoreAnagrafica[];
  addOrdineInterno: (ordine: Omit<OrdineInterno, 'id' | 'numero' | 'storicoStati' | 'creatoDa'>) => OrdineInterno;
  updateOrdineInterno: (id: string, updates: Partial<OrdineInterno>) => void;
  deleteOrdineInterno: (id: string) => void;
  transizioneStatoOrdine: (id: string, nuovoStato: StatoOrdine, note?: string, motivoAnnullamento?: string) => void;
  duplicaOrdineInterno: (id: string) => OrdineInterno;
  addCommentoOrdine: (ordineId: string, testo: string) => void;

  // Presenze & Timesheet Cantiere (D.Lgs 81/08)
  presenze: PresenzaCantiere[];
  addPresenza: (presenza: Omit<PresenzaCantiere, 'id'>) => void;
  updatePresenza: (id: string, updates: Partial<PresenzaCantiere>) => void;
  deletePresenza: (id: string) => void;
  timbraturaRapidaSquadra: (cantiereId: string, squadraNome: string, dipendentiIds: string[], data?: string) => void;
  approvaPresenza: (id: string, approvatoreNome: string) => void;

  // Stato Avanzamento Lavori (SAL) & Contabilità di Cantiere
  sals: StatoAvanzamentoLavori[];
  addSal: (sal: Omit<StatoAvanzamentoLavori, 'id'>) => StatoAvanzamentoLavori;
  updateSal: (id: string, updates: Partial<StatoAvanzamentoLavori>) => void;
  deleteSal: (id: string) => void;
  approvaSalDL: (id: string, nomeDL: string, note?: string) => void;
  emettiCertificatoPagamento: (salId: string, cert: CertificatoPagamento) => void;
  liquidaSal: (salId: string, rifFattura?: string) => void;

  // Centro Notifiche & Scadenziario Visivo a Semaforo (DURC, CEI 64-8, Mezzi, Patentini)
  scadenze: ScadenzaItem[];
  notifiche: NotificaSistema[];
  addScadenza: (scadenza: Omit<ScadenzaItem, 'id'>) => ScadenzaItem;
  updateScadenza: (id: string, updates: Partial<ScadenzaItem>) => void;
  deleteScadenza: (id: string) => void;
  rinnovaScadenza: (id: string, nuovaData: string, note?: string, nuovoProtocollo?: string, costo?: number) => void;
  segnaNotificaLetta: (id: string) => void;
  segnaTutteNotificheLette: () => void;
  eliminaNotifica: (id: string) => void;
  aggiungiNotifica: (notifica: Omit<NotificaSistema, 'id' | 'dataOra' | 'letta'>) => void;
  isNotificheDropdownOpen: boolean;
  setIsNotificheDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Documenti di Trasporto (DDT) & Logistica Furgoni (D.P.R. 472/96)
  ddts: DocumentoDiTrasporto[];
  addDdt: (ddt: Omit<DocumentoDiTrasporto, 'id' | 'numeroDdt'>) => DocumentoDiTrasporto;
  updateDdt: (id: string, updates: Partial<DocumentoDiTrasporto>) => void;
  deleteDdt: (id: string) => void;
  confermaConsegnaDdt: (id: string, nomeRicevente?: string, firmaDestinatario?: string) => void;
  annullaDdt: (id: string, motivo: string) => void;
  scaricaDdtInMagazzino: (ddtId: string) => void;

  // Modulo Richieste Materiali & Attrezzature Cantiere
  richiesteMateriali: RichiestaMateriali[];
  addRichiestaMateriali: (richiesta: Omit<RichiestaMateriali, 'id' | 'numero' | 'notifica'>) => RichiestaMateriali;
  updateRichiestaMateriali: (id: string, updates: Partial<RichiestaMateriali>) => void;
  deleteRichiestaMateriali: (id: string) => void;
  aggiornaStatoRichiesta: (id: string, nuovoStato: StatoRichiestaMateriali, operatore?: string) => void;
  generaDdtDaRichiesta: (richiestaId: string, opzioni?: { veicoloId?: string; autistaId?: string; noteTrasporto?: string }) => DocumentoDiTrasporto | null;

  // Logistica & Spedizioni "Zona Verde" (Segnacolli A5 & Presa in carico QR)
  pacchiZonaVerde: PaccoZonaVerde[];
  addPaccoZonaVerde: (pacco: Omit<PaccoZonaVerde, 'id' | 'qrCode'> & { id?: string; qrCode?: string }) => PaccoZonaVerde;
  updatePaccoZonaVerde: (id: string, updates: Partial<PaccoZonaVerde>) => void;
  deletePaccoZonaVerde: (id: string) => void;
  confermaCaricoPacco: (paccoIdOrQr: string, operatore?: { id: string; nome: string }, furgone?: string) => { success: boolean; pacco?: PaccoZonaVerde; message: string };
  activePaccoCaricoModal: PaccoZonaVerde | null;
  setActivePaccoCaricoModal: (pacco: PaccoZonaVerde | null) => void;
  selectedPaccoStampa: PaccoZonaVerde | null;
  setSelectedPaccoStampa: (pacco: PaccoZonaVerde | null) => void;
  isNuovoPaccoModalOpen: boolean;
  setIsNuovoPaccoModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  resetToMockData: () => void;

  // QR Modal & Scanner
  qrModalData: QRModalData | null;
  openQRModal: (data: QRModalData) => void;
  closeQRModal: () => void;

  isScannerOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  handleScannedCode: (code: string, options?: { currentStatus?: string; notes?: string; forcedLocation?: GeoLocationPoint }) => Promise<ScanEventRecord>;

  // Tracciamento GPS e Scansioni QR Code
  gpsScans: ScanEventRecord[];
  registerScanEvent: (event: Omit<ScanEventRecord, 'scanId' | 'timestamp'> & { timestamp?: string }) => ScanEventRecord;
  deleteScanRecord: (scanId: string) => void;
  clearScanRecords: () => void;

  // Active Selected Item for Drilldowns
  selectedCantiereId: string | null;
  setSelectedCantiereId: (id: string | null) => void;

  // Offline Cache for Field Operations (Cantieri & Materiali)
  offlineCacheInfo: OfflineCacheMetadata;
  refreshOfflineCache: (showToastNotification?: boolean) => Promise<void>;
  isOfflineModalOpen: boolean;
  offlineModalTab: 'cantieri' | 'materiali';
  openOfflineModal: (tab?: 'cantieri' | 'materiali') => void;
  closeOfflineModal: () => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'voltmaster_';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);

    // Se è un array di oggetti con campo 'id', garantisce che non ci siano ID duplicati o non validi
    if (Array.isArray(parsed)) {
      const seenIds = new Set<string>();
      const sanitized = parsed.map((elem, idx) => {
        if (elem && typeof elem === 'object' && 'id' in elem) {
          const currentId = String(elem.id || '');
          if (!currentId || seenIds.has(currentId)) {
            const freshId = generateUniqueId(key.slice(0, 4) || 'item');
            seenIds.add(freshId);
            return { ...elem, id: freshId };
          }
          seenIds.add(currentId);
        }
        return elem;
      });
      return sanitized as unknown as T;
    }

    return parsed;
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
    return defaultValue;
  }
}

function saveToStorageSafe<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`[Storage] Non è stato possibile salvare '${key}' in localStorage (Quota ecceduta o limite memoria):`, e);
    return false;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser: authUser } = useAuth();

  const [currentUser, setCurrentUser] = useState<User>(() => {
    return authUser || loadFromStorage<User>('current_user', INITIAL_USERS[0]);
  });
  const [interfaceMode, setInterfaceModeState] = useState<AppInterfaceMode>(() => {
    return loadFromStorage<AppInterfaceMode>('interface_mode', 'ufficio_tecnico');
  });

  // Keep AppContext currentUser synced with AuthContext
  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
      if (authUser.role === 'cliente') {
        setInterfaceModeState('cliente_portal');
        setActiveTabState('cliente_portal');
      } else if (authUser.reparto === 'contabilita') {
        setInterfaceModeState('contabilita');
      } else if (authUser.reparto === 'capocantiere' || authUser.reparto === 'operaio' || authUser.reparto === 'apprendista') {
        setInterfaceModeState('cantiere_mobile');
      } else if (authUser.reparto === 'ufficio_tecnico') {
        setInterfaceModeState('ufficio_tecnico');
      }
    }
  }, [authUser]);

  const [activeTab, setActiveTabState] = useState<NavigationTab>('dashboard');

  const [clienti, setClienti] = useState<Cliente[]>(() => loadFromStorage('clienti', INITIAL_CLIENTI));
  const [cantieri, setCantieri] = useState<Cantiere[]>(() => loadFromStorage('cantieri_v2', CANTIERI));
  const [preventivi, setPreventivi] = useState<Preventivo[]>(() => loadFromStorage('preventivi', INITIAL_PREVENTIVI));
  const [lavorazioni, setLavorazioni] = useState<Lavorazione[]>(() => loadFromStorage('lavorazioni', INITIAL_LAVORAZIONI));
  const [rols, setRols] = useState<ROL[]>(() => loadFromStorage('rols', INITIAL_ROLS));
  const [dipendenti, setDipendenti] = useState<Dipendente[]>(() => loadFromStorage('dipendenti_v2', DIPENDENTI));
  const [magazzino, setMagazzino] = useState<ArticoloMagazzino[]>(() => {
    const raw = loadFromStorage<ArticoloMagazzino[]>('magazzino_v3', []);
    if (!raw || raw.length === 0) {
      const v1 = loadFromStorage<ArticoloMagazzino[]>('magazzino', []);
      if (v1 && v1.length > 0) {
        const initialSkuMap = new Map(INITIAL_MAGAZZINO.map((item) => [item.codiceSku, item]));
        const merged = [...INITIAL_MAGAZZINO];
        for (const item of v1) {
          if (!initialSkuMap.has(item.codiceSku)) {
            merged.push(item);
          }
        }
        return merged;
      }
      return INITIAL_MAGAZZINO;
    }
    const rawSkuMap = new Map(raw.map((item) => [item.codiceSku, item]));
    const missing = INITIAL_MAGAZZINO.filter((item) => !rawSkuMap.has(item.codiceSku));
    return [...raw, ...missing];
  });
  const [movimenti, setMovimenti] = useState<MovimentoMagazzino[]>(() => loadFromStorage('movimenti', INITIAL_MOVIMENTI));
  const [attrezzature, setAttrezzature] = useState<Attrezzatura[]>(() => loadFromStorage('attrezzature_v2', ATTREZZATURE));
  const [veicoli, setVeicoli] = useState<Veicolo[]>(() => loadFromStorage('veicoli_v2', VEICOLI));
  const [depositi, setDepositi] = useState<DepositoRecord[]>(() => loadFromStorage('depositi_v2', DEPOSITI));
  const [rifornimenti, setRifornimenti] = useState<RifornimentoRecord[]>(() => loadFromStorage('rifornimenti_v2', RIFORNIMENTI));
  const [documenti, setDocumenti] = useState<DocumentoTecnico[]>(() => loadFromStorage('documenti', INITIAL_DOCUMENTI));
  const [segnalazioni, setSegnalazioni] = useState<SegnalazioneCliente[]>(() => loadFromStorage('segnalazioni', INITIAL_SEGNALAZIONI));
  const [ordiniInterni, setOrdiniInterni] = useState<OrdineInterno[]>(() => loadFromStorage('ordini_interni', INITIAL_ORDINI_INTERNI));
  const [fornitori, setFornitori] = useState<FornitoreAnagrafica[]>(() => loadFromStorage('fornitori', INITIAL_FORNITORI));
  const [listinoFornitore, setListinoFornitore] = useState<ArticoloListinoFornitore[]>(() =>
    loadFromStorage('listino_rematarlazzi_v1', LISTINO_REMATARLAZZI)
  );

  const updateListinoFornitore = (items: ArticoloListinoFornitore[]) => {
    setListinoFornitore(items);
    saveToStorageSafe('listino_rematarlazzi_v1', items);
  };
  const [presenze, setPresenze] = useState<PresenzaCantiere[]>(() => loadFromStorage('presenze', INITIAL_PRESENZE));
  const [sals, setSals] = useState<StatoAvanzamentoLavori[]>(() => loadFromStorage('sals', INITIAL_SALS));
  const [scadenze, setScadenze] = useState<ScadenzaItem[]>(() => loadFromStorage('scadenze', INITIAL_SCADENZE));
  const [notifiche, setNotifiche] = useState<NotificaSistema[]>(() => loadFromStorage('notifiche', INITIAL_NOTIFICHE));
  const [ddts, setDdts] = useState<DocumentoDiTrasporto[]>(() => loadFromStorage('ddts', INITIAL_DDTS));
  const [richiesteMateriali, setRichiesteMateriali] = useState<RichiestaMateriali[]>(() =>
    loadFromStorage('richieste_materiali_v1', INITIAL_RICHIESTE_MATERIALI)
  );
  const [gpsScans, setGpsScans] = useState<ScanEventRecord[]>(() => loadFromStorage('gps_scans_v1', INITIAL_GPS_SCANS));
  const [pacchiZonaVerde, setPacchiZonaVerde] = useState<PaccoZonaVerde[]>(() =>
    loadFromStorage('pacchi_zona_verde_v1', MOCK_PACCHI_ZONA_VERDE)
  );
  const [activePaccoCaricoModal, setActivePaccoCaricoModal] = useState<PaccoZonaVerde | null>(null);
  const [selectedPaccoStampa, setSelectedPaccoStampa] = useState<PaccoZonaVerde | null>(null);
  const [isNuovoPaccoModalOpen, setIsNuovoPaccoModalOpen] = useState(false);
  const [isNotificheDropdownOpen, setIsNotificheDropdownOpen] = useState(false);

  const [selectedCantiereId, setSelectedCantiereId] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<QRModalData | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Offline Cache State (IndexedDB + LocalStorage)
  const [offlineCacheInfo, setOfflineCacheInfo] = useState<OfflineCacheMetadata>(() => {
    const existing = getOfflineCacheMetadataSync();
    if (existing) return existing;
    const now = new Date();
    return {
      lastUpdated: now.toISOString(),
      formattedTime: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      activeCantieriCount: CANTIERI.filter((c) => c.stato !== 'completato').length,
      materialiCount: INITIAL_MAGAZZINO.length,
      storageEngine: 'IndexedDB',
    };
  });

  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [offlineModalTab, setOfflineModalTab] = useState<'cantieri' | 'materiali'>('cantieri');

  const openOfflineModal = (tab: 'cantieri' | 'materiali' = 'cantieri') => {
    setOfflineModalTab(tab);
    setIsOfflineModalOpen(true);
  };

  const closeOfflineModal = () => {
    setIsOfflineModalOpen(false);
  };

  const refreshOfflineCache = async (showToastNotification: boolean = false) => {
    try {
      const meta = await saveActiveDataToOfflineCache(cantieri, magazzino);
      setOfflineCacheInfo(meta);
      if (showToastNotification) {
        showToast(
          `Cache offline sincronizzata: ${meta.activeCantieriCount} cantieri attivi e ${meta.materialiCount} materiali pronti all'uso sul dispositivo (${meta.storageEngine}).`,
          'success'
        );
      }
    } catch (e) {
      console.error('Failed to sync offline cache:', e);
    }
  };

  // Automatically keep offline cache synchronized when cantieri or magazzino change
  useEffect(() => {
    saveActiveDataToOfflineCache(cantieri, magazzino)
      .then((meta) => {
        setOfflineCacheInfo(meta);
      })
      .catch((err) => {
        console.warn('Auto offline cache update warning:', err);
      });
  }, [cantieri, magazzino]);

  // Fetch full application state from Express Persistent Server API on mount
  useEffect(() => {
    apiService.fetchFullState().then((serverState) => {
      if (serverState) {
        if (serverState.cantieri && serverState.cantieri.length > 0) setCantieri(serverState.cantieri);
        if (serverState.rols && serverState.rols.length > 0) setRols(serverState.rols as any);
        if (serverState.sals && serverState.sals.length > 0) setSals(serverState.sals);
        if (serverState.ddts && serverState.ddts.length > 0) setDdts(serverState.ddts as any);
        if (serverState.ordiniInterni && serverState.ordiniInterni.length > 0) setOrdiniInterni(serverState.ordiniInterni);
        if (serverState.dipendenti && serverState.dipendenti.length > 0) setDipendenti(serverState.dipendenti);
      }
    });
  }, []);

  // Sync to Express Server API and LocalStorage
  useEffect(() => {
    try {
      // Background Sync to Express API
      apiService.syncFullState({
        cantieri,
        rols: rols as any,
        sals,
        ddts: ddts as any,
        ordiniInterni,
        scadenze: scadenze as any,
        dipendenti,
        veicoli: veicoli as any,
        attrezzature: attrezzature as any,
        presenze,
      });

      saveToStorageSafe('clienti', clienti);
      saveToStorageSafe('cantieri', cantieri);
      saveToStorageSafe('cantieri_v2', cantieri);
      saveToStorageSafe('preventivi', preventivi);
      saveToStorageSafe('lavorazioni', lavorazioni);
      saveToStorageSafe('rols', rols);
      saveToStorageSafe('dipendenti', dipendenti);
      saveToStorageSafe('dipendenti_v2', dipendenti);
      saveToStorageSafe('magazzino', magazzino);
      saveToStorageSafe('magazzino_v3', magazzino);
      saveToStorageSafe('movimenti', movimenti);
      saveToStorageSafe('attrezzature', attrezzature);
      saveToStorageSafe('attrezzature_v2', attrezzature);
      saveToStorageSafe('veicoli', veicoli);
      saveToStorageSafe('veicoli_v2', veicoli);
      saveToStorageSafe('depositi', depositi);
      saveToStorageSafe('depositi_v2', depositi);
      saveToStorageSafe('rifornimenti', rifornimenti);
      saveToStorageSafe('rifornimenti_v2', rifornimenti);
      saveToStorageSafe('documenti', documenti);
      saveToStorageSafe('segnalazioni', segnalazioni);
      saveToStorageSafe('ordini_interni', ordiniInterni);
      saveToStorageSafe('fornitori', fornitori);
      saveToStorageSafe('presenze', presenze);
      saveToStorageSafe('sals', sals);
      saveToStorageSafe('scadenze', scadenze);
      saveToStorageSafe('notifiche', notifiche);
      saveToStorageSafe('ddts', ddts);
      saveToStorageSafe('richieste_materiali_v1', richiesteMateriali);
      saveToStorageSafe('pacchi_zona_verde_v1', pacchiZonaVerde);
      saveToStorageSafe('current_user', currentUser);
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }, [clienti, cantieri, preventivi, lavorazioni, rols, dipendenti, magazzino, movimenti, attrezzature, veicoli, depositi, rifornimenti, documenti, segnalazioni, ordiniInterni, fornitori, presenze, sals, scadenze, notifiche, ddts, richiesteMateriali, pacchiZonaVerde, currentUser]);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const setInterfaceMode = (mode: AppInterfaceMode) => {
    setInterfaceModeState(mode);
    saveToStorageSafe('interface_mode', mode);
    
    // Auto-switch default user / tab for this mode
    if (mode === 'contabilita') {
      const u = INITIAL_USERS.find((x) => x.reparto === 'contabilita') || INITIAL_USERS[0];
      setCurrentUser(u);
      setActiveTabState('rol');
      showToast('Attivata Interfaccia Amministrazione & Contabilità (3 addetti)', 'info');
    } else if (mode === 'ufficio_tecnico') {
      const u = INITIAL_USERS.find((x) => x.reparto === 'ufficio_tecnico') || INITIAL_USERS[1];
      setCurrentUser(u);
      setActiveTabState('cantieri');
      showToast('Attivata Interfaccia Ufficio Tecnico & PM (4 addetti)', 'info');
    } else if (mode === 'cantiere_mobile') {
      const u = INITIAL_USERS.find((x) => x.reparto === 'capocantiere') || INITIAL_USERS[2];
      setCurrentUser(u);
      setActiveTabState('rol');
      showToast('Attivata Interfaccia Campo & Cantiere Mobile (13 addetti)', 'info');
    } else if (mode === 'cliente_portal') {
      const u = INITIAL_USERS.find((x) => x.role === 'cliente') || INITIAL_USERS[INITIAL_USERS.length - 1];
      setCurrentUser(u);
      setActiveTabState('cliente_portal');
      showToast('Attivato Portale Esterno Committenti (20+ clienti)', 'info');
    } else if (mode === 'magazzino_portale') {
      const u = INITIAL_USERS.find((x) => x.reparto === 'ufficio_tecnico') || INITIAL_USERS[1];
      setCurrentUser(u);
      setActiveTabState('portale_magazzino');
      showToast('Attivato Portale Magazzino & Logistica (Materiali, Attrezzatura, Veicoli)', 'info');
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setCurrentRole = (role: UserRole) => {
    const target = INITIAL_USERS.find((u) => u.role === role) || {
      id: `usr-${role}`,
      name: role.toUpperCase(),
      email: `${role}@voltmaster.it`,
      role,
    };
    setCurrentUser(target);
    if (role === 'cliente') {
      setActiveTabState('cliente_portal');
    } else if (activeTab === 'cliente_portal') {
      setActiveTabState('dashboard');
    }
    showToast(`Profilo attivo: ${target.name} (${role.toUpperCase()})`, 'info');
  };

  const setActiveTab = (tab: NavigationTab) => {
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addCliente = (data: Omit<Cliente, 'id'>) => {
    const newId = generateUniqueId('cli');
    const newCliente: Cliente = { ...data, id: newId };
    setClienti((prev) => [newCliente, ...prev]);
    showToast(`Cliente ${newCliente.ragioneSociale} registrato con successo!`, 'success');
    return newCliente;
  };

  const updateCliente = (id: string, updates: Partial<Cliente>) => {
    setClienti((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    showToast('Anagrafica cliente aggiornata.', 'info');
  };

  const addCantiere = (data: Omit<Cantiere, 'id'>) => {
    const newId = generateUniqueId('cnt');
    const newCantiere: Cantiere = { ...data, id: newId };
    setCantieri((prev) => [newCantiere, ...prev]);
    showToast(`Cantiere ${newCantiere.codice} creato con successo!`);
    return newCantiere;
  };

  const updateCantiere = (id: string, updates: Partial<Cantiere>) => {
    setCantieri((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    showToast('Cantiere aggiornato.');
  };

  const addPreventivo = (data: Omit<Preventivo, 'id'>) => {
    const newId = generateUniqueId('prev');
    const newPrev: Preventivo = { ...data, id: newId };
    setPreventivi((prev) => [newPrev, ...prev]);
    showToast(`Preventivo ${newPrev.numero} salvato!`);
    return newPrev;
  };

  const updatePreventivo = (id: string, updates: Partial<Preventivo>) => {
    setPreventivi((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast('Preventivo aggiornato.');
  };

  const convertPreventivoToCantiere = (prevId: string): Cantiere | null => {
    const prevItem = preventivi.find((p) => p.id === prevId);
    if (!prevItem) return null;

    const nextCodeNum = cantieri.length + 1;
    const codice = `CNT-2026-${String(nextCodeNum).padStart(3, '0')}`;
    const newCantiere: Cantiere = {
      id: generateUniqueId('cnt'),
      codice,
      titolo: prevItem.oggetto,
      clienteId: prevItem.clienteId,
      clienteNome: prevItem.clienteNome,
      indirizzo: 'Indirizzo da confermare in cantiere',
      citta: 'Milano (MI)',
      stato: 'in_attesa',
      avanzamentoPercentuale: 0,
      dataInizio: new Date().toISOString().split('T')[0],
      dataFinePrevista: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
      responsabileId: 'usr-resp',
      responsabileNome: 'Ing. Roberto Fontana',
      operatoriAssegnatiIds: ['usr-op1'],
      budgetTotale: prevItem.imponibile,
      costiConsuntivati: 0,
      descrizione: `Cantiere generato automaticamente dal preventivo ${prevItem.numero}. ${prevItem.note}`,
      qrCode: `QR-${codice}`,
      dispositivi: [],
      materialiAssegnati: [],
    };

    setCantieri((prev) => [newCantiere, ...prev]);
    updatePreventivo(prevId, { stato: 'accettato', cantiereIdCreato: newCantiere.id });
    showToast(`Preventivo convertito nel nuovo cantiere ${codice}!`, 'success');
    return newCantiere;
  };

  const addLavorazione = (data: Omit<Lavorazione, 'id'>) => {
    const newId = generateUniqueId('lav');
    const newLav: Lavorazione = { ...data, id: newId };
    setLavorazioni((prev) => [newLav, ...prev]);
    showToast('Nuova lavorazione pianificata.');
    return newLav;
  };

  const updateLavorazione = (id: string, updates: Partial<Lavorazione>) => {
    setLavorazioni((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
    showToast('Lavorazione aggiornata.');
  };

  const addROL = (data: Omit<ROL, 'id' | 'numero'>) => {
    const nextNum = rols.length + 188;
    const numero = `ROL-2026-0${nextNum}`;
    const newId = generateUniqueId('rol');
    const newRol: ROL = {
      ...data,
      id: newId,
      rolId: numero,
      numero,
      date: data.data,
      operatorId: data.operatoreId,
      operatorName: data.operatoreNome,
      hoursWork: data.hoursWork ?? (data.oreOrdinarie + data.oreStraordinarie),
      hasTravel: data.hasTravel ?? false,
      hoursTravel: data.hasTravel ? (data.hoursTravel ?? 0) : 0,
      totalHours: data.oreTotali,
      travelDetails: data.hasTravel ? data.travelDetails : null,
      partsReplaced: data.partsReplaced || undefined,
      photos: data.photos || [],
    };
    setRols((prev) => [newRol, ...prev]);

    // Update lavorazione ore worked if connected (including squad)
    const squadTotalHours =
      data.oreTotali +
      (data.collaboratori || []).reduce(
        (acc, c) => acc + (c.oreOrdinarie ?? data.oreOrdinarie) + (c.oreStraordinarie ?? data.oreStraordinarie),
        0
      );

    if (data.lavorazioneId) {
      setLavorazioni((prev) =>
        prev.map((l) =>
          l.id === data.lavorazioneId
            ? { ...l, oreLavorate: l.oreLavorate + squadTotalHours }
            : l
        )
      );
    }

    // Update dipendenti ore (lead + all collaborators)
    setDipendenti((prev) =>
      prev.map((d) => {
        if (d.id === data.operatoreId || `${d.nome} ${d.cognome}`.toLowerCase() === data.operatoreNome.toLowerCase()) {
          return { ...d, oreLavorateMeseCorrente: d.oreLavorateMeseCorrente + data.oreTotali };
        }
        const matchedCollab = data.collaboratori?.find(
          (c) => c.id === d.id || c.nome.toLowerCase() === `${d.nome} ${d.cognome}`.toLowerCase()
        );
        if (matchedCollab) {
          const collabHours = (matchedCollab.oreOrdinarie ?? data.oreOrdinarie) + (matchedCollab.oreStraordinarie ?? data.oreStraordinarie);
          return { ...d, oreLavorateMeseCorrente: d.oreLavorateMeseCorrente + collabHours };
        }
        return d;
      })
    );

    // Update cantiere costi consuntivati
    const cantiere = cantieri.find((c) => c.id === data.cantiereId);
    if (cantiere) {
      const addedCost = squadTotalHours * 38; // stima oraria squadra
      updateCantiere(cantiere.id, {
        costiConsuntivati: cantiere.costiConsuntivati + addedCost,
      });
    }

    showToast(`Rapporto ${numero} registrato con successo!`, 'success');
    return newRol;
  };

  const updateROL = (id: string, updates: Partial<ROL>) => {
    setRols((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    showToast('ROL aggiornato.');
  };

  const approveROL = (id: string, note?: string) => {
    setRols((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              stato: 'approvato',
              approvatoDaId: currentUser.id,
              approvatoIl: new Date().toISOString().split('T')[0],
              noteApprovazione: note || 'Approvato regolarmente.',
            }
          : r
      )
    );
    showToast('ROL approvato con successo e integrato nella contabilità!', 'success');
  };

  const rejectROL = (id: string, note: string) => {
    setRols((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              stato: 'respinto',
              noteApprovazione: note,
              bloccatoModifiche: false,
            }
          : r
      )
    );
    showToast('ROL respinto per revisione operatore.', 'warning');
  };

  const addArticoloMagazzino = (data: Omit<ArticoloMagazzino, 'id'> & { id?: string }) => {
    const newId = data.id || generateUniqueId('art');
    const newArt: ArticoloMagazzino = { ...data, id: newId };
    setMagazzino((prev) => {
      // Previeni duplicati accidentali dello stesso ID
      const exists = prev.some((a) => a.id === newId);
      if (exists) {
        return prev.map((a) => (a.id === newId ? { ...a, ...newArt } : a));
      }
      return [newArt, ...prev];
    });
    showToast(`Articolo ${newArt.codiceSku} aggiunto a magazzino.`);
    return newArt;
  };

  const addArticoliMagazzinoBatch = (articoli: (Omit<ArticoloMagazzino, 'id'> & { id?: string })[]) => {
    if (!articoli || articoli.length === 0) return 0;
    
    let addedCount = 0;
    setMagazzino((prev) => {
      const existingMap = new Map(prev.map((a) => [a.id, a]));
      const existingSkuMap = new Map(prev.map((a) => [a.codiceSku.toLowerCase(), a.id]));
      const existingEanMap = new Map(
        prev.filter((a) => a.barcodeEan).map((a) => [a.barcodeEan!, a.id])
      );

      const updated = [...prev];

      articoli.forEach((item) => {
        // Cerca se esiste già per SKU o Barcode
        const matchIdBySku = existingSkuMap.get(item.codiceSku.toLowerCase());
        const matchIdByEan = item.barcodeEan ? existingEanMap.get(item.barcodeEan) : undefined;
        const targetId = matchIdBySku || matchIdByEan || item.id;

        if (targetId && existingMap.has(targetId)) {
          const idx = updated.findIndex((a) => a.id === targetId);
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              ...item,
              id: targetId,
            };
          }
        } else {
          const freshId = item.id || generateUniqueId('art');
          const newArt: ArticoloMagazzino = {
            ...item,
            id: freshId,
          };
          updated.unshift(newArt);
          existingMap.set(freshId, newArt);
          existingSkuMap.set(item.codiceSku.toLowerCase(), freshId);
          if (item.barcodeEan) {
            existingEanMap.set(item.barcodeEan, freshId);
          }
          addedCount++;
        }
      });

      return updated;
    });

    return addedCount;
  };

  const updateArticoloMagazzino = (id: string, updates: Partial<ArticoloMagazzino>) => {
    setMagazzino((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    showToast('Giacenza/Articolo aggiornato.');
  };

  const addMovimento = (m: Omit<MovimentoMagazzino, 'id'>) => {
    const newMov: MovimentoMagazzino = {
      ...m,
      id: generateUniqueId('mov'),
    };
    setMovimenti((prev) => [newMov, ...prev]);

    // Adjust giacenza
    const diff = m.tipo === 'carico_fornitore' || m.tipo === 'reso_cantiere' ? m.quantita : -m.quantita;
    setMagazzino((prev) =>
      prev.map((art) =>
        art.id === m.articoloId
          ? { ...art, giacenza: Math.max(0, art.giacenza + diff) }
          : art
      )
    );
    showToast(`Movimento registrato: ${m.tipo.replace('_', ' ')} (${m.quantita})`);
  };

  const addAttrezzatura = (data: Omit<Attrezzatura, 'id'>) => {
    const newId = generateUniqueId('att');
    const newAtt: Attrezzatura = { ...data, id: newId };
    setAttrezzature((prev) => [newAtt, ...prev]);
    showToast(`Attrezzatura ${newAtt.codiceUnivoco} inserita.`);
    return newAtt;
  };

  const updateAttrezzatura = (id: string, updates: Partial<Attrezzatura>) => {
    setAttrezzature((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    showToast('Attrezzatura aggiornata.');
  };

  const addVeicolo = (data: Omit<Veicolo, 'id'>) => {
    const newId = generateUniqueId('vec');
    const newVec: Veicolo = { ...data, id: newId };
    setVeicoli((prev) => [newVec, ...prev]);
    showToast(`Veicolo targa ${newVec.targa} aggiunto alla flotta.`);
    return newVec;
  };

  const updateVeicolo = (id: string, updates: Partial<Veicolo>) => {
    setVeicoli((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
    showToast('Dati veicolo aggiornati.');
  };

  const setVeicoliList = (list: Veicolo[]) => {
    setVeicoli(list);
    try {
      localStorage.setItem(STORAGE_PREFIX + 'veicoli', JSON.stringify(list));
      localStorage.setItem(STORAGE_PREFIX + 'veicoli_v2', JSON.stringify(list));
    } catch (e) {
      console.error('Error saving veicoli:', e);
    }
    showToast(`Aggiornati ${list.length} veicoli da Elenco_veicoli.csv!`, 'success');
  };

  const addRifornimento = (rData: Omit<RifornimentoRecord, 'id'>): RifornimentoRecord => {
    const newId = `RIF-${String(rifornimenti.length + 1).padStart(3, '0')}`;
    const newRif: RifornimentoRecord = {
      ...rData,
      id: newId,
    };
    setRifornimenti((prev) => [newRif, ...prev]);

    // Update vehicle's last fueling data & cronologia
    setVeicoli((prev) =>
      prev.map((v) => {
        if (
          v.id === newRif.idVeicolo ||
          v.targa.replace(/\s+/g, '').toUpperCase() === newRif.targa.replace(/\s+/g, '').toUpperCase()
        ) {
          const currentCron = v.storicoRifornimenti || [];
          const updatedCron = [newRif, ...currentCron];
          const totaleL = updatedCron.reduce((acc, r) => acc + r.quantitaLitri, 0);
          return {
            ...v,
            kmAttuali: Math.max(v.kmAttuali, newRif.kmVeicolo),
            kmUltimoRifornimento: newRif.kmVeicolo,
            dataUltimoRifornimento: newRif.dataOra,
            storicoRifornimenti: updatedCron,
            totaleLitriErogati: parseFloat(totaleL.toFixed(1)),
          };
        }
        return v;
      })
    );

    showToast(`Rifornimento ${newRif.quantitaLitri}L registrato per ${newRif.targa}!`, 'success');
    return newRif;
  };

  const addDeposito = (depData: Omit<DepositoRecord, 'id'>): DepositoRecord => {
    const newId = `dep-${Date.now()}`;
    const newDep: DepositoRecord = {
      ...depData,
      id: newId,
    };
    setDepositi((prev) => [newDep, ...prev]);
    showToast('Deposito carburante/materiale registrato con successo!', 'success');
    return newDep;
  };

  const addDocumento = (doc: Omit<DocumentoTecnico, 'id'>) => {
    const newDoc: DocumentoTecnico = {
      ...doc,
      id: generateUniqueId('doc'),
    };
    setDocumenti((prev) => [newDoc, ...prev]);
    showToast(`Documento ${newDoc.titolo} archiviato!`);
    return newDoc;
  };

  const addSegnalazione = (seg: Omit<SegnalazioneCliente, 'id'>) => {
    const newSeg: SegnalazioneCliente = {
      ...seg,
      id: generateUniqueId('seg'),
    };
    setSegnalazioni((prev) => [newSeg, ...prev]);
    showToast('Segnalazione inviata con successo!', 'success');
    return newSeg;
  };

  const updateSegnalazione = (id: string, updates: Partial<SegnalazioneCliente>) => {
    setSegnalazioni((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    showToast('Segnalazione aggiornata.');
  };

  // ------------------------------------------
  // ORDINI INTERNI HANDLERS
  // ------------------------------------------
  const addOrdineInterno = (ordineData: Omit<OrdineInterno, 'id' | 'numero' | 'storicoStati' | 'creatoDa'>): OrdineInterno => {
    const timestamp = Date.now();
    const anno = new Date().getFullYear();
    const progressive = String(ordiniInterni.length + 80).padStart(3, '0');
    const prefix = ordineData.tipo === 'fornitore' ? 'ORD-FORN' : 'ORD-CLI';
    const numero = `${prefix}-${anno}-${progressive}`;

    // Calcolo importo se non specificato
    const importoCalcolato =
      ordineData.importoTotale > 0
        ? ordineData.importoTotale
        : ordineData.righe.reduce((sum, r) => sum + (r.subtotale || (r.prezzoUnitario ? r.prezzoUnitario * r.quantitaTotale : 0)), 0);

    const nowFormatted = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newOrdine: OrdineInterno = {
      ...ordineData,
      id: `ord-${timestamp}`,
      numero,
      importoTotale: importoCalcolato,
      valuta: 'EUR',
      creatoDa: {
        id: currentUser.id,
        name: currentUser.name,
      },
      storicoStati: [
        {
          stato: ordineData.stato || 'bozza',
          dataOra: nowFormatted,
          utenteId: currentUser.id,
          utenteNome: currentUser.name,
          note: `Creazione ordine ${numero} (${ordineData.tipo === 'fornitore' ? 'Approvvigionamento' : 'Fornitura'})`,
        },
      ],
      commenti: [],
    };

    setOrdiniInterni((prev) => [newOrdine, ...prev]);
    showToast(`Nuovo ordine ${numero} creato con successo!`, 'success');
    return newOrdine;
  };

  const updateOrdineInterno = (id: string, updates: Partial<OrdineInterno>) => {
    setOrdiniInterni((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const merged = { ...o, ...updates };
        // Ricalcola totale se righe sono state modificate
        if (updates.righe) {
          merged.importoTotale = updates.righe.reduce(
            (sum, r) => sum + (r.subtotale || (r.prezzoUnitario ? r.prezzoUnitario * r.quantitaTotale : 0)),
            0
          );
        }
        return merged;
      })
    );
    showToast('Ordine aggiornato regolarmente.', 'success');
  };

  const deleteOrdineInterno = (id: string) => {
    const target = ordiniInterni.find((o) => o.id === id);
    setOrdiniInterni((prev) => prev.filter((o) => o.id !== id));
    showToast(`Ordine ${target?.numero || id} eliminato.`, 'info');
  };

  const transizioneStatoOrdine = (
    id: string,
    nuovoStato: StatoOrdine,
    note?: string,
    motivoAnnullamento?: string
  ) => {
    const nowFormatted = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let targetNumero = '';
    let targetDest = '';
    let targetTipo: 'fornitore' | 'cliente' = 'fornitore';

    setOrdiniInterni((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        targetNumero = o.numero;
        targetDest = o.destinatarioRagioneSociale;
        targetTipo = o.tipo;

        const nuovaTransizione: TransizioneStatoOrdine = {
          stato: nuovoStato,
          dataOra: nowFormatted,
          utenteId: currentUser.id,
          utenteNome: currentUser.name,
          note: note || `Stato aggiornato a ${nuovoStato.toUpperCase().replace('_', ' ')}`,
          motivoAnnullamento,
        };

        return {
          ...o,
          stato: nuovoStato,
          dataConsegnaEffettiva: nuovoStato === 'consegnato' ? nowFormatted.split(' ')[0] : o.dataConsegnaEffettiva,
          storicoStati: [...o.storicoStati, nuovaTransizione],
        };
      })
    );

    // Notifica automatica per cambio stato al destinatario interno/operativo
    const labelsMap: Record<StatoOrdine, string> = {
      bozza: 'Bozza',
      inviato: 'Inviato',
      confermato: 'Confermato',
      in_transito: 'In Transito',
      consegnato: 'Consegnato',
      chiuso: 'Chiuso',
      annullato: 'Annullato',
    };

    const statoLabel = labelsMap[nuovoStato] || nuovoStato;
    if (nuovoStato === 'annullato') {
      showToast(`Ordine ${targetNumero} ANNULLATO: "${motivoAnnullamento || 'Nessun motivo'}"`, 'warning');
    } else {
      showToast(
        `Ordine ${targetNumero} (${targetTipo === 'fornitore' ? 'Fornitore' : 'Cliente'}: ${targetDest}) -> Passato a stato ${statoLabel}. Notifica interna registrata.`,
        nuovoStato === 'consegnato' || nuovoStato === 'confermato' ? 'success' : 'info'
      );
    }
  };

  const duplicaOrdineInterno = (id: string): OrdineInterno => {
    const sorgente = ordiniInterni.find((o) => o.id === id);
    if (!sorgente) {
      throw new Error(`Ordine ${id} non trovato per la duplicazione.`);
    }

    const timestamp = Date.now();
    const anno = new Date().getFullYear();
    const progressive = String(ordiniInterni.length + 81).padStart(3, '0');
    const prefix = sorgente.tipo === 'fornitore' ? 'ORD-FORN' : 'ORD-CLI';
    const numero = `${prefix}-${anno}-${progressive}`;
    const nowFormatted = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const today = new Date().toISOString().split('T')[0];

    // Clona righe con nuovi ID
    const righeClonate = sorgente.righe.map((r, idx) => ({
      ...r,
      id: `r-${timestamp}-${idx + 1}`,
      ripartizioniCantieri: r.ripartizioniCantieri ? [...r.ripartizioniCantieri] : undefined,
    }));

    const duplicato: OrdineInterno = {
      ...sorgente,
      id: `ord-${timestamp}`,
      numero,
      stato: 'bozza',
      dataOrdine: today,
      dataConsegnaPrevista: today,
      dataConsegnaEffettiva: undefined,
      righe: righeClonate,
      allegati: [],
      noteGenerali: `[DUPLICATO DA ${sorgente.numero}] ${sorgente.noteGenerali || ''}`,
      creatoDa: {
        id: currentUser.id,
        name: currentUser.name,
      },
      storicoStati: [
        {
          stato: 'bozza',
          dataOra: nowFormatted,
          utenteId: currentUser.id,
          utenteNome: currentUser.name,
          note: `Ordine duplicato a partire da ${sorgente.numero}`,
        },
      ],
      commenti: [],
    };

    setOrdiniInterni((prev) => [duplicato, ...prev]);
    showToast(`Ordine ${sorgente.numero} duplicato come nuova bozza ${numero}!`, 'success');
    return duplicato;
  };

  const addCommentoOrdine = (ordineId: string, testo: string) => {
    if (!testo.trim()) return;
    const nowFormatted = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const nuovoCommento = {
      id: `c-${Date.now()}`,
      dataOra: nowFormatted,
      utenteId: currentUser.id,
      utenteNome: currentUser.name,
      ruolo: currentUser.role,
      testo: testo.trim(),
    };

    setOrdiniInterni((prev) =>
      prev.map((o) => {
        if (o.id !== ordineId) return o;
        return {
          ...o,
          commenti: [...(o.commenti || []), nuovoCommento],
        };
      })
    );
    showToast('Commento aggiunto allo storico dell’ordine.');
  };

  const openQRModal = (data: QRModalData) => setQrModalData(data);
  const closeQRModal = () => setQrModalData(null);

  const openScanner = () => setIsScannerOpen(true);
  const closeScanner = () => setIsScannerOpen(false);

  const registerScanEvent = (
    eventData: Omit<ScanEventRecord, 'scanId' | 'timestamp'> & { timestamp?: string }
  ): ScanEventRecord => {
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = eventData.timestamp || new Date().toISOString();
    const newRecord: ScanEventRecord = {
      ...eventData,
      scanId,
      timestamp,
    };
    setGpsScans((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const deleteScanRecord = (scanId: string) => {
    setGpsScans((prev) => prev.filter((s) => s.scanId !== scanId));
    showToast('Record di scansione GPS eliminato.', 'info');
  };

  const clearScanRecords = () => {
    setGpsScans([]);
    showToast('Storico scansioni azzerato.', 'warning');
  };

  const handleScannedCode = async (
    code: string,
    options?: { currentStatus?: string; notes?: string; forcedLocation?: GeoLocationPoint }
  ): Promise<ScanEventRecord> => {
    setIsScannerOpen(false);

    // 1. Fetch real GPS position or use forced location if provided
    let loc: GeoLocationPoint | null = options?.forcedLocation || null;
    let locError: string | null = null;

    if (!loc) {
      const geoResult = await getBrowserGpsPosition(6000);
      if (geoResult.location) {
        loc = geoResult.location;
      } else {
        locError = geoResult.error || 'Geolocalizzazione non concessa o non disponibile.';
      }
    }

    // 2. Identify entity type and details from QR code
    let entityId = `ID-${Date.now()}`;
    let entityType: ScanEntityType = 'materiale';
    let entityName = `Oggetto (${code})`;
    let entityCode = code;
    let defaultStatus = 'Rilevato';
    let defaultNotes = options?.notes || `Scansione QR code ${code}`;
    let cantiereRefId: string | undefined;
    let cantiereRefNome: string | undefined;
    let targetTab: NavigationTab | null = null;

    if (code.startsWith('VM-PACKAGE:') || code.startsWith('PK-')) {
      const cleanPkgId = code.replace('VM-PACKAGE:', '').trim().toUpperCase();
      const pkg = pacchiZonaVerde.find(
        (p) => p.id.toUpperCase() === cleanPkgId || p.qrCode === code
      );
      if (pkg) {
        entityId = pkg.id;
        entityType = 'materiale';
        entityName = `Pacco ${pkg.id} - ${pkg.cantiereTitolo}`;
        entityCode = pkg.id;
        defaultStatus =
          pkg.statoTransito === 'PRONTO_ZONA_VERDE' ? 'Pronto in Zona Verde' : 'Caricato su mezzo';
        cantiereRefId = pkg.cantiereId;
        cantiereRefNome = pkg.cantiereTitolo;
        // Apre automaticamente la modale di riepilogo e conferma carico
        setActivePaccoCaricoModal(pkg);
      }
    } else if (code.startsWith('QR-CNT') || code.startsWith('CNT-')) {
      const c = cantieri.find((x) => x.qrCode === code || code.includes(x.codice) || x.id === code);
      if (c) {
        entityId = c.id;
        entityType = 'cantiere';
        entityName = c.titolo;
        entityCode = c.codice;
        defaultStatus = 'In cantiere';
        cantiereRefId = c.id;
        cantiereRefNome = c.titolo;
        targetTab = 'cantieri';
        setSelectedCantiereId(c.id);
      }
    } else if (
      code.startsWith('QR-VEC') ||
      code.startsWith('VEC-') ||
      veicoli.some((x) => x.qrCode === code || code.includes(x.targa.replace(/\s+/g, '')))
    ) {
      const v = veicoli.find(
        (x) => x.qrCode === code || code.includes(x.targa.replace(/\s+/g, '')) || x.id === code
      );
      if (v) {
        entityId = v.id;
        entityType = 'mezzo';
        entityName = `${v.modello} (${v.targa})`;
        entityCode = v.targa;
        defaultStatus = 'Preso in carico';
        targetTab = 'veicoli';
      }
    } else if (code.startsWith('QR-ATT') || code.startsWith('ATT-')) {
      const a = attrezzature.find((x) => x.qrCode === code || code.includes(x.codiceUnivoco) || x.id === code);
      if (a) {
        entityId = a.id;
        entityType = 'attrezzatura';
        entityName = a.nome;
        entityCode = a.codiceUnivoco;
        defaultStatus = 'In uso';
        targetTab = 'attrezzature';
      }
    } else if (code.startsWith('QR-MAT') || code.startsWith('MAT-') || code.startsWith('CAV-')) {
      const m = magazzino.find((x) => x.qrCode === code || code.includes(x.codiceSku) || x.id === code);
      if (m) {
        entityId = m.id;
        entityType = 'materiale';
        entityName = m.nome;
        entityCode = m.codiceSku;
        defaultStatus = 'Rilasciato';
        targetTab = 'magazzino';
      }
    } else if (code.startsWith('OP-') || code.startsWith('DIP-')) {
      const dip = dipendenti.find((x) => x.id === code || (x.matricola && code.includes(x.matricola)));
      if (dip) {
        entityId = dip.id;
        entityType = 'operatore';
        entityName = `${dip.nome} ${dip.cognome}`;
        entityCode = dip.matricola || dip.id;
        defaultStatus = 'Inizio turno';
        targetTab = 'dipendenti';
      }
    }

    const currentStatus = options?.currentStatus || defaultStatus;
    const notes = options?.notes || defaultNotes;

    // 3. Register Record adhering to specification
    const scanRecord = registerScanEvent({
      entityId,
      entityType,
      entityName,
      entityCode,
      scannedBy: currentUser.name,
      operatorId: currentUser.id,
      location: loc,
      locationError: locError,
      currentStatus,
      notes,
      cantiereRiferimentoId: cantiereRefId,
      cantiereRiferimentoNome: cantiereRefNome,
    });

    // 4. User Notification Toast with GPS info or graceful fallback notice
    if (loc) {
      showToast(
        `Scansione registrata con GPS: ${entityName} [${currentStatus}] (${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E ±${loc.accuracy}m)`,
        'success'
      );
    } else {
      showToast(
        `Scansione salvata: ${entityName} [${currentStatus}]. Avviso: ${locError || 'GPS assente (fallback non bloccante)'}`,
        'warning'
      );
    }

    if (targetTab) {
      setActiveTab(targetTab);
    }

    return scanRecord;
  };

  // --- GESTIONE PRESENZE & TIMESHEET CANTIERE ---
  const addPresenza = (nuova: Omit<PresenzaCantiere, 'id'>) => {
    // Controllo di Idoneità Medica D.Lgs 81/08
    if (nuova.dipendenteId) {
      const dip = dipendenti.find((d) => d.id === nuova.dipendenteId);
      if (dip && dip.visitaMedicaScadenza) {
        const scadenza = new Date(dip.visitaMedicaScadenza);
        const oggi = new Date('2026-10-08');
        if (scadenza < oggi && !nuova.forzaInserimento) {
          showToast(
            `🚨 BLOCCO SICUREZZA D.LGS 81/08: L'operatore ${dip.nome} ${dip.cognome} ha l'idoneità medica scaduta il ${dip.visitaMedicaScadenza}. Timbratura non consentita a norma di legge!`,
            'error'
          );
          return;
        }
      }
    }

    const id = `pres-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: PresenzaCantiere = { ...nuova, id };
    setPresenze((prev) => [record, ...prev]);
    apiService.savePresenza(record).catch(() => {});
    showToast(`Presenza registrata per ${record.dipendenteNome}`, 'success');
  };

  const updatePresenza = (id: string, updates: Partial<PresenzaCantiere>) => {
    setPresenze((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };
        // Ricalcola costo totale se ore o costo sono cambiati
        if (updates.oreOrdinarie !== undefined || updates.oreStraordinarie !== undefined || updates.costoOrario !== undefined) {
          const ord = updated.oreOrdinarie || 0;
          const str = updated.oreStraordinarie || 0;
          const cost = updated.costoOrario || p.costoOrario;
          updated.costoTotaleGiornaliero = ord * cost + str * cost * 1.3;
        }
        return updated;
      })
    );
    showToast('Presenza aggiornata con successo.', 'success');
  };

  const deletePresenza = (id: string) => {
    setPresenze((prev) => prev.filter((p) => p.id !== id));
    showToast('Registrazione presenza eliminata.', 'info');
  };

  const approvaPresenza = (id: string, approvatoreNome: string) => {
    setPresenze((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stato: 'approvata', approvatoDa: approvatoreNome } : p))
    );
    showToast('Presenza approvata e convalidata per il consuntivo.', 'success');
  };

  const timbraturaRapidaSquadra = (
    cantiereIdParam: string,
    squadraNome: string,
    dipendentiIds: string[],
    dataParam?: string
  ) => {
    const dataOggi = dataParam || new Date().toISOString().split('T')[0];
    const cantiereObj = cantieri.find((c) => c.id === cantiereIdParam) || cantieri[0];
    const nuovePresenze: PresenzaCantiere[] = [];
    const bloccatiSicurezza: { nome: string; scadenza: string }[] = [];
    const oggi = new Date('2026-10-08');

    dipendentiIds.forEach((dipId) => {
      const dip = dipendenti.find((d) => d.id === dipId);
      if (!dip) return;

      // Verifica Idoneità Sanitaria D.Lgs 81/08
      let isValido8108 = true;
      if (dip.visitaMedicaScadenza) {
        const scad = new Date(dip.visitaMedicaScadenza);
        if (scad < oggi) {
          isValido8108 = false;
          bloccatiSicurezza.push({
            nome: `${dip.nome} ${dip.cognome}`,
            scadenza: dip.visitaMedicaScadenza,
          });
        }
      }

      // Se non idoneo per visita scaduta, blocca la timbratura automatica
      if (!isValido8108) {
        return;
      }

      const costo = dip.costoOrario || 32;
      const presRecord: PresenzaCantiere = {
        id: generateUniqueId(`pres-${dipId}`),
        data: dataOggi,
        dipendenteId: dip.id,
        dipendenteNome: `${dip.nome} ${dip.cognome}`,
        mansione: dip.ruoloAziendale || dip.reparto,
        squadra: squadraNome,
        ditta: 'interna',
        cantiereId: cantiereObj.id,
        cantiereNome: cantiereObj.titolo,
        oraIngresso: '07:30',
        oraUscita: '16:30',
        oreOrdinarie: 8,
        oreStraordinarie: 0,
        costoOrario: costo,
        costoTotaleGiornaliero: costo * 8,
        buonoPasto: true,
        indennitaTrasferta: 15,
        dpiVerificati: true,
        idoneitaMedicaValida: true,
        tesserinoRiconoscimento: true,
        note: `Timbratura automatica squadra (${squadraNome}) - Conforme 81/08`,
        approvatoDa: currentUser.name,
        stato: 'approvata',
      };
      nuovePresenze.push(presRecord);
      apiService.savePresenza(presRecord).catch(() => {});
    });

    if (nuovePresenze.length > 0) {
      setPresenze((prev) => [...nuovePresenze, ...prev]);
      showToast(
        `Timbratura rapida effettuata per ${nuovePresenze.length} operatori conformi della squadra "${squadraNome}"!`,
        'success'
      );
    }

    if (bloccatiSicurezza.length > 0) {
      const bloccatiStr = bloccatiSicurezza.map((b) => `${b.nome} (scad. ${b.scadenza})`).join(', ');
      showToast(
        `🚨 BLOCCO SICUREZZA D.LGS 81/08: ${bloccatiSicurezza.length} operatore/i bloccato/i per visita medica scaduta: ${bloccatiStr}`,
        'error'
      );
    }
  };

  // --- GESTIONE STATO AVANZAMENTO LAVORI (SAL) ---
  const addSal = (nuovo: Omit<StatoAvanzamentoLavori, 'id'>): StatoAvanzamentoLavori => {
    const id = `sal-${Date.now()}`;
    const created: StatoAvanzamentoLavori = { ...nuovo, id };
    setSals((prev) => [created, ...prev]);
    showToast(`Stato Avanzamento Lavori ${created.codiceSal} salvato con successo!`, 'success');
    return created;
  };

  const updateSal = (id: string, updates: Partial<StatoAvanzamentoLavori>) => {
    setSals((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    showToast('Stato Avanzamento Lavori aggiornato.', 'success');
  };

  const deleteSal = (id: string) => {
    setSals((prev) => prev.filter((s) => s.id !== id));
    showToast('Stato Avanzamento Lavori eliminato.', 'info');
  };

  const approvaSalDL = (id: string, nomeDL: string, note?: string) => {
    setSals((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          stato: 'approvato_dl',
          approvatoDirettoreLavori: {
            nome: nomeDL,
            dataOra: new Date().toISOString().replace('T', ' ').slice(0, 16),
            note,
          },
        };
      })
    );
    showToast(`SAL approvato con successo dal Direttore dei Lavori (${nomeDL})!`, 'success');
  };

  const emettiCertificatoPagamento = (salId: string, cert: CertificatoPagamento) => {
    setSals((prev) =>
      prev.map((s) => {
        if (s.id !== salId) return s;
        return {
          ...s,
          stato: 'certificato_emesso',
          certificatoPagamento: cert,
        };
      })
    );
    showToast(
      `Certificato di Pagamento n. ${cert.numeroCertificato} emesso per € ${cert.totaleLordoLiquidare.toFixed(2)} (IVA incl.)!`,
      'success'
    );
  };

  const liquidaSal = (salId: string, rifFattura?: string) => {
    setSals((prev) =>
      prev.map((s) => {
        if (s.id !== salId) return s;
        return {
          ...s,
          stato: 'liquidato',
          certificatoPagamento: s.certificatoPagamento
            ? {
                ...s.certificatoPagamento,
                stato: 'pagato',
                riferimentoFattura: rifFattura || s.certificatoPagamento.riferimentoFattura,
              }
            : undefined,
        };
      })
    );
    showToast('SAL contrassegnato come liquidato/pagato.', 'success');
  };

  // Centro Notifiche & Scadenziario Visivo a Semaforo (DURC, CEI 64-8, Mezzi, Patentini)
  const addScadenza = (scadenzaData: Omit<ScadenzaItem, 'id'>): ScadenzaItem => {
    const id = `scad-${Date.now()}`;
    const newScadenza: ScadenzaItem = {
      ...scadenzaData,
      id,
    };
    setScadenze((prev) => [newScadenza, ...prev]);

    // Genera notifica automatica se rientra in alert semaforo
    const calc = calcolaSemaforoScadenza(newScadenza.dataScadenza);
    if (calc.stato !== 'regolare') {
      const livelloMap = {
        scaduto: 'rosso' as const,
        urgente_15gg: 'arancione' as const,
        attenzione_30gg: 'giallo' as const,
      };
      const tipoMap = {
        scaduto: 'alert_scaduto' as const,
        urgente_15gg: 'alert_15gg' as const,
        attenzione_30gg: 'alert_30gg' as const,
      };
      const newNotifica: NotificaSistema = {
        id: `notif-${Date.now()}`,
        scadenzaId: id,
        tipo: tipoMap[calc.stato],
        livello: livelloMap[calc.stato],
        titolo: `${calc.stato === 'scaduto' ? 'CRITICO' : calc.stato === 'urgente_15gg' ? 'URGENTE (15gg)' : 'ATTENZIONE (30gg)'}: ${newScadenza.titolo}`,
        messaggio: `${newScadenza.soggetto} - Scadenza fissata al ${newScadenza.dataScadenza} (${calc.giorniRimanenti < 0 ? `scaduto da ${Math.abs(calc.giorniRimanenti)} gg` : `${calc.giorniRimanenti} giorni rimanenti`}).`,
        dataOra: new Date().toISOString().replace('T', ' ').slice(0, 16),
        letta: false,
        categoria: newScadenza.categoria,
        linkTab: 'scadenziario',
        giorniRimanenti: calc.giorniRimanenti,
      };
      setNotifiche((prev) => [newNotifica, ...prev]);
    }

    showToast(`Scadenza "${newScadenza.titolo}" registrata con successo!`, 'success');
    return newScadenza;
  };

  const updateScadenza = (id: string, updates: Partial<ScadenzaItem>) => {
    setScadenze((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    showToast('Scadenza aggiornata con successo.', 'success');
  };

  const deleteScadenza = (id: string) => {
    setScadenze((prev) => prev.filter((s) => s.id !== id));
    setNotifiche((prev) => prev.filter((n) => n.scadenzaId !== id));
    showToast('Scadenza rimossa dallo scadenziario.', 'info');
  };

  const rinnovaScadenza = (
    id: string,
    nuovaData: string,
    note?: string,
    nuovoProtocollo?: string,
    costo?: number
  ) => {
    setScadenze((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const oggi = new Date().toISOString().split('T')[0];
        const storico: StoricoRinnovoScadenza = {
          id: `st-${Date.now()}`,
          dataRinnovo: oggi,
          scadenzaPrecedente: s.dataScadenza,
          nuovaScadenza: nuovaData,
          operatoreNome: currentUser.name,
          nuovoProtocollo: nuovoProtocollo || s.protocolloONumero,
          costo: costo ?? s.costoRinnovoPrevisto,
          note: note || 'Rinnovo registrato con esito positivo',
        };

        return {
          ...s,
          dataScadenza: nuovaData,
          dataUltimoRinnovo: oggi,
          protocolloONumero: nuovoProtocollo || s.protocolloONumero,
          costoRinnovoPrevisto: costo !== undefined ? costo : s.costoRinnovoPrevisto,
          note: note ? `${note} (Precedente: ${s.note || 'Nessuna'})` : s.note,
          storicoRinnovi: [storico, ...(s.storicoRinnovi || [])],
        };
      })
    );

    // Aggiunge notifica di avvenuto rinnovo
    const notifRinnovo: NotificaSistema = {
      id: `notif-${Date.now()}`,
      scadenzaId: id,
      tipo: 'rinnovo_eseguito',
      livello: 'verde',
      titolo: `Rinnovo completato con successo`,
      messaggio: `La scadenza è stata prorogata al ${nuovaData} da ${currentUser.name}. Semaforo aggiornato a REGOLARE.`,
      dataOra: new Date().toISOString().replace('T', ' ').slice(0, 16),
      letta: false,
      categoria: 'generale',
      linkTab: 'scadenziario',
    };
    setNotifiche((prev) => [notifRinnovo, ...prev]);

    showToast(`Scadenza rinnovata regolarmente fino al ${nuovaData}!`, 'success');
  };

  const segnaNotificaLetta = (id: string) => {
    setNotifiche((prev) =>
      prev.map((n) => (n.id === id ? { ...n, letta: true } : n))
    );
  };

  const segnaTutteNotificheLette = () => {
    setNotifiche((prev) => prev.map((n) => ({ ...n, letta: true })));
    showToast('Tutte le notifiche sono state contrassegnate come lette.', 'info');
  };

  const eliminaNotifica = (id: string) => {
    setNotifiche((prev) => prev.filter((n) => n.id !== id));
  };

  const aggiungiNotifica = (notificaData: Omit<NotificaSistema, 'id' | 'dataOra' | 'letta'>) => {
    const nuova: NotificaSistema = {
      ...notificaData,
      id: `notif-${Date.now()}`,
      dataOra: new Date().toISOString().replace('T', ' ').slice(0, 16),
      letta: false,
    };
    setNotifiche((prev) => [nuova, ...prev]);
  };

  // Documenti di Trasporto (DDT) & Logistica Automezzi (D.P.R. 472/96)
  const addDdt = (ddtData: Omit<DocumentoDiTrasporto, 'id' | 'numeroDdt'>): DocumentoDiTrasporto => {
    const year = new Date().getFullYear();
    const count = ddts.length + 1;
    const numeroDdt = `DDT-${year}/${count.toString().padStart(3, '0')}`;
    const id = `ddt-${Date.now()}`;
    const newDdt: DocumentoDiTrasporto = {
      ...ddtData,
      id,
      numeroDdt,
    };
    setDdts((prev) => [newDdt, ...prev]);

    // Se richiesto scarico magazzino, decrementa le giacenze e crea movimento
    if (newDdt.scaricaMagazzino && newDdt.righe.length > 0) {
      newDdt.righe.forEach((riga) => {
        if (riga.articoloId) {
          const item = magazzino.find((m) => m.id === riga.articoloId);
          if (item) {
            updateArticoloMagazzino(riga.articoloId, {
              giacenza: Math.max(0, item.giacenza - riga.quantita),
            });
            addMovimento({
              articoloId: riga.articoloId,
              articoloNome: item.nome,
              tipo: 'scarico_cantiere',
              quantita: riga.quantita,
              cantiereId: newDdt.cantiereId,
              cantiereNome: newDdt.cantiereNome,
              data: newDdt.dataEmissione,
              operatoreNome: currentUser.name,
              documentoRif: numeroDdt,
            });
          }
        }
      });
    }

    showToast(`DDT ${numeroDdt} emesso con successo! Scarico magazzino effettuato.`, 'success');
    return newDdt;
  };

  const updateDdt = (id: string, updates: Partial<DocumentoDiTrasporto>) => {
    setDdts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    showToast('Documento di Trasporto aggiornato.', 'info');
  };

  const deleteDdt = (id: string) => {
    setDdts((prev) => prev.filter((d) => d.id !== id));
    showToast('DDT eliminato dall’archivio.', 'warning');
  };

  const confermaConsegnaDdt = (id: string, nomeRicevente?: string, firmaDestinatario?: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setDdts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        return {
          ...d,
          stato: 'consegnato',
          nomeRiceventeCantiere: nomeRicevente || d.nomeRiceventeCantiere || currentUser.name,
          firmaDestinatario: firmaDestinatario || d.firmaDestinatario,
          dataOraRicezione: nowStr,
        };
      })
    );
    showToast(`Consegna DDT registrata con successo a cantiere!`, 'success');
  };

  const annullaDdt = (id: string, motivo: string) => {
    setDdts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stato: 'annullato' as StatoDDT, noteTrasporto: `${d.noteTrasporto || ''} [Annullato: ${motivo}]` } : d))
    );
    showToast(`DDT contrassegnato come annullato (${motivo}).`, 'warning');
  };

  const scaricaDdtInMagazzino = (ddtId: string) => {
    const ddt = ddts.find((d) => d.id === ddtId);
    if (!ddt) return;
    ddt.righe.forEach((riga) => {
      if (riga.articoloId) {
        const item = magazzino.find((m) => m.id === riga.articoloId);
        if (item) {
          updateArticoloMagazzino(riga.articoloId, {
            giacenza: Math.max(0, item.giacenza - riga.quantita),
          });
          addMovimento({
            articoloId: riga.articoloId,
            articoloNome: item.nome,
            tipo: 'scarico_cantiere',
            quantita: riga.quantita,
            cantiereId: ddt.cantiereId,
            cantiereNome: ddt.cantiereNome,
            data: new Date().toISOString().split('T')[0],
            operatoreNome: currentUser.name,
            documentoRif: ddt.numeroDdt,
          });
        }
      }
    });
    setDdts((prev) =>
      prev.map((d) => (d.id === ddtId ? { ...d, scaricaMagazzino: true } : d))
    );
    showToast(`Giacenze scaricate per il DDT ${ddt.numeroDdt}`, 'success');
  };

  // Modulo Richieste Materiali & Attrezzature Cantiere
  const addRichiestaMateriali = (data: Omit<RichiestaMateriali, 'id' | 'numero' | 'notifica'>): RichiestaMateriali => {
    const year = new Date().getFullYear();
    const count = richiesteMateriali.length + 1;
    const numero = `RMC-${year}-${count.toString().padStart(3, '0')}`;
    const id = `rmc-${Date.now()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const notificaInvio = {
      canale: 'push_e_email' as const,
      destinatarioMagazzino: 'Marco Villa (Resp. Magazzino & Logistica)',
      emailDestinatario: 'magazzino@voltmaster.it',
      inviatoIl: nowStr,
      pushInviata: true,
      emailInviata: true,
    };

    const newRichiesta: RichiestaMateriali = {
      ...data,
      id,
      numero,
      notifica: notificaInvio,
    };

    setRichiesteMateriali((prev) => [newRichiesta, ...prev]);

    // Genera istantaneamente una notifica di sistema nel Centro Notifiche
    aggiungiNotifica({
      tipo: data.priorita === 'bloccante_fermo_cantiere' ? 'alert_scaduto' : 'alert_15gg',
      livello: data.priorita === 'bloccante_fermo_cantiere' ? 'rosso' : data.priorita === 'urgente' ? 'arancione' : 'info',
      titolo: `📦 Nuova Richiesta Materiali ${numero} (${data.priorita === 'bloccante_fermo_cantiere' ? 'FERMO CANTIERE' : data.priorita.toUpperCase()})`,
      messaggio: `${data.richiedenteNome} ha inviato una lista di ${data.righe.length} voci per "${data.cantiereTitolo}". Notifica push & email inviate al magazzino.`,
      categoria: 'generale',
      linkTab: 'richieste_materiali',
    });

    showToast(
      `Richiesta ${numero} inviata! Notifica push e email recapitate al magazziniere.`,
      'success'
    );

    return newRichiesta;
  };

  const updateRichiestaMateriali = (id: string, updates: Partial<RichiestaMateriali>) => {
    setRichiesteMateriali((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    showToast('Richiesta materiali aggiornata.', 'info');
  };

  const deleteRichiestaMateriali = (id: string) => {
    setRichiesteMateriali((prev) => prev.filter((r) => r.id !== id));
    showToast('Richiesta materiali eliminata.', 'warning');
  };

  const aggiornaStatoRichiesta = (id: string, nuovoStato: StatoRichiestaMateriali, operatore?: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setRichiesteMateriali((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          stato: nuovoStato,
          preparataDa: operatore || currentUser.name,
          dataPreparazione: nowStr,
        };
      })
    );
    showToast(`Stato richiesta aggiornato: ${nuovoStato.replace('_', ' ').toUpperCase()}`, 'success');
  };

  const generaDdtDaRichiesta = (
    richiestaId: string,
    opzioni?: { veicoloId?: string; autistaId?: string; noteTrasporto?: string }
  ): DocumentoDiTrasporto | null => {
    const richiesta = richiesteMateriali.find((r) => r.id === richiestaId);
    if (!richiesta) {
      showToast('Richiesta materiali non trovata', 'error');
      return null;
    }

    const autista = dipendenti.find((d) => d.id === opzioni?.autistaId) || dipendenti[0];
    const veicolo = veicoli.find((v) => v.id === opzioni?.veicoloId) || veicoli[0];
    const cantiere = cantieri.find((c) => c.id === richiesta.cantiereId);

    const righeDdt: RigaDDT[] = richiesta.righe.map((r, idx) => ({
      id: `riga-ddt-gen-${Date.now()}-${idx}`,
      articoloId: r.articoloId,
      sku: r.codice,
      descrizione: r.descrizione,
      quantita: r.quantitaRichiesta,
      unitaMisura: r.unitaMisura,
      note: r.note,
    }));

    const newDdt = addDdt({
      dataEmissione: new Date().toISOString().split('T')[0],
      oraPartenza: new Date().toTimeString().slice(0, 5),
      mittenteRagioneSociale: 'VoltMaster Impianti Elettrici S.r.l.',
      mittenteIndirizzo: 'Via dell\'Elettronica 14, 20100 Milano (MI)',
      mittentePiva: 'IT09876543210',
      clienteNome: richiesta.clienteNome,
      clientePivaCodFisc: 'IT01234567890',
      cantiereId: richiesta.cantiereId,
      cantiereNome: richiesta.cantiereTitolo,
      cantiereIndirizzo: richiesta.indirizzoConsegna,
      cantiereCitta: cantiere?.citta || 'Milano (MI)',
      causaleTrasporto: 'installazione_cantiere',
      porto: 'franco',
      aspettoBeni: 'cartoni_imballati',
      numeroColli: Math.max(1, richiesta.righe.length),
      pesoTotaleKg: 45,
      tipoVettore: 'mezzo_proprio_mittente',
      autistaNome: autista ? `${autista.nome} ${autista.cognome}` : currentUser.name,
      veicoloId: veicolo?.id,
      veicoloTarga: veicolo?.targa || 'AB123CD',
      veicoloModello: veicolo?.modello || 'Furgone Allestito',
      stato: 'in_viaggio',
      scaricaMagazzino: true,
      annotazioni: `Generato da Richiesta Materiali ${richiesta.numero}. Richiedente: ${richiesta.richiedenteNome} (${richiesta.richiedenteTelefono}). ${opzioni?.noteTrasporto || ''}`,
      righe: righeDdt,
      creatoDa: {
        id: currentUser.id,
        name: currentUser.name,
      },
    });

    setRichiesteMateriali((prev) =>
      prev.map((r) =>
        r.id === richiestaId
          ? {
              ...r,
              stato: 'ddt_emesso',
              ddtCollegatoId: newDdt.id,
              ddtCollegatoNumero: newDdt.numeroDdt,
              preparataDa: currentUser.name,
              dataPreparazione: new Date().toISOString().replace('T', ' ').slice(0, 16),
            }
          : r
      )
    );

    showToast(
      `DDT ${newDdt.numeroDdt} emesso per la richiesta ${richiesta.numero}! I materiali sono pianificati per l'invio.`,
      'success'
    );

    return newDdt;
  };

  // --- GESTIONE LOGISTICA ZONA VERDE & SEGNACOLLI A5 ---
  const addPaccoZonaVerde = (
    paccoData: Omit<PaccoZonaVerde, 'id' | 'qrCode'> & { id?: string; qrCode?: string }
  ): PaccoZonaVerde => {
    const year = new Date().getFullYear();
    const count = pacchiZonaVerde.length + 42;
    const id = paccoData.id || `PK-${year}-${count.toString().padStart(3, '0')}`;
    const qrCode = paccoData.qrCode || `VM-PACKAGE:${id}`;

    const newPacco: PaccoZonaVerde = {
      ...paccoData,
      id,
      qrCode,
    };

    setPacchiZonaVerde((prev) => [newPacco, ...prev]);
    showToast(`Pacco ${id} preparato e posizionato in Zona Verde!`, 'success');
    return newPacco;
  };

  const updatePaccoZonaVerde = (id: string, updates: Partial<PaccoZonaVerde>) => {
    setPacchiZonaVerde((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Spedizione Zona Verde aggiornata.', 'info');
  };

  const deletePaccoZonaVerde = (id: string) => {
    setPacchiZonaVerde((prev) => prev.filter((p) => p.id !== id));
    showToast('Pacco rimosso dalla Zona Verde.', 'warning');
  };

  const confermaCaricoPacco = (
    paccoIdOrQr: string,
    operatore?: { id: string; nome: string },
    furgone?: string
  ) => {
    const cleanId = paccoIdOrQr.replace('VM-PACKAGE:', '').trim().toUpperCase();
    const target = pacchiZonaVerde.find(
      (p) => p.id.toUpperCase() === cleanId || p.qrCode === paccoIdOrQr
    );

    if (!target) {
      return { success: false, message: 'Pacco non trovato nel registro di magazzino.' };
    }

    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    const opNome = operatore?.nome || currentUser.name;
    const opId = operatore?.id || currentUser.id;

    const updatedPacco: PaccoZonaVerde = {
      ...target,
      statoTransito: 'CARICATO_SU_MEZZO',
      timestampCarico: formattedTimestamp,
      operatoreCaricoId: opId,
      operatoreCaricoNome: opNome,
      furgoneAssegnato: furgone || target.furgoneAssegnato,
    };

    setPacchiZonaVerde((prev) =>
      prev.map((p) => (p.id === target.id ? updatedPacco : p))
    );

    registerScanEvent({
      entityId: target.id,
      entityType: 'materiale',
      entityName: `Pacco ${target.id} (${target.cantiereTitolo})`,
      entityCode: target.id,
      scannedBy: opNome,
      operatorId: opId,
      location: null,
      currentStatus: 'Caricato su mezzo',
      notes: `Caricato sul veicolo ${furgone || target.furgoneAssegnato || 'in transito'}`,
      cantiereRiferimentoId: target.cantiereId,
      cantiereRiferimentoNome: target.cantiereTitolo,
    });

    return { success: true, pacco: updatedPacco, message: 'Carico confermato con successo.' };
  };

  const resetToMockData = () => {
    setClienti(INITIAL_CLIENTI);
    setCantieri(CANTIERI);
    setPreventivi(INITIAL_PREVENTIVI);
    setLavorazioni(INITIAL_LAVORAZIONI);
    setRols(INITIAL_ROLS);
    setDipendenti(DIPENDENTI);
    setMagazzino(INITIAL_MAGAZZINO);
    setMovimenti(INITIAL_MOVIMENTI);
    setAttrezzature(ATTREZZATURE);
    setVeicoli(VEICOLI);
    setDepositi(DEPOSITI);
    setRifornimenti(RIFORNIMENTI);
    setDocumenti(INITIAL_DOCUMENTI);
    setSegnalazioni(INITIAL_SEGNALAZIONI);
    setOrdiniInterni(INITIAL_ORDINI_INTERNI);
    setFornitori(INITIAL_FORNITORI);
    setPresenze(INITIAL_PRESENZE);
    setSals(INITIAL_SALS);
    setScadenze(INITIAL_SCADENZE);
    setNotifiche(INITIAL_NOTIFICHE);
    setDdts(INITIAL_DDTS);
    setRichiesteMateriali(INITIAL_RICHIESTE_MATERIALI);
    setPacchiZonaVerde(MOCK_PACCHI_ZONA_VERDE);
    setGpsScans(INITIAL_GPS_SCANS);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.clear();
    showToast('Tutti i dati sono stati ripristinati alle condizioni di fabbrica.', 'info');
  };

  const cantiereContextValue: CantiereContextType = useMemo(
    () => ({
      cantieri,
      selectedCantiereId,
      setSelectedCantiereId,
      rols,
      lavorazioni,
      dipendenti,
      presenze,
      documenti,
      segnalazioni,
      scadenze,
      addCantiere,
      updateCantiere,
      addROL,
      updateROL,
      approveROL,
      rejectROL,
      addLavorazione,
      updateLavorazione,
      addDocumento,
      addSegnalazione,
      updateSegnalazione,
      addPresenza,
      updatePresenza,
      deletePresenza,
      timbraturaRapidaSquadra,
      approvaPresenza,
      addScadenza,
      updateScadenza,
      deleteScadenza,
      rinnovaScadenza,
    }),
    [
      cantieri,
      selectedCantiereId,
      rols,
      lavorazioni,
      dipendenti,
      presenze,
      documenti,
      segnalazioni,
      scadenze,
    ]
  );

  const logisticaContextValue: LogisticaContextType = useMemo(
    () => ({
      magazzino,
      movimenti,
      addArticoloMagazzino,
      addArticoliMagazzinoBatch,
      updateArticoloMagazzino,
      addMovimento,
      listinoFornitore,
      updateListinoFornitore,
      attrezzature,
      veicoli,
      depositi,
      rifornimenti,
      addAttrezzatura,
      updateAttrezzatura,
      addVeicolo,
      updateVeicolo,
      setVeicoliList,
      addRifornimento,
      addDeposito,
      pacchiZonaVerde,
      addPaccoZonaVerde,
      updatePaccoZonaVerde,
      richiesteMateriali,
      addRichiestaMateriali,
      updateRichiestaMateriali,
    }),
    [
      magazzino,
      movimenti,
      listinoFornitore,
      attrezzature,
      veicoli,
      depositi,
      rifornimenti,
      pacchiZonaVerde,
      richiesteMateriali,
    ]
  );

  const contabilitaContextValue: ContabilitaContextType = useMemo(
    () => ({
      clienti,
      preventivi,
      addCliente,
      updateCliente,
      addPreventivo,
      updatePreventivo,
      convertPreventivoToCantiere,
      sals,
      addSal,
      updateSal,
      deleteSal,
      approvaSalDL,
      emettiCertificatoPagamento,
      liquidaSal,
      ddts,
      addDdt,
      updateDdt,
      annullaDdt,
      scaricaDdtInMagazzino,
      ordiniInterni,
      fornitori,
      addOrdineInterno,
      updateOrdineInterno,
      deleteOrdineInterno,
      transizioneStatoOrdine,
      duplicaOrdineInterno,
      addCommentoOrdine,
    }),
    [
      clienti,
      preventivi,
      sals,
      ddts,
      ordiniInterni,
      fornitori,
    ]
  );

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentRole,
        interfaceMode,
        setInterfaceMode,
        activeTab,
        setActiveTab,
        clienti,
        cantieri,
        preventivi,
        lavorazioni,
        rols,
        dipendenti,
        magazzino,
        movimenti,
        attrezzature,
        veicoli,
        depositi,
        rifornimenti,
        addDeposito,
        documenti,
        segnalazioni,
        ordiniInterni,
        fornitori,
        listinoFornitore,
        updateListinoFornitore,
        presenze,
        sals,
        scadenze,
        notifiche,
        addCantiere,
        updateCantiere,
        addCliente,
        updateCliente,
        addPreventivo,
        updatePreventivo,
        convertPreventivoToCantiere,
        addLavorazione,
        updateLavorazione,
        addROL,
        updateROL,
        approveROL,
        rejectROL,
        addArticoloMagazzino,
        addArticoliMagazzinoBatch,
        updateArticoloMagazzino,
        addMovimento,
        addAttrezzatura,
        updateAttrezzatura,
        addVeicolo,
        updateVeicolo,
        setVeicoliList,
        addRifornimento,
        addDocumento,
        addSegnalazione,
        updateSegnalazione,
        addOrdineInterno,
        updateOrdineInterno,
        deleteOrdineInterno,
        transizioneStatoOrdine,
        duplicaOrdineInterno,
        addCommentoOrdine,
        addPresenza,
        updatePresenza,
        deletePresenza,
        timbraturaRapidaSquadra,
        approvaPresenza,
        addSal,
        updateSal,
        deleteSal,
        approvaSalDL,
        emettiCertificatoPagamento,
        liquidaSal,
        addScadenza,
        updateScadenza,
        deleteScadenza,
        rinnovaScadenza,
        segnaNotificaLetta,
        segnaTutteNotificheLette,
        eliminaNotifica,
        aggiungiNotifica,
        isNotificheDropdownOpen,
        setIsNotificheDropdownOpen,
        ddts,
        addDdt,
        updateDdt,
        deleteDdt,
        confermaConsegnaDdt,
        annullaDdt,
        scaricaDdtInMagazzino,
        pacchiZonaVerde,
        addPaccoZonaVerde,
        updatePaccoZonaVerde,
        deletePaccoZonaVerde,
        confermaCaricoPacco,
        activePaccoCaricoModal,
        setActivePaccoCaricoModal,
        selectedPaccoStampa,
        setSelectedPaccoStampa,
        isNuovoPaccoModalOpen,
        setIsNuovoPaccoModalOpen,
        richiesteMateriali,
        addRichiestaMateriali,
        updateRichiestaMateriali,
        deleteRichiestaMateriali,
        aggiornaStatoRichiesta,
        generaDdtDaRichiesta,
        gpsScans,
        registerScanEvent,
        deleteScanRecord,
        clearScanRecords,
        resetToMockData,
        qrModalData,
        openQRModal,
        closeQRModal,
        isScannerOpen,
        openScanner,
        closeScanner,
        handleScannedCode,
        selectedCantiereId,
        setSelectedCantiereId,
        offlineCacheInfo,
        refreshOfflineCache,
        isOfflineModalOpen,
        offlineModalTab,
        openOfflineModal,
        closeOfflineModal,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      <CantiereContext.Provider value={cantiereContextValue}>
        <LogisticaContext.Provider value={logisticaContextValue}>
          <ContabilitaContext.Provider value={contabilitaContextValue}>
            {children}
          </ContabilitaContext.Provider>
        </LogisticaContext.Provider>
      </CantiereContext.Provider>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
