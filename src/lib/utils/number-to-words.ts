import type { DocumentLanguage } from '$lib/types';

const unitsId = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
const smallEn = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tensEn = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function spellId(value: number): string {
  const number = Math.floor(Math.abs(value));

  if (number < 12) return unitsId[number];
  if (number < 20) return `${spellId(number - 10)} Belas`;
  if (number < 100) return `${spellId(Math.floor(number / 10))} Puluh ${spellId(number % 10)}`.trim();
  if (number < 200) return `Seratus ${spellId(number - 100)}`.trim();
  if (number < 1000) return `${spellId(Math.floor(number / 100))} Ratus ${spellId(number % 100)}`.trim();
  if (number < 2000) return `Seribu ${spellId(number - 1000)}`.trim();
  if (number < 1000000) return `${spellId(Math.floor(number / 1000))} Ribu ${spellId(number % 1000)}`.trim();
  if (number < 1000000000) return `${spellId(Math.floor(number / 1000000))} Juta ${spellId(number % 1000000)}`.trim();
  if (number < 1000000000000) return `${spellId(Math.floor(number / 1000000000))} Miliar ${spellId(number % 1000000000)}`.trim();

  return `${spellId(Math.floor(number / 1000000000000))} Triliun ${spellId(number % 1000000000000)}`.trim();
}

function spellEnBelowThousand(value: number): string {
  if (value < 20) return smallEn[value];
  if (value < 100) return `${tensEn[Math.floor(value / 10)]}${value % 10 ? ` ${smallEn[value % 10]}` : ''}`;

  return `${smallEn[Math.floor(value / 100)]} Hundred${value % 100 ? ` ${spellEnBelowThousand(value % 100)}` : ''}`;
}

function spellEn(value: number): string {
  const number = Math.floor(Math.abs(value));

  if (number < 1000) return spellEnBelowThousand(number);

  const scales = [
    { value: 1000000000000, label: 'Trillion' },
    { value: 1000000000, label: 'Billion' },
    { value: 1000000, label: 'Million' },
    { value: 1000, label: 'Thousand' }
  ];

  for (const scale of scales) {
    if (number >= scale.value) {
      const head = Math.floor(number / scale.value);
      const tail = number % scale.value;
      return `${spellEn(head)} ${scale.label}${tail ? ` ${spellEn(tail)}` : ''}`;
    }
  }

  return smallEn[0];
}

export function terbilangRupiah(value: number, language: DocumentLanguage = 'id'): string {
  const rounded = Math.round(value || 0);

  if (language === 'en') {
    if (rounded === 0) return 'Zero Rupiah';

    return `${spellEn(rounded).replace(/\s+/g, ' ').trim()} Rupiah`;
  }

  if (rounded === 0) return 'Nol Rupiah';

  return `${spellId(rounded).replace(/\s+/g, ' ').trim()} Rupiah`;
}
