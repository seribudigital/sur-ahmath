# Product Requirement Document (PRD)
## Sur'ahMath: Website Latihan Perkalian & Pembagian Dasar untuk Siswa MTs dan MA
**Tagline:** "Membangun Fluency Numerasi, Mencetak Generasi Islami yang Presisi."
---

## 1. Latar Belakang
[cite_start]Banyak siswa MTs dan MA masih memiliki kelemahan pada kemampuan numerasi dasar, khususnya operasi perkalian dan pembagian sederhana (1-10)[cite: 4]. [cite_start]Kelemahan ini berdampak pada kesulitan mempelajari materi matematika lanjutan seperti aljabar, persamaan, statistika, dan trigonometri[cite: 5].

[cite_start]Website ini dibangun untuk membantu siswa meningkatkan otomatisasi (*fluency*), akurasi, dan kecepatan dalam menghitung perkalian dan pembagian dasar melalui latihan terstruktur, evaluasi berkala, dan monitoring perkembangan[cite: 6].

---

## 2. Tujuan Produk
1. [cite_start]Meningkatkan akurasi siswa dalam perkalian dan pembagian dasar[cite: 9].
2. [cite_start]Meningkatkan kecepatan berhitung mental[cite: 10].
3. [cite_start]Menyediakan latihan adaptif berdasarkan kelemahan spesifik siswa[cite: 11].
4. Memantau perkembangan siswa secara berkala dan tervalidasi oleh guru.
5. [cite_start]Menyediakan raport digital yang efektif, rapi, dan informatif bagi siswa, guru, dan wali murid[cite: 13, 124].

---

## 3. Target Pengguna
* [cite_start]**Siswa**: Siswa MTs & MA (Usia sekitar 12-18 tahun)[cite: 17, 18, 19].
* [cite_start]**Guru**: Guru matematika atau pengajar privat/remedial[cite: 20, 21].
* [cite_start]**Wali Murid**: Orang tua yang memantau perkembangan anak secara ringkas[cite: 23].

---

## 4. Konsep Inti Sistem & Arsitektur Paralel
Platform memisahkan secara tegas alur belajar matematika menjadi dua *learning path* independen untuk menghindari *cognitive overload* pada siswa:
1. **Jalur Perkalian (Multiplication Path)**: Membangun kompetensi berhitung berbasis penjumlahan berulang.
2. **Jalur Pembagian (Division Path)**: Membangun kompetensi dekonstruksi angka dan pecahan dasar.

[cite_start]Setiap jalur memiliki 3 pilar utama[cite: 26]:
* [cite_start]**Latihan (Practice Engine)**: Siswa berlatih soal secara rutin[cite: 27, 28].
* [cite_start]**Ujian (Assessment Engine)**: Siswa mengikuti tes untuk evaluasi perkembangan[cite: 29, 30].
* [cite_start]**Raport Tracking (Analytics Engine)**: Sistem menyimpan dan menampilkan progres belajar siswa[cite: 31, 32].

---

## 5. Modul Utama

### Modul 1 - Diagnostik Awal (Pre-Test) — *Di Depan Guru*
[cite_start]Saat pertama mendaftar, siswa wajib mengikuti tes diagnostik yang **diawasi langsung oleh guru** untuk mendapatkan nilai *baseline* yang murni[cite: 36, 52].
* [cite_start]**Bentuk Tes**: Dibagi menjadi 2 sesi terpisah (Sesi Perkalian: 25-30 soal, Sesi Pembagian: 25-30 soal) agar siswa tidak jenuh[cite: 42].
* [cite_start]**Output**: Nilai awal, akurasi, kecepatan, dan inisialisasi awal *Heatmap Kelemahan*[cite: 44, 45, 46, 47].

### Modul 2 - Latihan Mandiri (Practice Path)
Siswa menaiki tangga level secara mandiri pada masing-masing jalur.
* **Jenis Latihan**: 
  * [cite_start]*Flash Drill*: Soal muncul satu per satu (Contoh: $8 \times 7 = ?$)[cite: 56, 57, 58].
  * [cite_start]*Missing Number*: Mengisi angka yang hilang (Contoh: $6 \times \Box = 42$)[cite: 59, 60].
  * [cite_start]*Reverse Division*: Pembagian terbalik (Contoh: $72 \div 9 = ?$)[cite: 61, 62].
  * [cite_start]*Mixed Challenge*: Campuran semua tipe soal (Terbuka jika kedua jalur di level yang sama sudah lulus)[cite: 63, 64].
  * [cite_start]*Speed Challenge*: Latihan dengan batasan waktu/*timer*[cite: 65, 66].
* **Leveling System**:
  * [cite_start]**Beginner**: Tabel 1-3 [cite: 68, 69]
  * [cite_start]**Intermediate**: Tabel 4-6 [cite: 70, 71]
  * [cite_start]**Advanced**: Tabel 7-8 [cite: 72, 73]
  * [cite_start]**Expert**: Tabel 9-10 [cite: 74, 75]
* **Difficulty Mode (Adaptive)**: Menggunakan pembobotan berbasis data. [cite_start]Sistem akan lebih sering memunculkan kombinasi soal yang sebelumnya dijawab salah oleh siswa[cite: 83, 84].

### Modul 3 - Ujian Berkala & Validasi Kelulusan (Assessment Engine)
* [cite_start]**Ujian Mingguan (Weekly Test)**: 20-30 soal secara berkala setiap minggu[cite: 88, 89, 90].
* [cite_start]**Ujian Bulanan (Monthly Test)**: 50-100 soal secara berkala setiap bulan[cite: 91, 92, 93].
* [cite_start]**Mastery Test Mandiri**: Ujian di akhir setiap level untuk membuka gerbang ke level berikutnya secara mandiri (Syarat lulus: Akurasi $\ge 90\%$ dan kecepatan tertentu)[cite: 94, 95, 96, 97, 98].
* **Ujian Akhir Master — *Di Depan Guru* (Post-Test)**:
  * [cite_start]Terbuka setelah siswa menyelesaikan level *Expert* (Tabel 9-10)[cite: 74, 75].
  * Tombol ujian terkunci secara sistem dan hanya bisa diaktifkan melalui Verifikasi Guru (PIN atau Akses Dashboard Guru).
  * [cite_start]Menguji performa acak secara penuh (Tabel 1-10)[cite: 77, 78].

### Modul 3a - Mekanisme Remedial Otomatis
Jika siswa **belum memenuhi** target kelulusan pada *Ujian Akhir Master*:
1. Sistem mengunci kembali akses Ujian Master.
2. Sistem mengarahkan siswa ke **Mode Remedial Khusus**.
3. Sistem menyusun menu latihan adaptif di mana **90% soal diambil dari koordinat merah (salah/lambat)** pada hasil Ujian Master tadi.
4. Setelah menyelesaikan porsi latihan remedial yang ditentukan, tombol verifikasi guru untuk Ujian Master akan terbuka kembali.

---

## 6. Gamifikasi
[cite_start]Tujuan untuk meningkatkan motivasi dan keterikatan (*engagement*) siswa[cite: 100].
* [cite_start]**Fitur**: XP Point [cite: 102][cite_start], Badge [cite: 104][cite_start], Achievement [cite: 105][cite_start], Daily Streak [cite: 106][cite_start], Leaderboard[cite: 107].
* [cite_start]**Badge Utama (Predikat Kelulusan)**: *Master Tabel*, *Raja Perkalian*, *Ninja Pembagian*, *Speed Monster*[cite: 108, 109, 110, 111, 112].

---

## 7. Tracking & Analytics
[cite_start]Sistem wajib menyimpan seluruh log aktivitas siswa secara mendalam[cite: 114]:
* [cite_start]Jumlah sesi latihan dan total soal[cite: 116, 117].
* [cite_start]Log jawaban benar/salah beserta durasi pengerjaan per soal[cite: 118, 119].
* [cite_start]Riwayat detail ujian[cite: 120].
* [cite_start]Koordinat angka/tabel yang paling sering salah (`operand_1`, `operand_2`, `operation_type`)[cite: 121].

---

## 8. Raport Perkembangan (Hierarki Informasi Digital)
[cite_start]Raport dirancang efektif, rapi, mudah dipahami secara instan, namun tetap informatif[cite: 122, 124].

### A. Komponen Tampilan (UI Layout)
1. [cite_start]**Header (Identitas)**: Nama Siswa, Kelas, Asal Sekolah, Periode, dan Predikat Aktif saat ini[cite: 145, 146, 147, 148].
2. **3 Metrik Utama (Kartu Indikator)**:
   * [cite_start]*Accuracy Score*: Persentase benar keseluruhan + info grafik kenaikan dari nilai awal[cite: 126, 127, 150, 151, 152].
   * [cite_start]*Speed Score*: Rata-rata waktu menjawab (Contoh: Awal: 9.2 detik $\rightarrow$ Sekarang: 3.2 detik)[cite: 130, 131, 132].
   * [cite_start]*Activity Score*: Konsistensi latihan (Hari aktif, total sesi, dan *streak*)[cite: 133, 134, 135, 154, 155, 156].
3. **Visual Analytics (Dua Tab Terpisah: Perkalian & Pembagian)**:
   * [cite_start]*Progress Chart*: Grafik garis tren peningkatan nilai mingguan/bulanan[cite: 164, 165, 169, 170].
   * [cite_start]*Mastery Heatmap*: Matriks 10×10 berwarna dinamis (Hijau = Master/Dikuasai, Kuning/Orange = Butuh Latihan, Merah = Lemah/Sering Salah)[cite: 136, 139, 141, 142, 166, 167, 168].
4. [cite_start]**Footer**: Catatan evaluasi manual dari guru (Komentar guru) dan tabel riwayat log ujian resmi[cite: 160, 161].

### B. Hak Akses & Metode Distribusi (Role-Based Access)
* [cite_start]**Guru**: Akses dashboard penuh untuk memantau kelas[cite: 192, 195]. [cite_start]Memiliki otoritas untuk menulis catatan evaluasi [cite: 194] dan membuka kunci Ujian Master.
* [cite_start]**Siswa**: Akses penuh melalui login reguler untuk latihan [cite: 196, 197][cite_start], ujian [cite: 198][cite_start], dan melihat progres bermotivasi[cite: 199].
* [cite_start]**Wali Murid**: Akses ringkas tanpa login rumit menggunakan **"Link Unik Tanpa Password"** yang dikirimkan via WhatsApp/Email[cite: 183, 184, 185, 200, 201, 202]. Menyediakan fitur unduh/cetak dalam format **PDF**.

---

## 9. Struktur Database (Updated)
* [cite_start]**students**: `id`, `user_id`, `nama`, `kelas`, `school`, `parent_id`[cite: 204, 205, 206, 207, 208, 209].
* [cite_start]**parents**: `id`, `user_id`, `nama`, `kontak`[cite: 211, 212, 213, 214].
* [cite_start]**practice_sessions**: `id`, `student_id`, `operation_type`, `date`, `duration`, `total_questions`, `correct_answers`[cite: 215, 216, 217, 218, 219, 220, 221].
* **question_logs**: `id`, `session_id`, `operation_type`, `operand_1`, `operand_2`, `user_answer`, `correct`, `response_time`[cite: 222, 223, 224, 225, 226, 227, 228].
* **exams**: `id`, `student_id`, `exam_type`, `operation_type`, `score`, `status_remedial`, `date`, `verified_by_guru`[cite: 229, 230, 231, 232, 233, 234].
* [cite_start]**reports**: `id`, `student_id`, `period`, `accuracy`, `speed`, `activity_score`[cite: 235, 236, 237, 238, 239, 240, 241].

---

## 10. KPI Keberhasilan Produk
Produk dianggap berhasil jika memenuhi parameter berikut:
* [cite_start]Akurasi siswa meningkat $\ge 30\%$ dari nilai awal diagnostik[cite: 267, 269].
* Kecepatan menjawab mental meningkat $\ge 40\%$ (waktu respon mengecil)[cite: 270].
* [cite_start]Konsistensi latihan siswa secara mandiri $\ge 4$ hari/minggu[cite: 271].