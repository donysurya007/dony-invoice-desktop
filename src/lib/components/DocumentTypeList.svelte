<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import { documentConfigs, getPrimaryActionLabel, getStatusClass, getStatusLabel } from '$lib/document-config';
  import type { DocumentRecord, DocumentType } from '$lib/types';
  import { formatCurrency, formatDateIndonesia } from '$lib/utils/format';

  export let documents: DocumentRecord[] = [];
  export let documentType: DocumentType;

  const dispatch = createEventDispatcher<{
    create: DocumentType;
    select: DocumentRecord;
    delete: DocumentRecord;
    complete: DocumentRecord;
  }>();

  $: config = documentConfigs[documentType];
  $: filteredDocuments = documents.filter((document) => document.documentType === documentType);

  function createDocument(): void {
    dispatch('create', documentType);
  }

  function selectDocument(document: DocumentRecord): void {
    dispatch('select', document);
  }

  function deleteDocument(document: DocumentRecord): void {
    dispatch('delete', document);
  }

  function completeDocument(document: DocumentRecord): void {
    dispatch('complete', document);
  }
</script>

<AppCard title={`Daftar ${config.menuLabel}`} description={`Data ${config.menuLabel.toLowerCase()} yang sudah disimpan.`}>
  <div class="list-toolbar">
    <span>{filteredDocuments.length} Dokumen</span>
    <AppButton variant="secondary" on:click={createDocument}>{config.menuLabel} Baru</AppButton>
  </div>

  {#if filteredDocuments.length === 0}
    <div class="empty-state small">
      <strong>{config.emptyTitle}</strong>
      <p>{config.emptyDescription}</p>
    </div>
  {:else}
    <div class="document-list">
      {#each filteredDocuments as document (document.id)}
        <article class="document-list-item">
          <button class="document-list-main" type="button" on:click={() => selectDocument(document)}>
            <span>{document.documentNumber}</span>
            <strong>{document.customerName || '-'}</strong>
            <small>{formatDateIndonesia(document.issueDate)} · {formatCurrency(document.total)}</small>
          </button>
          <div class="document-list-actions">
            <span class="status-pill {getStatusClass(document.status)}">{getStatusLabel(document.status, document.documentType)}</span>
            <AppButton variant="ghost" disabled={document.status === 'approved' || document.status === 'paid'} on:click={() => completeDocument(document)}>{getPrimaryActionLabel(document.documentType)}</AppButton>
            <AppButton variant="danger" on:click={() => deleteDocument(document)}>Hapus</AppButton>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</AppCard>
