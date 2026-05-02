from django.contrib.auth import get_user_model
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.core.tenancy import scope_queryset_to_user_empresa

from .models import ConfiguracionLaboral
from .permissions import IsAdminUserRole
from .serializers import ConfiguracionLaboralSerializer, UsuarioSerializer

Usuario = get_user_model()


class UsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = UsuarioSerializer

    def get_queryset(self):
        return scope_queryset_to_user_empresa(Usuario.objects.all(), self.request.user)

    def get_permissions(self):
        if self.action in ['me']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    def perform_create(self, serializer):
        empresa = self.request.user.empresa
        if self.request.user.is_superuser and not empresa:
            from apps.empresa.models import Empresa
            empresa = Empresa.objects.first()
        serializer.save(empresa=empresa)

    def perform_update(self, serializer):
        if self.request.user.is_superuser:
            empresa = serializer.validated_data.get('empresa', serializer.instance.empresa)
        else:
            empresa = self.request.user.empresa
            if serializer.instance.empresa:
                empresa = serializer.instance.empresa
                
        serializer.save(empresa=empresa)


class ConfiguracionLaboralViewSet(viewsets.ModelViewSet):
    serializer_class = ConfiguracionLaboralSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        return scope_queryset_to_user_empresa(
            ConfiguracionLaboral.objects.select_related('usuario'),
            self.request.user,
            field_name='usuario__empresa',
        )

    def perform_create(self, serializer):
        usuario = serializer.validated_data.get('usuario')

        if not self.request.user.is_superuser and usuario.empresa_id != self.request.user.empresa_id:
            raise ValidationError({'usuario': 'No puedes configurar usuarios de otra empresa.'})

        serializer.save()

    def perform_update(self, serializer):
        usuario = serializer.validated_data.get('usuario', serializer.instance.usuario)

        if not self.request.user.is_superuser and usuario.empresa_id != self.request.user.empresa_id:
            raise ValidationError({'usuario': 'No puedes configurar usuarios de otra empresa.'})

        serializer.save()
