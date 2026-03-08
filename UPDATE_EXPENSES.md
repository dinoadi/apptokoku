# 🛠️ Tambahan Tabel Pengeluaran (Expenses)

Untuk mencatat arus kas (Cash on Hand) dengan akurat, kita perlu tabel baru untuk mencatat semua uang keluar, baik untuk beli barang (restock) maupun operasional (listrik, bensin, dll).

Silakan jalankan perintah SQL ini di **Supabase SQL Editor**:

```sql
create table expenses (
  id bigint primary key generated always as identity,
  date timestamp with time zone default now(),
  description text not null, -- Misal: "Beli Token Listrik", "Kulakan Daster Jumbo 10pcs"
  amount numeric not null, -- Jumlah uang keluar
  category text, -- "Restock" atau "Operasional"
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```
