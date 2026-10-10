import * as XLSX from 'xlsx';
import { ImpostazioniTabId, ImportValidationResult } from '../types/anagrafica';
import { Cantiere, Cliente, Attrezzatura, Veicolo, ArticoloMagazzino, Dipendente } from '../types';
import { FornitoreAnagrafica } from '../data/mockOrdini';
import { DispositivoAziendale, SubappaltoAnagrafica } from '../types/anagrafica';

// Helper to trigger browser file download
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const anagraficaExcelService = {
  /**
   * Genera ed esegue il download del Template Excel precompilato con intestazioni e righe di esempio
   */
  downloadTemplate(tab: ImpostazioniTabId) {
    let headers: string[] = [];
    let sampleRows: Record<string, any>[] = [];
    let fileName = `Template_Anagrafica_${tab.toUpperCase()}.xlsx`;

    switch (tab) {
      case 'cantieri':
        headers = [
          'Codice Cantiere',
          'Nome / Titolo',
          'Cliente / Committente',
          'Indirizzo',
          'Comune',
          'Provincia',
          'CAP',
          'Direttore Lavori',
          'Capocantiere',
          'Data Inizio (AAAA-MM-GG)',
          'Data Fine Prevista (AAAA-MM-GG)',
          'Stato (in_corso/in_attesa/collaudo/completato/sospeso)',
          'Importo Lavori Euro',
          'Note',
          'Latitudine GPS',
          'Longitudine GPS',
        ];
        sampleRows = [
          {
            'Codice Cantiere': 'CNT-2026-009',
            'Nome / Titolo': 'Adeguamento Cabina MT/BT Ospedale San Luca',
            'Cliente / Committente': 'Azienda Socio Sanitaria Territoriale Milano',
            Indirizzo: 'Piazzale Ospedale Maggiore 3',
            Comune: 'Milano',
            Provincia: 'MI',
            CAP: '20162',
            'Direttore Lavori': 'Ing. Roberto Fontana',
            Capocantiere: 'Marco Villa',
            'Data Inizio (AAAA-MM-GG)': '2026-01-15',
            'Data Fine Prevista (AAAA-MM-GG)': '2026-09-30',
            'Stato (in_corso/in_attesa/collaudo/completato/sospeso)': 'in_corso',
            'Importo Lavori Euro': 185000,
            Note: 'Lavori notturni su cabina primaria con blindo 2500A.',
            'Latitudine GPS': 45.4642,
            'Longitudine GPS': 9.19,
          },
          {
            'Codice Cantiere': 'CNT-2026-010',
            'Nome / Titolo': 'Impianto FV 400kWp Tetto Polo Logistico',
            'Cliente / Committente': 'Logistics Hub Malpensa S.p.A.',
            Indirizzo: 'Via per Tornavento 80',
            Comune: 'Somma Lombardo',
            Provincia: 'VA',
            CAP: '21019',
            'Direttore Lavori': 'Arch. Elena De Angelis',
            Capocantiere: 'Giuseppe Colombo',
            'Data Inizio (AAAA-MM-GG)': '2026-02-01',
            'Data Fine Prevista (AAAA-MM-GG)': '2026-06-30',
            'Stato (in_corso/in_attesa/collaudo/completato/sospeso)': 'in_corso',
            'Importo Lavori Euro': 320000,
            Note: 'Posa linee vita e inverter Huawei SUN2000.',
            'Latitudine GPS': 45.6312,
            'Longitudine GPS': 8.6835,
          },
        ];
        break;

      case 'clienti':
        headers = [
          'Ragione Sociale',
          'Partita IVA',
          'Codice Fiscale',
          'Indirizzo',
          'Comune',
          'Provincia',
          'CAP',
          'Telefono',
          'Email',
          'PEC',
          'Referente',
          'Codice SDI',
          'IBAN',
          'Condizioni Pagamento',
          'Categoria (privato/azienda/PA)',
          'Note',
        ];
        sampleRows = [
          {
            'Ragione Sociale': 'Alfa Impianti & Costruzioni S.r.l.',
            'Partita IVA': '01928374651',
            'Codice Fiscale': '01928374651',
            Indirizzo: 'Via Mecenate 76',
            Comune: 'Milano',
            Provincia: 'MI',
            CAP: '20138',
            Telefono: '+39 02 7788990',
            Email: 'amministrazione@alfaimpianti.it',
            PEC: 'alfaimpianti@pec.it',
            Referente: 'Ing. Alessandro Conti',
            'Codice SDI': 'M5UXCR1',
            IBAN: 'IT60X0542811101000000123456',
            'Condizioni Pagamento': 'Bonifico 60 gg d.f. f.m.',
            'Categoria (privato/azienda/PA)': 'azienda',
            Note: 'Cliente primario per impianti industriali.',
          },
          {
            'Ragione Sociale': 'Comune di Sesto San Giovanni',
            'Partita IVA': '00829100159',
            'Codice Fiscale': '00829100159',
            Indirizzo: 'Piazza della Resistenza 20',
            Comune: 'Sesto San Giovanni',
            Provincia: 'MI',
            CAP: '20099',
            Telefono: '+39 02 24961',
            Email: 'lavori.pubblici@sestosg.net',
            PEC: 'comune.sestosg@pec.regione.lombardia.it',
            Referente: 'Geom. Laura Bellini',
            'Codice SDI': 'UF19Q4',
            IBAN: 'IT44Y0100503200000000098765',
            'Condizioni Pagamento': 'Split Payment 30 gg',
            'Categoria (privato/azienda/PA)': 'PA',
            Note: 'Appalti pubblici con CIG e CUP obbligatori.',
          },
        ];
        break;

      case 'fornitori':
        headers = [
          'Ragione Sociale',
          'Partita IVA',
          'Codice Fiscale',
          'Indirizzo',
          'Comune',
          'Provincia',
          'Telefono',
          'Email',
          'PEC',
          'Referente',
          'Categoria Merceologica',
          'IBAN',
          'Condizioni Pagamento',
          'Sconto Applicato %',
          'DURC Protocollo',
          'DURC Scadenza (AAAA-MM-GG)',
          'Certificazioni',
          'Rating (1-5)',
        ];
        sampleRows = [
          {
            'Ragione Sociale': 'Sacchi Elettroforniture S.p.A.',
            'Partita IVA': '00219480132',
            'Codice Fiscale': '00219480132',
            Indirizzo: 'Via Brianza 3',
            Comune: 'Barzanò',
            Provincia: 'LC',
            Telefono: '+39 039 92311',
            Email: 'ordini.sacchi@sacchielettro.it',
            PEC: 'sacchi@pec.it',
            Referente: 'Sig. Marco Sala',
            'Categoria Merceologica': 'materiale_elettrico',
            IBAN: 'IT99A0306909606100000012345',
            'Condizioni Pagamento': 'Ri.Ba. 90 gg d.f. f.m.',
            'Sconto Applicato %': 45,
            'DURC Protocollo': 'INPS_91820491',
            'DURC Scadenza (AAAA-MM-GG)': '2026-11-30',
            Certificazioni: 'ISO 9001; ISO 14001',
            'Rating (1-5)': 5,
          },
          {
            'Ragione Sociale': 'Hilti Italia S.p.A.',
            'Partita IVA': '00821940150',
            'Codice Fiscale': '00821940150',
            Indirizzo: 'Piazza Montanelli 20',
            Comune: 'Sesto San Giovanni',
            Provincia: 'MI',
            Telefono: '+39 02 212721',
            Email: 'servizioclienti@hilti.com',
            PEC: 'hilti@pec.it',
            Referente: 'Ing. Davide Marchesi',
            'Categoria Merceologica': 'attrezzature_utensili',
            IBAN: 'IT12B0306909606100000098765',
            'Condizioni Pagamento': 'Bonifico 30 gg',
            'Sconto Applicato %': 25,
            'DURC Protocollo': 'INAIL_48291039',
            'DURC Scadenza (AAAA-MM-GG)': '2026-12-15',
            Certificazioni: 'ISO 9001; CE; OHSAS 18001',
            'Rating (1-5)': 5,
          },
        ];
        break;

      case 'attrezzature':
        headers = [
          'Codice Attrezzo',
          'Nome Strumento',
          'Categoria',
          'Marca e Modello',
          'Matricola / Seriale',
          'Data Acquisto (AAAA-MM-GG)',
          'Fornitore',
          'Costo Acquisto Euro',
          'Stato (disponibile/assegnata/in_manutenzione/taratura_scaduta)',
          'Assegnato A (Cantiere o Persona)',
          'Prossima Taratura (AAAA-MM-GG)',
        ];
        sampleRows = [
          {
            'Codice Attrezzo': 'ATT-STR-012',
            'Nome Strumento': 'Multifunzione Prove CEI 64-8 Asita I-V 400',
            Categoria: 'Strumenti Misura & Collaudo',
            'Marca e Modello': 'Asita I-V 400w',
            'Matricola / Seriale': 'AST-2025-9921',
            'Data Acquisto (AAAA-MM-GG)': '2025-04-10',
            Fornitore: 'Asita S.r.l.',
            'Costo Acquisto Euro': 2450,
            'Stato (disponibile/assegnata/in_manutenzione/taratura_scaduta)': 'disponibile',
            'Assegnato A (Cantiere o Persona)': 'Magazzino Centrale',
            'Prossima Taratura (AAAA-MM-GG)': '2026-10-31',
          },
          {
            'Codice Attrezzo': 'ATT-ELT-045',
            'Nome Strumento': 'Martello Demolitore Elettropneumatico SDS-Max',
            Categoria: 'Elettroutensili',
            'Marca e Modello': 'Hilti TE 70-ATC',
            'Matricola / Seriale': 'HLT-88291-DEM',
            'Data Acquisto (AAAA-MM-GG)': '2024-09-18',
            Fornitore: 'Hilti Italia',
            'Costo Acquisto Euro': 1680,
            'Stato (disponibile/assegnata/in_manutenzione/taratura_scaduta)': 'assegnata',
            'Assegnato A (Cantiere o Persona)': 'Cantiere Ospedale San Luca',
            'Prossima Taratura (AAAA-MM-GG)': '2026-12-31',
          },
        ];
        break;

      case 'dispositivi':
        headers = [
          'Codice Identificativo',
          'Tipologia (tablet/smartphone/gps_tracker/sensore_iot/dpi_smart/timbratura_badge)',
          'Marca e Modello',
          'Numero Seriale / IMEI',
          'Stato (attivo/in_riparazione/disponibile_scorta/dismesso)',
          'Assegnatario (Nome Persona, Mezzo o Cantiere)',
          'Cantiere Collegato',
          'Numero SIM',
          'Operatore SIM',
          'Piano Dati GB',
          'Data Consegna (AAAA-MM-GG)',
          'Data Restituzione Prevista (AAAA-MM-GG)',
          'Valore Euro',
          'Note',
        ];
        sampleRows = [
          {
            'Codice Identificativo': 'DSP-TAB-05',
            'Tipologia (tablet/smartphone/gps_tracker/sensore_iot/dpi_smart/timbratura_badge)': 'tablet',
            'Marca e Modello': 'Samsung Galaxy Tab Active5 5G Enterprise Rugged',
            'Numero Seriale / IMEI': '359182049182039',
            'Stato (attivo/in_riparazione/disponibile_scorta/dismesso)': 'attivo',
            'Assegnatario (Nome Persona, Mezzo o Cantiere)': 'Marco Villa (Capocantiere)',
            'Cantiere Collegato': 'Ospedale San Luca',
            'Numero SIM': '+39 348 8129032',
            'Operatore SIM': 'TIM Business',
            'Piano Dati GB': '50 GB 5G',
            'Data Consegna (AAAA-MM-GG)': '2026-01-15',
            'Data Restituzione Prevista (AAAA-MM-GG)': '2026-12-31',
            'Valore Euro': 780,
            Note: 'Custodia gommata antiurto MIL-STD-810H con pennino S-Pen.',
          },
          {
            'Codice Identificativo': 'DSP-GPS-03',
            'Tipologia (tablet/smartphone/gps_tracker/sensore_iot/dpi_smart/timbratura_badge)': 'gps_tracker',
            'Marca e Modello': 'Teltonika FMB920 OBD-II GPS/GLONASS',
            'Numero Seriale / IMEI': '869102938472910',
            'Stato (attivo/in_riparazione/disponibile_scorta/dismesso)': 'attivo',
            'Assegnatario (Nome Persona, Mezzo o Cantiere)': 'Fiat Doblò Cargo (Targa GA890MN)',
            'Cantiere Collegato': '',
            'Numero SIM': '+39 377 8291029',
            'Operatore SIM': 'Things Mobile IoT',
            'Piano Dati GB': '500 MB M2M',
            'Data Consegna (AAAA-MM-GG)': '2025-10-10',
            'Data Restituzione Prevista (AAAA-MM-GG)': '',
            'Valore Euro': 150,
            Note: 'Dispositivo collegato alla presa diagnostica OBD.',
          },
        ];
        break;

      case 'mezzi':
        headers = [
          'Targa',
          'Marca e Modello',
          'Tipologia (furgone/autocarro/piattaforma_ple/auto)',
          'Proprietà (proprieta/noleggio/leasing)',
          'Km Attuali',
          'Autista / Referente Assegnato',
          'Assicurazione Compagnia',
          'Assicurazione Scadenza (AAAA-MM-GG)',
          'Revisione MCTC Scadenza (AAAA-MM-GG)',
          'Bollo Scadenza (AAAA-MM-GG)',
          'Scadenza Tagliando Km',
          'Stato (in_servizio/in_officina/fermo)',
          'Note Allestimento',
        ];
        sampleRows = [
          {
            Targa: 'GA421KL',
            'Marca e Modello': 'Iveco Daily 35C15 Cabinato Allestito Officina',
            'Tipologia (furgone/autocarro/piattaforma_ple/auto)': 'furgone',
            'Proprietà (proprieta/noleggio/leasing)': 'proprieta',
            'Km Attuali': 148500,
            'Autista / Referente Assegnato': 'Marco Villa',
            'Assicurazione Compagnia': 'Allianz Viva Business Flotte',
            'Assicurazione Scadenza (AAAA-MM-GG)': '2026-11-30',
            'Revisione MCTC Scadenza (AAAA-MM-GG)': '2027-02-28',
            'Bollo Scadenza (AAAA-MM-GG)': '2026-12-31',
            'Scadenza Tagliando Km': 160000,
            'Stato (in_servizio/in_officina/fermo)': 'in_servizio',
            'Note Allestimento': 'Scaffalature Syncro System, morsa, inverter 230V e portascale.',
          },
          {
            Targa: 'FP890TY',
            'Marca e Modello': 'Piattaforma Aerea Cestello Socage DA324 su Nissan',
            'Tipologia (furgone/autocarro/piattaforma_ple/auto)': 'piattaforma_ple',
            'Proprietà (proprieta/noleggio/leasing)': 'noleggio',
            'Km Attuali': 62400,
            'Autista / Referente Assegnato': 'Giuseppe Colombo',
            'Assicurazione Compagnia': 'Generali Flotta',
            'Assicurazione Scadenza (AAAA-MM-GG)': '2026-10-15',
            'Revisione MCTC Scadenza (AAAA-MM-GG)': '2026-08-31',
            'Bollo Scadenza (AAAA-MM-GG)': '2026-07-31',
            'Scadenza Tagliando Km': 75000,
            'Stato (in_servizio/in_officina/fermo)': 'in_servizio',
            'Note Allestimento': 'Braccio articolato 24mt, verifica annuale INAIL eseguita.',
          },
        ];
        break;

      case 'magazzino':
        headers = [
          'Codice Articolo / SKU',
          'Descrizione Articolo',
          'Categoria (cavi_elettrici/quadri_modulari/apparecchi_comando/tubi_canaline/illuminazione/fotovoltaico_accumulo/materiale_vario)',
          'Unità di Misura',
          'Giacenza Attuale',
          'Scorta Minima (Alert)',
          'Prezzo Acquisto Unitario Euro',
          'Prezzo Vendita / Ricarico Euro',
          'Ubicazione Scaffale',
          'Fornitore Abituale',
          'Codice a Barre / EAN',
        ];
        sampleRows = [
          {
            'Codice Articolo / SKU': 'CAV-FG16-5G16',
            'Descrizione Articolo': 'Cavo Energia FG16OR16 0.6/1kV 5G16 CPR Cca-s3,d1,a3',
            'Categoria (cavi_elettrici/quadri_modulari/apparecchi_comando/tubi_canaline/illuminazione/fotovoltaico_accumulo/materiale_vario)': 'cavi_elettrici',
            'Unità di Misura': 'm',
            'Giacenza Attuale': 450,
            'Scorta Minima (Alert)': 100,
            'Prezzo Acquisto Unitario Euro': 9.85,
            'Prezzo Vendita / Ricarico Euro': 14.5,
            'Ubicazione Scaffale': 'CORSIA-C-BOBINA-04',
            'Fornitore Abituale': 'RemaTarlazzi S.p.A.',
            'Codice a Barre / EAN': '8004928102941',
          },
          {
            'Codice Articolo / SKU': 'QDR-INT-4P63A',
            'Descrizione Articolo': 'Interruttore Magnetotermico Differenziale 4P 63A 300mA 10kA Tipo A',
            'Categoria (cavi_elettrici/quadri_modulari/apparecchi_comando/tubi_canaline/illuminazione/fotovoltaico_accumulo/materiale_vario)': 'quadri_modulari',
            'Unità di Misura': 'pz',
            'Giacenza Attuale': 8,
            'Scorta Minima (Alert)': 4,
            'Prezzo Acquisto Unitario Euro': 124.5,
            'Prezzo Vendita / Ricarico Euro': 185.0,
            'Ubicazione Scaffale': 'SCAFF-A2-RIP-3',
            'Fornitore Abituale': 'ABB S.p.A. / Sacchi',
            'Codice a Barre / EAN': '7612270928192',
          },
        ];
        break;

      case 'operai':
        headers = [
          'Tipo Record (dipendente/subappalto)',
          'Nome / Ragione Sociale',
          'Cognome',
          'Codice Fiscale',
          'Partita IVA (solo se subappalto)',
          'Mansione / Qualifica',
          'Reparto (capocantiere/operaio/apprendista/ufficio_tecnico/contabilita)',
          'Telefono',
          'Email',
          'PEC',
          'Costo Orario Aziendale Euro',
          'Patentini (es. PES-PAV; PLE; Primo Soccorso; Antincendio)',
          'Scadenza Visita Medica (AAAA-MM-GG)',
          'DURC Scadenza (AAAA-MM-GG)',
          'DURC Protocollo',
          'Stato (attivo/ferie/malattia/inattivo)',
          'Cantiere Assegnato',
        ];
        sampleRows = [
          {
            'Tipo Record (dipendente/subappalto)': 'dipendente',
            'Nome / Ragione Sociale': 'Matteo',
            Cognome: 'Riva',
            'Codice Fiscale': 'RVIMTT92C15F205K',
            'Partita IVA (solo se subappalto)': '',
            'Mansione / Qualifica': 'Operaio Elettricista Specializzato PES/PAV',
            'Reparto (capocantiere/operaio/apprendista/ufficio_tecnico/contabilita)': 'operaio',
            Telefono: '+39 347 9102834',
            Email: 'matteo.riva@voltmaster.it',
            PEC: '',
            'Costo Orario Aziendale Euro': 32.5,
            'Patentini (es. PES-PAV; PLE; Primo Soccorso; Antincendio)': 'PES-PAV; PLE; Lavori in quota',
            'Scadenza Visita Medica (AAAA-MM-GG)': '2026-11-20',
            'DURC Scadenza (AAAA-MM-GG)': '',
            'DURC Protocollo': '',
            'Stato (attivo/ferie/malattia/inattivo)': 'attivo',
            'Cantiere Assegnato': 'Ospedale San Luca',
          },
          {
            'Tipo Record (dipendente/subappalto)': 'subappalto',
            'Nome / Ragione Sociale': 'Orobica Montaggi S.r.l.',
            Cognome: '',
            'Codice Fiscale': '03819280164',
            'Partita IVA (solo se subappalto)': '03819280164',
            'Mansione / Qualifica': 'Posa Blindosbarre MT/BT e Strutture Metalliche',
            'Reparto (capocantiere/operaio/apprendista/ufficio_tecnico/contabilita)': '',
            Telefono: '+39 035 592810',
            Email: 'cantieri@orobicamontaggi.it',
            PEC: 'orobicamontaggi@pec.it',
            'Costo Orario Aziendale Euro': 48.0,
            'Patentini (es. PES-PAV; PLE; Primo Soccorso; Antincendio)': 'PES-PAV; Gru; Saldatori UNI EN ISO 9606',
            'Scadenza Visita Medica (AAAA-MM-GG)': '',
            'DURC Scadenza (AAAA-MM-GG)': '2026-12-30',
            'DURC Protocollo': 'INPS_39812491',
            'Stato (attivo/ferie/malattia/inattivo)': 'attivo',
            'Cantiere Assegnato': 'Ospedale San Luca',
          },
        ];
        break;
    }

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });

    // Stile automatico larghezza colonne
    ws['!cols'] = headers.map((h) => ({
      wch: Math.max(h.length + 4, 16),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Template_${tab}`);

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, fileName);
  },

  /**
   * Esporta l'anagrafica corrente in Excel (.xlsx)
   */
  exportToExcel(tab: ImpostazioniTabId, data: any[]) {
    const fileName = `Export_Anagrafica_${tab}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const cleanRows = data.map((item) => {
      // Flatten or clean complex fields for readable spreadsheet
      const row: Record<string, any> = {};
      Object.entries(item).forEach(([k, v]) => {
        if (k === 'dispositivi' || k === 'materialiAssegnati' || k === 'storicoInterventi' || k === 'storicoManutenzioni') {
          return; // skip large nested arrays
        }
        if (typeof v === 'object' && v !== null) {
          if (Array.isArray(v)) {
            row[k] = v.join('; ');
          } else {
            row[k] = JSON.stringify(v);
          }
        } else {
          row[k] = v ?? '';
        }
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(cleanRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab.toUpperCase());

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, fileName);
  },

  /**
   * Esporta l'anagrafica in CSV
   */
  exportToCsv(tab: ImpostazioniTabId, data: any[]) {
    const fileName = `Export_Anagrafica_${tab}_${new Date().toISOString().split('T')[0]}.csv`;
    const cleanRows = data.map((item) => {
      const row: Record<string, any> = {};
      Object.entries(item).forEach(([k, v]) => {
        if (typeof v === 'object' && v !== null) {
          row[k] = Array.isArray(v) ? v.join('; ') : JSON.stringify(v);
        } else {
          row[k] = v ?? '';
        }
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(cleanRows);
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, fileName);
  },

  /**
   * Parser e Validatore intelligente per Import Excel / CSV con drag-and-drop
   */
  async importFromExcel<T = any>(
    tab: ImpostazioniTabId,
    file: File,
    existingData: any[] = []
  ): Promise<ImportValidationResult<T>> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    const importedItems: any[] = [];
    const errors: { row: number; column?: string; message: string; rawRowData: Record<string, any> }[] = [];
    let updatedCount = 0;
    let insertedCount = 0;

    // Helper per normalizzare chiavi (rimuove spazi, accenti, minuscolo)
    const normalizeKey = (key: string) =>
      key
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();

    rawRows.forEach((rawRow, idx) => {
      const rowNumber = idx + 2; // riga 1 è l'intestazione

      // Mappatura dinamica delle chiavi della riga
      const rowNormalized: Record<string, any> = {};
      Object.keys(rawRow).forEach((k) => {
        rowNormalized[normalizeKey(k)] = rawRow[k];
      });

      const getVal = (...possibleKeys: string[]) => {
        for (const key of possibleKeys) {
          const norm = normalizeKey(key);
          if (rowNormalized[norm] !== undefined && rowNormalized[norm] !== '') {
            return rowNormalized[norm];
          }
        }
        return '';
      };

      try {
        switch (tab) {
          case 'cantieri': {
            const codice = getVal('codicecantiere', 'codice', 'codcantiere') || `CNT-IMP-${Date.now()}-${idx}`;
            const titolo = getVal('nome', 'titolo', 'nomecantiere', 'cantiere');
            const clienteNome = getVal('cliente', 'committente', 'clientecommittente', 'ragionesociale');
            const indirizzo = getVal('indirizzo', 'via') || 'Da definire';
            const citta = getVal('comune', 'citta') || 'Milano';

            if (!titolo) {
              errors.push({
                row: rowNumber,
                column: 'Nome / Titolo',
                message: 'Campo obbligatorio mancante: Nome o Titolo cantiere.',
                rawRowData: rawRow,
              });
              return;
            }

            const importoLavori = parseFloat(String(getVal('importolavori', 'importoeuro', 'budgettotale', 'importo')).replace(',', '.')) || 50000;
            const dataInizio = String(getVal('datainizio', 'inizio') || new Date().toISOString().split('T')[0]);
            const dataFine = String(getVal('datafineprevista', 'datafine', 'fine') || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
            const stato = (getVal('stato') || 'in_corso').toLowerCase().replace(' ', '_');

            const existing = existingData.find((c: Cantiere) => c.codice === codice || c.titolo.toLowerCase() === titolo.toLowerCase());

            const item: Partial<Cantiere> = {
              id: existing ? existing.id : `cnt-imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              codice: String(codice),
              titolo: String(titolo),
              clienteNome: String(clienteNome || 'Cliente Committente'),
              clienteId: existing ? existing.clienteId : 'cli-gen',
              indirizzo: String(indirizzo),
              citta: String(citta),
              stato: (['in_attesa', 'in_corso', 'collaudo', 'completato', 'sospeso'].includes(stato) ? stato : 'in_corso') as any,
              avanzamentoPercentuale: existing ? existing.avanzamentoPercentuale : 0,
              dataInizio,
              dataFinePrevista: dataFine,
              responsabileNome: String(getVal('direttorelavori', 'capocantiere', 'responsabile') || 'Marco Villa'),
              responsabileId: 'usr-1',
              operatoriAssegnatiIds: existing ? existing.operatoriAssegnatiIds : [],
              budgetTotale: importoLavori,
              costiConsuntivati: 0,
              descrizione: String(getVal('note', 'descrizione') || 'Importato da foglio elettronico Excel.'),
              qrCode: String(codice),
              dispositivi: existing ? existing.dispositivi : [],
              materialiAssegnati: existing ? existing.materialiAssegnati : [],
              lat: parseFloat(String(getVal('latitudine', 'latitudingps', 'lat'))) || 45.4642,
              lng: parseFloat(String(getVal('longitudine', 'longitudingps', 'lng'))) || 9.19,
            };

            if (existing) updatedCount++;
            else insertedCount++;

            importedItems.push(item);
            break;
          }

          case 'clienti': {
            const ragioneSociale = getVal('ragionesociale', 'nome', 'cliente');
            const partitaIva = getVal('partitaiva', 'piva', 'pi');
            const codiceFiscale = getVal('codicefiscale', 'cf') || partitaIva;
            const email = getVal('email', 'mail');
            const telefono = getVal('telefono', 'tel', 'cellulare');

            if (!ragioneSociale) {
              errors.push({
                row: rowNumber,
                column: 'Ragione Sociale',
                message: 'Ragione Sociale del cliente obbligatoria.',
                rawRowData: rawRow,
              });
              return;
            }

            const existing = existingData.find(
              (c: Cliente) => (partitaIva && c.partitaIva === partitaIva) || c.ragioneSociale.toLowerCase() === ragioneSociale.toLowerCase()
            );

            const item: Partial<Cliente> = {
              id: existing ? existing.id : `cli-imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              ragioneSociale: String(ragioneSociale),
              referente: String(getVal('referente', 'contatto') || 'Ufficio Tecnico'),
              email: String(email || 'info@cliente.it'),
              telefono: String(telefono || '+39 02 000000'),
              indirizzo: String(getVal('indirizzo', 'via') || 'Sede Legale'),
              citta: String(getVal('comune', 'citta') || 'Milano'),
              cap: String(getVal('cap') || '20100'),
              provincia: String(getVal('provincia', 'pr') || 'MI'),
              partitaIva: String(partitaIva || '00000000000'),
              codiceFiscale: String(codiceFiscale || ''),
              codiceUnivocoSdi: String(getVal('codicesdi', 'sdi', 'codiceunivoco') || '0000000'),
              pec: String(getVal('pec') || ''),
              note: String(getVal('note', 'condizionipagamento') || ''),
            };

            if (existing) updatedCount++;
            else insertedCount++;

            importedItems.push(item);
            break;
          }

          case 'fornitori': {
            const ragioneSociale = getVal('ragionesociale', 'fornitore', 'nome');
            const partitaIva = getVal('partitaiva', 'piva');
            if (!ragioneSociale) {
              errors.push({
                row: rowNumber,
                column: 'Ragione Sociale',
                message: 'Ragione Sociale fornitore obbligatoria.',
                rawRowData: rawRow,
              });
              return;
            }

            const existing = existingData.find(
              (f: FornitoreAnagrafica) => (partitaIva && f.partitaIva === partitaIva) || f.ragioneSociale.toLowerCase() === ragioneSociale.toLowerCase()
            );

            const item: Partial<FornitoreAnagrafica> = {
              id: existing ? existing.id : `forn-imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              ragioneSociale: String(ragioneSociale),
              referente: String(getVal('referente', 'contatto') || 'Ufficio Ordini'),
              email: String(getVal('email', 'mail') || 'ordini@fornitore.it'),
              telefono: String(getVal('telefono', 'tel') || '+39 02 000000'),
              indirizzo: String(getVal('indirizzo') || 'Via Elettronica 1'),
              citta: String(getVal('comune', 'citta') || 'Milano'),
              partitaIva: String(partitaIva || '00000000000'),
              categoria: (getVal('categoria', 'categoriamerceologica') || 'materiale_elettrico') as any,
              tempoMedioConsegnaGiorni: parseInt(String(getVal('tempomedio', 'giorniconsegna') || '1'), 10) || 1,
            };

            if (existing) updatedCount++;
            else insertedCount++;

            importedItems.push(item);
            break;
          }

          case 'attrezzature': {
            const nome = getVal('nomestrumento', 'nome', 'attrezzo', 'descrizione');
            const codice = getVal('codiceattrezzo', 'codice', 'matricola') || `ATT-${Date.now()}-${idx}`;

            if (!nome) {
              errors.push({
                row: rowNumber,
                column: 'Nome Strumento',
                message: 'Nome strumento/attrezzatura obbligatorio.',
                rawRowData: rawRow,
              });
              return;
            }

            const existing = existingData.find(
              (a: Attrezzatura) => a.codiceUnivoco === codice || a.matricola === codice || a.nome.toLowerCase() === nome.toLowerCase()
            );

            const item: Partial<Attrezzatura> = {
              id: existing ? existing.id : `att-imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              codiceUnivoco: String(codice),
              nome: String(nome),
              marcaModello: String(getVal('marcamodello', 'marca', 'modello') || 'Hilti / Fluke / Asita'),
              matricola: String(getVal('matricolaseriale', 'matricola', 'seriale') || codice),
              stato: (getVal('stato') || 'disponibile') as any,
              dataAcquisto: String(getVal('dataacquisto', 'acquisto') || new Date().toISOString().split('T')[0]),
              prossimaTaratura: String(getVal('prossimataratura', 'taratura', 'scadenzataratura') || '2026-12-31'),
              storicoManutenzioni: existing ? existing.storicoManutenzioni : [],
              qrCode: String(codice),
            };

            if (existing) updatedCount++;
            else insertedCount++;

            importedItems.push(item);
            break;
          }

          case 'dispositivi': {
            const codice = getVal('codiceidentificativo', 'codice', 'dspcodice') || `DSP-IMP-${Date.now()}-${idx}`;
            const marcaModello = getVal('marcamodello', 'modello', 'dispositivo');
            const serialeImei = getVal('numeroserialeimei', 'imei', 'seriale') || `SN-${Date.now()}`;

            if (!marcaModello) {
              errors.push({
                row: rowNumber,
                column: 'Marca e Modello',
                message: 'Descrizione / Marca e modello dispositivo obbligatorio.',
                rawRowData: rawRow,
              });
              return;
            }

            const existing = existingData.find(
              (d: DispositivoAziendale) => d.codice === codice || d.serialeImei === serialeImei
            );

            const item: Partial<DispositivoAziendale> = {
              id: existing ? existing.id : `dsp-imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              codice: String(codice),
              tipologia: (getVal('tipologia', 'tipo') || 'tablet') as any,
              marcaModello: String(marcaModello),
              serialeImei: String(serialeImei),
              stato: (getVal('stato') || 'attivo') as any,
              assegnatarioTipo: 'utente',
              assegnatarioNome: String(getVal('assegnatario', 'utente', 'responsabile') || 'Da assegnare'),
              cantiereNome: String(getVal('cantierecollegato', 'cantiere') || ''),
              simNumero: String(getVal('numerosim', 'sim') || ''),
              simOperatore: String(getVal('operatoresim', 'operatore') || 'TIM Business'),
              pianoDatiGb: String(getVal('pianodatigb', 'pianodati') || '50 GB'),
              dataConsegna: String(getVal('dataconsegna', 'consegna') || new Date().toISOString().split('T')[0]),
              valoreEuro: parseFloat(String(getVal('valoreeuro', 'costo')).replace(',', '.')) || 450,
              note: String(getVal('note') || ''),
              qrCode: String(codice),
            };

            if (existing) updatedCount++;
            else insertedCount++;

            importedItems.push(item);
            break;
          }

          case 'mezzi': {
            const targa = (getVal('targa') || '').toUpperCase().trim();
            const modello = getVal('marcamodello', 'modello', 'marca');

            if (!targa || !modello) {
              errors.push({
                row: rowNumber,
                column: 'Targa / Modello',
                message: 'Targa e Marca/Modello sono obbligatori per il veicolo.',
                rawRowData: rawRow,
              });
              return;
            }

            const existing = existingData.find((v: Veicolo) => v.targa === targa);

            const item: Partial<Veicolo> = {
              id: existing ? existing.id : `veic-imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              targa: String(targa),
              modello: String(modello),
              kmAttuali: parseInt(String(getVal('kmattuali', 'km') || '50000'), 10) || 50000,
              autistaAssegnatoNome: String(getVal('autista', 'autistaassegnato', 'responsabile') || 'Marco Villa'),
              scadenzaRevisione: String(getVal('revisionemctcscadenza', 'revisione') || '2027-01-31'),
              scadenzaAssicurazione: String(getVal('assicurazionescadenza', 'assicurazione') || '2026-12-31'),
              scadenzaBollo: String(getVal('bolloscadenza', 'bollo') || '2026-12-31'),
              scadenzaTagliandoKm: parseInt(String(getVal('scadenzatagliandokm', 'tagliando') || '60000'), 10) || 60000,
              stato: (getVal('stato') || 'in_servizio') as any,
              qrCode: String(targa),
              storicoInterventi: existing ? existing.storicoInterventi : [],
              note: String(getVal('noteallestimento', 'note') || ''),
            };

            if (existing) updatedCount++;
            else insertedCount++;

            importedItems.push(item);
            break;
          }

          case 'magazzino': {
            const codiceSku = getVal('codicearticolo', 'sku', 'codice');
            const nome = getVal('descrizionearticolo', 'descrizione', 'nome');

            if (!nome) {
              errors.push({
                row: rowNumber,
                column: 'Descrizione Articolo',
                message: 'Descrizione articolo obbligatoria.',
                rawRowData: rawRow,
              });
              return;
            }

            const existing = existingData.find(
              (m: ArticoloMagazzino) => (codiceSku && m.codiceSku === codiceSku) || m.nome.toLowerCase() === nome.toLowerCase()
            );

            const giacenza = parseFloat(String(getVal('giacenzaattuale', 'giacenza', 'qta')).replace(',', '.')) || 0;
            const scortaMinima = parseFloat(String(getVal('scortaminima', 'scorta')).replace(',', '.')) || 5;
            const prezzoAcquisto = parseFloat(String(getVal('prezzoacquistounitario', 'costoacquisto', 'prezzoacquisto')).replace(',', '.')) || 10;
            const prezzoVendita = parseFloat(String(getVal('prezzovendita', 'prezzo')).replace(',', '.')) || prezzoAcquisto * 1.35;

            const item: Partial<ArticoloMagazzino> = {
              id: existing ? existing.id : `art-imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              codiceSku: String(codiceSku || `SKU-${Date.now()}-${idx}`),
              nome: String(nome),
              categoria: (getVal('categoria') || 'materiale_vario') as any,
              giacenza,
              scortaMinima,
              unitaMisura: String(getVal('unitamisura', 'um') || 'pz'),
              prezzoUnitarioAcquisto: prezzoAcquisto,
              prezzoListinoVendita: prezzoVendita,
              ubicazioneScaffale: String(getVal('ubicazionescaffale', 'scaffale', 'posizione') || 'CENTRALE-A1'),
              fornitore: String(getVal('fornitoreabituale', 'fornitore') || 'RemaTarlazzi S.p.A.'),
              qrCode: String(codiceSku || nome),
              barcodeEan: String(getVal('codiceabarre', 'ean', 'barcode') || ''),
            };

            if (existing) updatedCount++;
            else insertedCount++;

            importedItems.push(item);
            break;
          }

          case 'operai': {
            const tipoRecord = (getVal('tiporecord', 'tipo') || 'dipendente').toLowerCase();
            const nome = getVal('nome', 'nomeregionesociale', 'ragionesociale');
            const cognome = getVal('cognome');
            const codiceFiscale = getVal('codicefiscale', 'cf');
            const partitaIva = getVal('partitaiva', 'piva');

            if (!nome) {
              errors.push({
                row: rowNumber,
                column: 'Nome / Ragione Sociale',
                message: 'Nome dipendente o Ragione Sociale subappalto obbligatoria.',
                rawRowData: rawRow,
              });
              return;
            }

            if (tipoRecord.includes('subappalto') || partitaIva) {
              // Subappaltatore
              const existing = existingData.find(
                (s: SubappaltoAnagrafica) => (partitaIva && s.partitaIva === partitaIva) || s.ragioneSociale.toLowerCase() === nome.toLowerCase()
              );

              const subItem: Partial<SubappaltoAnagrafica> = {
                id: existing ? existing.id : `sub-imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                ragioneSociale: String(nome),
                partitaIva: String(partitaIva || codiceFiscale || '00000000000'),
                codiceFiscale: String(codiceFiscale || partitaIva || ''),
                sedeLegale: String(getVal('sedelegale', 'indirizzo') || 'Lombardia (MI)'),
                referente: String(getVal('referente', 'contatto') || 'Geom. Responsabile Cantiere'),
                telefono: String(getVal('telefono', 'tel') || '+39 02 000000'),
                email: String(getVal('email', 'mail') || 'info@subappalto.it'),
                pec: String(getVal('pec') || ''),
                categoriaLavorazione: String(getVal('mansione', 'qualifica', 'lavorazioni') || 'Posa e Montaggi Speciali'),
                cantiereAssegnatoNome: String(getVal('cantiereassegnato', 'cantiere') || 'Tutti i cantieri'),
                dataInizioContratto: new Date().toISOString().split('T')[0],
                dataFineContratto: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
                importoContratto: parseFloat(String(getVal('importocontratto', 'importo')).replace(',', '.')) || 25000,
                durcProtocollo: String(getVal('durcprotocollo', 'protocollo') || 'INPS_REGOLARE'),
                durcScadenza: String(getVal('durcscadenza', 'scadenzadurc') || '2026-12-31'),
                durcStato: 'regolare',
                posStato: 'approvato_cse',
                numeroOperatoriInCantiere: 3,
                congruitaManodopera: true,
              };

              if (existing) updatedCount++;
              else insertedCount++;

              importedItems.push(subItem);
            } else {
              // Dipendente interno
              const existing = existingData.find(
                (d: Dipendente) => (codiceFiscale && d.codiceFiscale === codiceFiscale) || (d.nome.toLowerCase() === nome.toLowerCase() && d.cognome.toLowerCase() === (cognome || '').toLowerCase())
              );

              const patentiniStr = String(getVal('patentini', 'abilitazioni') || 'PES-PAV');
              const patentiniList = patentiniStr.split(/[,;]/).map((s) => s.trim()).filter(Boolean);

              const dipItem: Partial<Dipendente> = {
                id: existing ? existing.id : `dip-imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                nome: String(nome),
                cognome: String(cognome || ''),
                codiceFiscale: String(codiceFiscale || 'XXXXXXXXXXXXXXXX'),
                reparto: (getVal('reparto') || 'operaio') as any,
                ruoloAziendale: String(getVal('mansione', 'qualifica', 'ruolo') || 'Elettricista Specializzato'),
                telefono: String(getVal('telefono', 'tel') || '+39 340 0000000'),
                email: String(getVal('email', 'mail') || `${nome.toLowerCase()}.${cognome ? cognome.toLowerCase() : 'op'}@voltmaster.it`),
                dataAssunzione: '2024-01-08',
                costoOrario: parseFloat(String(getVal('costoorarioaziendale', 'costoorario')).replace(',', '.')) || 32,
                patentini: patentiniList.length > 0 ? patentiniList : ['PES-PAV-PEI (Norma CEI 11-27)'],
                oreLavorateMeseCorrente: 160,
                ferieDisponibiliGiorni: 18,
                permessiDisponibiliOre: 42,
                visitaMedicaScadenza: String(getVal('scadenzavisitamedica', 'visitamedica') || '2026-12-31'),
              };

              if (existing) updatedCount++;
              else insertedCount++;

              importedItems.push(dipItem);
            }
            break;
          }
        }
      } catch (err: any) {
        errors.push({
          row: rowNumber,
          message: `Errore di parsing riga: ${err?.message || 'Formato non valido.'}`,
          rawRowData: rawRow,
        });
      }
    });

    return {
      success: errors.length === 0,
      importedItems,
      updatedCount,
      insertedCount,
      errors,
      totalParsed: rawRows.length,
    };
  },
};
