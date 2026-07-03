import type { CompanySettings, DocumentType } from '$lib/types';

const fallbackColor = '#ff6400';

export function normalizeHexColor(value: string, fallback = fallbackColor): string {
  const trimmed = value.trim();
  const raw = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;

  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw.split('').map((char) => `${char}${char}`).join('').toLowerCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toLowerCase()}`;
  }

  return fallback;
}

export function documentAccentColor(settings: CompanySettings, documentType: DocumentType): string {
  if (documentType === 'offer') return normalizeHexColor(settings.offerColor, fallbackColor);
  if (documentType === 'receipt') return normalizeHexColor(settings.receiptColor, fallbackColor);

  return normalizeHexColor(settings.invoiceColor, fallbackColor);
}

export function softenHexColor(value: string, amount = 0.9): string {
  const color = normalizeHexColor(value);
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount).toString(16).padStart(2, '0');

  return `#${mix(red)}${mix(green)}${mix(blue)}`;
}

export function hexToUnitRgb(value: string): [number, number, number] {
  const color = normalizeHexColor(value);

  return [parseInt(color.slice(1, 3), 16) / 255, parseInt(color.slice(3, 5), 16) / 255, parseInt(color.slice(5, 7), 16) / 255];
}
