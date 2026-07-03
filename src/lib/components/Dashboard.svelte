<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import { documentConfigs } from '$lib/document-config';
  import type { DashboardSummary, DocumentRecord, DocumentType } from '$lib/types';
  import { formatCurrency, formatDateIndonesia } from '$lib/utils/format';

  export let summary: DashboardSummary[] = [];
  export let documents: DocumentRecord[] = [];

  const dispatch = createEventDispatcher<{
    create: DocumentType;
    openHistory: void;
    select: DocumentRecord;
  }>();

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

<AppCard title="Dashboard" description="Ringkasan jumlah penawaran, invoice, dan kwitansi tersimpan di database lokal.">
  <div class="dashboard-hero">
    <div>
      <span>Total Dokumen</span>
      <strong>{totalDocuments}</strong>
    </div>
    <div>
      <span>Total Nominal</span>
      <strong>{formatCurrency(totalValue)}</strong>
    </div>
  </div>

  <div class="dashboard-grid">
    {#each summary as item (item.documentType)}
      <article class="dashboard-card">
        <div>
          <span>{item.label}</span>
          <strong>{item.count}</strong>
          <small>{formatCurrency(item.total)}</small>
        </div>
        <AppButton variant="secondary" on:click={() => createDocument(item.documentType)}>Buat {item.label}</AppButton>
      </article>
    {/each}
  </div>

  <div class="dashboard-section">
    <div class="items-header compact">
      <div>
        <h3>Dokumen Terbaru</h3>
        <p>Data terbaru dari penawaran, invoice, dan kwitansi.</p>
      </div>
      <AppButton variant="ghost" on:click={openHistory}>Lihat Riwayat</AppButton>
    </div>

    {#if recentDocuments.length === 0}
      <div class="empty-state small">
        <strong>Belum ada dokumen</strong>
        <p>Dokumen yang disimpan akan tampil di dashboard.</p>
      </div>
    {:else}
      <div class="history-list compact">
        {#each recentDocuments as document (document.id)}
          <button class="recent-item" type="button" on:click={() => selectDocument(document)}>
            <span>{documentConfigs[document.documentType].menuLabel}</span>
            <strong>{document.documentNumber}</strong>
            <small>{document.customerName} · {formatDateIndonesia(document.issueDate)} · {formatCurrency(document.total)}</small>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</AppCard>
