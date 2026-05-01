from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError

from apps.core.tenancy import scope_queryset_to_user_empresa

from .models import Horario
from .serializers import HorarioSerializer


class HorarioViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = scope_queryset_to_user_empresa(Horario.objects.all(), user)

        if not (user.is_superuser or user.groups.filter(name='Admin').exists()):
            qs = qs.filter(empleado=user)

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        fecha = self.request.query_params.get('fecha')

        if fecha:
            qs = qs.filter(fecha=fecha)
        if start_date:
            qs = qs.filter(fecha__gte=start_date)
        if end_date:
            qs = qs.filter(fecha__lte=end_date)

        return qs

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in permissions.SAFE_METHODS:
            if not (request.user.is_superuser or request.user.groups.filter(name='Admin').exists()):
                self.permission_denied(request, message="No tienes permiso gerencial para modificar horarios.")

    def perform_create(self, serializer):
        user = self.request.user
        empleado = serializer.validated_data.get('empleado')
        sucursal = serializer.validated_data.get('sucursal')
        
        empresa = user.empresa
        if user.is_superuser and sucursal:
            empresa = sucursal.empresa

        if empresa is None:
            raise ValidationError({'empresa': 'No se pudo determinar la empresa para este horario.'})
            
        empleado_empresa_id = getattr(empleado, 'empresa_id', None)
        if empleado and empleado_empresa_id and empleado_empresa_id != empresa.id:
            raise ValidationError({'empleado': 'El empleado seleccionado no pertenece a la empresa correspondiente.'})
            
        sucursal_empresa_id = getattr(sucursal, 'empresa_id', None)
        if sucursal and sucursal_empresa_id and sucursal_empresa_id != empresa.id:
            raise ValidationError({'sucursal': 'La sucursal seleccionada no pertenece a la empresa correspondiente.'})

        try:
            serializer.save(empresa=empresa, modificado_por=user)
        except DjangoValidationError as e:
            msg = list(e.message_dict.values())[0][0] if hasattr(e, 'message_dict') else e.messages[0]
            raise ValidationError({'detail': msg})

    def perform_update(self, serializer):
        user = self.request.user
        empleado = serializer.validated_data.get('empleado', serializer.instance.empleado)
        sucursal = serializer.validated_data.get('sucursal', serializer.instance.sucursal)
        
        empresa = user.empresa
        if user.is_superuser and sucursal:
            empresa = sucursal.empresa
        elif user.is_superuser:
            empresa = serializer.instance.empresa

        if empresa is None:
            raise ValidationError({'empresa': 'No se pudo determinar la empresa para este horario.'})
            
        empleado_empresa_id = getattr(empleado, 'empresa_id', None)
        if empleado and empleado_empresa_id and empleado_empresa_id != empresa.id:
            raise ValidationError({'empleado': 'El empleado seleccionado no pertenece a la empresa correspondiente.'})
            
        sucursal_empresa_id = getattr(sucursal, 'empresa_id', None)
        if sucursal and sucursal_empresa_id and sucursal_empresa_id != empresa.id:
            raise ValidationError({'sucursal': 'La sucursal seleccionada no pertenece a la empresa correspondiente.'})

        try:
            serializer.save(empresa=empresa, modificado_por=user)
        except DjangoValidationError as e:
            msg = list(e.message_dict.values())[0][0] if hasattr(e, 'message_dict') else e.messages[0]
            raise ValidationError({'detail': msg})
