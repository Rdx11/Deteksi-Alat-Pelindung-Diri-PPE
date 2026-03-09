# Sistem Deteksi PPE Berbasis AI dengan Object Tracking

Sistem deteksi otomatis untuk Personal Protective Equipment (PPE) menggunakan YOLOv8, Django, dan React dengan fitur real-time detection, WebSocket, dan SF-SORT object tracking untuk mencegah double counting.

## 🎯 Fitur Utama

- ✅ **Deteksi Helm dan Rompi Pengaman** - Deteksi otomatis PPE dengan YOLO model custom
- ✅ **Object Tracking (SF-SORT)** - Tracking objek dengan unique ID untuk mencegah double counting
- ✅ **Upload dan Deteksi Gambar** - Upload gambar dan lihat hasil deteksi instant
- ✅ **Upload dan Deteksi Video** - Processing video dengan tracking, hasil per frame tanpa over-counting
- ✅ **Live Camera Detection** - Real-time detection via WebSocket dengan tracking dan FPS counter
- ✅ **Dashboard Monitoring** - Statistik compliance, trend analysis, alert summary
- ✅ **Alert Management System** - Acknowledge alerts, tracking, audit trail
- ✅ **Riwayat Sesi Deteksi** - History lengkap dengan filter dan search
- ✅ **Professional UI** - Modern interface dengan Lucide React icons

## 🚀 Fitur Tracking (SF-SORT)

### Masalah yang Diselesaikan
- ❌ **Sebelum**: Video 3 orang terdeteksi sebagai 30 orang (double counting)
- ✅ **Sesudah**: Video 3 orang terdeteksi sebagai 3 orang (accurate counting)

### Cara Kerja
- Setiap objek mendapat **unique persistent ID**
- ID tetap sama selama objek masih dalam frame
- Objek yang keluar dan masuk kembali dikenali dengan ID yang sama
- Metrics dihitung dari unique track IDs, bukan sum per frame

### Algoritma
- **Kalman Filter** - Prediksi posisi objek
- **Hungarian Algorithm** - Optimal matching detections ke tracks
- **IoU Matching** - Association berdasarkan Intersection over Union

## 🛠️ Tech Stack

### Backend
- **Django 4.2** + Django REST Framework
- **Django Channels** (WebSocket untuk live detection)
- **Daphne** (ASGI server)
- **YOLOv8** (Ultralytics) - Model custom trained
- **OpenCV** - Image processing
- **SF-SORT** - Object tracking algorithm
- **SQLite** - Database (development)

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS**
- **Zustand** - State management
- **React Query** - Data fetching
- **React Webcam** - Camera access
- **React Hot Toast** - Notifications
- **Lucide React** - Professional icons

## 📋 Prerequisites

- **Python 3.13+**
- **Node.js 18+** dan npm
- **Browser Modern** (Chrome/Firefox/Edge)
- **Webcam** (untuk fitur Live Camera)

### Spesifikasi Minimum:
- RAM: 4 GB (8 GB recommended)
- Storage: 2 GB free space
- CPU: 2 cores (4 cores recommended)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Rdx11/Deteksi-Alat-Pelindung-Diri-PPE.git
cd ppe-detection
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

Input untuk superuser:
- Username: `admin`
- Email: (tekan Enter untuk skip)
- Password: `admin123`
- Password (again): `admin123`

### 3. Download YOLO Model

**Manual Download:**
1. Kunjungi: https://github.com/snehilsanyal/Construction-Site-Safety-PPE-Detection
2. Download file `models/best.pt`
3. Simpan ke folder `backend/ml_models/ppe_yolo.pt`

**Model Details:**
- Architecture: YOLOv8n (Nano)
- Size: ~6 MB
- Classes: 10 (Hardhat, Mask, NO-Hardhat, NO-Mask, NO-Safety Vest, Person, Safety Cone, Safety Vest, machinery, vehicle)

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install
```

### 5. Setup Environment Variables

Backend sudah dikonfigurasi dengan default values untuk development. Jika perlu custom configuration:

```bash
cd backend
cp .env.example .env
```

Edit `.env` sesuai kebutuhan.

### 6. Jalankan Aplikasi

**Terminal 1 - Backend:**
```bash
cd backend
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 7. Akses Aplikasi

- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:8000
- **Login**: username `admin`, password `admin123`

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

### 1. Dashboard �
- Statistik compliance 7 hari terakhir
- Trend chart keselamatan
- Alert summary
- Metrics: Total Sessions, Detections, Avg Compliance, Alerts

### 2. Deteksi Gambar 📷
1. Klik menu "Detect Image"
2. Upload gambar (JPG/PNG)
3. Klik "Deteksi PPE"
4. Lihat hasil dengan bounding boxes dan metrics

**Note:** Tracking tidak digunakan untuk single image (tidak diperlukan)

### 3. Deteksi Video 🎥
1. Klik menu "Detect Video"
2. Upload video (MP4/AVI/MOV)
3. Tunggu proses (synchronous processing dengan tracking)
4. Lihat tracking statistics:
   - Total Unique Objects
   - Frames Processed
   - Active Tracks
5. Lihat hasil per frame dengan track ID (#1, #2, #3, dst)

**Tracking Features:**
- ✅ Setiap objek punya unique ID
- ✅ Metrics dihitung dari unique IDs (no double counting)
- ✅ Track ID ditampilkan di setiap detection
- ✅ Aggregate metrics menggunakan Set() untuk unique counting

### 4. Live Camera 📹
1. Klik menu "Live Camera"
2. Grant camera permission
3. Klik "Mulai Deteksi"
4. Lihat hasil real-time dengan:
   - FPS counter
   - Tracking statistics panel
   - Track ID dan hits counter per detection
   - Real-time metrics

**Tracking Features:**
- ✅ Real-time object tracking
- ✅ Persistent IDs across frames
- ✅ Tracking statistics: Total Unique, Active Tracks, Frame Count
- ✅ No double counting untuk objek yang sama

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
- Lihat detail hasil dengan tracking info

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
POST   /api/detect/video/            - Deteksi video (dengan tracking)
GET    /api/detect/sessions/         - List sesi
GET    /api/detect/sessions/<id>/    - Detail sesi
GET    /api/detect/results/          - List detection results
GET    /api/detect/results/?session=<id> - Results by session
GET    /api/detect/alerts/           - List alerts
PATCH  /api/detect/alerts/<id>/acknowledge/ - Acknowledge alert
GET    /api/detect/dashboard/stats/  - Dashboard stats
```

### WebSocket
```
ws://localhost:8000/ws/detect/<session_id>/  - Live detection dengan tracking
```

**Message Format:**
```javascript
// Send
{ "frame": "data:image/jpeg;base64,..." }

// Receive
{
  "detections": [
    {
      "bbox": [x1, y1, x2, y2],
      "confidence": 0.95,
      "class_name": "person",
      "label": "Orang",
      "status": "info",
      "track_id": 1,        // Unique persistent ID
      "hits": 5,            // Detection consistency
      "age": 10             // Track age in frames
    }
  ],
  "metrics": {
    "total_persons": 2,
    "compliance_score": 75.5,
    "persons_with_helmet": 2,
    "persons_with_vest": 1,
    "persons_without_helmet": 0,
    "persons_without_vest": 1
  },
  "tracking_stats": {
    "total_unique_objects": 5,
    "active_tracks": 3,
    "frame_count": 120
  },
  "annotated_frame": "base64_image",
  "timestamp": "2026-03-09T12:00:00Z"
}
```

## 🎯 Object Tracking Details

### SF-SORT Algorithm

**Components:**
1. **Kalman Filter** - Predicts object position in next frame
2. **Hungarian Algorithm** - Optimal assignment between detections and tracks
3. **IoU Matching** - Association based on Intersection over Union

**Parameters:**
- `max_age`: 30 frames - Keep track alive without detection
- `min_hits`: 3 hits - Minimum detections before confirming track
- `iou_threshold`: 0.3 - Minimum IoU for matching

**Workflow:**
```
Frame N:
1. Predict positions of existing tracks (Kalman Filter)
2. Compute IoU matrix between detections and predictions
3. Hungarian algorithm for optimal matching
4. Update matched tracks with new detections
5. Create new tracks for unmatched detections
6. Remove dead tracks (age > max_age)
```

### Tracking Statistics

- **total_unique_objects**: Total unique objects ever detected (never decreases)
- **active_tracks**: Currently visible objects (increases/decreases)
- **frame_count**: Total frames processed

### Example Scenario

**Video dengan 3 orang, 100 frames:**

**Tanpa Tracking (OLD):**
```
Frame 1: 3 detections → total = 3
Frame 2: 3 detections → total = 6
Frame 3: 3 detections → total = 9
...
Frame 100: 3 detections → total = 300 ❌
```

**Dengan Tracking (NEW):**
```
Frame 1: Person ID:1, ID:2, ID:3
Frame 2: Person ID:1, ID:2, ID:3 (same people)
Frame 3: Person ID:1, ID:2, ID:3 (same people)
...
Frame 100: Person ID:1, ID:2, ID:3 (same people)

Unique IDs: Set([1, 2, 3])
Total: 3 people ✅
```

## � Troubleshooting

### Backend tidak start
```bash
# Check Python version
python --version  # Should be 3.13+

# Install dependencies
pip install -r requirements.txt

# Check migrations
python manage.py migrate

# Run server
python manage.py runserver
```

### Frontend tidak start
```bash
# Check Node version
node --version  # Should be 18+

# Install dependencies
npm install

# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Run dev server
npm run dev
```

### YOLO model tidak ditemukan
```bash
# Check model exists
ls backend/ml_models/ppe_yolo.pt

# Download model manually (lihat step 3 di Quick Start)
```

### WebSocket error (Live Camera)
```bash
# Restart backend
# Ctrl+C di terminal backend
python manage.py runserver

# Check browser console untuk error details
```

### Database error
```bash
# Delete database dan re-migrate
rm backend/db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Port sudah digunakan
```bash
# Backend (port 8000)
python manage.py runserver 8001

# Frontend (port 5173)
# Edit vite.config.js untuk ubah port
```

## 🏗️ Struktur Project

```
ppe-detection/
├── backend/                    # Django backend
│   ├── apps/                  # Django apps
│   │   ├── detection/        # Detection app (main)
│   │   │   ├── consumers.py  # WebSocket consumer (dengan tracking)
│   │   │   ├── models.py     # Database models
│   │   │   ├── serializers.py
│   │   │   ├── services/     # YOLO & Tracking services
│   │   │   │   ├── yolo_service.py  # YOLO detection dengan tracking
│   │   │   │   └── tracker.py       # SF-SORT implementation
│   │   │   ├── views.py      # API views
│   │   │   └── routing.py    # WebSocket routing
│   │   ├── users/            # User management
│   │   └── reports/          # Reports
│   ├── core/                 # Django settings
│   │   ├── settings.py
│   │   ├── asgi.py          # ASGI config
│   │   └── urls.py
│   ├── media/                # Uploaded files & annotated images
│   ├── ml_models/            # YOLO model
│   │   └── ppe_yolo.pt
│   ├── db.sqlite3            # SQLite database
│   ├── requirements.txt
│   └── manage.py
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   │   ├── DetectVideoPage.jsx   # Dengan tracking stats
│   │   │   └── DetectLivePage.jsx    # Dengan tracking stats
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand stores
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── TRACKING_IMPLEMENTATION.md  # Dokumentasi tracking
├── BUGFIX_DOUBLE_COUNTING.md   # Dokumentasi bug fix
├── .env.example              # Environment template
└── README.md                  # This file
```

## 📝 Environment Variables

File `.env` (optional untuk development):

```env
# Database (SQLite default)
DB_NAME=db.sqlite3

# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# YOLO Model
YOLO_MODEL_PATH=ml_models/ppe_yolo.pt
YOLO_CONFIDENCE_THRESHOLD=0.5
YOLO_IOU_THRESHOLD=0.45

# Tracking Parameters
TRACKING_MAX_AGE=30
TRACKING_MIN_HITS=3
TRACKING_IOU_THRESHOLD=0.3

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Media
MEDIA_URL=/media/
MEDIA_ROOT=media/
```

## 🔧 Development

### Backend Development

```bash
cd backend

# Activate virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver

# Run Django shell
python manage.py shell

# Make migrations after model changes
python manage.py makemigrations
python manage.py migrate
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing Tracking

```bash
# Test dengan video sample
1. Upload video dengan jumlah orang yang diketahui (misal: 3 orang)
2. Periksa tracking statistics:
   - Total Unique Objects = 3 ✅
   - Bukan 30, 300, atau angka besar lainnya
3. Periksa setiap detection punya track_id
4. Periksa track_id konsisten di multiple frames
```

## 📚 Dokumentasi Tambahan

- **TRACKING_IMPLEMENTATION.md** - Dokumentasi lengkap implementasi tracking
- **BUGFIX_DOUBLE_COUNTING.md** - Penjelasan bug fix double counting

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
- **SORT Algorithm**: [abewley/sort](https://github.com/abewley/sort)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📞 Support

Jika ada pertanyaan atau issue:
1. Buka issue di GitHub
2. Sertakan error message dan screenshot
3. Jelaskan langkah-langkah untuk reproduce issue

---

**Version**: 2.0.0  
**Last Updated**: 9 Maret 2026

**Changelog v2.0.0:**
- ✅ Implementasi SF-SORT object tracking
- ✅ Fix double counting pada video detection
- ✅ Tracking statistics display
- ✅ Professional UI dengan Lucide icons
- ✅ Simplified deployment (tanpa Docker)
- ✅ SQLite untuk development

Dibuat dengan ❤️ untuk meningkatkan keselamatan kerja.
