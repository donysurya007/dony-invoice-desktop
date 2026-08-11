import { invoke } from '@tauri-apps/api/core';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import { getDefaultDocumentNote, getDocumentConfig, getDocumentItemUnitLabel, getDocumentText, getPaymentMethodLabel } from '$lib/document-config';
import type { CompanySettings, DocumentDraft } from '$lib/types';
import { calculateSubtotal, calculateTotal, cleanPdfFileName, formatDocumentDate } from '$lib/utils/format';
import { terbilangRupiah } from '$lib/utils/number-to-words';
import { documentAccentColor, hexToUnitRgb } from '$lib/utils/color';
import { documentLayout, getPageTableEndTop, paginateDocument, type DocumentPrintPage, type PaginatedDocumentItem } from '$lib/utils/document-pagination';

const navy = rgb(0.02, 0.21, 0.29);
const gray = rgb(0.38, 0.43, 0.48);
const lightGray = rgb(0.88, 0.88, 0.88);
const black = rgb(0.05, 0.08, 0.11);
const white = rgb(1, 1, 1);

const pageWidth = 595.28;
const pageHeight = 841.89;
const scale = pageWidth / documentLayout.pageWidth;

function px(value: number): number {
  return value * scale;
}

function yTop(top: number, height = 0): number {
  return pageHeight - px(top + height);
}

function drawText(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color = black): void {
  page.drawText(text || '-', { x, y, size, font, color });
}

function drawCenteredText(page: PDFPage, text: string, centerX: number, y: number, size: number, font: PDFFont, color = black): void {
  const width = font.widthOfTextAtSize(text || '-', size);
  drawText(page, text, centerX - width / 2, y, size, font, color);
}

function drawRightText(page: PDFPage, text: string, rightX: number, y: number, size: number, font: PDFFont, color = black): void {
  const width = font.widthOfTextAtSize(text || '-', size);
  drawText(page, text, rightX - width, y, size, font, color);
}

function drawRightFittedText(page: PDFPage, text: string, rightX: number, y: number, size: number, minSize: number, font: PDFFont, color: ReturnType<typeof rgb>, maxWidth: number): void {
  let fittedSize = size;

  while (fittedSize > minSize && font.widthOfTextAtSize(text || '-', fittedSize) > maxWidth) {
    fittedSize -= 0.5;
  }

  drawRightText(page, text, rightX, y, fittedSize, font, color);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const source = (text || '-').replace(/\s+/g, ' ').trim();
  const words = source ? source.split(' ') : ['-'];
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(next, size);

    if (width <= maxWidth) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
      continue;
    }

    let rest = word;

    while (font.widthOfTextAtSize(rest, size) > maxWidth && rest.length > 1) {
      let cut = rest.length - 1;

      while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) {
        cut -= 1;
      }

      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }

    current = rest;
  }

  if (current) lines.push(current);

  return lines.length > 0 ? lines : ['-'];
}

function drawWrapped(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, maxWidth: number, lineHeight: number, color = black): number {
  let currentY = y;

  for (const line of wrapText(text, font, size, maxWidth)) {
    drawText(page, line, x, currentY, size, font, color);
    currentY -= lineHeight;
  }

  return currentY;
}

function drawWrappedLines(page: PDFPage, lines: string[], x: number, y: number, size: number, font: PDFFont, maxWidth: number, lineHeight: number, color = black): number {
  let currentY = y;

  for (const line of lines.length > 0 ? lines : ['-']) {
    for (const wrappedLine of wrapText(line, font, size, maxWidth)) {
      drawText(page, wrappedLine, x, currentY, size, font, color);
      currentY -= lineHeight;
    }
  }

  return currentY;
}

function drawBox(page: PDFPage, x: number, y: number, width: number, height: number): void {
  page.drawRectangle({ x, y, width, height, borderColor: lightGray, borderWidth: 1, color: white });
}

function drawTableCell(page: PDFPage, x: number, y: number, width: number, height: number, color = white): void {
  page.drawRectangle({ x, y, width, height, borderColor: lightGray, borderWidth: 1, color });
}

function safeFileName(documentNumber: string): string {
  return `${cleanPdfFileName(documentNumber || 'dokumen')}.pdf`;
}

function formatRupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
}

function dataUrlToBytes(value: string): Uint8Array {
  const base64 = value.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function embedImage(pdf: PDFDocument, value: string): Promise<PDFImage | null> {
  if (!value.startsWith('data:image/')) return null;

  const bytes = dataUrlToBytes(value);

  if (value.startsWith('data:image/png')) return pdf.embedPng(bytes);
  if (value.startsWith('data:image/jpeg') || value.startsWith('data:image/jpg')) return pdf.embedJpg(bytes);

  return null;
}

function pdfColor(value: string): ReturnType<typeof rgb> {
  const [red, green, blue] = hexToUnitRgb(value);

  return rgb(red, green, blue);
}

function pdfSoftColor(value: string): ReturnType<typeof rgb> {
  const [red, green, blue] = hexToUnitRgb(value);
  const amount = 0.9;

  return rgb(red + (1 - red) * amount, green + (1 - green) * amount, blue + (1 - blue) * amount);
}

type Fonts = {
  regular: PDFFont;
  bold: PDFFont;
};

type PdfContext = {
  pdf: PDFDocument;
  fonts: Fonts;
  document: DocumentDraft;
  company: CompanySettings;
  accent: ReturnType<typeof rgb>;
  accentSoft: ReturnType<typeof rgb>;
  logoImage: PDFImage | null;
  signatureImage: PDFImage | null;
  pages: PDFPage[];
  noteText: string;
};

function drawMetaTable(page: PDFPage, rows: string[][], fonts: Fonts): void {
  const x = px(488);
  const y = yTop(184, 38);
  const labelWidth = px(153);
  const valueWidth = px(153);
  const rowHeight = px(38);

  rows.forEach((row, index) => {
    const rowY = y - index * rowHeight;
    drawTableCell(page, x, rowY, labelWidth, rowHeight);
    drawTableCell(page, x + labelWidth, rowY, valueWidth, rowHeight);
    drawText(page, row[0], x + px(20), rowY + px(14), 7, fonts.regular, gray);
    drawRightFittedText(page, row[1], x + labelWidth + valueWidth - px(14), rowY + px(14), 8, 6, fonts.bold, black, valueWidth - px(28));
  });
}

function drawDocumentHeader(page: PDFPage, context: PdfContext, pageIndex: number): void {
  const config = getDocumentConfig(context.document.documentType, context.document.language);
  const left = px(documentLayout.left);
  const right = pageWidth - px(documentLayout.right);
  const isContinuation = pageIndex > 0;

  page.drawRectangle({ x: 0, y: yTop(0, 31), width: pageWidth, height: px(31), color: context.accent });

  if (context.logoImage) {
    const logoSize = context.logoImage.scaleToFit(px(isContinuation ? 150 : 190), px(isContinuation ? 52 : 64));
    page.drawImage(context.logoImage, { x: left, y: yTop(isContinuation ? 62 : 74, logoSize.height / scale), width: logoSize.width, height: logoSize.height });
  } else {
    drawText(page, context.company.name, left, yTop(isContinuation ? 70 : 83), isContinuation ? 16 : 21, context.fonts.bold, context.accent);
  }

  const companySubtitle = context.document.language === 'en' ? context.company.subtitleEn || context.company.subtitle : context.company.subtitle;
  const companyDescription = context.document.language === 'en' ? context.company.businessDescriptionEn || context.company.businessDescription : context.company.businessDescription;
  drawText(page, companySubtitle, left, yTop(isContinuation ? 91 : 104), isContinuation ? 7 : 8, context.fonts.regular, gray);

  if (!isContinuation) {
    const issuerDetails = [context.company.address, context.company.phone, context.company.email].filter(Boolean).join(' · ');
    if (issuerDetails) {
      drawWrapped(page, issuerDetails, left, yTop(124), 6.5, context.fonts.regular, px(300), 9, gray);
    }
  }

  drawRightText(page, isContinuation ? `${config.title} ${getDocumentText(context.document.language).continuation}` : config.title, right, yTop(isContinuation ? 68 : 82), isContinuation ? 19 : 27, context.fonts.bold, navy);
  drawRightText(page, companyDescription, right, yTop(isContinuation ? 91 : 104), 8, context.fonts.regular, gray);
}

function drawRecipientAndMeta(page: PDFPage, context: PdfContext): void {
  const config = getDocumentConfig(context.document.documentType, context.document.language);
  const left = px(documentLayout.left);

  drawBox(page, left, yTop(184, 150), px(306), px(150));
  drawText(page, config.recipientLabel, left + px(20), yTop(216), 8, context.fonts.bold, context.accent);
  drawText(page, context.document.customerName || '-', left + px(20), yTop(255), 10, context.fonts.bold, black);

  let recipientTop = 279;

  if (context.document.customerCompany) {
    drawWrapped(page, context.document.customerCompany, left + px(20), yTop(recipientTop), 8, context.fonts.regular, px(254), 11, gray);
    recipientTop += 24;
  }

  drawWrapped(page, context.document.customerDetail || '-', left + px(20), yTop(recipientTop), 8, context.fonts.regular, px(254), 11, black);

  drawMetaTable(
    page,
    [
      [config.numberInputLabel.toUpperCase(), context.document.documentNumber],
      [getDocumentText(context.document.language).date, formatDocumentDate(context.document.issueDate, context.document.language)],
      [config.secondaryDateLabel.toUpperCase(), formatDocumentDate(context.document.dueDate, context.document.language)],
      [getDocumentText(context.document.language).paymentMethod, getPaymentMethodLabel(context.document.paymentMethod, context.document.language)]
    ],
    context.fonts
  );
}

function getTableMetrics(): { x: number; width: number; descriptionWidth: number; quantityWidth: number; priceWidth: number; totalWidth: number } {
  const tableWidth = pageWidth - px(documentLayout.left + documentLayout.right);
  const descriptionWidth = tableWidth * 0.46;
  const quantityWidth = tableWidth * 0.14;
  const priceWidth = tableWidth * 0.2;
  const totalWidth = tableWidth - descriptionWidth - quantityWidth - priceWidth;

  return {
    x: px(documentLayout.left),
    width: tableWidth,
    descriptionWidth,
    quantityWidth,
    priceWidth,
    totalWidth
  };
}

function drawTableHeader(page: PDFPage, context: PdfContext, top: number): void {
  const config = getDocumentConfig(context.document.documentType, context.document.language);
  const metrics = getTableMetrics();
  const headerY = yTop(top, documentLayout.tableHeaderHeight);
  const headerHeight = px(documentLayout.tableHeaderHeight);

  page.drawRectangle({ x: metrics.x, y: headerY, width: metrics.width, height: headerHeight, color: navy });
  drawCenteredText(page, config.tableDescriptionLabel, metrics.x + metrics.descriptionWidth / 2, headerY + px(20), 8, context.fonts.bold, white);
  const text = getDocumentText(context.document.language);
  drawCenteredText(page, text.quantityUnit, metrics.x + metrics.descriptionWidth + metrics.quantityWidth / 2, headerY + px(20), 8, context.fonts.bold, white);
  drawCenteredText(page, text.unitPrice, metrics.x + metrics.descriptionWidth + metrics.quantityWidth + metrics.priceWidth / 2, headerY + px(20), 8, context.fonts.bold, white);
  drawCenteredText(page, text.total, metrics.x + metrics.descriptionWidth + metrics.quantityWidth + metrics.priceWidth + metrics.totalWidth / 2, headerY + px(20), 8, context.fonts.bold, white);
}

function drawTableItem(page: PDFPage, context: PdfContext, item: PaginatedDocumentItem, top: number): number {
  const metrics = getTableMetrics();
  const itemHeight = item.rowHeight;
  const itemY = yTop(top, itemHeight);
  const lineTotal = item.quantity * item.unitPrice;
  const descriptionX = metrics.x + px(20);
  const descriptionMaxWidth = metrics.descriptionWidth - px(40);
  const continuationLabel = context.document.language === 'en' ? 'continued' : 'lanjutan';
  const description = item.continuation ? `${item.description} - ${continuationLabel}` : item.description;

  drawTableCell(page, metrics.x, itemY, metrics.descriptionWidth, px(itemHeight));
  drawTableCell(page, metrics.x + metrics.descriptionWidth, itemY, metrics.quantityWidth, px(itemHeight));
  drawTableCell(page, metrics.x + metrics.descriptionWidth + metrics.quantityWidth, itemY, metrics.priceWidth, px(itemHeight));
  drawTableCell(page, metrics.x + metrics.descriptionWidth + metrics.quantityWidth + metrics.priceWidth, itemY, metrics.totalWidth, px(itemHeight));
  drawWrapped(page, description || '-', descriptionX, yTop(top + 30), 8, context.fonts.bold, descriptionMaxWidth, 10, black);
  drawWrappedLines(page, item.noteLines, descriptionX, yTop(top + 58), 7, context.fonts.regular, descriptionMaxWidth, 9, gray);

  if (item.showValues) {
    const quantityUnit = `${item.quantity} ${getDocumentItemUnitLabel(item.unit, context.document.language)}`;
    drawCenteredText(page, quantityUnit, metrics.x + metrics.descriptionWidth + metrics.quantityWidth / 2, itemY + px(itemHeight / 2) - 4, 7, context.fonts.regular, black);
    drawRightFittedText(page, `${formatRupiah(item.unitPrice)}${item.unit === 'mandays' ? ' / Manday' : ''}`, metrics.x + metrics.descriptionWidth + metrics.quantityWidth + metrics.priceWidth - px(14), itemY + px(itemHeight / 2) - 4, 8, 5.5, context.fonts.regular, black, metrics.priceWidth - px(24));
    drawRightFittedText(page, formatRupiah(lineTotal), metrics.x + metrics.width - px(14), itemY + px(itemHeight / 2) - 4, 8, 6, context.fonts.regular, black, metrics.totalWidth - px(24));
  } else {
    drawCenteredText(page, '-', metrics.x + metrics.descriptionWidth + metrics.quantityWidth / 2, itemY + px(itemHeight / 2) - 4, 8, context.fonts.regular, gray);
    drawCenteredText(page, '-', metrics.x + metrics.descriptionWidth + metrics.quantityWidth + metrics.priceWidth / 2, itemY + px(itemHeight / 2) - 4, 8, context.fonts.regular, gray);
    drawCenteredText(page, '-', metrics.x + metrics.descriptionWidth + metrics.quantityWidth + metrics.priceWidth + metrics.totalWidth / 2, itemY + px(itemHeight / 2) - 4, 8, context.fonts.regular, gray);
  }

  return top + itemHeight;
}

function drawSummarySection(page: PDFPage, context: PdfContext, top: number): void {
  const config = getDocumentConfig(context.document.documentType, context.document.language);
  const subtotal = calculateSubtotal(context.document.items);
  const total = calculateTotal(context.document.items, context.document.tax);
  const left = px(documentLayout.left);
  const right = pageWidth - px(documentLayout.right);
  const spelledBoxHeight = 96;
  const summaryWidth = px(334);
  const summaryLabelWidth = px(142);
  const summaryValueWidth = summaryWidth - summaryLabelWidth;
  const summaryX = right - summaryWidth;
  const summaryTop = top;

  drawBox(page, left, yTop(summaryTop, spelledBoxHeight), px(300), px(spelledBoxHeight));
  const text = getDocumentText(context.document.language);
  drawText(page, text.amountInWords, left + px(22), yTop(summaryTop + 31), 8, context.fonts.bold, context.accent);
  drawWrapped(page, terbilangRupiah(total, context.document.language), left + px(22), yTop(summaryTop + 77), 9, context.fonts.bold, px(248), 12, navy);

  const summaryRows = [
    ['Subtotal', formatRupiah(subtotal), white, context.fonts.regular, black, 8],
    [text.tax, formatRupiah(context.document.tax), white, context.fonts.regular, black, 8],
    [config.totalLabel, formatRupiah(total), context.accentSoft, context.fonts.bold, context.accent, 13]
  ] as const;

  summaryRows.forEach((row, index) => {
    const rowTop = summaryTop + index * 45;
    const rowY = yTop(rowTop, 45);
    const amountSize = row[1].length > 17 && index === 2 ? 11 : row[5];
    drawTableCell(page, summaryX, rowY, summaryLabelWidth, px(45), row[2]);
    drawTableCell(page, summaryX + summaryLabelWidth, rowY, summaryValueWidth, px(45), row[2]);
    drawText(page, row[0], summaryX + px(14), yTop(rowTop + 28), 8, row[3], black);
    drawRightFittedText(page, row[1], summaryX + summaryWidth - px(14), yTop(rowTop + 28), amountSize, 8, row[3], row[4], summaryValueWidth - px(24));
  });

  const signTop = summaryTop + 135 + 48;
  const bankHeight = 156;
  drawBox(page, left, yTop(signTop, bankHeight), px(306), px(bankHeight));
  drawText(page, text.bankAccount, left + px(22), yTop(signTop + 31), 8, context.fonts.bold, context.accent);
  drawWrapped(page, `Bank: ${context.company.bankName || '-'}`, left + px(22), yTop(signTop + 70), 8, context.fonts.regular, px(260), 12, black);
  drawWrapped(page, `${text.accountNumber}: ${context.company.bankAccountNumber || '-'}`, left + px(22), yTop(signTop + 104), 8, context.fonts.regular, px(260), 12, black);
  drawWrapped(page, `${text.accountName}: ${context.company.bankAccountHolder || '-'}`, left + px(22), yTop(signTop + 135), 8, context.fonts.regular, px(260), 12, black);

  const signatureX = right - px(306);
  drawCenteredText(page, `${context.company.city || '-'}, ${formatDocumentDate(context.document.issueDate, context.document.language)}`, signatureX + px(153), yTop(signTop + 54), 8, context.fonts.regular, gray);

  if (context.signatureImage) {
    const signatureSize = context.signatureImage.scaleToFit(px(160), px(60));
    page.drawImage(context.signatureImage, { x: signatureX + px(73), y: yTop(signTop + 118, signatureSize.height / scale), width: signatureSize.width, height: signatureSize.height });
  }

  drawCenteredText(page, context.company.signerName || '-', signatureX + px(153), yTop(signTop + 135), 9, context.fonts.bold, black);

  const signerRole = context.document.language === 'en' ? context.company.signerRoleEn || context.company.signerRole : context.company.signerRole;

  if (signerRole) {
    drawCenteredText(page, signerRole, signatureX + px(153), yTop(signTop + 151), 8, context.fonts.regular, gray);
  }

  const noteTop = signTop + bankHeight + 20;
  const noteHeight = Math.max(70, 50 + wrapText(context.noteText, context.fonts.regular, 7, pageWidth - px(180)).length * 13);
  drawBox(page, left, yTop(noteTop, noteHeight), pageWidth - px(136), px(noteHeight));
  drawText(page, text.notes, left + px(22), yTop(noteTop + 28), 8, context.fonts.bold, context.accent);
  drawWrapped(page, context.noteText, left + px(22), yTop(noteTop + 54), 7, context.fonts.regular, pageWidth - px(180), 9, black);
}

function drawFooter(page: PDFPage, context: PdfContext, pageIndex: number): void {
  const config = getDocumentConfig(context.document.documentType, context.document.language);
  const left = px(documentLayout.left);
  const right = pageWidth - px(documentLayout.right);
  const text = getDocumentText(context.document.language);
  const pageLabel = `${text.page} ${pageIndex + 1} ${text.of} ${context.pages.length}`;

  drawText(page, config.footerText, left, px(31), 7, context.fonts.regular, gray);
  drawRightText(page, pageLabel, right, px(31), 7, context.fonts.regular, gray);
}

function drawDocumentPage(context: PdfContext, printPage: DocumentPrintPage, pageIndex: number): void {
  const page = context.pdf.addPage([pageWidth, pageHeight]);
  let currentTop = printPage.tableTop + documentLayout.tableHeaderHeight;

  context.pages.push(page);
  drawDocumentHeader(page, context, pageIndex);

  if (printPage.showDocumentHeader) {
    drawRecipientAndMeta(page, context);
  }

  if (printPage.showTable) {
    drawTableHeader(page, context, printPage.tableTop);

    printPage.items.forEach((item) => {
      currentTop = drawTableItem(page, context, item, currentTop);
    });
  }

  if (printPage.showSummary) {
    const summaryTop = printPage.showTable ? getPageTableEndTop(printPage) + documentLayout.summaryGap : documentLayout.summaryOnlyTop;
    drawSummarySection(page, context, summaryTop);
  }
}

export async function exportDocumentPdf(document: DocumentDraft, company: CompanySettings): Promise<string> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const accent = pdfColor(documentAccentColor(company, document.documentType));
  const accentSoft = pdfSoftColor(documentAccentColor(company, document.documentType));
  const noteText = document.serviceNote || getDefaultDocumentNote(company, document.documentType, document.language);
  const logoImage = await embedImage(pdf, company.logoDataUrl);
  const signatureImage = await embedImage(pdf, company.signatureDataUrl);
  const context: PdfContext = {
    pdf,
    fonts: { regular, bold },
    document,
    company,
    accent,
    accentSoft,
    logoImage,
    signatureImage,
    pages: [],
    noteText
  };

  const printPages = paginateDocument(document, noteText);

  printPages.forEach((printPage, pageIndex) => {
    drawDocumentPage(context, printPage, pageIndex);
  });

  context.pages.forEach((page, pageIndex) => {
    drawFooter(page, context, pageIndex);
  });

  const pdfBytes = await pdf.save();
  const result = await invoke<string>('save_document_pdf', {
    defaultFileName: safeFileName(document.documentNumber),
    bytes: Array.from(pdfBytes)
  });

  return result;
}
