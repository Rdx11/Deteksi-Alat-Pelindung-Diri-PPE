"""
YOLO Detection Service untuk PPE Detection dengan Object Tracking
"""
import cv2
import numpy as np
from ultralytics import YOLO
from django.conf import settings
from PIL import Image
import io
import base64
from .tracker import SFSORTTracker


class YOLODetectionService:
    """Service untuk menjalankan deteksi YOLO pada gambar/frame dengan tracking"""
    
    def __init__(self, enable_tracking=False):
        """
        Initialize YOLO model
        
        Args:
            enable_tracking: Enable object tracking (untuk video/live)
        """
        self.model = None
        self.confidence_threshold = settings.YOLO_CONFIDENCE_THRESHOLD
        self.iou_threshold = settings.YOLO_IOU_THRESHOLD
        self.classes = settings.PPE_CLASSES
        self.enable_tracking = enable_tracking
        
        # Initialize tracker jika enabled
        self.tracker = SFSORTTracker(
            max_age=30,      # Keep track for 30 frames without detection
            min_hits=3,      # Require 3 hits before confirming track
            iou_threshold=0.3  # IoU threshold for matching
        ) if enable_tracking else None
        
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

    
    def detect_frame(self, frame, use_tracking=None):
        """
        Deteksi objek pada single frame dengan optional tracking
        
        Args:
            frame: numpy array (BGR format dari OpenCV)
            use_tracking: Override enable_tracking setting (None = use default)
            
        Returns:
            dict: Hasil deteksi dengan tracking info jika enabled
        """
        if self.model is None:
            raise RuntimeError("YOLO model belum di-load")
        
        # Determine if tracking should be used
        tracking_enabled = use_tracking if use_tracking is not None else self.enable_tracking
        
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
        
        # Apply tracking jika enabled
        tracked_objects = []
        if tracking_enabled and self.tracker is not None:
            tracked_objects = self.tracker.update(detections)
            
            # Update detections dengan track_id
            for det in detections:
                # Find matching tracked object
                for tracked in tracked_objects:
                    # Check if bboxes match (with some tolerance)
                    if self._bbox_match(det['bbox'], tracked['bbox']):
                        det['track_id'] = tracked['track_id']
                        det['hits'] = tracked['hits']
                        det['age'] = tracked['age']
                        break
        
        # Hitung metrics compliance (dengan tracking info jika ada)
        metrics = self.calculate_compliance(detections, tracked_objects if tracking_enabled else None)
        
        # Gambar annotations (dengan track_id jika ada)
        annotated_frame = self.draw_annotations(frame.copy(), detections, tracking_enabled)
        
        result_dict = {
            'detections': detections,
            'metrics': metrics,
            'annotated_image': annotated_frame
        }
        
        # Add tracking statistics jika enabled
        if tracking_enabled and self.tracker is not None:
            result_dict['tracking_stats'] = self.tracker.get_statistics()
        
        return result_dict
    
    def _bbox_match(self, bbox1, bbox2, threshold=0.5):
        """
        Check if two bboxes match (using IoU)
        """
        x1_1, y1_1, x2_1, y2_1 = bbox1
        x1_2, y1_2, x2_2, y2_2 = bbox2
        
        # Calculate intersection
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)
        
        if x2_i < x1_i or y2_i < y1_i:
            return False
        
        intersection = (x2_i - x1_i) * (y2_i - y1_i)
        
        # Calculate union
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection
        
        iou = intersection / union if union > 0 else 0
        
        return iou >= threshold

    
    def calculate_compliance(self, detections, tracked_objects=None):
        """
        Hitung metrics compliance keselamatan dengan tracking support
        
        Args:
            detections: List of detection objects
            tracked_objects: List of tracked objects (optional, untuk accurate counting)
            
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
        
        # Jika tracking enabled, gunakan unique track IDs untuk counting
        if tracked_objects is not None:
            # Count unique persons by track_id
            person_tracks = set()
            helmet_tracks = set()
            vest_tracks = set()
            no_helmet_tracks = set()
            no_vest_tracks = set()
            
            for tracked in tracked_objects:
                track_id = tracked['track_id']
                class_name = tracked['class_name']
                
                if class_name == 'person':
                    person_tracks.add(track_id)
                elif class_name in ['hardhat', 'helmet']:
                    helmet_tracks.add(track_id)
                elif class_name in ['safety-vest', 'vest']:
                    vest_tracks.add(track_id)
                elif class_name in ['no-hardhat', 'no-helmet']:
                    no_helmet_tracks.add(track_id)
                elif class_name in ['no-safety-vest', 'no-vest']:
                    no_vest_tracks.add(track_id)
            
            # Use tracked counts
            person_count = len(person_tracks)
            helmet_count = len(helmet_tracks)
            vest_count = len(vest_tracks)
            no_helmet_count = len(no_helmet_tracks)
            no_vest_count = len(no_vest_tracks)
        else:
            # Fallback ke counting biasa (tanpa tracking)
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
        if person_count > 0:
            metrics['total_persons'] = person_count
        else:
            # Estimasi dari max(total helm, total rompi)
            total_helmet_detections = helmet_count + no_helmet_count
            total_vest_detections = vest_count + no_vest_count
            metrics['total_persons'] = max(total_helmet_detections, total_vest_detections)
        
        # Set metrics PPE
        metrics['persons_with_helmet'] = helmet_count
        metrics['persons_with_vest'] = vest_count
        metrics['persons_without_helmet'] = no_helmet_count
        metrics['persons_without_vest'] = no_vest_count
        
        # Hitung compliance score
        if metrics['total_persons'] > 0:
            total_ppe_required = metrics['total_persons'] * 2
            total_ppe_used = helmet_count + vest_count
            total_ppe_violations = no_helmet_count + no_vest_count
            
            if total_ppe_violations > 0:
                safe_count = helmet_count + vest_count
                total_detections = helmet_count + vest_count + no_helmet_count + no_vest_count
                if total_detections > 0:
                    metrics['compliance_score'] = round((safe_count / total_detections) * 100, 2)
                else:
                    metrics['compliance_score'] = 0.0
            else:
                if total_ppe_required > 0:
                    metrics['compliance_score'] = round(min((total_ppe_used / total_ppe_required) * 100, 100), 2)
                else:
                    metrics['compliance_score'] = 0.0
        
        return metrics

    
    def draw_annotations(self, frame, detections, show_track_id=False):
        """
        Gambar bounding boxes dan labels pada frame
        
        Args:
            frame: numpy array (BGR)
            detections: List of detection objects
            show_track_id: Show track ID jika ada
            
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
            
            # Tambahkan track_id jika ada dan enabled
            if show_track_id and 'track_id' in det:
                label = f"ID:{det['track_id']} {label}"
            
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
    
    def reset_tracker(self):
        """Reset tracker (untuk new video/session)"""
        if self.tracker is not None:
            self.tracker.reset()
    
    def get_tracking_stats(self):
        """Get tracking statistics"""
        if self.tracker is not None:
            return self.tracker.get_statistics()
        return None
