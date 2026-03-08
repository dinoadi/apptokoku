# 🛠️ Update Struktur Database (PENTING)

Agar fitur **Kategori Produk** bisa disimpan permanen dan tidak kembali ke awal (reset) setiap kali halaman dimuat, Anda perlu menambahkan kolom baru di tabel `settings`.

Silakan jalankan perintah SQL ini di **Supabase SQL Editor**:

```sql
-- 1. Tambahkan kolom categories ke tabel settings
ALTER TABLE settings ADD COLUMN categories jsonb;

-- 2. Update data awal kategori
UPDATE settings 
SET categories = '["Daster Bali", "Daster Rayon", "Daster Jumbo", "Daster Anak"]'::jsonb 
WHERE id = 1;
```

Setelah menjalankan perintah di atas:
1. Refresh halaman web Anda.
2. Coba tambah/hapus kategori di menu Pengaturan.
3. Klik "Simpan Pengaturan".
4. Refresh lagi, perubahan kategori Anda akan tetap tersimpan!
