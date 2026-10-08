import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  Truck,
  Plus,
  ScanLine,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Wrench,
  Fuel,
  X,
  Gauge,
  History,
  TrendingDown,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Veicolo } from '../types';
import { ResourceThumbnail } from './preview/ResourceThumbnail';

export const VeicoliModule: React.FC = () => {
  const {
    veicoli,
    dipendenti,
    rifornimenti,
    addRifornimento,
    updateVeicolo,
    addVeicolo,
    setVeicoliList,
    openQRModal,
    showToast,
    currentUser,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedVeicolo, setSelectedVeicolo] = useState<Veicolo | null>(veicoli[0] || null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isInterventoModalOpen, setIsInterventoModalOpen] = useState(false);
  const [isRifornimentoModalOpen, setIsRifornimentoModalOpen] = useState(false);

  const handleCsvFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          showToast('Il file CSV sembra vuoto o non leggibile.', 'error');
          return;
        }

        const parsedVehicles: Veicolo[] = results.data
          .filter((row) => row['Targa'] || row['targa'] || row['Veicolo'] || row['veicolo'] || row['ID'])
          .map((row, idx) => {
            const id = row['ID'] || row['id'] || `VEI-${String(idx + 1).padStart(2, '0')}`;
            const targa = (row['Targa'] || row['targa'] || row['TARGA'] || `TG-${idx + 1}`).trim().toUpperCase();
            const veicolo = row['Veicolo'] || row['veicolo'] || row['Modello'] || 'Automezzo';
            const modelloTipologia = row['Modello/Tipologia'] || row['Modello'] || row['Tipologia'] || veicolo;
            const euro = row['Euro'] || row['euro'] || 'Euro 6D';
            const dataAcquisto = row['Data_acquisto'] || row['data_acquisto'] || '2022-01-01';
            const rawStato = (row['Stato'] || row['stato'] || 'in_servizio').toLowerCase();
            const stato: 'in_servizio' | 'in_officina' | 'fermo' =
              rawStato.includes('officina') || rawStato.includes('manutenzione')
                ? 'in_officina'
                : rawStato.includes('fermo')
                ? 'fermo'
                : 'in_servizio';
            const assegnato = row['Assegnato'] || row['assegnato'] || row['Autista'] || 'Non assegnato';
            const kmUltimo = parseInt(row['Km_veicolo_Ultimo_Rifornimento'] || row['Km'] || row['km'] || '60000', 10) || 60000;
            const note = row['Note'] || row['note'] || '';

            // Connect fuel history for this license plate
            const cronologia = rifornimenti.filter(
              (r) => r.idVeicolo === id || r.targa.replace(/\s+/g, '').toUpperCase() === targa.replace(/\s+/g, '').toUpperCase()
            ).sort((a, b) => new Date(b.dataOra).getTime() - new Date(a.dataOra).getTime());

            const totaleLitri = cronologia.reduce((acc, r) => acc + r.quantitaLitri, 0);
            const tratteValide = cronologia.filter((r) => r.deltaKm !== undefined && r.deltaKm > 0);
            const totaleKm = tratteValide.reduce((acc, r) => acc + (r.deltaKm || 0), 0);

            const consumoMedioKmL =
              totaleKm > 0 && totaleLitri > 0
                ? parseFloat((totaleKm / totaleLitri).toFixed(2))
                : veicolo.toLowerCase().includes('daily') ? 9.9 : 14.5;

            const consumoMedioL100Km = parseFloat((100 / consumoMedioKmL).toFixed(2));

            return {
              id,
              targa,
              veicolo,
              modello: veicolo,
              modelloTipologia,
              euro,
              dataAcquisto,
              stato,
              statoPowerApps: stato === 'in_servizio' ? 'Attivo' : stato === 'in_officina' ? 'In Manutenzione' : 'Fermo',
              assegnato,
              autistaAssegnatoNome: assegnato,
              kmAttuali: kmUltimo,
              kmUltimoRifornimento: kmUltimo,
              dataUltimoRifornimento: row['Data_Ultimo_Rifornimento'] || new Date().toISOString().split('T')[0],
              scadenzaRevisione: '2027-05-31',
              scadenzaAssicurazione: '2027-02-28',
              scadenzaBollo: '2026-12-31',
              scadenzaTagliandoKm: kmUltimo + 15000,
              qrCode: `QR-VEC-${targa.replace(/\s+/g, '')}`,
              note,
              storicoInterventi: [],
              storicoRifornimenti: cronologia,
              consumoMedioKmL,
              consumoMedioL100Km,
              totaleLitriErogati: parseFloat(totaleLitri.toFixed(1)),
            };
          });

        if (parsedVehicles.length > 0) {
          setVeicoliList(parsedVehicles);
          setSelectedVeicolo(parsedVehicles[0]);
          showToast(`Caricati ${parsedVehicles.length} veicoli da ${file.name}!`, 'success');
        } else {
          showToast('Nessun record valido trovato nel file CSV.', 'warning');
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (err) => {
        showToast(`Errore durante la lettura del CSV: ${err.message}`, 'error');
      },
    });
  };

  // New Vehicle Form
  const [targa, setTarga] = useState('');
  const [modello, setModello] = useState('');
  const [km, setKm] = useState(65000);
  const [euro, setEuro] = useState('Euro 6D-Temp');
  const [assegnato, setAssegnato] = useState('');
  const [scadRev, setScadRev] = useState('2027-05-31');
  const [scadAss, setScadAss] = useState('2027-02-28');
  const [scadBollo, setScadBollo] = useState('2026-12-31');

  // New Maintenance entry
  const [intTipo, setIntTipo] = useState<'tagliando' | 'gomme' | 'riparazione' | 'revisione'>('tagliando');
  const [intKm, setIntKm] = useState(115000);
  const [intCosto, setIntCosto] = useState(450);
  const [intOfficina, setIntOfficina] = useState('Officina Autorizzata Milano');

  // New Fueling entry form
  const [rifLitri, setRifLitri] = useState('');
  const [rifKm, setRifKm] = useState('');
  const [rifOperatore, setRifOperatore] = useState('');
  const [rifTot, setRifTot] = useState('');
  const [rifNote, setRifNote] = useState('');

  // Selected vehicle's fueling history (via Targa o ID_Veicolo)
  const veicoloRifornimenti = selectedVeicolo
    ? rifornimenti
        .filter(
          (r) =>
            r.idVeicolo === selectedVeicolo.id ||
            r.targa.replace(/\s+/g, '').toUpperCase() === selectedVeicolo.targa.replace(/\s+/g, '').toUpperCase()
        )
        .sort((a, b) => new Date(b.dataOra).getTime() - new Date(a.dataOra).getTime())
    : [];

  const totaleLitriVeicolo = veicoloRifornimenti.reduce((acc, r) => acc + r.quantitaLitri, 0);

  const handleOpenRifornimentoModal = () => {
    if (!selectedVeicolo) return;
    const prevKm = selectedVeicolo.kmUltimoRifornimento || selectedVeicolo.kmAttuali || 0;
    setRifKm(String(prevKm + 450));
    setRifLitri('55.0');
    setRifOperatore(selectedVeicolo.assegnato || selectedVeicolo.autistaAssegnatoNome || (dipendenti[0]?.nome + ' ' + dipendenti[0]?.cognome) || '');
    const lastRif = rifornimenti[0];
    setRifTot(String((lastRif?.nTotalizzatore || 18500) + 55));
    setRifNote('');
    setIsRifornimentoModalOpen(true);
  };

  const handleSaveRifornimento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVeicolo) return;

    const litriNum = parseFloat(rifLitri) || 0;
    const kmNum = parseFloat(rifKm) || 0;
    const prevKm = selectedVeicolo.kmUltimoRifornimento || selectedVeicolo.kmAttuali || 0;

    if (litriNum <= 0) {
      showToast('Inserisci una quantità di carburante valida (litri > 0).', 'error');
      return;
    }

    if (kmNum < prevKm) {
      showToast(`I km inseriti (${kmNum}) non possono essere inferiori a quelli dell'ultimo rifornimento (${prevKm}).`, 'warning');
      return;
    }

    const deltaKm = kmNum > prevKm ? kmNum - prevKm : undefined;
    const consumoKmL = deltaKm && litriNum > 0 ? parseFloat((deltaKm / litriNum).toFixed(2)) : undefined;
    const consumoL100Km = deltaKm && litriNum > 0 ? parseFloat(((litriNum / deltaKm) * 100).toFixed(2)) : undefined;

    addRifornimento({
      dataOra: new Date().toISOString().replace('T', ' ').slice(0, 16),
      idVeicolo: selectedVeicolo.id,
      targa: selectedVeicolo.targa,
      modelloVeicolo: selectedVeicolo.veicolo || selectedVeicolo.modello,
      operatore: rifOperatore,
      quantitaLitri: litriNum,
      kmVeicolo: kmNum,
      nTotalizzatore: parseFloat(rifTot) || 18900,
      note: rifNote,
      deltaKm,
      consumoKmL,
      consumoL100Km,
    });

    setIsRifornimentoModalOpen(false);
  };

  const handleCreateVeicolo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTarga = targa.trim().toUpperCase();
    if (!cleanTarga) {
      showToast('Inserisci una targa valida per il veicolo.', 'warning');
      return;
    }
    if (!modello.trim()) {
      showToast('Inserisci marca e modello del veicolo.', 'warning');
      return;
    }

    const newVec = addVeicolo({
      targa: cleanTarga,
      modello,
      veicolo: modello,
      modelloTipologia: modello,
      euro,
      dataAcquisto: new Date().toISOString().split('T')[0],
      stato: 'in_servizio',
      statoPowerApps: 'Attivo',
      assegnato: assegnato || 'In pool',
      autistaAssegnatoNome: assegnato || 'In pool',
      kmAttuali: km,
      kmUltimoRifornimento: km,
      dataUltimoRifornimento: new Date().toISOString().replace('T', ' ').slice(0, 16),
      scadenzaRevisione: scadRev,
      scadenzaAssicurazione: scadAss,
      scadenzaBollo: scadBollo,
      scadenzaTagliandoKm: km + 20000,
      qrCode: `QR-VEC-${cleanTarga.replace(/\s+/g, '')}`,
      storicoInterventi: [],
    });

    setIsNewModalOpen(false);
    setSelectedVeicolo(newVec);
  };

  const handleAddIntervento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVeicolo) return;

    const newIntervento = {
      data: new Date().toISOString().split('T')[0],
      tipo: intTipo,
      km: intKm,
      costo: intCosto,
      officina: intOfficina,
    };

    updateVeicolo(selectedVeicolo.id, {
      kmAttuali: Math.max(selectedVeicolo.kmAttuali, intKm),
      storicoInterventi: [newIntervento, ...(selectedVeicolo.storicoInterventi || [])],
    });

    setIsInterventoModalOpen(false);
    showToast('Intervento manutenzione registrato a libretto!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <span>Parco Veicoli & Gestione Flotta</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Archivio integrato da <strong>Elenco_veicoli.csv</strong> con cronologia rifornimenti e consumi da <strong>Registro_carburante.csv</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCsvFileUpload}
            accept=".csv,text/csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-300 border border-slate-200 dark:border-amber-500/30 hover:border-slate-300 dark:hover:border-amber-500/60 text-xs font-bold rounded-xl transition-colors shadow-xs"
            title="Carica o aggiorna con il tuo file Elenco_veicoli.csv"
          >
            <UploadCloud className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Carica CSV</span>
          </button>

          {currentUser.role !== 'cliente' && (
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuovo Furgone
            </button>
          )}
        </div>
      </div>

      {/* Banner Informativo Elenco Veicoli CSV */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs dark:shadow-lg transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Elenco Veicoli Attivo
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                {veicoli.length} veicoli da Elenco_veicoli.csv
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Tutti i mezzi del file <strong>Elenco_veicoli.csv</strong> sono caricati e collegati al registro rifornimenti. Clicca su ciascun veicolo per schede e consumi.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vehicles list (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Furgoni e automezzi allestiti ({veicoli.length})</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
              {veicoli.filter((v) => v.stato === 'in_servizio' || v.statoPowerApps === 'Attivo').length} attivi
            </span>
          </div>

          <div className="space-y-2.5">
            {veicoli.map((vec) => {
              const isSelected = selectedVeicolo?.id === vec.id;
              const isUrgent = vec.scadenzaAssicurazione?.includes('2026-10');
              const isAttivo = vec.stato === 'in_servizio' || vec.statoPowerApps === 'Attivo';

              return (
                <div
                  key={vec.id}
                  onClick={() => setSelectedVeicolo(vec)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-500 dark:bg-slate-900 dark:border-amber-500 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900/60 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ResourceThumbnail
                      imageUrl={vec.fotoUrl}
                      category="mezzo"
                      alt={vec.veicolo || vec.modello}
                      code={vec.targa}
                      title={vec.veicolo || vec.modello}
                      subtitle={`Autista: ${vec.assegnato || vec.autistaAssegnatoNome || 'In pool'} · ${(vec.kmUltimoRifornimento || vec.kmAttuali).toLocaleString('it-IT')} km`}
                      size="mobile"
                      clickable={true}
                      details={[
                        { label: 'Targa', value: vec.targa },
                        { label: 'Stato', value: vec.statoPowerApps || (isAttivo ? 'Attivo' : 'In Manutenzione') },
                        { label: 'Autista', value: vec.assegnato || vec.autistaAssegnatoNome || 'In pool' },
                        { label: 'Chilometri', value: `${(vec.kmUltimoRifornimento || vec.kmAttuali).toLocaleString('it-IT')} km` },
                        { label: 'Euro', value: vec.euro || 'Euro 6' },
                      ]}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-black tracking-wider text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-800">
                            {vec.targa}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${
                              isAttivo
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {vec.statoPowerApps || (isAttivo ? 'Attivo' : 'In Manutenzione')}
                          </span>
                          {isUrgent && (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold font-mono">
                              Scad. RCA!
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openQRModal({
                              title: `Furgone ${vec.targa}`,
                              code: vec.qrCode,
                              subtitle: `${vec.veicolo || vec.modello} · Autista: ${vec.assegnato || vec.autistaAssegnatoNome || 'Aziendale'}`,
                              type: 'veicolo',
                            });
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
                          title="QR Furgone"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                        {vec.veicolo || vec.modello}
                      </h3>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                        Autista: <strong className="text-slate-800 dark:text-slate-200">{vec.assegnato || vec.autistaAssegnatoNome || 'In pool'}</strong>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {(vec.kmUltimoRifornimento || vec.kmAttuali).toLocaleString('it-IT')} km
                        </span>
                        <span>
                          Euro: <strong className="text-slate-800 dark:text-slate-200 font-mono">{vec.euro || 'Euro 6'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Vehicle Detail Card (7 cols) */}
        <div className="lg:col-span-7">
          {selectedVeicolo ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:p-6 shadow-sm dark:shadow-xl space-y-6 transition-colors">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-3.5">
                  <ResourceThumbnail
                    imageUrl={selectedVeicolo.fotoUrl}
                    category="mezzo"
                    alt={selectedVeicolo.veicolo || selectedVeicolo.modello}
                    code={selectedVeicolo.targa}
                    title={selectedVeicolo.veicolo || selectedVeicolo.modello}
                    subtitle={`Autista: ${selectedVeicolo.assegnato || selectedVeicolo.autistaAssegnatoNome || 'In pool'} · ${(selectedVeicolo.kmUltimoRifornimento || selectedVeicolo.kmAttuali).toLocaleString('it-IT')} km`}
                    size="xl"
                    clickable={true}
                    details={[
                      { label: 'Targa', value: selectedVeicolo.targa },
                      { label: 'Stato', value: selectedVeicolo.statoPowerApps || selectedVeicolo.stato },
                      { label: 'Autista', value: selectedVeicolo.assegnato || selectedVeicolo.autistaAssegnatoNome || 'In pool' },
                      { label: 'Chilometri', value: `${(selectedVeicolo.kmUltimoRifornimento || selectedVeicolo.kmAttuali).toLocaleString('it-IT')} km` },
                      { label: 'Euro', value: selectedVeicolo.euro || 'Euro 6' },
                      { label: 'Scadenza RCA', value: selectedVeicolo.scadenzaAssicurazione },
                    ]}
                  />

                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-base font-black px-2.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded text-slate-900 dark:text-slate-100">
                        {selectedVeicolo.targa}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">·</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold uppercase text-[11px]">
                        {selectedVeicolo.statoPowerApps || selectedVeicolo.stato.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">·</span>
                      <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {selectedVeicolo.euro || 'Euro 6'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                      {selectedVeicolo.veicolo || selectedVeicolo.modello}
                    </h2>
                    <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                      Allestimento: <strong>{selectedVeicolo.modelloTipologia || selectedVeicolo.modello}</strong>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Assegnato a: <strong className="text-slate-800 dark:text-slate-200">{selectedVeicolo.assegnato || selectedVeicolo.autistaAssegnatoNome || 'Assegnazione condivisa'}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start">
                  <button
                    onClick={handleOpenRifornimentoModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm"
                  >
                    <Fuel className="w-3.5 h-3.5" />
                    Registra Rifornimento
                  </button>
                  <button
                    onClick={() => setIsInterventoModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Tagliando
                  </button>
                </div>
              </div>

              {/* Real Operational Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Chilometri Attuali</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                    {(selectedVeicolo.kmUltimoRifornimento || selectedVeicolo.kmAttuali).toLocaleString('it-IT')} km
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Al contachilometri</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Carburante Erogato</span>
                  <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                    {totaleLitriVeicolo.toLocaleString('it-IT')} L
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Su {veicoloRifornimenti.length} rifornimenti</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Consumo Medio</span>
                  <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedVeicolo.consumoMedioKmL || 12.5} km/L
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                    {selectedVeicolo.consumoMedioL100Km || 8.0} L / 100km
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Data Ultimo Prelievo</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {selectedVeicolo.dataUltimoRifornimento || 'N/D'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Cisterna aziendale</span>
                </div>
              </div>

              {/* CRONOLOGIA RIFORNIMENTI CARBURANTE (Registro_carburante.csv) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                      Cronologia Rifornimenti Carburante ({veicoloRifornimenti.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Collegamento FK: {selectedVeicolo.targa}
                  </span>
                </div>

                {veicoloRifornimenti.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/60 dark:bg-slate-950/60">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Data / Ora</th>
                            <th className="py-2.5 px-3">Litri</th>
                            <th className="py-2.5 px-3">Km Veicolo</th>
                            <th className="py-2.5 px-3">Δ Tratta</th>
                            <th className="py-2.5 px-3">Consumo</th>
                            <th className="py-2.5 px-3">Totalizzatore</th>
                            <th className="py-2.5 px-3">Operatore</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                          {veicoloRifornimenti.map((rif) => (
                            <tr key={rif.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition">
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                                {rif.dataOra}
                              </td>
                              <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">
                                {rif.quantitaLitri} L
                              </td>
                              <td className="py-2 px-3 text-slate-900 dark:text-slate-200 font-semibold">
                                {rif.kmVeicolo.toLocaleString('it-IT')} km
                              </td>
                              <td className="py-2 px-3">
                                {rif.deltaKm ? (
                                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">+{rif.deltaKm} km</span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-600">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {rif.consumoKmL ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{rif.consumoKmL} km/L</span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-600">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                                {rif.nTotalizzatore || '-'}
                              </td>
                              <td className="py-2 px-3 text-slate-800 dark:text-slate-300 font-sans text-xs truncate max-w-[120px]">
                                {rif.operatore}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs text-center italic">
                    Nessun rifornimento registrato per questa targa. Usa il pulsante in alto per inserire il primo pieno.
                  </div>
                )}
              </div>

              {/* Deadlines Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Scadenze Legali & Amministrative
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Revisione MCTC</span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-200">{selectedVeicolo.scadenzaRevisione}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-semibold">Regolare ✓</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Assicurazione RCA</span>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{selectedVeicolo.scadenzaAssicurazione}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Polizza Flotta</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Tassa di Possesso</span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-200">{selectedVeicolo.scadenzaBollo}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Regolare</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Prossimo Tagliando</span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-200">
                      {selectedVeicolo.scadenzaTagliandoKm?.toLocaleString('it-IT')} km
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Olio & filtri</span>
                  </div>
                </div>
              </div>

              {/* Maintenance History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Libretto Manutenzioni & Officina
                </h4>
                {selectedVeicolo.storicoInterventi && selectedVeicolo.storicoInterventi.length > 0 ? (
                  <div className="space-y-2">
                    {selectedVeicolo.storicoInterventi.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">{item.tipo}</span>
                            <span className="text-slate-400 dark:text-slate-600">·</span>
                            <span className="text-slate-800 dark:text-slate-300 font-mono">{item.km.toLocaleString('it-IT')} km</span>
                            <span className="text-slate-400 dark:text-slate-600">·</span>
                            <span className="text-slate-600 dark:text-slate-400">{item.data}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Officina: {item.officina}</div>
                        </div>

                        <div className="font-mono font-bold text-slate-900 dark:text-slate-200">
                          € {item.costo.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs text-center italic">
                    Nessun intervento a libretto registrato per questo veicolo.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              Nessun mezzo selezionato.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NUOVO RIFORNIMENTO RAPIDO */}
      {isRifornimentoModalOpen && selectedVeicolo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsRifornimentoModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Registra Rifornimento</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedVeicolo.targa} - {selectedVeicolo.veicolo || selectedVeicolo.modello}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveRifornimento} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Operatore / Autista:</label>
                <select
                  value={rifOperatore}
                  onChange={(e) => setRifOperatore(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:border-amber-500"
                >
                  <option value="">-- Seleziona Dipendente --</option>
                  {dipendenti.map((d) => {
                    const fullName = `${d.nome} ${d.cognome}`;
                    return (
                      <option key={d.matricola || d.id} value={fullName}>
                        {fullName} ({d.matricola || d.id}) - {d.qualifica || d.ruoloAziendale}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Quantità Litri:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="400"
                    required
                    value={rifLitri}
                    onChange={(e) => setRifLitri(e.target.value)}
                    placeholder="es. 60.0"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Km Contachilometri:
                  </label>
                  <input
                    type="number"
                    required
                    value={rifKm}
                    onChange={(e) => setRifKm(e.target.value)}
                    placeholder={`min ${selectedVeicolo.kmUltimoRifornimento || selectedVeicolo.kmAttuali}`}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Totalizzatore Pompa:</label>
                <input
                  type="number"
                  value={rifTot}
                  onChange={(e) => setRifTot(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Note (opzionale):</label>
                <input
                  type="text"
                  value={rifNote}
                  onChange={(e) => setRifNote(e.target.value)}
                  placeholder="es. Pieno regolare cisterna sede"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRifornimentoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Fuel className="w-4 h-4" />
                  Salva Rifornimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE VEICOLO MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Aggiungi Veicolo alla Flotta</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Censimento furgone da lavoro con barcode identificativo
            </p>

            <form onSubmit={handleCreateVeicolo} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Targa Automezzo:</label>
                  <input
                    type="text"
                    required
                    placeholder="es. GN 123 AB"
                    value={targa}
                    onChange={(e) => setTarga(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500 font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Chilometri Attuali:</label>
                  <input
                    type="number"
                    value={km}
                    onChange={(e) => setKm(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Modello e Allestimento:</label>
                <input
                  type="text"
                  required
                  placeholder="es. Fiat Doblò Cargo Maxi 1.6 Multijet"
                  value={modello}
                  onChange={(e) => setModello(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Normativa Euro:</label>
                  <select
                    value={euro}
                    onChange={(e) => setEuro(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  >
                    <option value="Euro 6D-Temp">Euro 6D-Temp</option>
                    <option value="Euro 6D-Final">Euro 6D-Final</option>
                    <option value="Euro 6">Euro 6</option>
                    <option value="Euro 5">Euro 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Autista Assegnato:</label>
                  <select
                    value={assegnato}
                    onChange={(e) => setAssegnato(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  >
                    <option value="">-- Parco comune / In pool --</option>
                    {dipendenti.map((d) => (
                      <option key={d.matricola || d.id} value={`${d.nome} ${d.cognome}`}>
                        {d.nome} {d.cognome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Scadenza Assicurazione:</label>
                  <input
                    type="date"
                    value={scadAss}
                    onChange={(e) => setScadAss(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Scadenza Revisione MCTC:</label>
                  <input
                    type="date"
                    value={scadRev}
                    onChange={(e) => setScadRev(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-colors shadow-sm"
                >
                  Salva Mezzo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRA INTERVENTO / TAGLIANDO MODAL */}
      {isInterventoModalOpen && selectedVeicolo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl my-6">
            <button
              onClick={() => setIsInterventoModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Registra Manutenzione Veicolo</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Targa: <strong className="text-slate-800 dark:text-slate-200">{selectedVeicolo.targa}</strong> · {selectedVeicolo.veicolo || selectedVeicolo.modello}
            </p>

            <form onSubmit={handleAddIntervento} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tipologia Intervento:</label>
                <select
                  value={intTipo}
                  onChange={(e) => setIntTipo(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:border-amber-500"
                >
                  <option value="tagliando">Tagliando programmato</option>
                  <option value="gomme">Cambio pneumatici / convergenza</option>
                  <option value="riparazione">Riparazione guasto / freni</option>
                  <option value="revisione">Revisione periodica</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Chilometraggio:</label>
                  <input
                    type="number"
                    value={intKm}
                    onChange={(e) => setIntKm(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Costo Intervento (€):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={intCosto}
                    onChange={(e) => setIntCosto(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Officina / Fornitore:</label>
                <input
                  type="text"
                  required
                  value={intOfficina}
                  onChange={(e) => setIntOfficina(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInterventoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-colors shadow-sm"
                >
                  Registra Intervento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
