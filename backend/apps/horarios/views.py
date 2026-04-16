from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError

from apps.core.tenancy import scope_queryset_to_user_empresa

from .models import Horario
from .serializers import HorarioSerializer


class HorarioViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = scope_queryset_to_user_empresa(Horario.objects.all(), user)

        if user.is_superuser or user.groups.filter(name='Admin').exists():
            return qs

        return qs.filter(empleado=user)

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in permissions.SAFE_METHODS:
            if not (request.user.is_superuser or request.user.groups.filter(name='Admin').exists()):
                self.permission_denied(request, message="No tienes permiso gerencial para modificar horarios.")

    def perform_create(self, serializer):
        if self.request.user.is_superuser:
            serializer.save(modificado_por=self.request.user)
            return

        empresa = self.request.user.empresa
        empleado = serializer.validated_data.get('empleado')
        sucursal = serializer.validated_data.get('sucursal')

        if empresa is None:
            raise ValidationError({'empresa': 'El usuario autenticado no tiene una empresa asignada.'})
        if empleado and empleado.empresa_id != empresa.id:
            raise ValidationError({'empleado': 'El empleado seleccionado no pertenece a tu empresa.'})
        if sucursal and sucursal.empresa_id != empresa.id:
            raise ValidationError({'sucursal': 'La sucursal seleccionada no pertenece a tu empresa.'})

        serializer.save(empresa=empresa, modificado_por=self.request.user)

    def perform_update(self, serializer):
        if self.request.user.is_superuser:
            serializer.save(modificado_por=self.request.user)
            return

        empresa = self.request.user.empresa
        empleado = serializer.validated_data.get('empleado', serializer.instance.empleado)
        sucursal = serializer.validated_data.get('sucursal', serializer.instance.sucursal)

        if empresa is None:
            raise ValidationError({'empresa': 'El usuario autenticado no tiene una empresa asignada.'})
        if empleado and empleado.empresa_id != empresa.id:
            raise ValidationError({'empleado': 'El empleado seleccionado no pertenece a tu empresa.'})
        if sucursal and sucursal.empresa_id != empresa.id:
            raise ValidationError({'sucursal': 'La sucursal seleccionada no pertenece a tu empresa.'})

        serializer.save(empresa=empresa, modificado_por=self.request.user)
