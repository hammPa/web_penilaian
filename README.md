# Sistem Penilaian

Aplikasi web untuk melakukan penilaian berbasis **Sesi Assessment → Tabel Penilaian → Kriteria → Variabel** dengan level skor 0–N (fleksibel, tidak lagi tetap 0–5), dilengkapi manajemen Tim, Grup, dan Pengguna, menggunakan React 19, Vite, Tailwind CSS v4, Express.js, dan database yang bisa dipilih (**JSON / SQLite / MariaDB**).

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
  - **Validasi tim**: user hanya bisa menilai Grup yang setim dengan dirinya (dicek di layer Service, bukan cuma dropdown frontend, jadi tidak bisa dibypass lewat API langsung). Admin dikecualikan dari validasi ini.
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

| Layer      | Teknologi                                                          |
|------------|------------------------------------------------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS v4, React Router DOM, Axios              |
| Backend    | Node.js, Express.js                                                    |
| Database   | **JSON / SQLite / MariaDB** (dipilih via `DB_MODE`, lihat bagian Database di bawah) |
| Autentikasi| JWT + bcrypt                                                            |
| Deployment | Docker (backend), Vercel (frontend)                                    |

## Database — 3 Mode yang Bisa Dipilih

Aplikasi ini mendukung 3 mode penyimpanan sekaligus, diatur lewat `DB_MODE` di `.env`, **tanpa mengubah kode Controller/Service** — cuma Repository yang tahu bedanya.

| `DB_MODE` | Penyimpanan | Cocok untuk |
|---|---|---|
| `json` | File JSON per entity (`data/*.json`) | Development paling ringan, tanpa setup apapun |
| `sqlite` | 1 file `.sqlite`, format `id` + `data` blob per baris | Development/staging, tanpa server DB terpisah |
| `mariadb` | Skema relasional penuh (tabel & kolom sungguhan, foreign key, cascade) | Produksi |

### Kenapa mode mariadb butuh skema relasional, bukan sekadar `id`+`data`?

Karena tujuannya memang query & integritas data yang sesungguhnya (`JOIN`, `FOREIGN KEY`, `ON DELETE CASCADE`) — bukan cuma penyimpanan blob. Konsekuensinya:
- Semua Repository & Service jadi **penuh `async/await`** (driver MariaDB di Node selalu asynchronous, beda dari `better-sqlite3` yang synchronous).
- Setiap Repository (`UserRepository`, `SessionRepository`, dst.) punya mapping `toRow()`/`fromRow()` buat konversi antara bentuk objek JS (camelCase) dan kolom SQL (snake_case).
- Kolom bertipe tanggal (`created_at`, `updated_at`) dikonversi dua arah lewat `utils/dateHelper.js` (ISO 8601 UTC ↔ format `DATETIME` MariaDB), supaya perilaku sorting/perbandingan tanggal tetap konsisten di ketiga mode.

### Assessment: dipecah jadi tabel relasional

Data penilaian (`selections`, `photos`, hasil kalkulasi `results`) di mode `mariadb` **tidak** disimpan sebagai kolom JSON tunggal, melainkan dipecah jadi tabel-tabel anak supaya bisa di-query/agregasi langsung lewat SQL:

- `assessments` — baris utama (id, user, group, session, recommendation, `total`, `percentage`, timestamp)
- `assessment_selections` — pilihan level per variabel
- `assessment_photos` — url foto, urut
- `assessment_variable_scores` — skor hasil evaluasi formula per variabel
- `assessment_criteria_subtotals` — subtotal per kriteria

Semua ini digabung kembali otomatis oleh `AssessmentRepository` jadi bentuk objek yang sama persis seperti sebelumnya (`{ selections: [...], photos: [...], results: {...} }`), jadi `AssessmentService` **tidak perlu tahu** perbedaan ini sama sekali.

### Environment Variable untuk Mode MariaDB

```env
DB_MODE=mariadb
DB_HOST=localhost
DB_PORT=3306
DB_USER=admin_web_penilaian
DB_PASSWORD=your_password
DB_NAME=web_penilaian
```

### Setup Database MariaDB

**Instalasi baru (database kosong):**
```bash
node migrate-sqlite-to-mariadb.js
```
Script ini otomatis menjalankan `schema_final.sql` (bikin semua tabel kalau belum ada) lalu memigrasikan data dari `sqlite` lama (kalau ada) ke `mariadb`. Aman dijalankan berulang kali (idempotent).

**Verifikasi cepat setelah setup:**
```bash
node smoke-test-mariadb.js
```
Menjalankan siklus create → read → update → delete lengkap (termasuk cek round-trip datetime & data ter-split assessment), lalu membersihkan data dummy-nya sendiri.

## Struktur Proyek

```text
project-root/
├── backend/
│   ├── Dockerfile
│   ├── schema_final.sql            # skema relasional lengkap untuk mode mariadb
│   ├── migrate-sqlite-to-mariadb.js # migrasi satu kali: sqlite -> mariadb (jalankan schema + data)
│   ├── smoke-test-mariadb.js       # verifikasi CRUD + datetime + assessment split di mode mariadb
│   ├── migrate_hash_pass.js        # migrasi satu kali: hash ulang password lama (plaintext -> bcrypt)
│   ├── migrate-to-sqlite.js        # migrasi satu kali (arsip): pindahkan data dari JSON ke SQLite
│   ├── migrations/                 # migrasi bertahap (dipakai saat splitting skema mariadb yang sudah live)
│   ├── public/
│   │   └── uploads/                # foto dokumentasi assessment (disajikan lewat express.static)
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   ├── db.js               # koneksi SQLite
│       │   ├── db-mariadb.js       # connection pool MariaDB (mysql2/promise)
│       │   └── index.js            # konfigurasi umum (JWT secret, DB_MODE, kredensial mariadb, dll.)
│       ├── controllers/            # Assessment, Auth, Criteria, Group, Session, Table, Team, Upload, User, Variable
│       ├── services/                # business logic per entity (async/await penuh)
│       ├── repositories/            # akses data — mendukung 3 mode (json/sqlite/mariadb), Repository Pattern
│       ├── routes/                  # definisi endpoint per entity
│       ├── middleware/              # authMiddleware, adminMiddleware, errorHandler
│       ├── utils/                   # evaluator formula, response formatter, dateHelper (konversi datetime mariadb)
│       └── data/                    # database SQLite/JSON (mode dev)
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
- MariaDB/MySQL server (hanya kalau mau pakai `DB_MODE=mariadb`)

### Backend

```bash
cd backend
npm install
```

Buat file `.env`:
```env
PORT=5000
JWT_SECRET=ganti-dengan-string-acak-yang-sulit-ditebak

# mode = json | sqlite | mariadb
DB_MODE=json

# hanya dipakai kalau DB_MODE=sqlite
DB_FILE=web_penilaian.sqlite

# hanya dipakai kalau DB_MODE=mariadb
DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
```

```bash
npm run dev
```

Server berjalan di `http://localhost:5000`.

**Migrasi satu kali (kalau setup dari data lama):**
```bash
node migrate_hash_pass.js          # hash ulang password lama yang masih plaintext
node migrate-to-sqlite.js          # pindahkan data JSON lama ke SQLite (kalau belum pernah dijalankan)
node migrate-sqlite-to-mariadb.js  # pindah dari sqlite ke mariadb (bikin schema + migrasi data sekaligus)
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
5. User mengisi penilaian untuk Grup yang dipilih (harus setim, divalidasi di backend): memilih level skor per Variabel, opsional unggah foto dokumentasi.
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

### Pengguna (Admin)
- `GET    /users`
- `GET    /users/:id`
- `POST   /users`
- `PUT    /users/:id`
- `PUT    /users/:id/reset-password` — reset password oleh admin
- `DELETE /users/:id`

### Penilaian
- `POST   /assessments` — buat penilaian (body: `{ selections: [{ variableId, selectedLevel }], groupId, sessionId, photos? }`). Ditolak (403) kalau user bukan admin dan grup yang dituju tidak setim dengannya.
- `GET    /assessments` — semua penilaian (admin lihat semua, user lihat miliknya sendiri)
- `GET    /assessments/:id` — detail penilaian
- `PUT    /assessments/:id` — update penilaian milik sendiri (atau admin)

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

### Backend – Layered Architecture (Repository Pattern, 3 Mode Database)
```
Controller → Service → Repository → (JSON file | SQLite | MariaDB)
```
- **Controller**: hanya menerima request dan mengirim response.
- **Service**: berisi aturan bisnis (validasi, cascade delete, kalkulasi, validasi tim untuk assessment), tidak menyentuh detail penyimpanan.
- **Repository**: satu-satunya lapisan yang tahu detail penyimpanan. `BaseRepository` menyediakan CRUD generik untuk ketiga mode; Repository per entity (`UserRepository`, `AssessmentRepository`, dst.) meng-override mapping kolom (`toRow`/`fromRow`) dan query khusus (`findByXxxId`) bila perlu. Semua method Repository selalu mengembalikan `Promise`, terlepas dari mode aktif — jadi Service tinggal `await` tanpa peduli mode mana yang jalan.
- Berpindah mode database cukup lewat `DB_MODE` di `.env` — Controller dan Service tidak perlu diubah sama sekali.

### Frontend – Clean Components
- **Axios hanya dipakai di folder `services`**, tidak langsung di komponen/halaman.
- Komponen reusable (`Card`, `Table`, `Modal`, `Loading`, `EmptyState`, `ToastContainer`) mengurangi duplikasi.
- Context API (`AuthContext`) untuk manajemen sesi login & role.
- Mode tampilan Tabel Penilaian dipecah jadi submodule terpisah (`table_mode/`, `list_mode/`) supaya logic grid yang kompleks (inline-edit, paste multi-kolom, perhitungan nilai per baris) tidak bercampur dengan halaman induknya.

## Catatan Pengembangan

- Tailwind CSS v4 menggunakan `@import "tailwindcss"` di CSS dan plugin `@tailwindcss/vite` di `vite.config.js`.
- Formula variabel dievaluasi dengan `new Function(...)` yang hanya diberi variabel `bobot` dan `skor` — data ini dikontrol admin sendiri (bukan input publik), jadi aman dievaluasi langsung.
- Password di-hash dengan **bcrypt** (10 salt rounds). Reset password oleh admin tercatat waktu & pelakunya untuk keperluan audit.
- Database bisa dipilih lewat `DB_MODE` (`json` / `sqlite` / `mariadb`) — lihat bagian [Database](#database--3-mode-yang-bisa-dipilih) di atas untuk detail arsitektur & cara migrasi.
- Kolom `DATETIME` di mode mariadb dikonversi eksplisit ke/dari ISO 8601 UTC (`src/utils/dateHelper.js`) supaya tidak ada pergeseran timezone saat data dibaca ulang.
- Foto dokumentasi disajikan sebagai static file publik lewat `express.static('/uploads')` — tidak dilindungi `authMiddleware` (supaya tag `<img>`/`<a>` di frontend bisa memuatnya langsung tanpa perlu menyisipkan token).
- **FK cascade di mode mariadb** saat ini: hapus User/Group/Session akan ikut menghapus Assessment terkait (`ON DELETE CASCADE`); hapus Variable/Criteria yang sudah dipakai di Assessment lama juga ikut menghapus baris skor terkait. Kalau aplikasi ini masuk produksi jangka panjang dengan kebutuhan audit trail historis, pertimbangkan untuk mengganti FK ini jadi `ON DELETE RESTRICT` supaya penghapusan yang berisiko kehilangan data historis diblokir secara eksplisit alih-alih terjadi otomatis.

---

## Created by hammPa.