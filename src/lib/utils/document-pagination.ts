import type { DocumentDraft, DocumentItem, DocumentItemUnit } from '$lib/types';
import { terbilangRupiah } from './number-to-words';
import { richTextToLines } from './rich-text';
import { calculateTotal } from './format';

export type PaginatedDocumentItem = {
  pageItemKey: string;
  itemKey: string;
  description: string;
  noteLines: string[];
  quantity: number;
  unit: DocumentItemUnit;
  unitPrice: number;
  continuation: boolean;
  showValues: boolean;
  rowHeight: number;
};

export type DocumentPrintPage = {
  pageKey: string;
  items: PaginatedDocumentItem[];
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
  tableBottom: 950,
  summaryGap: 36,
  summaryOnlyTop: 164,
  minimumRowHeight: 108,
  rowBaseHeight: 68,
  descriptionChars: 38,
  noteChars: 44,
  noteLineHeight: 16,
  descriptionLineHeight: 14,
  noteBoxChars: 96
};

function lineCount(value: string, charsPerLine: number): number {
  const clean = (value || '-')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return 1;

  return Math.max(1, Math.ceil(clean.length / charsPerLine));
}

function wrapApprox(value: string, charsPerLine: number): string[] {
  const clean = (value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= charsPerLine) {
      current = next;
      continue;
    }

    if (current) lines.push(current);

    if (word.length <= charsPerLine) {
      current = word;
      continue;
    }

    let rest = word;
    while (rest.length > charsPerLine) {
      lines.push(rest.slice(0, charsPerLine));
      rest = rest.slice(charsPerLine);
    }
    current = rest;
  }

  if (current) lines.push(current);
  return lines;
}

function getWrappedNoteLines(item: DocumentItem): string[] {
  const logicalLines = richTextToLines(item.note);
  const source = logicalLines.length > 0 ? logicalLines : ['-'];

  return source.flatMap((line) => wrapApprox(line, documentLayout.noteChars));
}

function getDescriptionHeight(description: string): number {
  return lineCount(description, documentLayout.descriptionChars) * documentLayout.descriptionLineHeight;
}

function rowHeightFor(description: string, noteLineCount: number): number {
  return Math.max(
    documentLayout.minimumRowHeight,
    documentLayout.rowBaseHeight + getDescriptionHeight(description) + Math.max(1, noteLineCount) * documentLayout.noteLineHeight
  );
}

function maxNoteLinesForHeight(description: string, availableHeight: number): number {
  const fixedHeight = documentLayout.rowBaseHeight + getDescriptionHeight(description);
  return Math.max(0, Math.floor((availableHeight - fixedHeight) / documentLayout.noteLineHeight));
}

function estimateNoteHeight(noteText: string): number {
  const rows = lineCount(noteText, documentLayout.noteBoxChars);
  return Math.max(70, 50 + rows * 13);
}

export function estimateSummaryHeight(document: DocumentDraft, noteText: string): number {
  const total = calculateTotal(document.items, document.tax);
  const spelledRows = lineCount(terbilangRupiah(total, document.language), 42);
  const spelledHeight = Math.max(96, 52 + spelledRows * 17);
  const lowerHeight = Math.max(spelledHeight, 135);
  const noteHeight = estimateNoteHeight(noteText);

  return lowerHeight + 40 + 156 + 20 + noteHeight + 32;
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

function pageContentTop(page: DocumentPrintPage): number {
  return page.tableTop + documentLayout.tableHeaderHeight + page.items.reduce((sum, item) => sum + item.rowHeight, 0);
}

function pushCurrentPage(pages: DocumentPrintPage[], page: DocumentPrintPage): DocumentPrintPage {
  pages.push(page);
  return createPage(pages.length);
}

function appendItemAcrossPages(pages: DocumentPrintPage[], currentPage: DocumentPrintPage, item: DocumentItem): DocumentPrintPage {
  let remainingLines = getWrappedNoteLines(item);
  let continuation = false;
  let segment = 0;

  while (remainingLines.length > 0) {
    let currentTop = pageContentTop(currentPage);
    let availableHeight = documentLayout.tableBottom - currentTop;
    const segmentDescription = continuation ? item.description : item.description;
    let maxLines = maxNoteLinesForHeight(segmentDescription, availableHeight);

    if (maxLines < 1 || availableHeight < documentLayout.minimumRowHeight) {
      currentPage = pushCurrentPage(pages, currentPage);
      currentTop = pageContentTop(currentPage);
      availableHeight = documentLayout.tableBottom - currentTop;
      maxLines = maxNoteLinesForHeight(segmentDescription, availableHeight);
    }

    const lineCountForSegment = Math.max(1, Math.min(remainingLines.length, maxLines));
    const noteLines = remainingLines.slice(0, lineCountForSegment);
    remainingLines = remainingLines.slice(lineCountForSegment);
    const rowHeight = Math.min(rowHeightFor(segmentDescription, noteLines.length), availableHeight);

    currentPage.items = [
      ...currentPage.items,
      {
        pageItemKey: `${item.itemKey}-${segment}`,
        itemKey: item.itemKey,
        description: item.description,
        noteLines,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        continuation,
        showValues: !continuation,
        rowHeight
      }
    ];

    continuation = true;
    segment += 1;

    if (remainingLines.length > 0) {
      currentPage = pushCurrentPage(pages, currentPage);
    }
  }

  return currentPage;
}

export function paginateDocument(document: DocumentDraft, noteText: string): DocumentPrintPage[] {
  const pages: DocumentPrintPage[] = [];
  let currentPage = createPage(0);

  for (const item of document.items) {
    currentPage = appendItemAcrossPages(pages, currentPage, item);
  }

  const summaryHeight = estimateSummaryHeight(document, noteText);
  const currentTop = pageContentTop(currentPage);
  const summaryBottom = currentTop + documentLayout.summaryGap + summaryHeight;

  if (summaryBottom <= documentLayout.tableBottom) {
    currentPage.showSummary = true;
    pages.push(currentPage);
    return pages;
  }

  if (currentPage.items.length > 0 || pages.length === 0) pages.push(currentPage);

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

  return page.tableTop + documentLayout.tableHeaderHeight + page.items.reduce((top, item) => top + item.rowHeight, 0);
}
