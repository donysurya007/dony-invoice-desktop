import type { CompanySettings, DocumentDraft, DocumentItem, DocumentType } from './types';
import { addDays, toDateInputValue } from './utils/format';
import { createKey } from './utils/id';

export const defaultCompanySettings: CompanySettings = {
  name: 'I Putu Dony Suryambawa',
  subtitle: 'Jasa Website & Aplikasi',
  businessDescription: 'Dokumen Penawaran, Invoice & Kwitansi',
  address: 'Denpasar, Bali',
  phone: '',
  email: '',
  bankName: 'Bank Central Asia (BCA)',
  bankAccountNumber: '7725539363',
  bankAccountHolder: 'I Putu Dony Suryambawa',
  signerName: 'I Putu Dony Suryambawa',
  signerRole: '',
  city: 'Denpasar',
  defaultNote: '',
  defaultOfferNote: 'Penawaran ini berlaku sesuai tanggal berlaku yang tercantum dan dapat disesuaikan kembali apabila terdapat perubahan kebutuhan pekerjaan.',
  defaultInvoiceNote: 'Invoice ini berlaku sebagai tagihan resmi atas pekerjaan/layanan yang telah disepakati. Harap lampirkan bukti transfer setelah melakukan pembayaran.',
  defaultReceiptNote: 'Kwitansi ini merupakan bukti pembayaran yang sah atas transaksi yang telah diterima.',
  offerColor: '#ff6400',
  invoiceColor: '#073645',
  receiptColor: '#067647',
  logoDataUrl: '',
  signatureDataUrl: ''
};

export function createEmptyItem(): DocumentItem {
  return {
    itemKey: createKey(),
    description: 'Pembuatan Website / Aplikasi',
    note: 'Catatan layanan: layanan pengembangan website atau aplikasi sesuai kesepakatan pekerjaan.',
    quantity: 1,
    unitPrice: 7500000
  };
}

export function createDraft(documentType: DocumentType, documentNumber: string): DocumentDraft {
  const issueDate = toDateInputValue(new Date());
  const dueDate = addDays(issueDate, 7);

  return {
    documentType,
    documentNumber,
    issueDate,
    dueDate,
    paymentMethod: 'Bank Transfer',
    clientId: '',
    customerName: '',
    customerDetail: '',
    serviceNote: '',
    tax: 0,
    items: [createEmptyItem()]
  };
}
