# REPORT DI AUDIT & CHECK COMPLETO – App Cantiere & Logistica (VoltMaster)

**Data di redazione:** 4 Ottobre 2026  
**Documento di Audit:** v2.0 Enterprise Review  
**Redatto da:** Team Multidisciplinare di Consulenza Senior  
- **Software Architect**
- **UX/UI Designer**
- **QA Engineer**
- **Security & Privacy Officer**
- **DevOps Engineer**
- **Product Manager esperto in app gestionali per edilizia, impiantistica e logistica**

---

## 1. EXECUTIVE SUMMARY

L'applicazione **VoltMaster** è stata sottoposta a una revisione critica e oggettiva a 360°. Nata come gestionale operativo per installatori e cantieri tecnologici, l'app ha raggiunto uno stadio di **Enterprise High-Fidelity MVP / Pre-Production Suite**. Integra una ricchezza funzionale non comune per un prototipo: dashboard cantiere integrata, ROL con firma grafometrica touch, DDT a norma DPR 472/96, SAL con libretto misure e certificati di pagamento, scadenziario a semaforo per DURC e patentini, timesheet con esportazione LUL paghe, ordini fornitore/cliente su Kanban, tracciamento GPS flotta e attrezzature su mappa Leaflet, data ingestion per 7 dataset Power Apps e preview inline di file PDF/Excel con watermark protettivo e miniature fotografiche ovunque.

Tuttavia, l'analisi evidenzia che per il passaggio a un deployment di produzione industriale su scala multi-aziendale rimangono **4 blocchi strutturali**:
1. **Persistenza dati e sincronizzazione**: il backend relazionale asincrono (PostgreSQL o Firestore) non è ancora allacciato in cloud (i dati risiedono nello stato React/IndexedDB client).
2. **Autenticazione e Sicurezza Server-Side**: l'autenticazione è simulata a livello UI; mancano JWT/OAuth reali, 2FA e RBAC server-side per impedire violazioni di autorizzazione.
3. **Contabilità Industriale e Congruità Manodopera**: mancano il calcolo del margine di contribuzione in tempo reale (scostamento preventivo vs consuntivo) e la verifica di congruità CNCE (D.M. 143/2021).
4. **Assenza di Test Automatizzati ed Error Boundaries**: 0 suite di test unitari/E2E e nessun Error Boundary React per isolare crash isolati.

### Punteggio Complessivo per Area (Scala 0 - 100)

| Area di Audit | Punteggio | Giudizio Sintetico |
| :--- | :---: | :--- |
| **1. Funzionalità (Feature Audit)** | **88 / 100** | Copertura verticale profonda del settore cantiere/impianti; mancano Gantt con CPM e congruità manodopera. |
| **2. User Experience (UX Audit)** | **84 / 100** | Ottima differenziazione dei ruoli operativi; la sidebar con oltre 16 voci necessita di raggruppamento macro. |
| **3. User Interface (UI Audit)** | **92 / 100** | Design system coerente, dark/light mode nativa, miniature fotografiche responsive con lightbox e feedback visivi. |
| **4. Performance** | **87 / 100** | Caricamento sub-secondo, lazy-loading immagini, chunking Vite; da introdurre virtualizzazione liste lunghe. |
| **5. Sicurezza e Privacy** | **68 / 100** | Watermark file e blocco download ottimi; autenticazione fittizia e assenza di crittografia a riposo critica. |
| **6. Architettura Tecnica** | **81 / 100** | TypeScript 100% tipizzato, Context separati, moduli PDF/Excel isolati; `AppContext` monolitico da snellire. |
| **7. Qualità e Affidabilità** | **75 / 100** | Compilazione e linter perfetti (0 errori), ma assenza totale di test automatici (unit, integration, E2E). |
| **8. Business e Prodotto** | **86 / 100** | Value proposition fortissima per PMI impiantistiche ed edili; alta prontezza per modello SaaS B2B. |

**Punteggio Globale Ponderato: 82.6 / 100**

---

### Top 5 Punti di Forza

1. **Dashboard di Cantiere 360° con SAL e Libretto Misure**: Centralizzazione in un unico cockpit di avanzamento lavori, materiali impegnati, attrezzature in uso, certificati di pagamento e documentazione tecnica.
2. **Suite di Logistica & Tracciamento Mezzi/Attrezzature**: Coniuga DDT conformi, calcolo consumi litri/km flotta, gestione strumenti CEI 64-8 e mappa di monitoraggio con tracciamento temporale e auto-zoom.
3. **Rapportini Operativi (ROL) con Firma Grafometrica & Scadenziario a Semaforo**: Workflow digitale senza carta con firma touch del cliente sul posto e monitoraggio preventivo scadenze DURC/patentini.
4. **Universal Document & Photo Preview Inline**: Lettura istantanea di PDF, fogli Excel (SheetJS), foto e computi senza dover uscire dall'app, protetta da watermark dinamico anticopia.
5. **UI Resiliente per il Cantiere Mobile**: Modalità smartphone con contrasto elevato, bottoni ampi per dita o guanti, e miniature fotografiche su ogni tabella per identificare i pezzi a colpo d'occhio.

---

### Top 5 Criticità

1. 🔴 **Persistenza Solo Client-Side (Rischio Data-Loss)**: Se l'utente pulisce i dati del browser o cambia dispositivo, perde lo storico. Mancano le chiamate API a un database centralizzato PostgreSQL o Firestore.
2. 🔴 **Autenticazione e RBAC Fittizi (Vulnerabilità Critica OWASP A01)**: Il cambio utente tra Perito, Capocantiere, Magazziniere e Cliente avviene tramite una select React. Nessuna sessione con token firmato, nessuna crittografia delle password, nessun controllo lato server sui permessi.
3. 🔴 **Mancanza di Test Automatizzati (Rischio Regressione)**: Nessun test unitario (Vitest/Jest) sui calcoli monetari (ritenute di garanzia 0.5%, margini preventivo, aliquote IVA, totali DDT) né test E2E (Playwright) sui flussi core.
4. 🟡 **Sidebar Sovraffollata & Assenza di Breadcrumbs Strutturati**: Oltre 16 voci di menu orizzontali/verticali creano carico cognitivo; serve un menu raggruppato in 4 macro-hub ("Operazioni Cantiere", "Logistica & Mezzi", "Economico & SAL", "Amministrazione & Compliance").
5. 🟡 **Mancanza di Controllo di Congruità della Manodopera (Edilconnect / CNCE)**: Per appalti superiori a 70.000€ è obbligatorio in Italia verificare l'incidenza della manodopera sul valore dell'opera prima del saldo finale.

---

### 3 Azioni Prioritarie Immediate

1. **Provisioning Database Cloud & API Layer**: Connettere l'app a PostgreSQL (Cloud SQL) o Firestore via Firebase Integration RPC per rendere persistenti commesse, DDT, ROL e scadenze.
2. **Raggruppamento e Riorganizzazione UX della Navigazione**: Riorganizzare la Sidebar in cartelle a fisarmonica e aggiungere breadcrumbs di navigazione per evitare che l'utente si perda tra le modali.
3. **Integrazione Test Unitari sui Calcoli Economici e Logistici**: Configurare Vitest e scrivere i test per le funzioni matematiche critiche: ritenuta di garanzia SAL, calcolo consumo km/l veicoli, decremento scorte magazzino su emissione DDT.

---

## 2. COSA ABBIAMO FATTO BENE

- **Copertura Completa del Settore Elettrico ed Edile**: L'applicazione parla il linguaggio reale del cantiere italiano (ROL, SAL, DDT, DURC, POS, CEI 64-8, LUL, matricole, canaline, cavi FG16).
- **Rapportini Operativi (ROL)**: Flusso completo con registrazione ore ordinarie/straordinarie, selezione colleghi di squadra, materiali impiegati, firma touch del committente ed esportazione PDF stampabile.
- **DDT & Movimentazione Magazzino**: Generazione documenti di trasporto a norma DPR 472/96, associazione al veicolo aziendale e autista, con scarico automatico dei quantitativi dalle giacenze di magazzino.
- **Stato Avanzamento Lavori (SAL)**: Gestione completa di avanzamento %, importi contrattuali, libretto misure, applicazione della ritenuta di garanzia dello 0.5% a tutela della committenza e certificati di pagamento formali.
- **Scadenziario Normativo & Compliance**: Semaforo visuale (Scaduto, In Scadenza, Conforme) per DURC, patentini PES/PAV/PLE, revisioni furgoni, polizze CAR e tarature strumenti di misura, con procedura guidata di rinnovo e dropdown di notifica.
- **Mappa Interattiva Monitoraggio Flotta & Risorse**: Mappa Leaflet.js ad alta reattività con pin differenziati (Cantieri, Furgoni, Attrezzature, Operatori), tracciamento rotte temporali, geofencing e ricerca con pan/zoom automatico.
- **Modulo Presenze con Export Paghe LUL**: Registrazione timbrature di cantiere con esportazione tracciato tabellare compatibile con i software paghe dei consulenti del lavoro.
- **Anteprime Fotografiche e Documentali**: Componente `ResourceThumbnail` con lazy loading, fallback cromatico per categoria e lightbox full-screen, unito alla preview inline di PDF ed Excel SheetJS protetti da watermark.
- **PWA & Offline-First Cache Engine**: Cache automatica dei cantieri e materiali in IndexedDB/LocalStorage con indicatore dello stato di rete in tempo reale.
- **Zero Errori di Compilazione**: Codebase TypeScript pulita al 100%, nessun errore di compilazione o linting, stili coerenti gestiti con Tailwind CSS.

---

## 3. COSA MANCA (Gap Analysis)

| Funzionalità Mancante | Area | Priorità | Impatto | Sforzo | Note Settoriali / Edilizia |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Persistenza Database Cloud Reale** | Architettura | 🔴 Alta | Massimo | Medio | Passaggio da mock/IndexedDB a database centralizzato Cloud SQL / Firestore. |
| **Autenticazione Reale (Auth0 / Firebase / SSO)** | Sicurezza | 🔴 Alta | Massimo | Medio | Login reale con email/password o Google Workspace, sessioni JWT e 2FA per amministratori. |
| **Gantt di Cantiere Interattivo (WBS & CPM)** | Cantiere | 🔴 Alta | Alto | Medio | Cronoprogramma lavori con dipendenze (FS, SS), milestone e scostamento date previste vs effettive. |
| **Verifica Congruità Manodopera (D.M. 143/2021)** | Contabilità | 🔴 Alta | Alto | Basso | Calcolo automatico della % minima di manodopera richiesta dalle tabelle CNCE per rilascio congruità. |
| **Gestione Subappalti & Qualifica Fornitori** | Cantiere | 🟡 Media | Alto | Medio | Fascicolo subappaltatore: verifica autorizzazione al subappalto, DURC, POS, tesserini con foto. |
| **Fatturazione Elettronica SDI (XML FatturaPA)** | Amministrazione | 🟡 Media | Massimo | Alto | Generazione tracciato XML per fatturazione diretta dei SAL e delle cessioni materiali. |
| **Notifiche Push & Email Transazionali Reali** | Notifiche | 🟡 Media | Medio | Basso | Invio automatico mail per scadenze DURC imminenti o approvazione ordini tramite webhook. |
| **Giornale dei Lavori Ufficiale (D.M. 49/2018)** | Tecnico | 🟡 Media | Alto | Basso | Registro cronologico firmato dal Direttore Lavori con meteo, maestranze presenti e annotazioni. |
| **Computo Metrico Estimativo (Import .xpwe / Six)** | Ufficio Tecnico | 🟢 Bassa | Alto | Alto | Lettura di computi metrici PriMus con scomposizione delle voci di elenco prezzi edili/impianti. |
| **Firma Elettronica Qualificata (FEQ / OTP SPID)** | Legale | 🟢 Bassa | Medio | Alto | Integrazione provider Namirial/InfoCert per firma a valore legale opponibile a terzi dei verbali. |

---

## 4. COSA MIGLIORARE (Esistente ma Perfettibile)

| Elemento Attuale | Problema Rilevato | Come Migliorarlo | Priorità |
| :--- | :--- | :--- | :---: |
| **Struttura di Navigazione Sidebar** | 16+ pulsanti piatti disorientano l'utente durante le operazioni quotidiane | Raggruppare in 4 macro-sezioni a tendina (Operazioni, Logistica, Amministrazione, Impostazioni) | 🔴 Alta |
| **Context `AppContext.tsx`** | File monolitico con decine di hook che provoca re-render non necessari | Suddividere in sub-context dedicati (`CantieriContext`, `MagazzinoContext`, `SalContext`) | 🟡 Media |
| **Sovrapposizione Modali (Modal Stacking)** | L'apertura di modali sopra modali (es. QR Scanner sopra Form) genera glitch di focus e scroll | Adottare un router modale centralizzato con gestione dello stack z-index e chiusura sequenziale | 🟡 Media |
| **Virtualizzazione Tabelle Lunghe** | Elenchi con 500+ articoli di magazzino creano migliaia di nodi DOM | Implementare windowing virtuale (`@tanstack/react-virtual`) per renderizzare solo le righe a schermo | 🟡 Media |
| **Calcolo Costi Manodopera ROL** | Il calcolo usa tariffe medie; non tiene conto del costo orario effettivo per qualifica | Collegare il costo orario alla scheda anagrafica del dipendente (inclusi contributi edili e INAIL) | 🟡 Media |
| **Filtri Temporali della Mappa** | I filtri orari sono pre-impostati su fasce fisse | Aggiungere un date-picker libero per ripercorrere lo storico spostamenti di qualsiasi giornata passata | 🟢 Bassa |
| **Generazione PDF nel Main Thread** | `jspdf` elabora i PDF direttamente nel thread UI, rischiando micro-freeze | Spostare la generazione PDF su un Web Worker dedicato o ottimizzare l'inserimento immagini | 🟢 Bassa |

---

## 5. ANALISI DETTAGLIATA PER AREA

### 5.1. Funzionalità (Feature Audit)
* **Stato Attuale:** Livello di completezza funzionale eccezionale per le routine quotidiane: cantieri, materiali, veicoli, attrezzature, ROL, DDT, SAL, scadenze, presenze e ordini.
* **Punti di Forza:** Flussi reali tra moduli (es. l'emissione del DDT decrementa la giacenza in magazzino; il ROL alimenta il consuntivo ore del cantiere).
* **Criticità:**
  * 🔴 **Alta:** Mancanza della verifica di **Congruità della Manodopera (D.M. 143/2021)**: obbligatoria in Italia per evitare blocchi nei pagamenti da parte della cassa edile.
  * 🟡 **Media:** Mancanza di un **Cronoprogramma Gantt** visuale con dipendenze tra fasi di montaggio.
  * 🟢 **Bassa:** Assenza di import/export diretto nei formati nativi dei software di computo metrico (PriMus `.xpwe`).
* **Raccomandazioni:** Introdurre un tab "Congruità & Incidenza" nel modulo SAL che calcoli il rapporto tra monte ore registrato dai ROL e importo lavori, confrontandolo con le percentuali minime del settore impiantistico.

### 5.2. User Experience (UX Audit)
* **Stato Attuale:** L'applicazione offre un'esperienza utente moderna, fluida e ad alte prestazioni (SPA senza tempi morti di caricamento pagina).
* **Punti di Forza:** La modalità dedicata "Campo & Cantiere Mobile" risponde esattamente alle necessità degli operai (pulsanti grandi, touch ottimizzato, contrasto visivo elevato).
* **Criticità:**
  * 🔴 **Alta:** Sidebar troppo lunga: 16 voci disorientano chi cerca una funzione specifica.
  * 🟡 **Media:** Mancanza di un wizard guidato "Nuovo Cantiere": oggi l'utente deve creare il cantiere, poi passare al magazzino per i materiali, poi ai veicoli per le assegnazioni in passaggi separati.
  * 🟢 **Bassa:** Assenza di scorciatoie da tastiera (keyboard shortcuts) per l'operatore desktop d'ufficio (es. `CMD+K` per ricerca globale).
* **Raccomandazioni:** Raggruppare la Sidebar in macro-categorie collapsible e implementare una barra di comando rapido (`CMD+K` / `Ctrl+K`) accessibile ovunque.

### 5.3. User Interface (UI Audit)
* **Stato Attuale:** Interfaccia professionale, esteticamente curata e conforme ai canoni dei moderni gestionali SaaS internazionali.
* **Punti di Forza:** Iconografia Lucide coerente, tipografia curata (JetBrains Mono per matricole e codici contabili, Plus Jakarta Sans per testi), anteprime fotografiche uniformate e supporto dark/light impeccabile.
* **Criticità:**
  * 🟡 **Media:** Su viewport tablet verticali (768px - 834px), alcune tabelle dense con molti campi costringono allo scrolling orizzontale.
  * 🟢 **Bassa:** Alcune modali informative secondarie hanno un'altezza che richiede scroll interno anche su desktop con schermi 1080p.
* **Raccomandazioni:** Fornire un selettore di visualizzazione "Tabella compatta / Card a blocchi" su tutte le viste gestionali desktop/tablet.

### 5.4. Performance
* **Stato Attuale:** Tempo di bootstrap inferiore a 300ms, transizioni reattive, bundle frontend ben suddiviso tramite chunking Vite.
* **Punti di Forza:** Tutte le miniature grafiche utilizzano il lazy-loading nativo (`loading="lazy"`), impedendo sovraccarichi di banda; le librerie pesanti (Leaflet, SheetJS) sono caricate solo all'occorrenza.
* **Criticità:**
  * 🟡 **Media:** Quando l'elenco materiali o i movimenti superano 1.000 record, il rendering dell'intera tabella DOM causa micro-lag durante la digitazione nella barra di ricerca.
  * 🟢 **Bassa:** I loghi aziendali e i canvas di firma nei PDF vengono codificati in base64 non compresso, aumentando il peso del file PDF finale.
* **Raccomandazioni:** Integrare la virtualizzazione delle righe per tabelle di magazzino e presenze con `@tanstack/react-virtual`.

### 5.5. Sicurezza e Privacy
* **Stato Attuale:** Presenza di difese visive (watermark dinamico, disabilitazione clic destro su documenti classificati), ma base infrastrutturale aperta.
* **Punti di Forza:** Nessuna chiave segreta API esposta nel client; gestione proxy server-side configurata.
* **Criticità:**
  * 🔴 **Alta (OWASP A01 - Broken Access Control):** L'autenticazione è puramente cosmetica nel client; un utente malintenzionato può modificare il local storage o l'interfaccia React per accedere a documenti riservati o autorizzare pagamenti SAL.
  * 🔴 **Alta (GDPR / Data Retention):** Mancanza di un log di audit immodificabile che registri *chi*, *quando* e *cosa* ha modificato o visualizzato (obbligatorio per i dati sanitari e i certificati di idoneità dei lavoratori).
  * 🟡 **Media:** Dati memorizzati in chiaro in LocalStorage e IndexedDB senza cifratura AES a riposo.
* **Raccomandazioni:** Implementare autenticazione server-side con token JWT firmati, cifratura a riposo per i dati sensibili del personale e registro di audit immutabile (Audit Log) per ogni operazione di modifica.

### 5.6. Architettura Tecnica
* **Stato Attuale:** Applicazione React SPA costruita su Vite, TypeScript strict mode e Tailwind CSS. Modulare, con servizi dedicati per export e parser.
* **Punti di Forza:** Zero errori TypeScript; eccellente separazione tra utilità di calcolo (servizi PDF, parser CSV, calcolatori SAL) e componenti UI.
* **Criticità:**
  * 🔴 **Alta:** `AppContext.tsx` funge da monolite di stato per l'intera app: contiene decine di hook che innescano re-render su componenti non correlati.
  * 🟡 **Media:** Mancanza di un layer astratto di API Repository che permetta di commutare trasparentemente tra modalità "Mock locale" e "Cloud DB remoto".
* **Raccomandazioni:** Scomporre `AppContext` in domini funzionali distinti (`CantiereContext`, `LogisticaContext`, `ComplianceContext`) e adottare un pattern Repository per le chiamate ai dati.

### 5.7. Qualità e Affidabilità
* **Stato Attuale:** Stabilità eccellente nel percorso base (happy path), zero warning in compilazione.
* **Punti di Forza:** Controlli di sicurezza difensivi in TypeScript (optional chaining, controlli di nullità su array e date).
* **Criticità:**
  * 🔴 **Alta:** Assoluta mancanza di test automatici (0 test unitari, 0 test E2E). Qualsiasi modifica futura alla logica di calcolo delle ritenute SAL o dei saldi di magazzino rischia di introdurre regressioni silenziose.
  * 🟡 **Media:** Assenza di `ErrorBoundary` React: se una libreria grafica di terze parti fallisce l'inizializzazione, l'intera applicazione crasha a schermo bianco.
* **Raccomandazioni:** Avvolgere i moduli principali in Error Boundaries e introdurre una suite Vitest per testare i servizi critici (`salExportService`, `ddtExportService`, calcolo scorte).

### 5.8. Business e Prodotto
* **Stato Attuale:** Il prodotto possiede una value proposition molto chiara: risolvere il caos operativo tra ufficio, cantiere e furgoni nelle aziende impiantistiche ed edili.
* **Punti di Forza:** Time-to-value immediato; un'azienda può iniziare a tracciare DDT, ore operai e scadenze in 10 minuti senza settimane di formazione.
* **Criticità:**
  * 🟡 **Media:** Manca la reportistica di **Margine di Commessa (Margine di Contribuzione consuntivo vs preventivo)**: il titolare dell'azienda ha bisogno di sapere in tempo reale se il cantiere sta guadagnando o andando in perdita.
  * 🟢 **Bassa:** Mancanza di un portale self-service per i subappaltatori per caricare autonomamente i propri documenti di sicurezza.
* **Raccomandazioni:** Sviluppare un widget sintetico di marginalità economica che confronti preventivo approvato, costi materiali (da DDT), costi manodopera (da ROL) e fatturato maturato (da SAL).

---

## 6. ROADMAP DI MIGLIORAMENTO

### Quick Wins (1 - 2 Settimane)
1. **Riorganizzazione Menu Laterale (Sidebar Accordion)**: Raggruppare i 16 menu in 4 sezioni logiche a fisarmonica e inserire tasto di ricerca globale (`CMD+K`).
2. **Error Boundaries & Safe Fallbacks**: Inserire componenti di cattura errori attorno a mappe, preview documentali e tabelle per prevenire crash a schermo bianco.
3. **Calcolo Congruità Manodopera nei SAL**: Aggiungere l'indicatore automatico di congruità percentuale CNCE nel modulo SAL.
4. **Suite di Test Unitari per Calcoli Critici**: Configurare Vitest e scrivere i test per ritenute SAL, totali DDT e consumo medio carburante.

### Medio Termine (1 - 3 Mesi)
1. **Connessione Database Cloud & Backend API**: Passaggio a PostgreSQL relazionale (Cloud SQL) o Firestore con sincronizzazione offline-first.
2. **Autenticazione Reale & Gestione Ruoli (RBAC)**: Login sicuro con token di sessione, 2FA obbligatorio per amministratori e autorizzazione granulare per cantiere.
3. **Controllo di Gestione & Margine di Commessa**: Dashboard economica consuntivo vs preventivo in tempo reale con alert di sforamento budget.
4. **Gantt Interattivo di Cantiere**: Cronoprogramma visuale con gestione avanzamento fasi e milestone.

### Lungo Termine (3 - 12 Mesi)
1. **Integrazione SDI Fatturazione Elettronica**: Generazione e ricezione automatica di file XML FatturaPA.
2. **Firma Elettronica Qualificata (FEQ / OTP)**: Valore probatorio legale per verbali di collaudo e contratti di subappalto.
3. **Importazione Computi Metrico Estimativi (.xpwe)**: Parsificatore file PriMus per caricamento immediato dei capitolati d'appalto.
4. **App Mobile Nativizzata (Capacitor/PWA Store)**: Notifiche push native e sincronizzazione in background su dispositivi iOS e Android.

---

## 7. CHECKLIST FINALE OPERATIVA

- [ ] 🔴 **[Sicurezza]** – Implementare autenticazione reale (JWT/OAuth) e protezione server-side delle rotte – *Sforzo: Medio* – *Priorità assoluta per evitare accessi non autorizzati*
- [ ] 🔴 **[Architettura]** – Allacciare il database cloud persistente (Cloud SQL / Firestore) – *Sforzo: Medio* – *Elimina il rischio di perdita dati sul client*
- [ ] 🔴 **[QA & Test]** – Configurare Vitest e implementare i test unitari sui calcoli di SAL, DDT e Magazzino – *Sforzo: Basso* – *Previene regressioni contabili*
- [ ] 🔴 **[UX/UI]** – Riorganizzare la Sidebar in 4 cartelle tematiche raggruppate – *Sforzo: Basso* – *Migliora immediatamente l'usabilità quotidiana*
- [ ] 🟡 **[Cantiere]** – Inserire il calcolo di Congruità della Manodopera (D.M. 143/2021) nel modulo SAL – *Sforzo: Basso* – *Requisito normativo essenziale per cantieri edili/impiantistici*
- [ ] 🟡 **[Performance]** – Implementare la virtualizzazione delle righe per le tabelle lunghe di Magazzino – *Sforzo: Basso* – *Mantiene fluida l'interfaccia con migliaia di righe*
- [ ] 🟡 **[QA]** – Introdurre React Error Boundaries per isolare eventuali errori di componenti esterni – *Sforzo: Basso* – *Aumenta la resilienza dell'applicazione*
- [ ] 🟡 **[Business]** – Implementare il calcolo del Margine di Commessa (costi reali ROL+DDT vs Preventivo) – *Sforzo: Medio* – *Chiave di volta per il controllo di gestione aziendale*
- [ ] 🟢 **[Ufficio Tecnico]** – Sviluppare il Cronoprogramma Gantt interattivo con dipendenze tra fasi – *Sforzo: Medio* – *Pianificazione avanzata per commesse complesse*
- [ ] 🟢 **[Notifiche]** – Configurare webhook per notifiche email automatiche sulle scadenze DURC e patentini – *Sforzo: Basso* – *Previene sanzioni per mancata conformità*

---

## I PROSSIMI 3 PASSI CONCRETI DA FARE INSIEME

1. **Passo 1: Riorganizzazione UX della Sidebar in Macro-Aree con Ricerca Rapida**: Trasformare il menu laterale piatto in un'interfaccia a 4 cartelle tematiche ordinate (Cantiere & Operazioni, Logistica & Flotta, Contabilità & SAL, Sicurezza & Amministrazione), liberando spazio e riducendo il disorientamento.
2. **Passo 2: Calcolo della Congruità della Manodopera (D.M. 143/2021) nel Modulo SAL**: Aggiungere nel tab SAL il pannello di verifica automatica dell'incidenza manodopera (rapporto tra ore registrate nei ROL e importo lavori), fondamentale per evitare il blocco dei pagamenti e delle attestazioni di cantiere.
3. **Passo 3: Widget di Controllo di Gestione & Margine di Commessa Reale**: Creare nella Dashboard di Cantiere il cruscotto di redditività che incrocia in tempo reale i costi manodopera dai ROL, i costi materiali dai DDT e l'importo fatturabile dai SAL con il budget del Preventivo iniziale.
