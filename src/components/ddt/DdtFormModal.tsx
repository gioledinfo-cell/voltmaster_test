import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Truck,
  Package,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Barcode,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CausaleDDT, AspettoBeniDDT, PortoDDT, TipoVettoreDDT, RigaDDT } from '../../types/ddt';
import { MaterialeSearchSelect } from '../common/MaterialeSearchSelect';
import { ArticoloMagazzino } from '../../types';

interface DdtFormModalProps {
  onClose: () => void;
}

export const DdtFormModal: React.FC<DdtFormModalProps> = ({ onClose }) => {
  const { cantieri, clienti, veicoli, dipendenti, magazzino, addDdt, currentUser, showToast } = useApp();

  const activeCantieri = cantieri.filter((c) => c.stato !== 'completato');
  const initialCantiere = activeCantieri[0] || cantieri[0];
  const initialCliente = clienti.find((cl) => cl.id === initialCantiere?.clienteId) || clienti[0];

  const [cantiereId, setCantiereId] = useState(initialCantiere?.id || '');
  const [dataEmissione, setDataEmissione] = useState(new Date().toISOString().split('T')[0]);
  const [oraPartenza, setOraPartenza] = useState(
    new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  );

  const [causaleTrasporto, setCausaleTrasporto] = useState<CausaleDDT>('installazione_cantiere');
  const [aspettoBeni, setAspettoBeni] = useState<AspettoBeniDDT>('cartoni_imballati');
  const [numeroColli, setNumeroColli] = useState(4);
  const [pesoTotaleKg, setPesoTotaleKg] = useState(85);
  const [porto, setPorto] = useState<PortoDDT>('franco');
  const [tipoVettore, setTipoVettore] = useState<TipoVettoreDDT>('mezzo_proprio_mittente');

  const [veicoloId, setVeicoloId] = useState(veicoli[0]?.id || '');
  const [autistaNome, setAutistaNome] = useState(
    dipendenti.find((d) => d.reparto === 'capocantiere')?.nome + ' ' + dipendenti.find((d) => d.reparto === 'capocantiere')?.cognome || 'Marco Galli'
  );
  const [annotazioni, setAnnotazioni] = useState('Materiale destinato alla posa in opera cantiere.');
  const [scaricaMagazzino, setScaricaMagazzino] = useState(true);
  const [isArticlePickerOpen, setIsArticlePickerOpen] = useState(false);

  // Rows state
  const [righe, setRighe] = useState<RigaDDT[]>([
    {
      id: `r-${Date.now()}-1`,
      articoloId: magazzino[0]?.id,
      sku: magazzino[0]?.codiceSku || 'CAV-FG16-5G6',
      descrizione: magazzino[0]?.nome || 'Cavo FG16OR16 5G6 mm² per dorsale cantiere',
      unitaMisura: magazzino[0]?.unitaMisura || 'm',
      quantita: 100,
      lottoMatricola: 'LT-2026/01',
    },
  ]);

  const selectedCantiere = cantieri.find((c) => c.id === cantiereId);
  const selectedCliente = selectedCantiere
    ? clienti.find((cl) => cl.id === selectedCantiere.clienteId) || initialCliente
    : initialCliente;
  const selectedVeicolo = veicoli.find((v) => v.id === veicoloId);

  const handleCantiereChange = (cId: string) => {
    setCantiereId(cId);
  };

  const handleAddRiga = () => {
    const defaultArt = magazzino[0];
    setRighe((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}-${prev.length + 1}`,
        articoloId: defaultArt?.id,
        sku: defaultArt?.codiceSku || `SKU-${prev.length + 1}`,
        descrizione: defaultArt?.nome || 'Nuovo articolo cantiere',
        unitaMisura: defaultArt?.unitaMisura || 'pz',
        quantita: 10,
        lottoMatricola: '',
      },
    ]);
  };

  const handleAddRigaFromPicker = (art: ArticoloMagazzino, qta: number = 10) => {
    setRighe((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}-${prev.length + 1}`,
        articoloId: art.id,
        sku: art.codiceSku,
        descrizione: art.nome,
        unitaMisura: art.unitaMisura,
        quantita: qta || 10,
        lottoMatricola: art.barcodeEan || '',
      },
    ]);
  };

  const handleRemoveRiga = (index: number) => {
    setRighe((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectArticolo = (index: number, artId: string) => {
    const art = magazzino.find((m) => m.id === artId);
    if (!art) return;
    setRighe((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              articoloId: art.id,
              sku: art.codiceSku,
              descrizione: art.nome,
              unitaMisura: art.unitaMisura,
            }
          : r
      )
    );
  };

  const handleUpdateRiga = (index: number, updates: Partial<RigaDDT>) => {
    setRighe((prev) => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCantiere) {
      showToast('Seleziona un cantiere di destinazione valido.', 'error');
      return;
    }

    if (righe.length === 0) {
      showToast('Inserisci almeno un articolo nel DDT.', 'warning');
      return;
    }

    addDdt({
      dataEmissione,
      oraPartenza,
      stato: 'in_viaggio',
      mittenteRagioneSociale: 'VoltMaster Impianti Elettrici S.r.l.',
      mittenteIndirizzo: 'Via dell’Artigianato 18, 20100 Milano (MI)',
      mittentePiva: 'IT09876543210',
      cantiereId: selectedCantiere.id,
      cantiereNome: selectedCantiere.titolo,
      cantiereIndirizzo: selectedCantiere.indirizzo,
      cantiereCitta: selectedCantiere.citta,
      clienteNome: selectedCliente?.ragioneSociale || 'Cliente Cantiere',
      clientePivaCodFisc: selectedCliente?.partitaIva || '00000000000',
      causaleTrasporto,
      aspettoBeni,
      numeroColli: Number(numeroColli) || 1,
      pesoTotaleKg: Number(pesoTotaleKg) || 1,
      porto,
      tipoVettore,
      veicoloId: selectedVeicolo?.id,
      veicoloTarga: selectedVeicolo?.targa,
      veicoloModello: selectedVeicolo ? selectedVeicolo.modello : 'Mezzo aziendale',
      autistaNome,
      righe,
      annotazioni,
      scaricaMagazzino,
      creatoDa: {
        id: currentUser.id,
        name: currentUser.name,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Emissione Nuovo Documento di Trasporto (DDT)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Conforme D.P.R. 472/96 per movimentazione materiali e scarico magazzino cantiere
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Cantiere & Cliente */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>1. Destinazione Cantiere & Committente</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cantiere Operativo di Destinazione: *
                </label>
                <select
                  value={cantiereId}
                  onChange={(e) => handleCantiereChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:border-amber-500"
                  required
                >
                  {cantieri.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codice} - {c.titolo} ({c.citta})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Committente / Cessionario:
                </label>
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {selectedCliente?.ragioneSociale} (P.IVA: {selectedCliente?.partitaIva})
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
              <span>Indirizzo consegna:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {selectedCantiere?.indirizzo}, {selectedCantiere?.citta}
              </strong>
            </div>
          </div>

          {/* Section 2: Automezzo, Vettore e Dati Trasporto */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              <span>2. Vettore, Furgone & Condizioni Trasporto</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Autocarro / Furgone Aziendale:
                </label>
                <select
                  value={veicoloId}
                  onChange={(e) => setVeicoloId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:border-amber-500"
                >
                  {veicoli.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.targa} - {v.modello}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Conducente / Autista:
                </label>
                <input
                  type="text"
                  value={autistaNome}
                  onChange={(e) => setAutistaNome(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:border-amber-500"
                  placeholder="Nome autista o capocantiere"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data & Ora Partenza:
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dataEmissione}
                    onChange={(e) => setDataEmissione(e.target.value)}
                    className="w-3/5 px-2 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                  />
                  <input
                    type="time"
                    value={oraPartenza}
                    onChange={(e) => setOraPartenza(e.target.value)}
                    className="w-2/5 px-2 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Causale Trasporto:
                </label>
                <select
                  value={causaleTrasporto}
                  onChange={(e) => setCausaleTrasporto(e.target.value as CausaleDDT)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  <option value="installazione_cantiere">Conto Lavorazione Cantiere</option>
                  <option value="vendita_materiale">Vendita Materiali con Posa</option>
                  <option value="conto_visione">Conto Visione / Prova</option>
                  <option value="reso_magazzino">Reso Cantiere a Magazzino</option>
                  <option value="riparazione_garanzia">Riparazione / Taratura</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Aspetto Beni:
                </label>
                <select
                  value={aspettoBeni}
                  onChange={(e) => setAspettoBeni(e.target.value as AspettoBeniDDT)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  <option value="cartoni_imballati">Cartoni imballati</option>
                  <option value="bobine_cavi">Bobine cavi</option>
                  <option value="a_vista_colli">A vista in colli</option>
                  <option value="pallet_fasciato">Pallet fasciato</option>
                  <option value="sfuso_cassonato">Sfuso nel cassone</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  N. Colli:
                </label>
                <input
                  type="number"
                  min="1"
                  value={numeroColli}
                  onChange={(e) => setNumeroColli(parseInt(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peso Totale (Kg):
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={pesoTotaleKg}
                  onChange={(e) => setPesoTotaleKg(parseFloat(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Righe Materiali da Magazzino */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                <span>3. Materiali Elettrici Trasportati ({righe.length})</span>
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsArticlePickerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Cerca nel Catalogo / Barcode</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddRiga}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuova Voce</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {righe.map((riga, index) => {
                const stockItem = magazzino.find((m) => m.id === riga.articoloId);
                const isOverStock = stockItem && riga.quantita > stockItem.giacenza;

                return (
                  <div
                    key={riga.id}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Scegli da Inventario:</label>
                        <select
                          value={riga.articoloId || ''}
                          onChange={(e) => handleSelectArticolo(index, e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-xs"
                        >
                          <option value="">-- Seleziona Materiale --</option>
                          {magazzino.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.codiceSku} - {m.nome} (Giacenza: {m.giacenza} {m.unitaMisura})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Descrizione / Note:</label>
                        <input
                          type="text"
                          value={riga.descrizione}
                          onChange={(e) => handleUpdateRiga(index, { descrizione: e.target.value })}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-xs"
                          placeholder="Descrizione bene"
                          required
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] text-slate-500 mb-0.5">U.M.:</label>
                        <input
                          type="text"
                          value={riga.unitaMisura}
                          onChange={(e) => handleUpdateRiga(index, { unitaMisura: e.target.value })}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-xs text-center font-mono"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Quantità:</label>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={riga.quantita}
                          onChange={(e) => handleUpdateRiga(index, { quantita: parseFloat(e.target.value) || 1 })}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-right"
                          required
                        />
                      </div>

                      <div className="sm:col-span-1 flex items-end justify-center pt-3 sm:pt-0">
                        {righe.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRiga(index)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                            title="Rimuovi voce"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[10px]">SKU: {riga.sku}</span>
                        {stockItem && (
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                              isOverStock
                                ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold'
                                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            Giacenza magazzino: {stockItem.giacenza} {stockItem.unitaMisura}
                            {isOverStock ? ' (Giacenza superata!)' : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[10px]">Lotto / Matricola:</span>
                        <input
                          type="text"
                          value={riga.lottoMatricola || ''}
                          onChange={(e) => handleUpdateRiga(index, { lottoMatricola: e.target.value })}
                          placeholder="es. LT-2026/894"
                          className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warehouse Stock Deduction Toggle */}
            <div className="p-3 bg-amber-50/50 dark:bg-slate-950/80 border border-amber-300/40 rounded-lg flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scaricaMagazzino}
                  onChange={(e) => setScaricaMagazzino(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span>Scarica automaticamente le quantità dalle giacenze di magazzino</span>
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Registra movimento uscita cantiere
              </span>
            </div>
          </div>

          {/* Section 4: Annotazioni */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Annotazioni & Prescrizioni per la Consegna in Cantiere:
            </label>
            <textarea
              rows={2}
              value={annotazioni}
              onChange={(e) => setAnnotazioni(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              placeholder="Es. Consegna a pié d'opera previa verifica con capocantiere. Imballi integri."
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Emetti Documento di Trasporto (DDT)</span>
            </button>
          </div>
        </form>
      </div>

      {/* Universal Article Picker Modal */}
      {isArticlePickerOpen && (
        <MaterialeSearchSelect
          variant="modal"
          isOpen={isArticlePickerOpen}
          onClose={() => setIsArticlePickerOpen(false)}
          title="Seleziona Articolo per Documento di Trasporto (DDT)"
          subtitle="Cerca nel magazzino e nel catalogo per scaricare il materiale direttamente sul cantiere"
          onSelect={(art: ArticoloMagazzino, qta: number) => {
            handleAddRigaFromPicker(art, qta);
            setIsArticlePickerOpen(false);
          }}
        />
      )}
    </div>
  );
};
