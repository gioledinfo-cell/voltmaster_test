import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Android / Chromium / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className={`p-3 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Installa App Cantiere su Smartphone</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono px-1.5 py-0.5 rounded-full font-bold">PWA</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Accesso istantaneo dalla schermata Home con funzionamento offline e guanti.
              </div>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isInstalling ? 'Installazione...' : 'Installa Ora'}</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Installa VoltMaster come App sulla schermata Home"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 transition-all ${className}`}
      >
        <Download className="w-4 h-4 stroke-[2.5]" />
        <span>{isInstalling ? 'Installazione...' : 'Installa App'}</span>
      </button>
    );
  }

  // iOS Safari flow (Safari WebKit requires Share -> Add to Home Screen)
  if (isIOS) {
    return (
      <>
        {variant === 'banner' ? (
          <div className={`p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 ${className}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-amber-500 flex items-center justify-center font-black shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Installa VoltMaster su iPhone / iPad
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Aggiungi alla schermata Home per uso a tutto schermo e offline.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-all shrink-0 flex items-center gap-1"
            >
              <Share className="w-3.5 h-3.5" />
              <span>Istruzioni</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            title="Istruzioni per installare VoltMaster su iPhone/iPad"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] border border-amber-500/40 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl transition-all ${className}`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Installa PWA</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                    ⚡
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Installa su iPhone o iPad
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </div>
                  <div>
                    Tocca il pulsante <strong className="text-slate-900 dark:text-white">Condividi</strong> (icona quadrato con freccia in su) nella barra inferiore di Safari.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </div>
                  <div>
                    Scorri verso il basso nel menu e seleziona <strong className="text-slate-900 dark:text-white">"Aggiungi alla schermata Home"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </div>
                  <div>
                    Tocca <strong className="text-slate-900 dark:text-white">Aggiungi</strong> in alto a destra. L'icona VoltMaster comparirà tra le tue app mobili!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20"
              >
                Ho Capito
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
