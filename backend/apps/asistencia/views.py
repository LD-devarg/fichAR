from django.utils import timezone
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from apps.core.tenancy import scope_queryset_to_user_empresa
from apps.usuarios.permissions import IsEmpleadoRoleForAsistencia

from .models import Asistencia
from .serializers import AsistenciaSerializer


class AsistenciaViewSet(viewsets.ModelViewSet):
    serializer_class = AsistenciaSerializer
    permission_classes = [IsEmpleadoRoleForAsistencia]

    def get_queryset(self):
        user = self.request.user
        qs = scope_queryset_to_user_empresa(Asistencia.objects.all(), user)

        if user.is_superuser or user.groups.filter(name='Admin').exists():
            return qs

        return qs.filter(empleado=user)

    def perform_create(self, serializer):
        empresa = self.request.user.empresa
        sucursal = serializer.validated_data.get('sucursal')

        if empresa is None:
            raise ValidationError({'empresa': 'El usuario autenticado no tiene una empresa asignada.'})

        if sucursal.empresa_id != empresa.id:
            raise ValidationError({'sucursal': 'La sucursal seleccionada no pertenece a tu empresa.'})

        serializer.save(
            empleado=self.request.user,
            empresa=empresa,
            fecha_hora=timezone.now(),
        )
