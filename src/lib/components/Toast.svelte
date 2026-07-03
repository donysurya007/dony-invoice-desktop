<script lang="ts">
  import type { ToastMessage } from '$lib/types';

  export let toast: ToastMessage | null = null;
</script>

{#if toast}
  <div class="toast {toast.type}">
    {toast.message}
  </div>
{/if}
