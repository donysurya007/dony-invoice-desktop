const blockTags = new Set(['p', 'div']);
const inlineTags = new Set(['strong', 'b', 'em', 'i', 'u']);
const listTags = new Set(['ul', 'ol']);
const allowedTags = new Set(['p', 'div', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'span']);

function decodeEntities(value: string): string {
  let current = value;

  for (let index = 0; index < 8; index += 1) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(`<textarea>${current}</textarea>`, 'text/html');
    const decoded = parsed.querySelector('textarea')?.value ?? current;

    if (decoded === current) break;
    current = decoded;
  }

  return current.replace(/ /g, ' ');
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
  if (blockTags.has(tag)) return `<p>${children || '<br>'}</p>`;
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
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function directNodeText(element: Element): string {
  return Array.from(element.childNodes)
    .filter((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return true;
      const tag = (node as Element).tagName.toLowerCase();
      return tag !== 'ul' && tag !== 'ol';
    })
    .map(nodeText)
    .join('');
}

function appendListLines(element: Element, lines: string[], depth: number): void {
  const ordered = element.tagName.toLowerCase() === 'ol';

  Array.from(element.children).forEach((child, index) => {
    if (child.tagName.toLowerCase() !== 'li') return;

    const text = splitCleanLines(directNodeText(child)).join(' ');
    const indent = depth > 0 ? `${'  '.repeat(depth)}` : '';
    const prefix = ordered ? `${index + 1}. ` : '• ';

    if (text) lines.push(`${indent}${prefix}${text}`);

    Array.from(child.children).forEach((nested) => {
      const tag = nested.tagName.toLowerCase();
      if (tag === 'ul' || tag === 'ol') appendListLines(nested, lines, depth + 1);
    });
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

  Array.from(root.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      lines.push(...splitCleanLines(node.textContent || ''));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    const tag = element.tagName.toLowerCase();

    if (tag === 'ul' || tag === 'ol') {
      appendListLines(element, lines, 0);
      return;
    }

    if (tag === 'li') {
      const text = splitCleanLines(directNodeText(element)).join(' ');
      if (text) lines.push(`• ${text}`);
      return;
    }

    lines.push(...splitCleanLines(nodeText(element)));
  });

  return lines;
}

export function richTextToPlainText(value: string): string {
  return richTextToLines(value).join('\n');
}
