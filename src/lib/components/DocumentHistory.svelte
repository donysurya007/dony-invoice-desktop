<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import { documentConfigs, getPrimaryActionLabel, getStatusClass, getStatusLabel } from '$lib/document-config';
  import type { DocumentRecord, DocumentType } from '$lib/types';
  import { formatCurrency, formatDateIndonesia } from '$lib/utils/format';

  export let documents: DocumentRecord[] = [];
  export let filter: DocumentType | 'all' = 'all';

  const dispatch = createEventDispatcher<{
    select: DocumentRecord;
    delete: DocumentRecord;
    complete: DocumentRecord;
    filter: DocumentType | 'all';
  }>();

  $: filteredDocuments = filter === 'all' ? documents : documents.filter((document) => document.documentType === filter);
  $: emptyTitle = filter === 'all' ? 'Belum ada dokumen' : documentConfigs[filter].emptyTitle;
  $: emptyDescription = filter === 'all' ? 'Dokumen yang disimpan akan tampil di sini.' : documentConfigs[filter].emptyDescription;

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
</script>

<AppCard title="Riwayat Dokumen" description="Penawaran, invoice, dan kwitansi tersimpan di database lokal SQLite.">
  <div class="filter-row">
    <button class:active={filter === 'all'} type="button" on:click={() => setFilter('all')}>Semua</button>
    <button class:active={filter === 'offer'} type="button" on:click={() => setFilter('offer')}>Penawaran</button>
    <button class:active={filter === 'invoice'} type="button" on:click={() => setFilter('invoice')}>Invoice</button>
    <button class:active={filter === 'receipt'} type="button" on:click={() => setFilter('receipt')}>Kwitansi</button>
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
            <span class="type-label">{documentConfigs[document.documentType].menuLabel}</span>
            <strong>{document.documentNumber}</strong>
            <span>{document.customerName}</span>
            <small>{formatDateIndonesia(document.issueDate)} · {formatCurrency(document.total)}</small>
          </button>
          <div class="history-actions">
            <span class="status-pill {getStatusClass(document.status)}">{getStatusLabel(document.status, document.documentType)}</span>
            <AppButton variant="ghost" disabled={document.status === 'approved' || document.status === 'paid'} on:click={() => completeDocument(document)}>{getPrimaryActionLabel(document.documentType)}</AppButton>
            <AppButton variant="danger" on:click={() => deleteDocument(document)}>Hapus</AppButton>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</AppCard>
