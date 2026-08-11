<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import { getPrimaryActionLabel, getStatusClass, getStatusLabel } from '$lib/document-config';
  import { getAppDocumentLabel } from '$lib/i18n';
  import type { DocumentLanguage, DocumentRecord, DocumentType } from '$lib/types';
  import { formatCurrency, formatDocumentDate } from '$lib/utils/format';

  export let documents: DocumentRecord[] = [];
  export let filter: DocumentType | 'all' = 'all';
  export let language: DocumentLanguage = 'id';

  const dispatch = createEventDispatcher<{
    select: DocumentRecord;
    delete: DocumentRecord;
    complete: DocumentRecord;
    filter: DocumentType | 'all';
  }>();

  $: isEnglish = language === 'en';
  $: filteredDocuments = filter === 'all' ? documents : documents.filter((document) => document.documentType === filter);
  $: emptyTitle = isEnglish ? 'No documents yet' : 'Belum ada dokumen';
  $: emptyDescription = isEnglish ? 'Saved documents will appear here.' : 'Dokumen yang disimpan akan tampil di sini.';

  function selectDocument(document: DocumentRecord): void {
    dispatch('select', document);
  }

  function deleteDocument(document: DocumentRecord): void {
    dispatch('delete', document);
  }

  function completeDocument(document: DocumentRecord): void {
    dispatch('complete', document);
  }

  function setFilter(value: DocumentType | 'all'): void {
    dispatch('filter', value);
  }

  function getRecipientMeta(document: DocumentRecord): string {
    return document.customerCompany || document.customerAddress || '-';
  }
</script>

<AppCard title={isEnglish ? 'Document History' : 'Riwayat Dokumen'} description={isEnglish ? 'Quotations, invoices, and receipts stored in the local SQLite database.' : 'Penawaran, invoice, dan kwitansi tersimpan di database SQLite lokal.'}>
  <div class="filter-row">
    <button class:active={filter === 'all'} type="button" on:click={() => setFilter('all')}>{isEnglish ? 'All' : 'Semua'}</button>
    <button class:active={filter === 'offer'} type="button" on:click={() => setFilter('offer')}>{getAppDocumentLabel('offer', language)}</button>
    <button class:active={filter === 'invoice'} type="button" on:click={() => setFilter('invoice')}>{getAppDocumentLabel('invoice', language)}</button>
    <button class:active={filter === 'receipt'} type="button" on:click={() => setFilter('receipt')}>{getAppDocumentLabel('receipt', language)}</button>
  </div>

  {#if filteredDocuments.length === 0}
    <div class="empty-state">
      <strong>{emptyTitle}</strong>
      <p>{emptyDescription}</p>
    </div>
  {:else}
    <div class="history-list">
      {#each filteredDocuments as document (document.id)}
        <article class="history-item">
          <button class="history-main" type="button" on:click={() => selectDocument(document)}>
            <span class="type-label">{getAppDocumentLabel(document.documentType, language)}</span>
            <strong>{document.documentNumber}</strong>
            <span>{document.customerName || '-'}</span>
            <small>{getRecipientMeta(document)} · {formatDocumentDate(document.issueDate, language)} · {formatCurrency(document.total)}</small>
          </button>
          <div class="history-actions">
            <span class="status-pill {getStatusClass(document.status)}">{getStatusLabel(document.status, document.documentType, language)}</span>
            <AppButton variant="ghost" disabled={document.status === 'approved' || document.status === 'paid'} on:click={() => completeDocument(document)}>{getPrimaryActionLabel(document.documentType, language)}</AppButton>
            <AppButton variant="danger" on:click={() => deleteDocument(document)}>{isEnglish ? 'Delete' : 'Hapus'}</AppButton>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</AppCard>
