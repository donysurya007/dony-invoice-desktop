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
  import { getCompletedStatus } from '$lib/document-config';
  import { getAppDocumentLabel, getAppText } from '$lib/i18n';
  import { deleteClient, deleteDocument, getNextDocumentNumber, initDatabase, loadClients, loadCompanySettings, loadDashboardSummary, loadDocuments, saveCompanySettings, upsertClient, upsertDocument } from '$lib/services/db';
  import { exportDocumentPdf } from '$lib/services/pdf';
  import type { ClientDraft, ClientRecord, CompanySettings as CompanySettingsType, DashboardSummary, DocumentDraft, DocumentLanguage, DocumentRecord, DocumentType, ToastMessage } from '$lib/types';

  type Tab = 'dashboard' | 'document' | 'history' | 'clients' | 'settings';

  let activeTab: Tab = 'dashboard';
  let activeDocumentType: DocumentType = 'invoice';
  let historyFilter: DocumentType | 'all' = 'all';
  let loading = true;
  let saving = false;
  let editingDocumentId: string | null = null;
  let company: CompanySettingsType = defaultCompanySettings;
  let appLanguage: DocumentLanguage = defaultCompanySettings.appLanguage;
  let draft: DocumentDraft = createDraft('invoice', `INV-001-DI-${new Date().getFullYear()}`);
  let documents: DocumentRecord[] = [];
  let clients: ClientRecord[] = [];
  let summary: DashboardSummary[] = [];
  let toast: ToastMessage | null = null;

  $: ui = getAppText(appLanguage);
  $: activeDocumentLabel = getAppDocumentLabel(activeDocumentType, appLanguage);
  $: pageTitle = activeTab === 'dashboard'
    ? ui.dashboard
    : activeTab === 'history'
      ? ui.pageHistoryTitle
      : activeTab === 'clients'
        ? ui.pageClientsTitle
        : activeTab === 'settings'
          ? ui.pageSettingsTitle
          : `${activeDocumentLabel} Generator`;
  $: pageDescription = activeTab === 'dashboard'
    ? ui.pageDashboardDescription
    : activeTab === 'history'
      ? ui.pageHistoryDescription
      : activeTab === 'clients'
        ? ui.pageClientsDescription
        : activeTab === 'settings'
          ? ui.pageSettingsDescription
          : ui.documentWorkspaceDescription;

  function showToast(message: string, type: ToastMessage['type'] = 'info'): void {
    toast = { message, type };
    window.setTimeout(() => {
      toast = null;
    }, 2800);
  }

  function cloneDraft(document: DocumentDraft): DocumentDraft {
    return {
      documentType: document.documentType,
      language: document.language,
      documentNumber: document.documentNumber,
      issueDate: document.issueDate,
      dueDate: document.dueDate,
      paymentMethod: document.paymentMethod,
      customerName: document.customerName,
      customerCompany: document.customerCompany,
      customerAddress: document.customerAddress,
      customerPhone: document.customerPhone,
      customerEmail: document.customerEmail,
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
    draft = createDraft(documentType, await getNextDocumentNumber(documentType), company.defaultDocumentLanguage);
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
      const label = getAppDocumentLabel(saved.documentType, appLanguage);
      showToast(appLanguage === 'en' ? `${label} saved successfully.` : `${label} berhasil disimpan.`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : appLanguage === 'en' ? 'Failed to save the document.' : 'Dokumen gagal disimpan.';
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
      showToast(ui.saveClientSuccess, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : ui.saveClientError;
      showToast(message, 'error');
    } finally {
      saving = false;
    }
  }

  async function handleDeleteClient(event: CustomEvent<ClientRecord>): Promise<void> {
    const client = event.detail;
    const clientName = client.name;
    const confirmed = window.confirm(`${ui.deleteClientConfirm} ${clientName}?`);
    if (!confirmed) return;

    await deleteClient(client.id);
    await refreshData();

    if (draft.clientId === client.id) {
      draft.clientId = '';
    }

    showToast(ui.deleteClientSuccess, 'success');
  }

  async function handleSaveSettings(event: CustomEvent<CompanySettingsType>): Promise<void> {
    try {
      saving = true;
      await saveCompanySettings(event.detail);
      company = { ...event.detail };
      appLanguage = company.appLanguage;
      showToast(ui.saveSettingsSuccess, 'success');
    } catch {
      showToast(ui.saveSettingsError, 'error');
    } finally {
      saving = false;
    }
  }

  function handleLanguageChange(event: CustomEvent<DocumentLanguage>): void {
    appLanguage = event.detail;
    company = { ...company, appLanguage: event.detail };
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
    const label = getAppDocumentLabel(selectedDocument.documentType, appLanguage).toLowerCase();
    const confirmed = window.confirm(`${ui.deleteDocumentConfirm} ${label} ${selectedDocument.documentNumber}?`);
    if (!confirmed) return;

    await deleteDocument(selectedDocument.id);
    await refreshData();

    if (editingDocumentId === selectedDocument.id) {
      await createNewDocument(selectedDocument.documentType);
    }

    showToast(ui.deleteDocumentSuccess, 'success');
  }

  async function handleCompleteDocument(event: CustomEvent<DocumentRecord>): Promise<void> {
    const selectedDocument = event.detail;
    const status = getCompletedStatus(selectedDocument.documentType);
    await upsertDocument(selectedDocument.id, cloneDraft(selectedDocument), status);
    await refreshData();
    showToast(ui.updateStatusSuccess, 'success');
  }

  async function handleExportPdf(event: CustomEvent<DocumentDraft>): Promise<void> {
    try {
      const path = await exportDocumentPdf(event.detail, company);
      showToast(`${ui.pdfSaved}: ${path}`, 'success');
    } catch (error) {
      const failed = error instanceof Error && error.message !== 'Dibatalkan';
      showToast(failed ? ui.pdfFailed : ui.pdfCancelled, failed ? 'error' : 'info');
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
      appLanguage = company.appLanguage;
      await refreshData();
      draft = createDraft(activeDocumentType, await getNextDocumentNumber(activeDocumentType), company.defaultDocumentLanguage);
    } catch {
      showToast(ui.databaseLoadError, 'error');
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
      <span>{ui.loading}</span>
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
          <span>{ui.brandSubtitle}</span>
        </div>
      </div>

      <nav>
        <button class:active={activeTab === 'dashboard'} type="button" on:click={() => (activeTab = 'dashboard')}><span class="nav-dot"></span>{ui.dashboard}</button>
        <button class:active={activeTab === 'document' && activeDocumentType === 'offer'} type="button" on:click={() => openDocumentTab('offer')}><span class="nav-dot"></span>{ui.quotation}</button>
        <button class:active={activeTab === 'document' && activeDocumentType === 'invoice'} type="button" on:click={() => openDocumentTab('invoice')}><span class="nav-dot"></span>{ui.invoice}</button>
        <button class:active={activeTab === 'document' && activeDocumentType === 'receipt'} type="button" on:click={() => openDocumentTab('receipt')}><span class="nav-dot"></span>{ui.receipt}</button>
        <button class:active={activeTab === 'history'} type="button" on:click={openHistory}><span class="nav-dot"></span>{ui.history}</button>
        <button class:active={activeTab === 'clients'} type="button" on:click={() => (activeTab = 'clients')}><span class="nav-dot"></span>{ui.clients}</button>
        <button class:active={activeTab === 'settings'} type="button" on:click={() => (activeTab = 'settings')}><span class="nav-dot"></span>{ui.settings}</button>
      </nav>

      <div class="sidebar-footer">
        <AppButton full variant="secondary" on:click={() => createNewDocument(activeDocumentType)}>{appLanguage === 'en' ? `+ New ${activeDocumentLabel}` : `+ ${activeDocumentLabel} Baru`}</AppButton>
      </div>
    </aside>

    <section class="workspace">
      <div class="workspace-header no-print">
        <div>
          <span>{ui.applicationDesktop}</span>
          <h1>{pageTitle}</h1>
        </div>
        <p>{pageDescription}</p>
      </div>

      <div class="content-grid" class:single={activeTab !== 'document'}>
        <div class="editor-panel no-print">
          {#if activeTab === 'dashboard'}
            <Dashboard {summary} {documents} language={appLanguage} on:create={(event) => createNewDocument(event.detail)} on:openHistory={openHistory} on:select={handleSelectDocument} />
          {:else if activeTab === 'document'}
            <div class="document-workflow">
              <DocumentForm {draft} {clients} {saving} {appLanguage} on:save={handleSaveDocument} on:reset={() => createNewDocument(activeDocumentType)} on:exportPdf={handleExportPdf} on:print={handlePrint} />
              <DocumentTypeList {documents} documentType={activeDocumentType} language={appLanguage} on:create={(event) => createNewDocument(event.detail)} on:select={handleSelectDocument} on:delete={handleDeleteDocument} on:complete={handleCompleteDocument} />
            </div>
          {:else if activeTab === 'history'}
            <DocumentHistory {documents} filter={historyFilter} language={appLanguage} on:select={handleSelectDocument} on:delete={handleDeleteDocument} on:complete={handleCompleteDocument} on:filter={handleHistoryFilter} />
          {:else if activeTab === 'clients'}
            <ClientManager {clients} {saving} language={appLanguage} on:save={handleSaveClient} on:delete={handleDeleteClient} />
          {:else}
            <CompanySettings settings={company} {saving} on:save={handleSaveSettings} on:languageChange={handleLanguageChange} />
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
