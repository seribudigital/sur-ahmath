# Panduan Menjalankan Sur'ahMath Secara Lokal

Ikuti langkah-langkah di bawah ini untuk mencoba website latihan matematika Sur'ahMath di komputer Anda.

---

## Opsi 1: Menggunakan SQLite (Rekomendasi - Paling Cepat & Tanpa Install DB)

SQLite tidak memerlukan instalasi server database apa pun. Data akan langsung disimpan di file lokal.

### Langkah 1: Ubah Konfigurasi `.env`
Buka file `.env` di root folder proyek, lalu pastikan isinya:
```env
# Gunakan database SQLite lokal
DATABASE_URL="file:./dev.db"
```

### Langkah 2: Ubah Provider di `prisma/schema.prisma`
Buka file `prisma/schema.prisma`, lalu ubah block `datasource db` di baris paling atas menjadi:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### Langkah 3: Inisialisasi Database & Seed Data
Buka PowerShell / Terminal di root folder proyek (`D:/Guru/myweb/sur'ahmath`), lalu jalankan perintah berikut secara berurutan:
```bash
# 1. Sinkronisasi skema ke database dev.db lokal
npx prisma db push

# 2. Masukkan data Budi, Ibu Fatimah (Guru), dan Pak Ahmad (Wali Murid)
npx prisma db seed
```

### Langkah 4: Jalankan Server Next.js
Setelah database berhasil dibuat, jalankan server pengembangan:
```bash
npm run dev
```

Buka browser Anda dan akses halaman-halaman berikut:
*   **Dashboard Siswa:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
*   **Halaman Latihan Mandiri:** [http://localhost:3000/practice](http://localhost:3000/practice)
*   **Dashboard Guru (Teacher):** [http://localhost:3000/teacher](http://localhost:3000/teacher)
*   **Halaman Raport Wali Murid:** [http://localhost:3000/raport/mock-unique-token-xyz-123](http://localhost:3000/raport/mock-unique-token-xyz-123) (Passwordless access token)

---

## Opsi 2: Menggunakan PostgreSQL (Untuk Produksi / Deployment Asli)

### Langkah 1: Pastikan PostgreSQL Aktif
Pastikan server database PostgreSQL Anda sedang berjalan (default di port 5432).

### Langkah 2: Konfigurasi `.env`
Buka `.env` dan masukkan connection string database PostgreSQL Anda:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/nama_database?schema=public"
```

### Langkah 3: Pastikan Provider PostgreSQL di `prisma/schema.prisma`
Pastikan baris teratas schema.prisma Anda menggunakan:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Langkah 4: Jalankan Database Push & Seed
Jalankan perintah berikut di Terminal:
```bash
npx prisma db push
npx prisma db seed
```

### Langkah 5: Jalankan Server
```bash
npm run dev
```
Akses halaman-halaman latihan di browser Anda pada port 3000.
