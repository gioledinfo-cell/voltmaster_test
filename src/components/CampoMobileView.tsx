import React, { useState, useRef, useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  ScanLine,
  Clock,
  PlayCircle,
  FileSignature,
  FileText,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  HardHat,
  ArrowRight,
  User,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  Users,
  UserPlus,
  X,
  Check,
  Truck,
  Wrench,
  Zap,
  Building2,
  Navigation,
  Camera,
  Trash2,
  PackagePlus,
  Boxes,
  Package,
  Sun,
  Plus,
  Minus,
  Save,
  UploadCloud,
  RotateCcw,
  FileEdit,
  Crosshair,
  Radio,
  CheckCheck,
  Loader2,
  Compass,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { SignatureModal } from './SignatureModal';
import { ROLPrintModal } from './ROLPrintModal';
import { NuovaRichiestaMaterialiModal } from './richieste/NuovaRichiestaMaterialiModal';
import { PWAInstallButton } from './common/PWAInstallButton';
import { ROLCollaboratore, ROLWorkType, TravelDetails } from '../types';
import { WORK_TYPE_DEFINITIONS } from './ROLModule';
import {
  saveOfflineRolDraft,
  getOfflineRolDraft,
  clearOfflineRolDraft,
  enqueueOfflineRol,
  getQueuedOfflineRols,
  removeQueuedOfflineRol,
  clearQueuedOfflineRols,
  QueuedOfflineRol,
} from '../services/offlineCacheService';
import { compressImageFile, formatFileSize } from '../utils/imageCompressor';
import {
  detectActiveCantiereByGeofence,
  GeofenceDetectionResult,
  SIMULATED_GPS_LOCATIONS,
} from '../services/geofencingService';
import { getBrowserGpsPosition } from '../services/geolocationService';
import { generateRolDigitalSeal } from '../services/digitalSealService';
import { ShieldCheck, ShieldAlert, Lock } from 'lucide-react';

interface CampoMobileViewProps {
  onOpenFlussoCantiere: () => void;
}

export const CampoMobileView: React.FC<CampoMobileViewProps> = ({ onOpenFlussoCantiere }) => {
  const {
    currentUser,
    cantieri,
    rols,
    lavorazioni,
    magazzino,
    veicoli,
    dipendenti,
    pacchiZonaVerde,
    setActivePaccoCaricoModal,
    setSelectedPaccoStampa,
    openScanner,
    addROL,
    showToast,
    setActiveTab,
    offlineCacheInfo,
    openOfflineModal,
    refreshOfflineCache,
  } = useApp();

  const network = useNetworkStatus();
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const mobileFileInputRef = useRef<HTMLInputElement | null>(null);

  const isCapocantiere = currentUser.reparto === 'capocantiere' || currentUser.role === 'amministratore' || currentUser.role === 'responsabile';
  const isApprendista = currentUser.reparto === 'apprendista';

  // Mobile quick state
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>(cantieri[0]?.id || '');
  const [workType, setWorkType] = useState<ROLWorkType>('cantiere');
  const [subActivity, setSubActivity] = useState<string>('posa_cavi_canali');
  const [activityDescription, setActivityDescription] = useState<string>('');
  const [oreOrdinarie, setOreOrdinarie] = useState<number>(8);
  const [oreStraordinarie, setOreStraordinarie] = useState<number>(0);

  // Travel state (Toggle OFF by default)
  const [hasTravel, setHasTravel] = useState<boolean>(false);
  const [hoursTravel, setHoursTravel] = useState<number>(1.0);
  const [travelRoute, setTravelRoute] = useState<string>('Sede -> Cantiere');
  const [travelVehicleId, setTravelVehicleId] = useState<string>(veicoli[0]?.id || '');
  const [travelKm, setTravelKm] = useState<number>(25);

  // Parts & photos
  const [partsReplaced, setPartsReplaced] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);

  const [selectedCollaboratori, setSelectedCollaboratori] = useState<ROLCollaboratore[]>([]);
  const [attivitaDescrizione, setAttivitaDescrizione] = useState<string>(
    'Posa canali, passaggio conduttori unipolari e montaggio apparecchi di comando.'
  );
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState<{ url: string; name: string; timestamp: string } | null>(null);
  const [abilitaFirmaEInvioCliente, setAbilitaFirmaEInvioCliente] = useState<boolean>(false);
  const [lastCreatedRol, setLastCreatedRol] = useState<any | null>(null);
  const [isRichiestaModalOpen, setIsRichiestaModalOpen] = useState(false);

  // Glove & Outdoor Mode (persisted)
  const [gloveMode, setGloveMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('voltmaster_glove_mode') === 'true';
    } catch {
      return false;
    }
  });

  // Offline Queued ROLs & Saved Draft State
  const [queuedOfflineRols, setQueuedOfflineRols] = useState<QueuedOfflineRol[]>(() => getQueuedOfflineRols());
  const [pendingDraft, setPendingDraft] = useState<any | null>(null);

  // Geofencing GPS Auto-Selection State
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [geofenceResult, setGeofenceResult] = useState<GeofenceDetectionResult | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [manualCantiereOverride, setManualCantiereOverride] = useState<boolean>(false);
  const [showSimulatedPicker, setShowSimulatedPicker] = useState<boolean>(false);

  // High Efficiency Image Compression State
  const [isCompressingPhotos, setIsCompressingPhotos] = useState<boolean>(false);
  const [lastCompressionStat, setLastCompressionStat] = useState<{
    originalSize: string;
    compressedSize: string;
    savedPercent: number;
  } | null>(null);

  // Esegui geofencing GPS (reale o simulato per test)
  const runGpsGeofencing = async (customCoords?: { latitude: number; longitude: number; label?: string }) => {
    setIsLocatingGps(true);
    setGpsError(null);

    let lat: number;
    let lng: number;

    if (customCoords) {
      lat = customCoords.latitude;
      lng = customCoords.longitude;
    } else {
      const gpsRes = await getBrowserGpsPosition(6000);
      if (!gpsRes.location) {
        setGpsError(gpsRes.error || 'Impossibile determinare la posizione GPS del dispositivo.');
        setIsLocatingGps(false);
        return;
      }
      lat = gpsRes.location.latitude;
      lng = gpsRes.location.longitude;
    }

    const result = detectActiveCantiereByGeofence(lat, lng, cantieri, 500);
    setGeofenceResult(result);
    setIsLocatingGps(false);

    if (result.matchedCantiere) {
      setSelectedCantiereId(result.matchedCantiere.id);
      setManualCantiereOverride(false);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
      showToast(
        `📍 Cantiere "${result.matchedCantiere.titolo}" (${result.matchInfo?.distanceFormatted}) rilevato via GPS! Commessa pre-selezionata automaticamente (0 click).`,
        'success'
      );
    } else if (result.closestCantiere) {
      showToast(
        `📡 Posizione GPS acquisita. Nessun cantiere entro 500m (più vicino: ${result.closestCantiere.cantiere.titolo} a ${result.closestCantiere.distanceFormatted}).`,
        'info'
      );
    }
  };

  // Esegui geofencing automatico all'apertura del terminale di campo
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      runGpsGeofencing();
    }
  }, []);

  // Check saved draft on mount
  useEffect(() => {
    const saved = getOfflineRolDraft();
    if (saved && (!saved.descrizioneLavori || saved.oreOrdinarie !== 8 || saved.cantiereId)) {
      setPendingDraft(saved);
    }
  }, []);

  // Save glove mode preference
  const toggleGloveMode = () => {
    setGloveMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('voltmaster_glove_mode', String(next));
      } catch {
        // Ignore
      }
      showToast(next ? '🧤 Modalità Guanti Cantiere Attivata (Pulsanti maggiorati & alto contrasto)' : 'Modalità Standard ripristinata', 'info');
      return next;
    });
  };

  // Restore draft handler
  const handleRestoreDraft = () => {
    if (!pendingDraft) return;
    if (pendingDraft.cantiereId) setSelectedCantiereId(pendingDraft.cantiereId);
    if (pendingDraft.workType) setWorkType(pendingDraft.workType);
    if (pendingDraft.subActivity) setSubActivity(pendingDraft.subActivity);
    if (pendingDraft.activityDescription !== undefined) setActivityDescription(pendingDraft.activityDescription);
    if (pendingDraft.oreOrdinarie !== undefined) setOreOrdinarie(pendingDraft.oreOrdinarie);
    if (pendingDraft.oreStraordinarie !== undefined) setOreStraordinarie(pendingDraft.oreStraordinarie);
    if (pendingDraft.hasTravel !== undefined) setHasTravel(pendingDraft.hasTravel);
    if (pendingDraft.hoursTravel !== undefined) setHoursTravel(pendingDraft.hoursTravel);
    if (pendingDraft.travelRoute) setTravelRoute(pendingDraft.travelRoute);
    if (pendingDraft.travelVehicleId) setTravelVehicleId(pendingDraft.travelVehicleId);
    if (pendingDraft.travelKm !== undefined) setTravelKm(pendingDraft.travelKm);
    if (pendingDraft.partsReplaced !== undefined) setPartsReplaced(pendingDraft.partsReplaced);
    if (pendingDraft.attivitaDescrizione) setAttivitaDescrizione(pendingDraft.attivitaDescrizione);
    if (pendingDraft.photos) setPhotos(pendingDraft.photos);
    setPendingDraft(null);
    showToast('Bozza ripristinata con successo!', 'success');
  };

  const handleDiscardDraft = () => {
    clearOfflineRolDraft();
    setPendingDraft(null);
    showToast('Bozza rimossa', 'info');
  };

  // Explicit save draft
  const handleExplicitSaveDraft = () => {
    saveOfflineRolDraft({
      cantiereId: selectedCantiereId,
      workType,
      subActivity,
      activityDescription,
      oreOrdinarie,
      oreStraordinarie,
      hasTravel,
      hoursTravel,
      travelRoute,
      travelVehicleId,
      travelKm,
      partsReplaced,
      attivitaDescrizione,
      photos,
      updatedAt: new Date().toLocaleTimeString('it-IT'),
    });
    showToast('Bozza salvata localmente sul telefono! Potrai riprenderla in qualsiasi momento.', 'success');
  };

  // Steppers for Glove Mode
  const handleStepOrdinarie = (delta: number) => {
    setOreOrdinarie((prev) => Math.max(0, Math.min(24, Math.round((prev + delta) * 2) / 2)));
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleStepStraordinarie = (delta: number) => {
    setOreStraordinarie((prev) => Math.max(0, Math.min(16, Math.round((prev + delta) * 2) / 2)));
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  // Synchronize queued offline items
  const handleSyncQueuedRols = () => {
    const queue = getQueuedOfflineRols();
    if (queue.length === 0) {
      showToast('Nessuna scheda offline in coda da inviare.', 'info');
      return;
    }

    let syncedCount = 0;
    queue.forEach((item) => {
      try {
        addROL(item.rolData);
        removeQueuedOfflineRol(item.id);
        syncedCount++;
      } catch (err) {
        console.error('Error syncing queued ROL:', err);
      }
    });

    setQueuedOfflineRols(getQueuedOfflineRols());
    showToast(`✅ Sincronizzazione completata: ${syncedCount} ${syncedCount === 1 ? 'scheda ROL trasmessa' : 'schede ROL trasmesse'} al server!`, 'success');
  };

  // Automatic sync when returning online
  useEffect(() => {
    if (network.isOnline && queuedOfflineRols.length > 0) {
      handleSyncQueuedRols();
    }
  }, [network.isOnline]);

  const currentCantiere = cantieri.find((c) => c.id === selectedCantiereId) || cantieri[0];
  const cantiereLavorazioni = lavorazioni.filter((l) => l.cantiereId === selectedCantiereId);
  const currentWorkDef = WORK_TYPE_DEFINITIONS.find((w) => w.type === workType) || WORK_TYPE_DEFINITIONS[0];

  // Dynamic calculations
  const hoursWork = oreOrdinarie + oreStraordinarie;
  const effectiveHoursTravel = hasTravel ? hoursTravel : 0;
  const totalHours = hoursWork + effectiveHoursTravel;

  // My recent ROLs
  const myRols = rols.filter(
    (r) => r.operatoreId === currentUser.id || r.operatoreNome.toLowerCase() === currentUser.name.toLowerCase()
  );

  const handleMobilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setIsCompressingPhotos(true);

    try {
      let totalOrig = 0;
      let totalComp = 0;
      const newCompressedPhotos: string[] = [];

      for (const file of files) {
        // Compressione Canvas ottimizzata per cantiere: max 1600px, qualità 0.78 JPEG
        const result = await compressImageFile(file, {
          maxWidth: 1600,
          quality: 0.78,
          format: 'image/jpeg',
        });
        totalOrig += result.originalSize;
        totalComp += result.compressedSize;
        newCompressedPhotos.push(result.dataUrl);
      }

      setPhotos((prev) => [...prev, ...newCompressedPhotos]);

      const percent = totalOrig > 0 ? Math.round(((totalOrig - totalComp) / totalOrig) * 100) : 0;
      const stat = {
        originalSize: formatFileSize(totalOrig),
        compressedSize: formatFileSize(totalComp),
        savedPercent: percent,
      };
      setLastCompressionStat(stat);

      showToast(
        `⚡ Foto compressa con successo: ${stat.originalSize} ➔ ${stat.compressedSize} (-${stat.savedPercent}%)`,
        'success'
      );
    } catch (err) {
      console.error('Errore compressione foto cantiere:', err);
      showToast('Errore durante la compressione dell\'immagine.', 'error');
    } finally {
      setIsCompressingPhotos(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmitQuickROL = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCantiere) {
      showToast('Seleziona un cantiere valido', 'error');
      return;
    }

    // 1. Controllo di Idoneità Sanitaria e Sicurezza Cantiere D.Lgs 81/08
    const currentDip = dipendenti.find((d) => d.id === currentUser.id || d.email === currentUser.email);
    if (currentDip && currentDip.visitaMedicaScadenza) {
      const scadenza = new Date(currentDip.visitaMedicaScadenza);
      const oggi = new Date('2026-10-08');
      if (scadenza < oggi) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 80, 100, 80, 200]);
        }
        showToast(
          `🚨 BLOCCO SICUREZZA D.LGS 81/08: Idoneità medica scaduta il ${currentDip.visitaMedicaScadenza}. Accesso al cantiere e timbratura sospesi a norma di legge.`,
          'error'
        );
        return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }

    let travelDetails: TravelDetails | null = null;
    if (hasTravel) {
      const selectedVeh = veicoli.find((v) => v.id === travelVehicleId);
      travelDetails = {
        vehicleId: selectedVeh ? selectedVeh.id : (travelVehicleId || 'VEI-CUSTOM'),
        vehiclePlate: selectedVeh ? selectedVeh.targa : 'TARGA-AZ',
        vehicleName: selectedVeh ? `${selectedVeh.modello} (${selectedVeh.targa})` : 'Mezzo Aziendale',
        route: travelRoute || `Sede -> ${currentCantiere.titolo}`,
        km: travelKm || 0,
      };
    }

    // 2. Apposizione Sigillo Digitale Crittografico SHA-256 (se firmato dal cliente)
    let sigilloDigitale: any = undefined;
    if (abilitaFirmaEInvioCliente && signatureData) {
      sigilloDigitale = await generateRolDigitalSeal(
        {
          data: new Date().toISOString().split('T')[0],
          operatoreId: currentUser.id,
          operatoreNome: currentUser.name,
          cantiereId: currentCantiere.id,
          cantiereTitolo: currentCantiere.titolo,
          clienteNome: currentCantiere.clienteNome,
          workType,
          oreOrdinarie,
          oreStraordinarie,
          oreTotali: totalHours,
          descrizioneLavori: attivitaDescrizione,
        },
        signatureData.name,
        signatureData.timestamp,
        signatureData.url,
        geofenceResult?.coords ? { lat: geofenceResult.coords.latitude, lng: geofenceResult.coords.longitude } : undefined
      );
    }

    const rolPayload = {
      data: new Date().toISOString().split('T')[0],
      operatoreId: currentUser.id,
      operatoreNome: currentUser.name,
      collaboratori: selectedCollaboratori,
      cantiereId: currentCantiere.id,
      cantiereTitolo: currentCantiere.titolo,
      clienteNome: currentCantiere.clienteNome,
      
      workType,
      subActivity,
      activityDescription: activityDescription || undefined,

      oreOrdinarie,
      oreStraordinarie,
      hoursWork,
      hasTravel,
      hoursTravel: effectiveHoursTravel,
      travelDetails,
      oreTotali: totalHours,
      totalHours,

      partsReplaced: partsReplaced || undefined,
      photos,

      descrizioneLavori: attivitaDescrizione,
      materialiUtilizzati: [],
      abilitaFirmaEInvioCliente,
      stato: abilitaFirmaEInvioCliente && signatureData ? ('inviato' as const) : ('bozza' as const),
      firmaClientePresente: abilitaFirmaEInvioCliente && !!signatureData,
      firmaClienteNome: abilitaFirmaEInvioCliente ? signatureData?.name : undefined,
      firmaClienteDataUrl: abilitaFirmaEInvioCliente ? signatureData?.url : undefined,
      firmaClienteTimestamp: abilitaFirmaEInvioCliente ? signatureData?.timestamp : undefined,
      bloccatoModifiche: abilitaFirmaEInvioCliente && !!signatureData,
      sigilloDigitale,
    };

    if (!network.isOnline) {
      // Offline mode: enqueue safely
      enqueueOfflineRol(rolPayload);
      const offlineCreated = addROL(rolPayload);
      clearOfflineRolDraft();
      setQueuedOfflineRols(getQueuedOfflineRols());
      setLastCreatedRol(offlineCreated);
      showToast(
        sigilloDigitale
          ? `🔒 Assenza Rete: Rapportino ${offlineCreated.numero} sigillato con hash SHA-256 e salvato localmente!`
          : `⚡ Assenza Rete: Rapportino ${offlineCreated.numero} salvato in memoria locale (${offlineCreated.oreTotali}h).`,
        'success'
      );
    } else {
      // Normal online flow
      const newRol = addROL(rolPayload);
      clearOfflineRolDraft();
      setLastCreatedRol(newRol);
      showToast(
        sigilloDigitale
          ? `🔒 Rapportino ${newRol.numero} registrato e sigillato digitalmente con hash SHA-256 (valore legale ex art. 2702 c.c.)!`
          : `Rapportino ${newRol.numero} registrato con successo!`,
        'success'
      );
    }

    setSelectedCollaboratori([]);
    setPhotos([]);
    setPartsReplaced('');
    setHasTravel(false);
    setSignatureData(null);
    setAbilitaFirmaEInvioCliente(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-16">
      {/* Hidden file input for camera */}
      <input
        type="file"
        ref={mobileFileInputRef}
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleMobilePhotoUpload}
      />

      {/* Network & Offline Status Banner */}
      <div
        className={`px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
          network.isOnline
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300'
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300 animate-pulse'
        }`}
      >
        <div className="flex items-center gap-2">
          {network.isOnline ? (
            <Wifi className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>
            {network.isOnline
              ? 'Connessione Dati Attiva · Sincronizzazione ROL & Cantiere in tempo reale'
              : 'Dispositivo Offline · Il ROL verrà salvato localmente e inviato appena torna la rete'}
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
          {network.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Operator Role Header Banner */}
      <div className="p-3 sm:p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <HardHat className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-slate-600 dark:text-slate-300">
            Profilo attivo:{' '}
            <strong className="text-slate-900 dark:text-slate-100">{currentUser.name}</strong> ·{' '}
            <span className="text-amber-600 dark:text-amber-400 font-mono uppercase font-bold">
              {currentUser.reparto === 'capocantiere'
                ? 'Capocantiere'
                : currentUser.reparto === 'operaio'
                ? 'Operaio Specializzato'
                : currentUser.reparto === 'apprendista'
                ? 'Apprendista'
                : 'Operatore Tecnico'}
            </span>
          </span>
        </div>
      </div>

      {/* In-App PWA Install Banner on Mobile */}
      <PWAInstallButton variant="banner" />

      {/* Glove & Outdoor High-Contrast Mode Toggle */}
      <div className={`p-3 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
        gloveMode
          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-400/50'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
            gloveMode ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}>
            🧤
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs sm:text-sm font-black ${gloveMode ? 'text-slate-950' : 'text-slate-900 dark:text-white'}`}>
                Modalità Guanti Cantiere & Outdoor
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                gloveMode ? 'bg-slate-950 text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {gloveMode ? 'ATTIVA' : 'Disattivata'}
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 ${gloveMode ? 'text-slate-900 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
              Pulsanti touch maggiorati (≥56px), stepper orari rapidi e alto contrasto per utilizzo sotto il sole
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleGloveMode}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            gloveMode ? 'bg-slate-950' : 'bg-slate-300 dark:bg-slate-700'
          }`}
          role="switch"
          aria-checked={gloveMode}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              gloveMode ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Pending Offline Queued Outbox Banner */}
      {queuedOfflineRols.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black flex items-center gap-2">
                <span>Coda Fuori Linea: {queuedOfflineRols.length} {queuedOfflineRols.length === 1 ? 'scheda ROL salvata' : 'schede ROL salvate'} in memoria locale</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Salvate in assenza di rete. {network.isOnline ? 'Connessione disponibile: puoi trasmetterle ora!' : 'In attesa di connessione internet...'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncQueuedRols}
            disabled={!network.isOnline}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow ${
              network.isOnline
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sincronizza Ora ({queuedOfflineRols.length})</span>
          </button>
        </div>
      )}

      {/* Recover Unsubmitted Draft Alert Banner */}
      {pendingDraft && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shrink-0">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                Trovata una bozza compilata precedentemente ({pendingDraft.updatedAt || 'Recente'})
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                Vuoi riprendere la compilazione dove avevi interrotto?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              Ripristina Bozza
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs transition-colors"
            >
              Scarta
            </button>
          </div>
        </div>
      )}

      {/* Richiesta Materiali & Attrezzature Cantiere - Quick Action Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-white to-amber-500/10 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20 border border-amber-500/30 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                Campo ➔ Magazzino
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Richiesta Materiali & Attrezzature
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Invia la distinta al magazziniere con notifica push/email per spedizione DDT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsRichiestaModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <PackagePlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Compila Richiesta</span>
          </button>
          <button
            onClick={() => setActiveTab('richieste_materiali')}
            className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Vedi registro richieste"
          >
            Vedi Tutte
          </button>
        </div>
      </div>

      {/* Guided Workflow Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={openScanner}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-cyan-500/50 text-left transition-all active:scale-95 group"
        >
          <QrCode className="w-5 h-5 text-cyan-500 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">1. Riconosci Cantiere</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scansiona codice all'ingresso</div>
        </button>

        <button
          onClick={onOpenFlussoCantiere}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/50 text-left transition-all active:scale-95 group"
        >
          <PlayCircle className="w-5 h-5 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">2. Flusso Guidato</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Wizard step-by-step</div>
        </button>

        <button
          onClick={() => setActiveTab('rol')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 text-left transition-all active:scale-95 group"
        >
          <Clock className="w-5 h-5 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">3. Tutti i ROL</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Storico e dettagli</div>
        </button>

        <button
          onClick={() => setActiveTab('magazzino')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 text-left transition-all active:scale-95 group"
        >
          <Warehouse className="w-5 h-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">4. Materiali Furgone</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cavi, morsetti e quadri</div>
        </button>
      </div>

      {/* Zona Verde & Carico Mezzi Campo */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white">Carico Materiali da Zona Verde</h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-mono px-2 py-0.5 rounded-full font-bold">
                  {pacchiZonaVerde.filter((p) => p.statoTransito === 'PRONTO_ZONA_VERDE').length} PRONTI
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Inquadra il QR Code del segnacollo A5 prima di partire per registrare la presa in carico
              </p>
            </div>
          </div>

          <button
            onClick={openScanner}
            className="w-full sm:w-auto min-h-[44px] justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scansiona QR</span>
          </button>
        </div>

        {/* Quick list of packages ready for pickup */}
        {pacchiZonaVerde.filter((p) => p.statoTransito === 'PRONTO_ZONA_VERDE').length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {pacchiZonaVerde
              .filter((p) => p.statoTransito === 'PRONTO_ZONA_VERDE')
              .slice(0, 2)
              .map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-emerald-400">{pkg.id}</span>
                      <span className="text-[10px] text-slate-400 font-mono">[{pkg.codiceCantiere}]</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                      {pkg.cantiereTitolo}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {pkg.furgoneAssegnato ? `Mezzo: ${pkg.furgoneAssegnato}` : 'Qualsiasi mezzo'} · {pkg.righeMateriale.length} art.
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setSelectedPaccoStampa(pkg)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      title="Vedi Segnacollo A5"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActivePaccoCaricoModal(pkg)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Carica</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Quick Timbratura ROL Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Timbratura & Rapportino Fine Giornata (ROL)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Registra cantiere/officina/manutenzione, ore lavoro, trasferte e ricambi
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitQuickROL} className="space-y-4">
          {/* Geofencing GPS Auto-Selection Bar */}
          <div className="rounded-xl border p-3 transition-all space-y-2 bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Crosshair className={`w-4 h-4 ${isLocatingGps ? 'text-amber-500 animate-spin' : geofenceResult?.matchedCantiere ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                <span>Geofencing Cantiere Automatico (GPS)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => runGpsGeofencing()}
                  disabled={isLocatingGps}
                  className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-amber-400 text-slate-700 dark:text-slate-300 text-[11px] font-medium rounded-lg flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                  title="Rileva coordinate GPS dal browser"
                >
                  <Radio className={`w-3 h-3 ${isLocatingGps ? 'text-amber-500 animate-ping' : 'text-emerald-500'}`} />
                  <span>{isLocatingGps ? 'Rilevamento...' : 'Aggiorna GPS'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSimulatedPicker(!showSimulatedPicker)}
                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all"
                  title="Simula posizione per collaudo immediato"
                >
                  <Compass className="w-3 h-3 text-amber-500" />
                  <span>Test GPS</span>
                </button>
              </div>
            </div>

            {/* Geofencing Match Banner */}
            {isLocatingGps ? (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                <span>Acquisizione segnale GPS in corso... Ricerca cantieri nel raggio di 500m...</span>
              </div>
            ) : geofenceResult?.matchedCantiere ? (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-lg flex items-start justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                      RILEVATO IN CANTIERE:
                    </span>
                    <span className="font-bold underline truncate">{geofenceResult.matchedCantiere.titolo}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-bold">
                      a {geofenceResult.matchInfo?.distanceFormatted}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300/80 flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Commessa pre-selezionata automaticamente (0 click). Nessun errore di cantiere.</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setManualCantiereOverride(!manualCantiereOverride)}
                  className="px-2 py-1 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold rounded shrink-0 shadow-xs"
                >
                  {manualCantiereOverride ? 'Blocca su GPS' : 'Cambia'}
                </button>
              </div>
            ) : geofenceResult?.closestCantiere ? (
              <div className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2">
                <div className="truncate text-[11px]">
                  <span>Nessun cantiere entro 500m. Più vicino: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{geofenceResult.closestCantiere.cantiere.titolo}</span>
                  <span className="text-slate-500"> ({geofenceResult.closestCantiere.distanceFormatted})</span>
                </div>
              </div>
            ) : null}

            {gpsError && (
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                ⚠️ {gpsError} Puoi selezionare il cantiere manualmente dalla lista.
              </div>
            )}

            {/* Simulated GPS Location Quick Test Bar */}
            {showSimulatedPicker && (
              <div className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-2 mt-2">
                <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>Simulazione Posizione Geofencing (Collaudo rapido & Audit):</span>
                  <button
                    type="button"
                    onClick={() => setShowSimulatedPicker(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Chiudi
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {SIMULATED_GPS_LOCATIONS.map((sim) => (
                    <button
                      key={sim.id}
                      type="button"
                      onClick={() => {
                        runGpsGeofencing({ latitude: sim.latitude, longitude: sim.longitude, label: sim.label });
                        setShowSimulatedPicker(false);
                      }}
                      className="p-1.5 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded text-[11px] transition-colors"
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{sim.label}</div>
                      <div className="text-[9px] text-slate-500">{sim.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cantiere Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Seleziona Cantiere / Commessa:
              </label>
              {geofenceResult?.matchedCantiere && !manualCantiereOverride && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" />
                  Sincronizzato GPS
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cantieri.slice(0, 6).map((c) => {
                const isSelected = selectedCantiereId === c.id;
                const isGpsMatched = geofenceResult?.matchedCantiere?.id === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCantiereId(c.id);
                      setManualCantiereOverride(true);
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all relative ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/30 font-semibold'
                        : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{c.titolo}</div>
                      {isGpsMatched && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                          📍 GPS
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">{c.citta} · {c.clienteNome}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MACRO-CATEGORIA ATTIVITÀ */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Tipologia di Lavorazione:</span>
            </label>

            <div className="grid grid-cols-3 gap-1.5">
              {WORK_TYPE_DEFINITIONS.map((w) => {
                const isSelected = workType === w.type;
                const Icon = w.icon;
                return (
                  <button
                    key={w.type}
                    type="button"
                    onClick={() => {
                      setWorkType(w.type);
                      setSubActivity(w.subActivities[0]?.id || '');
                    }}
                    className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] leading-tight">{w.badgeLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Sotto-attività */}
            <div className="pt-1">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Sotto-attività:
              </label>
              <select
                value={subActivity}
                onChange={(e) => setSubActivity(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                {currentWorkDef.subActivities.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dispositivo / Oggetto */}
            <div>
              <input
                type="text"
                placeholder={
                  workType === 'manutenzione_riparazione'
                    ? 'Dispositivo riparato (es. Inverter Sungrow SH10RT)'
                    : workType === 'officina'
                    ? 'Quadro cablato (es. Quadro QEG-02)'
                    : 'Dettaglio impianto (es. Dorsale Passerella A)'
                }
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Ore Ordinarie e Straordinarie */}
          <div className="space-y-4">
            {/* Ore Ordinarie */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              gloveMode
                ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/80 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Ore Lavoro Ordinarie:</span>
                </label>
                <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100">
                  {oreOrdinarie} h
                </span>
              </div>

              {/* Steppers & Display */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStepOrdinarie(-1)}
                  className={`flex-1 ${gloveMode ? 'h-14 text-sm' : 'h-10 text-xs'} bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-black flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer`}
                  title="-1 ora"
                >
                  -1h
                </button>
                <button
                  type="button"
                  onClick={() => handleStepOrdinarie(-0.5)}
                  className={`flex-1 ${gloveMode ? 'h-14 text-sm' : 'h-10 text-xs'} bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-black flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer`}
                  title="-0.5 ore"
                >
                  -0.5h
                </button>

                <div className={`w-24 ${gloveMode ? 'h-14 text-2xl' : 'h-10 text-lg'} bg-white dark:bg-slate-900 border-2 ${gloveMode ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'} rounded-xl font-black font-mono flex items-center justify-center shadow-xs shrink-0`}>
                  {oreOrdinarie}
                </div>

                <button
                  type="button"
                  onClick={() => handleStepOrdinarie(0.5)}
                  className={`flex-1 ${gloveMode ? 'h-14 text-sm' : 'h-10 text-xs'} bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-black flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer`}
                  title="+0.5 ore"
                >
                  +0.5h
                </button>
                <button
                  type="button"
                  onClick={() => handleStepOrdinarie(1)}
                  className={`flex-1 ${gloveMode ? 'h-14 text-sm' : 'h-10 text-xs'} bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-black flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer`}
                  title="+1 ora"
                >
                  +1h
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div className="grid grid-cols-4 gap-1.5 pt-2">
                {[
                  { label: '4h (Mezza)', val: 4 },
                  { label: '8h (Turno)', val: 8 },
                  { label: '9h (+1h)', val: 9 },
                  { label: '10h (Pieno)', val: 10 },
                ].map((chip) => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => {
                      setOreOrdinarie(chip.val);
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      oreOrdinarie === chip.val
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ore Straordinarie */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              gloveMode
                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700/80 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-rose-500" />
                  <span>Ore Lavoro Straordinarie:</span>
                </label>
                <span className="font-mono text-base font-black text-rose-600 dark:text-rose-400">
                  {oreStraordinarie} h
                </span>
              </div>

              {/* Steppers & Display */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStepStraordinarie(-1)}
                  className={`flex-1 ${gloveMode ? 'h-14 text-sm' : 'h-10 text-xs'} bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-black flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer`}
                  title="-1 ora"
                >
                  -1h
                </button>
                <button
                  type="button"
                  onClick={() => handleStepStraordinarie(-0.5)}
                  className={`flex-1 ${gloveMode ? 'h-14 text-sm' : 'h-10 text-xs'} bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-black flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer`}
                  title="-0.5 ore"
                >
                  -0.5h
                </button>

                <div className={`w-24 ${gloveMode ? 'h-14 text-2xl' : 'h-10 text-lg'} bg-white dark:bg-slate-900 border-2 ${gloveMode ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-slate-300 dark:border-slate-700 text-rose-600 dark:text-rose-400'} rounded-xl font-black font-mono flex items-center justify-center shadow-xs shrink-0`}>
                  {oreStraordinarie}
                </div>

                <button
                  type="button"
                  onClick={() => handleStepStraordinarie(0.5)}
                  className={`flex-1 ${gloveMode ? 'h-14 text-sm' : 'h-10 text-xs'} bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-black flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer`}
                  title="+0.5 ore"
                >
                  +0.5h
                </button>
                <button
                  type="button"
                  onClick={() => handleStepStraordinarie(1)}
                  className={`flex-1 ${gloveMode ? 'h-14 text-sm' : 'h-10 text-xs'} bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-black flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer`}
                  title="+1 ora"
                >
                  +1h
                </button>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-2">
                {[
                  { label: '0h (Zero)', val: 0 },
                  { label: '+1.0h', val: 1 },
                  { label: '+2.0h', val: 2 },
                  { label: '+3.0h', val: 3 },
                ].map((chip) => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => {
                      setOreStraordinarie(chip.val);
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      oreStraordinarie === chip.val
                        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GESTIONE ORE DI VIAGGIO (TOGGLE DISATTIVATO DI DEFAULT) */}
          <div className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
            hasTravel
              ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800/80'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className={`w-4 h-4 ${hasTravel ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Includi ore di viaggio / trasferta
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {hasTravel ? 'Ore viaggio aggiunte al totale' : 'Disattivato di default (0h viaggio)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHasTravel(!hasTravel)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hasTravel ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'
                }`}
                role="switch"
                aria-checked={hasTravel}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    hasTravel ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Travel Input Fields when ON */}
            {hasTravel && (
              <div className="pt-2 border-t border-indigo-200 dark:border-indigo-900/60 space-y-2 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-950 dark:text-indigo-200 mb-0.5">
                      Ore Viaggio (h):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={hoursTravel}
                      onChange={(e) => setHoursTravel(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded font-mono font-bold text-indigo-900 dark:text-indigo-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-950 dark:text-indigo-200 mb-0.5">
                      Mezzo utilizzato:
                    </label>
                    <select
                      value={travelVehicleId}
                      onChange={(e) => setTravelVehicleId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded text-xs text-slate-900 dark:text-slate-100"
                    >
                      {veicoli.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.targa} - {v.modello}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Tratta (es. Sede VoltMaster -> Cantiere)"
                    value={travelRoute}
                    onChange={(e) => setTravelRoute(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded text-[11px] text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {/* Dynamic summary */}
            <div className="pt-1.5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Riepilogo ore:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {hoursWork}h lavoro {hasTravel && `+ ${effectiveHoursTravel}h viaggio`} = <strong>{totalHours} Ore Totali</strong>
              </span>
            </div>
          </div>

          {/* Ricambi e Foto veloci con Compressione Automatica */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-emerald-500" />
                <span>Ricambi / Note Materiali:</span>
              </span>
              <button
                type="button"
                onClick={() => mobileFileInputRef.current?.click()}
                disabled={isCompressingPhotos}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isCompressingPhotos ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>{isCompressingPhotos ? 'Compressione...' : `Foto (${photos.length})`}</span>
              </button>
            </div>

            {/* Compression Indicator / Stats Banner */}
            {isCompressingPhotos && (
              <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center gap-2 text-xs text-cyan-800 dark:text-cyan-300 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>Compressione WebP/JPEG in corso via Canvas (riduzione da 12-48MP)...</span>
              </div>
            )}

            {lastCompressionStat && !isCompressingPhotos && (
              <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold flex items-center gap-1">
                  <span>⚡ Ottimizzazione completata:</span>
                  <span className="line-through text-slate-400">{lastCompressionStat.originalSize}</span>
                  <span>➔</span>
                  <span className="font-bold">{lastCompressionStat.compressedSize}</span>
                </span>
                <span className="font-mono font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded text-[10px]">
                  -{lastCompressionStat.savedPercent}%
                </span>
              </div>
            )}

            <input
              type="text"
              placeholder="es. Sostituito fusibile 15A e scaricatore SPD"
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
            />

            {/* Photo preview chips */}
            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pt-1">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative w-16 h-12 rounded overflow-hidden shrink-0 border border-slate-400 group">
                    <img src={p} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] text-emerald-400 text-center font-mono font-bold">
                      ⚡ COMPRESSA
                    </span>
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Descrizione Lavori */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descrizione Lavorazioni Eseguite:
            </label>
            <textarea
              rows={2}
              value={attivitaDescrizione}
              onChange={(e) => setAttivitaDescrizione(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-400"
              placeholder="es. Posa canali metallici, infilaggio cavi dorsale, verifica quadri..."
            />
          </div>

          {/* Squad / Coworkers */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Squadra di Lavoro (Colleghi presenti oggi):</span>
              </label>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
                {selectedCollaboratori.length > 0
                  ? `+${selectedCollaboratori.length} ${selectedCollaboratori.length === 1 ? 'collega' : 'colleghi'}`
                  : 'Solo tu'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {dipendenti
                .filter((d) => d.id !== currentUser.id && d.reparto !== 'contabilita')
                .slice(0, 6)
                .map((d) => {
                  const isSelected = selectedCollaboratori.some((c) => c.id === d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCollaboratori((prev) => prev.filter((c) => c.id !== d.id));
                        } else {
                          setSelectedCollaboratori((prev) => [
                            ...prev,
                            {
                              id: d.id,
                              nome: `${d.nome} ${d.cognome}`,
                              ruolo: d.ruoloAziendale,
                              oreOrdinarie,
                              oreStraordinarie,
                            },
                          ]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-500/50 shadow-xs font-bold'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3 h-3 text-cyan-500" />
                      ) : (
                        <UserPlus className="w-3 h-3 text-slate-400" />
                      )}
                      <span>
                        {d.nome} {d.cognome[0]}.
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Option: Firma e Invio al Cliente */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg border ${
                    abilitaFirmaEInvioCliente
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <FileSignature className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Firma e Invio al Cliente
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        abilitaFirmaEInvioCliente
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {abilitaFirmaEInvioCliente ? 'ATTIVATA' : 'DISATTIVATA (Predefinita)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {abilitaFirmaEInvioCliente
                      ? 'Richiede la firma touch del committente sul posto.'
                      : 'Uso interno cantiere e contabilità.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAbilitaFirmaEInvioCliente((prev) => {
                    const nextVal = !prev;
                    if (!nextVal) setSignatureData(null);
                    return nextVal;
                  });
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  abilitaFirmaEInvioCliente ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-800'
                }`}
                role="switch"
                aria-checked={abilitaFirmaEInvioCliente}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    abilitaFirmaEInvioCliente ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {abilitaFirmaEInvioCliente && (
              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  {signatureData ? (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Firma acquisita da {signatureData.name}
                    </span>
                  ) : (
                    <span>Fai apporre la firma touch al committente:</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSigning(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    signatureData
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                  }`}
                >
                  {signatureData ? 'Modifica Firma Touch' : 'Acquisisci Firma Touch'}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons: Save Local Draft & Confirm ROL */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              className={`w-full ${
                gloveMode
                  ? 'min-h-[64px] text-base bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-slate-950 shadow-xl ring-2 ring-amber-400/40'
                  : 'py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 text-sm'
              } active:scale-[0.99] font-black rounded-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer`}
            >
              <CheckCircle2 className={`${gloveMode ? 'w-6 h-6' : 'w-5 h-5'} fill-slate-950 text-amber-500`} />
              <span>
                {abilitaFirmaEInvioCliente
                  ? `Conferma, Firma e Invia (${totalHours}h)`
                  : network.isOnline
                  ? `Salva Rapportino in Cantiere (${totalHours}h)`
                  : `Salva al 100% Offline sul Telefono (${totalHours}h)`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleExplicitSaveDraft}
              className={`w-full ${
                gloveMode ? 'min-h-[50px] text-xs' : 'py-2 text-xs'
              } bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer`}
              title="Salva temporaneamente la scheda senza finalizzarla"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Salva Bozza Temporanea (Riprendi più tardi)</span>
            </button>
          </div>
        </form>
      </div>

      {/* Signature Modal */}
      {isSigning && (
        <SignatureModal
          cantiereTitolo={currentCantiere.titolo}
          clienteNome={currentCantiere.clienteNome}
          rolNumero="ROL-BOZZA-CAMPO"
          onClose={() => setIsSigning(false)}
          onSaveSignature={(dataUrl: string, signerName: string, timestamp: string) => {
            setSignatureData({
              url: dataUrl,
              name: signerName,
              timestamp,
            });
            setIsSigning(false);
            showToast('Firma cliente acquisita!', 'success');
          }}
        />
      )}

      {/* Print / Preview modal for last created ROL */}
      {lastCreatedRol && (
        <ROLPrintModal rol={lastCreatedRol} onClose={() => setLastCreatedRol(null)} />
      )}

      {/* Nuova Richiesta Materiali & Attrezzature Modal */}
      <NuovaRichiestaMaterialiModal
        isOpen={isRichiestaModalOpen}
        onClose={() => setIsRichiestaModalOpen(false)}
        preselectedCantiereId={selectedCantiereId}
      />
    </div>
  );
};
