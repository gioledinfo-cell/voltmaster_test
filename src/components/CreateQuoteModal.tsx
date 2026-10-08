import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Package,
  Wrench,
  Percent,
  Calculator,
  Layers,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Search,
} from 'lucide-react';
import {
  Preventivo,
  Cliente,
  ArticoloMagazzino,
  VoceMaterialePreventivo,
  VoceManodoperaPreventivo,
  VocePreventivo,
} from '../types';

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quoteData: Omit<Preventivo, 'id'>) => void;
  clienti: Cliente[];
  magazzino: ArticoloMagazzino[];
  initialData?: Preventivo | null;
}

export const CreateQuoteModal: React.FC<CreateQuoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clienti,
  magazzino,
  initialData,
}) => {
  // Testata preventivo
  const [clienteId, setClienteId] = useState<string>(
    initialData?.clienteId || clienti[0]?.id || ''
  );
  const [oggetto, setOggetto] = useState<string>(
    initialData?.oggetto || ''
  );
  const [note, setNote] = useState<string>(
    initialData?.note ||
      'Condizioni di fornitura standard: acconto 30% all’ordine, 40% a SAL intermedio, saldo 30% al collaudo e rilascio DiCo DM 37/08. Validità offerta 45 giorni.'
  );

  // Parametri di configurazione economica globale
  const [ricaricoGlobale, setRicaricoGlobale] = useState<number>(
    initialData?.percentualeRicaricoMateriali ?? 30
  );
  const [tariffaOraria, setTariffaOraria] = useState<number>(
    initialData?.tariffaOraria ?? 35.0
  );
  const [tipoAggiustamento, setTipoAggiustamento] = useState<'sconto' | 'maggiorazione'>(
    initialData?.tipoAggiustamento || 'sconto'
  );
  const [percentualeScontoMaggiorazione, setPercentualeScontoMaggiorazione] = useState<number>(
    initialData?.percentualeScontoMaggiorazione ?? 0
  );
  const [aliquotaIva, setAliquotaIva] = useState<number>(
    initialData?.aliquotaIva ?? initialData?.ivaPercentuale ?? 22
  );
  const [aliquotaIvaCustom, setAliquotaIvaCustom] = useState<string>('');
  const [isCustomIva, setIsCustomIva] = useState<boolean>(false);

  // 1. Sezione Materiali
  const [materiali, setMateriali] = useState<VoceMaterialePreventivo[]>(() => {
    if (initialData?.materiali && initialData.materiali.length > 0) {
      return initialData.materiali;
    }
    // Convert initialData.voci di tipo 'materiale' se presenti
    if (initialData?.voci) {
      const matVoci = initialData.voci.filter((v) => v.categoria === 'materiale');
      if (matVoci.length > 0) {
        return matVoci.map((v, i) => {
          const costo = v.costoAcquistoUnitario || Number((v.prezzoUnitario / 1.3).toFixed(2));
          const ricarico = v.ricaricoPercentuale ?? 30;
          const prezzoVendita = Number((costo * (1 + ricarico / 100)).toFixed(2));
          return {
            id: `mat-${Date.now()}-${i}`,
            descrizione: v.descrizione,
            unitaMisura: v.unitaMisura || 'pz',
            quantita: v.quantita || 1,
            costoAcquistoUnitario: costo,
            ricaricoPercentuale: ricarico,
            prezzoVenditaUnitario: prezzoVendita,
            totaleCosto: Number((costo * (v.quantita || 1)).toFixed(2)),
            totaleVendita: Number((prezzoVendita * (v.quantita || 1)).toFixed(2)),
          };
        });
      }
    }
    // Default demo rows
    return [
      {
        id: `mat-${Date.now()}-1`,
        descrizione: 'Cavo FG16OR12 3G2.5 mm² CPR Cca-s1b,d1,a1',
        unitaMisura: 'm',
        quantita: 120,
        costoAcquistoUnitario: 2.1,
        ricaricoPercentuale: 30,
        prezzoVenditaUnitario: 2.73,
        totaleCosto: 252.0,
        totaleVendita: 327.6,
      },
      {
        id: `mat-${Date.now()}-2`,
        descrizione: 'Quadro da parete IP65 36 moduli con portella trasparente fumé',
        unitaMisura: 'pz',
        quantita: 2,
        costoAcquistoUnitario: 85.0,
        ricaricoPercentuale: 30,
        prezzoVenditaUnitario: 110.5,
        totaleCosto: 170.0,
        totaleVendita: 221.0,
      },
    ];
  });

  // 2. Sezione Manodopera & Servizi
  const [manodopera, setManodopera] = useState<VoceManodoperaPreventivo[]>(() => {
    if (initialData?.manodopera && initialData.manodopera.length > 0) {
      return initialData.manodopera;
    }
    if (initialData?.voci) {
      const manoVoci = initialData.voci.filter(
        (v) => v.categoria === 'manodopera' || v.categoria === 'pratica_tecnica'
      );
      if (manoVoci.length > 0) {
        return manoVoci.map((v, i) => ({
          id: `man-${Date.now()}-${i}`,
          descrizione: v.descrizione,
          oreStimate: v.quantita || 8,
          tariffaOrariaApplicata: v.prezzoUnitario || 35.0,
          totale: Number(((v.quantita || 8) * (v.prezzoUnitario || 35.0)).toFixed(2)),
        }));
      }
    }
    return [
      {
        id: `man-${Date.now()}-1`,
        descrizione: 'Posa canalizzazioni, infilaggio linee e montaggio quadri di distribuzione',
        oreStimate: 16,
        tariffaOrariaApplicata: 35.0,
        totale: 560.0,
      },
      {
        id: `man-${Date.now()}-2`,
        descrizione: 'Collaudo strumentale di isolamento, continuità PE e redazione DiCo DM 37/08',
        oreStimate: 6,
        tariffaOrariaApplicata: 35.0,
        totale: 210.0,
      },
    ];
  });

  // Selezione rapida da catalogo di magazzino
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [searchCatalogQuery, setSearchCatalogQuery] = useState<string>('');

  // Sincronizza tariffe orarie manodopera quando cambia tariffa globale se richiesto
  const handleApplyTariffaGlobale = (newRate: number) => {
    setTariffaOraria(newRate);
    setManodopera((prev) =>
      prev.map((item) => ({
        ...item,
        tariffaOrariaApplicata: newRate,
        totale: Number((item.oreStimate * newRate).toFixed(2)),
      }))
    );
  };

  // Sincronizza ricarico materiali globale
  const handleApplyRicaricoGlobale = (newMarkup: number) => {
    setRicaricoGlobale(newMarkup);
    setMateriali((prev) =>
      prev.map((item) => {
        const markup = newMarkup;
        const prezzoVendita = Number(
          (item.costoAcquistoUnitario * (1 + markup / 100)).toFixed(2)
        );
        return {
          ...item,
          ricaricoPercentuale: markup,
          prezzoVenditaUnitario: prezzoVendita,
          totaleVendita: Number((prezzoVendita * item.quantita).toFixed(2)),
        };
      })
    );
  };

  // CRUD Materiali
  const handleAddMaterialeRow = () => {
    const markup = ricaricoGlobale;
    const costo = 50.0;
    const prezzo = Number((costo * (1 + markup / 100)).toFixed(2));
    const newRow: VoceMaterialePreventivo = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      descrizione: 'Nuovo articolo / materiale per impianto',
      unitaMisura: 'pz',
      quantita: 1,
      costoAcquistoUnitario: costo,
      ricaricoPercentuale: markup,
      prezzoVenditaUnitario: prezzo,
      totaleCosto: costo,
      totaleVendita: prezzo,
    };
    setMateriali((prev) => [...prev, newRow]);
  };

  const handleAddFromCatalog = (artId: string) => {
    const art = magazzino.find((m) => m.id === artId);
    if (!art) return;
    const markup = ricaricoGlobale;
    const costo = art.prezzoUnitarioAcquisto || 10;
    const prezzoVendita = Number((costo * (1 + markup / 100)).toFixed(2));
    const newRow: VoceMaterialePreventivo = {
      id: `mat-${Date.now()}-${art.id}`,
      articoloId: art.id,
      codiceSku: art.codiceSku,
      descrizione: `${art.nome} (${art.codiceSku})`,
      unitaMisura: art.unitaMisura || 'pz',
      quantita: 1,
      costoAcquistoUnitario: costo,
      ricaricoPercentuale: markup,
      prezzoVenditaUnitario: prezzoVendita,
      totaleCosto: costo,
      totaleVendita: prezzoVendita,
    };
    setMateriali((prev) => [...prev, newRow]);
    setSelectedCatalogId('');
  };

  const handleUpdateMateriale = (
    id: string,
    field: keyof VoceMaterialePreventivo,
    value: any
  ) => {
    setMateriali((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };

        const qty = field === 'quantita' ? Number(value) || 0 : updated.quantita;
        const cost =
          field === 'costoAcquistoUnitario'
            ? Number(value) || 0
            : updated.costoAcquistoUnitario;
        const markup =
          field === 'ricaricoPercentuale'
            ? Number(value) || 0
            : updated.ricaricoPercentuale ?? ricaricoGlobale;

        const prezzoVendita = Number((cost * (1 + markup / 100)).toFixed(2));
        updated.quantita = qty;
        updated.costoAcquistoUnitario = cost;
        updated.ricaricoPercentuale = markup;
        updated.prezzoVenditaUnitario = prezzoVendita;
        updated.totaleCosto = Number((qty * cost).toFixed(2));
        updated.totaleVendita = Number((qty * prezzoVendita).toFixed(2));

        return updated;
      })
    );
  };

  const handleRemoveMateriale = (id: string) => {
    setMateriali((prev) => prev.filter((m) => m.id !== id));
  };

  // CRUD Manodopera
  const handleAddManodoperaRow = () => {
    const ore = 8;
    const tariffa = tariffaOraria;
    const newRow: VoceManodoperaPreventivo = {
      id: `man-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      descrizione: 'Lavorazione e posa specialistica',
      oreStimate: ore,
      tariffaOrariaApplicata: tariffa,
      totale: Number((ore * tariffa).toFixed(2)),
    };
    setManodopera((prev) => [...prev, newRow]);
  };

  const handleUpdateManodopera = (
    id: string,
    field: keyof VoceManodoperaPreventivo,
    value: any
  ) => {
    setManodopera((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        const ore = field === 'oreStimate' ? Number(value) || 0 : updated.oreStimate;
        const tariffa =
          field === 'tariffaOrariaApplicata'
            ? Number(value) || 0
            : updated.tariffaOrariaApplicata;
        updated.oreStimate = ore;
        updated.tariffaOrariaApplicata = tariffa;
        updated.totale = Number((ore * tariffa).toFixed(2));
        return updated;
      })
    );
  };

  const handleRemoveManodopera = (id: string) => {
    setManodopera((prev) => prev.filter((m) => m.id !== id));
  };

  // Calcoli finanziari in tempo reale
  const quadroEconomico = useMemo(() => {
    const subtotaleMaterialiCosto = materiali.reduce((acc, m) => acc + m.totaleCosto, 0);
    const subtotaleMateriali = materiali.reduce((acc, m) => acc + m.totaleVendita, 0);
    const totaleOreManodopera = manodopera.reduce((acc, m) => acc + m.oreStimate, 0);
    const subtotaleManodopera = manodopera.reduce((acc, m) => acc + m.totale, 0);

    const baseTotale = subtotaleMateriali + subtotaleManodopera;

    // Sconto o Maggiorazione
    const percAdj = Number(percentualeScontoMaggiorazione) || 0;
    let quotaScontoMaggiorazione = 0;
    let totaleImponibile = baseTotale;

    if (percAdj > 0) {
      quotaScontoMaggiorazione = Number(((baseTotale * percAdj) / 100).toFixed(2));
      if (tipoAggiustamento === 'sconto') {
        totaleImponibile = Math.max(0, baseTotale - quotaScontoMaggiorazione);
      } else {
        totaleImponibile = baseTotale + quotaScontoMaggiorazione;
      }
    }

    const currentAliquotaIva = isCustomIva
      ? parseFloat(aliquotaIvaCustom) || 0
      : Number(aliquotaIva) || 0;

    const ivaImporto = Number(((totaleImponibile * currentAliquotaIva) / 100).toFixed(2));
    const totaleIvato = Number((totaleImponibile + ivaImporto).toFixed(2));

    const margineAssolutoMateriali = subtotaleMateriali - subtotaleMaterialiCosto;

    return {
      subtotaleMaterialiCosto,
      subtotaleMateriali,
      margineAssolutoMateriali,
      totaleOreManodopera,
      subtotaleManodopera,
      baseTotale,
      quotaScontoMaggiorazione,
      totaleImponibile,
      currentAliquotaIva,
      ivaImporto,
      totaleIvato,
    };
  }, [
    materiali,
    manodopera,
    tipoAggiustamento,
    percentualeScontoMaggiorazione,
    aliquotaIva,
    isCustomIva,
    aliquotaIvaCustom,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clienti.find((c) => c.id === clienteId);
    if (!cliente) return;

    // Costruisci le voci unificate per compatibilità completa con i componenti esistenti
    const compositeVoci: VocePreventivo[] = [
      ...materiali.map((m, i) => ({
        id: `v-mat-${i + 1}`,
        descrizione: m.descrizione,
        categoria: 'materiale' as const,
        quantita: m.quantita,
        unitaMisura: m.unitaMisura,
        prezzoUnitario: m.prezzoVenditaUnitario,
        totale: m.totaleVendita,
        costoAcquistoUnitario: m.costoAcquistoUnitario,
        ricaricoPercentuale: m.ricaricoPercentuale,
      })),
      ...manodopera.map((m, i) => ({
        id: `v-man-${i + 1}`,
        descrizione: m.descrizione,
        categoria: 'manodopera' as const,
        quantita: m.oreStimate,
        unitaMisura: 'ore',
        prezzoUnitario: m.tariffaOrariaApplicata,
        totale: m.totale,
      })),
    ];

    const nextNumero =
      initialData?.numero ||
      `PREV-2026-${String(Math.floor(Math.random() * 800) + 100).padStart(3, '0')}`;

    const quotePayload: Omit<Preventivo, 'id'> = {
      numero: nextNumero,
      clienteId: cliente.id,
      clienteNome: cliente.ragioneSociale,
      oggetto: oggetto.trim() || 'Opere di installazione e adeguamento impianti elettrici',
      dataEmissione: initialData?.dataEmissione || new Date().toISOString().split('T')[0],
      dataScadenza:
        initialData?.dataScadenza ||
        new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString().split('T')[0],
      stato: initialData?.stato || 'inviato',
      note,
      voci: compositeVoci,

      // Nuove proprietà del modello modulare
      materiali,
      manodopera,
      tariffaOraria,
      percentualeRicaricoMateriali: ricaricoGlobale,
      tipoAggiustamento,
      percentualeScontoMaggiorazione: Number(percentualeScontoMaggiorazione) || 0,
      aliquotaIva: quadroEconomico.currentAliquotaIva,

      subtotaleMaterialiCosto: quadroEconomico.subtotaleMaterialiCosto,
      subtotaleMateriali: quadroEconomico.subtotaleMateriali,
      subtotaleManodopera: quadroEconomico.subtotaleManodopera,
      totaleLavorazioni: quadroEconomico.baseTotale,
      quotaScontoMaggiorazione: quadroEconomico.quotaScontoMaggiorazione,
      totaleImponibile: quadroEconomico.totaleImponibile,
      imponibile: quadroEconomico.totaleImponibile, // retro-compatibile
      ivaPercentuale: quadroEconomico.currentAliquotaIva, // retro-compatibile
      ivaImporto: quadroEconomico.ivaImporto,
      totaleIvato: quadroEconomico.totaleIvato,
      totale: quadroEconomico.totaleIvato, // retro-compatibile
    };

    onSave(quotePayload);
    onClose();
  };

  const filteredCatalog = useMemo(() => {
    if (!searchCatalogQuery.trim()) return magazzino.slice(0, 8);
    const q = searchCatalogQuery.toLowerCase();
    return magazzino.filter(
      (m) =>
        m.nome.toLowerCase().includes(q) ||
        m.codiceSku.toLowerCase().includes(q) ||
        m.categoria.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [magazzino, searchCatalogQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl my-4 sm:my-8 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{initialData ? 'Modifica Preventivo' : 'Crea Nuovo Preventivo Impianti'}</span>
                {initialData && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {initialData.numero}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calcolo economico modulare: Materiali con ricarico %, Manodopera a tariffa oraria e Totale Netto
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {/* Sezione 0: Testata Committente & Oggetto */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Committente / Cliente:
                </label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  {clienti.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ragioneSociale} {c.partitaIva ? `(${c.partitaIva})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Oggetto dell'intervento o appalto:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Realizzazione quadro BT e distribuzione elettrica reparto macchine"
                  value={oggetto}
                  onChange={(e) => setOggetto(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SEZIONE 1: MATERIALI */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    1. Sezione Materiali & Forniture
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Costi di acquisto fornitore con ricarico configurabile per calcolo automatico del prezzo di vendita
                  </p>
                </div>
              </div>

              {/* Parametro Globale % Ricarico Materiali */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  % Ricarico Globale:
                </span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    step="1"
                    value={ricaricoGlobale}
                    onChange={(e) => handleApplyRicaricoGlobale(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-right font-mono font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  />
                  <span className="ml-1 font-bold text-slate-500">%</span>
                </div>
              </div>
            </div>

            {/* Inserimento rapido da catalogo magazzino */}
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-200/50 dark:border-blue-900/40">
              <span className="text-[11px] font-medium text-blue-800 dark:text-blue-300 flex items-center gap-1.5 shrink-0">
                <Search className="w-3.5 h-3.5" />
                Aggiungi da Catalogo / Listino:
              </span>
              <div className="flex-1 w-full flex items-center gap-2">
                <select
                  value={selectedCatalogId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedCatalogId(id);
                    if (id) handleAddFromCatalog(id);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded text-slate-900 dark:text-slate-100 text-xs"
                >
                  <option value="">-- Seleziona un articolo da magazzino ({magazzino.length} disponibili) --</option>
                  {magazzino.map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.nome} · SKU: {art.codiceSku} · Costo acq: €{art.prezzoUnitarioAcquisto?.toFixed(2)} / {art.unitaMisura} (Giac: {art.giacenza})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddMaterialeRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded transition shrink-0 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuova Riga Manuale</span>
                </button>
              </div>
            </div>

            {/* Tabella Materiali */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Descrizione Articolo / Fornitura</th>
                    <th className="py-2.5 px-2 text-center w-14">U.M.</th>
                    <th className="py-2.5 px-2 text-right w-18">Q.tà</th>
                    <th className="py-2.5 px-2 text-right w-24">Costo Acq. (€)</th>
                    <th className="py-2.5 px-2 text-right w-20">% Ricarico</th>
                    <th className="py-2.5 px-2 text-right w-24">Pr. Vendita (€)</th>
                    <th className="py-2.5 px-2 text-right w-24">Tot. Costo</th>
                    <th className="py-2.5 px-3 text-right w-28">Tot. Vendita (€)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {materiali.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        Nessun materiale aggiunto. Clicca su "+ Nuova Riga Manuale" o seleziona un articolo dal catalogo.
                      </td>
                    </tr>
                  ) : (
                    materiali.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.descrizione}
                            onChange={(e) => handleUpdateMateriale(item.id, 'descrizione', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                            placeholder="Descrizione materiale"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="text"
                            value={item.unitaMisura}
                            onChange={(e) => handleUpdateMateriale(item.id, 'unitaMisura', e.target.value)}
                            className="w-12 px-1 py-1 text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantita}
                            onChange={(e) => handleUpdateMateriale(item.id, 'quantita', parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.costoAcquistoUnitario}
                            onChange={(e) => handleUpdateMateriale(item.id, 'costoAcquistoUnitario', parseFloat(e.target.value) || 0)}
                            className="w-20 px-1.5 py-1 text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-mono"
                            title="Costo acquisto unitario da fornitore"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <div className="flex items-center justify-end">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.ricaricoPercentuale ?? ricaricoGlobale}
                              onChange={(e) => handleUpdateMateriale(item.id, 'ricaricoPercentuale', parseFloat(e.target.value) || 0)}
                              className="w-14 px-1 py-1 text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-blue-600 dark:text-blue-400 font-bold font-mono text-[11px]"
                              title="% ricarico singola riga"
                            />
                            <span className="text-[10px] ml-0.5 text-slate-400">%</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          € {item.prezzoVenditaUnitario.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-500 text-[11px]">
                          € {item.totaleCosto.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                          € {item.totaleVendita.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveMateriale(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                            title="Rimuovi riga"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Subtotale Materiali (Costo complessivo e Prezzo Vendita complessivo) */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                <span>
                  Voci Materiali: <strong>{materiali.length}</strong>
                </span>
                <span className="border-l border-slate-300 dark:border-slate-700 pl-3">
                  Costo Acquisto Complessivo:{' '}
                  <strong className="font-mono text-slate-700 dark:text-slate-300">
                    € {quadroEconomico.subtotaleMaterialiCosto.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </span>
                <span className="border-l border-slate-300 dark:border-slate-700 pl-3">
                  Margine Lordo Materiali:{' '}
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    +€ {quadroEconomico.margineAssolutoMateriali.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Subtotale Vendita Materiali:
                </span>
                <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400">
                  € {quadroEconomico.subtotaleMateriali.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* SEZIONE 2: MANODOPERA & SERVIZI */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    2. Sezione Manodopera & Servizi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Calcolo automatico basato su ore stimate per mansione e tariffa oraria (€/h)
                  </p>
                </div>
              </div>

              {/* Tariffa Oraria Manodopera (€/h) */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  Tariffa Oraria Base:
                </span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={tariffaOraria}
                    onChange={(e) => handleApplyTariffaGlobale(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  />
                  <span className="ml-1 font-bold text-slate-500">€/h</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddManodoperaRow}
                  className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded transition text-xs shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi Mansione</span>
                </button>
              </div>
            </div>

            {/* Tabella Mansioni */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Descrizione Prestazione / Mansione</th>
                    <th className="py-2.5 px-3 text-right w-24">Ore Stimate</th>
                    <th className="py-2.5 px-3 text-right w-32">Tariffa Oraria (€/h)</th>
                    <th className="py-2.5 px-3 text-right w-32">Subtotale (€)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {manodopera.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Nessuna voce di manodopera inserita. Clicca su "+ Aggiungi Mansione".
                      </td>
                    </tr>
                  ) : (
                    manodopera.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.descrizione}
                            onChange={(e) => handleUpdateManodopera(item.id, 'descrizione', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                            placeholder="Descrizione mansione o collaudo"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.oreStimate}
                            onChange={(e) => handleUpdateManodopera(item.id, 'oreStimate', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 font-mono font-bold"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.tariffaOrariaApplicata}
                            onChange={(e) => handleUpdateManodopera(item.id, 'tariffaOrariaApplicata', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-right bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-emerald-600 dark:text-emerald-400 font-mono font-bold"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          € {item.totale.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveManodopera(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                            title="Rimuovi voce manodopera"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Subtotale Manodopera (Totale Ore * Tariffa Oraria) */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                <span>
                  Mansioni/Fasi: <strong>{manodopera.length}</strong>
                </span>
                <span className="border-l border-slate-300 dark:border-slate-700 pl-3">
                  Totale Ore Lavorative Stimate:{' '}
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    {quadroEconomico.totaleOreManodopera} h
                  </strong>
                </span>
                <span className="border-l border-slate-300 dark:border-slate-700 pl-3">
                  Media Oraria: <strong className="font-mono">€ {tariffaOraria.toFixed(2)} /h</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Subtotale Manodopera & Servizi:
                </span>
                <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                  € {quadroEconomico.subtotaleManodopera.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* SEZIONE 3: PARAMETRI FINANZIARI E QUADRO ECONOMICO IN TEMPO REALE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Parametri Finanziari (Modificabili) - 6 cols */}
            <div className="lg:col-span-6 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Percent className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Condizioni Commerciali & Fiscali
                </h3>
              </div>

              {/* Toggle Sconto o Maggiorazione */}
              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                  Aggiustamento Commerciale (Sconto o Maggiorazione):
                </label>
                <div className="flex items-center gap-3">
                  <div className="inline-flex p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTipoAggiustamento('sconto')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                        tipoAggiustamento === 'sconto'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      - Sconto Commerciale
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoAggiustamento('maggiorazione')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                        tipoAggiustamento === 'maggiorazione'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      + Maggiorazione Oneri / Urgenza
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={percentualeScontoMaggiorazione}
                      onChange={(e) => setPercentualeScontoMaggiorazione(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-right font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                    />
                    <span className="font-bold text-slate-500">%</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  {tipoAggiustamento === 'sconto'
                    ? 'Applicazione sconto sull’imponibile delle lavorazioni.'
                    : 'Applicazione sovrapprezzo per complessità straordinaria o urgenza.'}
                </p>
              </div>

              {/* Aliquota IVA */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                  Aliquota IVA (%):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={isCustomIva ? 'custom' : aliquotaIva}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomIva(true);
                      } else {
                        setIsCustomIva(false);
                        setAliquotaIva(parseInt(e.target.value));
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value={22}>22% (Ordinaria)</option>
                    <option value={10}>10% (Ristrutturazione / Agevolata)</option>
                    <option value={4}>4% (Prima Casa)</option>
                    <option value={0}>0% (Reverse Charge / Esente)</option>
                    <option value="custom">Altra aliquota personalizzata...</option>
                  </select>

                  {isCustomIva ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Es. 5.5"
                        value={aliquotaIvaCustom}
                        onChange={(e) => setAliquotaIvaCustom(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-500 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
                      />
                      <span className="font-bold text-slate-500">%</span>
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-slate-500 font-mono text-right flex items-center justify-end">
                      IVA applicata: <strong>{aliquotaIva}%</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Note / Condizioni */}
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                  Note & Condizioni di Pagamento:
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>
            </div>

            {/* Quadro Economico Riassuntivo in tempo reale - 6 cols */}
            <div className="lg:col-span-6 p-5 rounded-xl bg-amber-500/5 dark:bg-slate-950 border-2 border-amber-500/30 dark:border-amber-500/30 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Quadro Economico Riassuntivo
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Live Calculation
                  </span>
                </div>

                <div className="mt-3 space-y-2.5 text-xs">
                  {/* Totale Materiali */}
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Totale Materiali (con ricarico):
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      € {quadroEconomico.subtotaleMateriali.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Totale Manodopera */}
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Totale Manodopera ({quadroEconomico.totaleOreManodopera} ore @ €{tariffaOraria}/h):
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      € {quadroEconomico.subtotaleManodopera.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Base Lavorazioni */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    <span>Sommano Lavorazioni & Forniture:</span>
                    <span className="font-mono">
                      € {quadroEconomico.baseTotale.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Sconto o Maggiorazione */}
                  {percentualeScontoMaggiorazione > 0 && (
                    <div
                      className={`flex justify-between items-center text-xs ${
                        tipoAggiustamento === 'sconto'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400 font-semibold'
                      }`}
                    >
                      <span>
                        {tipoAggiustamento === 'sconto' ? 'Sconto commerciale' : 'Maggiorazione'} ({percentualeScontoMaggiorazione}%):
                      </span>
                      <span className="font-mono font-bold">
                        {tipoAggiustamento === 'sconto' ? '-' : '+'}€{' '}
                        {quadroEconomico.quotaScontoMaggiorazione.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {/* Imponibile Netto */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <span>Imponibile Netto:</span>
                    <span className="font-mono text-base">
                      € {quadroEconomico.totaleImponibile.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Quota IVA */}
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Quota IVA ({quadroEconomico.currentAliquotaIva}%):</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      € {quadroEconomico.ivaImporto.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box TOTALE PREVENTIVO FINALE (IVA inclusa) */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-xl text-slate-950 shadow-md">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider block opacity-90">
                      Totale Preventivo Finale
                    </span>
                    <span className="text-[10px] font-medium opacity-80">
                      IVA {quadroEconomico.currentAliquotaIva}% inclusa
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xl sm:text-2xl font-black">
                      € {quadroEconomico.totaleIvato.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottoni di Salvataggio */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition"
            >
              Annulla
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition"
            >
              <Calculator className="w-4 h-4" />
              <span>{initialData ? 'Aggiorna Preventivo' : 'Salva & Emetti Preventivo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
