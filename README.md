# Sistem Penilaian

Aplikasi web untuk melakukan penilaian berbasis **Sesi Assessment → Tabel Penilaian → Kriteria → Variabel** dengan level skor 0–N (fleksibel, tidak lagi tetap 0–5), dilengkapi manajemen Tim, Grup, dan Pengguna, menggunakan React 19, Vite, Tailwind CSS v4, Express.js, dan SQLite.

## Fitur Utama

- **Admin**
  - Login
  - **Sesi Assessment** — tiap sesi (mis. "Semester 1 2026") punya Tabel Penilaian, Kriteria, dan Variabel sendiri, terisolasi dari sesi lain. Bisa dibuat dari kosong atau **diduplikat** dari sesi sebelumnya sebagai titik awal.
  - **Tabel Penilaian** — dua mode tampilan: List (daftar biasa) dan Tabel (grid spreadsheet-style dengan inline-edit klik-langsung dan paste multi-kolom dari Excel/Sheets).
  - CRUD **Kriteria** (kategori penilaian) di dalam tiap Tabel.
  - CRUD **Variabel** (item penilaian) dengan bobot, formula, dan deskripsi tiap level skor — jumlah level bisa diatur bebas (default 5), tidak hardcode.
  - CRUD **Tim** — anggotanya (User) bisa diganti/ditambah/dikurangi kapan saja.
  - CRUD **Grup** — tiap grup terhubung ke satu Tim (`teamId`).
  - CRUD **Pengguna** — termasuk penetapan role (admin/user) dan Tim asal.
  - **Reset Password** — admin bisa mereset password pengguna lain lewat aksi khusus (tercatat siapa & kapan me-reset, terpisah dari form edit profil biasa).
  - Melihat seluruh hasil penilaian dari semua user, dikelompokkan per Tabel → Kriteria → Variabel, lengkap dengan foto dokumentasi yang diunggah user.
- **User**
  - Login
  - Dashboard menampilkan hanya **Grup yang terhubung ke Tim miliknya sendiri**.
  - Mengisi penilaian: memilih level skor untuk tiap Variabel yang tersedia, dengan opsi **unggah foto dokumentasi/bukti**.
  - Melihat riwayat & detail hasil penilaian sendiri (total nilai, persentase, rincian per Kriteria, foto yang pernah diunggah).
- **Perhitungan Otomatis**
  - Rumus fleksibel per variabel (contoh: `bobot * skor`) yang disimpan sebagai data, dievaluasi lewat sandbox `new Function(...)`.
  - Subtotal per kriteria, total keseluruhan, dan persentase berbasis level maksimum yang tersedia (bukan selalu skor tertinggi absolut, tapi level tertinggi yang benar-benar punya deskripsi terisi).
- **Upload Foto**
  - User bisa mengunggah hingga 20 foto sekaligus (field `photos`) sebagai dokumentasi/bukti penilaian.
  - File diterima sebagai buffer di memori (`multer.memoryStorage()`), lalu diproses dengan **Sharp** sebelum disimpan ke disk — bukan disimpan mentah langsung dari upload.
  - Endpoint ini hanya butuh login biasa (`authMiddleware`), tidak dibatasi admin-only, karena memang dipakai user saat mengisi penilaian.
- **Keamanan**
  - Password pengguna di-hash dengan **bcrypt** (bukan plaintext).
  - Autentikasi berbasis JWT, middleware `authMiddleware` (wajib login) dan `adminMiddleware` (khusus admin) di tiap rute yang relevan.

## Teknologi

| Layer      | Teknologi                                              |
|------------|----------------------------------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS v4, React Router DOM, Axios  |
| Backend    | Node.js, Express.js                                       |
| Database   | **SQLite** (sebelumnya JSON, sudah dimigrasikan penuh)     |
| Autentikasi| JWT + bcrypt                                               |
| Deployment | Docker (backend), Vercel (frontend)                        |

## Struktur Proyek

```text
project-root/
├── backend/
│   ├── Dockerfile
│   ├── migrate_hash_pass.js      # migrasi satu kali: hash ulang password lama (plaintext -> bcrypt)
│   ├── migrate-to-sqlite.js      # migrasi satu kali: pindahkan data dari JSON ke SQLite
│   ├── public/
│   │   └── uploads/              # foto dokumentasi assessment (disajikan lewat express.static)
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   ├── db.js             # koneksi SQLite
│       │   └── index.js          # konfigurasi umum (JWT secret, dll.)
│       ├── controllers/          # Assessment, Auth, Criteria, Group, Session, Table, Team, Upload, User, Variable
│       ├── services/             # business logic per entity
│       ├── repositories/         # akses data (SQLite) — Repository Pattern
│       ├── routes/               # definisi endpoint per entity
│       ├── middleware/           # authMiddleware, adminMiddleware, errorHandler
│       ├── utils/                # evaluator formula, response formatter
│       └── data/                 # database SQLite (web_penilaian.sqlite) + arsip JSON lama
└── frontend/
    ├── vercel.json
    ├── vite.config.js
    └── src/
        ├── api/axiosInstance.js
        ├── components/           # Card, Table, Modal, Loading, EmptyState, ToastContainer, dll.
        ├── contexts/AuthContext.jsx
        ├── hooks/useToast.js
        ├── layouts/              # AdminLayout, UserLayout
        ├── pages/
        │   ├── admin/
        │   │   ├── SessionList.jsx        # daftar Sesi Assessment (+ duplikat)
        │   │   ├── TableList.jsx          # daftar Tabel Penilaian per sesi (List/Grid mode)
        │   │   ├── table_mode/            # mode Grid: GridModeTable, CriteriaRow, scoreUtils
        │   │   ├── list_mode/             # mode List
        │   │   ├── TableDetail.jsx        # kelola Kriteria per Tabel
        │   │   ├── CriteriaVariables.jsx  # kelola Variabel per Kriteria (level fleksibel)
        │   │   ├── TeamList.jsx
        │   │   ├── GroupList.jsx
        │   │   ├── UserList.jsx           # + Reset Password
        │   │   ├── Assessments.jsx        # rekap semua hasil penilaian
        │   │   └── Dashboard.jsx
        │   └── user/
        │       ├── Dashboard.jsx          # grup milik tim sendiri
        │       ├── AssessmentForm.jsx     # isi penilaian + upload foto
        │       ├── AssessmentResult.jsx
        │       └── AssessmentHistory.jsx
        ├── routes/AppRoutes.jsx
        └── services/              # 1 file per entity: session, table, criteria, variable, team, group, user, assessment, auth
```

## Instalasi & Menjalankan

### Prasyarat
- Node.js versi 18+
- npm atau yarn

### Backend

```bash
cd backend
npm install
npm run dev
```

Server berjalan di `http://localhost:5000`. Database SQLite ada di `backend/src/data/web_penilaian.sqlite`.

**Migrasi satu kali (kalau setup dari data lama):**
```bash
node migrate-to-sqlite.js      # pindahkan data JSON lama ke SQLite (kalau belum pernah dijalankan)
node migrate_hash_pass.js      # hash ulang password lama yang masih plaintext
```

**Docker (opsional):**
```bash
cd backend
docker build -t sistem-penilaian-backend .
docker run -p 5000:5000 sistem-penilaian-backend
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`. Deploy production ke Vercel (konfigurasi ada di `vercel.json`).

## Akun Demo - ganti password sesegera mungkin

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin123 |

## Alur Penggunaan

1. Admin login, membuat **Sesi Assessment** (mis. "Semester 1 2026") — bisa kosong atau duplikat dari sesi sebelumnya.
2. Di dalam sesi itu, admin membuat **Tabel Penilaian**, lalu **Kriteria**, lalu **Variabel** — mengisi nama, bobot, formula, dan deskripsi tiap level skor (jumlah level bebas, default 5).
3. Admin membuat **Tim** dan **Grup**, menghubungkan tiap Grup ke satu Tim, dan menetapkan **Pengguna** sebagai anggota Tim tertentu.
4. User login, dashboard menampilkan **hanya Grup milik Tim-nya**.
5. User mengisi penilaian untuk Grup yang dipilih: memilih level skor per Variabel, opsional unggah foto dokumentasi.
6. Sistem menghitung otomatis: evaluasi rumus tiap variabel (`bobot`, `skor`), subtotal per kriteria, total, dan persentase (berbasis level tertinggi yang punya deskripsi, bukan selalu skor maksimum absolut).
7. Hasil tersimpan dan bisa dilihat di **Riwayat** (user) atau rekap **Penilaian** (admin, semua user, dikelompokkan per Tabel → Kriteria → Variabel).

## REST API

Base URL: `/api`

### Autentikasi
- `POST /auth/login` — login, dapat token JWT
- `GET  /auth/me` — data user yang sedang login

### Sesi Assessment
- `GET    /sessions` — semua user login
- `GET    /sessions/:id` — semua user login
- `POST   /sessions` — Admin
- `PUT    /sessions/:id` — Admin
- `DELETE /sessions/:id` — Admin
- `POST   /sessions/:id/duplicate` — Admin, duplikat seluruh Tabel→Kriteria→Variabel ke sesi baru

### Tabel Penilaian
- `GET    /tables` (filter `?sessionId=...`) — semua user login
- `GET    /tables/:id` — semua user login
- `POST   /tables` — Admin
- `PUT    /tables/:id` — Admin
- `DELETE /tables/:id` — Admin

### Kriteria
- `GET    /criteria` (filter `?tableId=...`) — semua user login
- `GET    /criteria/:id` — semua user login
- `POST   /criteria` — Admin
- `PUT    /criteria/:id` — Admin
- `DELETE /criteria/:id` — Admin

### Variabel
- `GET    /variables` (filter `?criteriaId=...`) — semua user login
- `GET    /variables/:id` — semua user login
- `POST   /variables` — Admin
- `PUT    /variables/:id` — Admin
- `DELETE /variables/:id` — Admin

### Tim
- `GET    /teams` — semua user login
- `GET    /teams/:id` — semua user login
- `POST   /teams` — Admin
- `PUT    /teams/:id` — Admin
- `DELETE /teams/:id` — Admin

### Grup
- `GET    /groups` (filter `?teamId=...`) — semua user login
- `GET    /groups/:id` — semua user login
- `POST   /groups` — Admin
- `PUT    /groups/:id` — Admin
- `DELETE /groups/:id` — Admin

### Pengguna (Admin — seluruh endpoint)
- `GET    /users`
- `GET    /users/:id`
- `POST   /users`
- `PUT    /users/:id`
- `PUT    /users/:id/reset-password` — reset password oleh admin
- `DELETE /users/:id`

### Pengguna (Admin)
- `GET    /users`
- `GET    /users/:id`
- `POST   /users`
- `PUT    /users/:id`
- `PUT    /users/:id/reset-password` — reset password oleh admin
- `DELETE /users/:id`

### Penilaian
- `POST   /assessments` — buat penilaian (body: `{ selections: [{ variableId, selectedLevel }], groupId, photos? }`)
- `GET    /assessments` — semua penilaian (admin lihat semua, user lihat miliknya sendiri)
- `GET    /assessments/:id` — detail penilaian

### Upload
- `POST /upload` — unggah foto dokumentasi (field form-data: `photos`, maksimal 20 file sekaligus). File diproses dengan Sharp sebelum disimpan, mengembalikan path yang disajikan lewat `public/uploads`.

Semua response mengikuti format:
```json
{
  "success": true/false,
  "message": "...",
  "data": { ... }
}
```

## Arsitektur

### Backend – Layered Architecture (Repository Pattern)
```
Controller → Service → Repository → SQLite
```
- **Controller**: hanya menerima request dan mengirim response.
- **Service**: berisi aturan bisnis (validasi, cascade delete, kalkulasi), tidak menyentuh data langsung.
- **Repository**: satu-satunya lapisan yang tahu detail penyimpanan (SQLite). Kalau nanti pindah ke database lain, cukup lapisan ini yang diubah — Controller dan Service tidak perlu disentuh.

### Frontend – Clean Components
- **Axios hanya dipakai di folder `services`**, tidak langsung di komponen/halaman.
- Komponen reusable (`Card`, `Table`, `Modal`, `Loading`, `EmptyState`, `ToastContainer`) mengurangi duplikasi.
- Context API (`AuthContext`) untuk manajemen sesi login & role.
- Mode tampilan Tabel Penilaian dipecah jadi submodule terpisah (`table_mode/`, `list_mode/`) supaya logic grid yang kompleks (inline-edit, paste multi-kolom, perhitungan nilai per baris) tidak bercampur dengan halaman induknya.

## Catatan Pengembangan

- Tailwind CSS v4 menggunakan `@import "tailwindcss"` di CSS dan plugin `@tailwindcss/vite` di `vite.config.js`.
- Formula variabel dievaluasi dengan `new Function(...)` yang hanya diberi variabel `bobot` dan `skor` — data ini dikontrol admin sendiri (bukan input publik), jadi aman dievaluasi langsung.
- Password di-hash dengan **bcrypt** (10 salt rounds). Reset password oleh admin tercatat waktu & pelakunya untuk keperluan audit.
- Database utama sekarang **SQLite** (`backend/src/data/web_penilaian.sqlite`). Migrasi dari JSON sudah selesai; script `migrate-to-sqlite.js` disimpan untuk referensi/re-run kalau perlu setup ulang dari data JSON arsip.
- Foto dokumentasi disajikan sebagai static file publik lewat `express.static('/uploads')` — tidak dilindungi `authMiddleware` (supaya tag `<img>`/`<a>` di frontend bisa memuatnya langsung tanpa perlu menyisipkan token).

---

## Created by hammPa.