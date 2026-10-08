import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  ArrowDownLeft,
  Plus,
  Search,
  Layers,
} from 'lucide-react';
import { CantiereMaterialeStock } from '../../types/cantiereDashboard';
import { ResourceThumbnail } from '../preview/ResourceThumbnail';

interface CantiereMaterialiSectionProps {
  materiali: CantiereMaterialeStock[];
  onRichiediReintegro?: (mat: CantiereMaterialeStock) => void;
}

export const CantiereMaterialiSection: React.FC<CantiereMaterialiSectionProps> = ({
  materiali,
  onRichiediReintegro,
}) => {
  const [filterStock, setFilterStock] = useState<'tutti' | 'in_esaurimento'>('tutti');
  const [search, setSearch] = useState('');

  const filtered = materiali.filter((m) => {
    const matchesSearch =
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.categoria.toLowerCase().includes(search.toLowerCase());
    const matchesStock = filterStock === 'tutti' || m.statoStock !== 'ottimale';
    return matchesSearch && matchesStock;
  });

  const getStockBadge = (stato: CantiereMaterialeStock['statoStock']) => {
    switch (stato) {
      case 'critico':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
            <AlertTriangle className="w-3 h-3" /> Critico Sottoscorta
          </span>
        );
      case 'in_esaurimento':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
            In Esaurimento
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
            <CheckCircle2 className="w-3 h-3" /> Regolare
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm dark:shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <span>Materiali & Risorse in Cantiere</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {materiali.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoraggio dei quantitativi allocati, consumati e giacenze vive stoccate presso il cantiere.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Filtra materiale..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setFilterStock(filterStock === 'tutti' ? 'in_esaurimento' : 'tutti')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
              filterStock === 'in_esaurimento'
                ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {filterStock === 'in_esaurimento' ? 'Mostra Tutti' : 'Solo Sottoscorta'}
          </button>
        </div>
      </div>

      {/* Material Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-950/70 text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-3 w-16 text-center font-semibold">Foto</th>
              <th className="py-2.5 px-3 font-semibold">Materiale / Risorsa</th>
              <th className="py-2.5 px-3 font-semibold">Categoria</th>
              <th className="py-2.5 px-3 font-semibold text-right">Allocato</th>
              <th className="py-2.5 px-3 font-semibold text-right">Consumato</th>
              <th className="py-2.5 px-3 font-semibold text-right">Giacenza Cantiere</th>
              <th className="py-2.5 px-3 font-semibold">Stato Scorta</th>
              <th className="py-2.5 px-3 font-semibold text-center">Azione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500">
                  Nessun materiale corrisponde ai filtri selezionati.
                </td>
              </tr>
            ) : (
              filtered.map((mat) => {
                const percUsed = Math.min(100, Math.round((mat.quantitaUtilizzata / (mat.quantitaAllocata || 1)) * 100));

                return (
                  <tr key={mat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-center">
                      <ResourceThumbnail
                        category="materiale"
                        alt={mat.nome}
                        title={mat.nome}
                        subtitle={`Giacenza Cantiere: ${mat.giacenzaRimanente} ${mat.unitaMisura}`}
                        size="sm"
                        clickable={true}
                        details={[
                          { label: 'Allocato', value: `${mat.quantitaAllocata} ${mat.unitaMisura}` },
                          { label: 'Consumato', value: `${mat.quantitaUtilizzata} ${mat.unitaMisura}` },
                          { label: 'Giacenza', value: `${mat.giacenzaRimanente} ${mat.unitaMisura}` },
                          { label: 'Stato', value: mat.statoStock },
                        ]}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{mat.nome}</div>
                      {mat.ultimoScaricoData && (
                        <div className="text-[10px] text-slate-500">
                          Ultimo scarico: {mat.ultimoScaricoData}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 capitalize">
                      {mat.categoria.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800 dark:text-slate-300 font-bold">
                      {mat.quantitaAllocata} <span className="text-[10px] text-slate-500 font-normal">{mat.unitaMisura}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {mat.quantitaUtilizzata} <span className="text-[10px] text-slate-500 font-normal">{mat.unitaMisura}</span>
                      <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1 ml-auto overflow-hidden">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full"
                          style={{ width: `${percUsed}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {mat.giacenzaRimanente} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{mat.unitaMisura}</span>
                    </td>
                    <td className="py-3 px-3">
                      {getStockBadge(mat.statoStock)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {mat.statoStock !== 'ottimale' ? (
                        <button
                          onClick={() => onRichiediReintegro && onRichiediReintegro(mat)}
                          className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-colors"
                        >
                          Reintegra
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
