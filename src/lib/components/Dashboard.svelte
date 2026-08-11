<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import { getAppDocumentLabel } from '$lib/i18n';
  import type { DashboardSummary, DocumentLanguage, DocumentRecord, DocumentType } from '$lib/types';
  import { formatCurrency, formatDocumentDate } from '$lib/utils/format';

  export let summary: DashboardSummary[] = [];
  export let documents: DocumentRecord[] = [];
  export let language: DocumentLanguage = 'id';

  const dispatch = createEventDispatcher<{
    create: DocumentType;
    openHistory: void;
    select: DocumentRecord;
  }>();

  $: isEnglish = language === 'en';
  $: totalDocuments = summary.reduce((total, item) => total + item.count, 0);
  $: totalValue = summary.reduce((total, item) => total + item.total, 0);
  $: recentDocuments = documents.slice(0, 6);

  function createDocument(documentType: DocumentType): void {
    dispatch('create', documentType);
  }

  function openHistory(): void {
    dispatch('openHistory');
  }

  function selectDocument(document: DocumentRecord): void {
    dispatch('select', document);
  }
</script>

<AppCard title="Dashboard" description={isEnglish ? 'Overview of saved quotations, invoices, and receipts.' : 'Ringkasan penawaran, invoice, dan kwitansi yang tersimpan.'}>
  <div class="dashboard-hero professional-dashboard-hero">
    <div>
      <span>{isEnglish ? 'Total Documents' : 'Total Dokumen'}</span>
      <strong>{totalDocuments}</strong>
    </div>
    <div>
      <span>{isEnglish ? 'Total Value' : 'Total Nominal'}</span>
      <strong>{formatCurrency(totalValue)}</strong>
    </div>
  </div>

  <div class="dashboard-grid">
    {#each summary as item (item.documentType)}
      <article class="dashboard-card professional-dashboard-card">
        <div>
          <span>{getAppDocumentLabel(item.documentType, language)}</span>
          <strong>{item.count}</strong>
          <small>{formatCurrency(item.total)}</small>
        </div>
        <AppButton variant="secondary" on:click={() => createDocument(item.documentType)}>{isEnglish ? 'Create' : 'Buat'} {getAppDocumentLabel(item.documentType, language)}</AppButton>
      </article>
    {/each}
  </div>

  <div class="dashboard-section">
    <div class="items-header compact">
      <div>
        <h3>{isEnglish ? 'Recent Documents' : 'Dokumen Terbaru'}</h3>
        <p>{isEnglish ? 'Latest quotation, invoice, and receipt activity.' : 'Aktivitas terbaru dari penawaran, invoice, dan kwitansi.'}</p>
      </div>
      <AppButton variant="ghost" on:click={openHistory}>{isEnglish ? 'View History' : 'Lihat Riwayat'}</AppButton>
    </div>

    {#if recentDocuments.length === 0}
      <div class="empty-state small">
        <strong>{isEnglish ? 'No documents yet' : 'Belum ada dokumen'}</strong>
        <p>{isEnglish ? 'Saved documents will appear on the dashboard.' : 'Dokumen yang disimpan akan tampil di dashboard.'}</p>
      </div>
    {:else}
      <div class="history-list compact">
        {#each recentDocuments as document (document.id)}
          <button class="recent-item" type="button" on:click={() => selectDocument(document)}>
            <span>{getAppDocumentLabel(document.documentType, language)}</span>
            <strong>{document.documentNumber}</strong>
            <small>{document.customerName || '-'} · {formatDocumentDate(document.issueDate, language)} · {formatCurrency(document.total)}</small>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</AppCard>
