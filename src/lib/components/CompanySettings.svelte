<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import type { CompanySettings } from '$lib/types';

  export let settings: CompanySettings;
  export let saving = false;

  const dispatch = createEventDispatcher<{
    save: CompanySettings;
  }>();

  function save(): void {
    dispatch('save', settings);
  }

  function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('File tidak dapat dibaca.'));
      reader.readAsDataURL(file);
    });
  }

  async function updateLogo(event: Event): Promise<void> {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;

    settings.logoDataUrl = await readFile(input.files[0]);
  }

  async function updateSignature(event: Event): Promise<void> {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;

    settings.signatureDataUrl = await readFile(input.files[0]);
  }

  function clearLogo(): void {
    settings.logoDataUrl = '';
  }

  function clearSignature(): void {
    settings.signatureDataUrl = '';
  }
</script>

<AppCard title="Pengaturan Perusahaan" description="Data ini dipakai otomatis pada penawaran, invoice, dan kwitansi.">
  <div class="form-grid two">
    <label>
      <span>Nama Usaha</span>
      <input bind:value={settings.name} />
    </label>

    <label>
      <span>Subjudul Usaha</span>
      <input bind:value={settings.subtitle} />
    </label>

    <label>
      <span>Deskripsi Dokumen</span>
      <input bind:value={settings.businessDescription} />
    </label>

    <label>
      <span>Kota</span>
      <input bind:value={settings.city} />
    </label>

    <label>
      <span>Alamat</span>
      <input bind:value={settings.address} />
    </label>

    <label>
      <span>Telepon</span>
      <input bind:value={settings.phone} />
    </label>

    <label>
      <span>Email</span>
      <input bind:value={settings.email} />
    </label>

    <label>
      <span>Bank</span>
      <input bind:value={settings.bankName} />
    </label>

    <label>
      <span>No. Rekening</span>
      <input bind:value={settings.bankAccountNumber} />
    </label>

    <label>
      <span>Nama Pemilik Rekening</span>
      <input bind:value={settings.bankAccountHolder} />
    </label>

    <label>
      <span>Nama Penandatangan</span>
      <input bind:value={settings.signerName} />
    </label>

    <label>
      <span>Jabatan Penandatangan</span>
      <input bind:value={settings.signerRole} />
    </label>
  </div>

  <div class="color-settings section-gap">
    <label>
      <span>Warna Penawaran</span>
      <input type="color" bind:value={settings.offerColor} />
    </label>

    <label>
      <span>Warna Invoice</span>
      <input type="color" bind:value={settings.invoiceColor} />
    </label>

    <label>
      <span>Warna Kwitansi</span>
      <input type="color" bind:value={settings.receiptColor} />
    </label>
  </div>

  <div class="notes-grid section-gap">
    <label>
      <span>Catatan Penawaran</span>
      <textarea rows="4" bind:value={settings.defaultOfferNote}></textarea>
    </label>

    <label>
      <span>Catatan Invoice</span>
      <textarea rows="4" bind:value={settings.defaultInvoiceNote}></textarea>
    </label>

    <label>
      <span>Catatan Kwitansi</span>
      <textarea rows="4" bind:value={settings.defaultReceiptNote}></textarea>
    </label>
  </div>

  <div class="asset-grid">
    <div class="asset-box">
      <div>
        <h3>Logo</h3>
        <p>Opsional, ditampilkan di header invoice.</p>
      </div>
      {#if settings.logoDataUrl}
        <img src={settings.logoDataUrl} alt="Logo" />
      {/if}
      <input type="file" accept="image/*" on:change={updateLogo} />
      <AppButton variant="ghost" disabled={!settings.logoDataUrl} on:click={clearLogo}>Hapus Logo</AppButton>
    </div>

    <div class="asset-box">
      <div>
        <h3>Tanda Tangan</h3>
        <p>Opsional, digunakan untuk area tanda tangan.</p>
      </div>
      {#if settings.signatureDataUrl}
        <img src={settings.signatureDataUrl} alt="Tanda tangan" />
      {/if}
      <input type="file" accept="image/*" on:change={updateSignature} />
      <AppButton variant="ghost" disabled={!settings.signatureDataUrl} on:click={clearSignature}>Hapus Tanda Tangan</AppButton>
    </div>
  </div>

  <div class="action-row">
    <AppButton disabled={saving} on:click={save}>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</AppButton>
  </div>
</AppCard>
