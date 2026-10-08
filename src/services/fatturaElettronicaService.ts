import {
  FatturaElettronicaDocument,
  RigaDettaglioFattura,
  DatiRiepilogoIva,
  TipoDocumentoFattura,
  ModalitaPagamento,
  NaturaEsenzioneIVA,
  EsigibilitaIVA,
} from '../types/fatturaElettronica';
import { ROL, DocumentoDiTrasporto, Cantiere, Cliente } from '../types';

/**
 * Dati anagrafici predefiniti di VoltMaster Cedente/Prestatore
 */
export const VOLTMASTER_CEDENTE = {
  partitaIva: '09248100159',
  codiceFiscale: '09248100159',
  denominazione: 'VoltMaster ElettroImpianti S.r.l.',
  regimeFiscale: 'RF01' as const,
  indirizzo: "Via dell'Elettronica 12",
  cap: '20138',
  comune: 'Milano',
  provincia: 'MI',
  nazione: 'IT',
  numeroRea: 'MI-2098412',
  capitaleSociale: 100000.0,
  ibanPredefinito: 'IT60X0542811101000000123456',
};

/**
 * Escape speciale per XML SDI
 */
function escapeXml(unsafe: string = ''): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formatta un numero per XML con 2 decimali (es. 1250.00)
 */
function formatXmlAmount(num: number): string {
  return (Math.round(num * 100) / 100).toFixed(2);
}

/**
 * Genera il tracciato XML conforme a FatturaPA v1.8 (FPR12 per B2B)
 */
export function buildFatturaElettronicaXml(fattura: FatturaElettronicaDocument): string {
  const cedente = fattura.cedente;
  const cessionario = fattura.cessionario;

  const linesXml = fattura.linee
    .map((riga) => {
      const naturaXml = riga.natura ? `\n        <Natura>${riga.natura}</Natura>` : '';
      return `      <DettaglioLinee>
        <NumeroLinea>${riga.numeroLinea}</NumeroLinea>
        <Descrizione>${escapeXml(riga.descrizione.substring(0, 1000))}</Descrizione>
        <Quantita>${formatXmlAmount(riga.quantita)}</Quantita>
        <UnitaMisura>${escapeXml(riga.unitaMisura || 'ORE')}</UnitaMisura>
        <PrezzoUnitario>${formatXmlAmount(riga.prezzoUnitario)}</PrezzoUnitario>
        <PrezzoTotale>${formatXmlAmount(riga.prezzoTotale)}</PrezzoTotale>
        <AliquotaIVA>${formatXmlAmount(riga.aliquotaIva)}</AliquotaIVA>${naturaXml}
      </DettaglioLinee>`;
    })
    .join('\n');

  const riepilogoXml = fattura.riepilogoIva
    .map((rie) => {
      const naturaXml = rie.natura ? `\n        <Natura>${rie.natura}</Natura>` : '';
      const rifNormativoXml = rie.riferimentoNormativo
        ? `\n        <RiferimentoNormativo>${escapeXml(rie.riferimentoNormativo)}</RiferimentoNormativo>`
        : '';
      return `      <DatiRiepilogo>
        <AliquotaIVA>${formatXmlAmount(rie.aliquotaIva)}</AliquotaIVA>${naturaXml}
        <ImponibileImporto>${formatXmlAmount(rie.imponibile)}</ImponibileImporto>
        <Imposta>${formatXmlAmount(rie.imposta)}</Imposta>
        <EsigibilitaIVA>${rie.esigibilitaIva}</EsigibilitaIVA>${rifNormativoXml}
      </DatiRiepilogo>`;
    })
    .join('\n');

  // Dati DDT se presenti
  const ddtXml = fattura.ddtCollegati
    .map((ddt) => {
      return `      <DatiDDT>
        <NumeroDDT>${escapeXml(ddt.numero)}</NumeroDDT>
        <DataDDT>${ddt.data}</DataDDT>
      </DatiDDT>`;
    })
    .join('\n');

  // Dati Ordine d'Acquisto / Commessa se presenti
  const cigXml = fattura.codiceCIG ? `\n        <CodiceCIG>${escapeXml(fattura.codiceCIG)}</CodiceCIG>` : '';
  const cupXml = fattura.codiceCUP ? `\n        <CodiceCUP>${escapeXml(fattura.codiceCUP)}</CodiceCUP>` : '';
  const ordineXml = fattura.numeroOrdineAcquisto || fattura.cantiereTitolo
    ? `      <DatiOrdineAcquisto>
        <IdDocumento>${escapeXml(fattura.numeroOrdineAcquisto || fattura.cantiereTitolo)}</IdDocumento>${cigXml}${cupXml}
      </DatiOrdineAcquisto>`
    : '';

  const codiceDestinatario = cessionario.codiceDestinatario || '0000000';
  const pecDestinatarioXml = cessionario.pecDestinatario
    ? `\n      <PECDestinatario>${escapeXml(cessionario.pecDestinatario)}</PECDestinatario>`
    : '';

  const idFiscaleCessionarioXml = cessionario.partitaIva
    ? `\n        <IdFiscaleIVA>
          <IdPaese>${cessionario.nazione || 'IT'}</IdPaese>
          <IdCodice>${escapeXml(cessionario.partitaIva)}</IdCodice>
        </IdFiscaleIVA>`
    : '';

  const codFiscaleCessionarioXml = cessionario.codiceFiscale
    ? `\n        <CodiceFiscale>${escapeXml(cessionario.codiceFiscale)}</CodiceFiscale>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_fattura_PA_versione_1.2.xsd">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>${cedente.partitaIva}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${escapeXml(fattura.progressivoInvio)}</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>${escapeXml(codiceDestinatario)}</CodiceDestinatario>${pecDestinatarioXml}
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>${cedente.partitaIva}</IdCodice>
        </IdFiscaleIVA>
        <CodiceFiscale>${cedente.codiceFiscale}</CodiceFiscale>
        <Anagrafica>
          <Denominazione>${escapeXml(cedente.denominazione)}</Denominazione>
        </Anagrafica>
        <RegimeFiscale>${cedente.regimeFiscale}</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escapeXml(cedente.indirizzo)}</Indirizzo>
        <CAP>${cedente.cap}</CAP>
        <Comune>${escapeXml(cedente.comune)}</Comune>
        <Provincia>${cedente.provincia}</Provincia>
        <Nazione>${cedente.nazione}</Nazione>
      </Sede>
      <IscrizioneREA>
        <Ufficio>${cedente.provincia}</Ufficio>
        <NumeroREA>${cedente.numeroRea || '2098412'}</NumeroREA>
        <CapitaleSociale>${formatXmlAmount(cedente.capitaleSociale || 100000)}</CapitaleSociale>
        <SocioUnico>SM</SocioUnico>
        <StatoLiquidazione>LN</StatoLiquidazione>
      </IscrizioneREA>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>${idFiscaleCessionarioXml}${codFiscaleCessionarioXml}
        <Anagrafica>
          <Denominazione>${escapeXml(cessionario.denominazione)}</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escapeXml(cessionario.indirizzo || 'Via Roma 1')}</Indirizzo>
        <CAP>${cessionario.cap || '20100'}</CAP>
        <Comune>${escapeXml(cessionario.comune || 'Milano')}</Comune>
        <Provincia>${cessionario.provincia || 'MI'}</Provincia>
        <Nazione>${cessionario.nazione || 'IT'}</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>${fattura.tipoDocumento}</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>${fattura.dataFattura}</Data>
        <Numero>${escapeXml(fattura.numeroFattura)}</Numero>
        <ImportoTotaleDocumento>${formatXmlAmount(fattura.totaleDocumento)}</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>${ordineXml ? '\n' + ordineXml : ''}${ddtXml ? '\n' + ddtXml : ''}
    </DatiGenerali>
    <DatiBeniServizi>
${linesXml}
${riepilogoXml}
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>${fattura.modalitaPagamento}</ModalitaPagamento>
        <DataScadenzaPagamento>${fattura.scadenzaPagamento}</DataScadenzaPagamento>
        <ImportoPagamento>${formatXmlAmount(fattura.totaleDocumento)}</ImportoPagamento>
        <IBAN>${escapeXml(fattura.ibanAccredito)}</IBAN>
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
}

/**
 * Crea una fattura elettronica a partire da ROL e DDT selezionati
 */
export function createFatturaFromRolsAndDdts(params: {
  cantiere: Cantiere;
  cliente: Cliente | null;
  selectedRols: ROL[];
  selectedDdts: DocumentoDiTrasporto[];
  aliquotaIvaPredefinita: number; // 22, 10, 0
  regimeReverseCharge?: boolean;
  naturaReverseCharge?: NaturaEsenzioneIVA;
  numeroFattura: string;
  dataFattura?: string;
  scadenzaPagamento?: string;
  codiceSdi?: string;
  pec?: string;
  tariffaOrariaStandard?: number;
}): FatturaElettronicaDocument {
  const {
    cantiere,
    cliente,
    selectedRols,
    selectedDdts,
    aliquotaIvaPredefinita,
    regimeReverseCharge,
    naturaReverseCharge = 'N6.3',
    numeroFattura,
    dataFattura = new Date().toISOString().split('T')[0],
    scadenzaPagamento = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    codiceSdi = cliente?.codiceUnivocoSdi || '0000000',
    pec = cliente?.pec || '',
    tariffaOrariaStandard = 45.0,
  } = params;

  const linee: RigaDettaglioFattura[] = [];
  let lineaIdx = 1;

  const effectiveIva = regimeReverseCharge ? 0 : aliquotaIvaPredefinita;
  const effectiveNatura = regimeReverseCharge ? naturaReverseCharge : undefined;

  // 1. Linee generate dai Rapportini ROL (Manodopera & Attività)
  selectedRols.forEach((rol) => {
    const totOre = rol.oreTotali || (rol.oreOrdinarie + rol.oreStraordinarie);
    const prezzoUni = tariffaOrariaStandard;
    const prezzoTot = totOre * prezzoUni;

    const descLavori = rol.activityDescription || rol.descrizioneLavori || 'Installazione e cablaggio impianti elettrici';
    const sigilloStr = rol.sigilloDigitale ? ` [Sigillo SHA-256: ${rol.sigilloDigitale.codiceVerificaUnivoco}]` : '';

    linee.push({
      numeroLinea: lineaIdx++,
      descrizione: `Manodopera cantiere "${cantiere.titolo}" - ROL ${rol.numero} del ${rol.data}: ${descLavori}${sigilloStr}`,
      quantita: totOre,
      unitaMisura: 'ORE',
      prezzoUnitario: prezzoUni,
      prezzoTotale: prezzoTot,
      aliquotaIva: effectiveIva,
      natura: effectiveNatura,
      riferimentoRolId: rol.id,
    });

    // Materiali addebitati nel ROL se presenti
    if (rol.materialiUtilizzati && rol.materialiUtilizzati.length > 0) {
      rol.materialiUtilizzati.forEach((mat) => {
        const matPrezzoTot = mat.quantita * (mat.prezzoUnitario || 12.5);
        linee.push({
          numeroLinea: lineaIdx++,
          descrizione: `Ricambi/Materiali da ROL ${rol.numero}: ${mat.nome} (${mat.codiceArticolo || 'STD'})`,
          quantita: mat.quantita,
          unitaMisura: mat.unita || 'PZ',
          prezzoUnitario: mat.prezzoUnitario || 12.5,
          prezzoTotale: matPrezzoTot,
          aliquotaIva: effectiveIva,
          natura: effectiveNatura,
          riferimentoRolId: rol.id,
        });
      });
    }
  });

  // 2. Linee generate dai DDT (Fornitura materiali da magazzino a cantiere)
  selectedDdts.forEach((ddt) => {
    const ddtRighe = ddt.righe || ddt.articoli || [];
    const ddtNumero = ddt.numeroDdt || ddt.numero || ddt.id;
    const ddtData = ddt.dataEmissione || ddt.data || '';
    const articoliDesc = ddtRighe.map((a) => `${a.quantita} ${a.unitaMisura || 'pz'} ${a.descrizione}`).join('; ');
    const totDdt = ddtRighe.reduce((sum: number, a: { quantita: number; valoreTotale?: number; valoreUnitario?: number }) => sum + (a.valoreTotale || (a.quantita * (a.valoreUnitario || 8.0))), 0);

    linee.push({
      numeroLinea: lineaIdx++,
      descrizione: `Fornitura materiali da DDT ${ddtNumero} del ${ddtData}: ${articoliDesc}`,
      quantita: 1,
      unitaMisura: 'CORPO',
      prezzoUnitario: totDdt > 0 ? totDdt : 150.0,
      prezzoTotale: totDdt > 0 ? totDdt : 150.0,
      aliquotaIva: effectiveIva,
      natura: effectiveNatura,
      riferimentoDdtId: ddt.id,
      riferimentoDdtNumero: ddtNumero,
    });
  });

  // Se non ci sono righe, aggiungi una riga generica di prestazione
  if (linee.length === 0) {
    linee.push({
      numeroLinea: 1,
      descrizione: `Prestazioni specialistiche impiantistiche cantiere "${cantiere.titolo}"`,
      quantita: 1,
      unitaMisura: 'CORPO',
      prezzoUnitario: 1200.0,
      prezzoTotale: 1200.0,
      aliquotaIva: effectiveIva,
      natura: effectiveNatura,
    });
  }

  // Calcolo Totali
  const totaleImponibile = linee.reduce((sum, l) => sum + l.prezzoTotale, 0);
  const totaleImposta = regimeReverseCharge ? 0 : (totaleImponibile * effectiveIva) / 100;
  const totaleDocumento = totaleImponibile + totaleImposta;

  const riepilogoIva: DatiRiepilogoIva[] = [
    {
      aliquotaIva: effectiveIva,
      imponibile: totaleImponibile,
      imposta: totaleImposta,
      esigibilitaIva: 'I',
      natura: effectiveNatura,
      riferimentoNormativo: regimeReverseCharge
        ? 'Operazione in Reverse Charge ai sensi dell\'art. 17 comma 6 lett. a-ter del D.P.R. 633/1972'
        : undefined,
    },
  ];

  const clienteRagione = cliente?.ragioneSociale || cantiere.clienteNome || 'Cliente Committente S.r.l.';
  const clientePIVA = cliente?.partitaIva || '01234567890';
  const clienteCF = cliente?.codiceFiscale || clientePIVA;

  const progressivo = Date.now().toString(36).toUpperCase().substring(0, 5);

  const doc: FatturaElettronicaDocument = {
    id: `FAT-${Date.now().toString(36)}`,
    progressivoInvio: progressivo,
    tipoDocumento: selectedRols.length > 0 || selectedDdts.length > 0 ? 'TD24' : 'TD01',
    numeroFattura,
    dataFattura,
    cantiereId: cantiere.id,
    cantiereTitolo: cantiere.titolo,
    clienteId: cliente?.id || 'CLI-01',
    clienteNome: clienteRagione,
    cedente: VOLTMASTER_CEDENTE,
    cessionario: {
      partitaIva: clientePIVA,
      codiceFiscale: clienteCF,
      denominazione: clienteRagione,
      regimeFiscale: 'RF01',
      indirizzo: cliente?.indirizzo || cantiere.indirizzo || 'Via Milano 1',
      cap: cliente?.cap || '20100',
      comune: cliente?.citta || 'Milano',
      provincia: cliente?.provincia || 'MI',
      nazione: 'IT',
      codiceDestinatario: codiceSdi,
      pecDestinatario: pec || undefined,
    },
    codiceCIG: cantiere.codice || undefined,
    ddtCollegati: selectedDdts.map((d) => ({
      id: d.id,
      numero: d.numeroDdt || d.numero || d.id,
      data: d.dataEmissione || d.data || '',
    })),
    rolCollegati: selectedRols.map((r) => ({
      id: r.id,
      numero: r.numero,
      data: r.data,
      ore: r.oreTotali,
    })),
    linee,
    riepilogoIva,
    totaleImponibile,
    totaleImposta,
    totaleDocumento,
    modalitaPagamento: 'MP05',
    scadenzaPagamento,
    ibanAccredito: VOLTMASTER_CEDENTE.ibanPredefinito,
    statoSdi: 'bozza',
  };

  doc.xmlGenerato = buildFatturaElettronicaXml(doc);
  return doc;
}

/**
 * Trigger di download del file XML standard sul browser del client
 */
export function downloadFatturaXmlFile(fattura: FatturaElettronicaDocument): void {
  const xmlContent = fattura.xmlGenerato || buildFatturaElettronicaXml(fattura);
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  // Nome file a standard SDI: IT<PartitaIva>_<ProgressivoInvio>.xml
  const cleanProgressivo = fattura.progressivoInvio.replace(/[^A-Za-z0-9]/g, '').substring(0, 5).padStart(5, '0');
  const filename = `IT${fattura.cedente.partitaIva}_${cleanProgressivo}.xml`;
  
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
