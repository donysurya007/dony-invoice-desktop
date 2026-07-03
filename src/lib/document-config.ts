import type { CompanySettings, DocumentStatus, DocumentType } from './types';

export type DocumentConfig = {
  title: string;
  menuLabel: string;
  numberPrefix: string;
  numberInputLabel: string;
  recipientLabel: string;
  detailLabel: string;
  secondaryDateLabel: string;
  tableDescriptionLabel: string;
  totalLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  savedMessage: string;
  footerText: string;
};

export const documentConfigs: Record<DocumentType, DocumentConfig> = {
  offer: {
    title: 'PENAWARAN',
    menuLabel: 'Penawaran',
    numberPrefix: 'PNW',
    numberInputLabel: 'Nomor Penawaran',
    recipientLabel: 'PENAWARAN KEPADA',
    detailLabel: 'Keterangan Pelanggan',
    secondaryDateLabel: 'Berlaku Sampai',
    tableDescriptionLabel: 'Deskripsi Penawaran',
    totalLabel: 'Total Penawaran',
    emptyTitle: 'Belum ada penawaran',
    emptyDescription: 'Penawaran yang disimpan akan tampil di sini.',
    savedMessage: 'Penawaran berhasil disimpan.',
    footerText: 'Penawaran ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.'
  },
  invoice: {
    title: 'INVOICE',
    menuLabel: 'Invoice',
    numberPrefix: 'INV',
    numberInputLabel: 'Nomor Invoice',
    recipientLabel: 'TAGIHAN KEPADA',
    detailLabel: 'Keterangan Pelanggan',
    secondaryDateLabel: 'Jatuh Tempo',
    tableDescriptionLabel: 'Deskripsi Layanan',
    totalLabel: 'Total Tagihan',
    emptyTitle: 'Belum ada invoice',
    emptyDescription: 'Invoice yang disimpan akan tampil di sini.',
    savedMessage: 'Invoice berhasil disimpan.',
    footerText: 'Invoice ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.'
  },
  receipt: {
    title: 'KWITANSI',
    menuLabel: 'Kwitansi',
    numberPrefix: 'KWT',
    numberInputLabel: 'Nomor Kwitansi',
    recipientLabel: 'DITERIMA DARI',
    detailLabel: 'Keterangan Pembayaran',
    secondaryDateLabel: 'Tanggal Bayar',
    tableDescriptionLabel: 'Deskripsi Pembayaran',
    totalLabel: 'Total Diterima',
    emptyTitle: 'Belum ada kwitansi',
    emptyDescription: 'Kwitansi yang disimpan akan tampil di sini.',
    savedMessage: 'Kwitansi berhasil disimpan.',
    footerText: 'Kwitansi ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.'
  }
};

export const documentOrder: DocumentType[] = ['offer', 'invoice', 'receipt'];

export function getStatusLabel(status: DocumentStatus, documentType: DocumentType): string {
  if (status === 'cancelled') return 'Batal';
  if (documentType === 'offer' && status === 'approved') return 'Disetujui';
  if (documentType === 'invoice' && status === 'paid') return 'Lunas';
  if (documentType === 'receipt' && status === 'paid') return 'Selesai';

  return 'Draft';
}

export function getStatusClass(status: DocumentStatus): string {
  if (status === 'approved' || status === 'paid') return 'paid';
  if (status === 'cancelled') return 'cancelled';

  return 'draft';
}

export function getPrimaryActionLabel(documentType: DocumentType): string {
  if (documentType === 'offer') return 'Setujui';
  if (documentType === 'invoice') return 'Lunas';

  return 'Selesai';
}

export function getCompletedStatus(documentType: DocumentType): DocumentStatus {
  if (documentType === 'offer') return 'approved';

  return 'paid';
}


export function getDefaultDocumentNote(settings: CompanySettings, documentType: DocumentType): string {
  if (documentType === 'offer') return settings.defaultOfferNote;
  if (documentType === 'receipt') return settings.defaultReceiptNote;

  return settings.defaultInvoiceNote || settings.defaultNote;
}
