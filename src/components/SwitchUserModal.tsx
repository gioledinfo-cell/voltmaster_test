import React, { useState } from 'react';
import {
  X,
  Users,
  Shield,
  Briefcase,
  HardHat,
  Wrench,
  Building2,
  CheckCircle2,
  Search,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_USERS } from '../data/mockData';
import { DIPENDENTI } from '../data/dipendenti';

interface SwitchUserModalProps {
  onClose: () => void;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({ onClose }) => {
  const { currentUser, switchUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReparto, setSelectedReparto] = useState<string>('tutti');

  // Combine INITIAL_USERS and DIPENDENTI for comprehensive profile options
  const allUsersList = INITIAL_USERS.map((u) => {
    const dip = DIPENDENTI.find(
      (d) =>
        (d.email && d.email.toLowerCase() === u.email.toLowerCase()) ||
        (`${d.nome} ${d.cognome}`).toLowerCase().includes(u.name.toLowerCase())
    );
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      reparto: u.reparto || dip?.reparto || 'ufficio_tecnico',
      phone: u.phone || dip?.telefono || '+39 02 889900',
      qualifiche: u.qualifiche || (dip ? [dip.ruoloAziendale, ...(dip.patentini || [])] : []),
      cantiereAssegnato: dip ? 'Cantiere In Corso' : 'Sede Centrale',
    };
  });

  const filteredUsers = allUsersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.reparto.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRep = selectedReparto === 'tutti' || u.reparto === selectedReparto;

    return matchesSearch && matchesRep;
  });

  const handleSelectUser = async (userId: string) => {
    await switchUser(userId);
    onClose();
  };

  const getRepartoBadge = (rep: string) => {
    switch (rep) {
      case 'contabilita':
        return { label: 'Amministrazione', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30', icon: <Shield className="w-3.5 h-3.5 text-purple-500" /> };
      case 'ufficio_tecnico':
        return { label: 'Ufficio Tecnico / PM', color: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30', icon: <Briefcase className="w-3.5 h-3.5 text-amber-500" /> };
      case 'capocantiere':
        return { label: 'Capocantiere PES', color: 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-500/30', icon: <HardHat className="w-3.5 h-3.5 text-cyan-500" /> };
      case 'operaio':
      case 'apprendista':
        return { label: 'Operaio / Apprendista', color: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30', icon: <Wrench className="w-3.5 h-3.5 text-emerald-500" /> };
      default:
        return { label: 'Cliente Committente', color: 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-500/30', icon: <Building2 className="w-3.5 h-3.5 text-indigo-500" /> };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Dev Mode / Collaudo
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Cambio utente senza password
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Seleziona Utente / Ruolo Operativo
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca per nome, email o reparto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={selectedReparto}
            onChange={(e) => setSelectedReparto(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
          >
            <option value="tutti">Tutti i Reparti</option>
            <option value="contabilita">Amministrazione & Contabilità</option>
            <option value="ufficio_tecnico">Ufficio Tecnico & PM</option>
            <option value="capocantiere">Capocantiere PES</option>
            <option value="operaio">Operai & Apprendisti</option>
          </select>
        </div>

        {/* User Cards List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[60vh]">
          {filteredUsers.map((usr) => {
            const isCurrent = currentUser?.id === usr.id;
            const badge = getRepartoBadge(usr.reparto);

            return (
              <div
                key={usr.id}
                onClick={() => handleSelectUser(usr.id)}
                className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/60 text-slate-900 dark:text-slate-100 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-extrabold text-amber-600 dark:text-amber-400 shrink-0 text-sm border border-slate-300 dark:border-slate-700">
                    {usr.name.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {usr.name}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                          <CheckCircle2 className="w-3 h-3" /> Utente Attivo
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {usr.email} · {usr.phone}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      {usr.cantiereAssegnato && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          📍 {usr.cantiereAssegnato}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-amber-500 group-hover:text-slate-950'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{isCurrent ? 'In uso' : 'Passa a questo profilo'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredUsers.length} utenti trovati nel database aziendale</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
