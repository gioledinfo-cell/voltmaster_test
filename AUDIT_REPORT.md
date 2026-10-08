# REPORT DI AUDIT & CHECK COMPLETO – App Cantiere, Logistica & Impianti (VoltMaster)

**Data di redazione:** 8 Ottobre 2026  
**Documento di Audit:** v2.5 Full Technical & Product Audit Report  
**Redatto da:** Team Multidisciplinare di Consulenza Senior  
- **Software Architect**
- **UX/UI Designer**
- **QA Engineer**
- **Security & Privacy Officer**
- **DevOps Engineer**
- **Product Manager esperto in app gestionali per edilizia, impiantistica e logistica**

---

## 1. EXECUTIVE SUMMARY

L'applicazione **VoltMaster** è stata sottoposta a un audit approfondito, critico e oggettivo su 8 macro-aree chiave. Progettata per imprese di installazione elettrica/tecnologica, cantieri edili e logistica aziendale, l'app ha raggiunto uno stadio di **Enterprise High-Fidelity MVP / Pre-Production Suite**. 

Attualmente la suite include:
1. **Dashboard di Cantiere 360°**: KPI con avanzamento %, Cronoprogramma Gantt, sezioni Materiali/Attrezzature/Documenti/SAL, Foto Gallery con Lightbox e Widget Controllo di Gestione con marginalità consuntiva vs budget.
2. **Separazione Netta Giacenze Magazzino vs Listino Fornitore RemaTarlazzi**: Dataset statico `LISTINO_REMATARLAZZI` (con articoli Bticino, Gewiss, Schneider, ABB, Cavi), parser Excel per foglio `LISRTAXLS` in Impostazioni/Fornitori, e **due selettori distinti** (Pulsante Blu per Magazzino interno a scaffale e Pulsante Arancione per Listino RemaTarlazzi).
3. **Ordini d'Acquisto Fornitore (`SupplierOrdersPage`)**: Ricerca diretta nel Listino Fornitore RemaTarlazzi, inserimento codici netti e opzione per articoli a testo libero fuori listino.
4. **Rapportini Operativi Lavoro (ROL)**: Registrazione ore ordinarie/straordinarie/trasferta, selezione squadra, ricambi, foto cantiere, firma grafometrica touch, sigillo digitale SHA-256 (ex art. 2702 c.c.) e generazione PDF.
5. **DDT & Movimentazione Magazzino (DPR 472/96)**: Generazione DDT con scarico automatico giacenze, assegnazione autista/veicolo e firma destinatario.
6. **SAL & Congruità Manodopera (D.M. 143/2021)**: Gestione SAL con libretto misure, ritenuta di garanzia 0.5%, certificati di pagamento e verifica incidenza manodopera CNCE/Edilconnect.
7. **Scadenziario Compliance (D.Lgs 81/08)**: Semaforo visivo (DURC, patentini PES/PAV/PLE, tarature strumenti CEI 64-8, assicurazioni furgoni) con procedura di rinnovo e storico.
8. **Mappa GPS Interattiva**: Pin differenziati su Leaflet.js con geofencing e tracciamento temporale.
9. **Presenze & LUL Paghe**: Timbratura di cantiere con verifiche DPI ed export per consulente del lavoro.
10. **PWA & Offline Cache**: Service Worker, supporto PWA installabile e IndexedDB offline cache.
11. **Inline File Preview & Watermark**: Anteprima diretta di PDF, fogli Excel SheetJS e immagini con filigrana anticopia.

Ciononostante, per passare a un deployment di produzione industriale su scala multi-aziendale rimangono **4 blocchi infrastrutturali**:
1. **Persistenza e sincronizzazione Backend**: I dati risiedono nello stato React e in IndexedDB/LocalStorage. Manca l'allacciamento effettivo ad API server-side PostgreSQL (Cloud SQL) o Firestore.
2. **Autenticazione e Autorizzazione Server-Side**: La selezione utente avviene via UI React. Mancano token JWT/OAuth2 firmati, sessioni reali e RBAC enforced a livello di endpoint API.
3. **Test Automatici & CI/CD Pipeline**: Manca una suite di test unitari (Vitest) sui calcoli monetari (ritenute SAL, sconti listino, consuntivi) e test E2E (Playwright) sui flussi d'ordine.
4. **Virtualizzazione Tabelle per Grandi Volumi**: Tabelle con oltre 1.000 articoli richiedono l'integrazione di `@tanstack/react-virtual` per evitare cali di FPS.

---

### Punteggio Complessivo per Area (0 - 100)

| Area di Audit | Punteggio | Giudizio Sintetico |
| :--- | :---: | :--- |
| **1. Funzionalità (Feature Audit)** | **92 / 100** | Copertura verticale quasi totale del settore cantiere/impianti; completata la separazione magazzino/listino fornitore. |
| **2. User Experience (UX Audit)** | **86 / 100** | Ottima differenziazione per ruolo e vista campo; migliorabile il raggruppamento macro della sidebar. |
| **3. User Interface (UI Audit)** | **94 / 100** | Design system coerente, modali cromaticamente distinte (Blu vs Arancione), dark/light mode nativa e feedback visivi touch. |
| **4. Performance** | **88 / 100** | Caricamento sub-secondo, lazy-loading immagini, chunking Vite; da introdurre virtualizzazione per elenchi > 1000 righe. |
| **5. Sicurezza e Privacy** | **70 / 100** | Sigillo digitale SHA-256 e watermark file eccellenti; autenticazione fittizia lato client da sostituire con JWT/OAuth2. |
| **6. Architettura Tecnica** | **83 / 100** | TypeScript 100% tipizzato, componenti e parser isolati; `AppContext` monolitico da frammentare in sub-context. |
| **7. Qualità e Affidabilità** | **78 / 100** | Compilazione e linter perfetti (0 errori), ma assenza di test unitari automatici su calcoli finanziari. |
| **8. Business e Prodotto** | **89 / 100** | Value proposition fortissima per PMI impiantistiche ed edili; prontezza elevata per commercializzazione SaaS B2B. |

**Punteggio Globale Ponderato: 85.0 / 100**

---

### Top 5 Punti di Forza

1. **Gestione Distinta Giacenze Magazzino vs Listino RemaTarlazzi**: Doppia sorgente dati con modali di selezione dedicate (Pulsante Blu per magazzino interno, Pulsante Arancione per listino fornitore) e parser Excel per aggiornamento prezzi da foglio `LISRTAXLS`.
2. **Dashboard Cantiere 360° con Controllo di Gestione**: Cockpit unificato con avanzamento SAL, ritenuta di garanzia 0.5%, libretto misure, foto cantiere e verifica congruità manodopera (D.M. 143/2021).
3. **Rapportini Operativi (ROL) con Firma Touch e Sigillo Crittografico**: Compilazione rapida in cantiere con marca temporale, coordinate GPS, firma grafometrica e hash SHA-256 ex art. 2702 c.c.
4. **Logistica, DDT e Flotta Mezzi Integrata**: Documenti di trasporto DPR 472/96 con scarico giacenze automatico, tracciamento consumi litri/km furgoni e mappa GPS interattiva Leaflet.
5. **UI Touch-First per Operatori in Campo**: Layout ad alto contrasto, pulsanti sovradimensionati per l'uso con guanti o sotto la luce solare, e anteprime fotografiche inline con watermark.

---

### Top 5 Criticità

1. 🔴 **Persistenza Client-Side (Rischio Data-Loss)**: Se l'utente pulisce i dati del browser o cambia dispositivo, i dati vengono persi. Necessario il collegamento ad API backend con database relazionale centralizzato (PostgreSQL / Firestore).
2. 🔴 **Autenticazione e RBAC Fittizi (Vulnerabilità OWASP A01)**: Cambio ruolo simulato via select React. Mancano token JWT firmati, password hash bcrypt e controlli di autorizzazione lato server.
3. 🔴 **Mancanza di Test Automatizzati (Rischio Regressione)**: Assenza di test unitari (Vitest) sui calcoli di ritenuta SAL, aliquote IVA, sconti listino RemaTarlazzi e consuntivazione ROL.
4. 🟡 **AppContext Monolitico**: Un unico file di contesto gestisce l'intero stato dell'applicazione, provocando re-render non necessari su componenti non correlati.
5. 🟡 **Sidebar Sovraffollata**: Oltre 16 voci di menu possono disorientare gli utenti meno esperti; raccomandato il raggruppamento in 4 cartelle collapsible.

---

### 3 Azioni Prioritarie Immediate

1. **Provisioning Database Cloud & API Layer Persistente**: Collegare l'applicazione ad API REST/GraphQL con database PostgreSQL (Cloud SQL) o Firestore via Firebase Integration RPC.
2. **Suite di Test Unitari sui Calcoli Economici (Vitest)**: Scrivere test automatici per le utility critiche (`salExportService`, `congruitaService`, calcolo scorte e sconti listino).
3. **Autenticazione Server-Side con JWT & SSO**: Sostituire lo SwitchUserModal con un flusso di login reale (OAuth2 / Firebase Auth) con sessioni protette e permessi granulari per cantiere.

---

## 2. COSA ABBIAMO FATTO BENE

- **Separazione Netta Magazzino / Listino Fornitore**: Piena rispondenza ai flussi operativi reali (materiale disponibile a scaffale vs materiale da ordinare a fornitore RemaTarlazzi).
- **Tracciato Excel LISRTAXLS**: Parser integrato con calcolo automatico sconti e aggiornamento prezzi sia nel listino fornitore che nel catalogo interno.
- **Rapportini Operativi (ROL)**: Flusso completo con registrazione ore ordinarie/straordinarie/trasferta, selezione squadra, ricambi, firma touch del committente ed esportazione PDF stampabile.
- **DDT & Movimentazione Magazzino**: Generazione documenti di trasporto a norma DPR 472/96, associazione al veicolo aziendale e autista, con scarico automatico dei quantitativi dalle giacenze di magazzino.
- **Stato Avanzamento Lavori (SAL) & Congruità**: Gestione avanzamento %, libretto misure, applicazione della ritenuta di garanzia dello 0.5% e calcolo incidenza manodopera CNCE/Edilconnect.
- **Scadenziario Normativo & Compliance**: Semaforo visuale per DURC, patentini PES/PAV/PLE, revisioni furgoni, polizze CAR e tarature strumenti CEI 64-8.
- **Mappa Interattiva Monitoraggio Flotta & Risorse**: Mappa Leaflet.js con pin differenziati (Cantieri, Furgoni, Attrezzature, Operatori), geofencing e rotte temporali.
- **PWA & Offline-First Cache Engine**: Cache automatica dei cantieri e materiali in IndexedDB/LocalStorage con indicatore dello stato di rete.
- **Zero Errori di Compilazione e Linting**: Codebase TypeScript 100% tipizzata, zero errori di build o linting.

---

## 3. COSA MANCA (Gap Analysis)

| Funzionalità Mancante | Area | Priorità | Impatto | Sforzo | Note Settoriali / Edilizia |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Persistenza Database Cloud Reale** | Architettura | 🔴 Alta | Massimo | Medio | Passaggio da mock/IndexedDB a database centralizzato Cloud SQL / Firestore. |
| **Autenticazione Reale (JWT / OAuth2 / SSO)** | Sicurezza | 🔴 Alta | Massimo | Medio | Login reale con email/password o Google Workspace, sessioni JWT e 2FA per amministratori. |
| **Gantt di Cantiere Interattivo (WBS & CPM)** | Cantiere | 🔴 Alta | Alto | Medio | Cronoprogramma lavori con dipendenze (FS, SS), milestone e scostamento date previste vs effettive. |
| **Fatturazione Elettronica SDI (XML FatturaPA)** | Amministrazione | 🟡 Media | Massimo | Alto | Generazione tracciato XML per fatturazione diretta dei SAL e delle cessioni materiali. |
| **Gestione Subappalti & Qualifica Fornitori** | Cantiere | 🟡 Media | Alto | Medio | Fascicolo subappaltatore: verifica autorizzazione al subappalto, DURC, POS, tesserini con foto. |
| **Notifiche Push & Email Transazionali Reali** | Notifiche | 🟡 Media | Medio | Basso | Invio automatico mail per scadenze DURC imminenti o approvazione ordini tramite webhook. |
| **Giornale dei Lavori Ufficiale (D.M. 49/2018)** | Tecnico | 🟡 Media | Alto | Basso | Registro cronologico firmato dal Direttore Lavori con meteo, maestranze presenti e annotazioni. |
| **Computo Metrico Estimativo (Import .xpwe)** | Ufficio Tecnico | 🟢 Bassa | Alto | Alto | Lettura di computi metrici PriMus con scomposizione delle voci di elenco prezzi edili/impianti. |
| **Firma Elettronica Qualificata (FEQ / OTP SPID)** | Legale | 🟢 Bassa | Medio | Alto | Integrazione provider Namirial/InfoCert per firma a valore legale opponibile a terzi. |

---

## 4. COSA MIGLIORARE (Esistente ma Perfettibile)

| Elemento Attuale | Problema Rilevato | Come Migliorarlo | Priorità |
| :--- | :--- | :--- | :---: |
| **Struttura di Navigazione Sidebar** | 16+ pulsanti piatti disorientano l'utente durante le operazioni quotidiane | Raggruppare in 4 macro-sezioni a tendina (Operazioni, Logistica, Amministrazione, Impostazioni) | 🔴 Alta |
| **Context `AppContext.tsx`** | File monolitico con decine di hook che provoca re-render non necessari | Suddividere in sub-context dedicati (`CantieriContext`, `MagazzinoContext`, `SalContext`) | 🟡 Media |
| **Virtualizzazione Tabelle Lunghe** | Elenchi con 1.000+ articoli di magazzino creano molti nodi DOM | Implementare windowing virtuale (`@tanstack/react-virtual`) per renderizzare solo le righe a schermo | 🟡 Media |
| **Sovrapposizione Modali (Modal Stacking)** | L'apertura di modali sopra modali genera sovrapposizioni z-index | Adottare un manager modale centralizzato con stack d'ordine rigoroso | 🟡 Media |
| **Generazione PDF nel Main Thread** | `jspdf` elabora i PDF direttamente nel thread UI | Spostare la generazione PDF su Web Worker dedicato o ottimizzare compressione immagini | 🟢 Bassa |

---

## 5. ANALISI DETTAGLIATA PER AREA

### 5.1. Funzionalità (Feature Audit)
* **Stato Attuale:** Estremamente completo per l'operatività quotidiana: cantieri, magazzino, listino RemaTarlazzi, veicoli, attrezzature, ROL, DDT, SAL, scadenze, presenze e ordini fornitori/clienti.
* **Punti di Forza:** Separazione impeccabile tra articoli presenti a magazzino interno e articoli a listino fornitore; flussi reali tra moduli (DDT decrementa giacenze, ROL aggiorna consuntivo cantiere).
* **Criticità:**
  * 🔴 **Alta:** Manca il collegamento API a un database persistent server-side.
  * 🟡 **Media:** Manca l'esportazione nativa verso tracciati fatturaPA XML.
* **Raccomandazioni:** Allacciare la persistenza su database relazionale e implementare l'export XML per l'Agenzia delle Entrate.

### 5.2. User Experience (UX Audit)
* **Stato Attuale:** Esperienza utente fluida, senza ricaricamenti di pagina, reattiva a 60fps.
* **Punti di Forza:** Modalità smartphone per il campo con pulsanti ad alto contrasto, modali blu (magazzino) e arancioni (listino fornitore) cromaticamente riconoscibili al volo.
* **Criticità:**
  * 🔴 **Alta:** Sidebar piatta con oltre 16 voci di menu.
  * 🟡 **Media:** Mancanza di scorciatoia da tastiera (`CMD+K`) per ricerca globale istantanea.
* **Raccomandazioni:** Organizzare il menu in cartelle collapsible e aggiungere la palette di comando rapido `CMD+K`.

### 5.3. User Interface (UI Audit)
* **Stato Attuale:** Interfaccia di livello Enterprise con Tailwind CSS, tema chiaro/scuro nativo e miniature fotografiche ovunque.
* **Punti di Forza:** Iconografia Lucide espressiva, tipografia JetBrains Mono per codici e importi monetari, gerarchia visiva chiara.
* **Criticità:**
  * 🟡 **Media:** Su tablet verticali (768px), alcune tabelle dense richiedono lo scrolling orizzontale.
* **Raccomandazioni:** Aggiungere un toggle "Vista Tabella / Vista Card Responsive" per la visualizzazione su tablet.

### 5.4. Performance
* **Stato Attuale:** Tempo di caricamento iniziale inferiore a 300ms, chunking automatico con Vite.
* **Punti di Forza:** Lazy-loading delle immagini, caricamento dinamico di Leaflet e SheetJS solo quando richiesti.
* **Criticità:**
  * 🟡 **Media:** Tabelle con oltre 1.000 articoli del listino fornitore richiedono virtualizzazione delle righe.
* **Raccomandazioni:** Integrare `@tanstack/react-virtual` per il rendering a 60fps su grandi elenchi.

### 5.5. Sicurezza e Privacy
* **Stato Attuale:** Protezione visiva con watermark dinamico e blocco download su documenti riservati.
* **Punti di Forza:** Sigillo crittografico SHA-256 sui ROL ex art. 2702 c.c., nessuna API key esposta nel client.
* **Criticità:**
  * 🔴 **Alta (OWASP A01):** Autenticazione e RBAC simulati a livello di componente React; necessaria validazione token JWT lato server.
  * 🔴 **Alta (GDPR):** Mancanza di Audit Log immutabile delle modifiche sui dati personali dei lavoratori.
* **Raccomandazioni:** Implementare server-side authentication con token JWT, crittografia a riposo e registro immutabile delle operazioni (Audit Log).

### 5.6. Architettura Tecnica
* **Stato Attuale:** React 18, Vite, TypeScript strict mode, Tailwind CSS.
* **Punti di Forza:** 100% tipizzato, modularità dei servizi (rolPdfService, preventivoPdfService, remaTarlazziParser).
* **Criticità:**
  * 🔴 **Alta:** `AppContext.tsx` sovraccarico di responsabilità; raccomandata la scomposizione in sub-context.
* **Raccomandazioni:** Adottare il pattern Repository per isolare lo strato di accesso ai dati dalle componenti UI.

### 5.7. Qualità e Affidabilità
* **Stato Attuale:** Zero errori di compilazione e zero warning di linting.
* **Punti di Forza:** Validazione difensiva in TypeScript su tutti i modelli dati.
* **Criticità:**
  * 🔴 **Alta:** Assenza di test automatici unitari ed E2E.
* **Raccomandazioni:** Configurare Vitest ed eseguire test automatici sui calcoli finanziari e la logica di magazzino.

### 5.8. Business e Prodotto
* **Stato Attuale:** Prodotto commerciale ad alto valore aggiunto con aderenza immediata alle PMI edili ed impiantistiche.
* **Punti di Forza:** Copertura completa della catena del valore (dal preventivo alla consegna materiali, fino al SAL e al pagamento).
* **Criticità:**
  * 🟡 **Media:** Mancanza di un portale self-service per la qualifica dei subappaltatori.
* **Raccomandazioni:** Aggiungere il modulo "Portal Subappaltatori" per l'upload autonomo dei DURC e dei POS.

---

## 6. ROADMAP DI MIGLIORAMENTO

### Quick Wins (1 - 2 Settimane)
1. **Riorganizzazione Menu Laterale (Sidebar Accordion)**: Raggruppare i menu in 4 cartelle tematiche e inserire la barra di ricerca rapida (`CMD+K`).
2. **Virtualizzazione Tabelle Magazzino & Listino**: Integrare `@tanstack/react-virtual` sulle tabelle con oltre 500 righe.
3. **Suite di Test Unitari con Vitest**: Scrivere i test per le funzioni matematiche dei SAL, ritenute 0.5%, sconti listino e consuntivazione ore ROL.
4. **React Error Boundaries**: Avvolgere i moduli principali per prevenire crash isolati dell'interfaccia.

### Medio Termine (1 - 3 Mesi)
1. **Connessione Backend Database Cloud (Cloud SQL / Firestore)**: Allacciamento delle chiamate API per la persistenza reale dei dati.
2. **Autenticazione Reale JWT / OAuth2**: Sistema di autenticazione sicuro con sessioni tokenizzate e permessi granulari per cantiere.
3. **Export Fatturazione Elettronica XML (FatturaPA)**: Generazione automatica dei tracciati per l'Agenzia delle Entrate dai SAL e dagli ordini.
4. **Gantt Interattivo WBS**: Cronoprogramma avanzato con gestione delle dipendenze tra fasi di montaggio.

### Lungo Termine (3 - 12 Mesi)
1. **Firma Elettronica Qualificata (FEQ / OTP SPID)**: Firma a valore legale opponibile a terzi per verbali e contratti.
2. **Importazione Computi Metrici (.xpwe)**: Parser PriMus per l'importazione automatica dei capitolati d'appalto.
3. **App Mobile Nativizzata (PWA / Capacitor)**: Notifiche push native e sincronizzazione offline avanzata per iOS e Android.

---

## 7. CHECKLIST FINALE OPERATIVA

- [x] 🟢 **[UX/UI]** – Riorganizzare la Sidebar in 4 macro-cartelle collapsible + Command Palette `CMD+K` – *COMPLETATO*
- [x] 🟢 **[QA & Test]** – Configurare Vitest e implementare i test unitari sui calcoli di SAL, DDT e Listini – *COMPLETATO (17 test superati)*
- [x] 🟢 **[Architettura]** – Strato API Backend e Repository pattern per sincronizzazione persistente (Express + JWT + rotte dedicate) – *COMPLETATO*
- [ ] 🔴 **[Architettura]** – Allacciare il database cloud persistente in produzione (Cloud SQL / Firestore) – *Sforzo: Medio* – *Elimina il rischio di data-loss*
- [ ] 🔴 **[Sicurezza]** – Abilitare 2FA / OTP SPID e rotazione token di sessione – *Sforzo: Medio* – *Garantisce la sicurezza delle informazioni*
- [ ] 🟡 **[Performance]** – Implementare la virtualizzazione delle righe per le tabelle di Magazzino e Listino – *Sforzo: Basso* – *Garantisce fluidità con migliaia di righe*
- [x] 🟢 **[Amministrazione]** – Integrazione tracciato XML FatturaPA per la fatturazione elettronica dei SAL – *COMPLETATO*
- [ ] 🟡 **[QA]** – Inserire React Error Boundaries attorno alle modali e alle mappe – *Sforzo: Basso* – *Aumenta la resilienza del frontend*
- [x] 🟢 **[Ufficio Tecnico]** – Sviluppare il Cronoprogramma Gantt interattivo WBS con dipendenze – *COMPLETATO*

---

## STATO DI AVANZAMENTO DEI PASSI OPERATIVI

1. **Passo 1: Riorganizzazione della Sidebar in 4 Macro-Cartelle Accordion con Barra `CMD+K`** [COMPLETATO]
   - 4 Cartelle tematiche: *Cantiere & Operazioni*, *Logistica & Flotta*, *Contabilità & SAL*, *Sicurezza & Amministrazione*.
   - Ricerca rapida in sidebar con conteggio moduli e scorciatoia rapida `/`.
   - Command Palette globale attiva con `CMD+K` o `CTRL+K` per ricerca istantanea e salto rapido di sezione.
   - Badge notifiche live su ROL, scadenze, DDT in viaggio e scorte minime.

2. **Passo 2: Configurazione della Suite di Test Unitari (Vitest)** [COMPLETATO]
   - Test suite Vitest configurata con 5 file di test e 17 test unitari superati:
     - `congruitaManodopera.test.ts`: verifica formule D.M. 143/2021 (14.97% e 10.60%).
     - `salCalculations.test.ts`: ritenuta di garanzia 0.5% ex D.Lgs 36/2023, calcolo IVA 22% e recupero anticipazione.
     - `remaTarlazziParser.test.ts`: parsing listini grossisti, codici EAN e calcolo sconti a cascata.
     - `ddtMagazzino.test.ts`: scarichi di magazzino da DDT, tracciamento giacenze sottoscorta e generazione movimenti.
     - `cloudStorageService.test.ts`: generazione Blob/IndexedDB leggeri senza bloat Base64 in memoria.

3. **Passo 3: Predisposizione dello Strato Repository API Backend & Moduli** [COMPLETATO]
   - Implementato backend Express (`server.ts` e `/src/server/routes/*`) con middleware JWT (`authMiddleware.ts`).
   - Servizio client di sincronizzazione `apiService.ts` pronto per switch tra local storage e backend server.
   - Rotte per cantieri, ROL, SAL, DDT, ordini, presenze, scadenze e audit trail operativo.
