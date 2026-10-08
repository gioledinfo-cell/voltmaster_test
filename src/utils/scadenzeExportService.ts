import * as XLSX from 'xlsx';
import { ScadenzaItem, calcolaSemaforoScadenza } from '../types/scadenze';

export function exportScadenziarioExcel(
  scadenze: ScadenzaItem[],
  aziendaNome = 'VoltMaster Impianti S.r.l.'
) {
  const wb = XLSX.utils.book_new();

  // Mappa delle etichette categoria
  const catLabels: Record<string, string> = {
    durc: 'DURC & Regolarità Contributiva',
    taratura_cei64: 'Tarature Strumenti CEI 64-8',
    revisione_veicoli: 'Revisioni & Flotta Mezzi',
    patentini_sicurezza: 'Patentini & Sicurezza (D.Lgs 81/08)',
    cantieri_sicurezza: 'Cantieri, POS & Assicurazioni',
  };

  const semaforoLabels: Record<string, string> = {
    scaduto: '🔴 SCADUTO (Critico)',
    urgente_15gg: '🟠 URGENTE (<= 15gg)',
    attenzione_30gg: '🟡 ATTENZIONE (<= 30gg)',
    regolare: '🟢 REGOLARE (> 30gg)',
  };

  // Prepara righe con calcolo semaforo
  const rowsAll = scadenze.map((s) => {
    const calc = calcolaSemaforoScadenza(s.dataScadenza);
    return {
      s,
      calc,
    };
  });

  // Ordina per giorni rimanenti (più critici per primi)
  rowsAll.sort((a, b) => a.calc.giorniRimanenti - b.calc.giorniRimanenti);

  // ==========================================
  // FOGLIO 1: REGISTRO GLOBALE A SEMAFORO
  // ==========================================
  const wsData1: (string | number)[][] = [
    [aziendaNome.toUpperCase() + ' - REGISTRO GENERALE SCADENZE & CONFORMITÀ NORMATIVA'],
    [`Generato il: ${new Date().toLocaleDateString('it-IT')} | Monitoraggio: D.Lgs 81/08, CEI 64-8, CEI 11-27, MCTC`],
    [],
    [
      'SEMAFORO',
      'GIORNI RIMANENTI',
      'CATEGORIA',
      'TITOLO SCADENZA',
      'SOGGETTO / RISORSA',
      'RUOLO / REPARTO',
      'DATA SCADENZA',
      'PROTOCOLLO / ATTESTATO',
      'ENTE DI RILASCIO',
      'COSTO PREVISTO (€)',
      'NOTE OPERATIVE & PRESCRIZIONI',
    ],
  ];

  rowsAll.forEach((item) => {
    wsData1.push([
      semaforoLabels[item.calc.stato] || item.calc.stato,
      item.calc.giorniRimanenti < 0
        ? `SCADUTO DA ${Math.abs(item.calc.giorniRimanenti)} GG`
        : `${item.calc.giorniRimanenti} GIORNI`,
      catLabels[item.s.categoria] || item.s.categoria,
      item.s.titolo,
      item.s.soggetto,
      item.s.ruoloORipartizione || '-',
      item.s.dataScadenza,
      item.s.protocolloONumero || '-',
      item.s.enteRilascio || '-',
      item.s.costoRinnovoPrevisto ?? 0,
      item.s.note || '-',
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(wsData1);
  XLSX.utils.book_append_sheet(wb, ws1, 'Registro Generale');

  // ==========================================
  // FOGLI TEMATICI DEDICATI
  // ==========================================
  const categorie: { id: ScadenzaItem['categoria']; nome: string }[] = [
    { id: 'durc', nome: 'DURC & Contributi' },
    { id: 'taratura_cei64', nome: 'Strumenti CEI 64-8' },
    { id: 'revisione_veicoli', nome: 'Revisioni & Furgoni' },
    { id: 'patentini_sicurezza', nome: 'Patentini & Personale' },
  ];

  categorie.forEach((cat) => {
    const filtered = rowsAll.filter((r) => r.s.categoria === cat.id);
    const wsDataCat: (string | number)[][] = [
      [`${aziendaNome} - Sezione: ${catLabels[cat.id]}`],
      [],
      [
        'SEMAFORO',
        'GIORNI RIMANENTI',
        'TITOLO',
        'SOGGETTO',
        'DATA SCADENZA',
        'PROTOCOLLO / RIF.',
        'ENTE / LABORATORIO',
        'COSTO (€)',
        'NOTE',
      ],
    ];

    filtered.forEach((item) => {
      wsDataCat.push([
        semaforoLabels[item.calc.stato] || item.calc.stato,
        item.calc.giorniRimanenti < 0
          ? `SCADUTO DA ${Math.abs(item.calc.giorniRimanenti)} GG`
          : `${item.calc.giorniRimanenti} GIORNI`,
        item.s.titolo,
        item.s.soggetto,
        item.s.dataScadenza,
        item.s.protocolloONumero || '-',
        item.s.enteRilascio || '-',
        item.s.costoRinnovoPrevisto ?? 0,
        item.s.note || '-',
      ]);
    });

    const wsCat = XLSX.utils.aoa_to_sheet(wsDataCat);
    XLSX.utils.book_append_sheet(wb, wsCat, cat.nome);
  });

  // Salva il file Excel
  const fileName = `Scadenziario_Semaforo_VoltMaster_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
