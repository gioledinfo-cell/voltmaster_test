import { DocumentoDiTrasporto } from '../types/ddt';

export const exportDdtsToCsv = (ddts: DocumentoDiTrasporto[], filename = 'VoltMaster_Registro_DDT.csv') => {
  const headers = [
    'Numero DDT',
    'Data Emissione',
    'Stato',
    'Cantiere Destinazione',
    'Citta Cantiere',
    'Cliente',
    'Partita IVA / CF',
    'Causale Trasporto',
    'Aspetto Beni',
    'Colli',
    'Peso Kg',
    'Vettore / Targa',
    'Autista',
    'Ricevente Cantiere',
    'Data Ricezione',
    'N. Articoli',
  ];

  const rows = ddts.map((d) => [
    `"${d.numeroDdt}"`,
    `"${d.dataEmissione}"`,
    `"${d.stato}"`,
    `"${d.cantiereNome.replace(/"/g, '""')}"`,
    `"${d.cantiereCitta}"`,
    `"${d.clienteNome.replace(/"/g, '""')}"`,
    `"${d.clientePivaCodFisc}"`,
    `"${d.causaleTrasporto}"`,
    `"${d.aspettoBeni}"`,
    d.numeroColli,
    d.pesoTotaleKg,
    `"${d.veicoloTarga || 'N/D'}"`,
    `"${(d.autistaNome || '').replace(/"/g, '""')}"`,
    `"${(d.nomeRiceventeCantiere || '').replace(/"/g, '""')}"`,
    `"${d.dataOraRicezione || ''}"`,
    d.righe.length,
  ]);

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportDdtSingoloToCsv = (ddt: DocumentoDiTrasporto) => {
  const headers = [
    'Riga',
    'SKU Codice',
    'Descrizione Materiale',
    'U.M.',
    'Quantita',
    'Lotto / Matricola',
    'Note',
  ];

  const rows = ddt.righe.map((r, idx) => [
    idx + 1,
    `"${r.sku}"`,
    `"${r.descrizione.replace(/"/g, '""')}"`,
    `"${r.unitaMisura}"`,
    r.quantita,
    `"${(r.lottoMatricola || '').replace(/"/g, '""')}"`,
    `"${(r.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [
    `# DOCUMENTO DI TRASPORTO (D.P.R. 472/96)`,
    `# Numero: ${ddt.numeroDdt} - Data: ${ddt.dataEmissione}`,
    `# Cantiere: ${ddt.cantiereNome} (${ddt.cantiereCitta})`,
    `# Cliente: ${ddt.clienteNome}`,
    `# Vettore: ${ddt.veicoloTarga || 'Mezzo proprio'} - Conducente: ${ddt.autistaNome || 'N/D'}`,
    headers.join(';'),
    ...rows.map((r) => r.join(';')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${ddt.numeroDdt.replace('/', '_')}_Dettaglio.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
