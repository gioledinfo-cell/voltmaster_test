import { Cantiere } from '../types';

export interface GeofenceMatch {
  cantiere: Cantiere;
  distanceMeters: number;
  distanceFormatted: string;
  isInsideGeofence: boolean;
  radiusMeters: number;
}

export interface GeofenceDetectionResult {
  matchedCantiere: Cantiere | null;
  matchInfo: GeofenceMatch | null;
  allNearbyMatches: GeofenceMatch[];
  closestCantiere: GeofenceMatch | null;
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp: string;
}

/**
 * Calcola la distanza in metri tra due coordinate geografiche (lat/lng)
 * utilizzando la formula trigonometrica dell'emisenoverso (Haversine Formula).
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raggio terrestre medio in metri
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Formatta i metri in una stringa leggibile (es. "45 m", "1.2 km")
 */
export function formatDistanceHuman(meters: number): string {
  if (meters < 20) {
    return 'Sul posto (< 20 m)';
  }
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Analizza la posizione corrente dell'operaio rispetto all'elenco dei cantieri attivi.
 * Identifica se l'operaio si trova fisicamente all'interno del perimetro di un cantiere
 * (raggio geofence configurabile, default 500m).
 */
export function detectActiveCantiereByGeofence(
  latitude: number,
  longitude: number,
  cantieri: Cantiere[],
  defaultRadiusMeters: number = 500
): GeofenceDetectionResult {
  const matches: GeofenceMatch[] = [];

  for (const cantiere of cantieri) {
    // Ricava le coordinate del cantiere
    const cLat = cantiere.lat ?? cantiere.coordinate?.lat;
    const cLng = cantiere.lng ?? cantiere.coordinate?.lng;

    if (cLat === undefined || cLng === undefined) {
      continue;
    }

    const radius = cantiere.raggioGeofenceMetri || defaultRadiusMeters;
    const distanceMeters = calculateDistanceMeters(latitude, longitude, cLat, cLng);
    const isInside = distanceMeters <= radius;

    matches.push({
      cantiere,
      distanceMeters,
      distanceFormatted: formatDistanceHuman(distanceMeters),
      isInsideGeofence: isInside,
      radiusMeters: radius,
    });
  }

  // Ordina per distanza crescente
  matches.sort((a, b) => a.distanceMeters - b.distanceMeters);

  const closest = matches.length > 0 ? matches[0] : null;
  // Match attivo se il cantiere più vicino è all'interno del raggio
  const matched = closest && closest.isInsideGeofence ? closest : null;

  return {
    matchedCantiere: matched ? matched.cantiere : null,
    matchInfo: matched,
    allNearbyMatches: matches,
    closestCantiere: closest,
    coords: {
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
    },
    timestamp: new Date().toLocaleTimeString('it-IT'),
  };
}

/**
 * Punti GPS simulati predefiniti per test, collaudo rapido e audit in ambiente browser / desktop
 */
export const SIMULATED_GPS_LOCATIONS = [
  {
    id: 'sim-san-luca',
    label: '🏥 Presenza in cantiere: Ospedale San Luca (Milano)',
    cantiereId: 'CNT-01',
    latitude: 45.4741,
    longitude: 9.1861,
    desc: 'Simula operaio a 15 metri dal quadro MT/BT (San Luca)',
  },
  {
    id: 'sim-amazon-hub',
    label: '📦 Presenza in cantiere: Amazon Hub FV (Novara)',
    cantiereId: 'CNT-02',
    latitude: 45.4468,
    longitude: 8.6205,
    desc: 'Simula operaio sul tetto dell’interporto logistico (Novara)',
  },
  {
    id: 'sim-terrazze',
    label: '🏢 Presenza in cantiere: Le Terrazze (Monza)',
    cantiereId: 'CNT-03',
    latitude: 45.5844,
    longitude: 9.2743,
    desc: 'Simula operaio negli alloggi domotici (Monza)',
  },
  {
    id: 'sim-sede',
    label: '🏢 Fuori Cantiere: VoltMaster Sede Centrale (Milano)',
    cantiereId: null,
    latitude: 45.4982,
    longitude: 9.2215,
    desc: 'Simula operaio in officina/magazzino sede (nessun cantiere nel raggio)',
  },
];
