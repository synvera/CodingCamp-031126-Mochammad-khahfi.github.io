# Expense & Budget Visualizer

Expense & Budget Visualizer adalah aplikasi web sederhana untuk mencatat saldo dan pengeluaran, lalu melihat ringkasan keuangan berdasarkan kategori dan bulan.

## Tentang tugas

Proyek ini dibuat sebagai tugas latihan untuk menerapkan dasar pembuatan website dan interaksi sederhana di browser.

## Alur penggunaan website

1. **Tambahkan saldo.** Klik bagian total saldo, masukkan jumlah saldo, lalu simpan. Saldo akan menjadi batas dana untuk mencatat pengeluaran.
2. **Catat pengeluaran.** Isi nama dan jumlah pengeluaran, pilih kategori, lalu tekan **Tambah Transaksi**. Transaksi hanya dapat ditambahkan jika saldo mencukupi; saldo akan berkurang sesuai jumlahnya.
3. **Atur kategori jika diperlukan.** Pilih **Tambah Kategori**, masukkan nama kategori, lalu simpan. Kategori tersebut dapat digunakan untuk transaksi.
4. **Tinjau dan kelola transaksi.** Daftar transaksi dapat diurutkan berdasarkan waktu terbaru, jumlah, atau kategori. Menghapus transaksi akan mengembalikan jumlahnya ke saldo.
5. **Pantau pengeluaran.** Grafik menampilkan distribusi pengeluaran per kategori. Bagian ringkasan bulanan menunjukkan total pengeluaran, jumlah transaksi, dan jumlah per kategori untuk bulan yang dipilih.
6. **Data tersimpan di browser.** Saldo, transaksi, dan kategori kustom disimpan di Local Storage, sehingga tetap tersedia saat aplikasi dibuka kembali di browser dan perangkat yang sama.

## Teknologi

- HTML
- CSS
- JavaScript

Grafik kategori menggunakan Chart.js yang dimuat melalui CDN jsDelivr.

## Menjalankan aplikasi

Tidak diperlukan instalasi dependensi atau proses build. Buka `index.html` langsung di browser, atau jalankan server lokal dari direktori proyek:

```bash
python3 -m http.server 8000
```

Kemudian buka <http://localhost:8000>. Koneksi internet diperlukan agar Chart.js dari CDN dapat dimuat dan grafik ditampilkan.

## Catatan penyimpanan

Data disimpan secara lokal pada browser yang digunakan dan tidak disinkronkan ke server atau perangkat lain. Menghapus data situs dari browser juga akan menghapus data aplikasi yang tersimpan.
