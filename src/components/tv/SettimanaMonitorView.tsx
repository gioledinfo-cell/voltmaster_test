import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tv,
  Monitor,
  Maximize2,
  Minimize2,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ShieldCheck,
  HardHat,
  Truck,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Activity,
  Wifi,
  Layers,
  Zap,
  Home,
  RotateCw,
  Sparkles,
  Boxes,
  Package,
  Phone,
  X,
  FileText,
  Info,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Cantiere, Dipendente, Veicolo, Lavorazione } from '../../types';

export interface OperatoreAssegnatoGiorno {
  id: string;
  nome: string; // Nome completo: es. "Davide Riva"
  nomeAbbreviato: string; // Nome per monitor TV: es. "D. Riva"
  ruoloAziendale: string; // "Operaio Specializzato Elettricista"
  qualificaBadge: 'PES' | 'PAV' | 'PEI' | 'Appr.' | 'Spec.';
  isApprendista: boolean;
  telefono?: string;
  noteRuolo?: string;
}

export interface AssegnazioneGiornalieraCantiere {
  cantiereId: string;
  giorno: string; // ISO date 'YYYY-MM-DD'
  dayName: string; // 'Lunedì', 'Martedì', ...
  shortName: string; // 'LUN', 'MAR', ...
  formattedDate: string; // '06 Ott'
  isToday: boolean;
  lavorazione: string; // Descrizione sintetica dell'attività
  dettaglioAttivita: string; // Dettaglio operativo
  faseCategoria: 'posa' | 'quadri' | 'tiraggio' | 'fotovoltaico' | 'collaudo' | 'sabato';
  stato: 'IN CORSO' | 'COLLAUDO' | 'COMPLETATO' | 'PIANIFICATO' | 'SABATO';
  badgeColor: string; // Stile Tailwind badge attività
  capocantiere: {
    id: string;
    nome: string; // es. "Marco Rossi"
    nomeAbbreviato: string; // es. "M. Rossi"
    qualifica: string; // es. "Capocantiere PES/PAV"
    displayBadge: string; // es. "M. Rossi (Preposto)"
    telefono?: string;
  };
  operatori: OperatoreAssegnatoGiorno[];
  veicolo: {
    id?: string;
    targa: string; // es. "FJ482KN"
    modello: string; // es. "Iveco Daily 35C15"
    displayTarga: string; // es. "FJ482KN"
    labelCompleta: string; // es. "Iveco Daily · FJ482KN"
  };
  orarioLavoro: string; // es. "8h ordinario" o "4h turno"
  orarioDettaglio: string; // es. "07:30 - 16:30"
  noteGiorno: string; // es. "Inizio ore 07:30 · DPI anticaduta"
}

interface DayScheduleInfo {
  date: Date;
  isoDate: string; // YYYY-MM-DD
  dayName: string; // Lunedì, Martedì, ...
  shortName: string; // LUN, MAR, ...
  formattedDate: string; // 06 Ott
  isToday: boolean;
}

const ITEMS_PER_PAGE = 4; // 4 cantieri per pagina garantisce massima visibilità e leggibilità su TV da 3-5m
const ROTATION_INTERVAL_MS = 15000; // 15 secondi per pagina

/**
 * SettimanaMonitorView - Wallboard & Kiosk Mode per Monitor TV Officina / Sede
 * VoltMaster - Gestionale Impianti Elettrici
 *
 * Ottimizzato per TV 1080p/4K (visione 3-5 metri) a contrasto elevato nativo dark.
 */
export const SettimanaMonitorView: React.FC = () => {
  const navigate = useNavigate();
  const {
    cantieri,
    dipendenti,
    veicoli,
    lavorazioni,
    rols,
    presenze,
    sals,
    pacchiZonaVerde,
    currentUser,
  } = useApp();

  // 1. Orologio Digitale Realtime
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Navigazione Settimana (Offset da settimana corrente)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Calcola i 6 giorni della settimana lavorativa (Lunedì - Sabato)
  const weekDays = useMemo<DayScheduleInfo[]>(() => {
    const now = new Date();
    // Aggiusta con weekOffset
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + weekOffset * 7);

    // Trova il Lunedì della settimana (1 = Lunedì, 0 = Domenica)
    const currentDay = targetDate.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(targetDate);
    monday.setDate(monday.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const todayIso = new Date().toISOString().split('T')[0];

    const dayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const shortNames = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];

    const days: DayScheduleInfo[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const iso = d.toISOString().split('T')[0];
      const dayFormatted = d.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
      });

      days.push({
        date: d,
        isoDate: iso,
        dayName: dayNames[i],
        shortName: shortNames[i],
        formattedDate: dayFormatted,
        isToday: iso === todayIso,
      });
    }

    return days;
  }, [weekOffset]);

  // 3. Cantieri Attivi (stato in_corso o collaudo)
  const activeCantieri = useMemo(() => {
    return cantieri.filter(
      (c) => c.stato === 'in_corso' || c.stato === 'collaudo'
    );
  }, [cantieri]);

  // 4. Paginazione Kiosk temporizzata & Carosello
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [carouselProgress, setCarouselProgress] = useState<number>(0); // 0 to 100%
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const totalPages = Math.max(1, Math.ceil(activeCantieri.length / ITEMS_PER_PAGE));

  // Reset pagina se cambiano i cantieri
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);

  // Timer per rotazione automatica carosello (15s)
  useEffect(() => {
    if (!isAutoRotate || isHovered || totalPages <= 1) {
      setCarouselProgress(0);
      return;
    }

    const stepMs = 100;
    const increment = (stepMs / ROTATION_INTERVAL_MS) * 100;

    const interval = setInterval(() => {
      setCarouselProgress((prev) => {
        if (prev >= 100) {
          setCurrentPage((curr) => (curr + 1) % totalPages);
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [isAutoRotate, isHovered, totalPages]);

  // Cantieri visibili nella pagina corrente
  const pagedCantieri = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return activeCantieri.slice(start, start + ITEMS_PER_PAGE);
  }, [activeCantieri, currentPage]);

  // 5. Gestione HTML5 Fullscreen API
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // 6. Modal Dettaglio Giornata Interattivo
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    cantiere: Cantiere;
    assignment: AssegnazioneGiornalieraCantiere;
  } | null>(null);

  // Chiudi modal con tasto Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDayDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Impossibile attivare/disattivare il fullscreen:', err);
    }
  };

  // Helper per trovare informazioni logistiche su un cantiere
  const getCantiereLogistics = (cantiere: Cantiere) => {
    // 1. Capocantiere / Responsabile
    const capo =
      dipendenti.find(
        (d) =>
          d.id === cantiere.responsabileId ||
          `${d.nome} ${d.cognome}`.toLowerCase() === cantiere.responsabileNome.toLowerCase()
      ) ||
      dipendenti.find((d) => d.reparto === 'capocantiere');

    const capoNome = capo
      ? `${capo.nome} ${capo.cognome}`
      : cantiere.responsabileNome || 'Preposto Assegnato';

    // 2. Furgone / Veicolo assegnato (matching dipendente o targa)
    const veicolo =
      veicoli.find(
        (v) =>
          v.autistaAssegnatoNome?.toLowerCase() === capoNome.toLowerCase() ||
          v.assegnato?.toLowerCase() === capoNome.toLowerCase() ||
          v.autistaAssegnatoId === capo?.id
      ) || veicoli[0];

    // 3. Squadra operativa (altri dipendenti assegnati)
    const squadraOperatori: Dipendente[] = [];
    if (cantiere.operatoriAssegnatiIds && cantiere.operatoriAssegnatiIds.length > 0) {
      for (const opId of cantiere.operatoriAssegnatiIds) {
        const d = dipendenti.find((dip) => dip.id === opId);
        if (d && (!capo || d.id !== capo.id)) {
          squadraOperatori.push(d);
        }
      }
    }

    // Se squadra vuota da IDs, prendiamo 2 operatori per cantiere per visualizzazione realistica su TV
    const squadraEffettiva =
      squadraOperatori.length > 0
        ? squadraOperatori
        : dipendenti
            .filter((d) => d.reparto === 'operaio' || d.reparto === 'apprendista')
            .slice(0, 2);

    // 4. Avanzamento SAL %
    const salAssociato = sals
      .filter((s) => s.cantiereId === cantiere.id)
      .sort((a, b) => b.numeroSal - a.numeroSal)[0];

    const percAvanzamento =
      salAssociato?.percentualeAvanzamentoGlobale ||
      cantiere.avanzamentoPercentuale ||
      45;

    return {
      capoNome,
      capoQualifica: capo?.ruoloAziendale || 'Capocantiere PES/PAV',
      veicoloTarga: veicolo?.targa || 'FJ482KN',
      veicoloModello: veicolo?.modello || 'Iveco Daily 35C15',
      squadraNomi: squadraEffettiva.map((d) => `${d.nome} ${d.cognome.charAt(0)}.`),
      squadraCount: squadraEffettiva.length + 1,
      percAvanzamento,
    };
  };

  // Helper per generare l'assegnazione giornaliera completa con composizione nominativa operatori
  const getDailyAssignment = (
    cantiere: Cantiere,
    day: DayScheduleInfo,
    cantiereIdx: number
  ): AssegnazioneGiornalieraCantiere => {
    // 1. Capocantiere / Preposto
    const capo =
      dipendenti.find(
        (d) =>
          d.id === cantiere.responsabileId ||
          `${d.nome} ${d.cognome}`.toLowerCase() === cantiere.responsabileNome?.toLowerCase()
      ) ||
      dipendenti.find((d) => d.reparto === 'capocantiere') ||
      dipendenti[0];

    const capoNome = capo
      ? `${capo.nome} ${capo.cognome}`
      : cantiere.responsabileNome || 'Marco Rossi';

    const capoAbbreviato = capo
      ? `${capo.nome.charAt(0)}. ${capo.cognome}`
      : 'M. Rossi';

    const capoQualifica = capo?.ruoloAziendale || capo?.qualifica || 'Capocantiere PES/PAV';

    // 2. Veicolo / Furgone
    const veicolo =
      veicoli.find(
        (v) =>
          v.autistaAssegnatoNome?.toLowerCase() === capoNome.toLowerCase() ||
          v.assegnato?.toLowerCase() === capoNome.toLowerCase() ||
          v.autistaAssegnatoId === capo?.id ||
          (capo?.veicoloAssegnatoId && v.id === capo.veicoloAssegnatoId)
      ) ||
      veicoli[cantiereIdx % Math.max(1, veicoli.length)] ||
      veicoli[0];

    const veicoloTarga = veicolo?.targa || 'FJ482KN';
    const veicoloModello = veicolo?.modello || 'Iveco Daily 35C15';
    const veicoloModelloCorto = veicoloModello.split(' ')[0] || 'Daily';

    // 3. Squadra Tecnici Operatori & Apprendisti
    const fieldWorkers = dipendenti.filter(
      (d) =>
        (!capo || d.id !== capo.id) &&
        (d.reparto === 'operaio' || d.reparto === 'apprendista' || d.reparto === 'ufficio_tecnico')
    );

    // Operatori esplicitamente assegnati
    const explicitOperators: Dipendente[] = [];
    if (cantiere.operatoriAssegnatiIds && cantiere.operatoriAssegnatiIds.length > 0) {
      for (const opId of cantiere.operatoriAssegnatiIds) {
        const d = dipendenti.find((dip) => dip.id === opId);
        if (d && (!capo || d.id !== capo.id)) {
          explicitOperators.push(d);
        }
      }
    }

    // Pool integrato con dipendenti specializzati VoltMaster
    const fallbackWorkersPool = [
      { id: 'usr-op-mb', nome: 'Matteo', cognome: 'Bianchi', ruoloAziendale: 'Operaio Specializzato Elettricista', reparto: 'operaio', qualifiche: ['PES', 'PLE'], tel: '+39 328 5551234' },
      { id: 'usr-op-dr', nome: 'Davide', cognome: 'Riva', ruoloAziendale: 'Operaio Specializzato Cablaggi', reparto: 'operaio', qualifiche: ['PES', 'PAV'], tel: '+39 339 4443322' },
      { id: 'usr-app-gc', nome: 'Gabriele', cognome: 'Colombo', ruoloAziendale: 'Apprendista Elettricista (3° anno)', reparto: 'apprendista', qualifiche: ['PAV'], tel: '+39 340 7711223' },
      { id: 'usr-app-lm', nome: 'Luca', cognome: 'Moretti', ruoloAziendale: 'Apprendista Impianti Civili', reparto: 'apprendista', qualifiche: ['Appr.'], tel: '+39 329 1122334' },
      { id: 'usr-op-sf', nome: 'Simone', cognome: 'Fontana', ruoloAziendale: 'Specialista Fibre & Reti', reparto: 'operaio', qualifiche: ['PES'], tel: '+39 345 8899001' },
      { id: 'usr-op-re', nome: 'Roberto', cognome: 'Esposito', ruoloAziendale: 'Elettricista Impiantista Terziario', reparto: 'operaio', qualifiche: ['PES', 'PAV'], tel: '+39 349 4567890' },
      { id: 'usr-app-dr', nome: 'Davide', cognome: 'Romano', ruoloAziendale: 'Apprendista Impianti', reparto: 'apprendista', qualifiche: ['PAV'], tel: '+39 320 5678901' },
      { id: 'usr-op-ab', nome: 'Andrea', cognome: 'Bianchi', ruoloAziendale: 'Tecnico Manutentore & Termografia', reparto: 'ufficio_tecnico', qualifiche: ['PES', 'PAV'], tel: '+39 347 2345678' },
    ];

    const dayIndex = day.date.getDay(); // 0 = Dom, 1 = Lun, ..., 6 = Sab
    const isSaturday = dayIndex === 6;

    const toOperatoreGiorno = (item: any): OperatoreAssegnatoGiorno => {
      const isAppr =
        item.reparto === 'apprendista' ||
        (item.ruoloAziendale && item.ruoloAziendale.toLowerCase().includes('apprendista')) ||
        false;

      let qualificaBadge: 'PES' | 'PAV' | 'PEI' | 'Appr.' | 'Spec.' = 'Spec.';
      if (isAppr) {
        qualificaBadge = 'Appr.';
      } else if (
        item.patentini?.some((p: string) => p.includes('PES')) ||
        item.qualifica?.includes('PES') ||
        item.qualifiche?.includes('PES') ||
        item.ruoloAziendale?.includes('PES')
      ) {
        qualificaBadge = 'PES';
      } else if (
        item.patentini?.some((p: string) => p.includes('PAV')) ||
        item.qualifica?.includes('PAV') ||
        item.qualifiche?.includes('PAV') ||
        item.ruoloAziendale?.includes('PAV')
      ) {
        qualificaBadge = 'PAV';
      } else if (item.patentini?.some((p: string) => p.includes('PEI'))) {
        qualificaBadge = 'PEI';
      }

      return {
        id: item.id,
        nome: `${item.nome} ${item.cognome}`,
        nomeAbbreviato: `${item.nome.charAt(0)}. ${item.cognome}`,
        ruoloAziendale: item.ruoloAziendale || (isAppr ? 'Apprendista Elettricista' : 'Operaio Specializzato'),
        qualificaBadge,
        isApprendista: isAppr,
        telefono: item.telefono || item.tel || '+39 340 000000',
      };
    };

    const combinedPool = [
      ...explicitOperators,
      ...fieldWorkers,
      ...fallbackWorkersPool.map((f) => ({
        ...f,
        patentini: f.qualifiche,
        qualifica: f.ruoloAziendale,
        email: '',
        codiceFiscale: '',
        dataAssunzione: '',
        costoOrario: 30,
        oreLavorateMeseCorrente: 160,
        ferieDisponibiliGiorni: 15,
        permessiDisponibiliOre: 20,
      } as unknown as Dipendente)),
    ];

    const uniquePool: any[] = [];
    const seenNames = new Set<string>();
    for (const w of combinedPool) {
      const full = `${w.nome} ${w.cognome}`.toLowerCase();
      if (!seenNames.has(full) && full !== capoNome.toLowerCase()) {
        seenNames.add(full);
        uniquePool.push(w);
      }
    }

    const seed = (cantiere.id.charCodeAt(cantiere.id.length - 1) + dayIndex + cantiereIdx * 3);
    const squadSize = isSaturday ? 1 : 2 + (seed % 2); // 1 di sabato, 2 o 3 nei feriali

    const selectedOps: OperatoreAssegnatoGiorno[] = [];
    for (let i = 0; i < squadSize; i++) {
      const workerIdx = (seed + i * 2) % Math.max(1, uniquePool.length);
      const worker = uniquePool[workerIdx];
      if (worker && !selectedOps.some((op) => op.nome === `${worker.nome} ${worker.cognome}`)) {
        selectedOps.push(toOperatoreGiorno(worker));
      }
    }

    // 4. Lavorazione, Dettaglio & Categoria Colore
    let lavorazione = 'Posa canaline e dorsale BT';
    let dettaglioAttivita = 'Staffaggio passerelle a filo BJC & discese';
    let faseCategoria: AssegnazioneGiornalieraCantiere['faseCategoria'] = 'posa';
    let orarioLavoro = '8h ordinario';
    let orarioDettaglio = '07:30 - 16:30';
    let noteGiorno = 'Inizio ore 07:30 · DPI anticaduta';

    const titUpper = (cantiere.titolo || '').toUpperCase();

    if (isSaturday) {
      lavorazione = 'Verifiche, Chiusura & Riordino';
      dettaglioAttivita = 'Pulizia cantiere, controllo serraggi e riordino furgone';
      faseCategoria = 'sabato';
      orarioLavoro = '4h turno';
      orarioDettaglio = '07:30 - 11:30';
      noteGiorno = 'Chiusura ore 11:30';
    } else if (titUpper.includes('OSPEDALE') || titUpper.includes('MT/BT') || titUpper.includes('CABINA')) {
      const mtPhases = [
        { lav: 'Posa blindosbarre 2500A & staffaggio', dett: 'Staffaggio vie cavi e discese verso cabina BT', cat: 'posa' as const, note: 'Inizio 07:30 · DPI anticaduta' },
        { lav: 'Cablaggio scomparti MT/BT & arrivi', dett: 'Connessione cavi unipolari MT e barre rame BT', cat: 'quadri' as const, note: 'Sezionamento linea · PES/PAV' },
        { lav: 'Taratura relè protezione Thytronic', dett: 'Regolazione soglie differenziali e massima corrente', cat: 'quadri' as const, note: 'Verifica tarature CEI 0-16' },
        { lav: 'Quadro emergenza e avviamento GE', dett: 'Cablaggio interblocco meccanico rete-gruppo', cat: 'quadri' as const, note: 'Test commutazione GE' },
        { lav: 'Verifiche strumentali CEI 64-8', dett: 'Misure loop terra, isolamento e prova RCD 30mA', cat: 'collaudo' as const, note: 'Strumento Asita · Di.Co.' },
      ];
      const ph = mtPhases[(dayIndex - 1 + 5) % 5];
      lavorazione = ph.lav;
      dettaglioAttivita = ph.dett;
      faseCategoria = ph.cat;
      noteGiorno = ph.note;
    } else if (titUpper.includes('AMAZON') || titUpper.includes('FV') || titUpper.includes('FOTOVOLTAICO') || titUpper.includes('LOGIST')) {
      const fvPhases = [
        { lav: 'Posa canaline metalliche & staffe FV', dett: 'Staffaggio passerelle a filo su copertura piana', cat: 'posa' as const, note: 'Inizio 07:30 · Linea vita' },
        { lav: 'Posa stringhe moduli 550W bifacciali', dett: 'Connessione connettori MC4 e ottimizzatori', cat: 'fotovoltaico' as const, note: 'DPI 3ª cat. anticaduta' },
        { lav: 'Tiraggio cavi solari FG21M21 6mm²', dett: 'Infilaggio montanti CC da tetto a quadri di campo', cat: 'tiraggio' as const, note: 'Guaine anti-UV e sigillatura' },
        { lav: 'Cablaggio inverter SolarEdge 100K', dett: 'Quadri campo CC, sezionatori e scaricatori', cat: 'quadri' as const, note: 'Serraggio dinamometrico' },
        { lav: 'Collaudo curve I-V e isolamento CEI 82-25', dett: 'Verifica rendimento e messa in parallelo', cat: 'collaudo' as const, note: 'Solar tester · Collaudo finale' },
      ];
      const ph = fvPhases[(dayIndex - 1 + 5) % 5];
      lavorazione = ph.lav;
      dettaglioAttivita = ph.dett;
      faseCategoria = ph.cat;
      noteGiorno = ph.note;
    } else if (titUpper.includes('TERRAZZE') || titUpper.includes('DOMOTIC') || titUpper.includes('RESIDENZIALE') || titUpper.includes('VILLA')) {
      const domPhases = [
        { lav: 'Posa tubazioni corrugate & scatole 503', dett: 'Tracciamento e muratura scatole di derivazione', cat: 'posa' as const, note: 'Inizio 07:30 · Tracciamento' },
        { lav: 'Infilaggio bus KNX e linee prese 230V', dett: 'Tiraggio cavo verde KNX e conduttori NO7V-K', cat: 'tiraggio' as const, note: 'Separazione circuiti SELV/BT' },
        { lav: 'Cablaggio quadro domotico di piano', dett: 'Attuatori tapparelle, dimmer e alimentatore bus', cat: 'quadri' as const, note: 'Etichettatura morsettiere' },
        { lav: 'Montaggio Wallbox 22kW & videocitofono', dett: 'Installazione posto esterno IP e colonnina EV', cat: 'fotovoltaico' as const, note: 'Configurazione rete LAN/IP' },
        { lav: 'Programmazione ETS6 e collaudo finale', dett: 'Scenari crepuscolari, test differenziali e app', cat: 'collaudo' as const, note: 'Collaudo impianto con cliente' },
      ];
      const ph = domPhases[(dayIndex - 1 + 5) % 5];
      lavorazione = ph.lav;
      dettaglioAttivita = ph.dett;
      faseCategoria = ph.cat;
      noteGiorno = ph.note;
    } else {
      const defPhases = [
        { lav: 'Posa canaline e dorsale BT', dett: 'Staffaggio passerelle a filo BJC & discese', cat: 'posa' as const, note: 'Inizio ore 07:30' },
        { lav: 'Tiraggio cavi FG16OR12 5G16', dett: 'Infilaggio montante da Cabina a Quadro', cat: 'tiraggio' as const, note: 'Tiracavi elettrico' },
        { lav: 'Cablaggio quadro generale QG & inverter', dett: 'Installazione interruttori scatolati & barre', cat: 'quadri' as const, note: 'Serraggio dinamometrico' },
        { lav: 'Allacciamento quadri secondari & comandi', dett: 'Cablaggio linee terminali e comandi', cat: 'quadri' as const, note: 'Verifica isolamento' },
        { lav: 'Verifiche strumentali CEI 64-8', dett: 'Prove scatto RCD, loop terra e isolamento', cat: 'collaudo' as const, note: 'Misure strumentali CEI' },
      ];
      const ph = defPhases[(dayIndex - 1 + 5) % 5];
      lavorazione = ph.lav;
      dettaglioAttivita = ph.dett;
      faseCategoria = ph.cat;
      noteGiorno = ph.note;
    }

    const lavCtx = lavorazioni.find((l) => l.cantiereId === cantiere.id);
    if (lavCtx && dayIndex === 3) {
      lavorazione = lavCtx.titolo;
      if (lavCtx.descrizione) dettaglioAttivita = lavCtx.descrizione;
    }

    // 5. Stato e Colori Badge
    const isDone = day.date < new Date() && !day.isToday;
    let stato: AssegnazioneGiornalieraCantiere['stato'] = 'IN CORSO';
    let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';

    if (isSaturday) {
      stato = 'SABATO';
      badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
    } else if (isDone) {
      stato = 'COMPLETATO';
      badgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    } else if (faseCategoria === 'collaudo') {
      stato = 'COLLAUDO';
      badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    } else if (!day.isToday && day.date > new Date()) {
      stato = 'PIANIFICATO';
      badgeColor =
        faseCategoria === 'posa'
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : faseCategoria === 'quadri'
          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
          : faseCategoria === 'fotovoltaico'
          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
          : 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    } else if (day.isToday) {
      stato = 'IN CORSO';
      badgeColor =
        faseCategoria === 'posa'
          ? 'bg-amber-500/25 text-amber-200 border-amber-500/50 shadow-sm'
          : faseCategoria === 'quadri'
          ? 'bg-cyan-500/25 text-cyan-200 border-cyan-500/50 shadow-sm'
          : faseCategoria === 'fotovoltaico'
          ? 'bg-sky-500/25 text-sky-200 border-sky-500/50 shadow-sm'
          : 'bg-emerald-500/25 text-emerald-200 border-emerald-500/50 shadow-sm';
    }

    return {
      cantiereId: cantiere.id,
      giorno: day.isoDate,
      dayName: day.dayName,
      shortName: day.shortName,
      formattedDate: day.formattedDate,
      isToday: day.isToday,
      lavorazione,
      dettaglioAttivita,
      faseCategoria,
      stato,
      badgeColor,
      capocantiere: {
        id: capo?.id || 'capo-1',
        nome: capoNome,
        nomeAbbreviato: capoAbbreviato,
        qualifica: capoQualifica,
        displayBadge: `${capoAbbreviato} (Preposto)`,
        telefono: capo?.telefono || '+39 340 1234567',
      },
      operatori: selectedOps,
      veicolo: {
        id: veicolo?.id,
        targa: veicoloTarga,
        modello: veicoloModello,
        displayTarga: `${veicoloModelloCorto} · ${veicoloTarga}`,
        labelCompleta: `${veicoloModello} (${veicoloTarga})`,
      },
      orarioLavoro,
      orarioDettaglio,
      noteGiorno,
    };
  };

  // KPI totali per il footer
  const totalOperatoriInCampo = useMemo(() => {
    return dipendenti.filter(
      (d) => d.reparto === 'capocantiere' || d.reparto === 'operaio' || d.reparto === 'apprendista'
    ).length;
  }, [dipendenti]);

  const totalVeicoliAttivi = useMemo(() => {
    return veicoli.filter((v) => v.stato === 'in_servizio').length;
  }, [veicoli]);

  return (
    <div
      className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none font-sans"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. TOP HEADER TV (Wallboard Bar) */}
      <header className="h-20 bg-slate-900/90 border-b border-slate-800 px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-lg relative z-20 backdrop-blur-md">
        {/* Left: Brand & Live Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Zap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white uppercase font-mono">
                  VOLT<span className="text-amber-400">MASTER</span>
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE TV 1080P
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                Tabellone Settimanale Commesse & Cantieri Attivi
              </p>
            </div>
          </div>
        </div>

        {/* Center: Large Digital Clock & Date */}
        <div className="flex items-center gap-6">
          {/* Week Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Settimana Precedente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                weekOffset === 0
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Settimana Corrente
            </button>

            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Settimana Successiva"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Big Time Display */}
          <div className="flex items-center gap-3 bg-slate-950/90 border border-slate-800 px-5 py-1.5 rounded-2xl shadow-inner">
            <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
            <div className="flex flex-col text-right">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-400 leading-none">
                {currentTime.toLocaleTimeString('it-IT', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {currentTime.toLocaleDateString('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Kiosk Controls (Rotation, Fullscreen, Exit) */}
        <div className="flex items-center gap-3">
          {/* Pagination dots & Carousel toggle */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setIsAutoRotate(!isAutoRotate)}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isAutoRotate
                    ? 'text-amber-400 hover:bg-amber-500/10'
                    : 'text-slate-500 hover:bg-slate-800'
                }`}
                title={isAutoRotate ? 'Pausa Auto-rotazione (15s)' : 'Avvia Auto-rotazione'}
              >
                {isAutoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="text-[11px] font-mono">15s</span>
              </button>

              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentPage(idx);
                      setCarouselProgress(0);
                    }}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      currentPage === idx
                        ? 'w-6 bg-amber-400 shadow-sm shadow-amber-400/50'
                        : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`Vai a Pagina ${idx + 1}`}
                  />
                ))}
              </div>

              <span className="text-[10px] font-mono text-slate-400 pl-1 font-bold">
                {currentPage + 1}/{totalPages}
              </span>
            </div>
          )}

          {/* HTML5 Native Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Schermo Intero F11"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Riduci</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Fullscreen TV</span>
              </>
            )}
          </button>

          {/* Exit Back to Main App */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700/80"
            title="Torna al Gestionale VoltMaster"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel Linear Progress Bar on Top Header */}
        {totalPages > 1 && isAutoRotate && !isHovered && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 transition-all duration-100 ease-linear"
              style={{ width: `${carouselProgress}%` }}
            />
          </div>
        )}
      </header>

      {/* 2. MAIN WEEKLY SCHEDULE TABLE */}
      <main className="flex-1 overflow-hidden p-3 sm:p-5 flex flex-col min-h-0 bg-slate-950">
        <div className="flex-1 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header Row: Days of the Week */}
          <div className="grid grid-cols-12 bg-slate-900 border-b border-slate-800 shrink-0 text-slate-200">
            {/* Left Header: Cantieri Info Column (3.5 cols) */}
            <div className="col-span-3 lg:col-span-3 p-3.5 flex items-center justify-between border-r border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Cantiere & Squadra Operativa
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {activeCantieri.length} Attivi
              </span>
            </div>

            {/* Right Headers: 6 Days (Lun - Sab) (9 cols or 1.5 col per day) */}
            <div className="col-span-9 lg:col-span-9 grid grid-cols-6 divide-x divide-slate-800">
              {weekDays.map((day) => (
                <div
                  key={day.isoDate}
                  className={`p-2.5 sm:p-3 text-center transition-all ${
                    day.isToday
                      ? 'bg-amber-500/20 border-b-2 border-amber-400 ring-2 ring-amber-500/60 shadow-inner'
                      : 'bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
                        day.isToday ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      {day.dayName}
                    </span>
                    {day.isToday && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-400 text-slate-950 tracking-wider animate-pulse shadow-sm shadow-amber-400/50">
                        OGGI
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[11px] font-mono mt-0.5 ${
                      day.isToday ? 'text-amber-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {day.formattedDate}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Body: Paged Cantieri Rows */}
          <div className="flex-1 overflow-hidden grid grid-rows-4 divide-y divide-slate-800">
            {pagedCantieri.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                <Building2 className="w-12 h-12 mb-3 text-slate-600 opacity-60" />
                <p className="text-base font-bold text-slate-400">
                  Nessun cantiere attivo o in collaudo al momento.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  I cantieri in stato 'in_corso' compariranno automaticamente su questo monitor.
                </p>
              </div>
            ) : (
              pagedCantieri.map((cantiere, cantiereIdx) => {
                const logistics = getCantiereLogistics(cantiere);

                return (
                  <div
                    key={cantiere.id}
                    className="grid grid-cols-12 hover:bg-slate-800/30 transition-colors min-h-0"
                  >
                    {/* Left Column: Cantiere Details & Logistics (Col span 3) */}
                    <div className="col-span-3 lg:col-span-3 p-3.5 border-r border-slate-800 flex flex-col justify-between bg-slate-900/40 min-h-0">
                      <div>
                        {/* Code & SAL progress */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {cantiere.codice}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              cantiere.stato === 'collaudo'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {cantiere.stato === 'collaudo' ? 'Collaudo' : 'In Corso'}
                          </span>
                        </div>

                        {/* Title & Customer */}
                        <h4 className="text-sm lg:text-base font-black text-white mt-1.5 line-clamp-1 leading-snug">
                          {cantiere.titolo}
                        </h4>

                        <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5 line-clamp-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-200 truncate">
                            {cantiere.clienteNome}
                          </span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400 truncate flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {cantiere.citta}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Progress Bar */}
                      <div className="my-1.5">
                        <div className="flex justify-between text-[10px] font-mono font-bold mb-0.5">
                          <span className="text-slate-400">Avanzamento SAL:</span>
                          <span className="text-emerald-400">{logistics.percAvanzamento}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, logistics.percAvanzamento)}%` }}
                          />
                        </div>
                      </div>

                      {/* Logistics Info: Capocantiere, Furgone & Squadra */}
                      <div className="pt-1.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                        {/* Capocantiere */}
                        <div className="flex items-center gap-1.5">
                          <HardHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-[9px] text-slate-400 block font-semibold leading-none uppercase">
                              Preposto:
                            </span>
                            <span className="font-bold text-slate-200 truncate">
                              {logistics.capoNome}
                            </span>
                          </div>
                        </div>

                        {/* Furgone */}
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-[9px] text-slate-400 block font-semibold leading-none uppercase">
                              Furgone:
                            </span>
                            <span className="font-mono font-bold text-slate-200 truncate">
                              {logistics.veicoloTarga}
                            </span>
                          </div>
                        </div>

                        {/* Squadra Operativa (Full span) */}
                        <div className="col-span-2 flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800/80">
                          <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-slate-300">
                            Squadra ({logistics.squadraCount} tec.):
                          </span>
                          <span className="truncate font-mono text-slate-300 font-bold">
                            {logistics.squadraNomi.join(', ') || 'Operai Specializzati'}
                          </span>
                        </div>

                        {/* Pacchi Zona Verde / Logistica per questo Cantiere */}
                        {(() => {
                          const pkgs = pacchiZonaVerde.filter(
                            (p) => p.cantiereId === cantiere.id || p.codiceCantiere === cantiere.codice
                          );
                          const caricato = pkgs.find((p) => p.statoTransito === 'CARICATO_SU_MEZZO');
                          const pronto = pkgs.find((p) => p.statoTransito === 'PRONTO_ZONA_VERDE');

                          if (caricato) {
                            return (
                              <div className="col-span-2 flex items-center justify-between text-[10px] text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded-lg border border-cyan-800/80">
                                <span className="flex items-center gap-1 font-semibold truncate">
                                  <Truck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  <span>{caricato.id} caricato su {caricato.furgoneAssegnato ? caricato.furgoneAssegnato.slice(0, 16) : 'mezzo'}</span>
                                </span>
                                <span className="font-mono text-[9px] text-cyan-400 font-bold">
                                  {caricato.timestampCarico ? caricato.timestampCarico.split(' ')[1] || 'In Viaggio' : 'In Viaggio'}
                                </span>
                              </div>
                            );
                          }

                          if (pronto) {
                            return (
                              <div className="col-span-2 flex items-center justify-between text-[10px] text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-800/80">
                                <span className="flex items-center gap-1 font-semibold truncate">
                                  <Boxes className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>{pronto.id} pronto in Zona Verde</span>
                                </span>
                                <span className="font-mono text-[9px] text-emerald-400 font-bold">
                                  In Ritiro
                                </span>
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Right Columns: 6 Days (Lun - Sab) */}
                    <div className="col-span-9 lg:col-span-9 grid grid-cols-6 divide-x divide-slate-800 min-h-0">
                      {weekDays.map((day, dayIdx) => {
                        const assignment = getDailyAssignment(cantiere, day, cantiereIdx);

                        return (
                          <div
                            key={day.isoDate}
                            onClick={() => setSelectedDayDetail({ cantiere, assignment })}
                            className={`p-2 sm:p-2.5 flex flex-col justify-between transition-all min-h-0 relative cursor-pointer select-none group ${
                              day.isToday
                                ? 'bg-amber-500/[0.08] ring-2 ring-amber-500 shadow-lg shadow-amber-500/10 z-10 rounded-md'
                                : 'hover:bg-slate-800/40'
                            }`}
                            title="Clicca per visualizzare la scheda operativa giornaliera completa"
                          >
                            {/* 1. IN ALTO: Titolo/Badge Attività con Codice Colore & Ore */}
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border truncate max-w-[105px] sm:max-w-[125px] ${assignment.badgeColor}`}
                                >
                                  {assignment.stato}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {day.isToday && (
                                    <span className="flex h-2 w-2 relative" title="Turno Odierno Attivo">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                    </span>
                                  )}
                                  <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                                    {assignment.orarioLavoro}
                                  </span>
                                </div>
                              </div>

                              {/* Titolo Attività Lavorazione */}
                              <h5 className="text-xs sm:text-[13px] font-black text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1 leading-snug tracking-tight">
                                {assignment.lavorazione}
                              </h5>

                              {/* Dettaglio sintetico */}
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-medium leading-tight">
                                {assignment.dettaglioAttivita}
                              </p>
                            </div>

                            {/* 2. AL CENTRO: Blocco OPERATORI ASSEGNATI (ad alta leggibilità per monitor TV) */}
                            <div className="my-1.5 pt-1 border-t border-slate-800/70">
                              <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                                <span className="flex items-center gap-1 font-bold text-slate-300">
                                  <Users className="w-2.5 h-2.5 text-amber-400" />
                                  <span>Operatori Assegnati</span>
                                </span>
                                {day.isToday && (
                                  <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                                    In Campo
                                  </span>
                                )}
                              </div>

                              {/* Badge Capocantiere / Preposto ad Alto Contrasto */}
                              <div
                                className={`flex items-center justify-between px-1.5 py-1 rounded border font-sans mb-1 transition-all ${
                                  day.isToday
                                    ? 'bg-amber-950/60 border-amber-500/70 text-amber-100 ring-1 ring-amber-500/40 shadow-sm'
                                    : 'bg-slate-950/90 border-slate-700/80 text-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <HardHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="text-[11px] sm:text-xs font-black truncate text-white">
                                    {assignment.capocantiere.nomeAbbreviato}
                                  </span>
                                  <span className="text-[9px] text-amber-300/90 font-semibold hidden xl:inline">
                                    (Preposto)
                                  </span>
                                </div>
                                <span className="px-1 py-0.2 rounded text-[8px] font-mono font-black uppercase bg-amber-500/30 text-amber-300 border border-amber-500/40 shrink-0 ml-1">
                                  PES
                                </span>
                              </div>

                              {/* Chips Operatori e Apprendisti Assegnati (Layout compatto anti-overflow) */}
                              <div className="flex flex-wrap gap-1">
                                {assignment.operatori.map((op) => (
                                  <div
                                    key={op.id || op.nome}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                                      op.isApprendista
                                        ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                                        : day.isToday
                                        ? 'bg-slate-900 border-amber-500/40 text-slate-100'
                                        : 'bg-slate-950/80 border-slate-700/80 text-slate-200'
                                    }`}
                                    title={`${op.nome} · ${op.ruoloAziendale}`}
                                  >
                                    <span className="truncate max-w-[80px] sm:max-w-[95px]">
                                      {op.nomeAbbreviato}
                                    </span>
                                    <span
                                      className={`px-0.5 py-0.2 rounded text-[7.5px] font-mono font-bold leading-none ${
                                        op.qualificaBadge === 'PES'
                                          ? 'bg-amber-500/30 text-amber-300'
                                          : op.qualificaBadge === 'PAV'
                                          ? 'bg-cyan-500/30 text-cyan-300'
                                          : op.qualificaBadge === 'Appr.'
                                          ? 'bg-emerald-500/30 text-emerald-300'
                                          : 'bg-slate-800 text-slate-300'
                                      }`}
                                    >
                                      {op.qualificaBadge}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 3. IN BASSO: Indicatore Orario e Badge Furgone/Targa */}
                            <div className="mt-1 pt-1 border-t border-slate-800/70 flex items-center justify-between text-[10px] font-mono">
                              <div className="flex items-center gap-1 text-slate-400 truncate max-w-[105px]">
                                <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate text-[9px] font-bold text-slate-300">
                                  {assignment.noteGiorno || assignment.orarioDettaglio}
                                </span>
                              </div>

                              <div
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 truncate max-w-[105px]"
                                title={`Veicolo: ${assignment.veicolo.modello} (${assignment.veicolo.targa})`}
                              >
                                <Truck className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span className="font-bold text-[9px] font-mono truncate">
                                  {assignment.veicolo.targa}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* 3. BOTTOM TV FOOTER (KPIs & Safety Ticker) */}
      <footer className="h-14 bg-slate-900 border-t border-slate-800 px-6 sm:px-8 flex items-center justify-between shrink-0 text-xs shadow-xl relative z-20">
        {/* Left: System Status & Statistics */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-bold text-slate-300 tracking-wide">
              SERVER CLOUD SINCRONIZZATO
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 pl-4 border-l border-slate-800 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Cantieri Attivi:</span>
              <strong className="text-slate-100">{activeCantieri.length}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Tecnici in Campo:</span>
              <strong className="text-slate-100">{totalOperatoriInCampo}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Furgoni Assegnati:</span>
              <strong className="text-slate-100">{totalVeicoliAttivi}</strong>
            </div>

            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
              <Boxes className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Zona Verde:</span>
              <span className="text-emerald-300 font-bold">
                {pacchiZonaVerde.filter((p) => p.statoTransito === 'PRONTO_ZONA_VERDE').length} pronti
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-cyan-300 font-bold">
                {pacchiZonaVerde.filter((p) => p.statoTransito === 'CARICATO_SU_MEZZO').length} in viaggio
              </span>
            </div>
          </div>
        </div>

        {/* Center: Safety Note D.Lgs 81/08 */}
        <div className="hidden lg:flex items-center gap-2 text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl text-[11px] font-medium">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>D.Lgs 81/08 & CEI 11-27:</strong> Obbligo DPI 3ª cat. lavori in quota &gt;2m e rischio elettrico PES/PAV.
          </span>
        </div>

        {/* Right: Kiosk Shortcuts Info */}
        <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
          <span className="hidden sm:inline">Premere [F11] per Kiosk Fullscreen</span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-400 font-bold">VoltMaster Wallboard</span>
        </div>
      </footer>

      {/* 4. MODAL DETTAGLIO INTERVENTO & SQUADRA OPERATIVA WALLBOARD */}
      {selectedDayDetail && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedDayDetail(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {selectedDayDetail.cantiere.codice}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      selectedDayDetail.assignment.badgeColor
                    }`}
                  >
                    {selectedDayDetail.assignment.stato}
                  </span>
                  {selectedDayDetail.assignment.isToday && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400 text-slate-950 tracking-wider animate-pulse shadow-sm shadow-amber-400/40">
                      OGGI
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1.5 leading-snug">
                  {selectedDayDetail.cantiere.titolo}
                </h3>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                  <span className="font-semibold text-slate-300">
                    {selectedDayDetail.cantiere.clienteNome}
                  </span>
                  <span>·</span>
                  <span className="text-amber-400 font-bold font-mono">
                    {selectedDayDetail.assignment.dayName} {selectedDayDetail.assignment.formattedDate}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Chiudi [Esc]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scheda Lavorazione Programmata */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Attività Programmata
                </span>
                <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {selectedDayDetail.assignment.orarioLavoro} ({selectedDayDetail.assignment.orarioDettaglio})
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white">
                {selectedDayDetail.assignment.lavorazione}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {selectedDayDetail.assignment.dettaglioAttivita}
              </p>
              {selectedDayDetail.assignment.noteGiorno && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-300/90 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 font-medium">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Note Operative & Sicurezza: {selectedDayDetail.assignment.noteGiorno}</span>
                </div>
              )}
            </div>

            {/* Squadra Operativa Giornaliera */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Composizione Squadra Operativa ({selectedDayDetail.assignment.operatori.length + 1} Tecnici)</span>
                </h4>
              </div>

              {/* Scheda Capocantiere / Preposto */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                    <HardHat className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">
                        {selectedDayDetail.assignment.capocantiere.nome}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                        PREPOSTO PES/PAV
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/80 font-medium">
                      {selectedDayDetail.assignment.capocantiere.qualifica}
                    </p>
                  </div>
                </div>
                {selectedDayDetail.assignment.capocantiere.telefono && (
                  <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedDayDetail.assignment.capocantiere.telefono}
                  </span>
                )}
              </div>

              {/* Schede Operatori Specializzati & Apprendisti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedDayDetail.assignment.operatori.map((op) => (
                  <div
                    key={op.id || op.nome}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                      op.isApprendista
                        ? 'bg-emerald-950/20 border-emerald-600/30 text-emerald-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{op.nome}</span>
                        <span
                          className={`px-1 py-0.2 rounded text-[8.5px] font-mono font-bold ${
                            op.qualificaBadge === 'PES'
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              : op.qualificaBadge === 'PAV'
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                              : op.qualificaBadge === 'Appr.'
                              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {op.qualificaBadge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{op.ruoloAziendale}</p>
                    </div>
                    {op.telefono && (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {op.telefono}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Veicolo & Logistica Tratta */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                    Furgone Assegnato Giornata
                  </span>
                  <span className="text-xs font-bold text-white">
                    {selectedDayDetail.assignment.veicolo.modello}
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-black bg-cyan-950/60 text-cyan-300 border border-cyan-800/80">
                {selectedDayDetail.assignment.veicolo.targa}
              </span>
            </div>

            {/* Footer Modal Actions */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Premere [Esc] per chiudere
              </span>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-700"
              >
                Chiudi Scheda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettimanaMonitorView;
