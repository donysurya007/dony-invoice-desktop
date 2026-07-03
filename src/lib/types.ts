export type PaymentMethod = 'Bank Transfer' | 'Tunai' | 'QRIS' | 'E-Wallet';

export type DocumentType = 'offer' | 'invoice' | 'receipt';

export type DocumentStatus = 'draft' | 'approved' | 'paid' | 'cancelled';

export type CompanySettings = {
  name: string;
  subtitle: string;
  businessDescription: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  signerName: string;
  signerRole: string;
  city: string;
  defaultNote: string;
  defaultOfferNote: string;
  defaultInvoiceNote: string;
  defaultReceiptNote: string;
  offerColor: string;
  invoiceColor: string;
  receiptColor: string;
  logoDataUrl: string;
  signatureDataUrl: string;
};

export type ClientDraft = {
  name: string;
  detail: string;
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
  unitPrice: number;
};

export type DocumentDraft = {
  documentType: DocumentType;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  paymentMethod: PaymentMethod;
  clientId: string;
  customerName: string;
  customerDetail: string;
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
