<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import type { CompanySettings, DocumentLanguage } from '$lib/types';

  export let settings: CompanySettings;
  export let saving = false;

  const dispatch = createEventDispatcher<{
    save: CompanySettings;
    languageChange: DocumentLanguage;
  }>();

  $: isEnglish = settings.appLanguage === 'en';

  function save(): void {
    dispatch('save', settings);
  }

  function changeAppLanguage(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) return;

    settings.appLanguage = select.value === 'en' ? 'en' : 'id';
    dispatch('languageChange', settings.appLanguage);
  }

  function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(isEnglish ? 'The file could not be read.' : 'File tidak dapat dibaca.'));
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

<div class="settings-page">
  <AppCard title={isEnglish ? 'Application & Document Settings' : 'Pengaturan Aplikasi & Dokumen'} description={isEnglish ? 'Configure the issuer identity, language, bank account, document style, and default notes.' : 'Atur identitas penerbit, bahasa, rekening, tampilan dokumen, dan catatan default.'}>
    <div class="settings-info">
      <strong>{isEnglish ? 'Issuer data' : 'Data penerbit'}</strong>
      <span>{isEnglish ? 'This page contains your company identity as the document issuer. Client names and client companies are managed separately in the Clients menu.' : 'Halaman ini berisi identitas perusahaan Anda sebagai penerbit dokumen. Nama klien dan perusahaan klien dikelola terpisah pada menu Klien.'}</span>
    </div>

    <section class="settings-section">
      <div class="settings-section-heading">
        <div>
          <span class="settings-kicker">01</span>
          <h3>{isEnglish ? 'Language' : 'Bahasa'}</h3>
          <p>{isEnglish ? 'Set the application language and the default language for new documents.' : 'Tentukan bahasa aplikasi dan bahasa default untuk dokumen baru.'}</p>
        </div>
      </div>

      <div class="form-grid two">
        <label>
          <span>{isEnglish ? 'Application Language' : 'Bahasa Aplikasi'}</span>
          <select value={settings.appLanguage} on:change={changeAppLanguage}>
            <option value="id">Indonesia</option>
            <option value="en">English</option>
          </select>
        </label>

        <label>
          <span>{isEnglish ? 'Default Document Language' : 'Bahasa Dokumen Default'}</span>
          <select bind:value={settings.defaultDocumentLanguage}>
            <option value="id">Indonesia</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>
    </section>

    <section class="settings-section">
      <div class="settings-section-heading">
        <div>
          <span class="settings-kicker">02</span>
          <h3>{isEnglish ? 'Issuer Identity' : 'Identitas Penerbit'}</h3>
          <p>{isEnglish ? 'Company information displayed in the header and issuer area of documents.' : 'Informasi perusahaan yang tampil pada header dan bagian penerbit dokumen.'}</p>
        </div>
      </div>

      <div class="form-grid two">
        <label>
          <span>{isEnglish ? 'Issuer Company / Business Name' : 'Nama Perusahaan / Usaha Penerbit'}</span>
          <input bind:value={settings.name} />
        </label>

        <label>
          <span>{isEnglish ? 'City' : 'Kota'}</span>
          <input bind:value={settings.city} />
        </label>

        <label>
          <span>{isEnglish ? 'Issuer Address' : 'Alamat Penerbit'}</span>
          <input bind:value={settings.address} />
        </label>

        <label>
          <span>{isEnglish ? 'Issuer Phone' : 'Telepon Penerbit'}</span>
          <input bind:value={settings.phone} />
        </label>

        <label class="full-field">
          <span>{isEnglish ? 'Issuer Email' : 'Email Penerbit'}</span>
          <input type="email" bind:value={settings.email} />
        </label>
      </div>
    </section>

    <section class="settings-section">
      <div class="settings-section-heading">
        <div>
          <span class="settings-kicker">03</span>
          <h3>{isEnglish ? 'Document Identity' : 'Identitas Dokumen'}</h3>
          <p>{isEnglish ? 'Bilingual subtitle and document description used according to each document language.' : 'Subjudul dan deskripsi bilingual yang digunakan sesuai bahasa masing-masing dokumen.'}</p>
        </div>
      </div>

      <div class="language-columns">
        <div class="language-panel">
          <div class="language-panel-title">
            <strong>Indonesia</strong>
            <span>ID</span>
          </div>
          <label>
            <span>Subjudul Usaha</span>
            <input bind:value={settings.subtitle} />
          </label>
          <label>
            <span>Deskripsi Dokumen</span>
            <input bind:value={settings.businessDescription} />
          </label>
          <label>
            <span>Jabatan Penandatangan</span>
            <input bind:value={settings.signerRole} />
          </label>
        </div>

        <div class="language-panel">
          <div class="language-panel-title">
            <strong>English</strong>
            <span>EN</span>
          </div>
          <label>
            <span>Business Subtitle</span>
            <input bind:value={settings.subtitleEn} />
          </label>
          <label>
            <span>Document Description</span>
            <input bind:value={settings.businessDescriptionEn} />
          </label>
          <label>
            <span>Signer Role</span>
            <input bind:value={settings.signerRoleEn} />
          </label>
        </div>
      </div>
    </section>

    <section class="settings-section">
      <div class="settings-section-heading">
        <div>
          <span class="settings-kicker">04</span>
          <h3>{isEnglish ? 'Bank Account & Signer' : 'Rekening & Penandatangan'}</h3>
          <p>{isEnglish ? 'Payment account and signer information printed on the document.' : 'Rekening pembayaran dan informasi penandatangan yang tercetak pada dokumen.'}</p>
        </div>
      </div>

      <div class="form-grid two">
        <label>
          <span>Bank</span>
          <input bind:value={settings.bankName} />
        </label>

        <label>
          <span>{isEnglish ? 'Account Number' : 'No. Rekening'}</span>
          <input bind:value={settings.bankAccountNumber} />
        </label>

        <label>
          <span>{isEnglish ? 'Account Holder Name' : 'Nama Pemilik Rekening'}</span>
          <input bind:value={settings.bankAccountHolder} />
        </label>

        <label>
          <span>{isEnglish ? 'Signer Name' : 'Nama Penandatangan'}</span>
          <input bind:value={settings.signerName} />
        </label>
      </div>
    </section>

    <section class="settings-section">
      <div class="settings-section-heading">
        <div>
          <span class="settings-kicker">05</span>
          <h3>{isEnglish ? 'Document Colors' : 'Warna Dokumen'}</h3>
          <p>{isEnglish ? 'Use a separate accent color for each document type.' : 'Gunakan warna aksen terpisah untuk setiap jenis dokumen.'}</p>
        </div>
      </div>

      <div class="color-settings professional-colors">
        <label>
          <span>{isEnglish ? 'Quotation' : 'Penawaran'}</span>
          <input type="color" bind:value={settings.offerColor} />
        </label>

        <label>
          <span>Invoice</span>
          <input type="color" bind:value={settings.invoiceColor} />
        </label>

        <label>
          <span>{isEnglish ? 'Receipt' : 'Kwitansi'}</span>
          <input type="color" bind:value={settings.receiptColor} />
        </label>
      </div>
    </section>

    <section class="settings-section">
      <div class="settings-section-heading">
        <div>
          <span class="settings-kicker">06</span>
          <h3>{isEnglish ? 'Default Notes' : 'Catatan Default'}</h3>
          <p>{isEnglish ? 'Notes are selected automatically based on the language of each document.' : 'Catatan dipilih otomatis sesuai bahasa pada masing-masing dokumen.'}</p>
        </div>
      </div>

      <div class="language-columns note-language-columns">
        <div class="language-panel">
          <div class="language-panel-title">
            <strong>Indonesia</strong>
            <span>ID</span>
          </div>
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

        <div class="language-panel">
          <div class="language-panel-title">
            <strong>English</strong>
            <span>EN</span>
          </div>
          <label>
            <span>Quotation Note</span>
            <textarea rows="4" bind:value={settings.defaultOfferNoteEn}></textarea>
          </label>
          <label>
            <span>Invoice Note</span>
            <textarea rows="4" bind:value={settings.defaultInvoiceNoteEn}></textarea>
          </label>
          <label>
            <span>Receipt Note</span>
            <textarea rows="4" bind:value={settings.defaultReceiptNoteEn}></textarea>
          </label>
        </div>
      </div>
    </section>

    <section class="settings-section">
      <div class="settings-section-heading">
        <div>
          <span class="settings-kicker">07</span>
          <h3>{isEnglish ? 'Logo & Signature' : 'Logo & Tanda Tangan'}</h3>
          <p>{isEnglish ? 'Optional visual assets displayed on exported and printed documents.' : 'Aset visual opsional yang tampil pada dokumen export dan print.'}</p>
        </div>
      </div>

      <div class="asset-grid">
        <div class="asset-box">
          <div>
            <h3>{isEnglish ? 'Issuer Logo' : 'Logo Penerbit'}</h3>
            <p>{isEnglish ? 'Displayed in the document header.' : 'Ditampilkan pada header dokumen.'}</p>
          </div>
          {#if settings.logoDataUrl}
            <img src={settings.logoDataUrl} alt="Logo" />
          {/if}
          <input type="file" accept="image/*" on:change={updateLogo} />
          <AppButton variant="ghost" disabled={!settings.logoDataUrl} on:click={clearLogo}>{isEnglish ? 'Remove Logo' : 'Hapus Logo'}</AppButton>
        </div>

        <div class="asset-box">
          <div>
            <h3>{isEnglish ? 'Signature' : 'Tanda Tangan'}</h3>
            <p>{isEnglish ? 'Displayed in the issuer signature area.' : 'Ditampilkan pada area tanda tangan penerbit.'}</p>
          </div>
          {#if settings.signatureDataUrl}
            <img src={settings.signatureDataUrl} alt="Tanda tangan" />
          {/if}
          <input type="file" accept="image/*" on:change={updateSignature} />
          <AppButton variant="ghost" disabled={!settings.signatureDataUrl} on:click={clearSignature}>{isEnglish ? 'Remove Signature' : 'Hapus Tanda Tangan'}</AppButton>
        </div>
      </div>
    </section>

    <div class="settings-actions">
      <div>
        <strong>{isEnglish ? 'Ready to save' : 'Siap disimpan'}</strong>
        <span>{isEnglish ? 'Changes are stored in the local application database.' : 'Perubahan disimpan pada database lokal aplikasi.'}</span>
      </div>
      <AppButton disabled={saving} on:click={save}>{saving ? (isEnglish ? 'Saving...' : 'Menyimpan...') : (isEnglish ? 'Save Settings' : 'Simpan Pengaturan')}</AppButton>
    </div>
  </AppCard>
</div>
