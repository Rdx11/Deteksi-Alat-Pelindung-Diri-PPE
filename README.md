# Sistem Deteksi PPE Berbasis AI

Sistem deteksi otomatis untuk Personal Protective Equipment (PPE) menggunakan YOLOv8, Django, dan React.

## 🎯 Fitur Utama

- ✅ Deteksi Helm dan Rompi Pengaman
- ✅ Upload dan Deteksi Gambar
- ✅ Upload dan Deteksi Video (Background Processing)
- ✅ Live Camera Detection (Real-time WebSocket)
- ✅ Dashboard Monitoring Compliance
- ✅ Alert Management System
- ✅ Riwayat Sesi Deteksi

## 🛠️ Tech Stack

### Backend
- Django 4.2 + Django REST Framework
- Django Channels (WebSocket)
- YOLOv8 (Ultralytics)
- OpenCV
- Celery + Redis
- PostgreSQL

### Frontend
- React 18 + Vite
- Tailwind CSS
- Zustand (State Management)
- React Query
- Recharts (Data Visualization)
- React Webcam

## 📋 Prerequisites

- Docker & Docker Compose
- Python 3.11+ (untuk development lokal)
- Node.js 18+ (untuk development lokal)

## 🚀 Quick Start dengan Docker

### Langkah Cepat (Recommended)

1. **Clone repository dan masuk ke folder:**
```bash
cd ppe-detection
```

2. **Download YOLO Model:**
```powershell
.\download_model.ps1
```

3. **Jalankan aplikasi:**
```powershell
.\start.ps1
```

Script akan otomatis:
- ✅ Build Docker images
- ✅ Start semua services
- ✅ Setup database
- ✅ Create superuser (admin/admin123)
- ✅ Buka browser

4. **Akses aplikasi:**
- Frontend: http://localhost
- Login: `admin` / `admin123`

### Langkah Manual

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Download YOLO model:
```powershell
.\download_model.ps1
```

3. Build dan jalankan containers:
```bash
docker-compose up --build -d
```

4. Setup database:
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

5. Akses http://localhost

📖 **Panduan Lengkap**: Lihat [PANDUAN_MENJALANKAN_APLIKASI.md](PANDUAN_MENJALANKAN_APLIKASI.md)

## 🔧 Setup Development Lokal

### Backend Setup

1. Buat virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Setup database:
```bash
python manage.py makemigrations
python manage.py migrate
```

4. Buat superuser:
```bash
python manage.py createsuperuser
```

5. Jalankan development server:
```bash
# Terminal 1 - Django/Daphne
python manage.py runserver
# atau
daphne -b 0.0.0.0 -p 8000 core.asgi:application

# Terminal 2 - Celery Worker
celery -A core worker -l info

# Terminal 3 - Redis (jika belum running)
redis-server
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Jalankan development server:
```bash
npm run dev
```

3. Akses http://localhost:5173

## 📦 Model YOLO

Aplikasi ini menggunakan model YOLOv8 yang sudah di-train untuk deteksi PPE dari repository [snehilsanyal/Construction-Site-Safety-PPE-Detection](https://github.com/snehilsanyal/Construction-Site-Safety-PPE-Detection).

### Quick Setup Model:

**Cara Termudah - Jalankan Script:**
```bash
.\download_model.ps1
```

Script ini akan otomatis download model `best.pt` (trained 100 epochs) dan menyimpannya ke `backend/ml_models/ppe_yolo.pt`.

### Manual Download:
1. Kunjungi: https://github.com/snehilsanyal/Construction-Site-Safety-PPE-Detection
2. Download file `models/best.pt`
3. Simpan ke folder `backend/ml_models/ppe_yolo.pt`

### Model Details:
- **Architecture**: YOLOv8n (Nano)
- **Classes**: 10 classes (Hardhat, Mask, NO-Hardhat, NO-Mask, NO-Safety Vest, Person, Safety Cone, Safety Vest, machinery, vehicle)
- **Training**: 100 epochs on Construction Site Safety dataset
- **Performance**: High accuracy untuk deteksi PPE

Lihat [MODEL_INFO.md](MODEL_INFO.md) untuk detail lengkap tentang model.

### Fallback Model:
Jika model custom tidak tersedia, aplikasi akan menggunakan YOLOv8n sebagai fallback untuk testing (akurasi tidak optimal).

## 🎨 Kelas PPE yang Dideteksi

Model dapat mendeteksi 10 classes:

| Class ID | Nama | Label | Status | Warna | Keterangan |
|----------|------|-------|--------|-------|------------|
| 0 | Hardhat | Helm | Safe | Hijau | Pekerja memakai helm |
| 1 | Mask | Masker | Safe | Hijau | Pekerja memakai masker |
| 2 | NO-Hardhat | Tanpa Helm | Danger | Merah | ⚠️ Pekerja TIDAK memakai helm |
| 3 | NO-Mask | Tanpa Masker | Warning | Orange | Pekerja TIDAK memakai masker |
| 4 | NO-Safety Vest | Tanpa Rompi | Danger | Merah | ⚠️ Pekerja TIDAK memakai rompi |
| 5 | Person | Orang | Info | Biru | Deteksi orang |
| 6 | Safety Cone | Safety Cone | Info | Kuning | Cone pengaman |
| 7 | Safety Vest | Rompi Pengaman | Safe | Hijau | Pekerja memakai rompi |
| 8 | machinery | Mesin | Warning | Orange | Mesin/alat berat |
| 9 | vehicle | Kendaraan | Warning | Orange | Kendaraan |

**Compliance Score** dihitung berdasarkan:
- Deteksi helm (Hardhat vs NO-Hardhat)
- Deteksi rompi (Safety Vest vs NO-Safety Vest)
- Formula: (Safe detections / Total detections) × 100

## 📱 Penggunaan Aplikasi

### 1. Login
- Username: admin
- Password: admin123 (atau buat user baru)

### 2. Dashboard
- Lihat statistik compliance
- Monitor tren keselamatan
- Cek peringatan aktif

### 3. Deteksi Gambar
- Upload gambar
- Sistem akan mendeteksi PPE
- Lihat hasil dengan bounding boxes

### 4. Deteksi Video
- Upload video
- Proses berjalan di background
- Track progress real-time
- Lihat hasil di Riwayat Sesi

### 5. Live Camera
- Aktifkan kamera
- Deteksi real-time via WebSocket
- Lihat hasil langsung

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/refresh/` - Refresh token
- `GET /api/auth/me/` - Current user

### Detection
- `POST /api/detect/image/` - Deteksi gambar
- `POST /api/detect/video/` - Deteksi video
- `GET /api/detect/status/<task_id>/` - Cek status task
- `GET /api/detect/sessions/` - List sesi
- `GET /api/detect/alerts/` - List alerts
- `PATCH /api/detect/alerts/<id>/acknowledge/` - Acknowledge alert
- `GET /api/detect/dashboard/stats/` - Dashboard statistics

### WebSocket
- `ws://localhost/ws/detect/<session_id>/` - Live detection

## 🐛 Troubleshooting

### Quick Fixes

```powershell
# Restart semua services
docker-compose restart

# Check status
docker-compose ps

# View logs
docker logs ppe_backend --tail 50
docker logs ppe_frontend --tail 50

# Reset everything (⚠️ hapus semua data)
docker-compose down -v
.\start.ps1
```

### Common Issues

| Problem | Solution |
|---------|----------|
| Port sudah digunakan | Stop aplikasi lain atau ubah port di `docker-compose.yml` |
| Database error | `docker-compose restart db` |
| Redis error | `docker-compose restart redis` |
| YOLO model error | Jalankan `.\download_model.ps1` |
| WebSocket error | `docker-compose restart backend nginx` |
| Live camera tidak jalan | Lihat [LIVE_CAMERA_TROUBLESHOOTING.md](LIVE_CAMERA_TROUBLESHOOTING.md) |
| Video detection error | Lihat [VIDEO_DETECTION_BUGFIX.md](VIDEO_DETECTION_BUGFIX.md) |

📖 **Troubleshooting Lengkap**: Lihat [PANDUAN_MENJALANKAN_APLIKASI.md](PANDUAN_MENJALANKAN_APLIKASI.md#troubleshooting)

## 📝 Environment Variables

Lihat `.env.example` untuk daftar lengkap environment variables yang tersedia.

## 📚 Dokumentasi Lengkap

- 📖 [PANDUAN_MENJALANKAN_APLIKASI.md](PANDUAN_MENJALANKAN_APLIKASI.md) - Panduan lengkap instalasi dan menjalankan aplikasi
- 🎥 [TEST_LIVE_CAMERA.md](TEST_LIVE_CAMERA.md) - Panduan test live camera detection
- 🔧 [LIVE_CAMERA_TROUBLESHOOTING.md](LIVE_CAMERA_TROUBLESHOOTING.md) - Troubleshooting live camera
- 🎬 [VIDEO_DETECTION_BUGFIX.md](VIDEO_DETECTION_BUGFIX.md) - Fix video detection issues
- 📊 [LIVE_CAMERA_FIX_SUMMARY.md](LIVE_CAMERA_FIX_SUMMARY.md) - Summary perbaikan live camera
- 🤖 [MODEL_INFO.md](MODEL_INFO.md) - Informasi detail YOLO model

## 🎯 Quick Commands

```powershell
# Start aplikasi
.\start.ps1

# Stop aplikasi
docker-compose stop

# Restart aplikasi
docker-compose restart

# Check status
docker-compose ps

# View logs
docker logs ppe_backend -f

# Clean up
docker-compose down -v
```

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📄 License

MIT License

## 👨‍💻 Developer

Dibuat dengan ❤️ untuk meningkatkan keselamatan kerja

---

**Catatan:** Aplikasi ini adalah sistem demo. Untuk production, pastikan:
- Gunakan SECRET_KEY yang aman
- Set DEBUG=False
- Konfigurasi HTTPS
- Setup proper authentication
- Backup database secara berkala
