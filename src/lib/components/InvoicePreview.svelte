<script lang="ts">
  import type { CompanySettings, InvoiceDraft } from '$lib/types';
  import { calculateSubtotal, calculateTotal, formatCurrency, formatDateIndonesia } from '$lib/utils/format';
  import { terbilangRupiah } from '$lib/utils/number-to-words';

  export let company: CompanySettings;
  export let invoice: InvoiceDraft;

  $: subtotal = calculateSubtotal(invoice.items);
  $: total = calculateTotal(invoice.items, invoice.tax);
</script>

<section class="invoice-paper" id="invoice-paper">
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
      <h2>INVOICE</h2>
      <p>{company.businessDescription}</p>
    </div>
  </header>

  <div class="invoice-top-grid">
    <div class="invoice-box bill-to">
      <span>TAGIHAN KEPADA</span>
      {#if invoice.customerName}<strong>{invoice.customerName}</strong>{/if}
      {#if invoice.customerCompany}<p class="recipient-company">{invoice.customerCompany}</p>{/if}
      {#if invoice.customerAddress}<p>{invoice.customerAddress}</p>{/if}
      {#if invoice.customerPhone}<p>Telepon: {invoice.customerPhone}</p>{/if}
      {#if invoice.customerEmail}<p>Email: {invoice.customerEmail}</p>{/if}
    </div>

    <div class="invoice-meta-table">
      <div><span>NOMOR INVOICE</span><strong>{invoice.invoiceNumber}</strong></div>
      <div><span>TANGGAL</span><strong>{formatDateIndonesia(invoice.issueDate)}</strong></div>
      <div><span>JATUH TEMPO</span><strong>{formatDateIndonesia(invoice.dueDate)}</strong></div>
      <div><span>METODE BAYAR</span><strong>{invoice.paymentMethod}</strong></div>
    </div>
  </div>

  <table class="invoice-table">
    <thead>
      <tr>
        <th>Deskripsi Layanan</th>
        <th>Qty</th>
        <th>Harga Satuan</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {#each invoice.items as item (item.itemKey)}
        <tr>
          <td>
            <strong>{item.description || '-'}</strong>
            <p>{item.note || '-'}</p>
          </td>
          <td>{item.quantity}</td>
          <td>{formatCurrency(item.unitPrice)}</td>
          <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <div class="invoice-lower-grid">
    <div class="invoice-box spelled-box">
      <span>TERBILANG</span>
      <strong>{terbilangRupiah(total)}</strong>
    </div>

    <div class="total-table">
      <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
      <div><span>Pajak</span><strong>{formatCurrency(invoice.tax)}</strong></div>
      <div class="grand-total"><span>Total Tagihan</span><strong>{formatCurrency(total)}</strong></div>
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
      <p>{company.city || '-'}, {formatDateIndonesia(invoice.issueDate)}</p>
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
    <p>{invoice.serviceNote || company.defaultNote}</p>
  </div>

  <footer class="invoice-footer">
    <span>Invoice ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.</span>
    <span>Halaman 1 dari 1</span>
  </footer>
</section>
