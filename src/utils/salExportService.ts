import * as XLSX from 'xlsx';
import { StatoAvanzamentoLavori } from '../types/sal';

export function exportSalExcel(sal: StatoAvanzamentoLavori, aziendaNome = 'VoltMaster Impianti S.r.l.') {
  const wb = XLSX.utils.book_new();

  // ==============================================================
  // FOGLIO 1: FRONTESPIZIO & RIEPILOGO STATO AVANZAMENTO LAVORI
  // ==============================================================
  const f1Data: (string | number)[][] = [
    [aziendaNome.toUpperCase()],
    ['STATO AVANZAMENTO LAVORI (S.A.L.) - D.Lgs 36/2023 & D.P.R. 207/2010'],
    [`Emesso in data: ${sal.dataEmissione}`],
    [],
    ['DATI GENERALI COMMESSA & CONTABILITÀ', ''],
    ['Codice e Numero SAL:', sal.codiceSal],
    ['Stato Contabile:', sal.stato.toUpperCase().replace(/_/g, ' ')],
    ['Cantiere / Commessa:', sal.cantiereNome],
    ['Codice Cantiere:', sal.cantiereId.toUpperCase()],
    ['Committente:', sal.committenteNome],
    ['Periodo Lavorazioni:', `Dal ${sal.periodoInizio} al ${sal.periodoFine}`],
    ['Redatto Da:', sal.redattoDa],
    ['Direttore dei Lavori (D.L.):', sal.approvatoDirettoreLavori?.nome || 'In attesa di approvazione'],
    [],
    ['QUADRO ECONOMICO COMPARATIVO', 'IMPORTO (€)', '% SU TOTALE CONTRATTO'],
    ['Importo Contrattuale Totale dei Lavori', sal.importoContrattualeTotale, '100.00%'],
    ['Lavori Eseguiti nei SAL Precedenti', sal.totaleLavoriPrecedenti, `${((sal.totaleLavoriPrecedenti / sal.importoContrattualeTotale) * 100).toFixed(2)}%`],
    ['Lavori Eseguiti nel Presente SAL', sal.totaleLavoriPeriodo, `${((sal.totaleLavoriPeriodo / sal.importoContrattualeTotale) * 100).toFixed(2)}%`],
    ['Totale Lavori Cumulati a Tutto Oggi', sal.totaleLavoriCumulati, `${sal.percentualeAvanzamentoGlobale.toFixed(2)}%`],
    ['Rimanenza Lavori da Eseguire a Finire', sal.importoContrattualeTotale - sal.totaleLavoriCumulati, `${(100 - sal.percentualeAvanzamentoGlobale).toFixed(2)}%`],
    [],
    ['NOTE GENERALI DI CANTIERE:', sal.noteGenerali || 'Nessuna nota aggiuntiva.'],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(f1Data);
  ws1['!cols'] = [{ wch: 38 }, { wch: 28 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Riepilogo SAL');

  // ==============================================================
  // FOGLIO 2: LIBRETTO DELLE MISURE & REGISTRO DI CONTABILITÀ
  // ==============================================================
  const f2Data: (string | number)[][] = [
    [`LIBRETTO DELLE MISURE - ${sal.codiceSal} - ${sal.cantiereNome.toUpperCase()}`],
    [],
    [
      'Codice Tariffa',
      'Descrizione Lavorazione Capitolato',
      'U.M.',
      'Q.tà Contratt.',
      'Prezzo Unit. (€)',
      'Importo Contratt. (€)',
      'Q.tà SAL Prec.',
      'Q.tà SAL Attuale',
      'Q.tà Cumulata',
      '% Avanzamento',
      'Importo Attuale (€)',
      'Importo Cumulato (€)',
      'Note di Misura & Ubicazione',
    ],
  ];

  for (const v of sal.voci) {
    f2Data.push([
      v.codiceTariffa,
      v.descrizione,
      v.unitaMisura,
      v.quantitaContrattuale,
      v.prezzoUnitario,
      v.importoContrattuale,
      v.quantitaPrecedente,
      v.quantitaPeriodo,
      v.quantitaTotale,
      `${v.percentualeAvanzamento.toFixed(1)}%`,
      Number(v.importoPeriodo.toFixed(2)),
      Number(v.importoTotaleCumulato.toFixed(2)),
      v.noteMisure || '-',
    ]);
  }

  // Riga Totali Libretto
  f2Data.push([
    'TOTALI',
    '',
    '',
    '',
    '',
    sal.importoContrattualeTotale,
    '',
    '',
    '',
    `${sal.percentualeAvanzamentoGlobale.toFixed(1)}%`,
    Number(sal.totaleLavoriPeriodo.toFixed(2)),
    Number(sal.totaleLavoriCumulati.toFixed(2)),
    '',
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(f2Data);
  ws2['!cols'] = [
    { wch: 14 },
    { wch: 45 },
    { wch: 10 },
    { wch: 14 },
    { wch: 15 },
    { wch: 20 },
    { wch: 14 },
    { wch: 15 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Libretto delle Misure');

  // ==============================================================
  // FOGLIO 3: CERTIFICATO DI PAGAMENTO (SE PRESENTE)
  // ==============================================================
  if (sal.certificatoPagamento) {
    const cp = sal.certificatoPagamento;
    const f3Data: (string | number)[][] = [
      [`CERTIFICATO DI PAGAMENTO N. ${cp.numeroCertificato}`],
      [`Data di Rilascio: ${cp.dataCertificato}`],
      [`Direttore dei Lavori: ${cp.direttoreLavoriNome}`],
      [],
      ['PROSPETTO DI LIQUIDAZIONE CONTABILE', 'IMPORTO (€)'],
      ['Totale Lavori Eseguiti a Tutto Oggi (Cumulativo)', cp.totaleLavoriMaturatiCumulati],
      ['Detrazione Lavori Liquidati nei SAL Precedenti', -(cp.totaleLavoriMaturatiCumulati - cp.totaleLavoriMaturatiPeriodo)],
      ['Importo Lavori Eseguiti nel Periodo del Presente SAL', cp.totaleLavoriMaturatiPeriodo],
      [`Recupero Quota Anticipazione Contrattuale (-${cp.recuperoAnticipazionePercentuale}%)`, -cp.recuperoAnticipazioneImporto],
      [`Ritenuta di Garanzia per Infortuni / Svincolo (-${cp.ritenutaGaranziaPercentuale}%)`, -cp.ritenutaGaranziaImporto],
      ['Eventuali Altre Detrazioni o Penali', -cp.altreDetrazioni],
      ['IMPORTO NETTO DA LIQUIDARE ALL’IMPRESA APPALTATRICE', cp.importoNettoLiquidare],
      [`I.V.A. di Legge Applicabile (${cp.aliquotaIva}%)`, cp.importoIva],
      ['TOTALE LORDO CERTIFICATO A PAGAMENTO', cp.totaleLordoLiquidare],
      [],
      ['Stato del Certificato:', cp.stato.toUpperCase()],
      ['Riferimento Fattura SDI:', cp.riferimentoFattura || 'In attesa di emissione'],
      ['Note di Liquidazione:', cp.noteLiquidazione || 'Pagamento conforme ai termini contrattuali.'],
    ];

    const ws3 = XLSX.utils.aoa_to_sheet(f3Data);
    ws3['!cols'] = [{ wch: 48 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Certificato di Pagamento');
  }

  // Scrittura file
  const filename = `${sal.codiceSal.replace(/\s+/g, '_')}_${sal.cantiereId}_Contabilita.xlsx`;
  XLSX.writeFile(wb, filename);
}
