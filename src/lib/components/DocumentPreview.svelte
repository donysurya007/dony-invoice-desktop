<script lang="ts">
  import { getDefaultDocumentNote, getDocumentConfig, getDocumentItemUnitLabel, getDocumentText, getPaymentMethodLabel } from '$lib/document-config';
  import type { CompanySettings, DocumentDraft } from '$lib/types';
  import { calculateSubtotal, calculateTotal, formatCurrency, formatDocumentDate } from '$lib/utils/format';
  import { terbilangRupiah } from '$lib/utils/number-to-words';
  import { documentAccentColor, softenHexColor } from '$lib/utils/color';
  import { paginateDocument } from '$lib/utils/document-pagination';

  export let company: CompanySettings;
  export let document: DocumentDraft;

  $: config = getDocumentConfig(document.documentType, document.language);
  $: text = getDocumentText(document.language);
  $: subtotal = calculateSubtotal(document.items);
  $: total = calculateTotal(document.items, document.tax);
  $: accentColor = documentAccentColor(company, document.documentType);
  $: paperStyle = `--doc-accent: ${accentColor}; --doc-accent-soft: ${softenHexColor(accentColor)};`;
  $: noteText = document.serviceNote || getDefaultDocumentNote(company, document.documentType, document.language);
  $: pages = paginateDocument(document, noteText);
  $: companySubtitle = document.language === 'en' ? company.subtitleEn || company.subtitle : company.subtitle;
  $: companyDescription = document.language === 'en' ? company.businessDescriptionEn || company.businessDescription : company.businessDescription;
  $: signerRole = document.language === 'en' ? company.signerRoleEn || company.signerRole : company.signerRole;

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
          <p>{companySubtitle}</p>
          {#if company.address || company.phone || company.email}
            <div class="issuer-meta">
              {#if company.address}
                <span>{company.address}</span>
              {/if}
              {#if company.phone || company.email}
                <span>{[company.phone, company.email].filter(Boolean).join(' · ')}</span>
              {/if}
            </div>
          {/if}
        </div>

        <div class="invoice-title">
          <h2>{pageIndex > 0 ? `${config.title} ${text.continuation}` : config.title}</h2>
          <p>{companyDescription}</p>
        </div>
      </header>

      {#if printPage.showDocumentHeader}
        <div class="invoice-top-grid">
          <div class="invoice-box bill-to">
            <span>{config.recipientLabel}</span>
            <strong>{document.customerName || '-'}</strong>
            {#if document.customerCompany}
              <p class="recipient-company">{document.customerCompany}</p>
            {/if}
            <p class="recipient-detail">{document.customerDetail || '-'}</p>
          </div>

          <div class="invoice-meta-table">
            <div><span>{config.numberInputLabel.toUpperCase()}</span><strong>{document.documentNumber}</strong></div>
            <div><span>{text.date}</span><strong>{formatDocumentDate(document.issueDate, document.language)}</strong></div>
            <div><span>{config.secondaryDateLabel.toUpperCase()}</span><strong>{formatDocumentDate(document.dueDate, document.language)}</strong></div>
            <div><span>{text.paymentMethod}</span><strong>{getPaymentMethodLabel(document.paymentMethod, document.language)}</strong></div>
          </div>
        </div>
      {/if}

      {#if printPage.showTable}
        <table class="invoice-table" class:continuation-table={!printPage.showDocumentHeader}>
          <thead>
            <tr>
              <th>{config.tableDescriptionLabel}</th>
              <th>{text.quantityUnit}</th>
              <th>{text.unitPrice}</th>
              <th>{text.total}</th>
            </tr>
          </thead>
          <tbody>
            {#each printPage.items as item (item.pageItemKey)}
              <tr style={`height: ${item.rowHeight}px`}>
                <td>
                  <strong>{item.description || '-'}{item.continuation ? ` — ${document.language === 'en' ? 'continued' : 'lanjutan'}` : ''}</strong>
                  <div class="paginated-note-lines">
                    {#each item.noteLines as line}
                      <p>{line}</p>
                    {/each}
                  </div>
                </td>
                <td>{item.showValues ? `${item.quantity} ${getDocumentItemUnitLabel(item.unit, document.language)}` : '—'}</td>
                <td>{item.showValues ? `${formatCurrency(item.unitPrice)}${item.unit === 'mandays' ? ' / Manday' : ''}` : '—'}</td>
                <td>{item.showValues ? formatCurrency(item.quantity * item.unitPrice) : '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}

      {#if printPage.showSummary}
        <div class="invoice-lower-grid" class:summary-only={!printPage.showTable}>
          <div class="invoice-box spelled-box">
            <span>{text.amountInWords}</span>
            <strong>{terbilangRupiah(total, document.language)}</strong>
          </div>

          <div class="total-table">
            <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
            <div><span>{text.tax}</span><strong>{formatCurrency(document.tax)}</strong></div>
            <div class="grand-total"><span>{config.totalLabel}</span><strong>{formatCurrency(total)}</strong></div>
          </div>
        </div>

        <div class="invoice-sign-grid">
          <div class="invoice-box bank-box">
            <span>{text.bankAccount}</span>
            <p>Bank: {company.bankName || '-'}</p>
            <p>{text.accountNumber}: {company.bankAccountNumber || '-'}</p>
            <p>{text.accountName}: {company.bankAccountHolder || '-'}</p>
          </div>

          <div class="signature-box">
            <p>{company.city || '-'}, {formatDocumentDate(document.issueDate, document.language)}</p>
            {#if company.signatureDataUrl}
              <img src={company.signatureDataUrl} alt="Tanda tangan" />
            {:else}
              <div class="signature-space"></div>
            {/if}
            <strong>{company.signerName || '-'}</strong>
            {#if signerRole}
              <span>{signerRole}</span>
            {/if}
          </div>
        </div>

        <div class="invoice-box note-box">
          <span>{text.notes}</span>
          <p>{noteText}</p>
        </div>
      {/if}

      <footer class="invoice-footer">
        <span>{config.footerText}</span>
        <span>{text.page} {pageIndex + 1} {text.of} {pages.length}</span>
      </footer>
    </section>
  {/each}
</div>
