<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import type { InvoiceDraft, PaymentMethod } from '$lib/types';
  import { createEmptyItem } from '$lib/constants';
  import { calculateSubtotal, calculateTotal, formatCurrency } from '$lib/utils/format';

  export let draft: InvoiceDraft;
  export let saving = false;

  const dispatch = createEventDispatcher<{
    save: InvoiceDraft;
    reset: void;
    exportPdf: InvoiceDraft;
    print: void;
  }>();

  const paymentMethods: PaymentMethod[] = ['Bank Transfer', 'Tunai', 'QRIS', 'E-Wallet'];

  $: subtotal = calculateSubtotal(draft.items);
  $: total = calculateTotal(draft.items, draft.tax);

  function addItem(): void {
    draft.items = [...draft.items, createEmptyItem()];
  }

  function removeItem(index: number): void {
    if (draft.items.length === 1) return;
    draft.items = draft.items.filter((_, itemIndex) => itemIndex !== index);
  }

  function save(): void {
    dispatch('save', draft);
  }

  function reset(): void {
    dispatch('reset');
  }

  function exportPdf(): void {
    dispatch('exportPdf', draft);
  }

  function printInvoice(): void {
    dispatch('print');
  }
</script>

<AppCard title="Buat Invoice" description="Isi data tagihan, layanan, rekening, lalu simpan atau cetak PDF.">
  <div class="form-grid two">
    <label>
      <span>Nomor Invoice</span>
      <input bind:value={draft.invoiceNumber} />
    </label>

    <label>
      <span>Metode Bayar</span>
      <select bind:value={draft.paymentMethod}>
        {#each paymentMethods as method}
          <option value={method}>{method}</option>
        {/each}
      </select>
    </label>

    <label>
      <span>Tanggal</span>
      <input type="date" bind:value={draft.issueDate} />
    </label>

    <label>
      <span>Jatuh Tempo</span>
      <input type="date" bind:value={draft.dueDate} />
    </label>
  </div>

  <div class="form-grid two section-gap">
    <label>
      <span>Nama Pelanggan</span>
      <input bind:value={draft.customerName} />
    </label>

    <label>
      <span>Keterangan Pelanggan</span>
      <input bind:value={draft.customerDetail} />
    </label>
  </div>

  <div class="items-header">
    <div>
      <h3>Item Layanan</h3>
      <p>Tambahkan layanan sesuai kebutuhan invoice.</p>
    </div>
    <AppButton variant="secondary" on:click={addItem}>Tambah Item</AppButton>
  </div>

  <div class="items-list">
    {#each draft.items as item, index (item.itemKey)}
      <div class="item-card">
        <div class="form-grid item">
          <label>
            <span>Deskripsi</span>
            <input bind:value={item.description} />
          </label>

          <label>
            <span>Qty</span>
            <input type="number" min="0" step="1" bind:value={item.quantity} />
          </label>

          <label>
            <span>Harga Satuan</span>
            <input type="number" min="0" step="1000" bind:value={item.unitPrice} />
          </label>
        </div>

        <label>
          <span>Catatan Layanan</span>
          <textarea rows="3" bind:value={item.note}></textarea>
        </label>

        <div class="item-footer">
          <strong>{formatCurrency(item.quantity * item.unitPrice)}</strong>
          <AppButton variant="ghost" disabled={draft.items.length === 1} on:click={() => removeItem(index)}>Hapus</AppButton>
        </div>
      </div>
    {/each}
  </div>

  <div class="form-grid two section-gap">
    <label>
      <span>Pajak</span>
      <input type="number" min="0" step="1000" bind:value={draft.tax} />
    </label>

    <label>
      <span>Catatan Invoice</span>
      <textarea rows="3" bind:value={draft.serviceNote} placeholder="Kosongkan untuk memakai catatan default perusahaan"></textarea>
    </label>
  </div>

  <div class="summary-inline">
    <div>
      <span>Subtotal</span>
      <strong>{formatCurrency(subtotal)}</strong>
    </div>
    <div>
      <span>Total</span>
      <strong>{formatCurrency(total)}</strong>
    </div>
  </div>

  <div class="action-row">
    <AppButton variant="ghost" on:click={reset}>Invoice Baru</AppButton>
    <AppButton variant="secondary" on:click={printInvoice}>Print</AppButton>
    <AppButton variant="secondary" on:click={exportPdf}>Export PDF</AppButton>
    <AppButton disabled={saving} on:click={save}>{saving ? 'Menyimpan...' : 'Simpan Invoice'}</AppButton>
  </div>
</AppCard>
