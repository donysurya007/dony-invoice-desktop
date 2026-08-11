<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import RichTextEditor from './RichTextEditor.svelte';
  import { getDocumentConfig, getDocumentText, getPaymentMethodLabel } from '$lib/document-config';
  import { createEmptyItem } from '$lib/constants';
  import type { ClientRecord, DocumentDraft, DocumentItemUnit, DocumentLanguage, PaymentMethod } from '$lib/types';
  import { calculateSubtotal, calculateTotal, formatCurrency } from '$lib/utils/format';

  export let draft: DocumentDraft;
  export let clients: ClientRecord[] = [];
  export let saving = false;
  export let appLanguage: DocumentLanguage = 'id';

  const dispatch = createEventDispatcher<{
    save: DocumentDraft;
    reset: void;
    exportPdf: DocumentDraft;
    print: void;
  }>();

  const paymentMethods: PaymentMethod[] = ['Bank Transfer', 'Tunai', 'QRIS', 'E-Wallet'];
  const itemUnits: DocumentItemUnit[] = ['qty', 'mandays'];

  $: isEnglish = appLanguage === 'en';
  $: config = getDocumentConfig(draft.documentType, appLanguage);
  $: text = getDocumentText(appLanguage);
  $: subtotal = calculateSubtotal(draft.items);
  $: total = calculateTotal(draft.items, draft.tax);

  function addItem(): void {
    draft.items = [...draft.items, createEmptyItem(draft.language)];
  }

  function removeItem(index: number): void {
    if (draft.items.length === 1) return;
    draft.items = draft.items.filter((_, itemIndex) => itemIndex !== index);
  }

  function buildClientDetail(client: ClientRecord): string {
    return [client.detail, client.address, client.phone, client.email].filter(Boolean).join(' · ');
  }

  function getClientOptionLabel(client: ClientRecord): string {
    if (client.companyName) return `${client.name} — ${client.companyName}`;

    return client.name;
  }

  function selectClient(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) return;

    const client = clients.find((item) => item.id === select.value);
    draft.clientId = select.value;

    if (!client) return;

    draft.customerName = client.name;
    draft.customerCompany = client.companyName;
    draft.customerDetail = buildClientDetail(client);
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

<div class="document-editor-card">
  <AppCard title={`${isEnglish ? 'Create' : 'Buat'} ${config.menuLabel}`} description={isEnglish ? 'Complete the document, recipient, and service details. The A4 preview updates automatically.' : 'Lengkapi data dokumen, penerima, dan layanan. Preview A4 diperbarui otomatis.'}>
    <section class="editor-section editor-section-first">
      <div class="editor-section-title">
        <span>01</span>
        <div>
          <h3>{isEnglish ? 'Document Information' : 'Informasi Dokumen'}</h3>
          <p>{isEnglish ? 'Number, language, payment method, and document dates.' : 'Nomor, bahasa, metode pembayaran, dan tanggal dokumen.'}</p>
        </div>
      </div>

      <div class="form-grid two">
        <label>
          <span>{config.numberInputLabel}</span>
          <input bind:value={draft.documentNumber} />
        </label>

        <label>
          <span>{text.documentLanguage}</span>
          <select bind:value={draft.language}>
            <option value="id">Indonesia</option>
            <option value="en">English</option>
          </select>
        </label>

        <label>
          <span>{isEnglish ? 'Payment Method' : 'Metode Bayar'}</span>
          <select bind:value={draft.paymentMethod}>
            {#each paymentMethods as method}
              <option value={method}>{getPaymentMethodLabel(method, appLanguage)}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>{isEnglish ? 'Date' : 'Tanggal'}</span>
          <input type="date" bind:value={draft.issueDate} />
        </label>

        <label>
          <span>{config.secondaryDateLabel}</span>
          <input type="date" bind:value={draft.dueDate} />
        </label>
      </div>
    </section>

    <section class="editor-section client-editor-section">
      <div class="editor-section-title">
        <span>02</span>
        <div>
          <h3>{isEnglish ? 'Client Information' : 'Informasi Klien'}</h3>
          <p>{isEnglish ? 'The client name is the main recipient. The company name is separate.' : 'Nama klien menjadi penerima utama. Nama perusahaan tetap terpisah.'}</p>
        </div>
      </div>

      <div class="client-identity-grid">
        <label class="client-select-field">
          <span>{text.selectClient}</span>
          <select bind:value={draft.clientId} on:change={selectClient}>
            <option value="">{text.manualInput}</option>
            {#each clients as client (client.id)}
              <option value={client.id}>{getClientOptionLabel(client)}</option>
            {/each}
          </select>
        </label>

        <label class="client-primary-field">
          <span>{text.clientName}</span>
          <input bind:value={draft.customerName} on:input={clearClientSelection} placeholder={isEnglish ? 'Example: Mr. Alain' : 'Contoh: Mr. Alain'} />
        </label>

        <label>
          <span>{text.clientCompany}</span>
          <input bind:value={draft.customerCompany} on:input={clearClientSelection} placeholder={isEnglish ? 'Example: Bali Kennel' : 'Contoh: Bali Kennel'} />
        </label>

        <label>
          <span>{config.detailLabel}</span>
          <input bind:value={draft.customerDetail} on:input={clearClientSelection} placeholder={isEnglish ? 'Address, phone, email, or other details' : 'Alamat, telepon, email, atau keterangan lain'} />
        </label>
      </div>
    </section>

    <section class="editor-section">
      <div class="editor-section-title editor-section-title-action">
        <span>03</span>
        <div>
          <h3>{isEnglish ? `${config.menuLabel} Items` : `Item ${config.menuLabel}`}</h3>
          <p>{isEnglish ? 'Add service or payment items required by this document.' : 'Tambahkan layanan atau pembayaran yang diperlukan pada dokumen.'}</p>
        </div>
        <AppButton variant="secondary" on:click={addItem}>{isEnglish ? 'Add Item' : 'Tambah Item'}</AppButton>
      </div>

      <div class="items-list professional-items">
        {#each draft.items as item, index (item.itemKey)}
          <div class="item-card professional-item-card">
            <div class="item-card-heading">
              <strong>{isEnglish ? `Item ${index + 1}` : `Item ${index + 1}`}</strong>
              <AppButton variant="ghost" disabled={draft.items.length === 1} on:click={() => removeItem(index)}>{isEnglish ? 'Delete' : 'Hapus'}</AppButton>
            </div>

            <div class="form-grid item professional-item-grid">
              <label>
                <span>{isEnglish ? 'Description' : 'Deskripsi'}</span>
                <input bind:value={item.description} />
              </label>

              <label>
                <span>{text.quantity}</span>
                <input type="number" min="0" step="1" bind:value={item.quantity} />
              </label>

              <label>
                <span>{text.itemUnit}</span>
                <select bind:value={item.unit}>
                  {#each itemUnits as unit}
                    <option value={unit}>{unit === 'mandays' ? 'Mandays' : 'Qty'}</option>
                  {/each}
                </select>
              </label>

              <label>
                <span>{item.unit === 'mandays' ? (isEnglish ? 'Rate / Manday' : 'Tarif / Manday') : text.unitPrice}</span>
                <input type="number" min="0" step="1000" bind:value={item.unitPrice} />
              </label>
            </div>

            <label>
              <span>{isEnglish ? 'Item Note' : 'Catatan Item'}</span>
              <RichTextEditor bind:value={item.note} language={appLanguage} />
            </label>

            <div class="item-amount">
              <span>{isEnglish ? 'Line Total' : 'Total Item'}</span>
              <strong>{formatCurrency(item.quantity * item.unitPrice)}</strong>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <section class="editor-section editor-section-last">
      <div class="editor-section-title">
        <span>04</span>
        <div>
          <h3>{isEnglish ? 'Totals & Notes' : 'Total & Catatan'}</h3>
          <p>{isEnglish ? 'Set tax and an optional note for this document.' : 'Atur pajak dan catatan opsional untuk dokumen ini.'}</p>
        </div>
      </div>

      <div class="form-grid two">
        <label>
          <span>{text.tax}</span>
          <input type="number" min="0" step="1000" bind:value={draft.tax} />
        </label>

        <label>
          <span>{isEnglish ? 'Document Note' : 'Catatan Dokumen'}</span>
          <textarea rows="3" bind:value={draft.serviceNote} placeholder={isEnglish ? 'Leave blank to use the default document note' : 'Kosongkan untuk menggunakan catatan default dokumen'}></textarea>
        </label>
      </div>
    </section>

    <div class="document-form-footer">
      <div class="document-total-summary">
        <div>
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <div>
          <span>{config.totalLabel}</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      </div>

      <div class="document-form-actions">
        <AppButton variant="ghost" on:click={reset}>{isEnglish ? `New ${config.menuLabel}` : `${config.menuLabel} Baru`}</AppButton>
        <AppButton variant="secondary" on:click={printDocument}>Print</AppButton>
        <AppButton variant="secondary" on:click={exportPdf}>Export PDF</AppButton>
        <AppButton disabled={saving} on:click={save}>{saving ? (isEnglish ? 'Saving...' : 'Menyimpan...') : `${isEnglish ? 'Save' : 'Simpan'} ${config.menuLabel}`}</AppButton>
      </div>
    </div>
  </AppCard>
</div>
