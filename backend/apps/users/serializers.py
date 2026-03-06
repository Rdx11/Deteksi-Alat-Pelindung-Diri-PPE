"""
Serializers untuk User authentication
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer dengan informasi user tambahan"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Tambahkan custom claims
        token['username'] = user.username
        token['email'] = user.email
        return token
    
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
            # Tambahkan informasi user ke response
            data['user'] = {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
            }
            return data
        except Exception as e:
            # Custom error message untuk kredensial yang salah
            from rest_framework_simplejwt.exceptions import AuthenticationFailed
            raise AuthenticationFailed(
                'Username atau password salah. Silakan periksa kembali kredensial Anda.',
                code='authentication_failed'
            )

class UserSerializer(serializers.ModelSerializer):
    """Serializer untuk User model"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']
