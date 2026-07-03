<script lang="ts">
  import { onMount } from 'svelte';
  import AppButton from '$lib/components/AppButton.svelte';
  import ClientManager from '$lib/components/ClientManager.svelte';
  import CompanySettings from '$lib/components/CompanySettings.svelte';
  import Dashboard from '$lib/components/Dashboard.svelte';
  import DocumentForm from '$lib/components/DocumentForm.svelte';
  import DocumentHistory from '$lib/components/DocumentHistory.svelte';
  import DocumentPreview from '$lib/components/DocumentPreview.svelte';
  import DocumentTypeList from '$lib/components/DocumentTypeList.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { createDraft, defaultCompanySettings } from '$lib/constants';
  import { documentConfigs, getCompletedStatus } from '$lib/document-config';
  import { deleteClient, deleteDocument, getNextDocumentNumber, initDatabase, loadClients, loadCompanySettings, loadDashboardSummary, loadDocuments, saveCompanySettings, upsertClient, upsertDocument } from '$lib/services/db';
  import { exportDocumentPdf } from '$lib/services/pdf';
  import type { ClientDraft, ClientRecord, CompanySettings as CompanySettingsType, DashboardSummary, DocumentDraft, DocumentRecord, DocumentType, ToastMessage } from '$lib/types';

  type Tab = 'dashboard' | 'document' | 'history' | 'clients' | 'settings';

  let activeTab: Tab = 'dashboard';
  let activeDocumentType: DocumentType = 'invoice';
  let historyFilter: DocumentType | 'all' = 'all';
  let loading = true;
  let saving = false;
  let editingDocumentId: string | null = null;
  let company: CompanySettingsType = defaultCompanySettings;
  let draft: DocumentDraft = createDraft('invoice', `INV-001-DI-${new Date().getFullYear()}`);
  let documents: DocumentRecord[] = [];
  let clients: ClientRecord[] = [];
  let summary: DashboardSummary[] = [];
  let toast: ToastMessage | null = null;

  $: pageTitle = activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'history' ? 'Riwayat Dokumen' : activeTab === 'clients' ? 'Data Klien' : activeTab === 'settings' ? 'Pengaturan' : `${documentConfigs[activeDocumentType].menuLabel} Generator`;
  $: pageDescription = activeTab === 'dashboard' ? 'Ringkasan penawaran, invoice, dan kwitansi' : activeTab === 'history' ? 'Semua dokumen tersimpan di SQLite lokal' : activeTab === 'clients' ? 'Kelola list klien untuk dokumen' : activeTab === 'settings' ? 'Data perusahaan, rekening, dan warna dokumen' : 'Preview A4 · Export PDF · Print';

  function showToast(message: string, type: ToastMessage['type'] = 'info'): void {
    toast = { message, type };
    window.setTimeout(() => {
      toast = null;
    }, 2800);
  }

  function cloneDraft(document: DocumentDraft): DocumentDraft {
    return {
      documentType: document.documentType,
      documentNumber: document.documentNumber,
      issueDate: document.issueDate,
      dueDate: document.dueDate,
      paymentMethod: document.paymentMethod,
      customerName: document.customerName,
      customerDetail: document.customerDetail,
      clientId: document.clientId,
      serviceNote: document.serviceNote,
      tax: document.tax,
      items: document.items.map((item) => ({ ...item }))
    };
  }

  async function refreshData(): Promise<void> {
    documents = await loadDocuments();
    clients = await loadClients();
    summary = await loadDashboardSummary();
  }

  async function createNewDocument(documentType: DocumentType = activeDocumentType): Promise<void> {
    editingDocumentId = null;
    activeDocumentType = documentType;
    draft = createDraft(documentType, await getNextDocumentNumber(documentType));
    activeTab = 'document';
  }

  async function openDocumentTab(documentType: DocumentType): Promise<void> {
    if (activeDocumentType === documentType && activeTab === 'document') return;

    await createNewDocument(documentType);
  }

  async function handleSaveDocument(event: CustomEvent<DocumentDraft>): Promise<void> {
    try {
      saving = true;
      const saved = await upsertDocument(editingDocumentId, event.detail, 'draft');
      editingDocumentId = saved.id;
      activeDocumentType = saved.documentType;
      draft = cloneDraft(saved);
      await refreshData();
      showToast(documentConfigs[saved.documentType].savedMessage, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Dokumen gagal disimpan.';
      showToast(message, 'error');
    } finally {
      saving = false;
    }
  }

  async function handleSaveClient(event: CustomEvent<{ id: string | null; draft: ClientDraft }>): Promise<void> {
    try {
      saving = true;
      await upsertClient(event.detail.id, event.detail.draft);
      clients = await loadClients();
      showToast('Data klien berhasil disimpan.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Data klien gagal disimpan.';
      showToast(message, 'error');
    } finally {
      saving = false;
    }
  }

  async function handleDeleteClient(event: CustomEvent<ClientRecord>): Promise<void> {
    const client = event.detail;
    const confirmed = window.confirm(`Hapus klien ${client.name}?`);
    if (!confirmed) return;

    await deleteClient(client.id);
    await refreshData();

    if (draft.clientId === client.id) {
      draft.clientId = '';
    }

    showToast('Data klien berhasil dihapus.', 'success');
  }

  async function handleSaveSettings(event: CustomEvent<CompanySettingsType>): Promise<void> {
    try {
      saving = true;
      await saveCompanySettings(event.detail);
      company = { ...event.detail };
      showToast('Pengaturan berhasil disimpan.', 'success');
    } catch {
      showToast('Pengaturan gagal disimpan.', 'error');
    } finally {
      saving = false;
    }
  }

  function handleSelectDocument(event: CustomEvent<DocumentRecord>): void {
    const selectedDocument = event.detail;
    editingDocumentId = selectedDocument.id;
    activeDocumentType = selectedDocument.documentType;
    draft = cloneDraft(selectedDocument);
    activeTab = 'document';
  }

  async function handleDeleteDocument(event: CustomEvent<DocumentRecord>): Promise<void> {
    const selectedDocument = event.detail;
    const confirmed = window.confirm(`Hapus ${documentConfigs[selectedDocument.documentType].menuLabel.toLowerCase()} ${selectedDocument.documentNumber}?`);
    if (!confirmed) return;

    await deleteDocument(selectedDocument.id);
    await refreshData();

    if (editingDocumentId === selectedDocument.id) {
      await createNewDocument(selectedDocument.documentType);
    }

    showToast('Dokumen berhasil dihapus.', 'success');
  }

  async function handleCompleteDocument(event: CustomEvent<DocumentRecord>): Promise<void> {
    const selectedDocument = event.detail;
    const status = getCompletedStatus(selectedDocument.documentType);
    await upsertDocument(selectedDocument.id, cloneDraft(selectedDocument), status);
    await refreshData();
    showToast('Status dokumen berhasil diperbarui.', 'success');
  }

  async function handleExportPdf(event: CustomEvent<DocumentDraft>): Promise<void> {
    try {
      const path = await exportDocumentPdf(event.detail, company);
      showToast(`PDF berhasil disimpan: ${path}`, 'success');
    } catch (error) {
      const message = error instanceof Error && error.message !== 'Dibatalkan' ? 'Export PDF gagal.' : 'Export PDF dibatalkan.';
      showToast(message, error instanceof Error && error.message !== 'Dibatalkan' ? 'error' : 'info');
    }
  }

  function handlePrint(): void {
    window.print();
  }

  function openHistory(): void {
    activeTab = 'history';
  }

  function handleHistoryFilter(event: CustomEvent<DocumentType | 'all'>): void {
    historyFilter = event.detail;
  }

  onMount(async () => {
    try {
      await initDatabase();
      company = await loadCompanySettings();
      await refreshData();
      draft = createDraft(activeDocumentType, await getNextDocumentNumber(activeDocumentType));
    } catch {
      showToast('Aplikasi gagal memuat database lokal.', 'error');
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Dony Invoice</title>
</svelte:head>

{#if loading}
  <main class="boot-screen">
    <div>
      <strong>Dony Invoice</strong>
      <span>Memuat aplikasi...</span>
    </div>
  </main>
{:else}
  <Toast {toast} />

  <main class="app-shell">
    <aside class="sidebar no-print">
      <div class="app-brand">
        <div class="brand-mark">D</div>
        <div>
          <strong>Dony Invoice</strong>
          <span>Dokumen Desktop</span>
        </div>
      </div>

      <nav>
        <button class:active={activeTab === 'dashboard'} type="button" on:click={() => (activeTab = 'dashboard')}>Dashboard</button>
        <button class:active={activeTab === 'document' && activeDocumentType === 'offer'} type="button" on:click={() => openDocumentTab('offer')}>Penawaran</button>
        <button class:active={activeTab === 'document' && activeDocumentType === 'invoice'} type="button" on:click={() => openDocumentTab('invoice')}>Invoice</button>
        <button class:active={activeTab === 'document' && activeDocumentType === 'receipt'} type="button" on:click={() => openDocumentTab('receipt')}>Kwitansi</button>
        <button class:active={activeTab === 'history'} type="button" on:click={openHistory}>Riwayat</button>
        <button class:active={activeTab === 'clients'} type="button" on:click={() => (activeTab = 'clients')}>Klien</button>
        <button class:active={activeTab === 'settings'} type="button" on:click={() => (activeTab = 'settings')}>Pengaturan</button>
      </nav>

      <div class="sidebar-footer">
        <AppButton full variant="secondary" on:click={() => createNewDocument(activeDocumentType)}>{documentConfigs[activeDocumentType].menuLabel} Baru</AppButton>
      </div>
    </aside>

    <section class="workspace">
      <div class="workspace-header no-print">
        <div>
          <span>Aplikasi Desktop</span>
          <h1>{pageTitle}</h1>
        </div>
        <p>{pageDescription}</p>
      </div>

      <div class="content-grid" class:single={activeTab !== 'document'}>
        <div class="editor-panel no-print">
          {#if activeTab === 'dashboard'}
            <Dashboard {summary} {documents} on:create={(event) => createNewDocument(event.detail)} on:openHistory={openHistory} on:select={handleSelectDocument} />
          {:else if activeTab === 'document'}
            <div class="document-workflow">
              <DocumentForm {draft} {clients} {saving} on:save={handleSaveDocument} on:reset={() => createNewDocument(activeDocumentType)} on:exportPdf={handleExportPdf} on:print={handlePrint} />
              <DocumentTypeList {documents} documentType={activeDocumentType} on:create={(event) => createNewDocument(event.detail)} on:select={handleSelectDocument} on:delete={handleDeleteDocument} on:complete={handleCompleteDocument} />
            </div>
          {:else if activeTab === 'history'}
            <DocumentHistory {documents} filter={historyFilter} on:select={handleSelectDocument} on:delete={handleDeleteDocument} on:complete={handleCompleteDocument} on:filter={handleHistoryFilter} />
          {:else if activeTab === 'clients'}
            <div class="document-workflow">
              <ClientManager {clients} {saving} on:save={handleSaveClient} on:delete={handleDeleteClient} />
            </div>
          {:else}
            <CompanySettings settings={company} {saving} on:save={handleSaveSettings} />
          {/if}
        </div>

        {#if activeTab === 'document'}
          <div class="preview-panel">
            <DocumentPreview {company} document={draft} />
          </div>
        {/if}
      </div>
    </section>
  </main>
{/if}
