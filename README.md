# Sistem Penilaian

Aplikasi web untuk melakukan penilaian berbasis kriteria dan variabel dengan level 0–5, menggunakan React 19, Vite, Tailwind CSS v4, Express.js, dan penyimpanan JSON.

## Fitur Utama

- **Admin**
  - Login
  - CRUD Kriteria (kategori penilaian)
  - CRUD Variabel (item penilaian) dengan bobot, formula, dan deskripsi tiap level (0–5)
  - Melihat seluruh hasil penilaian user
- **User**
  - Login
  - Memilih level (0–5) untuk setiap variabel yang tersedia
  - Melihat hasil penilaian (total nilai, persentase, detail per kriteria)
- **Perhitungan Otomatis**
  - Rumus fleksibel per variabel (contoh: `bobot * skor`) yang disimpan sebagai data
  - Subtotal per kriteria, total keseluruhan, dan persentase berbasis level maksimum yang tersedia
  - Evaluator aman (menggunakan `new Function` dalam sandbox)

## Teknologi

| Layer      | Teknologi                                            |
|------------|------------------------------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS v4, React Router DOM, Axios |
| Backend    | Node.js, Express.js                                  |
| Database   | File JSON (mudah dimigrasi ke MySQL, PostgreSQL, dsb.)|

## Struktur Proyek

```text
project-root/
├── frontend/                 # Aplikasi React (dibuat dengan Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/              # Konfigurasi Axios instance
│   │   ├── components/       # Komponen reusable (Card, Table, Modal, Loading, dll.)
│   │   ├── contexts/         # AuthContext (state login & role)
│   │   ├── hooks/            # Custom hook (useToast)
│   │   ├── layouts/          # Layout Admin & User (sidebar + navbar)
│   │   ├── pages/            # Halaman-halaman (Admin: Dashboard, Criteria, Variable, Assessments; User: Dashboard, Form Penilaian, Hasil, Riwayat)
│   │   ├── routes/           # Routing (AppRoutes.jsx)
│   │   ├── services/         # Service untuk memanggil API (Axios)
│   │   ├── utils/            # (opsional)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css         (Tailwind v4 import)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Server Express
│   └── src/
│       ├── controllers/      # Menangani request/response
│       ├── services/         # Business logic
│       ├── repositories/     # Akses data (JSON)
│       ├── routes/           # Definisi endpoint
│       ├── middleware/        # Auth (JWT), admin, error handler
│       ├── utils/            # Evaluator rumus, formatter response
│       ├── data/             # File JSON (criteria, variables, users, assessments)
│       ├── app.js
│       └── server.js
└── README.md
```

## Instalasi & Menjalankan

### Prasyarat
- Node.js versi 18+ terpasang
- npm atau yarn

### Backend

```bash
cd backend
npm install
npm run dev
```

Server berjalan di `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173` dan mem-proxy API ke backend.

**Catatan:** Jika instalasi gagal karena perubahan versi package (misalnya Tailwind CSS v4), ikuti dokumentasi resmi terbaru. Konfigurasi yang digunakan sudah sesuai untuk versi stabil saat ini.

## Akun Demo

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin123 |
| User  | user     | user123  |

## Alur Penggunaan

1. Admin login, membuat **Kriteria** (contoh: "AUTONOMOUS MAINTENANCE", "CONTROL BOARD").
2. Admin menambahkan **Variabel** di dalam kriteria tersebut, mengisi:
   - Nama
   - Bobot (angka)
   - Formula (misal `bobot * skor`)  
   - Deskripsi untuk setiap **level 0 hingga 5** (hanya level dengan deskripsi tidak kosong yang akan muncul di form user).
3. User login, membuka menu **Penilaian Baru**. Akan muncul daftar kriteria beserta variabelnya.
4. User memilih **satu level** (radio button) untuk setiap variabel yang sesuai dengan kondisi. Level yang tersedia hanya yang memiliki deskripsi (tidak kosong).
5. Setelah memilih, klik **Simpan Penilaian**. Sistem akan:
   - Mengevaluasi rumus tiap variabel dengan `bobot` dan `skor` (level terpilih).
   - Menghitung subtotal per kriteria, total, dan persentase.
   - Persentase = (total / maxTotal) × 100%, dengan `maxTotal` dihitung menggunakan level **tertinggi yang tersedia** pada setiap variabel (bukan selalu 5).
6. Hasil penilaian tersimpan dan dapat dilihat di halaman **Riwayat** (user) atau **Penilaian** (admin).

## REST API

Base URL: `/api`

### Autentikasi
`POST /auth/login` – login, mendapatkan token JWT.

### Kriteria (Admin)
- `GET    /criteria`      – semua kriteria
- `GET    /criteria/:id`  – detail satu kriteria
- `POST   /criteria`      – buat baru
- `PUT    /criteria/:id`  – edit
- `DELETE /criteria/:id`  – hapus

### Variabel (Admin)
- `GET    /variables`            – semua variabel (bisa filter `?criteriaId=...`)
- `GET    /variables/:id`        – detail
- `POST   /variables`            – buat baru
- `PUT    /variables/:id`        – edit
- `DELETE /variables/:id`        – hapus

### Penilaian
- `POST   /assessments`          – buat penilaian (body: `{ selections: [{ variableId, selectedLevel }] }`)
- `GET    /assessments`          – semua penilaian (admin lihat semua, user lihat miliknya sendiri)
- `GET    /assessments/:id`      – detail penilaian

Semua response mengikuti format:
```json
{
  "success": true/false,
  "message": "...",
  "data": { ... }
}
```

## Arsitektur

### Backend – Layered Architecture
```
Controller → Service → Repository → JSON
```
- **Controller**: hanya menerima request dan mengirim response.
- **Service**: berisi aturan bisnis, tidak boleh menyentuh data langsung.
- **Repository**: mengakses data (file JSON). Jika ingin mengganti ke database, **hanya lapisan ini** yang perlu diubah.

### Frontend – Clean Components
- **Axios hanya digunakan di folder `services`**, tidak langsung di komponen/pages.
- Komponen reusable (`Card`, `Table`, `Modal`, `Loading`, `EmptyState`) mengurangi duplikasi.
- Context API untuk manajemen autentikasi.

## Migrasi dari JSON ke Database

Dengan Repository Pattern, migrasi menjadi mudah:

1. Buat file repository baru (misal `CriteriaRepositoryMySql.js`) yang mengimplementasikan method yang sama:
   - `findAll()`
   - `findById(id)`
   - `create(entity)`
   - `update(id, data)`
   - `delete(id)`
2. Ganti dependency di file Service (contoh: `criteriaService.js`) dari repository JSON ke repository MySQL.
3. Sesuaikan koneksi database di folder `config`.
4. Tidak ada perubahan di Controller, Service, atau lapisan lainnya.

Contoh untuk MySQL menggunakan Sequelize atau Prisma dapat ditemukan di komentar kode atau dokumentasi pengembangan.

## Catatan Pengembangan

- Tailwind CSS v4 menggunakan `@import "tailwindcss"` di CSS dan plugin `@tailwindcss/vite` di `vite.config.js`. Tidak perlu menjalankan `npx tailwindcss init`.
- Formula dievaluasi dengan `new Function(...)` yang hanya diberi variabel `bobot` dan `skor`. Ini lebih aman daripada `eval()`.
- Semua file JSON dapat dilihat dan diedit langsung di `backend/src/data/`, tetapi sangat disarankan melalui API agar integritas data terjaga.

---

## Created by hammPa.