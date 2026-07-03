# Dony Invoice Desktop

Dony Invoice Desktop adalah aplikasi desktop untuk membuat dan mengelola dokumen bisnis secara lokal, meliputi penawaran, invoice, dan kwitansi. Aplikasi ini dibuat dengan Tauri, SvelteKit, TypeScript, dan SQLite agar ringan, cepat, dan dapat digunakan tanpa koneksi internet.

## Fitur Utama

- Dashboard ringkasan dokumen
- Manajemen klien
- Pembuatan penawaran
- Pembuatan invoice
- Pembuatan kwitansi
- Nomor dokumen otomatis
- Preview dokumen ukuran A4
- Export PDF multi-halaman
- Print multi-halaman
- Rich text untuk catatan item
- Perhitungan subtotal, pajak, dan total otomatis
- Terbilang rupiah otomatis
- Pengaturan data perusahaan
- Pengaturan rekening bank
- Pengaturan catatan default per jenis dokumen
- Pengaturan warna penawaran, invoice, dan kwitansi
- Riwayat dokumen tersimpan
- Database SQLite lokal

## Jenis Dokumen

| Jenis Dokumen | Format Nomor | Keterangan |
| --- | --- | --- |
| Penawaran | `PNW-001-DI-2026` | Dokumen penawaran pekerjaan atau layanan |
| Invoice | `INV-001-DI-2026` | Dokumen tagihan resmi |
| Kwitansi | `KWT-001-DI-2026` | Dokumen bukti pembayaran |

## Teknologi

- Tauri 2
- SvelteKit 2
- Svelte 5
- TypeScript
- SQLite
- Tauri SQL Plugin
- pdf-lib
- Vite

## Persyaratan Sistem

Sebelum menjalankan aplikasi, pastikan sudah tersedia:

- Node.js
- npm
- Rust
- Tauri prerequisites sesuai sistem operasi yang digunakan

Untuk Windows, pastikan juga environment Rust dan Microsoft Visual Studio Build Tools sudah siap agar proses build Tauri dapat berjalan.

## Instalasi

Clone repository:

```bash
git clone https://github.com/username/dony-invoice-desktop.git
cd dony-invoice-desktop
```

Install dependency:

```bash
npm install
```

Jalankan aplikasi dalam mode development:

```bash
npm run tauri dev
```

## Validasi Project

Cek TypeScript dan Svelte:

```bash
npm run check
```

Build frontend:

```bash
npm run build
```

## Build Aplikasi Desktop

Build installer desktop:

```bash
npm run tauri build
```

Hasil build tersedia di folder:

```txt
src-tauri/target/release/bundle
```

## Struktur Project

```txt
dony-invoice-desktop/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── constants.ts
│   │   ├── document-config.ts
│   │   └── types.ts
│   ├── routes/
│   ├── app.css
│   └── app.html
├── src-tauri/
│   ├── capabilities/
│   ├── icons/
│   ├── src/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

## Modul Aplikasi

### Dashboard

Menampilkan ringkasan jumlah penawaran, invoice, kwitansi, total dokumen, total nominal, dan dokumen terbaru.

### Klien

Digunakan untuk menyimpan data klien agar dapat dipilih langsung saat membuat dokumen. Data klien tidak menampilkan ID pada UI.

### Penawaran

Digunakan untuk membuat dokumen penawaran dengan item pekerjaan, qty, harga satuan, catatan item, pajak, total, dan masa berlaku.

### Invoice

Digunakan untuk membuat dokumen tagihan resmi dengan tanggal jatuh tempo, metode bayar, item tagihan, pajak, total, dan catatan invoice.

### Kwitansi

Digunakan untuk membuat dokumen bukti pembayaran dengan detail penerima pembayaran, item pembayaran, total, dan catatan kwitansi.

### Riwayat

Menampilkan seluruh dokumen yang pernah dibuat. Dokumen dapat dibuka kembali, diubah statusnya, atau dihapus.

### Pengaturan

Digunakan untuk mengatur data perusahaan, rekening bank, tanda tangan, catatan default, dan warna dokumen.

## Export PDF dan Print

Aplikasi mendukung layout dokumen A4 dengan pagination otomatis. Jika item atau catatan terlalu panjang, dokumen akan dilanjutkan ke halaman berikutnya tanpa memotong baris tabel di tengah.

Bagian total, terbilang, bank account, tanda tangan, catatan, dan footer akan ditempatkan setelah seluruh item selesai agar tampilan tetap rapi dan profesional.

## Penyimpanan Data

Data aplikasi disimpan secara lokal menggunakan SQLite pada database `dony_invoice.db`. Aplikasi tidak membutuhkan server eksternal untuk membuat, menyimpan, mencetak, atau mengekspor dokumen.

Jika sebelumnya aplikasi pernah memakai database lama `nadhi_invoice.db`, data pengaturan, klien, penawaran, invoice, dan kwitansi akan dimigrasikan otomatis ke `dony_invoice.db` saat aplikasi dijalankan.

## Script NPM

| Script | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan Vite development server |
| `npm run check` | Mengecek Svelte dan TypeScript |
| `npm run build` | Build frontend |
| `npm run preview` | Preview hasil build frontend |
| `npm run tauri dev` | Menjalankan aplikasi desktop mode development |
| `npm run tauri build` | Build aplikasi desktop |

## Push ke GitHub

Jalankan dari folder project:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/dony-invoice-desktop.git
git push -u origin main
```

Ganti `username` dan `dony-invoice-desktop` sesuai akun serta nama repository GitHub.

## File yang Tidak Perlu Dipush

Pastikan folder berikut tidak masuk repository:

```txt
node_modules/
build/
.svelte-kit/
src-tauri/target/
```

## Lisensi

Proprietary. Seluruh kode dan aset digunakan untuk kebutuhan internal pemilik aplikasi.
