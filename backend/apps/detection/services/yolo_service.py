"""
YOLO Detection Service untuk PPE Detection
"""
import cv2
import numpy as np
from ultralytics import YOLO
from django.conf import settings
from PIL import Image
import io
import base64

class YOLODetectionService:
    """Service untuk menjalankan deteksi YOLO pada gambar/frame"""
    
    def __init__(self):
        """Initialize YOLO model"""
        self.model = None
        self.confidence_threshold = settings.YOLO_CONFIDENCE_THRESHOLD
        self.iou_threshold = settings.YOLO_IOU_THRESHOLD
        self.classes = settings.PPE_CLASSES
        self._load_model()
    
    def _load_model(self):
        """Load YOLO model dari file .pt"""
        try:
            self.model = YOLO(settings.YOLO_MODEL_PATH)
            print(f"✓ YOLO model loaded from {settings.YOLO_MODEL_PATH}")
        except Exception as e:
            print(f"✗ Error loading YOLO model: {e}")
            # Fallback ke pretrained model untuk testing
            print("  Using YOLOv8n as fallback...")
            self.model = YOLO('yolov8n.pt')
    
    def detect_image(self, image_path):
        """
        Deteksi objek pada gambar
        
        Args:
            image_path: Path ke file gambar
            
        Returns:
            dict: Hasil deteksi dengan format:
                {
                    'detections': [...],
                    'metrics': {...},
                    'annotated_image': numpy array
                }
        """
        # Baca gambar
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Tidak dapat membaca gambar: {image_path}")
        
        return self.detect_frame(image)

    
    def detect_frame(self, frame):
        """
        Deteksi objek pada single frame
        
        Args:
            frame: numpy array (BGR format dari OpenCV)
            
        Returns:
            dict: Hasil deteksi
        """
        if self.model is None:
            raise RuntimeError("YOLO model belum di-load")
        
        # Jalankan inference
        results = self.model(
            frame,
            conf=self.confidence_threshold,
            iou=self.iou_threshold,
            verbose=False
        )
        
        # Parse hasil deteksi
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Extract data
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                
                # Get class info
                class_info = self.classes.get(class_id, {
                    'name': f'class_{class_id}',
                    'label': f'Class {class_id}',
                    'status': 'info',
                    'color': (128, 128, 128)
                })
                
                detections.append({
                    'bbox': [float(x1), float(y1), float(x2), float(y2)],
                    'confidence': confidence,
                    'class_id': class_id,
                    'class_name': class_info['name'],
                    'label': class_info['label'],
                    'status': class_info['status'],
                })
        
        # Hitung metrics compliance
        metrics = self.calculate_compliance(detections)
        
        # Gambar annotations
        annotated_frame = self.draw_annotations(frame.copy(), detections)
        
        return {
            'detections': detections,
            'metrics': metrics,
            'annotated_image': annotated_frame
        }

    
    def calculate_compliance(self, detections):
        """
        Hitung metrics compliance keselamatan
        
        Logika:
        - Hitung total orang dari deteksi 'person' class
        - Jika tidak ada 'person', estimasi dari jumlah helm/rompi yang terdeteksi
        - Hitung compliance berdasarkan rasio PPE yang digunakan
        
        Args:
            detections: List of detection objects
            
        Returns:
            dict: Metrics compliance
        """
        metrics = {
            'total_persons': 0,
            'persons_with_helmet': 0,
            'persons_with_vest': 0,
            'persons_without_helmet': 0,
            'persons_without_vest': 0,
            'compliance_score': 0.0,
        }
        
        # Hitung berdasarkan deteksi
        person_count = 0
        helmet_count = 0
        no_helmet_count = 0
        vest_count = 0
        no_vest_count = 0
        
        for det in detections:
            class_name = det['class_name']
            
            if class_name == 'person':
                person_count += 1
            elif class_name in ['hardhat', 'helmet']:
                helmet_count += 1
            elif class_name in ['safety-vest', 'vest']:
                vest_count += 1
            elif class_name in ['no-hardhat', 'no-helmet']:
                no_helmet_count += 1
            elif class_name in ['no-safety-vest', 'no-vest']:
                no_vest_count += 1
        
        # Tentukan total orang
        # Prioritas: gunakan deteksi 'person' jika ada
        # Jika tidak, estimasi dari total deteksi helm + rompi
        if person_count > 0:
            metrics['total_persons'] = person_count
        else:
            # Estimasi: ambil maksimum dari total helm atau total rompi
            total_helmet_detections = helmet_count + no_helmet_count
            total_vest_detections = vest_count + no_vest_count
            metrics['total_persons'] = max(total_helmet_detections, total_vest_detections)
        
        # Set metrics PPE
        metrics['persons_with_helmet'] = helmet_count
        metrics['persons_with_vest'] = vest_count
        metrics['persons_without_helmet'] = no_helmet_count
        metrics['persons_without_vest'] = no_vest_count
        
        # Hitung compliance score
        # Compliance = (jumlah PPE yang digunakan) / (total PPE yang seharusnya digunakan)
        # Total PPE yang seharusnya = total_persons * 2 (helm + rompi)
        if metrics['total_persons'] > 0:
            total_ppe_required = metrics['total_persons'] * 2  # helm + rompi per orang
            total_ppe_used = helmet_count + vest_count
            
            # Jika ada deteksi no-helmet atau no-vest, kurangi dari compliance
            total_ppe_violations = no_helmet_count + no_vest_count
            
            # Hitung compliance: PPE yang digunakan vs yang seharusnya
            # Tapi jika ada violation yang terdeteksi, pastikan compliance tidak 100%
            if total_ppe_violations > 0:
                # Ada pelanggaran terdeteksi
                safe_count = helmet_count + vest_count
                total_detections = helmet_count + vest_count + no_helmet_count + no_vest_count
                if total_detections > 0:
                    metrics['compliance_score'] = round((safe_count / total_detections) * 100, 2)
                else:
                    metrics['compliance_score'] = 0.0
            else:
                # Tidak ada pelanggaran terdeteksi, hitung dari PPE yang digunakan
                if total_ppe_required > 0:
                    metrics['compliance_score'] = round(min((total_ppe_used / total_ppe_required) * 100, 100), 2)
                else:
                    metrics['compliance_score'] = 0.0
        
        return metrics

    
    def draw_annotations(self, frame, detections):
        """
        Gambar bounding boxes dan labels pada frame
        
        Args:
            frame: numpy array (BGR)
            detections: List of detection objects
            
        Returns:
            numpy array: Frame dengan annotations
        """
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            
            # Tentukan warna berdasarkan status
            status = det['status']
            if status == 'safe':
                color = (0, 255, 0)  # Hijau
            elif status == 'danger':
                color = (0, 0, 255)  # Merah
            elif status == 'warning':
                color = (0, 255, 255)  # Kuning
            else:
                color = (255, 0, 0)  # Biru
            
            # Gambar bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Siapkan label text
            label = f"{det['label']} {det['confidence']:.2f}"
            
            # Hitung ukuran text untuk background
            (text_width, text_height), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            
            # Gambar background untuk text
            cv2.rectangle(
                frame,
                (x1, y1 - text_height - baseline - 5),
                (x1 + text_width, y1),
                color,
                -1
            )
            
            # Gambar text
            cv2.putText(
                frame,
                label,
                (x1, y1 - baseline - 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1
            )
        
        return frame
    
    def frame_to_base64(self, frame):
        """Convert frame numpy array ke base64 string"""
        _, buffer = cv2.imencode('.jpg', frame)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        return jpg_as_text
    
    def base64_to_frame(self, base64_string):
        """Convert base64 string ke frame numpy array"""
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
