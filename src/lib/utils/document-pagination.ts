import type { DocumentDraft, DocumentItem, DocumentItemUnit } from '$lib/types';
import { calculateTotal } from './format';
import { terbilangRupiah } from './number-to-words';
import { richTextToLines } from './rich-text';

export type ScopeLineKind = 'heading' | 'bullet' | 'body';

export type PaginatedScopeLine = {
  lineKey: string;
  marker: string;
  text: string;
  kind: ScopeLineKind;
  lineHeight: number;
};

export type PaginatedDocumentTableItem = {
  pageItemKey: string;
  itemKey: string;
  description: string;
  quantity: number;
  unit: DocumentItemUnit;
  unitPrice: number;
  rowHeight: number;
};

export type PaginatedDocumentScopeSection = {
  pageSectionKey: string;
  itemKey: string;
  description: string;
  lines: PaginatedScopeLine[];
  continuation: boolean;
  continuationContext: string;
  sectionHeight: number;
};

export type DocumentPrintPage = {
  pageKey: string;
  tableItems: PaginatedDocumentTableItem[];
  scopeSections: PaginatedDocumentScopeSection[];
  showDocumentHeader: boolean;
  showSummary: boolean;
  tableTop: number;
};

export const documentLayout = {
  pageWidth: 794,
  pageHeight: 1123,
  left: 68,
  right: 68,
  firstTableTop: 384,
  nextContentTop: 148,
  tableHeaderHeight: 49,
  tableBottom: 930,
  tableRowBaseHeight: 62,
  tableDescriptionChars: 46,
  tableDescriptionLineHeight: 15,
  tableScopeGap: 30,
  scopeHeaderHeight: 34,
  scopeSectionTopPadding: 18,
  scopeSectionBottomPadding: 16,
  scopeSectionTitleHeight: 24,
  scopeContinuationContextHeight: 24,
  scopeSectionGap: 16,
  scopeLineHeight: 15,
  scopeHeadingLineHeight: 18,
  scopeChars: 92,
  summaryGap: 34,
  summaryOnlyTop: 164,
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

function splitWords(value: string, charsPerLine: number): string[] {
  const clean = value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
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

function parseScopeLine(value: string): { marker: string; text: string; kind: ScopeLineKind } {
  const clean = value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const numbered = clean.match(/^(\d+\.)\s+(.*)$/);

  if (numbered) {
    return { marker: numbered[1], text: numbered[2], kind: 'heading' };
  }

  const bullet = clean.match(/^[•*-]\s+(.*)$/);

  if (bullet) {
    return { marker: '•', text: bullet[1], kind: 'bullet' };
  }

  return { marker: '', text: clean, kind: 'body' };
}

function wrapScopeLines(item: DocumentItem): PaginatedScopeLine[] {
  const logicalLines = richTextToLines(item.note);
  const source = logicalLines.length > 0 ? logicalLines : [];
  const result: PaginatedScopeLine[] = [];
  let lineIndex = 0;

  for (const logicalLine of source) {
    const parsed = parseScopeLine(logicalLine);
    const markerAllowance = parsed.marker ? parsed.marker.length + 2 : 0;
    const wrapped = splitWords(parsed.text, Math.max(42, documentLayout.scopeChars - markerAllowance));
    const lines = wrapped.length > 0 ? wrapped : [''];

    lines.forEach((text, wrappedIndex) => {
      result.push({
        lineKey: `${item.itemKey}-scope-line-${lineIndex}`,
        marker: wrappedIndex === 0 ? parsed.marker : '',
        text,
        kind: parsed.kind,
        lineHeight: parsed.kind === 'heading' ? documentLayout.scopeHeadingLineHeight : documentLayout.scopeLineHeight
      });
      lineIndex += 1;
    });
  }

  return result;
}

function tableRowHeight(item: DocumentItem): number {
  const descriptionLines = lineCount(item.description, documentLayout.tableDescriptionChars);

  return Math.max(
    documentLayout.tableRowBaseHeight,
    34 + descriptionLines * documentLayout.tableDescriptionLineHeight
  );
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
    tableItems: [],
    scopeSections: [],
    showDocumentHeader: index === 0,
    showSummary: false,
    tableTop: index === 0 ? documentLayout.firstTableTop : documentLayout.nextContentTop
  };
}

function hasPageContent(page: DocumentPrintPage): boolean {
  return page.tableItems.length > 0 || page.scopeSections.length > 0 || page.showSummary;
}

function pushPage(pages: DocumentPrintPage[], page: DocumentPrintPage): DocumentPrintPage {
  if (hasPageContent(page) || page.showDocumentHeader) pages.push(page);

  return createPage(pages.length);
}

export function getPageTableEndTop(page: DocumentPrintPage): number {
  if (page.tableItems.length === 0) return page.tableTop;

  return page.tableTop + documentLayout.tableHeaderHeight + page.tableItems.reduce((sum, item) => sum + item.rowHeight, 0);
}

export function getPageScopeStartTop(page: DocumentPrintPage): number {
  if (page.tableItems.length > 0) {
    return getPageTableEndTop(page) + documentLayout.tableScopeGap;
  }

  return page.tableTop;
}

function scopeSectionHeight(lines: PaginatedScopeLine[], continuationContext: string): number {
  const lineHeight = lines.reduce((sum, line) => sum + line.lineHeight, 0);
  const contextHeight = continuationContext ? documentLayout.scopeContinuationContextHeight : 0;

  return documentLayout.scopeSectionTopPadding + documentLayout.scopeSectionTitleHeight + contextHeight + lineHeight + documentLayout.scopeSectionBottomPadding;
}

export function getPageContentEndTop(page: DocumentPrintPage): number {
  if (page.scopeSections.length > 0) {
    return (
      getPageScopeStartTop(page) +
      documentLayout.scopeHeaderHeight +
      page.scopeSections.reduce((sum, section, index) => sum + section.sectionHeight + (index > 0 ? documentLayout.scopeSectionGap : 0), 0)
    );
  }

  if (page.tableItems.length > 0) return getPageTableEndTop(page);

  return page.tableTop;
}

function canFitTableItem(page: DocumentPrintPage, item: DocumentItem): boolean {
  const existingTop = page.tableItems.length > 0 ? getPageTableEndTop(page) : page.tableTop + documentLayout.tableHeaderHeight;
  return existingTop + tableRowHeight(item) <= documentLayout.tableBottom;
}

function appendTableItems(pages: DocumentPrintPage[], page: DocumentPrintPage, items: DocumentItem[]): DocumentPrintPage {
  let currentPage = page;

  items.forEach((item) => {
    if (!canFitTableItem(currentPage, item)) {
      currentPage = pushPage(pages, currentPage);
    }

    currentPage.tableItems = [
      ...currentPage.tableItems,
      {
        pageItemKey: `${item.itemKey}-table`,
        itemKey: item.itemKey,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        rowHeight: tableRowHeight(item)
      }
    ];
  });

  return currentPage;
}

function scopeTopForNextSection(page: DocumentPrintPage): number {
  if (page.scopeSections.length === 0) {
    return getPageScopeStartTop(page) + documentLayout.scopeHeaderHeight;
  }

  return getPageContentEndTop(page) + documentLayout.scopeSectionGap;
}

function takeLinesForAvailableHeight(lines: PaginatedScopeLine[], availableHeight: number, continuationContext: string): PaginatedScopeLine[] {
  const fixedHeight = documentLayout.scopeSectionTopPadding + documentLayout.scopeSectionTitleHeight + documentLayout.scopeSectionBottomPadding + (continuationContext ? documentLayout.scopeContinuationContextHeight : 0);
  let usedHeight = fixedHeight;
  const selected: PaginatedScopeLine[] = [];

  for (const line of lines) {
    if (usedHeight + line.lineHeight > availableHeight) break;
    selected.push(line);
    usedHeight += line.lineHeight;
  }

  return selected;
}

function appendScopeSections(pages: DocumentPrintPage[], page: DocumentPrintPage, items: DocumentItem[]): DocumentPrintPage {
  let currentPage = page;

  for (const item of items) {
    const allLines = wrapScopeLines(item);
    let remainingLines = [...allLines];
    if (remainingLines.length === 0) continue;

    let continuation = false;
    let segmentIndex = 0;
    let consumedCount = 0;

    while (remainingLines.length > 0) {
      const previousHeading = [...allLines.slice(0, consumedCount)].reverse().find((line) => line.kind === 'heading');
      const startsWithHeading = remainingLines[0]?.kind === 'heading';
      const continuationContext = continuation && previousHeading && !startsWithHeading
        ? `${previousHeading.marker} ${previousHeading.text}`.trim()
        : '';
      let sectionTop = scopeTopForNextSection(currentPage);
      let availableHeight = documentLayout.tableBottom - sectionTop;
      let selected = takeLinesForAvailableHeight(remainingLines, availableHeight, continuationContext);

      if (selected.length === 0) {
        currentPage = pushPage(pages, currentPage);
        sectionTop = scopeTopForNextSection(currentPage);
        availableHeight = documentLayout.tableBottom - sectionTop;
        selected = takeLinesForAvailableHeight(remainingLines, availableHeight, continuationContext);
      }

      if (selected.length === 0) selected = [remainingLines[0]];

      currentPage.scopeSections = [
        ...currentPage.scopeSections,
        {
          pageSectionKey: `${item.itemKey}-scope-${segmentIndex}`,
          itemKey: item.itemKey,
          description: item.description,
          lines: selected,
          continuation,
          continuationContext,
          sectionHeight: scopeSectionHeight(selected, continuationContext)
        }
      ];

      remainingLines = remainingLines.slice(selected.length);
      consumedCount += selected.length;
      continuation = true;
      segmentIndex += 1;

      if (remainingLines.length > 0) currentPage = pushPage(pages, currentPage);
    }
  }

  return currentPage;
}

export function paginateDocument(document: DocumentDraft, noteText: string): DocumentPrintPage[] {
  const pages: DocumentPrintPage[] = [];
  let currentPage = createPage(0);

  currentPage = appendTableItems(pages, currentPage, document.items);
  currentPage = appendScopeSections(pages, currentPage, document.items);

  const summaryHeight = estimateSummaryHeight(document, noteText);
  const contentEnd = getPageContentEndTop(currentPage);
  const summaryTop = contentEnd + documentLayout.summaryGap;

  if (summaryTop + summaryHeight <= documentLayout.tableBottom) {
    currentPage.showSummary = true;
    pages.push(currentPage);
    return pages;
  }

  if (hasPageContent(currentPage) || currentPage.showDocumentHeader) pages.push(currentPage);

  pages.push({
    pageKey: `page-${pages.length + 1}`,
    tableItems: [],
    scopeSections: [],
    showDocumentHeader: false,
    showSummary: true,
    tableTop: documentLayout.summaryOnlyTop
  });

  return pages;
}
