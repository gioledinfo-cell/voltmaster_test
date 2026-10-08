import { GeoLocationPoint } from '../types/gpsScan';

export interface GeolocationResult {
  location: GeoLocationPoint | null;
  error: string | null;
  permissionStatus?: 'granted' | 'denied' | 'prompt' | 'unsupported';
}

/**
 * Standard known landmark coordinates in Lombardy & Northern Italy for VoltMaster operations
 */
export const KNOWN_OPERATIONAL_COORDINATES = {
  sedeCentrale: {
    name: 'VoltMaster Sede Centrale & Magazzino',
    address: 'Via dell’Artigianato 18, Milano',
    latitude: 45.4982,
    longitude: 9.2215,
  },
  cantiereSanRaffaele: {
    name: 'Cantiere Ospedale San Raffaele',
    address: 'Via Olgettina 60, Milano',
    latitude: 45.5054,
    longitude: 9.2661,
  },
  cantiereGreenNovara: {
    name: 'Cantiere Fotovoltaico Logistica Green',
    address: 'Interporto Est - SS11, Novara',
    latitude: 45.4469,
    longitude: 8.6206,
  },
  cantiereLeVele: {
    name: 'Cantiere Residenziale Le Vele',
    address: 'Corso Sempione 142, Milano',
    latitude: 45.4851,
    longitude: 9.1608,
  },
  cantiereEquinix: {
    name: 'Cantiere Data Center Tier IV Equinix',
    address: 'Via Caldera 21, Milano',
    latitude: 45.4673,
    longitude: 9.0984,
  },
  depositoSesto: {
    name: 'Hub Flotta & Deposito Sesto San Giovanni',
    address: 'Viale Italia 400, Sesto San Giovanni',
    latitude: 45.5342,
    longitude: 9.2394,
  },
};

/**
 * Automatically requests browser geolocation permissions and retrieves exact coordinates.
 * In case of rejection, timeout, or lack of GPS hardware, returns a non-blocking error description.
 */
export const getBrowserGpsPosition = async (
  timeoutMs: number = 7000
): Promise<GeolocationResult> => {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      location: null,
      error: 'Geolocalizzazione non supportata da questo browser o dispositivo.',
      permissionStatus: 'unsupported',
    };
  }

  return new Promise((resolve) => {
    let resolved = false;

    // Safety timeout in case the browser prompt hangs or is ignored
    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          location: null,
          error: 'Tempo scaduto per la risposta del GPS (timeout 7s).',
        });
      }
    }, timeoutMs + 1000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(safetyTimer);

        const point: GeoLocationPoint = {
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy || 10),
          altitude: position.coords.altitude !== null ? Math.round(position.coords.altitude) : null,
          heading: position.coords.heading !== null ? Math.round(position.coords.heading) : null,
          speed: position.coords.speed !== null ? parseFloat(position.coords.speed.toFixed(1)) : null,
        };

        resolve({
          location: point,
          error: null,
          permissionStatus: 'granted',
        });
      },
      (geoError) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(safetyTimer);

        let userMsg = 'Errore geolocalizzazione sconosciuto.';
        let permStatus: 'denied' | 'prompt' = 'prompt';

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            userMsg = 'Permessi GPS negati dall’utente nel browser. Scansione registrata senza coordinate.';
            permStatus = 'denied';
            break;
          case geoError.POSITION_UNAVAILABLE:
            userMsg = 'Segnale GPS non disponibile (es. ambiente interrato o schermato).';
            break;
          case geoError.TIMEOUT:
            userMsg = 'Rilevamento posizione GPS scaduto per timeout.';
            break;
        }

        resolve({
          location: null,
          error: userMsg,
          permissionStatus: permStatus,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 15000, // accept cached location up to 15s old for quick scans
      }
    );
  });
};

/**
 * Formats coordinates for clear human-readable display (e.g., 45.4982° N, 9.2215° E)
 */
export const formatCoordinates = (lat?: number | null, lng?: number | null): string => {
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return 'Coordinate non disponibili';
  }
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
};

/**
 * Calculates distance in kilometers between two GPS points using the Haversine formula
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};
