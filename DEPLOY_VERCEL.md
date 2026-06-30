# Panduan Deploy Sur'ahMath ke Vercel (Produksi)

Next.js dan Vercel adalah pasangan yang sangat cocok. Namun, karena Vercel menggunakan arsitektur **Serverless** (di mana penyimpanan file bersifat sementara/stateless), Anda **tidak bisa** menggunakan SQLite (`dev.db` lokal) di Vercel. 

Anda harus menggunakan database cloud/online (seperti **Supabase** atau **Neon** yang menyediakan database PostgreSQL gratis).

Berikut langkah-langkah men-deploy Sur'ahMath ke Vercel:

---

## Langkah 1: Buat Database Online Gratis (Rekomendasi: Supabase)
1. Pergi ke [Supabase.com](https://supabase.com) dan buat akun gratis.
2. Buat proyek baru (*New Project*).
3. Setelah proyek selesai dibuat, pergi ke menu **Project Settings** > **Database**.
4. Cari bagian **Connection string** (pilih tab **URI**).
5. Salin tautan tersebut, misalnya:
   `postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`

---

## Langkah 2: Konfigurasi Proyek Sur'ahMath
Pastikan konfigurasi database di proyek lokal Anda disetel ke PostgreSQL:

1. **Di file `prisma/schema.prisma`:**
   Pastikan baris paling atas menggunakan provider `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Di file `.env` lokal Anda:**
   Masukkan tautan database online dari Supabase tadi:
   ```env
   DATABASE_URL="postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
   ```

---

## Langkah 3: Sinkronisasi Skema & Pengisian Data Awal (Seed)
Hubungkan database cloud Anda secara lokal terlebih dahulu untuk membuat tabel-tabel dan mengisi data dummy. Jalankan perintah berikut di terminal komputer Anda:

```bash
# 1. Sinkronisasi tabel ke database online Supabase
npx prisma db push

# 2. Masukkan data siswa Budi, Guru, dan Wali Murid ke database online
npx prisma db seed
```

---

## Langkah 4: Hubungkan ke GitHub & Deploy ke Vercel

1. Buat repositori baru di GitHub (bisa *Private* atau *Public*), lalu push proyek Sur'ahMath Anda ke GitHub.
2. Buka [Vercel.com](https://vercel.com) dan masuk menggunakan akun GitHub Anda.
3. Klik tombol **Add New** > **Project**.
4. Klik **Import** pada repositori Sur'ahMath yang baru saja Anda push ke GitHub.
5. Pada bagian **Environment Variables**, tambahkan variabel berikut:
   *   **Name:** `DATABASE_URL`
   *   **Value:** *(Tautan connection string Supabase Anda dari Langkah 1)*
6. Klik tombol **Deploy**!

Vercel akan secara otomatis mendeteksi proyek Next.js, menjalankan perintah `prisma generate` (untuk memicu engine database Linux di cloud), mengompilasi kode, dan merilis website Sur'ahMath Anda ke publik.

Setelah proses selesai, Vercel akan memberikan Anda URL domain gratis (misalnya `surahmath.vercel.app`) yang bisa diakses secara online dari mana saja!
