# Expense & Budget Visualizer

Aplikasi web sederhana untuk mencatat saldo dan pengeluaran, melihat distribusi pengeluaran per kategori, serta memantau ringkasan transaksi bulanan. Antarmuka menggunakan Bahasa Indonesia, sementara nilai uang ditampilkan dalam dolar AS (USD).

## Fitur

- Menambahkan saldo.
- Mencatat pengeluaran dengan nama, jumlah, dan kategori. Transaksi hanya dapat ditambahkan jika saldo mencukupi.
- Memilih dari kategori bawaan atau menambahkan kategori sendiri.
- Menghapus transaksi; jumlah transaksi yang dihapus akan dikembalikan ke saldo.
- Mengurutkan transaksi berdasarkan waktu terbaru, jumlah terkecil/terbesar, atau kategori.
- Melihat grafik pie pengeluaran berdasarkan kategori.
- Melihat total pengeluaran, jumlah transaksi, dan rincian per kategori untuk bulan yang dipilih.
- Menyimpan saldo, transaksi, dan kategori kustom di Local Storage browser.

## Menjalankan aplikasi

Tidak diperlukan instalasi dependensi atau proses build. Jalankan dengan salah satu cara berikut:

1. Buka `index.html` langsung di browser; atau
2. Jalankan server lokal dari direktori proyek:

   ```bash
   python3 -m http.server 8000
   ```

   Kemudian buka <http://localhost:8000>.

Chart.js dimuat dari jsDelivr, sehingga koneksi internet diperlukan agar grafik dapat ditampilkan.

## Penyimpanan data

Data disimpan di Local Storage browser pada perangkat dan profil browser yang digunakan. Data tidak disinkronkan ke server dan tidak otomatis tersedia di browser atau perangkat lain. Menghapus data situs dari browser juga akan menghapus data aplikasi yang tersimpan.

## Teknologi

- HTML
- CSS
- JavaScript
- [Chart.js](https://www.chartjs.org/) melalui CDN
