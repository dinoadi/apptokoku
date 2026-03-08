# 🛍️ Dashboard Toko Daster (POS System)

> **Sistem Kasir Modern & Manajemen Stok Toko Pakaian**  
> Dibuat khusus untuk memudahkan operasional toko daster dengan teknologi cloud yang bisa diakses dari mana saja.

![App Screenshot](https://placehold.co/1200x600/e91e63/ffffff?text=Dashboard+Toko+Daster+Preview)
*(Ganti link gambar di atas dengan screenshot aplikasi asli Anda nanti)*

## ✨ Fitur Unggulan

### 🛒 Kasir (Point of Sale)
- **Transaksi Cepat**: Mode kasir yang responsif, mendukung input scan barcode/SKU.
- **Pembayaran Fleksibel**: Dukungan pembayaran Tunai, QRIS, dan Transfer.
- **Hitung Kembalian Otomatis**: Fitur "Uang Pas" dan kalkulator kembalian instan.
- **Struk Digital**: Cetak struk via printer thermal Bluetooth atau simpan sebagai PDF.

### 📦 Manajemen Produk
- **Stok Real-time**: Stok berkurang otomatis saat terjual.
- **Varian Produk**: Dukungan warna, ukuran, dan motif daster.
- **Notifikasi Stok**: Peringatan otomatis jika stok daster menipis (< 3 pcs).

### 📊 Laporan Keuangan
- **Analisis Laba Rugi**: Hitung omzet, profit bersih, dan HPP secara otomatis.
- **Filter Periode**: Laporan harian, mingguan (7 hari), dan bulanan.
- **Grafik Tren**: Visualisasi penjualan agar mudah dipahami.

### ☁️ Cloud Database (Supabase)
- **Akses Multi-Device**: Buka di HP, Tablet, atau Laptop secara bersamaan.
- **Aman**: Data tersimpan di cloud, tidak hilang meski ganti perangkat.
- **Sinkronisasi Instan**: Update di satu alat, muncul di alat lain detik itu juga.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/) (Super Cepat)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Desain Modern)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL Cloud)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deploy**: [Netlify](https://www.netlify.com/)

---

## 🚀 Cara Instalasi (Untuk Developer)

Ingin menjalankan project ini di komputer Anda sendiri?

1. **Clone Repository**
   ```bash
   git clone https://github.com/dinoadi/apptokoku.git
   cd apptokoku
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Supabase**
   - Buat project baru di [Supabase](https://supabase.com/).
   - Buat tabel database sesuai panduan di file [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).
   - Salin URL & Anon Key ke `src/supabaseClient.js`.

4. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173` di browser Anda.

---

## 📸 Galeri

| Dashboard | Kasir |
|-----------|-------|
| ![Dashboard](https://placehold.co/600x400/e91e63/ffffff?text=Dashboard) | ![POS](https://placehold.co/600x400/e91e63/ffffff?text=Kasir) |

| Produk | Laporan |
|--------|---------|
| ![Produk](https://placehold.co/600x400/e91e63/ffffff?text=Manajemen+Produk) | ![Laporan](https://placehold.co/600x400/e91e63/ffffff?text=Laporan+Keuangan) |

---

## 📝 Lisensi

Project ini dibuat untuk **Toko Daster** dan bersifat **Private**. Dilarang memperjualbelikan kode sumber tanpa izin.

---
**Dibuat dengan ❤️ oleh [Dino Adi](https://github.com/dinoadi)**
