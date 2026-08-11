import type { CompanySettings, DocumentDraft, DocumentItem, DocumentLanguage, DocumentType } from './types';
import { addDays, toDateInputValue } from './utils/format';
import { createKey } from './utils/id';

export const defaultCompanySettings: CompanySettings = {
  appLanguage: 'id',
  name: 'I Putu Dony Suryambawa',
  subtitle: 'Jasa Website & Aplikasi',
  subtitleEn: 'Website & Application Services',
  businessDescription: 'Dokumen Penawaran, Invoice & Kwitansi',
  businessDescriptionEn: 'Quotation, Invoice & Receipt Documents',
  address: 'Denpasar, Bali',
  phone: '',
  email: '',
  bankName: 'Bank Central Asia (BCA)',
  bankAccountNumber: '7725539363',
  bankAccountHolder: 'I Putu Dony Suryambawa',
  signerName: 'I Putu Dony Suryambawa',
  signerRole: '',
  signerRoleEn: '',
  city: 'Denpasar',
  defaultDocumentLanguage: 'id',
  defaultNote: '',
  defaultOfferNote: 'Penawaran ini berlaku sesuai tanggal berlaku yang tercantum dan dapat disesuaikan kembali apabila terdapat perubahan kebutuhan pekerjaan.',
  defaultInvoiceNote: 'Invoice ini berlaku sebagai tagihan resmi atas pekerjaan/layanan yang telah disepakati. Harap lampirkan bukti transfer setelah melakukan pembayaran.',
  defaultReceiptNote: 'Kwitansi ini merupakan bukti pembayaran yang sah atas transaksi yang telah diterima.',
  defaultOfferNoteEn: 'This quotation is valid until the stated validity date and may be adjusted if the scope of work changes.',
  defaultInvoiceNoteEn: 'This invoice is an official billing document for the agreed work or services. Please provide proof of transfer after payment.',
  defaultReceiptNoteEn: 'This receipt is valid proof of payment for the transaction received.',
  offerColor: '#ff6400',
  invoiceColor: '#073645',
  receiptColor: '#067647',
  logoDataUrl: '',
  signatureDataUrl: ''
};

export function createEmptyItem(language: DocumentLanguage = 'id'): DocumentItem {
  return {
    itemKey: createKey(),
    description: language === 'en' ? 'Website / Application Development' : 'Pembuatan Website / Aplikasi',
    note: language === 'en' ? 'Service note: website or application development services based on the agreed scope of work.' : 'Catatan layanan: layanan pengembangan website atau aplikasi sesuai kesepakatan pekerjaan.',
    quantity: 1,
    unit: 'qty',
    unitPrice: 7500000
  };
}

export function createDraft(documentType: DocumentType, documentNumber: string, language: DocumentLanguage = 'id'): DocumentDraft {
  const issueDate = toDateInputValue(new Date());
  const dueDate = addDays(issueDate, 7);

  return {
    documentType,
    language,
    documentNumber,
    issueDate,
    dueDate,
    paymentMethod: 'Bank Transfer',
    clientId: '',
    customerName: '',
    customerCompany: '',
    customerDetail: '',
    serviceNote: '',
    tax: 0,
    items: [createEmptyItem(language)]
  };
}
