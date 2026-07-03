import Database from '@tauri-apps/plugin-sql';
import { documentConfigs, documentOrder } from '$lib/document-config';
import { defaultCompanySettings } from '$lib/constants';
import type { ClientDraft, ClientRecord, CompanySettings, DashboardSummary, DocumentDraft, DocumentItem, DocumentRecord, DocumentStatus, DocumentType, PaymentMethod } from '$lib/types';
import { calculateSubtotal, calculateTotal } from '$lib/utils/format';
import { createKey } from '$lib/utils/id';

const dbUrl = 'sqlite:nadhi_invoice.db';
let dbPromise: Promise<Database> | null = null;

function connect(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(dbUrl);
  }

  return dbPromise;
}

type SettingsRow = {
  value: string;
};

type LegacyCompanySettings = Partial<CompanySettings> & {
  defaultNote?: string;
};

type DocumentRow = {
  id: string;
  document_type: DocumentType;
  document_number: string;
  issue_date: string;
  due_date: string;
  payment_method: PaymentMethod;
  client_id?: string | null;
  customer_name: string;
  customer_detail: string;
  service_note: string;
  tax: number;
  subtotal: number;
  total: number;
  status: DocumentStatus;
  items_json: string;
  created_at: string;
  updated_at: string;
};

type ClientRow = {
  id: string;
  name: string;
  detail: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
};

type DocumentNumberRow = {
  document_number: string;
};

type CountRow = {
  total: number;
};

type TableRow = {
  name: string;
};

type ColumnRow = {
  name: string;
};

function parseItems(value: string): DocumentItem[] {
  try {
    const parsed = JSON.parse(value) as DocumentItem[];
    return parsed.map((item) => ({
      itemKey: item.itemKey || createKey(),
      description: item.description || '',
      note: item.note || '',
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0
    }));
  } catch {
    return [];
  }
}

function mapDocument(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    documentType: row.document_type,
    documentNumber: row.document_number,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    paymentMethod: row.payment_method,
    clientId: row.client_id || '',
    customerName: row.customer_name,
    customerDetail: row.customer_detail,
    serviceNote: row.service_note,
    tax: Number(row.tax) || 0,
    items: parseItems(row.items_json),
    subtotal: Number(row.subtotal) || 0,
    total: Number(row.total) || 0,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapClient(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    name: row.name,
    detail: row.detail,
    address: row.address,
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function ensureDocumentClientColumn(): Promise<void> {
  const db = await connect();
  const columns = await db.select<ColumnRow[]>('PRAGMA table_info(documents)');
  const hasClientId = columns.some((column) => column.name === 'client_id');

  if (!hasClientId) {
    await db.execute("ALTER TABLE documents ADD COLUMN client_id TEXT NOT NULL DEFAULT ''");
    await db.execute('CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id)');
  }
}

async function migrateInvoices(): Promise<void> {
  const db = await connect();
  const tables = await db.select<TableRow[]>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", ['invoices']);

  if (tables.length === 0) return;

  const rows = await db.select<CountRow[]>('SELECT COUNT(*) AS total FROM documents');
  const documentCount = Number(rows[0]?.total || 0);

  if (documentCount > 0) return;

  await db.execute(`INSERT OR IGNORE INTO documents(
    id, document_type, document_number, issue_date, due_date, payment_method, client_id, customer_name, customer_detail,
    service_note, tax, subtotal, total, status, items_json, created_at, updated_at
  ) SELECT
    id, 'invoice', invoice_number, issue_date, due_date, payment_method, '', customer_name, customer_detail,
    service_note, tax, subtotal, total, status, items_json, created_at, updated_at
  FROM invoices`);
}

export async function initDatabase(): Promise<void> {
  const db = await connect();

  await db.execute(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    document_type TEXT NOT NULL,
    document_number TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    client_id TEXT NOT NULL DEFAULT '',
    customer_name TEXT NOT NULL,
    customer_detail TEXT NOT NULL,
    service_note TEXT NOT NULL,
    tax INTEGER NOT NULL DEFAULT 0,
    subtotal INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    items_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(document_type, document_number)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  await ensureDocumentClientColumn();
  await db.execute('CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name)');

  await migrateInvoices();

  const rows = await db.select<SettingsRow[]>('SELECT value FROM settings WHERE key = ?', ['company']);

  if (rows.length === 0) {
    await saveCompanySettings(defaultCompanySettings);
  }
}

export async function loadCompanySettings(): Promise<CompanySettings> {
  const db = await connect();
  const rows = await db.select<SettingsRow[]>('SELECT value FROM settings WHERE key = ?', ['company']);

  if (rows.length === 0) return defaultCompanySettings;

  try {
    const parsed = JSON.parse(rows[0].value) as LegacyCompanySettings;
    const legacyNote = parsed.defaultNote?.trim() || '';

    return {
      ...defaultCompanySettings,
      ...parsed,
      defaultNote: legacyNote,
      defaultOfferNote: parsed.defaultOfferNote || defaultCompanySettings.defaultOfferNote,
      defaultInvoiceNote: parsed.defaultInvoiceNote || legacyNote || defaultCompanySettings.defaultInvoiceNote,
      defaultReceiptNote: parsed.defaultReceiptNote || defaultCompanySettings.defaultReceiptNote,
      offerColor: parsed.offerColor || defaultCompanySettings.offerColor,
      invoiceColor: parsed.invoiceColor || defaultCompanySettings.invoiceColor,
      receiptColor: parsed.receiptColor || defaultCompanySettings.receiptColor
    };
  } catch {
    return defaultCompanySettings;
  }
}

export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
  const db = await connect();
  await db.execute('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
    'company',
    JSON.stringify(settings)
  ]);
}

export async function loadClients(): Promise<ClientRecord[]> {
  const db = await connect();
  const rows = await db.select<ClientRow[]>('SELECT * FROM clients ORDER BY name ASC');

  return rows.map(mapClient);
}

export async function upsertClient(id: string | null, draft: ClientDraft): Promise<ClientRecord> {
  const db = await connect();
  const now = new Date().toISOString();
  const clientId = id || createKey();
  const name = draft.name.trim();

  if (!name) {
    throw new Error('Nama klien wajib diisi.');
  }

  const current = await db.select<ClientRow[]>('SELECT * FROM clients WHERE id = ?', [clientId]);

  if (current.length === 0) {
    await db.execute(
      `INSERT INTO clients(id, name, detail, address, phone, email, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientId, name, draft.detail.trim(), draft.address.trim(), draft.phone.trim(), draft.email.trim(), now, now]
    );
  } else {
    await db.execute(
      `UPDATE clients SET name = ?, detail = ?, address = ?, phone = ?, email = ?, updated_at = ? WHERE id = ?`,
      [name, draft.detail.trim(), draft.address.trim(), draft.phone.trim(), draft.email.trim(), now, clientId]
    );
  }

  const rows = await db.select<ClientRow[]>('SELECT * FROM clients WHERE id = ?', [clientId]);

  return mapClient(rows[0]);
}

export async function deleteClient(id: string): Promise<void> {
  const db = await connect();
  await db.execute('DELETE FROM clients WHERE id = ?', [id]);
  await db.execute("UPDATE documents SET client_id = '' WHERE client_id = ?", [id]);
}

export async function getNextDocumentNumber(documentType: DocumentType): Promise<string> {
  const db = await connect();
  const year = new Date().getFullYear();
  const prefix = documentConfigs[documentType].numberPrefix;
  const rows = await db.select<DocumentNumberRow[]>('SELECT document_number FROM documents WHERE document_type = ? AND document_number LIKE ?', [
    documentType,
    `${prefix}-%-DI-${year}`
  ]);
  const lastNumber = rows.reduce((max, row) => {
    const match = row.document_number.match(new RegExp(`^${prefix}-(\\d+)-DI-(\\d{4})$`));
    if (!match || Number(match[2]) !== year) return max;

    return Math.max(max, Number(match[1]));
  }, 0);

  return `${prefix}-${String(lastNumber + 1).padStart(3, '0')}-DI-${year}`;
}

export async function loadDocuments(documentType?: DocumentType): Promise<DocumentRecord[]> {
  const db = await connect();

  if (documentType) {
    const rows = await db.select<DocumentRow[]>('SELECT * FROM documents WHERE document_type = ? ORDER BY created_at DESC', [documentType]);
    return rows.map(mapDocument);
  }

  const rows = await db.select<DocumentRow[]>('SELECT * FROM documents ORDER BY created_at DESC');

  return rows.map(mapDocument);
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await connect();
  await db.execute('DELETE FROM documents WHERE id = ?', [id]);
}

export async function loadDashboardSummary(): Promise<DashboardSummary[]> {
  const documents = await loadDocuments();

  return documentOrder.map((documentType) => {
    const filtered = documents.filter((document) => document.documentType === documentType);

    return {
      documentType,
      label: documentConfigs[documentType].menuLabel,
      count: filtered.length,
      total: filtered.reduce((sum, document) => sum + document.total, 0)
    };
  });
}

export async function upsertDocument(id: string | null, draft: DocumentDraft, status: DocumentStatus): Promise<DocumentRecord> {
  const db = await connect();
  const now = new Date().toISOString();
  const subtotal = calculateSubtotal(draft.items);
  const total = calculateTotal(draft.items, draft.tax);
  const documentId = id || createKey();
  const existing = await db.select<DocumentRow[]>('SELECT * FROM documents WHERE document_type = ? AND document_number = ? AND id <> ?', [
    draft.documentType,
    draft.documentNumber,
    documentId
  ]);

  if (existing.length > 0) {
    throw new Error(`${documentConfigs[draft.documentType].numberInputLabel} sudah digunakan.`);
  }

  const current = await db.select<DocumentRow[]>('SELECT * FROM documents WHERE id = ?', [documentId]);

  if (current.length === 0) {
    await db.execute(
      `INSERT INTO documents(
        id, document_type, document_number, issue_date, due_date, payment_method, client_id, customer_name, customer_detail, service_note,
        tax, subtotal, total, status, items_json, created_at, updated_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        documentId,
        draft.documentType,
        draft.documentNumber,
        draft.issueDate,
        draft.dueDate,
        draft.paymentMethod,
        draft.clientId,
        draft.customerName,
        draft.customerDetail,
        draft.serviceNote,
        draft.tax,
        subtotal,
        total,
        status,
        JSON.stringify(draft.items),
        now,
        now
      ]
    );
  } else {
    await db.execute(
      `UPDATE documents SET
        document_type = ?, document_number = ?, issue_date = ?, due_date = ?, payment_method = ?, client_id = ?, customer_name = ?, customer_detail = ?,
        service_note = ?, tax = ?, subtotal = ?, total = ?, status = ?, items_json = ?, updated_at = ?
      WHERE id = ?`,
      [
        draft.documentType,
        draft.documentNumber,
        draft.issueDate,
        draft.dueDate,
        draft.paymentMethod,
        draft.clientId,
        draft.customerName,
        draft.customerDetail,
        draft.serviceNote,
        draft.tax,
        subtotal,
        total,
        status,
        JSON.stringify(draft.items),
        now,
        documentId
      ]
    );
  }

  const rows = await db.select<DocumentRow[]>('SELECT * FROM documents WHERE id = ?', [documentId]);

  return mapDocument(rows[0]);
}
