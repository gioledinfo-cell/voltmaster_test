import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  CheckCircle2,
  Users,
  Shield,
  Briefcase,
  HardHat,
  Building2,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { INITIAL_USERS } from '../data/mockData';

export const LoginPage: React.FC = () => {
  const { login, loginError, setLoginError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('m.rossi@voltmaster.it');
  const [password, setPassword] = useState('voltmaster2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to app
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLoginError('Inserisci un indirizzo email o nome utente.');
      return;
    }

    setIsSubmitting(true);
    const success = await login(email, password, rememberMe);
    setIsSubmitting(false);

    if (success) {
      navigate('/', { replace: true });
    }
  };

  const handleQuickLogin = async (usrEmail: string) => {
    setEmail(usrEmail);
    setPassword('voltmaster2026');
    setIsSubmitting(true);
    const success = await login(usrEmail, 'voltmaster2026', true);
    setIsSubmitting(false);
    if (success) {
      navigate('/', { replace: true });
    }
  };

  const demoUserCards = [
    {
      user: INITIAL_USERS[0], // Marco Rossi
      title: 'Direzione & Amministrazione',
      roleTag: 'Amministratore / Contabilità',
      badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
      icon: <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      desc: 'Validazione ROL, margini commessa, costi orari e bilancio',
    },
    {
      user: INITIAL_USERS[1], // Roberto Fontana
      title: 'Ufficio Tecnico & PM',
      roleTag: 'Responsabile Progetti',
      badgeColor: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30',
      icon: <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      desc: 'Preventivi, schemi CEI 64-8, gestione cantiere & ordini',
    },
    {
      user: INITIAL_USERS[2], // Matteo Bianchi
      title: 'Capocantiere PES',
      roleTag: 'Persona Esperta / Cantiere',
      badgeColor: 'bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border-cyan-500/30',
      icon: <HardHat className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
      desc: 'Presenze operative, firma ROL cantiere e scarico materiali',
    },
    {
      user: INITIAL_USERS[3], // Davide Riva
      title: 'Operaio Specializzato',
      roleTag: 'Elettricista PES/PAV',
      badgeColor: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
      icon: <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      desc: 'Compilazione orario giornaliero e segnalazione materiali',
    },
    {
      user: INITIAL_USERS[5], // Laura Valenti
      title: 'Cliente Committente',
      roleTag: 'GreenTech Logistics S.p.A.',
      badgeColor: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/30',
      icon: <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      desc: 'Portale riservato committente, avanzamento SAL & DiCo 37/08',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Background Decorative Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Top Header Bar */}
      <header className="relative z-10 px-4 sm:px-8 py-5 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-sm bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <Zap className="w-6 h-6 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                Volt<span className="text-amber-400">Master</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                v2.4 Production
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Gestionale Integrato Impianti Elettrici, Cantieri & Sicurezza CEI 64-8
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 lg:p-12 gap-8 max-w-7xl mx-auto w-full">
        {/* Left Side: Login Form Card */}
        <div className="w-full lg:w-[460px] shrink-0">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div className="mb-6 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Autenticazione Sicura SSL / JWT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Accedi alla Piattaforma
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Inserisci le tue credenziali per accedere all&apos;organigramma e ai cantieri attivi.
              </p>
            </div>

            {/* Error Banner */}
            {loginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Errore di Autenticazione</div>
                  <div className="text-[11px] opacity-90 mt-0.5">{loginError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Email Aziendale o Nome Utente:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="es. m.rossi@voltmaster.it"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Password:
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Default: voltmaster2026
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 p-1 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
                    title={showPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <span>Ricordami su questo dispositivo</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifica Credenziali in corso...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>Accedi al Gestionale</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
              Problemi di accesso? Contatta l&apos;<span className="text-amber-400 font-semibold">Ufficio IT VoltMaster</span> al +39 02 889900.
            </div>
          </div>
        </div>

        {/* Right Side: Quick Login Demo Switcher */}
        <div className="flex-1 w-full space-y-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-7 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Accesso Rapido Ruoli Demo / Collaudo
                  </h3>
                  <p className="text-xs text-slate-400">
                    Clicca un profilo per accedere istantaneamente con le relative mansioni ed autorizzazioni
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hidden sm:inline-block">
                1-Click Testing Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoUserCards.map((card) => (
                <div
                  key={card.user.id}
                  onClick={() => handleQuickLogin(card.user.email)}
                  className="group cursor-pointer p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-amber-500/60 hover:bg-slate-900 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${card.badgeColor}`}>
                        {card.icon}
                        <span>{card.title}</span>
                      </span>
                      <span className="text-[10px] text-amber-400 group-hover:underline font-bold">
                        Accedi ➔
                      </span>
                    </div>

                    <div className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors">
                      {card.user.name}
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                      {card.user.email}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-tight">
                      {card.desc}
                    </div>
                  </div>

                  {card.user.qualifiche && card.user.qualifiche.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-slate-800/60">
                      {card.user.qualifiche.slice(0, 2).map((q, idx) => (
                        <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {q}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Organigramma completo di 20 dipendenti e 20+ clienti disponibile in dashboard.
              </span>
              <span className="text-[10px] text-slate-500 font-mono">2026 SSL Verified</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-8 py-4 border-t border-slate-800/80 text-center text-xs text-slate-500 bg-slate-950/60 backdrop-blur-xs">
        VoltMaster Gestionale Impianti Elettrici &copy; 2026 · Normativa CEI 64-8 / DM 37/08 · Tutti i diritti riservati.
      </footer>
    </div>
  );
};
