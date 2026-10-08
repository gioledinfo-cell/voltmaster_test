import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  FileCheck,
  Clock,
  MapPin,
  CheckCircle2,
  Lock,
  Globe,
  UserCheck,
  Copy,
  Check,
  Search,
  ExternalLink,
} from 'lucide-react';
import { auditService, AuditLogEntry } from '../services/auditService';

interface AuditTrailModalProps {
  documentId?: string;
  documentType?: string;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  documentId,
  documentType,
  onClose,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      await auditService.fetchServerAuditLogs();
      if (documentId) {
        setLogs(auditService.getAuditLogsForDocument(documentId));
      } else {
        setLogs(auditService.getAllAuditLogs());
      }
      setIsLoading(false);
    }
    loadLogs();
  }, [documentId]);

  const filteredLogs = logs.filter(
    (l) =>
      l.documentId.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.signatoryName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.sha256Hash.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-5">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Registro di Audit Immutabile & Verifiche Criptografiche
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                  ISO/IEC 27001
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {documentId
                  ? `Tracciabilità e firme con impronta SHA-256 per documento: ${documentId}`
                  : 'Registro generale di audit e validazione temporale firme cantiere'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Cerca per codice documento, firmatario o impronta SHA-256..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-amber-500 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
            {filteredLogs.length} registri trovati
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Caricamento e verifica firma criptografica in corso...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
              <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nessun registro di audit presente
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Le firme effettuate sui ROL, DDT o SAL generano automaticamente un record immutabile con marca temporale UTC e hash SHA-256.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-emerald-500/40 transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
                      {log.documentType}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {log.documentId}
                    </span>
                    <span className="text-xs text-slate-500">• {log.action.replace('_', ' ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.verificationStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs mb-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400">Firmatario</div>
                      <div className="font-semibold">{log.signatoryName}</div>
                      <div className="text-[10px] text-slate-500">{log.signatoryRole}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400">Marca Temporale UTC</div>
                      <div className="font-mono text-[11px] font-semibold">{new Date(log.timestampIso).toLocaleString('it-IT')}</div>
                      <div className="text-[10px] text-slate-500">{log.timestampIso}</div>
                    </div>
                  </div>

                  {log.gpsCoords ? (
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400">Geolocalizzazione Verificata</div>
                        <div className="font-mono text-[11px] font-semibold">
                          {log.gpsCoords.latitude.toFixed(5)}, {log.gpsCoords.longitude.toFixed(5)}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">GPS Accuratezza ±{Math.round(log.gpsCoords.accuracy || 10)}m</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400">Dispositivo Client</div>
                        <div className="font-mono text-[11px]">{log.ipAddress}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cryptographic SHA-256 Fingerprint */}
                <div className="p-2.5 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] flex items-center justify-between gap-2 overflow-hidden border border-slate-800">
                  <div className="flex items-center gap-2 truncate">
                    <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-slate-400 font-semibold shrink-0">SHA-256:</span>
                    <span className="truncate text-emerald-300 select-all">{log.sha256Hash}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(log.sha256Hash, log.id)}
                    className="p-1 text-slate-400 hover:text-white transition-colors shrink-0"
                    title="Copia Hash SHA-256"
                  >
                    {copiedId === log.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tutti i record sono protetti contro manomissioni e salvati su DB Server.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
