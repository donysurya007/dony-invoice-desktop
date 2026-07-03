<script lang="ts">
  import { documentConfigs, getDefaultDocumentNote } from '$lib/document-config';
  import type { CompanySettings, DocumentDraft } from '$lib/types';
  import { calculateSubtotal, calculateTotal, formatCurrency, formatDateIndonesia } from '$lib/utils/format';
  import { terbilangRupiah } from '$lib/utils/number-to-words';
  import { sanitizeRichText } from '$lib/utils/rich-text';
  import { documentAccentColor, softenHexColor } from '$lib/utils/color';
  import { paginateDocument } from '$lib/utils/document-pagination';

  export let company: CompanySettings;
  export let document: DocumentDraft;

  $: config = documentConfigs[document.documentType];
  $: subtotal = calculateSubtotal(document.items);
  $: total = calculateTotal(document.items, document.tax);
  $: accentColor = documentAccentColor(company, document.documentType);
  $: paperStyle = `--doc-accent: ${accentColor}; --doc-accent-soft: ${softenHexColor(accentColor)};`;
  $: noteText = document.serviceNote || getDefaultDocumentNote(company, document.documentType);
  $: pages = paginateDocument(document, noteText);

  function noteHtml(value: string): string {
    return sanitizeRichText(value) || '-';
  }
</script>

<div class="document-preview-pages">
  {#each pages as printPage, pageIndex (printPage.pageKey)}
    <section class="invoice-paper" class:invoice-paper-continuation={pageIndex > 0} id={pageIndex === 0 ? 'document-paper' : undefined} style={paperStyle}>
      <div class="invoice-strip"></div>

      <header class="invoice-header">
        <div class="brand-area">
          {#if company.logoDataUrl}
            <img src={company.logoDataUrl} alt="Logo" class="invoice-logo" />
          {:else}
            <h1>{company.name}</h1>
          {/if}
          <p>{company.subtitle}</p>
        </div>

        <div class="invoice-title">
          <h2>{pageIndex > 0 ? `${config.title} LANJUTAN` : config.title}</h2>
          <p>{company.businessDescription}</p>
        </div>
      </header>

      {#if printPage.showDocumentHeader}
        <div class="invoice-top-grid">
          <div class="invoice-box bill-to">
            <span>{config.recipientLabel}</span>
            <strong>{document.customerName || '-'}</strong>
            <p>{document.customerDetail || '-'}</p>
          </div>

          <div class="invoice-meta-table">
            <div><span>{config.numberInputLabel.toUpperCase()}</span><strong>{document.documentNumber}</strong></div>
            <div><span>TANGGAL</span><strong>{formatDateIndonesia(document.issueDate)}</strong></div>
            <div><span>{config.secondaryDateLabel.toUpperCase()}</span><strong>{formatDateIndonesia(document.dueDate)}</strong></div>
            <div><span>METODE BAYAR</span><strong>{document.paymentMethod}</strong></div>
          </div>
        </div>
      {/if}

      {#if printPage.showTable}
        <table class="invoice-table" class:continuation-table={!printPage.showDocumentHeader}>
          <thead>
            <tr>
              <th>{config.tableDescriptionLabel}</th>
              <th>Qty</th>
              <th>Harga Satuan</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {#each printPage.items as item (item.itemKey)}
              <tr>
                <td>
                  <strong>{item.description || '-'}</strong>
                  <div class="rich-content item-note-content">{@html noteHtml(item.note)}</div>
                </td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}

      {#if printPage.showSummary}
        <div class="invoice-lower-grid" class:summary-only={!printPage.showTable}>
          <div class="invoice-box spelled-box">
            <span>TERBILANG</span>
            <strong>{terbilangRupiah(total)}</strong>
          </div>

          <div class="total-table">
            <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
            <div><span>Pajak</span><strong>{formatCurrency(document.tax)}</strong></div>
            <div class="grand-total"><span>{config.totalLabel}</span><strong>{formatCurrency(total)}</strong></div>
          </div>
        </div>

        <div class="invoice-sign-grid">
          <div class="invoice-box bank-box">
            <span>BANK ACCOUNT</span>
            <p>Bank: {company.bankName || '-'}</p>
            <p>No. Rekening: {company.bankAccountNumber || '-'}</p>
            <p>Nama: {company.bankAccountHolder || '-'}</p>
          </div>

          <div class="signature-box">
            <p>{company.city || '-'}, {formatDateIndonesia(document.issueDate)}</p>
            {#if company.signatureDataUrl}
              <img src={company.signatureDataUrl} alt="Tanda tangan" />
            {:else}
              <div class="signature-space"></div>
            {/if}
            <strong>{company.signerName || '-'}</strong>
            {#if company.signerRole}
              <span>{company.signerRole}</span>
            {/if}
          </div>
        </div>

        <div class="invoice-box note-box">
          <span>CATATAN</span>
          <p>{noteText}</p>
        </div>
      {/if}

      <footer class="invoice-footer">
        <span>{config.footerText}</span>
        <span>Halaman {pageIndex + 1} dari {pages.length}</span>
      </footer>
    </section>
  {/each}
</div>
