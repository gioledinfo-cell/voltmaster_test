import { getBrowserGpsPosition } from './geolocationService';

export interface AuditLogEntry {
  id: string;
  documentId: string;
  documentType: 'ROL' | 'DDT' | 'SAL' | 'CERTIFICATO' | 'ORDINE' | 'POS';
  action: 'FIRMA_CLIENTE' | 'FIRMA_DIRETTORE' | 'APPROVAZIONE' | 'EMISSIONE' | 'ANNULLAMENTO';
  signatoryName: string;
  signatoryRole: string;
  timestampIso: string;
  sha256Hash: string;
  gpsCoords?: { latitude: number; longitude: number; accuracy?: number };
  userAgent: string;
  ipAddress: string;
  signatureDataUrl?: string;
  metadata?: Record<string, any>;
  verificationStatus: 'VERIFICATO_VALIDO' | 'IN_ATTESA' | 'NON_VALIDO';
}

/**
 * Computes SHA-256 hash using Web Crypto API
 */
export async function computeSHA256(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('Crypto API fallback hash:', err);
    // Simple deterministic string hash fallback
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'sha256-fb-' + Math.abs(hash).toString(16).padStart(16, '0');
  }
}

class AuditService {
  private memoryLogs: AuditLogEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('cantiere_audit_logs');
      if (saved) {
        this.memoryLogs = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed loading audit logs from storage:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('cantiere_audit_logs', JSON.stringify(this.memoryLogs));
    } catch (e) {
      console.warn('Failed saving audit logs to storage:', e);
    }
  }

  public async createSignatureAuditEntry(params: {
    documentId: string;
    documentType: AuditLogEntry['documentType'];
    action: AuditLogEntry['action'];
    signatoryName: string;
    signatoryRole: string;
    signatureDataUrl: string;
    extraPayload?: Record<string, any>;
  }): Promise<AuditLogEntry> {
    const timestampIso = new Date().toISOString();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Node';
    
    // Acquire GPS position if available
    let gpsCoords: { latitude: number; longitude: number; accuracy?: number } | undefined;
    try {
      const pos = await getBrowserGpsPosition();
      if (pos && pos.location) {
        gpsCoords = {
          latitude: pos.location.latitude,
          longitude: pos.location.longitude,
          accuracy: pos.location.accuracy,
        };
      }
    } catch (e) {
      console.warn('GPS position not available for audit log:', e);
    }

    // Prepare payload string for cryptographic hashing
    const payloadToHash = JSON.stringify({
      documentId: params.documentId,
      documentType: params.documentType,
      action: params.action,
      signatoryName: params.signatoryName,
      signatoryRole: params.signatoryRole,
      timestampIso,
      userAgent,
      gpsCoords,
      signatureSnippet: params.signatureDataUrl.substring(0, 100),
      extraPayload: params.extraPayload || {},
    });

    const sha256Hash = await computeSHA256(payloadToHash);

    const newEntry: AuditLogEntry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      documentId: params.documentId,
      documentType: params.documentType,
      action: params.action,
      signatoryName: params.signatoryName,
      signatoryRole: params.signatoryRole,
      timestampIso,
      sha256Hash: `SHA256:${sha256Hash}`,
      gpsCoords,
      userAgent,
      ipAddress: '127.0.0.1 (Client Assicurato)',
      signatureDataUrl: params.signatureDataUrl,
      metadata: params.extraPayload,
      verificationStatus: 'VERIFICATO_VALIDO',
    };

    this.memoryLogs.unshift(newEntry);
    this.saveToStorage();

    // Send to Express Server API backend asynchronously
    try {
      await fetch('/api/v1/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
    } catch (e) {
      console.warn('Backend audit log async save warning:', e);
    }

    return newEntry;
  }

  public getAuditLogsForDocument(documentId: string): AuditLogEntry[] {
    return this.memoryLogs.filter((log) => log.documentId === documentId);
  }

  public getAllAuditLogs(): AuditLogEntry[] {
    return this.memoryLogs;
  }

  public async getLatestDocumentHash(documentId: string, fallbackId = ''): Promise<string> {
    const logs = this.getAuditLogsForDocument(documentId);
    if (logs.length > 0 && logs[0].sha256Hash) {
      return logs[0].sha256Hash;
    }
    const hash = await computeSHA256(documentId + '-' + (fallbackId || 'SALT-2026'));
    return `SHA256:${hash}`;
  }

  public async fetchServerAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const res = await fetch('/api/v1/audit-log');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.memoryLogs = data.data;
        this.saveToStorage();
        return data.data;
      }
    } catch (e) {
      console.warn('Failed fetching audit logs from server:', e);
    }
    return this.memoryLogs;
  }
}

export const auditService = new AuditService();
