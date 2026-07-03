<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import type { InvoiceRecord } from '$lib/types';
  import { formatCurrency, formatDateIndonesia } from '$lib/utils/format';

  export let invoices: InvoiceRecord[] = [];

  const dispatch = createEventDispatcher<{
    select: InvoiceRecord;
    delete: InvoiceRecord;
    paid: InvoiceRecord;
  }>();

  function selectInvoice(invoice: InvoiceRecord): void {
    dispatch('select', invoice);
  }

  function deleteInvoice(invoice: InvoiceRecord): void {
    dispatch('delete', invoice);
  }

  function markPaid(invoice: InvoiceRecord): void {
    dispatch('paid', invoice);
  }
</script>

<AppCard title="Riwayat Invoice" description="Invoice tersimpan di database lokal SQLite.">
  {#if invoices.length === 0}
    <div class="empty-state">
      <strong>Belum ada invoice</strong>
      <p>Invoice yang disimpan akan tampil di sini.</p>
    </div>
  {:else}
    <div class="history-list">
      {#each invoices as invoice (invoice.id)}
        <article class="history-item">
          <button class="history-main" type="button" on:click={() => selectInvoice(invoice)}>
            <strong>{invoice.invoiceNumber}</strong>
            <span>{invoice.customerName}</span>
            <small>{formatDateIndonesia(invoice.issueDate)} · {formatCurrency(invoice.total)}</small>
          </button>
          <div class="history-actions">
            <span class="status-pill {invoice.status}">{invoice.status === 'paid' ? 'Lunas' : invoice.status === 'cancelled' ? 'Batal' : 'Draft'}</span>
            <AppButton variant="ghost" disabled={invoice.status === 'paid'} on:click={() => markPaid(invoice)}>Lunas</AppButton>
            <AppButton variant="danger" on:click={() => deleteInvoice(invoice)}>Hapus</AppButton>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</AppCard>
