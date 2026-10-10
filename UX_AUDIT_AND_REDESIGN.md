# UX AUDIT & REDESIGN PLAN — VOLTMASTER 2026
**Piattaforma Gestionale Integrata Cantieri, Logistica, Impianti & Sicurezza**  
*Documento Strategico di Redesign UI/UX e Ottimizzazione Processi Operativi*  
**Data:** Ottobre 2026 | **Versione:** 1.0  
**Stack Tecnologico:** React 19, Vite, Tailwind CSS v4, Lucide Icons, TypeScript, PWA Service Worker (IndexedDB)

---

## 1. EXECUTIVE SUMMARY

L'audit UI/UX su VoltMaster ha evidenziato un'applicazione dalle elevate capacità funzionali (copertura completa di ROL, DDT, SAL, D.M. 143/2021, D.Lgs 81/08, PWA offline e sigillo digitale), penalizzata tuttavia da un elevato carico cognitivo. L'infrastruttura di navigazione attuale presenta **30 voci di menu sparse in 4 macro-cartelle**, alcune delle quali duplicate (es. *Richieste Materiali* e *Ordini Clienti*), ed etichette ridondanti che confondono gli utenti operativi sul campo e in ufficio. 

Il presente piano di riordino propone una **struttura di navigazione a 3 livelli** basata su **5 macro-cartelle tematiche al massimo**, dashboard dedicate per ciascuno dei 7 ruoli aziendali (Admin, Contabilità, Ufficio Tecnico, Capocantiere, Operaio, Magazziniere, Cliente), e la riduzione drastica dei click nei 7 flussi critici (es. ROL da mobile da 14 a 4 tap, DDT da 12 a 3 click). L'intervento prevede inoltre la rigida perimetrazione semantica dei colori del design system (ambra riservato unicamente a cantiere e materiali, smeraldo per conferme/congruità, rosa per alert bloccanti) e la specifica Mobile-First per tablet e smartphone da cantiere.

---

## 2. INVENTARIO E DIAGNOSI DELL'INTERFACCIA ATTUALE (FASE 1)

### 2.1 Inventario delle Schermate (28 Moduli)

#### Area 1: Cantiere & Operazioni
1. `Dashboard.tsx` — Panoramica KPI commesse, avanzamenti e risorse (Ruoli: Admin, PM, UT) | Complessità: Media
2. `CantieriModule.tsx` — Elenco commesse, dettagli e indirizzi cantiere (Ruoli: Admin, PM, Contabilità, DL) | Complessità: Media
3. `LavorazioniModule.tsx` — Pianificazione Fasi WBS e avanzamento attività (Ruoli: PM, Capocantiere) | Complessità: Media
4. `ROLModule.tsx` — Gestione, approvazione e consuntivazione ROL Desktop (Ruoli: PM, Contabilità, Capocantiere) | Complessità: Alta
5. `CampoMobileView.tsx` — Compilazione ROL, foto e firma cliente da smartphone (Ruoli: Capocantiere, Operaio, Apprendista) | Complessità: Media
6. `GiornaleLavoriModule.tsx` — Registro giornaliero meteo, maestranze e verbali DL ex D.M. 49/2018 (Ruoli: Capocantiere, DL) | Complessità: Alta
7. `GanttSquadreModule.tsx` — Cronoprogramma Gantt e allocazione squadre/PLE (Ruoli: PM, UT, Capocantiere) | Complessità: Alta
8. `AdminMapView.tsx` — Mappa geografica cantieri e tracciamento scansioni GPS (Ruoli: Admin, PM, Logistica) | Complessità: Media
9. `SettimanaMonitorView.tsx` — Tabellone settimanale cantiere per schermo TV Kiosk 1080p (Ruoli: Tutti) | Complessità: Bassa

#### Area 2: Logistica & Flotta
10. `MagazzinoModule.tsx` — Giacenze rapide furgone e prelievo materiale (Ruoli: Capocantiere, Magazziniere) | Complessità: Bassa
11. `MagazzinoPortal.tsx` — Magazzino centrale, pacchi Zona Verde ed etichette A5 (Ruoli: Magazziniere, Logistica) | Complessità: Alta
12. `RichiesteMaterialiModule.tsx` — Prenotazione ed evasione ordini di materiale da campo (Ruoli: Capocantiere, Magazziniere, PM) | Complessità: Media
13. `DdtModule.tsx` — Emissione DDT trasporto D.P.R. 472/96 e scarico magazzino (Ruoli: Magazziniere, PM, Capocantiere) | Complessità: Alta
14. `VeicoliModule.tsx` — Anagrafica veicoli e scadenze bollo/assicurazione/revisione (Ruoli: Logistica, Admin, PM) | Complessità: Media
15. `PowerAppsModule.tsx` — Hub flotta, rifornimenti, tessere carburante e asset (Ruoli: Logistica, Admin) | Complessità: Media
16. `AttrezzatureModule.tsx` — Registro strumenti CEI 64-8 e scadenze tarature LAT (Ruoli: UT, Capocantiere) | Complessità: Media

#### Area 3: Amministrazione, Acquisti & Contabilità
17. `PreventiviModule.tsx` — Stima costi, ricarichi, offerte e import computi XPWE/Excel (Ruoli: UT, Contabilità) | Complessità: Alta
18. `SupplierOrdersPage.tsx` — Ordini di acquisto materiale verso fornitori/grossisti (Ruoli: Contabilità, Magazziniere) | Complessità: Media
19. `CustomerOrdersPage.tsx` — Gestione commesse e ordini di fornitura verso clienti (Ruoli: Contabilità, UT) | Complessità: Media
20. `OrdiniModule.tsx` — Hub interno monitoraggio e storico ordini (Ruoli: UT, Contabilità) | Complessità: Media
21. `SalModule.tsx` — SAL, certificati di pagamento e congruità D.M. 143/2021 (Ruoli: Contabilità, PM, DL) | Complessità: Alta
22. `ContabilitaDashboard.tsx` — Controllo ROL, margini di commessa e costo manodopera (Ruoli: Contabilità, Admin) | Complessità: Alta
23. `FatturaElettronicaModal.tsx` — Generazione file XML fattura elettronica per SDI (Ruoli: Contabilità, Admin) | Complessità: Media

#### Area 4: Sicurezza, HR & Compliance
24. `PresenzeModule.tsx` — Timbrature, badge e presenze cantiere D.Lgs. 81/08 (Ruoli: Capocantiere, HR, Contabilità) | Complessità: Media
25. `ScadenziarioModule.tsx` — Scadenziario visivo a semafori (DURC, visite, patentini) (Ruoli: Admin, RSPP, HR) | Complessità: Media
26. `SicurezzaCantierePanel.tsx` — Idoneità sanitaria, POS, PSC e subappalti (Ruoli: RSPP, CSE, PM) | Complessità: Alta
27. `DipendentiModule.tsx` — Anagrafica 20 dipendenti, qualifiche PES/PAV e organigramma (Ruoli: HR, Admin, PM) | Complessità: Media
28. `DocumentiModule.tsx` — Fascicolo tecnico, schemi CEI e DiCo DM 37/08 (Ruoli: UT, PM, DL) | Complessità: Media

#### Area 5: Portali Esterni & Amministrazione Globale
29. `ClientePortal.tsx` — Area riservata committente per avanzamento e verbali (Ruoli: Cliente, DL, PM) | Complessità: Bassa
30. `ImpostazioniAmministrazioneModule.tsx` — Gestione master data (8 tab), import/export Excel (Ruoli: Admin, Responsabile) | Complessità: Alta

---

### 2.2 Diagnosi dei Problemi di Navigazione Rilevati

1. **Sovraffollamento della Sidebar (30 Voci):** Troppe voci di menu con identica priorità visiva. Voci ad alta frequenza (ROL, DDT) mescolate a strumenti ad uso sporadico (Mappa GPS, Kiosk TV).
2. **Duplicazioni Visive:** La voce *Richieste Materiali* e la voce *Ordini Clienti* compaiono duplicate in due cartelle distinte (*Cantiere* e *Logistica*).
3. **Ambiguità delle Etichette:** Differenze non chiare tra *"Richieste Materiali & Campo"* e *"Richieste da Campo"*, e tra *"Dashboard Impianti & KPI"* e *"Controllo ROL, Margini & Costi"*.
4. **Sovrapposizione Z-Index delle Modali:** L'apertura del previewer file o della firma touch sopra modali già aperte genera un accumulo di overlay scuri e problemi di chiusura su mobile.
5. **Mancanza di Navigazione Contestuale:** Assenza di breadcrumbs che indichino all'utente in quale commessa o documento si trova durante la navigazione profonda.
6. **Mancato Isolamento per Ruolo:** Gli utenti operativi di cantiere visualizzano opzioni contabili se l'interfaccia non è forzata su `cantiere_mobile`.

---

## 3. NUOVA STRUTTURA PROPOSTA (FASE 2)

### 3.1 Nuova Sidebar a 5 Macro-Cartelle Tematiche

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VOLTMASTER ERP — SIDEBAR                        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. 🏗️ CANTIERE & OPERAZIONI (Accento Ambra)                              │
│    ├── Commesse & Cantieri                                            │
│    ├── Rapportini ROL                                                 │
│    ├── Giornale dei Lavori                                            │
│    ├── Cronoprogramma & Gantt                                         │
│    └── Presenze & Timesheet                                           │
├────────────────────────────────────────────────────────────────────────┤
│ 2. 🚚 LOGISTICA & ASSET (Accento Ciano)                                │
│    ├── Magazzino & Materiali                                          │
│    ├── Richieste da Campo                                             │
│    ├── DDT & Spedizioni                                               │
│    ├── Flotta & Carburante                                            │
│    └── Strumenti & Tarature                                           │
├────────────────────────────────────────────────────────────────────────┤
│ 3. 💶 AMMINISTRAZIONE & SAL (Accento Smeraldo)                          │
│    ├── Preventivi & Computi                                           │
│    ├── Ordini Acquisto & Fornitori                                    │
│    ├── Ordini Clienti & Vendite                                       │
│    ├── SAL & Contabilità Cantiere                                     │
│    └── Controllo Gestione & Margini                                   │
├────────────────────────────────────────────────────────────────────────┤
│ 4. 🛡️ SICUREZZA & COMPLIANCE (Accento Viola)                            │
│    ├── Cruscotto Sicurezza 81/08                                      │
│    ├── Scadenziario Normativo                                         │
│    ├── Fascicolo Tecnico & DM 37/08                                   │
│    └── Organico & Qualifiche                                          │
├────────────────────────────────────────────────────────────────────────┤
│ 5. ⚙️ IMPOSTAZIONI & SISTEMA (Accento Grigio - Solo Admin)             │
│    ├── Anagrafica Centrale (8 Tab Master)                             │
│    ├── Utenti & Permessi                                              │
│    └── Monitor Sede & Kiosk                                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Wireframe Testuale del Sistema a Tre Livelli

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] VOLTMASTER  [🏗️ Cantiere & Operazioni ▼]        [🔍 CMD+K Cerca universale...]    [🔔 2] [🌙] [👤 Admin] │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ LIVELLO 3: Breadcrumb: Home > Cantieri > Ospedale San Luca (CNT-01)          [+ Nuovo ROL] [📥 Esporta Excel]│
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ LIVELLO 2 (Tab): [Panoramica] [Commesse] [Rapportini ROL] [Giornale Lavori] [Gantt Squadre] [Presenze]       │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ LIVELLO 1:    │ CONTENUTO PRINCIPALE (Tabella Dense / Form / KPI Cards)                                      │
│ SIDEBAR       │                                                                                              │
│ (1. Cantiere) │ ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐ │
│ (2. Logistica)│ │ Avanzamento SAL   │  │ ROL Mese Corrente │  │ Congruità D.M.143 │  │ Flotta / Mezzi    │ │
│ (3. Ammin.)   │ │ 68.5%  [CONGRUO]  │  │ 184 Ore Totali    │  │ 15.2% (Min 14.3%) │  │ 3 Furgoni In Uso  │ │
│ (4. Sicurezza)│ └───────────────────┘  └───────────────────┘  └───────────────────┘  └───────────────────┘ │
│ (5. Impostaz) │                                                                                              │
└───────────────┴──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Dashboard Dedicate per Ruolo

- **Admin / Direzione:** KPI (EBITDA, Margine Commesse, Scadenze Critiche) | Azioni (Impostazioni Anagrafiche, Approva SAL, Controllo Gestione) | Alert (DURC in scadenza entro 15gg).
- **Contabilità:** KPI (SAL da Liquidare, ROL da Validare, Ordini In Evasione, Congruità D.M. 143/2021) | Azioni (Valida ROL, Certificato SAL, XML SDI) | Alert (ROL sospesi con straordinari).
- **Ufficio Tecnico / PM:** KPI (Avanzamento Commesse %, Conflitti Squadre, Richieste Pendenti) | Azioni (Nuovo Cantiere, Import Computo XPWE, Pianifica Gantt) | Alert (Fermo cantiere segnalato).
- **Capocantiere:** KPI (Cantiere Odierno %, Operatori Presenti, Attrezzature In Uso) | Azioni (Compila ROL, Richiedi Materiale, Giornale Lavori DL) | Alert (Visite mediche operatori in scadenza).
- **Operaio / Apprendista:** KPI (Cantiere Odierno, Ore Mese, Prossima Visita Medica) | Azioni (Timbratura Rapida, ROL Campo, QR Scan) | Alert (Turno odierno assegnato).
- **Magazziniere:** KPI (Articoli Sottoscorta, Pacchi In Arrivo, DDT In Viaggio) | Azioni (QR Scan Pacco, Prepara Spedizione, Emetti DDT) | Alert (Articoli bloccanti sotto scorta).
- **Cliente / Committente:** KPI (Avanzamento Lavori %, ROL Approvati, Verbali DL) | Azioni (Scarica Verbali, Foto As-Built) | Alert (ROL in attesa di firma).

---

### 3.4 Riduzione dei Click nei Flussi Critici

| Flusso Operativo | Click Attuali | Click Proposti | Soluzione UX |
| :--- | :---: | :---: | :--- |
| **Flusso A: Compilazione ROL Mobile** | 14 | **4** | Card oraria precompilata con geofence GPS, auto-selezione squadra attiva e salvataggio automatico. |
| **Flusso B: Creazione DDT e Scarico** | 12 | **3** | Unificazione dell'emissione DDT con lo scarico magazzino in un unico pulsante *"Emetti DDT & Scarica"*. |
| **Flusso C: Approvazione SAL & Congruità** | 10 | **3** | Semaforo visivo immediato di congruità D.M. 143/2021 direttamente nella tabella d'insieme. |
| **Flusso D: Download ROL Firmato Cliente** | 5 | **2** | Azione diretta *"Download PDF"* sulla riga del ROL senza dover aprire la schermata di anteprima intera. |
| **Flusso E: Import Computo XPWE** | 7 | **3** | Drag-and-drop diretto nell'area preventivo con ricarico globale predefinito. |
| **Flusso F: Movimento Magazzino QR** | 5 | **2** | Auto-conferma movimento su scansione QR con quantitativo di default 1. |
| **Flusso G: Creazione Utente / Dipendente** | 7 | **3** | Form snello a scheda unica con assegnazione ruoli/qualifiche automatica basata sulla mansione. |

---

## 4. DESIGN SYSTEM & COERENZA VISIVA (FASE 3)

### 4.1 Palette Colori Semantici
- **Blu (`slate-900` / `blue-600`):** Azioni primarie di navigazione, pulsanti generici, informazioni di sistema.
- **Arancione / Ambra (`amber-500` / `amber-600`):** Esclusivo per **Cantiere, Materiali, Listino Grossisti (RemaTarlazzi) e Stato "In Corso"**.
- **Verde Smeraldo (`emerald-600`):** Esclusivo per **Conferme, Stati Positivi, Congruità D.M. 143/2021 superata, SAL Approvati, DURC Regolare**.
- **Rosso / Rosa (`rose-600`):** Esclusivo per **Errori, Stati Critici Bloccanti, Sottoscorta Minima, DURC Scaduto, Mancanza Idoneità Medica**.
- **Giallo / Arancio Chiaro (`amber-400`):** Avvisi, scadenze imminenti entro 15 giorni, ROL in attesa di approvazione.
- **Grigio / Slate (`slate-500`):** Elementi disabilitati, testo secondario, bordi e sfondi neutri.

---

### 4.2 Gerarchia Tipografica
- **Titoli di Pagina H1:** `text-2xl font-black tracking-tight` (Plus Jakarta Sans).
- **Titoli di Sezione H2:** `text-base font-black` (Plus Jakarta Sans).
- **Titoli di Card / Tabella H3:** `text-xs font-bold uppercase tracking-wider` (Plus Jakarta Sans).
- **Testo Body Normale:** `text-xs font-medium` (Plus Jakarta Sans).
- **Testo Secondario:** `text-[11px] font-normal text-slate-500` (Plus Jakarta Sans).
- **Codici, Importi, Targhe, P.IVA, Hash & Date:** `font-mono` (**JetBrains Mono**), sempre senza eccezioni.

---

### 4.3 Componenti Master UI
1. **Card KPI:** Rettangolo con bordo pulito, icona in alto a destra, valore gigante font-mono, etichetta in alto unboxed.
2. **Tabella Dati B2B:** Header grigio chiaro/scuro con font-mono 10px, righe dense con hover, azioni a destra in icon-group.
3. **Modale di Conferma Sicura:** Per azioni distruttive con riepilogo dati da confermare.
4. **Modale Form:** Griglia a 2/3 colonne con etichette maiuscole 11px font-bold, input con focus ring ambra.
5. **Toast di Notifica:** Notifiche a comparsa in basso a destra con durata 4s e icona semantica.
6. **Badge di Stato:** Etichetta unboxed o chip compatto con bordo 1px e sfondo 10% opacità.
7. **Barra di Ricerca Integrata:** Input universale con icona lente e tasto di pulizia rapida.
8. **Filtri Segmentati:** Segmented control con sfondo `slate-100`/`slate-800` e pulsanti attivi in bianco/slate.
9. **Paginazione / Contatore:** Indicatore `Mostrati 1-20 di 145` con frecce avanti/indietro.
10. **Empty State Informativo:** Sfondo pulito, icona illustrativa, spiegazione del modulo e bottone d'azione diretta.

---

## 5. SPECIFICHE MOBILE FIRST PER IL CAMPO (FASE 4)

### 5.1 Smartphone Elettricista (360px - 390px)
- **Bottom Navigation Fissa:** 4 voci essenziali: `Cantiere` | `I Miei ROL` | `QR Scan` | `Notifiche`.
- **Target Touch Maggiorati:** Pulsanti e campi d'inserimento con altezza minima **48px** per utilizzo con guanti da lavoro.
- **Contrasto Elevato & Anti-Riflesso:** Colori con contrasto WCAG AAA per visibilità sotto la luce diretta del sole in cantiere.
- **Flusso ROL Snello:** Card oraria precompilata con pulsante gigante *"Salva & Invia ROL"*.

### 5.2 Tablet Capocantiere (768px - 1024px)
- **Layout a Due Colonne:** Sinistra (30%) contesto cantiere/squadra, Destra (70%) form operativo e verbali.
- **Firma Grafometrica per Tablet:** Canvas fluido con riconoscimento pressione stilo/dito e sigillo SHA-256.
- **Sincronizzazione Offline Trasparente:** Indicatore stato rete (Online/Offline) con conteggio ROL salvati in locale (IndexedDB).
- **Foto Cantiere Geotaggate:** Acquisizione foto con sovrimpressione automatica di data, ora e coordinate GPS.

---

## 6. ONBOARDING E GUIDA CONTESTUALE (FASE 5)

### 6.1 Help Icon & Tooltip Normativi
Tutti i termini tecnici e i calcoli complessi sono affiancati da un'icona `?` con spiegazione chiara e riferimento di legge:
- **D.M. 143/2021 (Congruità CNCE):** *"Verifica che la percentuale di manodopera registrata nei ROL raggiunga l'incidenza minima prevista per gli impianti elettrici (14.28%)."*
- **Ritenuta di Garanzia 0.5% (ex D.Lgs 36/2023):** *"Trattenuta cautelativa dello 0.5% sull'importo netto del SAL, svincolata in sede di collaudo finale."*
- **Reverse Charge IVA (Art. 17 c. 6 D.P.R. 633/72):** *"Inversione contabile applicata alle prestazioni di completamento edifici."*

### 6.2 Stati Vuoti Informativi (Empty States)
Quando una tabella non contiene dati, viene mostrata una card esplicativa con:
- Significato del modulo.
- Istruzioni trasparenti su come avviarlo.
- Pulsante di azione diretta (*"Crea il primo ROL"*, *"Inserisci Cantiere"*).

### 6.3 Messaggi di Errore Resilienti
- *Prima:* "Error 500: Failed to fetch"
- *Ora:* "Impossibile inviare il ROL: la connessione Internet è momentaneamente assente. Il rapporto è stato salvato in locale e verrà sincronizzato automaticamente non appena tornerà la rete."

---

## 7. PIANO DI IMPLEMENTAZIONE A SPRINT E MAPPA DEI FILE

### **Sprint 1: Riorganizzazione Sidebar & Dashboard per Ruolo**
- **Obiettivo:** Ridurre le voci di menu da 30 a 5 macro-cartelle, rimuovere le duplicazioni visive e configurare le 7 dashboard per ruolo.
- **File da modificare/creare:**
  - `src/components/Sidebar.tsx` (Ristrutturazione a 5 macro-cartelle)
  - `src/context/AppContext.tsx` (Definizione nuovi tipi di navigazione)
  - `src/components/Dashboard.tsx` (Adattamento layout dashboard per ruolo)
  - `src/components/Header.tsx` (Integrazione breadcrumbs e selettore ruoli)

### **Sprint 2: Design System, Colori Semantici & Componenti Master**
- **Obiettivo:** Standardizzazione dei colori semantici, gerarchia tipografica e componenti UI riutilizzabili.
- **File da modificare/creare:**
  - `src/components/common/KpiCard.tsx` (Nuovo componente KPI master)
  - `src/components/common/DataTable.tsx` (Nuovo componente tabella B2B)
  - `src/components/common/EmptyState.tsx` (Componente stati vuoti)
  - `src/components/common/CommandPaletteModal.tsx` (Ricerca universale CMD+K)
  - `src/index.css` (Regole tipografiche e utility Tailwind 4)

### **Sprint 3: Ottimizzazione dei Flussi Critici (ROL, DDT, SAL, XPWE)**
- **Obiettivo:** Riduzione dei click nei 7 flussi operativi e unificazione delle azioni.
- **File da modificare/creare:**
  - `src/components/CampoMobileView.tsx` (Ottimizzazione ROL mobile a 4 tap)
  - `src/components/ddt/DdtModule.tsx` (Unificazione emissione DDT + scarico)
  - `src/components/sal/SalModule.tsx` (Semaforo congruità D.M. 143/2021)
  - `src/components/PreventiviModule.tsx` (Import XPWE semplificato)

### **Sprint 4: Mobile First & PWA Offline da Campo**
- **Obiettivo:** Target touch 48px, bottom navigation per smartphone e sincronizzazione offline trasparente.
- **File da modificare/creare:**
  - `src/components/MobileBottomNav.tsx` (Nuova bottom navigation a 4 voci)
  - `src/services/offlineCacheService.ts` (Gestione della coda di sincronizzazione IndexedDB)
  - `src/components/amministrazione/ImpostazioniAmministrazioneModule.tsx` (Ottimizzazione tabelle master data)

### **Sprint 5: Onboarding, Tooltip Normativi & Polishing Finale**
- **Obiettivo:** Integrazione help contestuali, gestione errori resilienti e collaudo globale.
- **File da modificare/creare:**
  - `src/components/common/HelpTooltip.tsx` (Componente guida normativa)
  - `src/components/common/ErrorBoundary.tsx` (Gestione errori resilienti)
  - `src/components/ClientePortal.tsx` (Isolamento completo portale committenti)

---
*Fine Documento Ufficiale - UX_AUDIT_AND_REDESIGN v1.0*
