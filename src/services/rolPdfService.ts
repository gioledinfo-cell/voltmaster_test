import { jsPDF } from 'jspdf';
import { ROL, Cliente, Cantiere } from '../types';

/**
 * Generate a certified, professional signed PDF report for a single ROL
 */
export function generateSingleRolPdf(
  rol: ROL,
  cliente?: Cliente,
  cantiere?: Cantiere
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let y = 14;

  // 1. Top Decorative Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Accent amber stripe
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 24, pageWidth, 2, 'F');

  // Brand Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VOLTMASTER', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('IMPIANTI ELETTRICI INDUSTRIALI & CIVILI · AUTOMAZIONE · CEI 64-8', margin, 19);

  // Document Badge (top right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(245, 158, 11);
  doc.text('RAPPORTO DI LAVORO (ROL)', pageWidth - margin, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(rol.numero, pageWidth - margin, 19, { align: 'right' });

  y = 33;

  // 2. Company Sub-header & Certifications
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    'VoltMaster ElettroImpianti S.r.l. · P.IVA 09248100159 · Sede Legale: Via dell\'Elettronica 12, 20138 Milano (MI)',
    margin,
    y
  );
  y += 4;
  doc.text(
    'Abilitazioni DM 37/08 lettere A, B, G · Qualifiche PES/PAV CEI 11-27 · PEC: voltmaster@pec.it · Tel. +39 02 884400',
    margin,
    y
  );

  y += 7;

  // 3. Metadata Boxes (Committente & Cantiere)
  const boxHeight = 32;
  const colWidth = (contentWidth - 6) / 2;

  // Box 1: Committente & Cantiere
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('DATI COMMITTENTE & CANTIERE', margin + 3, y + 5);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(doc.splitTextToSize(rol.clienteNome, colWidth - 6)[0] || rol.clienteNome, margin + 3, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Cantiere: ${rol.cantiereTitolo}`, margin + 3, y + 16, { maxWidth: colWidth - 6 });

  const indirizzoStr = cantiere ? `${cantiere.indirizzo}, ${cantiere.citta}` : (cliente?.indirizzo || 'Sede cantiere');
  doc.text(`Ubicazione: ${indirizzoStr}`, margin + 3, y + 21, { maxWidth: colWidth - 6 });
  
  if (cliente?.partitaIva) {
    doc.text(`P.IVA / C.F.: ${cliente.partitaIva}`, margin + 3, y + 26);
  }

  // Box 2: Intervento & Operatore
  const col2X = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, y, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DATI INTERVENTO & OPERATORE', col2X + 3, y + 5);

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Data Esecuzione: ${new Date(rol.data).toLocaleDateString('it-IT')}`, col2X + 3, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const collabCount = rol.collaboratori?.length || 0;
  if (collabCount > 0) {
    doc.text(`Tecnico Resp.: ${rol.operatoreNome}`, col2X + 3, y + 15);
    const collabNames = rol.collaboratori!.map((c) => c.nome).join(', ');
    doc.text(`Squadra: +${collabCount} collaudatori (${collabNames})`, col2X + 3, y + 19, { maxWidth: colWidth - 6 });
  } else {
    doc.text(`Tecnico Installatore: ${rol.operatoreNome}`, col2X + 3, y + 16);
  }
  
  if (rol.workType) {
    const workTypeLabel =
      rol.workType === 'manutenzione_riparazione'
        ? 'MANUTENZIONE & RIPARAZIONE DISPOSITIVI'
        : rol.workType === 'officina'
        ? 'OFFICINA / CABLAGGIO QUADRI'
        : 'ATTIVITÀ DI CANTIERE (POSA & INSTALLAZIONE)';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`Macro-Area: ${workTypeLabel}`, col2X + 3, y + 23, { maxWidth: colWidth - 6 });
  } else if (rol.lavorazioneTitolo) {
    doc.text(`Fase di Lavoro: ${rol.lavorazioneTitolo}`, col2X + 3, y + 23, { maxWidth: colWidth - 6 });
  } else if (rol.attivitaLibera) {
    doc.text(`Attività: ${rol.attivitaLibera}`, col2X + 3, y + 23, { maxWidth: colWidth - 6 });
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`Stato Documento: ${rol.stato.toUpperCase()} · FIRMATO`, col2X + 3, y + 28);

  y += boxHeight + 4;

  // 3b. Parametri Cantiere: Meteo, Turno e Avanzamento Lavori
  if (rol.meteo || rol.turnoOrario || rol.avanzamentoPercentuale !== undefined) {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.setDrawColor(30, 41, 59);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

    // Column 1: Meteo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text('METEO & CANTIERE', margin + 3, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    const meteoStr = `${rol.meteo?.condizione?.toUpperCase() || 'SERENO'}${rol.meteo?.temperaturaMin !== undefined ? ` (${rol.meteo.temperaturaMin}°C/${rol.meteo.temperaturaMax}°C)` : ''}`;
    doc.text(meteoStr, margin + 3, y + 8.5);

    // Column 2: Turno
    const c2X = margin + 65;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(56, 189, 248); // sky-400
    doc.text('TURNO & PAUSA', c2X, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    const turnoStr = `${rol.turnoOrario ? `${rol.turnoOrario.oraInizio || '07:30'}-${rol.turnoOrario.oraFine || '16:30'}` : '07:30-16:30'} (pausa ${rol.turnoOrario?.pausaMinuti ?? 60}m)`;
    doc.text(turnoStr, c2X, y + 8.5);

    // Column 3: Avanzamento
    const c3X = margin + 130;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text('AVANZAMENTO OPERATIVO', c3X, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    const avanzStr = `${rol.avanzamentoPercentuale ?? 50}% completato${rol.quantitaPosata ? ` · ${rol.quantitaPosata}` : ''}`;
    doc.text(avanzStr, c3X, y + 8.5, { maxWidth: contentWidth - 133 });

    y += 16;
  }

  // 4. Descrizione Lavori Eseguiti
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. DESCRIZIONE DETTAGLIATA LAVORAZIONI ESEGUITE A REGOLA D\'ARTE', margin + 3, y + 4.2);

  y += 7;
  let fullDescText = rol.descrizioneLavori || 'Intervento di installazione, verifica e collaudo conformità impianto elettrico.';
  if (rol.activityDescription) {
    fullDescText = `[Dispositivo / Oggetto Intervento: ${rol.activityDescription}]\n` + fullDescText;
  }
  if (rol.partsReplaced) {
    fullDescText += `\n[Ricambi / Componenti Sostituiti: ${rol.partsReplaced}]`;
  }
  if (rol.hasTravel && rol.travelDetails) {
    fullDescText += `\n[Trasferta / Viaggio: ${rol.hoursTravel}h | Tratta: ${rol.travelDetails.route} | Mezzo: ${rol.travelDetails.vehicleName || rol.travelDetails.vehiclePlate || 'Mezzo aziendale'}${rol.travelDetails.km ? ` (${rol.travelDetails.km} km)` : ''}]`;
  }

  const descLines = doc.splitTextToSize(
    fullDescText,
    contentWidth - 6
  );
  const descHeight = Math.max(16, descLines.length * 4.5 + 4);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, descHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(descLines, margin + 3, y + 5);

  y += descHeight + 6;

  // 5. Materiali e Componenti Installati
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. MATERIALI & COMPONENTI IMPIEGATI (SCARICO CANTIERE)', margin + 3, y + 4.2);

  y += 7;

  // Table header
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Descrizione Componente / Articolo', margin + 3, y + 3.5);
  doc.text('Quantità', margin + contentWidth - 35, y + 3.5);
  doc.text('U.M.', margin + contentWidth - 12, y + 3.5);

  y += 5;

  const matList = rol.materialiUtilizzati || [];
  if (matList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Nessun materiale specifico registrato (manodopera / verifica tecnica pura).', margin + 3, y + 4);
    y += 7;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    matList.slice(0, 6).forEach((mat) => {
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 4.5, margin + contentWidth, y + 4.5);
      doc.text(mat.nome, margin + 3, y + 3.5, { maxWidth: contentWidth - 45 });
      doc.text(String(mat.quantita), margin + contentWidth - 35, y + 3.5);
      doc.text(mat.unita, margin + contentWidth - 12, y + 3.5);
      y += 5;
    });
  }

  y += 4;

  // 6. Riepilogo Ore Lavorate
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. RIEPILOGO ORE LAVORATE CERTIFICATE', margin + 3, y + 4.2);

  y += 8;

  if (rol.hasTravel && (rol.hoursTravel || 0) > 0) {
    const cardW = (contentWidth - 9) / 4;

    // Card 1: Ore Ordinarie
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, cardW, 14, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('ORE ORDINARIE', margin + 2.5, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${rol.oreOrdinarie} h`, margin + 2.5, y + 11);

    // Card 2: Ore Straordinarie
    const card2X = margin + cardW + 3;
    doc.roundedRect(card2X, y, cardW, 14, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('STRAORDINARI', card2X + 2.5, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(`${rol.oreStraordinarie} h`, card2X + 2.5, y + 11);

    // Card 3: Ore Viaggio
    const card3X = card2X + cardW + 3;
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(card3X, y, cardW, 14, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text('ORE VIAGGIO', card3X + 2.5, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(67, 56, 202);
    doc.text(`${rol.hoursTravel} h`, card3X + 2.5, y + 11);

    // Card 4: Totale Ore
    const card4X = card3X + cardW + 3;
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.roundedRect(card4X, y, cardW, 14, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text('TOTALE COMPLESSIVO', card4X + 2.5, y + 4.5);
    doc.setFontSize(11);
    doc.setTextColor(120, 53, 15);
    doc.text(`${rol.oreTotali} h`, card4X + 2.5, y + 11);
  } else {
    const cardW = (contentWidth - 6) / 3;

    // Card 1: Ore Ordinarie
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, cardW, 14, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('ORE ORDINARIE', margin + 3, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${rol.oreOrdinarie} h`, margin + 3, y + 11);

    // Card 2: Ore Straordinarie
    const card2X = margin + cardW + 3;
    doc.roundedRect(card2X, y, cardW, 14, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('ORE STRAORDINARIE', card2X + 3, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(`${rol.oreStraordinarie} h`, card2X + 3, y + 11);

    // Card 3: Totale Ore
    const card3X = card2X + cardW + 3;
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.roundedRect(card3X, y, cardW, 14, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text('TOTALE ORE TECNICO', card3X + 3, y + 4.5);
    doc.setFontSize(12);
    doc.setTextColor(120, 53, 15);
    doc.text(`${rol.oreTotali} h`, card3X + 3, y + 11);
  }

  y += 18;

  // Collaboratori di Squadra Breakdown if present
  if (rol.collaboratori && rol.collaboratori.length > 0) {
    const totalSquadHours =
      rol.oreTotali +
      rol.collaboratori.reduce(
        (sum, c) => sum + (c.oreOrdinarie ?? rol.oreOrdinarie) + (c.oreStraordinarie ?? rol.oreStraordinarie),
        0
      );

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const squadBoxH = 10 + rol.collaboratori.length * 5;
    doc.roundedRect(margin, y, contentWidth, squadBoxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `SQUADRA DI LAVORO COINVOLTA (${1 + rol.collaboratori.length} TECNICI · TOTALE COMPLESSIVO: ${totalSquadHours} ORE-UOMO)`,
      margin + 3,
      y + 4.5
    );

    let squadY = y + 8.5;
    // Lead
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `• ${rol.operatoreNome} (Caposquadra / Resp.) — ${rol.oreOrdinarie}h ord. + ${rol.oreStraordinarie}h str. = ${rol.oreTotali}h`,
      margin + 5,
      squadY
    );

    // Collaborators
    rol.collaboratori.forEach((collab) => {
      squadY += 4.5;
      const cOrd = collab.oreOrdinarie ?? rol.oreOrdinarie;
      const cStr = collab.oreStraordinarie ?? rol.oreStraordinarie;
      const cTot = cOrd + cStr;
      const noteStr = collab.note ? ` — [${collab.note}]` : '';
      doc.text(
        `• ${collab.nome} (${collab.ruolo || 'Collaboratore'}) — ${cOrd}h ord. + ${cStr}h str. = ${cTot}h${noteStr}`,
        margin + 5,
        squadY
      );
    });

    y += squadBoxH + 4;
  } else {
    y += 2;
  }

  // 6b. Attrezzature, Imprevisti & Sicurezza
  if (rol.attrezzature && rol.attrezzature.length > 0) {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3b. MACCHINARI & ATTREZZATURE UTILIZZATE', margin + 3, y + 3.5);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    rol.attrezzature.forEach((attr) => {
      doc.text(
        `• ${attr.nome} (${attr.matricolaOTarga || 'Senza matricola'}) — Operatore: ${rol.operatoreNome} — Ore uso: ${attr.oreUtilizzo}h`,
        margin + 4,
        y
      );
      y += 4;
    });
    y += 2;
  }

  if (rol.imprevisti && rol.imprevisti.length > 0) {
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(254, 202, 202);
    const impH = 7 + rol.imprevisti.length * 4;
    doc.roundedRect(margin, y, contentWidth, impH, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(153, 27, 27); // red-800
    doc.text('ANOMALIE & FERMI CANTIERE REGISTRATI:', margin + 3, y + 4);

    let impY = y + 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    rol.imprevisti.forEach((imp) => {
      doc.text(`• [${imp.causa.toUpperCase()}] ${imp.descrizione} (${imp.oreFermo}h fermo)`, margin + 5, impY, {
        maxWidth: contentWidth - 10,
      });
      impY += 4;
    });
    y += impH + 3;
  }

  if (rol.noteSicurezza) {
    doc.setFillColor(254, 252, 232); // yellow-50
    doc.setDrawColor(254, 240, 138);
    const secLines = doc.splitTextToSize(`Sicurezza & DPI: ${rol.noteSicurezza}`, contentWidth - 6);
    const secH = Math.max(8, secLines.length * 3.5 + 4);
    doc.roundedRect(margin, y, contentWidth, secH, 1, 1, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(113, 63, 18);
    doc.text(secLines, margin + 3, y + 4);
    y += secH + 3;
  }

  // 7. Sezione Firme Grafometriche (Tecnico & Committente)
  const sigBoxW = (contentWidth - 6) / 2;
  const sigBoxH = 36;

  // Signature Box 1: Tecnico Installatore
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, sigBoxW, sigBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('FIRMA TECNICO INSTALLATORE (VOLTMASTER)', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(rol.operatoreNome, margin + 3, y + 10);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('[Sottoscritto digitalmente tramite app VoltMaster]', margin + 3, y + 20);
  doc.text('Id Certificato: PES-PAV-CEI-11-27', margin + 3, y + 25);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 3, y + 29, margin + sigBoxW - 3, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Trasmesso: ${rol.data}`, margin + 3, y + 33);

  // Signature Box 2: Committente / Cliente con Immagine Firma
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(col2X, y, sigBoxW, sigBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('FIRMA COMMITTENTE PER PRESA VISIONE', col2X + 3, y + 5);

  const signName = rol.firmaClienteNome || rol.clienteNome;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(signName, col2X + 3, y + 10);

  // Embed graphical signature image if available
  if (rol.firmaClienteDataUrl && rol.firmaClienteDataUrl.startsWith('data:image')) {
    try {
      doc.addImage(rol.firmaClienteDataUrl, 'PNG', col2X + 4, y + 11, sigBoxW - 12, 17);
    } catch (e) {
      console.warn('Could not render signature image in PDF:', e);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129);
      doc.text('✓ Firma Grafometrica Acquisita su Schermo Touch', col2X + 3, y + 21);
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      rol.firmaClientePresente ? '✓ Firma Acquisita su Dispositivo Mobile' : 'In attesa di firma finale',
      col2X + 3,
      y + 21
    );
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(col2X + 3, y + 29, col2X + sigBoxW - 3, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129);
  doc.text(
    rol.firmaClienteTimestamp
      ? `Data/Ora Firma: ${rol.firmaClienteTimestamp}`
      : 'Presa visione accettata e valida ai fini contrattuali',
    col2X + 3,
    y + 33
  );

  y += sigBoxH + 6;

  // 8. Legal Disclaimer & Digital Seal Box
  const hasSeal = !!rol.sigilloDigitale?.sha256Hash;
  const sealBoxHeight = hasSeal ? 22 : 14;

  if (hasSeal) {
    // Certified Digital Seal Box (Emerald/Slate Enterprise Theme)
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(52, 211, 153); // emerald-400
    doc.roundedRect(margin, y, contentWidth, sealBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70); // emerald-800
    doc.text(
      `🔒 SIGILLO DIGITALE DI CANTIERE APPOSTO · CODICE VERIFICA: ${rol.sigilloDigitale!.codiceVerificaUnivoco}`,
      margin + 3,
      y + 4.5
    );

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(
      `SHA-256: ${rol.sigilloDigitale!.sha256Hash}`,
      margin + 3,
      y + 8.5
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 118, 110); // teal-700
    doc.text(
      `Timestamp Certo: ${rol.sigilloDigitale!.improntaTimestamp} · Firmatario: ${rol.sigilloDigitale!.firmatarioNome} (${rol.sigilloDigitale!.firmatarioRuolo})`,
      margin + 3,
      y + 12.5
    );

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Documento informatico con efficacia probatoria ex art. 2702 c.c. e art. 20 c. 1-bis D.Lgs. 82/2005 (CAD). Modifiche postume inficiano l\'impronta.',
      margin + 3,
      y + 17.5
    );
  } else {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, sealBoxHeight, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Dichiarazione di conformità: Le lavorazioni sono state eseguite secondo la regola dell\'arte ai sensi del D.M. 37/2008 e norme CEI vigenti.',
      margin + 3,
      y + 4.5
    );
    doc.text(
      'Documento informatico originale memorizzato nei sistemi VoltMaster ElettroImpianti S.r.l. - Generato elettronicamente.',
      margin + 3,
      y + 8.5
    );
    doc.text(
      `Codice di Verifica Documento: VM-ROL-${rol.numero}-${Date.now().toString(36).toUpperCase()}`,
      margin + 3,
      y + 12
    );
  }

  return doc;
}

/**
 * Generate a multi-ROL summary PDF report (for monthly/periodical client summary)
 */
export function generateSummaryRolPdf(
  rols: ROL[],
  clienteNome: string,
  periodoTitle: string = 'Riepilogo Lavorazioni e Interventi'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 24, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VOLTMASTER', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('REPORT RIEPILOGATIVO COMMITTENTE · RAPPORTI DI LAVORO (ROL)', margin, 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 182, 212);
  doc.text(periodoTitle.toUpperCase(), pageWidth - margin, 16, { align: 'right' });

  y = 33;

  // Client Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Committente: ${clienteNome}`, margin + 4, y + 6);

  const totalOre = rols.reduce((acc, r) => acc + r.oreTotali, 0);
  const signedCount = rols.filter((r) => r.firmaClientePresente || r.firmaClienteDataUrl).length;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Numero Rapportini Inclusi: ${rols.length} · Di cui Firmati dal Committente: ${signedCount} · Totale Ore Consuntivate: ${totalOre} h`,
    margin + 4,
    y + 12
  );
  doc.text(
    `Generato il: ${new Date().toLocaleDateString('it-IT')} alle ore ${new Date().toLocaleTimeString('it-IT')}`,
    margin + 4,
    y + 16
  );

  y += 26;

  // Table of ROLs
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Numero ROL', margin + 2, y + 4.2);
  doc.text('Data', margin + 26, y + 4.2);
  doc.text('Cantiere / Oggetto', margin + 50, y + 4.2);
  doc.text('Tecnico', margin + 115, y + 4.2);
  doc.text('Ore', margin + 150, y + 4.2);
  doc.text('Firma', margin + 165, y + 4.2);

  y += 7;

  rols.forEach((r) => {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 4.5, margin + contentWidth, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(r.numero, margin + 2, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.text(r.data, margin + 26, y + 3.5);
    doc.text(doc.splitTextToSize(r.cantiereTitolo, 60)[0] || r.cantiereTitolo, margin + 50, y + 3.5);
    doc.text(r.operatoreNome, margin + 115, y + 3.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${r.oreTotali}h`, margin + 150, y + 3.5);

    if (r.firmaClientePresente || r.firmaClienteDataUrl) {
      doc.setTextColor(16, 185, 129);
      doc.text('✓ Firmato', margin + 165, y + 3.5);
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('In attesa', margin + 165, y + 3.5);
    }

    y += 5.5;
  });

  y += 8;

  // Footer notes
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'I dettagli completi e i singoli certificati grafometrici firmati sono allegati o consultabili nell\'Area Clienti VoltMaster.',
    margin,
    y
  );

  return doc;
}

/**
 * Trigger browser download of ROL PDF
 */
export function downloadRolPdf(rol: ROL, cliente?: Cliente, cantiere?: Cantiere): void {
  const doc = generateSingleRolPdf(rol, cliente, cantiere);
  const cleanNum = rol.numero.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanNum}_Rapporto_Firmato.pdf`);
}

/**
 * Get PDF as Blob for email attachment or preview
 */
export function getRolPdfBlob(rol: ROL, cliente?: Cliente, cantiere?: Cantiere): Blob {
  const doc = generateSingleRolPdf(rol, cliente, cantiere);
  return doc.output('blob');
}

/**
 * Print ROL PDF directly in browser via clean iframe
 */
export function printRolPdfDirectly(rol: ROL, cliente?: Cliente, cantiere?: Cantiere): void {
  const doc = generateSingleRolPdf(rol, cliente, cantiere);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Direct iframe print failed, falling back to window.open:', err);
        window.open(blobUrl, '_blank');
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    }, 250);
  };
}

/**
 * Share ROL PDF via Web Share API or download fallback
 */
export async function shareRolPdf(
  rol: ROL,
  cliente?: Cliente,
  cantiere?: Cantiere
): Promise<boolean> {
  const blob = getRolPdfBlob(rol, cliente, cantiere);
  const cleanNum = rol.numero.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanNum}_Rapporto_Firmato.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Rapporto di Lavoro ${rol.numero} - VoltMaster`,
        text: `Rapporto di lavoro ${rol.numero} relativo all'intervento su: ${rol.cantiereTitolo} (${rol.clienteNome})`,
      });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        downloadRolPdf(rol, cliente, cantiere);
      }
      return false;
    }
  } else {
    downloadRolPdf(rol, cliente, cantiere);
    return false;
  }
}

