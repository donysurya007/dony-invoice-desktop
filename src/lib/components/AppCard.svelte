<script lang="ts">
  export let title = '';
  export let description = '';
</script>

<section class="app-card">
  {#if title || description}
    <div class="app-card-header">
      {#if title}
        <h2>{title}</h2>
      {/if}
      {#if description}
        <p>{description}</p>
      {/if}
    </div>
  {/if}
  <slot />
</section>
