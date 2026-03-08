# 🛠️ Panduan Setup Supabase (Database Cloud)

Ikuti langkah ini agar data toko daster Anda tersimpan di cloud dan bisa diakses dari HP mana saja:

## 1. Buat Akun & Project
1. Buka [Supabase](https://supabase.com/) dan daftar pakai akun GitHub.
2. Klik **"New Project"** (beri nama `apptokoku`).
3. Tunggu project dibuat (sekitar 1-2 menit).

## 2. Ambil API Key
1. Buka menu **Project Settings** (ikon gerigi) -> **API**.
2. Salin **Project URL** dan **`anon` public key**.
3. Buka file [supabaseClient.js](file:///D:/Arief/dashboardtoko/src/supabaseClient.js) di folder project Anda.
4. Ganti isi `supabaseUrl` dan `supabaseAnonKey` dengan data yang Anda salin tadi.

## 3. Buat Tabel Database (PENTING)
Buka menu **SQL Editor** di Supabase, lalu tempel kode di bawah ini satu per satu dan klik **Run**:

### A. Tabel Produk
```sql
create table products (
  id bigint primary key generated always as identity,
  name text not null,
  category text,
  cost_price numeric,
  selling_price numeric,
  stock int,
  sku text,
  variants text,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### B. Tabel Transaksi
```sql
create table transactions (
  id bigint primary key generated always as identity,
  invoice text unique,
  date timestamp with time zone default now(),
  items jsonb,
  subtotal numeric,
  discount numeric,
  total numeric,
  payment_method text,
  payment_amount numeric,
  profit numeric
);
```

### C. Tabel Pengaturan
```sql
create table settings (
  id int primary key default 1,
  store_name text,
  address text,
  phone text,
  receipt_footer text
);

-- Isi data awal pengaturan
insert into settings (id, store_name, address, phone, receipt_footer)
values (1, 'Nama Toko Anda', 'Alamat Lengkap', '0812345', 'Terima kasih!');
```

## 4. Matikan Keamanan (Untuk Pemula)
Agar data bisa masuk tanpa sistem login yang rumit untuk sementara:
1. Buka menu **Table Editor**.
2. Klik ikon gerigi pada tabel `products` -> **Edit Table**.
3. **Matikan (Uncheck)** tombol "Enable Row Level Security (RLS)". Klik Save.
4. Lakukan hal yang sama untuk tabel `transactions` dan `settings`.

---
**Selesai!** Sekarang setiap Anda input data di aplikasi, datanya akan langsung masuk ke server Supabase Anda.
