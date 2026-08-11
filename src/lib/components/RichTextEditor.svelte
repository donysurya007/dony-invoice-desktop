<script lang="ts">
  import { tick } from 'svelte';
  import type { DocumentLanguage } from '$lib/types';
  import { sanitizeRichText } from '$lib/utils/rich-text';

  export let value = '';
  export let language: DocumentLanguage = 'id';

  let editor: HTMLDivElement;
  let internalValue = '';

  $: sanitizedValue = sanitizeRichText(value);
  $: if (editor && sanitizedValue !== internalValue && editor.innerHTML !== sanitizedValue) {
    editor.innerHTML = sanitizedValue;
    internalValue = sanitizedValue;
  }

  function syncValue(): void {
    const sanitized = sanitizeRichText(editor.innerHTML);
    internalValue = sanitized;
    value = sanitized;
  }

  async function applyCommand(command: string): Promise<void> {
    editor.focus();
    document.execCommand(command, false);
    await tick();
    syncValue();
  }

  async function clearFormat(): Promise<void> {
    editor.focus();
    document.execCommand('removeFormat', false);
    await tick();
    syncValue();
  }
</script>

<div class="rich-text-editor">
  <div class="rich-toolbar" aria-label={language === 'en' ? 'Item note toolbar' : 'Toolbar catatan item'}>
    <button type="button" on:click={() => applyCommand('bold')}>B</button>
    <button type="button" on:click={() => applyCommand('italic')}>I</button>
    <button type="button" on:click={() => applyCommand('underline')}>U</button>
    <button type="button" on:click={() => applyCommand('insertUnorderedList')}>• {language === 'en' ? 'List' : 'Daftar'}</button>
    <button type="button" on:click={() => applyCommand('insertOrderedList')}>1. {language === 'en' ? 'List' : 'Daftar'}</button>
    <button type="button" on:click={clearFormat}>{language === 'en' ? 'Clear' : 'Bersihkan'}</button>
  </div>

  <div
    bind:this={editor}
    class="rich-editor-area"
    contenteditable="true"
    role="textbox"
    aria-multiline="true"
    tabindex="0"
    on:input={syncValue}
    on:blur={syncValue}
  ></div>
</div>
