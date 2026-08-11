import type { CompanySettings, DocumentItemUnit, DocumentLanguage, DocumentStatus, DocumentType, PaymentMethod } from './types';

export type DocumentConfig = {
  title: string;
  menuLabel: string;
  numberPrefix: string;
  numberInputLabel: string;
  recipientLabel: string;
  secondaryDateLabel: string;
  tableDescriptionLabel: string;
  totalLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  savedMessage: string;
  footerText: string;
};

export type DocumentText = {
  continuation: string;
  date: string;
  paymentMethod: string;
  clientName: string;
  clientCompany: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  selectClient: string;
  manualInput: string;
  documentLanguage: string;
  quantity: string;
  itemUnit: string;
  unitPrice: string;
  total: string;
  amountInWords: string;
  tax: string;
  bankAccount: string;
  accountNumber: string;
  accountName: string;
  notes: string;
  scopeOfWork: string;
  scopeAttachment: string;
  summaryTitle: string;
  page: string;
  of: string;
};

const idConfigs: Record<DocumentType, DocumentConfig> = {
  offer: {
    title: 'PENAWARAN',
    menuLabel: 'Penawaran',
    numberPrefix: 'PNW',
    numberInputLabel: 'Nomor Penawaran',
    recipientLabel: 'PENAWARAN KEPADA',
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
    secondaryDateLabel: 'Tanggal Bayar',
    tableDescriptionLabel: 'Deskripsi Pembayaran',
    totalLabel: 'Total Diterima',
    emptyTitle: 'Belum ada kwitansi',
    emptyDescription: 'Kwitansi yang disimpan akan tampil di sini.',
    savedMessage: 'Kwitansi berhasil disimpan.',
    footerText: 'Kwitansi ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.'
  }
};

const enConfigs: Record<DocumentType, DocumentConfig> = {
  offer: {
    title: 'QUOTATION',
    menuLabel: 'Quotation',
    numberPrefix: 'PNW',
    numberInputLabel: 'Quotation Number',
    recipientLabel: 'QUOTATION FOR',
    secondaryDateLabel: 'Valid Until',
    tableDescriptionLabel: 'Quotation Description',
    totalLabel: 'Quotation Total',
    emptyTitle: 'No quotations yet',
    emptyDescription: 'Saved quotations will appear here.',
    savedMessage: 'Quotation saved successfully.',
    footerText: 'This quotation is issued electronically and is valid without a handwritten signature.'
  },
  invoice: {
    title: 'INVOICE',
    menuLabel: 'Invoice',
    numberPrefix: 'INV',
    numberInputLabel: 'Invoice Number',
    recipientLabel: 'BILL TO',
    secondaryDateLabel: 'Due Date',
    tableDescriptionLabel: 'Service Description',
    totalLabel: 'Amount Due',
    emptyTitle: 'No invoices yet',
    emptyDescription: 'Saved invoices will appear here.',
    savedMessage: 'Invoice saved successfully.',
    footerText: 'This invoice is issued electronically and is valid without a handwritten signature.'
  },
  receipt: {
    title: 'RECEIPT',
    menuLabel: 'Receipt',
    numberPrefix: 'KWT',
    numberInputLabel: 'Receipt Number',
    recipientLabel: 'RECEIVED FROM',
    secondaryDateLabel: 'Payment Date',
    tableDescriptionLabel: 'Payment Description',
    totalLabel: 'Amount Received',
    emptyTitle: 'No receipts yet',
    emptyDescription: 'Saved receipts will appear here.',
    savedMessage: 'Receipt saved successfully.',
    footerText: 'This receipt is issued electronically and is valid without a handwritten signature.'
  }
};

const documentTexts: Record<DocumentLanguage, DocumentText> = {
  id: {
    continuation: 'LANJUTAN',
    date: 'TANGGAL',
    paymentMethod: 'METODE BAYAR',
    clientName: 'Nama Klien',
    clientCompany: 'Nama Perusahaan Klien',
    clientAddress: 'Alamat',
    clientPhone: 'Telepon',
    clientEmail: 'Email',
    selectClient: 'Pilih Klien',
    manualInput: 'Input manual',
    documentLanguage: 'Bahasa Dokumen',
    quantity: 'Jumlah',
    itemUnit: 'Satuan',
    unitPrice: 'Harga Satuan',
    total: 'Total',
    amountInWords: 'TERBILANG',
    tax: 'Pajak',
    bankAccount: 'REKENING BANK',
    accountNumber: 'No. Rekening',
    accountName: 'Nama',
    notes: 'CATATAN',
    scopeOfWork: 'LINGKUP PEKERJAAN',
    scopeAttachment: 'Lampiran',
    summaryTitle: 'RINGKASAN TAGIHAN',
    page: 'Halaman',
    of: 'dari'
  },
  en: {
    continuation: 'CONTINUED',
    date: 'DATE',
    paymentMethod: 'PAYMENT METHOD',
    clientName: 'Client Name',
    clientCompany: 'Client Company Name',
    clientAddress: 'Address',
    clientPhone: 'Phone',
    clientEmail: 'Email',
    selectClient: 'Select Client',
    manualInput: 'Manual input',
    documentLanguage: 'Document Language',
    quantity: 'Quantity',
    itemUnit: 'Unit',
    unitPrice: 'Unit Price',
    total: 'Total',
    amountInWords: 'AMOUNT IN WORDS',
    tax: 'Tax',
    bankAccount: 'BANK ACCOUNT',
    accountNumber: 'Account No.',
    accountName: 'Name',
    notes: 'NOTES',
    scopeOfWork: 'SCOPE OF WORK',
    scopeAttachment: 'Attached to',
    summaryTitle: 'PAYMENT SUMMARY',
    page: 'Page',
    of: 'of'
  }
};

export const documentConfigs = idConfigs;

export const documentOrder: DocumentType[] = ['offer', 'invoice', 'receipt'];

export function getDocumentConfig(documentType: DocumentType, language: DocumentLanguage): DocumentConfig {
  return language === 'en' ? enConfigs[documentType] : idConfigs[documentType];
}

export function getDocumentText(language: DocumentLanguage): DocumentText {
  return documentTexts[language];
}


export function getDocumentItemUnitLabel(unit: DocumentItemUnit, language: DocumentLanguage): string {
  if (unit === 'mandays') return 'Mandays';

  return language === 'en' ? 'Qty' : 'Qty';
}

function hasOnlyUnit(units: DocumentItemUnit[], unit: DocumentItemUnit): boolean {
  return units.length > 0 && units.every((itemUnit) => itemUnit === unit);
}

export function getDocumentQuantityColumnLabel(units: DocumentItemUnit[], language: DocumentLanguage): string {
  if (hasOnlyUnit(units, 'mandays')) return 'Mandays';
  if (hasOnlyUnit(units, 'qty')) return 'Qty';

  return language === 'en' ? 'Quantity' : 'Jumlah';
}

export function getDocumentUnitPriceColumnLabel(units: DocumentItemUnit[], language: DocumentLanguage): string {
  if (hasOnlyUnit(units, 'mandays')) return language === 'en' ? 'Rate / Manday' : 'Tarif / Manday';

  return language === 'en' ? 'Unit Price' : 'Harga Satuan';
}

export function shouldShowDocumentItemUnit(units: DocumentItemUnit[]): boolean {
  if (units.length === 0) return false;

  const firstUnit = units[0];
  return units.some((unit) => unit !== firstUnit);
}

export function getPaymentMethodLabel(method: PaymentMethod, language: DocumentLanguage): string {
  if (language === 'id') return method;
  if (method === 'Tunai') return 'Cash';
  if (method === 'Bank Transfer') return 'Bank Transfer';
  if (method === 'E-Wallet') return 'E-Wallet';

  return 'QRIS';
}

export function getStatusLabel(status: DocumentStatus, documentType: DocumentType, language: DocumentLanguage = 'id'): string {
  if (language === 'en') {
    if (status === 'cancelled') return 'Cancelled';
    if (documentType === 'offer' && status === 'approved') return 'Approved';
    if (documentType === 'invoice' && status === 'paid') return 'Paid';
    if (documentType === 'receipt' && status === 'paid') return 'Completed';

    return 'Draft';
  }

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

export function getPrimaryActionLabel(documentType: DocumentType, language: DocumentLanguage = 'id'): string {
  if (language === 'en') {
    if (documentType === 'offer') return 'Approve';
    if (documentType === 'invoice') return 'Mark Paid';

    return 'Complete';
  }

  if (documentType === 'offer') return 'Setujui';
  if (documentType === 'invoice') return 'Lunas';

  return 'Selesai';
}

export function getCompletedStatus(documentType: DocumentType): DocumentStatus {
  if (documentType === 'offer') return 'approved';

  return 'paid';
}

export function getDefaultDocumentNote(settings: CompanySettings, documentType: DocumentType, language: DocumentLanguage = 'id'): string {
  if (language === 'en') {
    if (documentType === 'offer') return settings.defaultOfferNoteEn;
    if (documentType === 'receipt') return settings.defaultReceiptNoteEn;

    return settings.defaultInvoiceNoteEn;
  }

  if (documentType === 'offer') return settings.defaultOfferNote;
  if (documentType === 'receipt') return settings.defaultReceiptNote;

  return settings.defaultInvoiceNote || settings.defaultNote;
}
