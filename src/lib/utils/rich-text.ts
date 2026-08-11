const paragraphTags = new Set(['p', 'div', 'blockquote']);
const headingTags = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const inlineTags = new Set(['strong', 'b', 'em', 'i', 'u']);
const listTags = new Set(['ul', 'ol']);
const allowedTags = new Set([
  'p',
  'div',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'span'
]);

function decodeEntities(value: string): string {
  let current = value;

  for (let index = 0; index < 8; index += 1) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(`<textarea>${current}</textarea>`, 'text/html');
    const decoded = parsed.querySelector('textarea')?.value ?? current;

    if (decoded === current) break;
    current = decoded;
  }

  return current.replace(/\u00a0/g, ' ');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function hasHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function prepareSource(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) return '';
  if (hasHtml(trimmed)) return trimmed;

  return escapeHtml(decodeEntities(trimmed)).replace(/\r\n/g, '\n').replace(/\n/g, '<br>');
}

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeHtml(decodeEntities(node.textContent || ''));
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const children = Array.from(element.childNodes).map(sanitizeNode).join('');

  if (!allowedTags.has(tag)) return children;
  if (tag === 'br') return '<br>';
  if (tag === 'span') return children;
  if (tag === 'b') return `<strong>${children}</strong>`;
  if (tag === 'i') return `<em>${children}</em>`;
  if (inlineTags.has(tag)) return `<${tag}>${children}</${tag}>`;
  if (headingTags.has(tag)) return `<p><strong>${children || '<br>'}</strong></p>`;
  if (tag === 'blockquote') return `<div>${children || '<br>'}</div>`;
  if (tag === 'p') return `<p>${children || '<br>'}</p>`;
  if (tag === 'div') return `<div>${children || '<br>'}</div>`;
  if (listTags.has(tag)) return `<${tag}>${children}</${tag}>`;
  if (tag === 'li') return `<li>${children || '<br>'}</li>`;

  return children;
}

export function sanitizeRichText(value: string): string {
  const source = prepareSource(value);

  if (!source) return '';

  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${source}</div>`, 'text/html');
  const root = parsed.body.firstElementChild;

  if (!root) return '';

  return Array.from(root.childNodes)
    .map(sanitizeNode)
    .join('')
    .replace(/(<br>\s*){3,}/g, '<br><br>')
    .trim();
}

function nodeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as Element;
  const tag = element.tagName.toLowerCase();

  if (tag === 'br') return '\n';

  return Array.from(element.childNodes).map(nodeText).join('');
}

function splitCleanLines(value: string): string[] {
  return value
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
}

function isStructuralElement(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  return paragraphTags.has(tag) || headingTags.has(tag) || listTags.has(tag) || tag === 'li';
}

function containsStructuralDescendant(element: Element): boolean {
  return Array.from(element.children).some((child) => isStructuralElement(child) || containsStructuralDescendant(child));
}

function appendMixedNodes(
  nodes: Node[],
  emitLine: (line: string) => void,
  emitList: (element: Element) => void
): void {
  let buffer = '';

  function flush(): void {
    const cleanLines = splitCleanLines(buffer);
    buffer = '';
    cleanLines.forEach(emitLine);
  }

  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      buffer += node.textContent || '';
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const element = node as Element;
    const tag = element.tagName.toLowerCase();

    if (tag === 'br') {
      buffer += '\n';
      continue;
    }

    if (listTags.has(tag)) {
      flush();
      emitList(element);
      continue;
    }

    if (paragraphTags.has(tag) || headingTags.has(tag)) {
      flush();
      appendMixedNodes(Array.from(element.childNodes), emitLine, emitList);
      flush();
      continue;
    }

    if (containsStructuralDescendant(element)) {
      flush();
      appendMixedNodes(Array.from(element.childNodes), emitLine, emitList);
      flush();
      continue;
    }

    buffer += nodeText(element);
  }

  flush();
}

function appendListLines(element: Element, lines: string[], depth: number): void {
  const ordered = element.tagName.toLowerCase() === 'ol';
  const listItems = Array.from(element.children).filter((child) => child.tagName.toLowerCase() === 'li');

  listItems.forEach((child, index) => {
    const indent = '  '.repeat(depth);
    const nestedIndent = '  '.repeat(depth + 1);
    const prefix = ordered ? `${index + 1}. ` : '• ';
    let firstLine = true;

    appendMixedNodes(
      Array.from(child.childNodes),
      (line) => {
        if (firstLine) {
          lines.push(`${indent}${prefix}${line}`);
          firstLine = false;
          return;
        }

        lines.push(`${nestedIndent}${line}`);
      },
      (nestedList) => {
        appendListLines(nestedList, lines, depth + 1);
      }
    );
  });
}

export function richTextToLines(value: string): string[] {
  const sanitized = sanitizeRichText(value);

  if (!sanitized) return [];

  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${sanitized}</div>`, 'text/html');
  const root = parsed.body.firstElementChild;

  if (!root) return [];

  const lines: string[] = [];

  appendMixedNodes(
    Array.from(root.childNodes),
    (line) => lines.push(line),
    (list) => appendListLines(list, lines, 0)
  );

  return lines;
}

export function richTextToPlainText(value: string): string {
  return richTextToLines(value).join('\n');
}
