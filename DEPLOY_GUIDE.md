# 🚀 Panduan Deploy Dashboard Toko Daster

Aplikasi ini sudah siap untuk di-upload ke internet menggunakan Netlify. Ikuti langkah-langkah di bawah ini:

## 1. Persiapan GitHub (PENTING)
Sebelum ke Netlify, Anda harus memiliki kode ini di akun GitHub Anda:
1. Buat Repository baru di [GitHub](https://github.com/new) (beri nama `apptokoku`).
2. Jalankan perintah ini di terminal folder project Anda:
   ```bash
   git remote add origin https://github.com/dinoadi/apptokoku.git
   git branch -M main
   git push -u origin main
   ```

## 2. Cara Upload ke Netlify (Gratis)
Ada dua cara, saya sarankan **Cara A** karena otomatis update jika Anda ubah kode.

### Cara A: Melalui GitHub (Otomatis)
1. Login ke [Netlify](https://app.netlify.com/).
2. Klik tombol **Add new site** -> **Import an existing project**.
3. Pilih **GitHub** dan cari repository `dashboardtoko` Anda.
4. Pengaturan build (biasanya sudah otomatis):
   - **Build Command:** `npm run build`
   - **Publish directory:** `dist`
5. Klik **Deploy site**. Tunggu 1 menit, aplikasi Anda sudah online!

### Cara B: Drag & Drop (Manual)
1. Jalankan perintah `npm run build` di terminal Anda.
2. Akan muncul folder bernama `dist` di komputer Anda.
3. Buka Netlify, masuk ke menu **Sites**.
4. Tarik (*drag*) folder `dist` tadi ke kotak upload yang tersedia di bawah halaman Netlify.

---

## 3. Apa Lagi Selain Netlify?

Selain hosting di Netlify, untuk toko yang profesional Anda mungkin butuh:

### 1. Custom Domain (.com / .id)
Netlify memberikan nama acak (misal: `toko-daster-123.netlify.app`). Anda bisa membeli domain sendiri agar nama tokonya lebih profesional (misal: `tokodasteram.com`).

### 2. Backup Data (SANGAT PENTING)
Aplikasi ini menyimpan data di browser (Local Storage). Artinya:
- Jika Anda hapus history browser, data bisa hilang.
- **Saran:** Gunakan fitur **Download Laporan** secara rutin sebagai backup manual, atau di masa depan kita bisa hubungkan ke Database (seperti Firebase/Supabase) agar data tersimpan aman di cloud selamanya.

### 3. Keamanan (Password)
Saat ini password masih statis di kode. Untuk penggunaan banyak orang, disarankan menggunakan sistem login yang lebih aman.

### 4. Printer Thermal
Untuk cetak struk fisik, Anda butuh printer thermal Bluetooth/USB 58mm yang terhubung ke HP/Laptop saat membuka web ini.

---
**Selamat Berjualan! 👗✨**
