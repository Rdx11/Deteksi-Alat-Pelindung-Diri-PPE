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

## 🛠️ Tech Stack

### Backend
- **Django 4.2** + Django REST Framework
- **Django Channels** (WebSocket untuk live detection)
- **Daphne** (ASGI server)
- **YOLOv8** (Ultralytics) - Model custom trained
- **OpenCV** - Image processing
- **Celery** + **Redis** - Background task processing
- **PostgreSQL** - Database

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS**
- **Zustand** - State management
- **React Query** - Data fetching
- **React Webcam** - Camera access
- **React Hot Toast** - Notifications

### Infrastructure
- **Docker** + **Docker Compose**
- **Nginx** - Reverse proxy
- **Redis** - Cache & message broker

## 📋 Prerequisites

- **Docker Desktop** (required)
- **Browser Modern** (Chrome/Firefox/Edge)
- **Webcam** (untuk fitur Live Camera)

### Spesifikasi Minimum:
- RAM: 4 GB (8 GB recommended)
- Storage: 5 GB free space
- CPU: 2 cores (4 cores recommended)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd ppe-detection
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` sesuai kebutuhan (opsional untuk development).

### 3. Download YOLO Model

**Manual Download:**
1. Kunjungi: https://github.com/snehilsanyal/Construction-Site-Safety-PPE-Detection
2. Download file `models/best.pt`
3. Simpan ke folder `backend/ml_models/ppe_yolo.pt`

**Model Details:**
- Architecture: YOLOv8n (Nano)
- Size: ~6 MB
- Classes: 10 (Hardhat, Mask, NO-Hardhat, NO-Mask, NO-Safety Vest, Person, Safety Cone, Safety Vest, machinery, vehicle)

### 4. Build dan Jalankan dengan Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Tunggu beberapa detik sampai services ready
```

### 5. Setup Database

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

Input untuk superuser:
- Username: `admin`
- Email: (tekan Enter untuk skip)
- Password: `admin123`
- Password (again): `admin123`

### 6. Akses Aplikasi

- **Frontend**: http://localhost
- **Login**: username dan password yang dibuat di step 5
- **Django Admin**: http://localhost/admin

## 🎨 Kelas PPE yang Dideteksi

Model dapat mendeteksi 10 classes:

| Class ID | Nama | Label | Status | Warna |
|----------|------|-------|--------|-------|
| 0 | hardhat | Helm | Safe | Hijau |
| 1 | mask | Masker | Safe | Hijau |
| 2 | no-hardhat | Tanpa Helm | Danger | Merah |
| 3 | no-mask | Tanpa Masker | Warning | Orange |
| 4 | no-safety-vest | Tanpa Rompi | Danger | Merah |
| 5 | person | Orang | Info | Biru |
| 6 | safety-cone | Safety Cone | Info | Kuning |
| 7 | safety-vest | Rompi Pengaman | Safe | Hijau |
| 8 | machinery | Mesin | Warning | Orange |
| 9 | vehicle | Kendaraan | Warning | Orange |

### Compliance Score

**Formula:**
```
Compliance Score = (Safe Detections / Total PPE Detections) × 100

Safe Detections = Helm + Rompi yang digunakan
Total PPE Detections = Semua deteksi PPE (dengan + tanpa)
```

## 📱 Penggunaan Aplikasi

### 1. Dashboard 📊
- Statistik compliance 7 hari terakhir
- Trend chart keselamatan
- Alert summary
- Metrics: Total Sessions, Detections, Avg Compliance, Alerts

### 2. Deteksi Gambar 📷
1. Klik menu "Detect Image"
2. Upload gambar (JPG/PNG)
3. Klik "Deteksi"
4. Lihat hasil dengan bounding boxes dan metrics

### 3. Deteksi Video 🎥
1. Klik menu "Detect Video"
2. Upload video (MP4/AVI/MOV)
3. Tunggu proses (background processing)
4. Lihat hasil per frame dengan metrics

### 4. Live Camera 📹
1. Klik menu "Live Camera"
2. Grant camera permission
3. Klik "Mulai Deteksi"
4. Lihat hasil real-time dengan FPS counter

### 5. Alerts 🚨
- Lihat pelanggaran PPE
- Acknowledge alerts untuk tandai sudah ditangani
- Filter by severity (danger/warning/info)

**Alert otomatis dibuat untuk:**
- DANGER: Tanpa helm, tanpa rompi
- WARNING: Tanpa masker

### 6. Riwayat Sesi 📝
- Lihat semua sesi deteksi
- Filter by type (image/video/live)
- Lihat detail hasil

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login/              - Login (JWT)
POST   /api/auth/refresh/            - Refresh token
GET    /api/auth/me/                 - Current user
```

### Detection
```
POST   /api/detect/image/            - Deteksi gambar
POST   /api/detect/video/            - Deteksi video
GET    /api/detect/status/<task_id>/ - Status task
GET    /api/detect/sessions/         - List sesi
GET    /api/detect/sessions/<id>/    - Detail sesi
GET    /api/detect/alerts/           - List alerts
PATCH  /api/detect/alerts/<id>/acknowledge/ - Acknowledge alert
GET    /api/detect/dashboard/stats/  - Dashboard stats
```

### WebSocket
```
ws://localhost/ws/detect/<session_id>/  - Live detection
```

**Message Format:**
```javascript
// Send
{ "frame": "data:image/jpeg;base64,..." }

// Receive
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
  "annotated_frame": "base64_image",
  "timestamp": "2026-03-05T19:30:00Z"
}
```

## 🐛 Troubleshooting

### Services tidak start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose restart
```

### Database error
```bash
# Restart database
docker-compose restart db

# Re-run migrations
docker-compose exec backend python manage.py migrate
```

### YOLO model tidak ditemukan
```bash
# Check model exists
docker-compose exec backend ls -la /app/ml_models/

# Download model manually (lihat step 3 di Quick Start)
```

### WebSocket error (Live Camera)
```bash
# Restart backend dan nginx
docker-compose restart backend nginx

# Check logs
docker logs ppe_backend --tail 50
```

### Port sudah digunakan
```bash
# Check port usage
netstat -ano | findstr :80
netstat -ano | findstr :8000

# Stop aplikasi yang menggunakan port atau
# Edit docker-compose.yml untuk ubah port
```

## 🎯 Quick Commands

```bash
# Start aplikasi
docker-compose up -d

# Stop aplikasi
docker-compose stop

# Restart aplikasi
docker-compose restart

# Check status
docker-compose ps

# View logs
docker logs ppe_backend --tail 50
docker logs ppe_frontend --tail 50
docker logs ppe_celery --tail 50

# Access database
docker-compose exec db psql -U postgres -d ppe_detection_db

# Access backend shell
docker-compose exec backend python manage.py shell

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Clean up (⚠️ hapus semua data)
docker-compose down -v
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
│   │   └── reports/          # Reports
│   ├── core/                 # Django settings
│   │   ├── settings.py
│   │   ├── asgi.py          # ASGI config
│   │   ├── celery.py        # Celery config
│   │   └── urls.py
│   ├── media/                # Uploaded files
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
├── .env.example              # Environment template
├── docker-compose.yml         # Docker compose config
└── README.md                  # This file
```

## 📝 Environment Variables

File `.env` berisi konfigurasi aplikasi. Copy dari `.env.example` dan sesuaikan:

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

## 🔧 Development Setup

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup database (pastikan PostgreSQL running)
python manage.py migrate
python manage.py createsuperuser

# Run server
daphne -b 0.0.0.0 -p 8000 core.asgi:application

# Run Celery (terminal baru)
celery -A core worker -l info
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Akses http://localhost:5173

## ⚠️ Production Notes

Untuk production deployment:

### Security
- ✅ Ganti `SECRET_KEY` dengan key yang aman
- ✅ Set `DEBUG=False`
- ✅ Update `ALLOWED_HOSTS` dengan domain production
- ✅ Konfigurasi HTTPS/SSL
- ✅ Gunakan strong password untuk database
- ✅ Enable CORS hanya untuk domain yang diperlukan

### Performance
- ✅ Use production database (PostgreSQL cluster)
- ✅ Setup Redis cluster
- ✅ Configure Celery workers sesuai load
- ✅ Enable caching
- ✅ Setup CDN untuk static files
- ✅ Optimize Docker images

### Monitoring
- ✅ Setup logging (Sentry, ELK)
- ✅ Monitor resource usage
- ✅ Setup alerts
- ✅ Backup database secara berkala

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

MIT License

## 🙏 Credits

- **YOLO Model**: [snehilsanyal/Construction-Site-Safety-PPE-Detection](https://github.com/snehilsanyal/Construction-Site-Safety-PPE-Detection)
- **YOLOv8**: [Ultralytics](https://github.com/ultralytics/ultralytics)

---

Dibuat dengan ❤️ untuk meningkatkan keselamatan kerja.
