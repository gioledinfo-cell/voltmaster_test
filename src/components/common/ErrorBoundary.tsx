import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Home,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback personalizzato o render function (error, reset) => ReactNode */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Callback invocato al verificarsi di un errore */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback invocato quando l'utente preme il pulsante di ripristino */
  onReset?: () => void;
  /** Titolo visualizzato nel fallback di default */
  title?: string;
  /** Sottotitolo o messaggio visualizzato nel fallback */
  subtitle?: string;
  /** Mostra pulsante per tornare alla dashboard principale */
  showHomeButton?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

/**
 * ErrorBoundary - Componente per la cattura e gestione degli errori a runtime
 * VoltMaster - Gestionale Impianti Elettrici
 *
 * Cattura errori di rendering nei componenti figli, previene il crash dell'intera applicazione
 * e fornisce un'interfaccia di fallback professionale conforme al design system aziendale.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Invoca callback opzionale
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (err) {
        console.error('Errore nell\'esecuzione di onError in ErrorBoundary:', err);
      }
    }

    // Log per diagnostica
    console.error('🚨 [VoltMaster ErrorBoundary] Errore a runtime catturato:', error);
    console.error('Stack trace del componente:', errorInfo.componentStack);
  }

  /**
   * Resetta lo stato dell'ErrorBoundary per tentare il ricaricamento del componente
   */
  handleReset = (): void => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (err) {
        console.error('Errore nell\'esecuzione di onReset:', err);
      }
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    });
  };

  /**
   * Ricarica l'intera finestra dell'applicazione
   */
  handleReloadPage = (): void => {
    window.location.reload();
  };

  /**
   * Ritorna alla pagina principale o route radice
   */
  handleGoHome = (): void => {
    this.handleReset();
    window.location.href = '/';
  };

  /**
   * Copia i dettagli tecnici dell'errore negli appunti per assistenza tecnica
   */
  handleCopyError = (): void => {
    const { error, errorInfo } = this.state;
    const errorDetails = [
      `=== VOLTMASTER ERROR REPORT ===`,
      `Timestamp: ${new Date().toISOString()}`,
      `Messaggio: ${error?.message || 'Errore sconosciuto'}`,
      `Nome Errore: ${error?.name || 'Error'}`,
      `Stack Errore:\n${error?.stack || 'Nessuno stack'}`,
      `Component Stack:\n${errorInfo?.componentStack || 'Nessuno stack componente'}`,
    ].join('\n\n');

    navigator.clipboard
      .writeText(errorDetails)
      .then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      })
      .catch((err) => {
        console.error('Impossibile copiare il report errore:', err);
      });
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showDetails, copied } = this.state;
    const {
      children,
      fallback,
      title = 'Si è verificato un errore imprevisto',
      subtitle = 'Il modulo corrente ha riscontrato un problema di esecuzione a runtime. I dati salvati sono al sicuro, ma il componente richiede un ripristino.',
      showHomeButton = true,
    } = this.props;

    if (!hasError) {
      return children;
    }

    // Supporto per render prop personalizzato o nodo React custom
    if (fallback) {
      if (typeof fallback === 'function') {
        return (fallback as (error: Error, reset: () => void) => ReactNode)(
          error || new Error('Errore sconosciuto'),
          this.handleReset
        );
      }
      return fallback;
    }

    // UI Grafica di Fallback di default
    return (
      <div className="min-h-[420px] w-full flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden transition-all">
          {/* Barra decorativa superiore in stile VoltMaster */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

          {/* Intestazione con Icona Grafica */}
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                  VoltMaster Ripristino
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Codice: {error?.name || 'RuntimeError'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Box Messaggio Errore */}
          {error && (
            <div className="mt-5 p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm text-rose-800 dark:text-rose-300 font-mono break-words">
                <span className="font-semibold block font-sans text-rose-900 dark:text-rose-200 mb-0.5">
                  Messaggio di sistema:
                </span>
                {error.message || 'Nessun messaggio fornito dal runtime'}
              </div>
            </div>
          )}

          {/* Pulsanti Azione Principali */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold rounded-xl text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Ripristina componente
            </button>

            <button
              type="button"
              onClick={this.handleReloadPage}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl text-sm transition-colors border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Ricarica pagina
            </button>

            {showHomeButton && (
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-medium rounded-xl text-sm transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
            )}
          </div>

          {/* Dettagli Tecnici Collapsible */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={this.toggleDetails}
              className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              <span>Dettagli tecnici e diagnostica</span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showDetails && (
              <div className="mt-3 space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={this.handleCopyError}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Copiato negli appunti!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copia log errore
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-64 border border-slate-800 space-y-2 select-text">
                  <div>
                    <span className="text-amber-400 font-semibold">Error Name:</span>{' '}
                    {error?.name || 'Error'}
                  </div>
                  <div>
                    <span className="text-amber-400 font-semibold">Message:</span>{' '}
                    {error?.message || 'N/A'}
                  </div>
                  {error?.stack && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-slate-400 whitespace-pre-wrap text-[11px] leading-relaxed">
                      <span className="text-amber-400 font-semibold block mb-1">Stack Trace:</span>
                      {error.stack}
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-slate-400 whitespace-pre-wrap text-[11px] leading-relaxed">
                      <span className="text-amber-400 font-semibold block mb-1">Component Stack:</span>
                      {errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Higher-Order Component per avvolgere qualsiasi componente con un ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const ComponentWithErrorBoundary: React.FC<P> = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
