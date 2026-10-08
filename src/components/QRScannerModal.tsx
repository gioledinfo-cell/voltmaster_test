import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  ScanLine,
  ArrowRight,
  Sparkles,
  AlertCircle,
  MapPin,
  Compass,
  CheckCircle2,
  RefreshCw,
  HardHat,
  Truck,
  Wrench,
  Package,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getBrowserGpsPosition, formatCoordinates, KNOWN_OPERATIONAL_COORDINATES } from '../services/geolocationService';
import { GeoLocationPoint } from '../types/gpsScan';

interface QRScannerModalProps {
  onClose: () => void;
  onCodeScanned: (
    code: string,
    options?: { currentStatus?: string; notes?: string; forcedLocation?: GeoLocationPoint }
  ) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ onClose, onCodeScanned }) => {
  const { cantieri, magazzino, attrezzature, veicoli, dipendenti, pacchiZonaVerde } = useApp();

  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // GPS state
  const [isLocating, setIsLocating] = useState(true);
  const [gpsLocation, setGpsLocation] = useState<GeoLocationPoint | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('In cantiere');
  const [scanNotes, setScanNotes] = useState<string>('Scansione inizio attività');
  const [locationPreset, setLocationPreset] = useState<string>('auto');

  // Request browser geolocation automatically upon opening the modal
  const fetchLocation = async () => {
    setIsLocating(true);
    setGpsError(null);
    const result = await getBrowserGpsPosition(6000);
    if (result.location) {
      setGpsLocation(result.location);
      setGpsError(null);
    } else {
      setGpsLocation(null);
      setGpsError(result.error);
    }
    setIsLocating(false);
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  // Handle camera video stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (cameraActive && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setCameraError(
            'Fotocamera non disponibile o permessi negati nel browser. Usa la selezione rapida sottostante.'
          );
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraActive]);

  // Handle location preset override (for testing in desktop environments)
  const getActiveLocationForScan = (): GeoLocationPoint | undefined => {
    if (locationPreset === 'auto') {
      return gpsLocation || undefined;
    }
    const preset = KNOWN_OPERATIONAL_COORDINATES[locationPreset as keyof typeof KNOWN_OPERATIONAL_COORDINATES];
    if (preset) {
      return {
        latitude: preset.latitude,
        longitude: preset.longitude,
        accuracy: 10,
        altitude: 120,
      };
    }
    return gpsLocation || undefined;
  };

  const handleTriggerScan = (code: string) => {
    const forcedLoc = getActiveLocationForScan();
    onCodeScanned(code, {
      currentStatus: selectedStatus,
      notes: scanNotes,
      forcedLocation: forcedLoc,
    });
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleTriggerScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
            <ScanLine className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Scanner QR Code & GPS Automatico</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-mono font-bold">
                GEO-LIVE
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tracciamento geografico istantaneo di mezzi, attrezzature e cantieri
            </p>
          </div>
        </div>

        {/* Real-time GPS Acquisition Status Banner */}
        <div className="mb-4 p-3 rounded-xl border transition-colors bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin
                className={`w-4 h-4 ${
                  isLocating
                    ? 'text-amber-500 animate-spin'
                    : gpsLocation
                    ? 'text-emerald-500'
                    : 'text-amber-500'
                }`}
              />
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Stato Rilevamento GPS:
              </span>
            </div>

            <button
              type="button"
              onClick={fetchLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-medium"
              title="Riprova acquisizione GPS"
            >
              <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Acquisizione...' : 'Rileva di nuovo'}</span>
            </button>
          </div>

          <div className="mt-1 text-xs">
            {isLocating ? (
              <div className="text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1.5 pt-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Richiesta permessi browser e acquisizione coordinate satellitari...</span>
              </div>
            ) : gpsLocation ? (
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-mono text-[11px] pt-0.5">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {formatCoordinates(gpsLocation.latitude, gpsLocation.longitude)}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-sans text-[10px]">
                  Accuratezza: ±{gpsLocation.accuracy}m
                </span>
              </div>
            ) : (
              <div className="text-amber-700 dark:text-amber-400 text-[11px] pt-0.5 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  {gpsError || 'GPS disattivato o non consentito.'}{' '}
                  <span className="text-slate-500 dark:text-slate-400">
                    (Scansione permessa con fallback non bloccante a geolocalizzazione nulla).
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Location simulation override for testing in dev environments */}
          <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Punto GPS per la scansione:</span>
            <select
              value={locationPreset}
              onChange={(e) => setLocationPreset(e.target.value)}
              className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-[11px] text-slate-800 dark:text-slate-200"
            >
              <option value="auto">
                🛰️ Rilevamento Reale Browser {gpsLocation ? `(±${gpsLocation.accuracy}m)` : '(In attesa)'}
              </option>
              <option value="cantiereSanRaffaele">📍 Cantiere Ospedale San Raffaele (Milano)</option>
              <option value="cantiereGreenNovara">📍 Cantiere Fotovoltaico Green (Novara)</option>
              <option value="cantiereLeVele">📍 Cantiere Residenziale Le Vele (Milano)</option>
              <option value="cantiereEquinix">📍 Cantiere Data Center Equinix (Milano)</option>
              <option value="sedeCentrale">🏢 VoltMaster Sede Centrale & Magazzino</option>
              <option value="depositoSesto">🚚 Hub Flotta Sesto San Giovanni</option>
            </select>
          </div>
        </div>

        {/* Scan Status & Notes Configuration */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Stato / Azione al momento della scansione:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
            >
              <option value="In cantiere">In cantiere</option>
              <option value="Preso in carico">Preso in carico</option>
              <option value="Rilasciato">Rilasciato / Rientro</option>
              <option value="In uso">In uso / Verifiche</option>
              <option value="Inizio turno">Inizio turno</option>
              <option value="Fine turno">Fine turno</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note di campo:
            </label>
            <input
              type="text"
              value={scanNotes}
              onChange={(e) => setScanNotes(e.target.value)}
              placeholder="es. Inizio turno o verifica isolamento"
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
            />
          </div>
        </div>

        {/* Camera Viewport or Mock Scanner Frame */}
        <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col items-center justify-center p-4 mb-4">
          {cameraActive ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-xs">
                <Camera className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                Scansione con Fotocamera Smartphone / Tablet
              </p>
              <button
                type="button"
                onClick={() => setCameraActive(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                Attiva Fotocamera
              </button>
            </div>
          )}

          {/* Scanner Overlay Crosshair */}
          <div className="absolute inset-6 border-2 border-dashed border-amber-500/60 rounded-lg pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-amber-400/80 shadow-[0_0_12px_#f59e0b] animate-bounce" />
          </div>

          {cameraError && (
            <div className="absolute bottom-2 inset-x-2 bg-amber-950/90 border border-amber-800 text-amber-200 text-[11px] p-2 rounded flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {/* Manual Code Input */}
        <form onSubmit={handleSubmitManual} className="mb-4">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Oppure digita o incolla il codice identificativo:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="es. QR-CNT-2026-001, QR-VEC-FP482EK o VM-PACKAGE:PK-2026-042"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 min-h-[44px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-95 flex items-center justify-center"
            >
              Registra con GPS
            </button>
          </div>
        </form>

        {/* Quick Simulator Codes for Field Testing */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Scansione rapida con GPS (Mezzi, Attrezzature, Cantieri):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            {/* Quick Test Pacchi Zona Verde */}
            {pacchiZonaVerde.slice(0, 2).map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleTriggerScan(pkg.qrCode)}
                className="col-span-1 sm:col-span-2 flex items-center justify-between p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-left transition-colors group"
              >
                <div className="truncate pr-2">
                  <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>{pkg.id} · ZONA VERDE ({pkg.statoTransito === 'PRONTO_ZONA_VERDE' ? 'PRONTO AL CARICO' : 'CARICATO'})</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    [{pkg.codiceCantiere}] {pkg.cantiereTitolo}
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400">
                    Furgone: {pkg.furgoneAssegnato || 'Da assegnare'} · {pkg.righeMateriale.length} articoli distinte
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            ))}

            {veicoli.slice(0, 2).map((v) => (
              <button
                key={v.id}
                onClick={() => handleTriggerScan(v.qrCode || `QR-VEC-${v.targa.replace(/\s+/g, '')}`)}
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition-colors group"
              >
                <div className="truncate pr-2">
                  <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>{v.targa}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {v.modello}
                  </div>
                  <div className="text-[10px] text-slate-500">Assegnato: {v.autistaAssegnatoNome || 'Libero'}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors shrink-0" />
              </button>
            ))}

            {cantieri.slice(0, 1).map((c) => (
              <button
                key={c.id}
                onClick={() => handleTriggerScan(c.qrCode)}
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition-colors group"
              >
                <div className="truncate pr-2">
                  <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <HardHat className="w-3 h-3" />
                    <span>{c.codice}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {c.titolo}
                  </div>
                  <div className="text-[10px] text-slate-500">{c.citta}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors shrink-0" />
              </button>
            ))}

            {attrezzature.slice(0, 1).map((a) => (
              <button
                key={a.id}
                onClick={() => handleTriggerScan(a.qrCode)}
                className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition-colors group"
              >
                <div className="truncate pr-2">
                  <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    <span>{a.codiceUnivoco}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {a.nome}
                  </div>
                  <div className="text-[10px] text-slate-500">Stato: {a.stato}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
