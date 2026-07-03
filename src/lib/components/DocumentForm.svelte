<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import RichTextEditor from './RichTextEditor.svelte';
  import { documentConfigs } from '$lib/document-config';
  import { createEmptyItem } from '$lib/constants';
  import type { ClientRecord, DocumentDraft, PaymentMethod } from '$lib/types';
  import { calculateSubtotal, calculateTotal, formatCurrency } from '$lib/utils/format';

  export let draft: DocumentDraft;
  export let clients: ClientRecord[] = [];
  export let saving = false;

  const dispatch = createEventDispatcher<{
    save: DocumentDraft;
    reset: void;
    exportPdf: DocumentDraft;
    print: void;
  }>();

  const paymentMethods: PaymentMethod[] = ['Bank Transfer', 'Tunai', 'QRIS', 'E-Wallet'];

  $: config = documentConfigs[draft.documentType];
  $: subtotal = calculateSubtotal(draft.items);
  $: total = calculateTotal(draft.items, draft.tax);

  function addItem(): void {
    draft.items = [...draft.items, createEmptyItem()];
  }

  function removeItem(index: number): void {
    if (draft.items.length === 1) return;
    draft.items = draft.items.filter((_, itemIndex) => itemIndex !== index);
  }

  function selectClient(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) return;

    const client = clients.find((item) => item.id === select.value);
    draft.clientId = select.value;

    if (!client) return;

    draft.customerName = client.name;
    draft.customerDetail = client.detail || client.address || '';
  }

  function clearClientSelection(): void {
    draft.clientId = '';
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

  function printDocument(): void {
    dispatch('print');
  }
</script>

<AppCard title={`Buat ${config.menuLabel}`} description="Isi data dokumen, layanan, rekening, lalu simpan atau cetak PDF.">
  <div class="form-grid two">
    <label>
      <span>{config.numberInputLabel}</span>
      <input bind:value={draft.documentNumber} />
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
      <span>{config.secondaryDateLabel}</span>
      <input type="date" bind:value={draft.dueDate} />
    </label>
  </div>

  <div class="form-grid two section-gap">
    <label>
      <span>Pilih Klien</span>
      <select bind:value={draft.clientId} on:change={selectClient}>
        <option value="">Input manual</option>
        {#each clients as client (client.id)}
          <option value={client.id}>{client.name}</option>
        {/each}
      </select>
    </label>

    <label>
      <span>Nama Pelanggan</span>
      <input bind:value={draft.customerName} on:input={clearClientSelection} />
    </label>

    <label class="full-field">
      <span>{config.detailLabel}</span>
      <input bind:value={draft.customerDetail} on:input={clearClientSelection} />
    </label>
  </div>

  <div class="items-header">
    <div>
      <h3>Item {config.menuLabel}</h3>
      <p>Tambahkan item sesuai kebutuhan dokumen.</p>
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
          <span>Catatan Item</span>
          <RichTextEditor bind:value={item.note} />
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
      <span>Catatan Dokumen</span>
      <textarea rows="3" bind:value={draft.serviceNote} placeholder="Kosongkan untuk memakai catatan default perusahaan"></textarea>
    </label>
  </div>

  <div class="summary-inline">
    <div>
      <span>Subtotal</span>
      <strong>{formatCurrency(subtotal)}</strong>
    </div>
    <div>
      <span>{config.totalLabel}</span>
      <strong>{formatCurrency(total)}</strong>
    </div>
  </div>

  <div class="action-row">
    <AppButton variant="ghost" on:click={reset}>{config.menuLabel} Baru</AppButton>
    <AppButton variant="secondary" on:click={printDocument}>Print</AppButton>
    <AppButton variant="secondary" on:click={exportPdf}>Export PDF</AppButton>
    <AppButton disabled={saving} on:click={save}>{saving ? 'Menyimpan...' : `Simpan ${config.menuLabel}`}</AppButton>
  </div>
</AppCard>
