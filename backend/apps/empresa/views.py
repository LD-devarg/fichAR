from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

from apps.core.tenancy import scope_queryset_to_user_empresa
from apps.usuarios.permissions import IsAdminUserRole

from .models import Sucursal, Empresa
from .serializers import SucursalSerializer, EmpresaSerializer

class EmpresaViewSet(viewsets.ModelViewSet):
    serializer_class = EmpresaSerializer
    permission_classes = [permissions.IsAdminUser] # Solo superuser o is_staff
    queryset = Empresa.objects.all()

class SucursalViewSet(viewsets.ModelViewSet):
    serializer_class = SucursalSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        return scope_queryset_to_user_empresa(Sucursal.objects.all(), self.request.user)

    def perform_create(self, serializer):
        empresa = self.request.user.empresa
        if empresa is None:
            raise ValidationError({'empresa': 'El usuario autenticado no tiene una empresa asignada.'})
        serializer.save(empresa=empresa)

    def perform_update(self, serializer):
        empresa = self.request.user.empresa
        if empresa is None:
            raise ValidationError({'empresa': 'El usuario autenticado no tiene una empresa asignada.'})
        serializer.save(empresa=empresa)
