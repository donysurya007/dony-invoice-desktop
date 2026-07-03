import type { DocumentDraft, DocumentItem } from '$lib/types';
import { terbilangRupiah } from './number-to-words';
import { richTextToLines } from './rich-text';
import { calculateTotal } from './format';

export type DocumentPrintPage = {
  pageKey: string;
  items: DocumentItem[];
  showDocumentHeader: boolean;
  showTable: boolean;
  showSummary: boolean;
  tableTop: number;
};

export const documentLayout = {
  pageWidth: 794,
  pageHeight: 1123,
  left: 68,
  right: 68,
  firstTableTop: 384,
  nextTableTop: 148,
  tableHeaderHeight: 49,
  tableBottom: 1024,
  summaryGap: 44,
  summaryOnlyTop: 174,
  descriptionChars: 54,
  noteChars: 62,
  noteBoxChars: 118
};

function lineCount(value: string, charsPerLine: number): number {
  const clean = (value || '-')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return 1;

  return Math.max(1, Math.ceil(clean.length / charsPerLine));
}

function richLineCount(lines: string[], charsPerLine: number): number {
  return (lines.length > 0 ? lines : ['-']).reduce((total, line) => total + lineCount(line, charsPerLine), 0);
}

export function estimateDocumentItemHeight(item: DocumentItem): number {
  const noteLines = richTextToLines(item.note);
  const descriptionLines = lineCount(item.description, documentLayout.descriptionChars);
  const itemNoteLines = richLineCount(noteLines, documentLayout.noteChars);

  return Math.max(116, 72 + descriptionLines * 14 + itemNoteLines * 12);
}

function estimateNoteHeight(noteText: string): number {
  const rows = lineCount(noteText, documentLayout.noteBoxChars);

  return Math.max(70, 50 + rows * 13);
}

export function estimateSummaryHeight(document: DocumentDraft, noteText: string): number {
  const total = calculateTotal(document.items, document.tax);
  const spelledRows = lineCount(terbilangRupiah(total), 42);
  const spelledHeight = Math.max(96, 52 + spelledRows * 17);
  const lowerHeight = Math.max(spelledHeight, 135);
  const noteHeight = estimateNoteHeight(noteText);

  return lowerHeight + 48 + 156 + 20 + noteHeight + 32;
}

function createPage(index: number): DocumentPrintPage {
  return {
    pageKey: `page-${index + 1}`,
    items: [],
    showDocumentHeader: index === 0,
    showTable: true,
    showSummary: false,
    tableTop: index === 0 ? documentLayout.firstTableTop : documentLayout.nextTableTop
  };
}

export function paginateDocument(document: DocumentDraft, noteText: string): DocumentPrintPage[] {
  const pages: DocumentPrintPage[] = [];
  let currentPage = createPage(0);
  let currentTop = currentPage.tableTop + documentLayout.tableHeaderHeight;

  document.items.forEach((item) => {
    const itemHeight = estimateDocumentItemHeight(item);
    const nextTop = currentTop + itemHeight;

    if (currentPage.items.length > 0 && nextTop > documentLayout.tableBottom) {
      pages.push(currentPage);
      currentPage = createPage(pages.length);
      currentTop = currentPage.tableTop + documentLayout.tableHeaderHeight;
    }

    currentPage.items = [...currentPage.items, item];
    currentTop += itemHeight;
  });

  const summaryHeight = estimateSummaryHeight(document, noteText);
  const summaryBottom = currentTop + documentLayout.summaryGap + summaryHeight;

  if (summaryBottom <= documentLayout.tableBottom) {
    currentPage.showSummary = true;
    pages.push(currentPage);
    return pages;
  }

  pages.push(currentPage);
  pages.push({
    pageKey: `page-${pages.length + 1}`,
    items: [],
    showDocumentHeader: false,
    showTable: false,
    showSummary: true,
    tableTop: documentLayout.nextTableTop
  });

  return pages;
}

export function getPageTableEndTop(page: DocumentPrintPage): number {
  if (!page.showTable) return documentLayout.summaryOnlyTop;

  return page.items.reduce((top, item) => top + estimateDocumentItemHeight(item), page.tableTop + documentLayout.tableHeaderHeight);
}
