# Sistem Deteksi PPE Berbasis AI

Sistem deteksi otomatis untuk Personal Protective Equipment (PPE) menggunakan YOLOv8, Django, dan React dengan fitur real-time detection via WebSocket.

## 🎯 Fitur Utama

- ✅ **Deteksi Helm dan Rompi Pengaman** - Deteksi otomatis PPE dengan YOLO model
- ✅ **Upload dan Deteksi Gambar** - Upload gambar dan lihat hasil deteksi instant
- ✅ **Upload dan Deteksi Video** - Background processing dengan Celery, hasil per frame
- ✅ **Live Camera Detection** - Real-time detection via WebSocket dengan FPS counter
- ✅ **Dashboard Monitoring** - Statistik compliance, trend analysis, alert summary
- ✅ **Alert Management System** - Acknowledge alerts, tracking, audit trail
- ✅ **Riwayat Sesi Deteksi** - History lengkap dengan filter dan search
- ✅ **6 Metrics Cards** - Total Orang, Compliance Score, Dengan/Tanpa Helm & Rompi
- ✅ **Annotated Images** - Bounding boxes dengan color-coded status

## 🛠️ Tech Stack

### Backend
- **Django 4.2** + Django REST Framework
- **Django Channels** (WebSocket untuk live detection)
- **Daphne** (ASGI server)
- **YOLOv8** (Ultralytics) - Model custom trained 100 epochs
- **OpenCV** - Image processing
- **Celery** + **Redis** - Background task processing
- **PostgreSQL** - Database

### Frontend
- **React 18** + **Vite** - Fast development
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Query** - Data fetching & caching
- **React Webcam** - Camera access
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Infrastructure
- **Docker** + **Docker Compose** - Containerization
- **Nginx** - Reverse proxy & static files
- **Redis** - Cache & message broker

## 📋 Prerequisites

- **Docker Desktop** (required)
- **PowerShell** atau Command Prompt
- **Browser Modern** (Chrome/Firefox/Edge recommended)
- **Webcam** (untuk fitur Live Camera)

### Spesifikasi Minimum:
- RAM: 4 GB (8 GB recommended)
- Storage: 5 GB free space
- CPU: 2 cores (4 cores recommended)
- OS: Windows 10/11, Linux, macOS

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
- ✅ Start semua services (backend, frontend, db, redis, celery, nginx)
- ✅ Setup database & run migrations
- ✅ Create superuser (admin/admin123)
- ✅ Buka browser otomatis

4. **Akses aplikasi:**
- **Frontend**: http://localhost
- **Login**: `admin` / `admin123`
- **Django Admin**: http://localhost/admin

### Langkah Manual

1. **Copy environment variables:**
```bash
cp .env.example .env
```

2. **Download YOLO model:**
```powershell
.\download_model.ps1
```

3. **Build dan jalankan containers:**
```bash
docker-compose up --build -d
```

4. **Setup database:**
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

5. **Akses http://localhost**

📖 **Panduan Lengkap**: Lihat [PANDUAN_MENJALANKAN_APLIKASI.md](PANDUAN_MENJALANKAN_APLIKASI.md)

## 🔧 Setup Development Lokal

### Backend Setup

1. **Buat virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Setup database:**
```bash
python manage.py migrate
python manage.py createsuperuser
```

4. **Jalankan development server:**
```bash
# Terminal 1 - Daphne (ASGI server untuk WebSocket)
daphne -b 0.0.0.0 -p 8000 core.asgi:application

# Terminal 2 - Celery Worker (untuk video processing)
celery -A core worker -l info

# Terminal 3 - Redis (jika belum running)
redis-server
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Jalankan development server:**
```bash
npm run dev
```

3. **Akses http://localhost:5173**

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
- **Architecture**: YOLOv8n (Nano) - Fast & efficient
- **Classes**: 10 classes (Hardhat, Mask, NO-Hardhat, NO-Mask, NO-Safety Vest, Person, Safety Cone, Safety Vest, machinery, vehicle)
- **Training**: 100 epochs on Construction Site Safety dataset
- **Size**: ~6 MB
- **Performance**: High accuracy untuk deteksi PPE
- **Inference Time**: ~100-300ms per frame

Lihat [MODEL_INFO.md](MODEL_INFO.md) untuk detail lengkap tentang model.

## 🎨 Kelas PPE yang Dideteksi

Model dapat mendeteksi 10 classes:

| Class ID | Nama | Label | Status | Warna | Keterangan |
|----------|------|-------|--------|-------|------------|
| 0 | hardhat | Helm | Safe | Hijau | Pekerja memakai helm |
| 1 | mask | Masker | Safe | Hijau | Pekerja memakai masker |
| 2 | no-hardhat | Tanpa Helm | Danger | Merah | ⚠️ Pekerja TIDAK memakai helm |
| 3 | no-mask | Tanpa Masker | Warning | Orange | Pekerja TIDAK memakai masker |
| 4 | no-safety-vest | Tanpa Rompi | Danger | Merah | ⚠️ Pekerja TIDAK memakai rompi |
| 5 | person | Orang | Info | Biru | Deteksi orang |
| 6 | safety-cone | Safety Cone | Info | Kuning | Cone pengaman |
| 7 | safety-vest | Rompi Pengaman | Safe | Hijau | Pekerja memakai rompi |
| 8 | machinery | Mesin | Warning | Orange | Mesin/alat berat |
| 9 | vehicle | Kendaraan | Warning | Orange | Kendaraan |

### Compliance Score Calculation:

**Logika Perhitungan:**
```python
# Prioritas 1: Gunakan deteksi 'person' jika ada
if person_count > 0:
    total_persons = person_count
else:
    # Prioritas 2: Estimasi dari max(total helm, total rompi)
    total_persons = max(helmet_detections, vest_detections)

# Jika ada violation terdeteksi
if violations > 0:
    compliance_score = (safe_count / total_detections) * 100
else:
    # Tidak ada violation, hitung dari PPE yang digunakan
    compliance_score = (ppe_used / ppe_required) * 100
```

**Formula:**
- **Safe Count** = Helm + Rompi yang digunakan
- **Total Detections** = Semua deteksi PPE (dengan + tanpa)
- **Compliance Score** = (Safe Count / Total Detections) × 100

## 📱 Penggunaan Aplikasi

### 1. Login
- **URL**: http://localhost
- **Username**: `admin`
- **Password**: `admin123`

### 2. Dashboard 📊
- Lihat statistik compliance (7 hari terakhir)
- Monitor tren keselamatan dengan chart
- Cek peringatan aktif (unacknowledged alerts)
- Summary: Total Sessions, Detections, Avg Compliance, Alerts

### 3. Deteksi Gambar 📷
1. Klik menu "Detect Image"
2. Upload gambar (JPG/PNG, max 10MB)
3. Klik "Deteksi"
4. Lihat hasil dengan:
   - Annotated image dengan bounding boxes
   - 6 metrics cards (Total Orang, Compliance, Helm, Rompi)
   - Detail deteksi list dengan status badges

### 4. Deteksi Video 🎥
1. Klik menu "Detect Video"
2. Upload video (MP4/AVI/MOV, max 100MB)
3. Tunggu proses (background processing via Celery)
4. Track progress real-time (progress bar)
5. Lihat hasil per frame:
   - Aggregate metrics (6 cards)
   - Detail per frame dengan annotated image
   - Scrollable frame list
   - Compliance score per frame

### 5. Live Camera 📹
1. Klik menu "Live Camera"
2. Grant camera permission di browser
3. Klik "Mulai Deteksi"
4. Lihat hasil real-time:
   - Annotated frame dengan bounding boxes
   - FPS counter (frames per second)
   - LIVE badge dengan red dot animasi
   - 6 metrics cards update real-time
   - Detail deteksi list scrollable
   - Timestamp last update

**Troubleshooting Live Camera**: Lihat [LIVE_CAMERA_TROUBLESHOOTING.md](LIVE_CAMERA_TROUBLESHOOTING.md)

### 6. Riwayat Sesi 📝
- Lihat semua sesi deteksi (image/video/live)
- Filter by type dan date
- Lihat detail hasil per sesi
- Download hasil (future feature)

### 7. Alerts 🚨
- Lihat pelanggaran PPE yang terdeteksi
- Alert otomatis dibuat untuk:
  - **DANGER**: Tanpa helm, tanpa rompi
  - **WARNING**: Tanpa masker
- **Acknowledge alerts** untuk tandai sudah ditangani
- Track siapa dan kapan acknowledge
- Filter by severity dan status

**Penjelasan Acknowledge**: Lihat [PENJELASAN_ACKNOWLEDGE.md](PENJELASAN_ACKNOWLEDGE.md)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login/` - Login (JWT token)
- `POST /api/auth/refresh/` - Refresh token
- `GET /api/auth/me/` - Current user info

### Detection
- `POST /api/detect/image/` - Deteksi gambar (multipart/form-data)
- `POST /api/detect/video/` - Deteksi video (multipart/form-data)
- `GET /api/detect/status/<task_id>/` - Cek status task Celery
- `GET /api/detect/sessions/` - List sesi deteksi
- `GET /api/detect/sessions/<id>/` - Detail sesi (include results)
- `GET /api/detect/alerts/` - List alerts
- `PATCH /api/detect/alerts/<id>/acknowledge/` - Acknowledge alert
- `GET /api/detect/dashboard/stats/?days=7` - Dashboard statistics

### WebSocket
- `ws://localhost/ws/detect/<session_id>/` - Live detection WebSocket

**WebSocket Message Format:**
```javascript
// Send (Frontend → Backend)
{
  "frame": "data:image/jpeg;base64,..."
}

// Receive (Backend → Frontend)
{
  "detections": [...],
  "metrics": {
    "total_persons": 2,
    "compliance_score": 75.5,
    "persons_with_helmet": 2,
    "persons_with_vest": 1,
    "persons_without_helmet": 0,
    "persons_without_vest": 1
  },
  "annotated_frame": "base64_encoded_image",
  "timestamp": "2026-03-05T19:30:00Z"
}
```

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
| Gambar frame tidak muncul | Check nginx config & media volume mount |

📖 **Troubleshooting Lengkap**: Lihat [PANDUAN_MENJALANKAN_APLIKASI.md](PANDUAN_MENJALANKAN_APLIKASI.md#troubleshooting)

## 📝 Environment Variables

File `.env` berisi konfigurasi aplikasi:

```env
# Database
DB_NAME=ppe_detection_db
DB_USER=postgres
DB_PASSWORD=postgres123
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# YOLO Model
YOLO_MODEL_PATH=ml_models/ppe_yolo.pt
YOLO_CONFIDENCE_THRESHOLD=0.5
YOLO_IOU_THRESHOLD=0.45

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

## 📚 Dokumentasi Lengkap

### 🚀 Getting Started
- 📖 [PANDUAN_MENJALANKAN_APLIKASI.md](PANDUAN_MENJALANKAN_APLIKASI.md) - Panduan lengkap instalasi dan menjalankan aplikasi
- 📋 [DOKUMENTASI_INDEX.md](DOKUMENTASI_INDEX.md) - Index semua dokumentasi

### 🎥 Features
- 🎬 [TEST_LIVE_CAMERA.md](TEST_LIVE_CAMERA.md) - Panduan test live camera detection
- 📹 [VIDEO_DETECTION_ENHANCED.md](VIDEO_DETECTION_ENHANCED.md) - Fitur enhanced video detection
- 🔔 [PENJELASAN_ACKNOWLEDGE.md](PENJELASAN_ACKNOWLEDGE.md) - Penjelasan tombol acknowledge

### 🔧 Troubleshooting
- 🛠️ [LIVE_CAMERA_TROUBLESHOOTING.md](LIVE_CAMERA_TROUBLESHOOTING.md) - Troubleshooting live camera
- 🐛 [VIDEO_DETECTION_BUGFIX.md](VIDEO_DETECTION_BUGFIX.md) - Fix video detection issues
- 📊 [LIVE_CAMERA_FIX_SUMMARY.md](LIVE_CAMERA_FIX_SUMMARY.md) - Summary perbaikan live camera

### 🤖 Technical
- 🎯 [MODEL_INFO.md](MODEL_INFO.md) - Informasi detail YOLO model
- 🔐 [LOGIN_VALIDATION.md](LOGIN_VALIDATION.md) - Validasi login form

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

# View logs (follow mode)
docker logs ppe_backend -f
docker logs ppe_frontend -f
docker logs ppe_celery -f

# Access database
docker-compose exec db psql -U postgres -d ppe_detection_db

# Access backend shell
docker-compose exec backend python manage.py shell

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Clean up
docker-compose down -v
docker system prune -a
```

## 🏗️ Struktur Project

```
ppe-detection/
├── backend/                    # Django backend
│   ├── apps/                  # Django apps
│   │   ├── detection/        # Detection app (main)
│   │   │   ├── consumers.py  # WebSocket consumer
│   │   │   ├── models.py     # Database models
│   │   │   ├── serializers.py
│   │   │   ├── services/     # YOLO service
│   │   │   ├── tasks.py      # Celery tasks
│   │   │   ├── views.py      # API views
│   │   │   └── routing.py    # WebSocket routing
│   │   ├── users/            # User management
│   │   └── reports/          # Reports (future)
│   ├── core/                 # Django settings
│   │   ├── settings.py
│   │   ├── asgi.py          # ASGI config
│   │   ├── celery.py        # Celery config
│   │   └── urls.py
│   ├── media/                # Uploaded files
│   │   ├── detections/      # Source files
│   │   └── annotated/       # Annotated images
│   ├── ml_models/            # YOLO model
│   │   └── ppe_yolo.pt
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand stores
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── nginx/                     # Nginx config
│   └── nginx.conf
├── .env                       # Environment variables
├── docker-compose.yml         # Docker compose config
├── start.ps1                  # Start script
├── download_model.ps1         # Model download script
└── README.md                  # This file
```

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

MIT License - Lihat file [LICENSE](LICENSE) untuk detail

## 👨‍💻 Developer

Dibuat dengan ❤️ untuk meningkatkan keselamatan kerja di konstruksi dan industri.

## 🙏 Credits

- **YOLO Model**: [snehilsanyal/Construction-Site-Safety-PPE-Detection](https://github.com/snehilsanyal/Construction-Site-Safety-PPE-Detection)
- **YOLOv8**: [Ultralytics](https://github.com/ultralytics/ultralytics)
- **Icons**: [Lucide Icons](https://lucide.dev/)

---

## ⚠️ Production Deployment Notes

Untuk production deployment, pastikan:

### Security
- ✅ Ganti `SECRET_KEY` dengan key yang aman (gunakan `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- ✅ Set `DEBUG=False` di `.env`
- ✅ Update `ALLOWED_HOSTS` dengan domain production
- ✅ Konfigurasi HTTPS/SSL
- ✅ Setup proper authentication & authorization
- ✅ Gunakan strong password untuk database
- ✅ Enable CORS hanya untuk domain yang diperlukan

### Performance
- ✅ Use production-grade database (PostgreSQL cluster)
- ✅ Setup Redis cluster untuk high availability
- ✅ Configure Celery workers sesuai load
- ✅ Enable caching (Redis/Memcached)
- ✅ Setup CDN untuk static files
- ✅ Optimize Docker images (multi-stage builds)
- ✅ Configure nginx caching & compression

### Monitoring
- ✅ Setup logging (ELK stack, Sentry)
- ✅ Monitor resource usage (Prometheus, Grafana)
- ✅ Setup alerts untuk errors & downtime
- ✅ Backup database secara berkala
- ✅ Monitor YOLO model performance

### Scalability
- ✅ Use load balancer untuk multiple backend instances
- ✅ Horizontal scaling untuk Celery workers
- ✅ Database read replicas
- ✅ Redis Sentinel untuk failover
- ✅ Container orchestration (Kubernetes)

---

**Version**: 1.1.3  
**Last Updated**: 5 Maret 2026  
**Status**: ✅ Production Ready (with proper configuration)

Untuk pertanyaan atau feedback, silakan buat issue di repository.
