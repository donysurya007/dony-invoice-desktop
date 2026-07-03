const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

function spell(value: number): string {
  const number = Math.floor(Math.abs(value));

  if (number < 12) return units[number];
  if (number < 20) return `${spell(number - 10)} Belas`;
  if (number < 100) return `${spell(Math.floor(number / 10))} Puluh ${spell(number % 10)}`.trim();
  if (number < 200) return `Seratus ${spell(number - 100)}`.trim();
  if (number < 1000) return `${spell(Math.floor(number / 100))} Ratus ${spell(number % 100)}`.trim();
  if (number < 2000) return `Seribu ${spell(number - 1000)}`.trim();
  if (number < 1000000) return `${spell(Math.floor(number / 1000))} Ribu ${spell(number % 1000)}`.trim();
  if (number < 1000000000) return `${spell(Math.floor(number / 1000000))} Juta ${spell(number % 1000000)}`.trim();
  if (number < 1000000000000) return `${spell(Math.floor(number / 1000000000))} Miliar ${spell(number % 1000000000)}`.trim();

  return `${spell(Math.floor(number / 1000000000000))} Triliun ${spell(number % 1000000000000)}`.trim();
}

export function terbilangRupiah(value: number): string {
  const rounded = Math.round(value || 0);

  if (rounded === 0) return 'Nol Rupiah';

  return `${spell(rounded).replace(/\s+/g, ' ').trim()} Rupiah`;
}
