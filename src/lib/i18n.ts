import type { DocumentLanguage, DocumentType } from './types';

export type AppText = {
  brandSubtitle: string;
  loading: string;
  applicationDesktop: string;
  dashboard: string;
  quotation: string;
  invoice: string;
  receipt: string;
  history: string;
  clients: string;
  settings: string;
  pageDashboardDescription: string;
  pageHistoryTitle: string;
  pageHistoryDescription: string;
  pageClientsTitle: string;
  pageClientsDescription: string;
  pageSettingsTitle: string;
  pageSettingsDescription: string;
  documentWorkspaceDescription: string;
  saveSettingsSuccess: string;
  saveSettingsError: string;
  saveClientSuccess: string;
  saveClientError: string;
  deleteClientConfirm: string;
  deleteClientSuccess: string;
  databaseLoadError: string;
  deleteDocumentConfirm: string;
  deleteDocumentSuccess: string;
  updateStatusSuccess: string;
  pdfSaved: string;
  pdfFailed: string;
  pdfCancelled: string;
};

const id: AppText = {
  brandSubtitle: 'Dokumen Desktop',
  loading: 'Memuat aplikasi...',
  applicationDesktop: 'Aplikasi Desktop',
  dashboard: 'Dashboard',
  quotation: 'Penawaran',
  invoice: 'Invoice',
  receipt: 'Kwitansi',
  history: 'Riwayat',
  clients: 'Klien',
  settings: 'Pengaturan',
  pageDashboardDescription: 'Ringkasan penawaran, invoice, dan kwitansi',
  pageHistoryTitle: 'Riwayat Dokumen',
  pageHistoryDescription: 'Semua dokumen tersimpan di SQLite lokal',
  pageClientsTitle: 'Data Klien',
  pageClientsDescription: 'Kelola nama klien, perusahaan, dan kontak dokumen',
  pageSettingsTitle: 'Pengaturan',
  pageSettingsDescription: 'Identitas penerbit, bahasa, rekening, dan tampilan dokumen',
  documentWorkspaceDescription: 'Preview A4 · Export PDF · Print',
  saveSettingsSuccess: 'Pengaturan berhasil disimpan.',
  saveSettingsError: 'Pengaturan gagal disimpan.',
  saveClientSuccess: 'Data klien berhasil disimpan.',
  saveClientError: 'Data klien gagal disimpan.',
  deleteClientConfirm: 'Hapus klien',
  deleteClientSuccess: 'Data klien berhasil dihapus.',
  databaseLoadError: 'Aplikasi gagal memuat database lokal.',
  deleteDocumentConfirm: 'Hapus',
  deleteDocumentSuccess: 'Dokumen berhasil dihapus.',
  updateStatusSuccess: 'Status dokumen berhasil diperbarui.',
  pdfSaved: 'PDF berhasil disimpan',
  pdfFailed: 'Export PDF gagal.',
  pdfCancelled: 'Export PDF dibatalkan.'
};

const en: AppText = {
  brandSubtitle: 'Desktop Documents',
  loading: 'Loading application...',
  applicationDesktop: 'Desktop Application',
  dashboard: 'Dashboard',
  quotation: 'Quotation',
  invoice: 'Invoice',
  receipt: 'Receipt',
  history: 'History',
  clients: 'Clients',
  settings: 'Settings',
  pageDashboardDescription: 'Quotation, invoice, and receipt summary',
  pageHistoryTitle: 'Document History',
  pageHistoryDescription: 'All documents are stored in local SQLite',
  pageClientsTitle: 'Client Data',
  pageClientsDescription: 'Manage client names, companies, and document contacts',
  pageSettingsTitle: 'Settings',
  pageSettingsDescription: 'Issuer identity, language, bank account, and document appearance',
  documentWorkspaceDescription: 'A4 Preview · Export PDF · Print',
  saveSettingsSuccess: 'Settings saved successfully.',
  saveSettingsError: 'Failed to save settings.',
  saveClientSuccess: 'Client data saved successfully.',
  saveClientError: 'Failed to save client data.',
  deleteClientConfirm: 'Delete client',
  deleteClientSuccess: 'Client data deleted successfully.',
  databaseLoadError: 'Failed to load the local database.',
  deleteDocumentConfirm: 'Delete',
  deleteDocumentSuccess: 'Document deleted successfully.',
  updateStatusSuccess: 'Document status updated successfully.',
  pdfSaved: 'PDF saved successfully',
  pdfFailed: 'PDF export failed.',
  pdfCancelled: 'PDF export cancelled.'
};

export function getAppText(language: DocumentLanguage): AppText {
  return language === 'en' ? en : id;
}

export function getAppDocumentLabel(documentType: DocumentType, language: DocumentLanguage): string {
  const text = getAppText(language);

  if (documentType === 'offer') return text.quotation;
  if (documentType === 'receipt') return text.receipt;

  return text.invoice;
}
