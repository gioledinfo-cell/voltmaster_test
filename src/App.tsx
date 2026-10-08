import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp, NavigationTab } from './context/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CantieriModule } from './components/CantieriModule';
import { PreventiviModule } from './components/PreventiviModule';
import { LavorazioniModule } from './components/LavorazioniModule';
import { ROLModule } from './components/ROLModule';
import { MagazzinoModule } from './components/MagazzinoModule';
import { AttrezzatureModule } from './components/AttrezzatureModule';
import { VeicoliModule } from './components/VeicoliModule';
import { DipendentiModule } from './components/DipendentiModule';
import { DocumentiModule } from './components/DocumentiModule';
import { ClientePortal } from './components/ClientePortal';
import { ContabilitaDashboard } from './components/ContabilitaDashboard';
import { CampoMobileView } from './components/CampoMobileView';
import { MagazzinoPortal } from './components/MagazzinoPortal';
import { OrdiniModule } from './components/ordini/OrdiniModule';
import { PresenzeModule } from './components/presenze/PresenzeModule';
import { SalModule } from './components/sal/SalModule';
import { ScadenziarioModule } from './components/scadenziario/ScadenziarioModule';
import { DdtModule } from './components/ddt/DdtModule';
import { RichiesteMaterialiModule } from './components/richieste/RichiesteMaterialiModule';
import { AdminMapView } from './components/map/AdminMapView';
import { PowerAppsModule } from './components/powerapps/PowerAppsModule';
import { PowerAppsProvider } from './context/PowerAppsContext';
import { OrganigrammaModal } from './components/OrganigrammaModal';
import { QRModal } from './components/QRModal';
import { QRScannerModal } from './components/QRScannerModal';
import { FlussoCantiereModal } from './components/FlussoCantiereModal';
import { OfflineCacheModal } from './components/OfflineCacheModal';
import { FilePreviewProvider } from './context/FilePreviewContext';
import { FilePreview } from './components/preview/FilePreview';
import { SupplierOrdersPage } from './pages/SupplierOrdersPage';
import { CustomerOrdersPage } from './pages/CustomerOrdersPage';
import { SettimanaMonitorView } from './components/tv/SettimanaMonitorView';
import { EtichettaColloA5Modal } from './components/magazzino/EtichettaColloA5Modal';
import { ConfermaCaricoPaccoModal } from './components/magazzino/ConfermaCaricoPaccoModal';
import { NuovoPaccoZonaVerdeModal } from './components/magazzino/NuovoPaccoZonaVerdeModal';
import { SicurezzaCantierePanel } from './components/sicurezza/SicurezzaCantierePanel';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

interface MainLayoutProps {
  forcedTab?: NavigationTab;
}

const MainLayout: React.FC<MainLayoutProps> = ({ forcedTab }) => {
  const {
    activeTab,
    setActiveTab,
    interfaceMode,
    qrModalData,
    closeQRModal,
    isScannerOpen,
    closeScanner,
    handleScannedCode,
    isOfflineModalOpen,
    offlineModalTab,
    closeOfflineModal,
    selectedPaccoStampa,
    setSelectedPaccoStampa,
    activePaccoCaricoModal,
    setActivePaccoCaricoModal,
    isNuovoPaccoModalOpen,
    setIsNuovoPaccoModalOpen,
    toasts,
    dismissToast,
  } = useApp();

  const location = useLocation();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFlussoCantiereOpen, setIsFlussoCantiereOpen] = useState(false);
  const [isOrganigrammaOpen, setIsOrganigrammaOpen] = useState(false);

  // Sync route with activeTab
  useEffect(() => {
    if (forcedTab) {
      setActiveTab(forcedTab);
    } else if (location.pathname === '/ordini-fornitori') {
      setActiveTab('ordini_fornitori');
    } else if (location.pathname === '/ordini-clienti') {
      setActiveTab('ordini_clienti');
    }
  }, [forcedTab, location.pathname, setActiveTab]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200">
      {/* Top Header */}
      <Header
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        onOpenFlussoCantiere={() => setIsFlussoCantiereOpen(true)}
        onOpenOrganigramma={() => setIsOrganigrammaOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Responsive Sidebar */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenFlussoCantiere={() => setIsFlussoCantiereOpen(true)}
          onOpenOrganigramma={() => setIsOrganigrammaOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-7 pb-24 lg:pb-7 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <ErrorBoundary
            title="Modulo temporaneamente non disponibile"
            subtitle="Si è verificato un errore nel caricamento del modulo selezionato. Puoi ripristinarlo senza perdere lo stato globale dell'applicazione."
          >
            {/* Dedicated Interface Views */}
            {interfaceMode === 'magazzino_portale' && activeTab === 'portale_magazzino' ? (
              <MagazzinoPortal />
            ) : interfaceMode === 'cantiere_mobile' && activeTab === 'rol' ? (
              <CampoMobileView onOpenFlussoCantiere={() => setIsFlussoCantiereOpen(true)} />
            ) : interfaceMode === 'contabilita' && (activeTab === 'contabilita_kpi' || activeTab === 'dashboard') ? (
              <ContabilitaDashboard />
            ) : interfaceMode === 'cliente_portal' && activeTab === 'cliente_portal' ? (
              <ClientePortal />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard
                    onOpenFlussoCantiere={() => setIsFlussoCantiereOpen(true)}
                    onOpenCreateROL={() => setActiveTab('rol')}
                  />
                )}
                {/* Separate Orders Pages */}
                {activeTab === 'ordini_fornitori' && <SupplierOrdersPage />}
                {activeTab === 'ordini_clienti' && <CustomerOrdersPage />}
                {activeTab === 'ordini_interni' && <OrdiniModule />}
                
                {/* Operations & Sites */}
                {activeTab === 'richieste_materiali' && <RichiesteMaterialiModule />}
                {activeTab === 'presenze_cantiere' && <PresenzeModule />}
                {activeTab === 'sal_cantiere' && <SalModule />}
                {activeTab === 'ddt_trasporto' && <DdtModule />}
                {activeTab === 'sicurezza_cantiere' && <SicurezzaCantierePanel />}
                {activeTab === 'mappa_gps' && <AdminMapView />}
                {activeTab === 'scadenziario' && <ScadenziarioModule />}
                {activeTab === 'powerapps_flotta_asset' && <PowerAppsModule />}
                {activeTab === 'contabilita_kpi' && <ContabilitaDashboard />}
                {activeTab === 'cantieri' && <CantieriModule />}
                {activeTab === 'preventivi' && <PreventiviModule />}
                {activeTab === 'lavorazioni' && <LavorazioniModule />}
                {activeTab === 'rol' && <ROLModule />}
                {activeTab === 'magazzino' && <MagazzinoModule />}
                {activeTab === 'portale_magazzino' && <MagazzinoPortal />}
                {activeTab === 'attrezzature' && <AttrezzatureModule />}
                {activeTab === 'veicoli' && <VeicoliModule />}
                {activeTab === 'dipendenti' && (
                  <DipendentiModule onOpenOrganigramma={() => setIsOrganigrammaOpen(true)} />
                )}
                {activeTab === 'documenti' && <DocumentiModule />}
                {activeTab === 'cliente_portal' && <ClientePortal />}
                {activeTab === 'organigramma' && (
                  <DipendentiModule onOpenOrganigramma={() => setIsOrganigrammaOpen(true)} />
                )}
              </>
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Global QR Code Modal */}
      {qrModalData && (
        <QRModal data={qrModalData} onClose={closeQRModal} />
      )}

      {/* Global QR Scanner Modal */}
      {isScannerOpen && (
        <QRScannerModal
          onClose={closeScanner}
          onCodeScanned={handleScannedCode}
        />
      )}

      {/* Field Operations Guided Wizard */}
      {isFlussoCantiereOpen && (
        <FlussoCantiereModal onClose={() => setIsFlussoCantiereOpen(false)} />
      )}

      {/* Architectural Organigramma Modal (20 Dipendenti · 20+ Clienti) */}
      {isOrganigrammaOpen && (
        <OrganigrammaModal onClose={() => setIsOrganigrammaOpen(false)} />
      )}

      {/* Offline Storage Modal (Cantieri & Materiali Cached in IndexedDB / LocalStorage) */}
      <OfflineCacheModal
        isOpen={isOfflineModalOpen}
        onClose={closeOfflineModal}
        defaultTab={offlineModalTab}
      />

      {/* Universal Fullscreen Inline File Preview Modal */}
      <FilePreview />

      {/* Segnacollo A5 Print & PDF Modal */}
      {selectedPaccoStampa && (
        <EtichettaColloA5Modal
          pacco={selectedPaccoStampa}
          onClose={() => setSelectedPaccoStampa(null)}
          onConfermaCarico={() => {
            const p = selectedPaccoStampa;
            setSelectedPaccoStampa(null);
            setActivePaccoCaricoModal(p);
          }}
        />
      )}

      {/* Conferma Carico Mezzo & Verifica Spunta Modal */}
      {activePaccoCaricoModal && (
        <ConfermaCaricoPaccoModal
          pacco={activePaccoCaricoModal}
          onClose={() => setActivePaccoCaricoModal(null)}
        />
      )}

      {/* Nuovo Pacco Spedizione Zona Verde Modal */}
      {isNuovoPaccoModalOpen && (
        <NuovoPaccoZonaVerdeModal
          onClose={() => setIsNuovoPaccoModalOpen(false)}
          onSuccess={(nuovoPacco) => {
            setSelectedPaccoStampa(nuovoPacco);
          }}
        />
      )}

      {/* Toast Notifications Stack */}
      <div className="fixed bottom-20 lg:bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium transition-all ${
              toast.type === 'success'
                ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                : toast.type === 'warning'
                ? 'bg-white/95 dark:bg-slate-900/95 border-amber-500/40 text-amber-800 dark:text-amber-200'
                : toast.type === 'error'
                ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/40 text-rose-800 dark:text-rose-200'
                : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Mobile Bottom Navigation Bar (Smartphones & Tablets < 1024px) */}
      <MobileBottomNav
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary
      title="Si è verificato un errore critico nell'applicazione"
      subtitle="VoltMaster ha intercettato un'eccezione a livello globale. I tuoi dati su server e database locale non sono compromessi."
    >
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <PowerAppsProvider>
              <FilePreviewProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                      path="/tv"
                      element={
                        <ProtectedRoute>
                          <SettimanaMonitorView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/monitor-settimanale"
                      element={
                        <ProtectedRoute>
                          <SettimanaMonitorView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/ordini-fornitori"
                      element={
                        <ProtectedRoute>
                          <MainLayout forcedTab="ordini_fornitori" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/ordini-clienti"
                      element={
                        <ProtectedRoute>
                          <MainLayout forcedTab="ordini_clienti" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <MainLayout />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <ProtectedRoute>
                          <MainLayout />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </BrowserRouter>
              </FilePreviewProvider>
            </PowerAppsProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
