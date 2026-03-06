"""
WebSocket Consumer untuk live camera detection
"""
import json
import base64
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
import cv2
import numpy as np

class DetectionConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer untuk real-time detection
    Menerima frame dari frontend, jalankan YOLO, kirim hasil kembali
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f'detection_{self.session_id}'
        
        print(f"[CONSUMER] WebSocket connecting: session_id={self.session_id}")
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"[CONSUMER] WebSocket connected and accepted")
        
        # Initialize session
        await self.create_or_get_session()
        print(f"[CONSUMER] Session initialized")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        print(f"[CONSUMER] WebSocket disconnecting: close_code={close_code}")
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Mark session as inactive
        await self.deactivate_session()
        print(f"[CONSUMER] WebSocket disconnected")
    
    async def receive(self, text_data):
        """
        Receive frame dari frontend
        Format: {"frame": "base64_encoded_image"}
        """
        try:
            print(f"[CONSUMER] Received message, length: {len(text_data)}")
            data = json.loads(text_data)
            frame_base64 = data.get('frame')
            
            if not frame_base64:
                print("[CONSUMER] ERROR: No frame data in message")
                await self.send(text_data=json.dumps({
                    'error': 'No frame data received'
                }))
                return
            
            print(f"[CONSUMER] Frame data received, length: {len(frame_base64)}")
            
            # Decode base64 ke frame
            frame = self.base64_to_frame(frame_base64)
            print(f"[CONSUMER] Decoded frame shape: {frame.shape if frame is not None else 'None'}")
            
            if frame is None:
                print("[CONSUMER] ERROR: Failed to decode frame")
                await self.send(text_data=json.dumps({
                    'error': 'Failed to decode frame'
                }))
                return
            
            # Jalankan deteksi
            print("[CONSUMER] Running detection...")
            result = await self.detect_frame(frame)
            print(f"[CONSUMER] Detection complete: {len(result.get('detections', []))} detections")
            
            # Encode annotated frame ke base64
            annotated_base64 = self.frame_to_base64(result['annotated_image'])
            print(f"[CONSUMER] Encoded annotated frame, length: {len(annotated_base64)}")
            
            # Kirim hasil kembali
            response_data = {
                'detections': result['detections'],
                'metrics': result['metrics'],
                'annotated_frame': annotated_base64,
                'timestamp': timezone.now().isoformat(),
            }
            print(f"[CONSUMER] Sending response with {len(result['detections'])} detections")
            await self.send(text_data=json.dumps(response_data))
            print("[CONSUMER] Response sent successfully")
            
            # Simpan hasil ke database (optional, bisa di-skip untuk performa)
            # await self.save_detection_result(result)
            
        except Exception as e:
            print(f"[CONSUMER] ERROR in receive: {str(e)}")
            import traceback
            traceback.print_exc()
            await self.send(text_data=json.dumps({
                'error': f'Error processing frame: {str(e)}'
            }))

    
    @database_sync_to_async
    def create_or_get_session(self):
        """Create or get detection session"""
        from .models import DetectionSession
        from django.contrib.auth.models import User
        
        # Get user dari scope (jika authenticated)
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            # Fallback ke user pertama (untuk testing)
            user = User.objects.first()
        
        session, created = DetectionSession.objects.get_or_create(
            id=self.session_id,
            defaults={
                'user': user,
                'session_type': 'live',
                'name': f'Live Detection {self.session_id}',
                'is_active': True,
            }
        )
        
        if not created:
            session.is_active = True
            session.save()
        
        return session
    
    @database_sync_to_async
    def deactivate_session(self):
        """Mark session as inactive"""
        from .models import DetectionSession
        
        try:
            session = DetectionSession.objects.get(id=self.session_id)
            session.is_active = False
            session.completed_at = timezone.now()
            session.save()
        except DetectionSession.DoesNotExist:
            pass
    
    @database_sync_to_async
    def detect_frame(self, frame):
        """Run YOLO detection on frame"""
        from .services.yolo_service import YOLODetectionService
        
        yolo_service = YOLODetectionService()
        return yolo_service.detect_frame(frame)
    
    def base64_to_frame(self, base64_string):
        """Convert base64 string to numpy array frame"""
        # Remove data URL prefix jika ada
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
    
    def frame_to_base64(self, frame):
        """Convert numpy array frame to base64 string"""
        _, buffer = cv2.imencode('.jpg', frame)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        return jpg_as_text
