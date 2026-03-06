from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def placeholder_view(request):
    return Response({'message': 'Reports endpoint - coming soon'})
