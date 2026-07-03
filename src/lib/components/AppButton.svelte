<script lang="ts">
  export let type: 'button' | 'submit' = 'button';
  export let variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  export let disabled = false;
  export let full = false;
</script>

<button class="app-button {variant}" class:full {type} {disabled} on:click>
  <slot />
</button>
