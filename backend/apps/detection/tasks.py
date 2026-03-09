"""
Celery tasks untuk background processing
"""
from celery import shared_task
from django.utils import timezone
import cv2
import os

@shared_task(bind=True)
def process_video_task(self, session_id):
    """
    Task untuk memproses video detection dengan tracking
    
    Args:
        session_id: UUID dari DetectionSession
    """
    from .models import DetectionSession, DetectionResult, Alert
    from .services.yolo_service import YOLODetectionService
    
    try:
        # Load session
        session = DetectionSession.objects.get(id=session_id)
        video_path = session.source_file.path
        
        # Initialize YOLO service dengan tracking enabled
        yolo_service = YOLODetectionService(enable_tracking=True)
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Tidak dapat membuka video")
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        frame_count = 0
        processed_count = 0
        
        # Process setiap N frame (untuk efisiensi)
        frame_skip = 30  # Process 1 frame per detik (asumsi 30 fps)
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Skip frames
            if frame_count % frame_skip != 0:
                continue
            
            # Update progress
            progress = int((frame_count / total_frames) * 100)
            self.update_state(
                state='PROGRESS',
                meta={
                    'progress': progress,
                    'message': f'Processing frame {frame_count}/{total_frames}'
                }
            )
            
            # Deteksi frame dengan tracking
            result = yolo_service.detect_frame(frame, use_tracking=True)
            
            # Simpan annotated frame
            annotated_dir = f"media/annotated/{session_id}"
            os.makedirs(annotated_dir, exist_ok=True)
            annotated_path = f"annotated/{session_id}/frame_{frame_count}.jpg"
            full_path = os.path.join('media', annotated_path)
            cv2.imwrite(full_path, result['annotated_image'])
            
            # Simpan hasil
            timestamp = frame_count / fps
            detection_result = DetectionResult.objects.create(
                session=session,
                frame_number=frame_count,
                timestamp=timestamp,
                detections=result['detections'],
                annotated_image=annotated_path,
                **result['metrics']
            )
            
            # Buat alert jika ada pelanggaran
            if result['metrics']['persons_without_helmet'] > 0:
                Alert.objects.create(
                    session=session,
                    result=detection_result,
                    severity='danger',
                    title=f'Pelanggaran Helm - Frame {frame_count}',
                    message=f"Terdeteksi {result['metrics']['persons_without_helmet']} pekerja tanpa helm"
                )
            
            processed_count += 1
        
        cap.release()
        
        # Get final tracking stats
        tracking_stats = yolo_service.get_tracking_stats()
        
        # Mark session as completed
        session.completed_at = timezone.now()
        session.is_active = False
        session.save()
        
        return {
            'session_id': str(session_id),
            'total_frames': total_frames,
            'processed_frames': processed_count,
            'tracking_stats': tracking_stats,
            'message': 'Video berhasil diproses dengan tracking'
        }
        
    except Exception as e:
        # Update session status on error
        try:
            session = DetectionSession.objects.get(id=session_id)
            session.is_active = False
            session.save()
        except:
            pass
        
        raise e
