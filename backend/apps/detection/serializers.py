"""
Serializers untuk Detection app
"""
from rest_framework import serializers
from .models import DetectionSession, DetectionResult, Alert

class DetectionResultSerializer(serializers.ModelSerializer):
    """Serializer untuk DetectionResult"""
    
    class Meta:
        model = DetectionResult
        fields = [
            'id', 'session', 'frame_number', 'timestamp',
            'detections', 'annotated_image', 'total_persons',
            'persons_with_helmet', 'persons_with_vest',
            'persons_without_helmet', 'persons_without_vest',
            'compliance_score', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class DetectionSessionSerializer(serializers.ModelSerializer):
    """Serializer untuk DetectionSession"""
    results_count = serializers.SerializerMethodField()
    latest_result = serializers.SerializerMethodField()
    results = serializers.SerializerMethodField()
    
    class Meta:
        model = DetectionSession
        fields = [
            'id', 'user', 'session_type', 'name', 'source_file',
            'created_at', 'updated_at', 'completed_at', 'is_active',
            'results_count', 'latest_result', 'results'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_results_count(self, obj):
        return obj.results.count()
    
    def get_latest_result(self, obj):
        latest = obj.results.first()
        if latest:
            return DetectionResultSerializer(latest).data
        return None
    
    def get_results(self, obj):
        # Return all results for detail view, empty for list view
        request = self.context.get('request')
        if request and request.parser_context.get('kwargs', {}).get('pk'):
            # This is a detail view, return all results
            results = obj.results.all().order_by('frame_number')
            return DetectionResultSerializer(results, many=True).data
        return []


class AlertSerializer(serializers.ModelSerializer):
    """Serializer untuk Alert"""
    
    class Meta:
        model = Alert
        fields = [
            'id', 'session', 'result', 'severity', 'title', 'message',
            'is_acknowledged', 'acknowledged_at', 'acknowledged_by',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class ImageDetectionSerializer(serializers.Serializer):
    """Serializer untuk upload image detection"""
    image = serializers.ImageField(required=True)
    name = serializers.CharField(required=False, allow_blank=True)

class VideoDetectionSerializer(serializers.Serializer):
    """Serializer untuk upload video detection"""
    video = serializers.FileField(required=True)
    name = serializers.CharField(required=False, allow_blank=True)
