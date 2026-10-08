import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Truck,
  Wrench,
  Building2,
  HardHat,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  User,
  Compass,
  ScanLine,
  RefreshCw,
  Trash2,
  Layers,
  ChevronRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Eye,
  Navigation,
  Activity,
  Sliders,
  Sparkles,
  Route,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScanEventRecord, ScanEntityType } from '../../types/gpsScan';
import { formatCoordinates } from '../../services/geolocationService';

// Time formatting helper for relative time (e.g. "10 minuti fa")
function getRelativeTime(timestampStr: string): string {
  try {
    const time = new Date(timestampStr).getTime();
    const now = new Date('2026-10-04T15:00:00Z').getTime(); // Synchronized to app simulation time
    const diffSeconds = Math.max(0, Math.floor((now - time) / 1000));
    
    if (diffSeconds < 60) return 'Proprio adesso';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minuti fa`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ore fa`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} giorni fa`;
  } catch (e) {
    return 'Recente';
  }
}

// Status badge styling helper
function getStatusStyle(status: string) {
  const s = status.toLowerCase();
  if (s.includes('attivo') || s.includes('in uso') || s.includes('inizio') || s.includes('ok')) {
    return {
      bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-500',
    };
  }
  if (s.includes('transito') || s.includes('viaggio') || s.includes('carico')) {
    return {
      bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      dot: 'bg-amber-500',
    };
  }
  if (s.includes('manutenzione') || s.includes('guasto') || s.includes('fermo')) {
    return {
      bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      dot: 'bg-rose-500',
    };
  }
  return {
    bg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    dot: 'bg-sky-500',
  };
}

export const AdminMapView: React.FC = () => {
  const { gpsScans, deleteScanRecord, clearScanRecords, openScanner, cantieri, veicoli, dipendenti, attrezzature } = useApp();

  // Map DOM and instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const geofenceLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  // Filter States
  const [showCantieri, setShowCantieri] = useState(true);
  const [showMezzi, setShowMezzi] = useState(true);
  const [showAttrezzature, setShowAttrezzature] = useState(true);
  const [showOperatori, setShowOperatori] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);

  // Time Range Filter (by hours of the day or time slice)
  const [timeFilter, setTimeFilter] = useState<'tutto' | 'mattina' | 'pomeriggio' | 'sera' | 'ultime2h'>('tutto');
  const [hourSlider, setHourSlider] = useState<number>(24); // 24 = all hours

  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Active / Selected item for detail inspection
  const [selectedScan, setSelectedScan] = useState<ScanEventRecord | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapTileStyle, setMapTileStyle] = useState<'standard' | 'dark' | 'satellite'>('standard');
  const [isTrackingRoute, setIsTrackingRoute] = useState(false);

  // Filtered dataset
  const filteredScans = useMemo(() => {
    return gpsScans.filter((scan) => {
      // 1. Entity Type visibility toggle
      if (scan.entityType === 'cantiere' && !showCantieri) return false;
      if (scan.entityType === 'mezzo' && !showMezzi) return false;
      if (scan.entityType === 'attrezzatura' && !showAttrezzature) return false;
      if (scan.entityType === 'operatore' && !showOperatori) return false;
      if (scan.entityType === 'materiale' && !showAttrezzature) return false;

      // 2. Time Range filtering
      const scanDate = new Date(scan.timestamp);
      const scanHour = scanDate.getUTCHours() + 2; // Approximate local CEST hour
      
      if (hourSlider < 24) {
        if (scanHour > hourSlider) return false;
      }

      if (timeFilter === 'mattina') {
        if (scanHour < 6 || scanHour >= 12) return false;
      } else if (timeFilter === 'pomeriggio') {
        if (scanHour < 12 || scanHour >= 18) return false;
      } else if (timeFilter === 'sera') {
        if (scanHour < 18 || scanHour >= 24) return false;
      } else if (timeFilter === 'ultime2h') {
        const diffHours = (new Date('2026-10-04T15:00:00Z').getTime() - scanDate.getTime()) / (1000 * 3600);
        if (diffHours > 2) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          scan.entityName.toLowerCase().includes(q) ||
          scan.entityCode.toLowerCase().includes(q) ||
          scan.scannedBy.toLowerCase().includes(q) ||
          scan.currentStatus.toLowerCase().includes(q) ||
          (scan.notes && scan.notes.toLowerCase().includes(q)) ||
          (scan.cantiereRiferimentoNome && scan.cantiereRiferimentoNome.toLowerCase().includes(q)) ||
          (scan.indirizzoApprossimativo && scan.indirizzoApprossimativo.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [gpsScans, showCantieri, showMezzi, showAttrezzature, showOperatori, timeFilter, hourSlider, searchQuery]);

  const scansWithCoordinates = useMemo(() => {
    return filteredScans.filter((s) => s.location !== null);
  }, [filteredScans]);

  // Counts by category
  const countCantieri = gpsScans.filter((s) => s.entityType === 'cantiere').length;
  const countMezzi = gpsScans.filter((s) => s.entityType === 'mezzo').length;
  const countAttrezzi = gpsScans.filter((s) => s.entityType === 'attrezzatura').length;
  const countOperatori = gpsScans.filter((s) => s.entityType === 'operatore').length;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around Milan / Lombardy
    const map = L.map(mapContainerRef.current, {
      center: [45.485, 9.20],
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | VoltMaster Telematics',
      maxZoom: 19,
    }).addTo(map);

    geofenceLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when style changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Invert CSS on map container for dark mode look if requested
    if (mapContainerRef.current) {
      if (mapTileStyle === 'dark') {
        mapContainerRef.current.style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
      } else {
        mapContainerRef.current.style.filter = 'none';
      }
    }
  }, [mapTileStyle]);

  // Render Markers, Geofences, and Popups
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    const geofenceGroup = geofenceLayerGroupRef.current;
    const routeGroup = routeLayerGroupRef.current;

    if (!map || !markersGroup || !geofenceGroup || !routeGroup) return;

    markersGroup.clearLayers();
    geofenceGroup.clearLayers();
    routeGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // Sort scans by timestamp ascending for routing
    const sortedScans = [...scansWithCoordinates].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // If route tracking is active, draw connecting polyline for the selected entity or fleet
    if (isTrackingRoute && selectedScan) {
      const entityScans = sortedScans.filter((s) => s.entityId === selectedScan.entityId);
      if (entityScans.length > 1) {
        const polylinePoints: L.LatLngTuple[] = entityScans.map((s) => [
          s.location!.latitude,
          s.location!.longitude,
        ]);
        const polyline = L.polyline(polylinePoints, {
          color: '#f59e0b',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
        });
        routeGroup.addLayer(polyline);
      }
    }

    scansWithCoordinates.forEach((scan) => {
      if (!scan.location) return;

      const { latitude, longitude, accuracy } = scan.location;
      const latLng: L.LatLngTuple = [latitude, longitude];
      bounds.extend(latLng);

      const relativeTime = getRelativeTime(scan.timestamp);
      const exactTime = new Date(scan.timestamp).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Distinct visual configurations per resource type
      let pinColor = '#f59e0b'; // amber
      let iconEmoji = '📍';
      let typeLabel = 'Asset';
      let iconBorder = 'border-amber-400';

      if (scan.entityType === 'cantiere') {
        pinColor = '#10b981'; // emerald
        iconEmoji = '🏗️';
        typeLabel = 'Cantiere';
        iconBorder = 'border-emerald-400';

        // Add Cantiere Geofence polygon / action radius circle
        if (showGeofences) {
          const geofenceCircle = L.circle(latLng, {
            radius: 250, // 250 meters perimeter
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.14,
            weight: 2,
            dashArray: '4, 6',
          });
          geofenceGroup.addLayer(geofenceCircle);
        }
      } else if (scan.entityType === 'mezzo') {
        pinColor = '#f59e0b'; // amber/orange
        iconEmoji = '🚜';
        typeLabel = 'Mezzo';
        iconBorder = 'border-amber-400';
      } else if (scan.entityType === 'attrezzatura') {
        pinColor = '#8b5cf6'; // purple/indigo
        iconEmoji = '🔧';
        typeLabel = 'Attrezzatura';
        iconBorder = 'border-purple-400';
      } else if (scan.entityType === 'operatore') {
        pinColor = '#f43f5e'; // rose/red
        iconEmoji = '👷';
        typeLabel = 'Operatore';
        iconBorder = 'border-rose-400';
      }

      const isCurrentSelected = selectedScan?.scanId === scan.scanId;

      // Custom HTML Marker using Leaflet divIcon
      const customIcon = L.divIcon({
        className: 'custom-resource-marker',
        iconSize: [44, 52],
        iconAnchor: [22, 50],
        popupAnchor: [0, -46],
        html: `
          <div style="position: relative; width: 44px; height: 52px; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <!-- Outer Pin Shape -->
            <div style="
              width: 38px;
              height: 38px;
              border-radius: 50% 50% 50% 0;
              background: ${pinColor};
              transform: rotate(-45deg);
              box-shadow: ${isCurrentSelected ? '0 0 0 4px #ffffff, 0 0 16px rgba(245, 158, 11, 0.9)' : '0 4px 12px rgba(0,0,0,0.35)'};
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: transform 0.2s ease;
            ">
              <span style="transform: rotate(45deg); font-size: 17px; line-height: 1; user-select: none;">
                ${iconEmoji}
              </span>
            </div>
            <!-- Ground Anchor Shadow -->
            <div style="
              width: 10px;
              height: 5px;
              border-radius: 50%;
              background: rgba(0,0,0,0.35);
              filter: blur(1px);
              margin-top: -1px;
            "></div>
          </div>
        `,
      });

      const marker = L.marker(latLng, { icon: customIcon });

      // Rich HTML Popup Content
      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 250px; padding: 4px 2px; color: #0f172a;">
          <!-- Header Bar -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 14px;">${iconEmoji}</span>
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: ${pinColor}22; color: ${pinColor}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${pinColor}44;">
                ${typeLabel}
              </span>
            </div>
            <span style="font-size: 10px; font-family: monospace; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 1px 5px; border-radius: 4px;">
              ${scan.entityCode}
            </span>
          </div>

          <!-- Entity Name -->
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; line-height: 1.3; margin-bottom: 6px;">
            ${scan.entityName}
          </div>

          <!-- Operational Status -->
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${pinColor};"></span>
            <span style="font-size: 11px; font-weight: 700; color: #334155;">
              Stato: <span style="color: ${pinColor};">${scan.currentStatus}</span>
            </span>
          </div>

          <!-- Details Grid -->
          <div style="font-size: 11px; color: #475569; display: grid; grid-template-columns: 1fr; gap: 4px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Ultimo Rilevamento:</span>
              <strong style="color: #0f172a;">${relativeTime}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Data e Ora Esatta:</span>
              <span style="font-family: monospace; font-size: 10px; color: #334155;">${exactTime}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Operatore / Rilevatore:</span>
              <strong style="color: #0f172a;">${scan.scannedBy}</strong>
            </div>
            ${
              scan.cantiereRiferimentoNome
                ? `<div style="display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Cantiere Rif.:</span>
                    <span style="color: #0f172a; font-weight: 600; text-align: right; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${scan.cantiereRiferimentoNome}
                    </span>
                  </div>`
                : ''
            }
          </div>

          <!-- Address & GPS Coordinates Badge -->
          <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 8px; font-size: 10px; font-family: monospace; color: #334155; margin-bottom: 6px;">
            <div style="color: #0f172a; font-weight: 600; margin-bottom: 2px;">📍 ${scan.indirizzoApprossimativo || 'Coordinate GPS rilevate'}</div>
            <div style="color: #64748b; font-size: 9px;">GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (±${accuracy}m)</div>
          </div>

          ${
            scan.notes
              ? `<div style="font-size: 10px; font-style: italic; color: #64748b; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 4px 6px; margin-top: 4px;">
                  "${scan.notes}"
                </div>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedScan(scan);
      });

      markersGroup.addLayer(marker);
    });

    // Auto-fit bounds if we have valid markers
    if (scansWithCoordinates.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [scansWithCoordinates, showGeofences, selectedScan, isTrackingRoute]);

  // Handle Quick Zoom to resource on search or list click
  const handleFocusResource = (scan: ScanEventRecord) => {
    setSelectedScan(scan);
    if (scan.location && mapInstanceRef.current) {
      mapInstanceRef.current.setView([scan.location.latitude, scan.location.longitude], 16, {
        animate: true,
        duration: 0.8,
      });
      // Find matching marker and open popup
      markersLayerGroupRef.current?.eachLayer((layer: any) => {
        const latLng = layer.getLatLng?.();
        if (
          latLng &&
          Math.abs(latLng.lat - scan.location!.latitude) < 0.0001 &&
          Math.abs(latLng.lng - scan.location!.longitude) < 0.0001
        ) {
          layer.openPopup();
        }
      });
    }
  };

  // Center on User's browser position
  const handleCenterOnUser = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15, {
            animate: true,
          });
        },
        (err) => {
          console.warn('Geolocation warning:', err);
        }
      );
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'ID Scansione',
      'Tipo Risorsa',
      'Nome Risorsa',
      'Codice / Targa',
      'Operatore Rilevatore',
      'Data e Ora (ISO)',
      'Latitudine',
      'Longitudine',
      'Accuratezza (m)',
      'Stato Operativo',
      'Indirizzo',
      'Cantiere Riferimento',
      'Note',
    ];

    const rows = filteredScans.map((s) => [
      `"${s.scanId}"`,
      `"${s.entityType}"`,
      `"${s.entityName.replace(/"/g, '""')}"`,
      `"${s.entityCode}"`,
      `"${s.scannedBy.replace(/"/g, '""')}"`,
      `"${s.timestamp}"`,
      s.location ? s.location.latitude : '',
      s.location ? s.location.longitude : '',
      s.location ? s.location.accuracy : '',
      `"${s.currentStatus}"`,
      `"${(s.indirizzoApprossimativo || '').replace(/"/g, '""')}"`,
      `"${(s.cantiereRiferimentoNome || '').replace(/"/g, '""')}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VoltMaster_Mappa_Monitoraggio_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Search Results for Quick Dropdown
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return gpsScans
      .filter(
        (s) =>
          s.entityName.toLowerCase().includes(q) ||
          s.entityCode.toLowerCase().includes(q) ||
          s.scannedBy.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchQuery, gpsScans]);

  return (
    <div
      ref={mapWrapperRef}
      className={`space-y-4 max-w-7xl mx-auto pb-12 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-4 overflow-y-auto max-w-none' : ''
      }`}
    >
      {/* 1. Header & Top Command Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Mappa Monitoraggio Risorse Live</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  ADMIN MONITOR
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tracciamento geospaziale integrato: Cantieri, Mezzi, Attrezzature e Operatori
              </p>
            </div>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={openScanner}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <ScanLine className="w-4 h-4" />
            <span>Nuova Scansione QR & GPS</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Esporta foglio di calcolo CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Esporta CSV</span>
          </button>

          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title={isFullscreen ? 'Riduci' : 'Schermo Intero'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Resource KPI Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Cantieri */}
        <div
          onClick={() => setShowCantieri((prev) => !prev)}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            showCantieri
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>Cantieri</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              {showCantieri ? 'Visibili' : 'Nascosti'}
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-800 dark:text-emerald-300 mt-1">
            {countCantieri}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Geofence & Perimetri attivi</div>
        </div>

        {/* Mezzi */}
        <div
          onClick={() => setShowMezzi((prev) => !prev)}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            showMezzi
              ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              <span>Mezzi & Furgoni</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
              {showMezzi ? 'Visibili' : 'Nascosti'}
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-800 dark:text-amber-300 mt-1">
            {countMezzi}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Posizioni flotta GPS</div>
        </div>

        {/* Attrezzature */}
        <div
          onClick={() => setShowAttrezzature((prev) => !prev)}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            showAttrezzature
              ? 'bg-purple-500/10 border-purple-500/40 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              <span>Attrezzature CEI</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300">
              {showAttrezzature ? 'Visibili' : 'Nascosti'}
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-purple-800 dark:text-purple-300 mt-1">
            {countAttrezzi}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Strumenti 64-8 localizzati</div>
        </div>

        {/* Operatori */}
        <div
          onClick={() => setShowOperatori((prev) => !prev)}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            showOperatori
              ? 'bg-rose-500/10 border-rose-500/40 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <HardHat className="w-4 h-4" />
              <span>Operatori in Campo</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300">
              {showOperatori ? 'Visibili' : 'Nascosti'}
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-800 dark:text-rose-300 mt-1">
            {countOperatori}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Presenze e timbrature</div>
        </div>
      </div>

      {/* 3. Search & Quick Auto-Zoom Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input with Auto-Complete dropdown */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca rapida per targa (es. FP 482 EK), codice (es. STR-CEI-01), mezzo, operatore o cantiere..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick Auto-Complete Suggestions */}
            {isSearchFocused && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-12 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-xs">
                <div className="p-2 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                  Risultati rapidi (Clicca per zoom automatico):
                </div>
                {searchSuggestions.map((item) => (
                  <div
                    key={item.scanId}
                    onMouseDown={() => {
                      handleFocusResource(item);
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-amber-500/10 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {item.entityType === 'cantiere'
                          ? '🏗️'
                          : item.entityType === 'mezzo'
                          ? '🚜'
                          : item.entityType === 'attrezzatura'
                          ? '🔧'
                          : '👷'}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.entityName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.entityCode} · {item.scannedBy}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      Centra
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time range quick tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs overflow-x-auto">
            {[
              { id: 'tutto', label: 'Tutto' },
              { id: 'ultime2h', label: 'Ultime 2h' },
              { id: 'mattina', label: 'Mattina (06-12)' },
              { id: 'pomeriggio', label: 'Pomeriggio (12-18)' },
              { id: 'sera', label: 'Sera (18-24)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  timeFilter === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Geofence Toggle */}
          <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showGeofences}
              onChange={(e) => setShowGeofences(e.target.checked)}
              className="rounded text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>Raggio Geofence Cantieri</span>
          </label>
        </div>
      </div>

      {/* 4. Main Two-Column Interactive Layout: Leaflet Map + Resource Monitoring Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Leaflet Map (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden relative">
          {/* Map Top Subheader */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>
                Mappa Telemetrica OpenStreetMap ({scansWithCoordinates.length} marker geolocalizzati)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCenterOnUser}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                title="Trova la mia posizione GPS"
              >
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>La mia posizione</span>
              </button>

              <button
                type="button"
                onClick={() => setMapTileStyle((prev) => (prev === 'standard' ? 'dark' : 'standard'))}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                title="Cambia tema visuale della mappa"
              >
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>{mapTileStyle === 'dark' ? 'Mappa Chiara' : 'Mappa Scura'}</span>
              </button>
            </div>
          </div>

          {/* Leaflet Map DOM Container */}
          <div ref={mapContainerRef} className="w-full h-[580px] z-0" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[400] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-[11px] space-y-1.5 select-none">
            <div className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-1">
              <span>Legenda Marker</span>
              <span className="text-[9px] text-slate-400 font-mono">OSM</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
              <span>
                <strong>🏗️ Cantieri</strong> (Area & Geofence 250m)
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 shadow-xs" />
              <span>
                <strong>🚜 Mezzi</strong> (Ultima scansione/viaggio)
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0 shadow-xs" />
              <span>
                <strong>🔧 Attrezzature</strong> (Check-in CEI 64-8)
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0 shadow-xs" />
              <span>
                <strong>👷 Operatori</strong> (Presenza & attività)
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Resource Sidebar Drawer & Detail Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active / Inspected Resource Detail Box */}
          {selectedScan ? (
            <div className="p-4 bg-white dark:bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-lg space-y-3 relative transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                    {selectedScan.entityType === 'cantiere'
                      ? '🏗️'
                      : selectedScan.entityType === 'mezzo'
                      ? '🚜'
                      : selectedScan.entityType === 'attrezzatura'
                      ? '🔧'
                      : '👷'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {selectedScan.entityType}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                        {selectedScan.entityCode}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mt-1 leading-snug">
                      {selectedScan.entityName}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedScan(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status and Relative Time */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Stato Operativo</span>
                  <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    {selectedScan.currentStatus}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Ultimo Rilevamento</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {getRelativeTime(selectedScan.timestamp)}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Operatore Rilevatore:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedScan.scannedBy}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Data e Ora Esatta:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {new Date(selectedScan.timestamp).toLocaleString('it-IT')}
                  </span>
                </div>

                {selectedScan.cantiereRiferimentoNome && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cantiere Rif.:</span>
                    <strong className="text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                      {selectedScan.cantiereRiferimentoNome}
                    </strong>
                  </div>
                )}

                {selectedScan.location ? (
                  <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                    <div className="text-slate-900 dark:text-slate-100 font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{selectedScan.indirizzoApprossimativo || 'Coordinate GPS'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>
                        {selectedScan.location.latitude.toFixed(4)}°N, {selectedScan.location.longitude.toFixed(4)}°E
                      </span>
                      <span>±{selectedScan.location.accuracy}m</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 text-amber-700 dark:text-amber-300 p-2 rounded-xl text-[11px]">
                    Coordinate GPS non disponibili per questa registrazione.
                  </div>
                )}

                {selectedScan.notes && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/20 text-[11px] italic text-slate-700 dark:text-slate-300">
                    "{selectedScan.notes}"
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handleFocusResource(selectedScan)}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors text-center flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Centra Zoom</span>
                </button>

                <button
                  onClick={() => setIsTrackingRoute((prev) => !prev)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors text-center flex items-center justify-center gap-1 border ${
                    isTrackingRoute
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Route className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isTrackingRoute ? 'Nascondi Rotta' : 'Traccia Rotta'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs text-center space-y-2 py-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Navigation className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Nessuna Risorsa Selezionata
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Fai clic su un marker sulla mappa o su un elemento dall'elenco sottostante per visualizzarne i dettagli operativi e centrare lo zoom.
              </p>
            </div>
          )}

          {/* Live Fleet & Asset List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>Risorse Rilevate ({filteredScans.length})</span>
              </h3>

              {gpsScans.length > 0 && (
                <button
                  type="button"
                  onClick={clearScanRecords}
                  className="text-[10px] text-rose-500 hover:underline font-semibold"
                >
                  Azzera Storico
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredScans.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Nessuna risorsa corrisponde ai filtri selezionati.
                </div>
              ) : (
                filteredScans.map((scan) => {
                  const isSelected = selectedScan?.scanId === scan.scanId;
                  const relativeTime = getRelativeTime(scan.timestamp);

                  let emoji = '📍';
                  let borderBadge = 'border-amber-500/40 text-amber-600 bg-amber-500/10';
                  if (scan.entityType === 'cantiere') {
                    emoji = '🏗️';
                    borderBadge = 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10';
                  } else if (scan.entityType === 'mezzo') {
                    emoji = '🚜';
                    borderBadge = 'border-amber-500/40 text-amber-600 bg-amber-500/10';
                  } else if (scan.entityType === 'attrezzatura') {
                    emoji = '🔧';
                    borderBadge = 'border-purple-500/40 text-purple-600 bg-purple-500/10';
                  } else if (scan.entityType === 'operatore') {
                    emoji = '👷';
                    borderBadge = 'border-rose-500/40 text-rose-600 bg-rose-500/10';
                  }

                  return (
                    <div
                      key={scan.scanId}
                      onClick={() => handleFocusResource(scan)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-slate-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-base shrink-0">{emoji}</span>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${borderBadge}`}>
                            {scan.entityType}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 truncate">
                            {scan.entityCode}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-slate-400 font-medium">{relativeTime}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteScanRecord(scan.scanId);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            title="Rimuovi"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                        {scan.entityName}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                        <span className="truncate">{scan.scannedBy}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">
                          {scan.currentStatus}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
