export type PaymentMethod = 'Bank Transfer' | 'Tunai' | 'QRIS' | 'E-Wallet';

export type DocumentType = 'offer' | 'invoice' | 'receipt';

export type DocumentStatus = 'draft' | 'approved' | 'paid' | 'cancelled';

export type DocumentLanguage = 'id' | 'en';

export type DocumentItemUnit = 'qty' | 'mandays';

export type CompanySettings = {
  appLanguage: DocumentLanguage;
  name: string;
  subtitle: string;
  subtitleEn: string;
  businessDescription: string;
  businessDescriptionEn: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  signerName: string;
  signerRole: string;
  signerRoleEn: string;
  city: string;
  defaultDocumentLanguage: DocumentLanguage;
  defaultNote: string;
  defaultOfferNote: string;
  defaultInvoiceNote: string;
  defaultReceiptNote: string;
  defaultOfferNoteEn: string;
  defaultInvoiceNoteEn: string;
  defaultReceiptNoteEn: string;
  offerColor: string;
  invoiceColor: string;
  receiptColor: string;
  logoDataUrl: string;
  signatureDataUrl: string;
};

export type ClientDraft = {
  name: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
};

export type ClientRecord = ClientDraft & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentItem = {
  itemKey: string;
  description: string;
  note: string;
  quantity: number;
  unit: DocumentItemUnit;
  unitPrice: number;
};

export type DocumentDraft = {
  documentType: DocumentType;
  language: DocumentLanguage;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  paymentMethod: PaymentMethod;
  clientId: string;
  customerName: string;
  customerCompany: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  serviceNote: string;
  tax: number;
  items: DocumentItem[];
};

export type DocumentRecord = DocumentDraft & {
  id: string;
  subtotal: number;
  total: number;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSummary = {
  documentType: DocumentType;
  label: string;
  count: number;
  total: number;
};

export type ToastMessage = {
  message: string;
  type: 'success' | 'error' | 'info';
};

export type InvoiceDraft = Omit<DocumentDraft, 'documentType' | 'documentNumber' | 'language' | 'clientId'> & {
  invoiceNumber: string;
};

export type InvoiceRecord = InvoiceDraft & {
  id: string;
  subtotal: number;
  total: number;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
};
