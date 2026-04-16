from rest_framework import permissions, viewsets

from .models import DiaSemana
from .serializers import DiaSemanaSerializer


class DiaSemanaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DiaSemana.objects.all()
    serializer_class = DiaSemanaSerializer
    permission_classes = [permissions.IsAuthenticated]
