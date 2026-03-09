"""
Views untuk Detection app
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.files.base import ContentFile
from django.utils import timezone
from django.db.models import Avg, Count, Q
import cv2
import os
import io
from datetime import timedelta

from .models import DetectionSession, DetectionResult, Alert
from .serializers import (
    DetectionSessionSerializer, DetectionResultSerializer,
    AlertSerializer, ImageDetectionSerializer, VideoDetectionSerializer
)
from .services.yolo_service import YOLODetectionService
from .tasks import process_video_task

class DetectionSessionViewSet(viewsets.ModelViewSet):
    """ViewSet untuk DetectionSession"""
    serializer_class = DetectionSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return DetectionSession.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DetectionResultViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet untuk DetectionResult (read-only)"""
    serializer_class = DetectionResultSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = DetectionResult.objects.filter(
            session__user=self.request.user
        ).order_by('-created_at')
        
        # Filter by session if provided
        session_id = self.request.query_params.get('session', None)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        return queryset


class AlertViewSet(viewsets.ModelViewSet):
    """ViewSet untuk Alert"""
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Alert.objects.filter(session__user=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def acknowledge(self, request, pk=None):
        """Acknowledge alert"""
        alert = self.get_object()
        alert.is_acknowledged = True
        alert.acknowledged_at = timezone.now()
        alert.acknowledged_by = request.user
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)

@api_view(['POST'])
def detect_image(request):
    """
    Endpoint untuk deteksi gambar
    Upload gambar, jalankan YOLO, return hasil + annotated image
    """
    serializer = ImageDetectionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Buat session
        session = DetectionSession.objects.create(
            user=request.user,
            session_type='image',
            name=serializer.validated_data.get('name', 'Image Detection'),
            source_file=serializer.validated_data['image']
        )
        
        # Jalankan deteksi
        yolo_service = YOLODetectionService()
        result = yolo_service.detect_image(session.source_file.path)
        
        # Simpan annotated image
        annotated_path = f"annotated/{session.id}.jpg"
        full_path = os.path.join(session.source_file.storage.location, annotated_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        cv2.imwrite(full_path, result['annotated_image'])
        
        # Simpan hasil ke database
        detection_result = DetectionResult.objects.create(
            session=session,
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
                title='Pekerja Tanpa Helm Terdeteksi',
                message=f"{result['metrics']['persons_without_helmet']} pekerja terdeteksi tanpa helm"
            )
        
        if result['metrics']['persons_without_vest'] > 0:
            Alert.objects.create(
                session=session,
                result=detection_result,
                severity='warning',
                title='Pekerja Tanpa Rompi Terdeteksi',
                message=f"{result['metrics']['persons_without_vest']} pekerja terdeteksi tanpa rompi"
            )
        
        # Mark session as completed
        session.completed_at = timezone.now()
        session.is_active = False
        session.save()
        
        return Response({
            'session': DetectionSessionSerializer(session).data,
            'result': DetectionResultSerializer(detection_result).data,
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Error saat deteksi: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def detect_video(request):
    """
    Endpoint untuk deteksi video
    Upload video, proses secara synchronous (tanpa Celery untuk development)
    """
    serializer = VideoDetectionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Buat session
        session = DetectionSession.objects.create(
            user=request.user,
            session_type='video',
            name=serializer.validated_data.get('name', 'Video Detection'),
            source_file=serializer.validated_data['video']
        )
        
        # Proses video langsung (tanpa Celery)
        # Enable tracking untuk video detection
        yolo_service = YOLODetectionService(enable_tracking=True)
        
        # Buka video
        video_path = session.source_file.path
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            return Response(
                {'error': 'Tidak dapat membuka video'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Process setiap N frame (untuk performa)
        frame_skip = max(1, fps // 2)  # Process 2 frame per detik
        frame_count = 0
        processed_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Skip frames
            if frame_count % frame_skip != 0:
                continue
            
            # Deteksi frame
            result = yolo_service.detect_frame(frame)
            
            # Simpan annotated frame menggunakan Django storage
            # Convert frame to bytes
            is_success, buffer = cv2.imencode(".jpg", result['annotated_image'])
            if is_success:
                io_buf = io.BytesIO(buffer)
                annotated_filename = f"video_{session.id}_frame_{frame_count}.jpg"
                
                # Create DetectionResult with annotated image
                detection_result = DetectionResult(
                    session=session,
                    frame_number=frame_count,
                    timestamp=frame_count / fps if fps > 0 else 0,
                    detections=result['detections'],
                    **result['metrics']
                )
                detection_result.annotated_image.save(
                    annotated_filename,
                    ContentFile(io_buf.getvalue()),
                    save=True
                )
            else:
                # Fallback: save without annotated image
                detection_result = DetectionResult.objects.create(
                    session=session,
                    frame_number=frame_count,
                    timestamp=frame_count / fps if fps > 0 else 0,
                    detections=result['detections'],
                    **result['metrics']
                )
            
            # Buat alert jika ada pelanggaran
            if result['metrics']['persons_without_helmet'] > 0:
                Alert.objects.create(
                    session=session,
                    result=detection_result,
                    severity='danger',
                    title='Pekerja Tanpa Helm Terdeteksi',
                    message=f"Frame {frame_count}: {result['metrics']['persons_without_helmet']} pekerja tanpa helm"
                )
            
            processed_count += 1
        
        cap.release()
        
        # Get tracking statistics
        tracking_stats = yolo_service.get_tracking_stats()
        
        # Mark session as completed
        session.completed_at = timezone.now()
        session.is_active = False
        session.save()
        
        return Response({
            'session': DetectionSessionSerializer(session).data,
            'message': f'Video berhasil diproses. Total {processed_count} frame dianalisis.',
            'stats': {
                'total_frames': total_frames,
                'processed_frames': processed_count,
                'tracking': tracking_stats
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Error saat deteksi video: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def check_task_status(request, task_id):
    """
    Cek status Celery task
    """
    from celery.result import AsyncResult
    
    task = AsyncResult(task_id)
    
    response_data = {
        'task_id': task_id,
        'status': task.state,
    }
    
    if task.state == 'PENDING':
        response_data['message'] = 'Task sedang menunggu...'
    elif task.state == 'PROGRESS':
        response_data['progress'] = task.info.get('progress', 0)
        response_data['message'] = task.info.get('message', 'Processing...')
    elif task.state == 'SUCCESS':
        response_data['result'] = task.result
        response_data['message'] = 'Task selesai'
    elif task.state == 'FAILURE':
        response_data['error'] = str(task.info)
        response_data['message'] = 'Task gagal'
    
    return Response(response_data)


@api_view(['GET'])
def dashboard_stats(request):
    """
    Endpoint untuk dashboard statistics
    """
    user = request.user
    
    # Filter berdasarkan range waktu (default: 7 hari terakhir)
    days = int(request.GET.get('days', 7))
    start_date = timezone.now() - timedelta(days=days)
    
    # Total sessions
    total_sessions = DetectionSession.objects.filter(
        user=user,
        created_at__gte=start_date
    ).count()
    
    # Total detections
    total_detections = DetectionResult.objects.filter(
        session__user=user,
        created_at__gte=start_date
    ).count()
    
    # Average compliance score
    avg_compliance = DetectionResult.objects.filter(
        session__user=user,
        created_at__gte=start_date
    ).aggregate(avg=Avg('compliance_score'))['avg'] or 0
    
    # Total alerts
    total_alerts = Alert.objects.filter(
        session__user=user,
        created_at__gte=start_date
    ).count()
    
    # Unacknowledged alerts
    unack_alerts = Alert.objects.filter(
        session__user=user,
        is_acknowledged=False
    ).count()
    
    # Compliance trend (per hari)
    from django.db.models.functions import TruncDate
    compliance_trend = DetectionResult.objects.filter(
        session__user=user,
        created_at__gte=start_date
    ).annotate(
        date=TruncDate('created_at')
    ).values('date').annotate(
        avg_score=Avg('compliance_score')
    ).order_by('date')
    
    # PPE violations breakdown
    violations = DetectionResult.objects.filter(
        session__user=user,
        created_at__gte=start_date
    ).aggregate(
        no_helmet=Count('id', filter=Q(persons_without_helmet__gt=0)),
        no_vest=Count('id', filter=Q(persons_without_vest__gt=0)),
    )
    
    return Response({
        'summary': {
            'total_sessions': total_sessions,
            'total_detections': total_detections,
            'avg_compliance': round(avg_compliance, 2),
            'total_alerts': total_alerts,
            'unacknowledged_alerts': unack_alerts,
        },
        'compliance_trend': list(compliance_trend),
        'violations': violations,
    })
