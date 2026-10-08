import React, { useState, useEffect } from 'react';
import {
  Fuel,
  X,
  Gauge,
  UserCheck,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { usePowerApps } from '../../context/PowerAppsContext';

interface ModuloRapidoRifornimentoProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVeicoloId?: string | null;
}

export const ModuloRapidoRifornimento: React.FC<ModuloRapidoRifornimentoProps> = ({
  isOpen,
  onClose,
  preselectedVeicoloId,
}) => {
  const { veicoli, dipendenti, addRifornimentoRapido, rifornimenti } = usePowerApps();

  const [veicoloId, setVeicoloId] = useState<string>('');
  const [operatore, setOperatore] = useState<string>('');
  const [litri, setLitri] = useState<string>('');
  const [km, setKm] = useState<string>('');
  const [totalizzatore, setTotalizzatore] = useState<string>('');
  const [dataOra, setDataOra] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize or update preselected vehicle
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDataOra(localIso);

      const targetId = preselectedVeicoloId || (veicoli.length > 0 ? veicoli[0].ID : '');
      setVeicoloId(targetId);

      // Prepopulate vehicle defaults
      const selectedV = veicoli.find((v) => v.ID === targetId);
      if (selectedV) {
        if (selectedV.Assegnato) {
          setOperatore(selectedV.Assegnato);
        }
        setKm(String(selectedV.Km_veicolo_Ultimo_Rifornimento ? selectedV.Km_veicolo_Ultimo_Rifornimento + 450 : ''));
      }

      // Calculate next default totalizer
      const lastRif = rifornimenti[0];
      const prevTot = lastRif ? lastRif.N_totalizzatore : 18500;
      setTotalizzatore(String(prevTot + 50));
    }
  }, [isOpen, preselectedVeicoloId, veicoli, rifornimenti]);

  // When vehicle changes, update suggested driver and previous km reference
  const handleVeicoloChange = (id: string) => {
    setVeicoloId(id);
    const selectedV = veicoli.find((v) => v.ID === id);
    if (selectedV) {
      if (selectedV.Assegnato) {
        setOperatore(selectedV.Assegnato);
      }
      const prevKm = selectedV.Km_veicolo_Ultimo_Rifornimento || 0;
      setKm(String(prevKm > 0 ? prevKm + 350 : ''));
    }
  };

  const selectedVeicolo = veicoli.find((v) => v.ID === veicoloId);
  const previousKm = selectedVeicolo?.Km_veicolo_Ultimo_Rifornimento || 0;

  // Real-time calculations
  const parsedKm = parseFloat(km) || 0;
  const parsedLitri = parseFloat(litri) || 0;
  const deltaKm = parsedKm > previousKm ? parsedKm - previousKm : 0;
  const liveKmL = deltaKm > 0 && parsedLitri > 0 ? (deltaKm / parsedLitri).toFixed(2) : null;
  const liveL100Km = deltaKm > 0 && parsedLitri > 0 ? ((parsedLitri / deltaKm) * 100).toFixed(2) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!veicoloId) {
      setErrorMsg('Seleziona un veicolo dalla flotta.');
      return;
    }
    if (!operatore) {
      setErrorMsg('Seleziona l\'operatore che effettua il rifornimento.');
      return;
    }
    if (!parsedLitri || parsedLitri <= 0) {
      setErrorMsg('Inserisci una quantità di carburante valida (litri > 0).');
      return;
    }
    if (!parsedKm || parsedKm <= 0) {
      setErrorMsg('Inserisci il chilometraggio attuale del veicolo.');
      return;
    }
    if (parsedKm < previousKm) {
      setErrorMsg(`I km inseriti (${parsedKm}) sono inferiori a quelli dell'ultimo rifornimento (${previousKm} km).`);
      return;
    }

    const result = addRifornimentoRapido({
      veicoloId,
      operatore,
      litri: parsedLitri,
      km: parsedKm,
      totalizzatore: parseFloat(totalizzatore) || undefined,
      note: note.trim(),
      dataOra: dataOra.replace('T', ' '),
    });

    if (result.success) {
      setSuccessMsg(result.message);
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      setErrorMsg(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 dark:text-slate-100 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/20 via-slate-50 to-white dark:from-amber-600/30 dark:via-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Modulo Rapido Rifornimento</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Registrazione cisterna aziendale & contachilometri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Veicolo Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Veicolo / Furgone Flotta <span className="text-amber-500 dark:text-amber-400">*</span>
            </label>
            <select
              value={veicoloId}
              onChange={(e) => handleVeicoloChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              required
            >
              <option value="">-- Seleziona Veicolo --</option>
              {veicoli.map((v) => (
                <option key={v.ID} value={v.ID}>
                  {v.Targa} - {v.Veicolo} ({v.Km_veicolo_Ultimo_Rifornimento ? `${v.Km_veicolo_Ultimo_Rifornimento} km` : 'Km N/D'})
                </option>
              ))}
            </select>
            {selectedVeicolo && (
              <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>Ultimo rifornimento: <strong className="text-slate-800 dark:text-slate-200">{previousKm} km</strong></span>
                <span className="text-amber-600 dark:text-amber-400 font-mono">{selectedVeicolo.Euro || 'Euro 6'}</span>
              </div>
            )}
          </div>

          {/* Operatore / Dipendente Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Operatore / Autista <span className="text-amber-500 dark:text-amber-400">*</span>
            </label>
            <div className="relative">
              <select
                value={operatore}
                onChange={(e) => setOperatore(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                required
              >
                <option value="">-- Seleziona Dipendente --</option>
                {dipendenti.map((d) => {
                  const fullName = `${d.Title} ${d.Cognome}`;
                  return (
                    <option key={d.Matricola} value={fullName}>
                      {fullName} ({d.Matricola}) - {d.Qualifica}
                    </option>
                  );
                })}
              </select>
              <UserCheck className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Litri & Km Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantità Litri */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Quantità Litri <span className="text-amber-500 dark:text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="500"
                  value={litri}
                  onChange={(e) => setLitri(e.target.value)}
                  placeholder="es. 55.0"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 pr-10 font-mono font-bold"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-amber-600 dark:text-amber-400 font-bold">Litri</span>
              </div>
            </div>

            {/* Km Attuali Veicolo */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Contachilometri (Km) <span className="text-amber-500 dark:text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min={previousKm}
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  placeholder={`min ${previousKm}`}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 pr-10 font-mono font-bold"
                  required
                />
                <Gauge className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Real-time Calculation Card */}
          {deltaKm > 0 && parsedLitri > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-slate-700 dark:text-slate-300">Tratta percorsa: <strong className="text-slate-900 dark:text-white font-mono">+{deltaKm} km</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                  {liveKmL} km/L
                </span>
                <span className="text-slate-600 dark:text-slate-400 font-mono">
                  ({liveL100Km} L/100km)
                </span>
              </div>
            </div>
          )}

          {/* Totalizzatore & Data Ora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                N° Totalizzatore Pompa
              </label>
              <input
                type="number"
                step="1"
                value={totalizzatore}
                onChange={(e) => setTotalizzatore(e.target.value)}
                placeholder="es. 18950"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Data e Ora
              </label>
              <input
                type="datetime-local"
                value={dataOra}
                onChange={(e) => setDataOra(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Note Rifornimento (opzionale)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="es. Pieno per trasferta Cantiere Ospedale, pressione pneumatici ok"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <Fuel className="w-4 h-4" />
              <span>Registra Rifornimento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
