<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import type { ClientDraft, ClientRecord, DocumentLanguage } from '$lib/types';

  export let clients: ClientRecord[] = [];
  export let saving = false;
  export let language: DocumentLanguage = 'id';

  const dispatch = createEventDispatcher<{
    save: { id: string | null; draft: ClientDraft };
    delete: ClientRecord;
  }>();

  let editingId: string | null = null;
  let draft: ClientDraft = createEmptyDraft();

  $: isEnglish = language === 'en';

  function createEmptyDraft(): ClientDraft {
    return {
      name: '',
      companyName: '',
      address: '',
      phone: '',
      email: ''
    };
  }

  function editClient(client: ClientRecord): void {
    editingId = client.id;
    draft = {
      name: client.name,
      companyName: client.companyName,
      address: client.address,
      phone: client.phone,
      email: client.email
    };
  }

  function reset(): void {
    editingId = null;
    draft = createEmptyDraft();
  }

  function save(): void {
    dispatch('save', { id: editingId, draft });
  }

  function deleteClient(client: ClientRecord): void {
    dispatch('delete', client);
  }

  function getClientHeading(client: ClientRecord): string {
    return client.name;
  }

  function getClientSubheading(client: ClientRecord): string {
    return client.companyName || client.address;
  }

  function getClientMeta(client: ClientRecord): string {
    return [client.address, client.phone, client.email].filter(Boolean).join(' · ');
  }
</script>

<div class="client-manager-grid">
  <AppCard title={editingId ? (isEnglish ? 'Edit Client' : 'Edit Klien') : (isEnglish ? 'New Client' : 'Klien Baru')} description={isEnglish ? 'The client name is the primary recipient. The company name is stored separately.' : 'Nama klien adalah penerima utama. Nama perusahaan disimpan terpisah.'}>
    <div class="client-form-highlight">
      <strong>{isEnglish ? 'Recipient identity' : 'Identitas penerima'}</strong>
      <span>{isEnglish ? 'Do not replace the client name with the company name.' : 'Nama klien tidak digantikan dengan nama perusahaan.'}</span>
    </div>

    <div class="form-grid two">
      <label>
        <span>{isEnglish ? 'Client Name' : 'Nama Klien'}</span>
        <input bind:value={draft.name} placeholder={isEnglish ? 'Example: Mr. Alain' : 'Contoh: Mr. Alain'} />
      </label>

      <label>
        <span>{isEnglish ? 'Client Company Name' : 'Nama Perusahaan Klien'}</span>
        <input bind:value={draft.companyName} placeholder={isEnglish ? 'Example: Bali Kennel' : 'Contoh: Bali Kennel'} />
      </label>

      <label class="full-field">
        <span>{isEnglish ? 'Address' : 'Alamat'}</span>
        <input bind:value={draft.address} />
      </label>

      <label>
        <span>{isEnglish ? 'Phone' : 'Telepon'}</span>
        <input bind:value={draft.phone} />
      </label>

      <label>
        <span>Email</span>
        <input type="email" bind:value={draft.email} />
      </label>
    </div>

    <div class="action-row client-form-actions">
      <AppButton variant="ghost" on:click={reset}>{isEnglish ? 'New Client' : 'Klien Baru'}</AppButton>
      <AppButton disabled={saving} on:click={save}>{saving ? (isEnglish ? 'Saving...' : 'Menyimpan...') : editingId ? (isEnglish ? 'Update Client' : 'Update Klien') : (isEnglish ? 'Save Client' : 'Simpan Klien')}</AppButton>
    </div>
  </AppCard>

  <AppCard title={isEnglish ? 'Client List' : 'Daftar Klien'} description={isEnglish ? 'Select a client to edit saved recipient information.' : 'Pilih klien untuk mengedit informasi penerima yang tersimpan.'}>
    {#if clients.length === 0}
      <div class="empty-state small">
        <strong>{isEnglish ? 'No clients yet' : 'Belum ada klien'}</strong>
        <p>{isEnglish ? 'Saved clients will appear here.' : 'Klien yang disimpan akan tampil di sini.'}</p>
      </div>
    {:else}
      <div class="client-list professional-client-list">
        {#each clients as client (client.id)}
          <article class="client-item professional-client-item">
            <button type="button" on:click={() => editClient(client)}>
              <strong>{getClientHeading(client)}</strong>
              {#if getClientSubheading(client)}
                <span>{getClientSubheading(client)}</span>
              {/if}
              {#if getClientMeta(client)}
                <small>{getClientMeta(client)}</small>
              {/if}
            </button>
            <AppButton variant="danger" on:click={() => deleteClient(client)}>{isEnglish ? 'Delete' : 'Hapus'}</AppButton>
          </article>
        {/each}
      </div>
    {/if}
  </AppCard>
</div>
