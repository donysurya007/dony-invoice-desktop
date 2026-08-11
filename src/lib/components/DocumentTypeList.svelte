<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import { getPrimaryActionLabel, getStatusClass, getStatusLabel } from '$lib/document-config';
  import { getAppDocumentLabel } from '$lib/i18n';
  import type { DocumentLanguage, DocumentRecord, DocumentType } from '$lib/types';
  import { formatCurrency, formatDocumentDate } from '$lib/utils/format';

  export let documents: DocumentRecord[] = [];
  export let documentType: DocumentType;
  export let language: DocumentLanguage = 'id';

  const dispatch = createEventDispatcher<{
    create: DocumentType;
    select: DocumentRecord;
    delete: DocumentRecord;
    complete: DocumentRecord;
  }>();

  $: isEnglish = language === 'en';
  $: documentLabel = getAppDocumentLabel(documentType, language);
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

  function getRecipientMeta(document: DocumentRecord): string {
    return document.customerCompany || document.customerAddress || '-';
  }
</script>

<AppCard title={`${isEnglish ? 'Saved' : 'Daftar'} ${documentLabel}`} description={isEnglish ? `Saved ${documentLabel.toLowerCase()} documents.` : `Data ${documentLabel.toLowerCase()} yang sudah disimpan.`}>
  <div class="list-toolbar">
    <span>{filteredDocuments.length} {isEnglish ? 'Documents' : 'Dokumen'}</span>
    <AppButton variant="secondary" on:click={createDocument}>{isEnglish ? 'New' : 'Baru'} {documentLabel}</AppButton>
  </div>

  {#if filteredDocuments.length === 0}
    <div class="empty-state small">
      <strong>{isEnglish ? `No ${documentLabel.toLowerCase()} yet` : `Belum ada ${documentLabel.toLowerCase()}`}</strong>
      <p>{isEnglish ? `Saved ${documentLabel.toLowerCase()} documents will appear here.` : `${documentLabel} yang disimpan akan tampil di sini.`}</p>
    </div>
  {:else}
    <div class="document-list">
      {#each filteredDocuments as document (document.id)}
        <article class="document-list-item">
          <button class="document-list-main" type="button" on:click={() => selectDocument(document)}>
            <span>{document.documentNumber}</span>
            <strong>{document.customerName || '-'}</strong>
            <small>{getRecipientMeta(document)} · {formatDocumentDate(document.issueDate, language)} · {formatCurrency(document.total)}</small>
          </button>
          <div class="document-list-actions">
            <span class="status-pill {getStatusClass(document.status)}">{getStatusLabel(document.status, document.documentType, language)}</span>
            <AppButton variant="ghost" disabled={document.status === 'approved' || document.status === 'paid'} on:click={() => completeDocument(document)}>{getPrimaryActionLabel(document.documentType, language)}</AppButton>
            <AppButton variant="danger" on:click={() => deleteDocument(document)}>{isEnglish ? 'Delete' : 'Hapus'}</AppButton>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</AppCard>
