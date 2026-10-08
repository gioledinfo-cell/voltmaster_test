export type ScanEntityType = 'mezzo' | 'attrezzatura' | 'operatore' | 'cantiere' | 'materiale';

export interface GeoLocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number; // in metri
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface ScanEventRecord {
  scanId: string;
  entityId: string;
  entityType: ScanEntityType;
  entityName: string;
  entityCode: string;
  scannedBy: string;
  operatorId: string;
  timestamp: string; // ISO 8601 (es. "2026-10-04T16:05:00Z")
  location: GeoLocationPoint | null;
  locationError?: string | null;
  currentStatus: string; // es. "In cantiere", "Preso in carico", "Rilasciato", "In uso", "Inizio turno"
  notes?: string;
  cantiereRiferimentoId?: string;
  cantiereRiferimentoNome?: string;
  indirizzoApprossimativo?: string;
}
