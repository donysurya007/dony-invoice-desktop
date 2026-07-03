<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import AppButton from './AppButton.svelte';
  import AppCard from './AppCard.svelte';
  import type { ClientDraft, ClientRecord } from '$lib/types';

  export let clients: ClientRecord[] = [];
  export let saving = false;

  const dispatch = createEventDispatcher<{
    save: { id: string | null; draft: ClientDraft };
    delete: ClientRecord;
  }>();

  let editingId: string | null = null;
  let draft: ClientDraft = createEmptyDraft();

  function createEmptyDraft(): ClientDraft {
    return {
      name: '',
      detail: '',
      address: '',
      phone: '',
      email: ''
    };
  }

  function editClient(client: ClientRecord): void {
    editingId = client.id;
    draft = {
      name: client.name,
      detail: client.detail,
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
</script>

<AppCard title="Data Klien" description="Simpan klien agar penawaran, invoice, dan kwitansi tidak perlu diketik ulang.">
  <div class="form-grid two">
    <label>
      <span>Nama Klien</span>
      <input bind:value={draft.name} />
    </label>

    <label>
      <span>Keterangan Klien</span>
      <input bind:value={draft.detail} />
    </label>

    <label>
      <span>Alamat</span>
      <input bind:value={draft.address} />
    </label>

    <label>
      <span>Telepon</span>
      <input bind:value={draft.phone} />
    </label>

    <label class="full-field">
      <span>Email</span>
      <input bind:value={draft.email} />
    </label>
  </div>

  <div class="action-row">
    <AppButton variant="ghost" on:click={reset}>Klien Baru</AppButton>
    <AppButton disabled={saving} on:click={save}>{saving ? 'Menyimpan...' : editingId ? 'Update Klien' : 'Simpan Klien'}</AppButton>
  </div>
</AppCard>

<AppCard title="List Klien" description="Klik klien untuk mengedit data yang tersimpan.">
  {#if clients.length === 0}
    <div class="empty-state small">
      <strong>Belum ada klien</strong>
      <p>Klien yang disimpan akan tampil di sini.</p>
    </div>
  {:else}
    <div class="client-list">
      {#each clients as client (client.id)}
        <article class="client-item">
          <button type="button" on:click={() => editClient(client)}>
            <strong>{client.name}</strong>
            <span>{client.detail || client.address || '-'}</span>
            <small>{client.phone || client.email || '-'}</small>
          </button>
          <AppButton variant="danger" on:click={() => deleteClient(client)}>Hapus</AppButton>
        </article>
      {/each}
    </div>
  {/if}
</AppCard>
