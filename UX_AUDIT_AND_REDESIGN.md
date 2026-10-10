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

## 2. INVENTARIO E DIAGNOSI DELL'INTERFACCIA ATTUALE (FASE 1 - REVISIONATO)

### 2.1 Risoluzione delle Anomalie & Chiarimenti sull'Inventario

In riscontro ai rilievi formulati sull'inventario preliminare, sono state applicate le seguenti correzioni strutturali e semantiche:

1. **Risoluzione Duplicazioni di Menu:**
   - **"Richieste Materiali & Campo" (in Cantiere e Logistica):** Puntavano allo stesso identico modulo (`RichiesteMaterialiModule.tsx`). Nel riordino la voce viene allocata **esclusivamente nella cartella Logistica & Flotta** (come *"Richieste da Campo & Approvvigionamento"*). Sul terminale mobile degli elettricisti (`CampoMobileView`), l'accesso non avviene da menu ma tramite un'azione contestuale primaria diretta (*"+ Compila Richiesta"*).
   - **"Ordini Clienti / Cantieri" (in Cantiere e Logistica):** Puntavano entrambi a `CustomerOrdersPage.tsx`. Questa schermata appartiene alla gestione commerciale/amministrativa e viene **collocata unicamente in Amministrazione & SAL**, eliminando la duplicazione in Cantiere e Logistica.

2. **Ribilanciamento del Macro-Folder 1 (Cantiere & Operazioni):**
   - La concentrazione del 40% delle voci (12 su 30) nel Folder 1 è stata decongestionata.
   - **"Dashboard Impianti & KPI"** non è una sottovoce di cantiere ma la **Home Page / Cruscotto Globale** trasversale dell'intera applicazione.
   - **"Schermo TV Sede (Kiosk 1080p)"** è uno strumento di visualizzazione passiva/officina ed è stato rimosso dalla cartella operativa, ricollocato come visualizzatore speciale in Impostazioni & Monitor Sede.
   - **"Sicurezza & D.Lgs 81/08"** è stata spostata nella cartella dedicata *Sicurezza & Compliance*.

3. **Separazione Netta delle Impostazioni di Sistema dalle Anagrafiche:**
   - **Impostazioni di Sistema (SOLO Ruolo Admin):** Gestione utenti, assegnazione ruoli RBAC, backup database, log di audit, configurazioni globali PWA/SDI.
   - **Anagrafiche Master (Ufficio Tecnico + Contabilità):** Schede clienti, anagrafiche fornitori, listini grossisti (RemaTarlazzi), articoli a magazzino, matricole attrezzature e parco veicoli.

4. **Correzione Assegnazioni Ruolo:**
   - *"Presenze & Timesheet"*: Aggiunto ruolo **HR / Amministrazione del Personale** (con export LUL paghe consulente del lavoro).
   - *"Scadenziario & Semafori Normativi"*: Aggiunto **HR / RSPP**, rimossi i ruoli operativi di **Campo** e **Magazzino** (che devono solo consultare la propria scheda idoneità, non gestire lo scadenziario aziendale).
   - *"Impostazioni di Sistema"*: Riservato rigidamente a **SOLO Amministratore**.
   - *"Richieste Materiali"*: Rimosso il ruolo **Contabilità** (interviene solo in fase di fatturazione passiva fornitore); assegnato a **Campo** (richiedente), **Magazzino** (evasore) e **Ufficio Tecnico** (approvatore).
   - *"Fattura Elettronica XML (SDI)"*: Riclassificata come **funzione primaria** (ciclo attivo e incasso aziendale).

5. **Incrocio Schermate vs Voci di Menu (Schermate Senza Voce Dedicata):**
   Dall'incrocio tra i 28 moduli sorgente e le 30 voci di menu, sono state censite le 10 viste che **non possiedono né devono possedere una voce autonoma nella sidebar**, poiché operano come modali contestuali o sottopagine attivate da specifici eventi utente:
   1. `OrdiniModule.tsx` (hub interno unificato ordini, accessibile come vista aggregata)
   2. `FatturaElettronicaModal.tsx` (modale di emissione XML SDI richiamata dal SAL liquidato o dal DDT)
   3. `SignatureModal.tsx` (canvas di firma grafometrica touch richiamato da ROL e DDT)
   4. `ROLPrintModal.tsx` (anteprima e stampa A4 con sigillo SHA-256 aperta su richiesta)
   5. `NuovaRichiestaMaterialiModal.tsx` (wizard rapido materiale aperto da pulsante in cantiere)
   6. `MagazzinoSearchSelectModal.tsx` & `ListinoFornitoreSearchSelectModal.tsx` (selettori modali Blu/Arancione)
   7. `OfflineCacheModal.tsx` (pannello di diagnostica IndexedDB aperto dal badge di rete)
   8. `OrganigrammaModal.tsx` (organigramma gerarchico richiamato dalla barra utente o da Dipendenti)
   9. `FlussoCantiereModal.tsx` (wizard guidato per elettricisti richiamato da azione rapida)
   10. `QRScannerModal.tsx` (modulo telecamera richiamato dal pulsante fisso Scansiona QR)

6. **Coerenza Semantica del Colore:**
   - **Ambra (`amber-500`):** Riservato rigorosamente a Cantiere, Materiali, Listino Grossisti ed elementi operativi "In Lavorazione".
   - **Viola / Indaco (`indigo-500`):** Riservato a Sicurezza, D.Lgs 81/08, HR, Certificazioni e Organico.
   - **Ciano (`cyan-500`):** Logistica, Spedizioni DDT, Flotta e Movimentazione.
   - **Smeraldo (`emerald-600`):** Amministrazione, SAL, Congruità superata, Pagamenti e Stati regolari.
   - **Rosa / Rosso (`rose-600`):** Allarmi bloccanti, sottoscorta, DURC scaduto, idoneità sanitaria decaduta.

---

### 2.2 Inventario Schermate Rettificato (28 Moduli)

| # | Modulo / File Sorgente | Ruoli Abilitati | Scopo Primario | Complessità |
|---|---|---|---|:---:|
| 1 | `Dashboard.tsx` | Admin, Contabilità, UT | Cruscotto direzionale KPI, avanzamento economico e allarmi | Media |
| 2 | `CantieriModule.tsx` | Admin, UT, Contabilità | Anagrafica commesse, indirizzi, responsabili e budget | Media |
| 3 | `LavorazioniModule.tsx` | UT, Capocantiere | Pianificazione WBS, fasi operative e avanzamento fisico | Media |
| 4 | `ROLModule.tsx` | UT, Contabilità, Capocantiere | Revisione desktop, validazione ore e approvazione rapportini | Alta |
| 5 | `CampoMobileView.tsx` | Capocantiere, Operaio, Apprendista | Registrazione ore, foto e firma cliente da smartphone/tablet | Media |
| 6 | `GiornaleLavoriModule.tsx` | Capocantiere, UT, DL | Verbale quotidiano meteo, maestranze e note DL (DM 49/18) | Alta |
| 7 | `GanttSquadreModule.tsx` | UT, Capocantiere | Cronoprogramma temporale e allocazione squadre / PLE | Alta |
| 8 | `AdminMapView.tsx` | Admin, UT, Logistica | Monitoraggio geografico cantieri e timbrature georeferenziate | Media |
| 9 | `SettimanaMonitorView.tsx` | Tutti (Monitor Sede / Kiosk) | Tabellone cantiere a ciclo continuo per officina 1080p | Bassa |
| 10 | `MagazzinoModule.tsx` | Capocantiere, Operaio | Consultazione rapida dotazione furgone e scorte | Bassa |
| 11 | `MagazzinoPortal.tsx` | Magazziniere, Logistica | Gestione magazzino centrale, Zona Verde e segnacollo A5 | Alta |
| 12 | `RichiesteMaterialiModule.tsx` | Capocantiere, Magazziniere, UT | Workflow richiesta, approvazione ed evasione materiali | Media |
| 13 | `DdtModule.tsx` | Magazziniere, UT, Capocantiere | Emissione DDT trasporto DPR 472/96 e scarico magazzino | Alta |
| 14 | `VeicoliModule.tsx` | Logistica, Admin | Anagrafica automezzi aziendali e scadenze revisioni/tagliandi | Media |
| 15 | `PowerAppsModule.tsx` | Logistica, Admin | Gestione flotta integrata, tessere carburante e rifornimenti | Media |
| 16 | `AttrezzatureModule.tsx` | UT, Capocantiere | Censimento strumenti misura CEI 64-8 e scadenze tarature LAT | Media |
| 17 | `PreventiviModule.tsx` | UT, Contabilità | Computi metrici, stime costi e import computi XPWE/Excel | Alta |
| 18 | `SupplierOrdersPage.tsx` | Contabilità, Magazziniere, UT | Ordini di acquisto materiale su listino fornitore RemaTarlazzi | Media |
| 19 | `CustomerOrdersPage.tsx` | Contabilità, UT | Ordini di fornitura verso clienti e committenti | Media |
| 20 | `OrdiniModule.tsx` | UT, Contabilità | Hub unificato per consultazione storico ordini | Media |
| 21 | `SalModule.tsx` | Contabilità, UT, DL | Gestione SAL, ritenute garanzia 0.5% e congruità DM 143/2021 | Alta |
| 22 | `ContabilitaDashboard.tsx` | Contabilità, Admin | Controllo ROL, redditività commessa e costo orario manodopera | Alta |
| 23 | `FatturaElettronicaModal.tsx` | Contabilità, Admin | Generazione e validazione file XML fattura per SDI | Alta |
| 24 | `PresenzeModule.tsx` | HR, Capocantiere, Contabilità | Rilevazione presenze di cantiere, tesserini e dati per paghe LUL | Media |
| 25 | `ScadenziarioModule.tsx` | HR, RSPP, Admin | Monitoraggio semaforico scadenze legali (DURC, corsi, visite) | Media |
| 26 | `SicurezzaCantierePanel.tsx` | RSPP, UT, Capocantiere | Fascicolo sicurezza, POS, idoneità sanitaria e DPI D.Lgs 81/08 | Alta |
| 27 | `DipendentiModule.tsx` | HR, Admin | Organico 20 risorse, abilitazioni PES/PAV e mansioni | Media |
| 28 | `DocumentiModule.tsx` | UT, DL, Cliente | Archivio fascicolo tecnico, schemi CEI e DiCo DM 37/08 | Media |
| 29 | `ClientePortal.tsx` | Cliente, DL | Portale committente: stato lavori, verbali e fascicolo DiCo | Bassa |
| 30 | `ImpostazioniAmministrazioneModule.tsx` | SOLO Admin | Impostazioni sistema, utenti, log, backup e master data | Alta |

---

### 2.3 Inventario Voci di Menu Sidebar Rettificato (20 Voci Selezionate)

| # | Etichetta Vocabolario | Icona | Macro-Folder | Ruoli Autorizzati | Frequenza | Tipologia |
|---|---|---|---|---|:---:|:---:|
| 1 | **Commesse & Cantieri** | `Building2` | 🏗️ Cantiere & Operazioni | Admin, UT, Contabilità | Alta | Primaria |
| 2 | **Rapportini ROL** | `Clock` | 🏗️ Cantiere & Operazioni | Capocantiere, Operaio, UT, Contabilità | Altissima | Primaria |
| 3 | **Giornale dei Lavori** | `FileCheck` | 🏗️ Cantiere & Operazioni | Capocantiere, UT | Media | Primaria |
| 4 | **Cronoprogramma & Gantt** | `Calendar` | 🏗️ Cantiere & Operazioni | UT, Capocantiere | Media | Secondaria |
| 5 | **Presenze & Timesheet** | `HardHat` | 🏗️ Cantiere & Operazioni | HR, Capocantiere, Contabilità | Alta | Primaria |
| 6 | **Magazzino Centrale & Scorte** | `Warehouse` | 🚚 Logistica & Flotta | Magazziniere, UT | Alta | Primaria |
| 7 | **Richieste da Campo** | `PackagePlus` | 🚚 Logistica & Flotta | Magazziniere, Capocantiere, UT | Alta | Primaria |
| 8 | **DDT & Spedizioni (DPR 472/96)** | `Truck` | 🚚 Logistica & Flotta | Magazziniere, UT, Capocantiere | Alta | Primaria |
| 9 | **Flotta, Mezzi & Carburante** | `Fuel` | 🚚 Logistica & Flotta | Logistica, Admin | Media | Secondaria |
| 10 | **Strumenti CEI 64-8 & Tarature** | `Wrench` | 🚚 Logistica & Flotta | UT, Capocantiere | Bassa | Secondaria |
| 11 | **Preventivi & Computi XPWE** | `FileSpreadsheet` | 💶 Amministrazione & SAL | UT, Contabilità | Media | Primaria |
| 12 | **Ordini Acquisto Fornitori** | `ShoppingCart` | 💶 Amministrazione & SAL | Contabilità, Magazziniere, UT | Alta | Primaria |
| 13 | **Ordini Clienti & Commesse** | `Handshake` | 💶 Amministrazione & SAL | Contabilità, UT | Media | Primaria |
| 14 | **SAL & Congruità DM 143/2021** | `Calculator` | 💶 Amministrazione & SAL | Contabilità, UT, Admin | Alta | Primaria |
| 15 | **Fatturazione Elettronica XML** | `FileCode` | 💶 Amministrazione & SAL | Contabilità, Admin | Alta | Primaria |
| 16 | **Controllo Gestione & Margini** | `TrendingUp` | 💶 Amministrazione & SAL | Contabilità, Admin | Media | Secondaria |
| 17 | **Sicurezza Cantiere (81/08)** | `ShieldCheck` | 🛡️ Sicurezza & HR | RSPP, UT, Capocantiere | Media | Primaria |
| 18 | **Scadenziario & Semafori** | `Bell` | 🛡️ Sicurezza & HR | HR, RSPP, Admin | Alta | Primaria |
| 19 | **Organico & Abilitazioni PES/PAV** | `Users` | 🛡️ Sicurezza & HR | HR, Admin | Media | Secondaria |
| 20 | **Fascicolo Tecnico & DM 37/08** | `FolderLock` | 🛡️ Sicurezza & HR | UT, Capocantiere | Media | Secondaria |


---

### 2.4 Mappa Dettagliata dei Flussi Operativi Critici (Fase 1.3)

#### **Flusso A: Capocantiere / Elettricista Compila un ROL in Cantiere da Smartphone**
- **Attore primario:** Capocantiere / Elettricista Specializzato (operativo con DPI, guanti e schermo touch sotto luce solare).
- **Contesto d'uso:** Fine turno lavorativo (ore 16:30 - 17:30) direttamente in cantiere o a bordo furgone.
- **Passaggi operativi attuali passo-passo:**
  1. *Apertura applicazione:* L'utente avvia l'app da browser mobile o PWA.
  2. *Navigazione:* Se l'interfaccia non è già forzata in modalità campo, deve aprire il drawer laterale ed entrare in *"I Miei Rapportini (ROL)"*.
  3. *Acquisizione Geofencing GPS:* L'app tenta di geolocalizzare il dispositivo; se il GPS ha scarsa ricezione o è disattivato, l'utente deve interagire manualmente con il selettore cantiere.
  4. *Selezione Commessa:* Apre il dropdown tra oltre 22 cantieri e scorre la lista per selezionare il cantiere attivo.
  5. *Definizione Tipologia Lavoro:* Clicca sui selettori per scegliere tra Cantiere, Officina, Manutenzione o Trasferta.
  6. *Sotto-attività:* Seleziona la lavorazione specifica da dropdown (es. posa canali, cablaggio quadro, infilaggio conduttori).
  7. *Compilazione Orario di Lavoro:* Inserisce le ore ordinarie (default 8) e le eventuali ore di straordinario tramite pulsanti +/-.
  8. *Gestione Trasferta / Viaggio:* Se attivo, attiva il toggle trasferta, inserisce il mezzo utilizzato, il tragitto (es. Sede -> Cantiere) e i chilometri percorsi.
  9. *Descrizione Lavori:* Digita da tastiera su schermo la descrizione analitica delle opere eseguite.
  10. *Assegnazione Squadra:* Clicca su *"Aggiungi Collaboratore"* e seleziona i colleghi di squadra uno a uno.
  11. *Foto Cantiere:* Clicca su scatta foto, seleziona il file dalla galleria/fotocamera, attende la compressione client-side.
  12. *Materiali & Ricambi utilizzati:* Digita a testo libero gli articoli prelevati dalla dotazione di bordo furgone.
  13. *Firma Grafometrica Committente:* Clicca su *"Acquisisci Firma Cliente"*, si apre la modale di canvas touch, il cliente firma con il dito, inserisce il nominativo in stampatello e clicca su conferma.
  14. *Salvataggio & Trasmissione:* Clicca sul pulsante finale *"Invia Rapportino ROL"* (oppure in locale se offline con salvataggio in coda IndexedDB).
- **Punti di attrito rilevati:** 14 interazioni sequenziali con tastiera virtuale e dropdown lunghi; difficoltà di tocco dei campi numerici con guanti da lavoro.

---

#### **Flusso B: Ufficio Tecnico / Magazziniere Crea un DDT e Scarica il Magazzino (D.P.R. 472/96)**
- **Attore primario:** Responsabile Ufficio Tecnico o Magazziniere di sede.
- **Contesto d'uso:** Preparazione della spedizione materiali dal magazzino centrale al cantiere.
- **Passaggi operativi attuali passo-passo:**
  1. *Accesso al Modulo:* Naviga nella sidebar alla voce *"DDT Trasporto & Spedizioni"*.
  2. *Apertura Form DDT:* Clicca sul pulsante primario *"+ Nuovo DDT di Trasporto"*.
  3. *Intestazione & Destinatario:* Seleziona il cantiere di destinazione dal selettore commesse (popolamento automatico cliente e indirizzo cantiere).
  4. *Causale del Trasporto:* Seleziona la causale normativa da elenco (Vendita, Conto Lavorazione, Trasferimento cantiere, Reso).
  5. *Assegnazione Vettore e Mezzo:* Seleziona il vettore (Mittente, Destinatario o Vettore terzo), il conducente incaricato e la targa dell'autocarro aziendale.
  6. *Aggiunta Righe Articoli:* Per ciascun articolo da trasportare:
     - Clicca *"+ Aggiungi Riga"*.
     - Apre la modale selettore magazzino interno.
     - Cerca l'articolo per SKU o descrizione (es. Cavo FG16OR12, Morsetti a molla).
     - Inserisce la quantità da movimentare e l'unità di misura (metri, pezzi, rotoli).
  7. *Annotazioni di Trasporto:* Inserisce numero colli, peso stimato e aspetto esteriore dei beni.
  8. *Conferma & Generazione DDT:* Clicca su *"Salva ed Emetti DDT"*. Il sistema assegna il numero progressivo conforme D.P.R. 472/96 (es. DDT-2026-0042).
  9. *Scarico Giacenze Magazzino:* Il sistema applica la decurtazione sulle giacenze dell'inventario e genera il movimento di magazzino in uscita (`SCARICO_CANTIERE`).
  10. *Stampa / Spedizione:* L'operatore visualizza l'anteprima PDF del DDT, scarica il documento o genera il QR Code di tracciamento.
- **Punti di attrito rilevati:** La compilazione delle righe richiede troppi passaggi modali intermedi; la mancata integrazione diretta con le richieste di materiale provenienti dal campo costringe l'operatore a riscrivere a mano codici già presenti nelle richieste pendenti.

---

#### **Flusso C: Contabilità Verifica Congruità D.M. 143/2021 ed Emette il SAL**
- **Attore primario:** Responsabile Amministrativo / Contabile di Cantiere.
- **Contesto d'uso:** Raggiungimento della soglia di avanzamento pattuita da contratto (es. ogni 30 giorni o ogni 50.000 € di produzione).
- **Passaggi operativi attuali passo-passo:**
  1. *Accesso al Modulo:* Clicca su *"SAL & Contabilità Cantiere"* nella sidebar.
  2. *Filtro Commessa:* Seleziona il cantiere oggetto di liquidazione (es. Ospedale San Raffaele o Polo Logistico Novara).
  3. *Verifica Stato ROL:* Controlla che tutti i ROL di periodo siano stati approvati e consuntivati (ore ordinarie e straordinarie moltiplicate per la tariffa oraria contrattuale).
  4. *Analisi Tabellare Libretto Misure:* Esamina le quantità di opere contabili eseguite e le relative percentuali di avanzamento rispetto al Quadro Economico del preventivo originario.
  5. *Verifica Congruità Manodopera (D.M. 143/2021):* 
     - L'utente consulta il widget di congruità CNCE/Edilconnect.
     - L'algoritmo calcola l'incidenza della manodopera: $\text{Incidenza} = \frac{\text{Costo Manodopera ROL}}{\text{Importo Lavori SAL}} \times 100$.
     - Verifica visiva della soglia minima per impianti tecnologici/elettrici (**minimo 14.28%**).
     - *Esito:* Semaforo verde `CONGRUO` oppure allerta ambra/rosso `NON CONGRUO` con scostamento in euro da regolarizzare per evitare il blocco del DURC di congruità.
  6. *Calcolo Ritenuta di Garanzia 0.5%:* Il sistema applica automaticamente lo scorporo della ritenuta cautelativa dello 0.5% (ex art. 30 D.Lgs. 36/2023) a garanzia della regolare esecuzione.
  7. *Generazione Certificato di Pagamento:* Compilazione estremi e approvazione dell'importo netto liquidabile.
  8. *Generazione Fattura Elettronica XML (SDI):* Clicca sul pulsante *"Emetti Fattura Elettronica"* per trasformare il SAL approvato nel file conforme tracciato FatturaPA v1.8 (gestione regime IVA ordinario vs Scissione dei pagamenti / Reverse Charge Art. 17 c. 6 D.P.R. 633/72).
- **Punti di attrito rilevati:** La verifica di congruità è separata dalla vista tabellare dei ROL approvati; il contabile deve saltare tra tre schermate diverse (Controllo Margini, ROL, SAL) per validare la coerenza dei costi prima dell'emissione.

---

#### **Flusso D: Magazziniere Prepara Pacco Zona Verde con Segnacollo A5 e Scarico QR**
- **Attore primario:** Magazziniere di Sede / Responsabile Approvvigionamenti.
- **Contesto d'uso:** Preparazione delle forniture per i furgoni in partenza per i cantieri alle ore 06:30 del mattino.
- **Passaggi operativi attuali passo-passo:**
  1. *Accesso a Magazzino Centrale:* Entra nel *"Portale Magazzino Centrale"* (`MagazzinoPortal.tsx`).
  2. *Consultazione Richieste Pendenti:* Visualizza le richieste inoltrate dai capicantiere tramite smartphone.
  3. *Composizione Pacco Spedizione:* Clicca su *"Crea Pacco Spedizione Cantiere"*, seleziona la commessa di destinazione e il furgone assegnato.
  4. *Picking Materiali:* Spunta le righe di materiale prelevate dagli scaffali (cavi FG16, tubi corrugati, quadri di piano, morsettiere).
  5. *Posizionamento in Zona Verde:* Deposita fisicamente i colli nell'area di transito contrassegnata (*Zona Verde Deposito*).
  6. *Generazione Segnacollo A5:* Il sistema genera l'etichetta di spedizione formato A5 con codice univoco (es. `PK-2026-081`), dati del cantiere, sintesi del contenuto e QR Code identificativo ad alto contrasto.
  7. *Stampa Etichetta:* Stampa termica/laser del segnacollo A5 e applicazione sul collo.
  8. *Impostazione Stato:* Il pacco passa automaticamente allo stato `PRONTO_ZONA_VERDE`.
  9. *Presa in Carico Autista / Elettricista:* L'elettricista al mattino inquadra il QR Code con la telecamera dell'app e conferma la presa in carico; il pacco passa a `IN_TRANSITO` e le scorte vengono allocate sul veicolo specifico.
- **Punti di attrito rilevati:** L'interfaccia di magazzino presenta troppe informazioni secondarie; manca una vista "picking list" ottimizzata per terminali palmari barcode/QR.

---

#### **Flusso E: Firma Grafometrica e Sigillo Digitale ROL (ex Art. 2702 c.c.)**
- **Attore primario:** Capocantiere con Committente / Direttore dei Lavori.
- **Contesto d'uso:** Chiusura giornaliera o settimanale con attestazione delle ore e lavorazioni eseguite.
- **Passaggi operativi attuali passo-passo:**
  1. *Apertura Rapportino:* Nel modulo ROL o vista mobile, l'utente clicca su *"Acquisisci Firma Cliente"*.
  2. *Apertura Modale Dedicata:* Si apre la finestra `SignatureModal.tsx` con canvas grafico a pieno contrasto.
  3. *Tracciamento Firma Touch:* Il cliente appone la firma grafometrica direttamente sullo schermo capacitivo del tablet/smartphone.
  4. *Dati Anagrafici Firmatario:* Il capocantiere digita nome e cognome del firmatario e ruolo (es. "Geom. Bianchi - Direttore Lavori").
  5. *Cattura Metadati Forensi:* Il software acquisisce automaticamente timestamp certificato ISO 8601, geolocalizzazione GPS del punto di firma e indirizzo IP/User Agent del dispositivo.
  6. *Generazione Sigillo SHA-256:* Il sistema genera un digest crittografico crudo a 64 caratteri esadecimali:
     $$\text{Digest} = \text{SHA256}(\text{Numero ROL} + \text{Dati Lavoro} + \text{Base64 Immagine Firma} + \text{Timestamp})$$
  7. *Salvataggio & Integrazione nel PDF:* Il ROL viene contrassegnato come `firmato`, il digest viene impresso in calce al documento e nell'anteprima PDF con watermark anticopia.
- **Punti di attrito rilevati:** Se la connessione cade prima del salvataggio definitivo, la firma touch può andare persa se non salvata immediatamente in IndexedDB locale; serve un indicatore chiaro di salvataggio in cache sicura.

---

#### **Flusso F: Gestione Scadenze e Semafori D.Lgs 81/08 (DURC, Patentini PES/PAV, Tarature)**
- **Attore primario:** Responsabile del Servizio di Prevenzione e Protezione (RSPP) / Responsabile HR.
- **Contesto d'uso:** Audit settimanale di compliance normativa per evitare il blocco dei cantieri o sanzioni penali ex D.Lgs. 81/08.
- **Passaggi operativi attuali passo-passo:**
  1. *Accesso allo Scadenziario:* Clicca su *"Scadenziario & Semafori Normativi"* nella sidebar.
  2. *Esame Visivo della Matrice a Semafori:*
     - 🔴 **Rosso (Scaduto):** Certificato decaduto; blocco operativo immediato per la risorsa o il cantiere.
     - 🟡 **Ambra (Urgente entro 15gg):** Procedura di rinnovo da avviare urgentemente.
     - 🟢 **Verde (Regolare oltre 15gg):** Documento valido e pienamente conforme.
  3. *Verifica Documenti Chiave:*
     - **DURC Aziendale:** Validità quadrimestrale (120 giorni).
     - **Idoneità Sanitaria Lavoratori:** Visita medica periodica del Medico Competente.
     - **Abilitazioni Elettriche:** Attestati PES (Persona Esperta), PAV (Persona Avvertita), PEI (Persona Idonea sotto tensione) ex Norma CEI 11-27.
     - **Abilitazioni Macchine:** Patentini PLE (Piattaforme di Lavoro Elevabili con e senza stabilizzatori).
     - **Tarature Strumenti CEI 64-8:** Certificato di taratura annuale rilasciato da centro LAT per analizzatori di rete, misuratori d'isolamento e resistenze di terra.
  4. *Avvio Rinnovo:* L'operatore clicca su *"Rinnova"* sulla riga interessata, inserisce la nuova data di scadenza e allega il PDF del nuovo certificato.
- **Punti di attrito rilevati:** La commistione tra scadenze del personale (visite, patentini) e scadenze dei mezzi (bolli, revisioni furgoni) genera dispersione mentale; vanno raggruppate per tipologia (Persone, Mezzi, Strumenti, Azienda).

---

#### **Flusso G: Ufficio Tecnico Importa Computo Metrico Estimativo XPWE/Excel in Preventivo**
- **Attore primario:** Preventivista / Ingegnere Ufficio Tecnico.
- **Contesto d'uso:** Ricezione di una gara d'appalto o capitolato lavori da committente pubblico/privato.
- **Passaggi operativi attuali passo-passo:**
  1. *Accesso al Modulo:* Naviga a *"Preventivi & Computi Elettrici"*.
  2. *Creazione Nuova Offerta:* Clicca su *"+ Nuovo Preventivo / Offerta"*.
  3. *Caricamento File Capitolato:* Clicca su *"Importa Computo da File"* e trascina il file sorgente (`.xpwe`, `.xml` o foglio Excel tabellare SheetJS).
  4. *Elaborazione & Parsing:* Il parser scansiona l'albero di capitoli, sottocapitoli, codici di elenco prezzi, descrizioni e quantità.
  5. *Visualizzazione Griglia Computo:* L'interfaccia visualizza tutte le voci importate suddivise per aree (Impianto FM, Illuminazione ordinaria e d'emergenza, Impianto di terra, Quadri MT/BT, Rivelazione fumi).
  6. *Applicazione Ricarichi & Margini:* L'ingegnere imposta:
     - Ricarico materiali (% su prezzo d'acquisto fornitore).
     - Costo orario manodopera applicato (€/h per operaio specializzato e qualificato).
     - Spese generali e utile d'impresa contrattuale.
  7. *Generazione Quadro Economico:* Il sistema calcola Imponibile Totale, Oneri della Sicurezza non soggetti a ribasso (D.Lgs. 81/08), IVA e Totale Offerta.
  8. *Conversione Diretta in Cantiere:* All'accettazione dell'offerta da parte del cliente, un pulsante primario *"Converti in Cantiere Attivo"* crea in 1 click la nuova commessa, importando WBS, budget e anagrafica.
- **Punti di attrito rilevati:** I file di computo con oltre 500 righe rallentano la visualizzazione senza virtualizzazione delle righe; la mappa delle voci importate necessita di una chiara anteprima prima dell'acquisizione definitiva.

---

### 2.5 Analisi del Carico Cognitivo & Punti di Attrito UX (Fase 1.4)

#### **1. Matrice del Conteggio Click / Tap e Indice di Frizione**

| Flusso Operativo | Click / Tap Attuali | Target Ottimizzato | Tempo Medio Stimato Attuale | Tempo Target Ottimizzato | Riduzione Sforzo Cognitivo |
|---|:---:|:---:|:---:|:---:|:---:|
| **Flusso A (ROL Mobile Cantiere)** | **14 tap** | **4 tap** | 3 min 45 sec | **45 sec** | **-72%** |
| **Flusso B (DDT & Scarico Magazzino)** | **12 click** | **3 click** | 4 min 10 sec | **1 min 15 sec** | **-75%** |
| **Flusso C (Verifica Congruità & SAL)** | **10 click** | **3 click** | 5 min 30 sec | **1 min 30 sec** | **-70%** |
| **Flusso D (Pacco Zona Verde & QR)** | **8 step** | **2 step** | 2 min 50 sec | **40 sec** | **-75%** |
| **Flusso E (Firma & Sigillo SHA-256)** | **5 step** | **2 step** | 1 min 40 sec | **30 sec** | **-60%** |
| **Flusso F (Rinnovo Scadenza 81/08)** | **7 click** | **2 click** | 2 min 15 sec | **45 sec** | **-71%** |
| **Flusso G (Import Computo XPWE)** | **7 click** | **3 click** | 3 min 20 sec | **1 min 00 sec** | **-57%** |

---

#### **2. Diagnosi Dettagliata dei Punti di Frizione Identificati**

1. **Information Overload nella Sidebar:**
   - *Problema:* 30 voci di menu visualizzate simultaneamente creano il fenomeno psicologico della "Decision Paralysis" (Legge di Hick). L'utente deve esaminare dozzine di opzioni prima di individuare la voce desiderata.
   - *Impatto:* Elettricisti e magazzinieri perdono tempo cercando voci operative confuse tra schermate amministrative o kpi.
   - *Rimedio:* Taglio netto a 5 macro-folder tematiche con massimo 4-5 voci primarie per cartella e filtraggio rigoroso basato sul ruolo effettivo (`currentUser.reparto`).

2. **Mancanza di Pre-compilazione Contestuale (Zero-Click Pattern):**
   - *Problema:* Nel ROL da mobile, anche se il cantiere è rilevato via GPS (entro 500m), il sistema chiedeva all'utente conferme ridondanti e l'orario di lavoro standard (8 ore) doveva essere confermato manualmente insieme alla data odierna.
   - *Rimedio:* Pre-selezione silente istantanea del cantiere rilevato via geofence GPS, impostazione predefinita di 8 ore ordinarie e data corrente: l'elettricista deve solo digitare la nota di lavoro e toccare "Invia".

3. **Disconnessione tra Emissione Documentale e Movimentazione Fisica:**
   - *Problema:* Nel flusso DDT, la creazione del documento di trasporto e il relativo scarico fisico delle giacenze a magazzino erano percepiti come due operazioni cognitive separate.
   - *Rimedio:* Unificazione dell'azione in un unico pulsante atomico *"Emetti DDT & Scarica Magazzino"* conforme a D.P.R. 472/96.

4. **Isolamento della Verifica di Congruità Manodopera D.M. 143/2021:**
   - *Problema:* Il calcolo dell'incidenza manodopera risiedeva in un widget isolato nel SAL, senza connessione diretta con i ROL consuntivati né avvisi preventivi prima della liquidazione.
   - *Rimedio:* Integrazione di un badge/semaforo dinamico permanente nell'header del cantiere e nel riepilogo SAL con indicazione trasparente del delta orario/monetario per raggiungere la congruità del 14.28%.

5. **Discrepanza tra Interfaccia Desktop e Mobile:**
   - *Problema:* Pulsanti con target touch inferiori a 36px in alcune viste, form densi non ottimizzati per l'uso con una mano sola o con guanti da lavoro in cantiere, testi in caratteri ridotti poco leggibili sotto forte illuminazione diurna.
   - *Rimedio:* Dimensionamento rigoroso di tutti gli elementi interattivi mobile ad almeno **48px di altezza minima**, modalità ad alto contrasto antiriflesso e switch rapido *"Modalità Guanti Cantiere"*.

6. **Rischio Errori Operativi e Perdita Dati in Ambienti Senza Connessione:**
   - *Problema:* In sotterranei, cabine elettriche blindate o cantieri isolati, la perdita temporanea del segnale 4G/5G generava timore di mancato salvataggio del ROL o della firma del cliente.
   - *Rimedio:* Architettura di caching offline trasparente (IndexedDB + Service Worker) con feedback visivo costante ("Salvato in locale sicuro sul dispositivo — Verrà trasmesso automaticamente appena online").

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
