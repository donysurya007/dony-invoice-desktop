import type { DocumentItem } from '$lib/types';

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function addDays(value: string, amount: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + amount);

  return toDateInputValue(date);
}

export function formatDateIndonesia(value: string): string {
  if (!value) return '-';

  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatCurrency(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(value || 0))}`;
}

export function sanitizeNumber(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;

  return Math.round(value);
}

export function calculateSubtotal(items: DocumentItem[]): number {
  return items.reduce((total, item) => total + sanitizeNumber(item.quantity) * sanitizeNumber(item.unitPrice), 0);
}

export function calculateTotal(items: DocumentItem[], tax: number): number {
  return calculateSubtotal(items) + sanitizeNumber(tax);
}

export function cleanPdfFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');
}
