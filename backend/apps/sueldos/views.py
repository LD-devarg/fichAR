from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.core.tenancy import scope_queryset_to_user_empresa
from apps.usuarios.permissions import IsAdminOrOwnerReadOnly, IsAdminUserRole

from .models import Liquidacion, LiquidacionDetalleHoras
from .serializers import (
    LiquidacionDetalleHorasSerializer,
    LiquidacionSerializer,
)
from .services import generar_detalle_horas_desde_horarios


class LiquidacionViewSet(viewsets.ModelViewSet):
    serializer_class = LiquidacionSerializer
    permission_classes = [IsAdminOrOwnerReadOnly]

    def get_queryset(self):
        user = self.request.user
        qs = scope_queryset_to_user_empresa(Liquidacion.objects.all(), user)

        if user.is_superuser or user.groups.filter(name='Admin').exists():
            return qs
        return qs.filter(empleado=user)

    def perform_create(self, serializer):
        user = self.request.user
        empleado = serializer.validated_data.get('empleado')

        if empleado is None:
            raise ValidationError({'empleado': 'Debes indicar un empleado para la liquidacion.'})

        empresa = user.empresa
        if user.is_superuser:
            empresa = empleado.empresa

        if empresa is None:
            raise ValidationError({'empresa': 'El usuario autenticado no tiene una empresa asignada.'})
            
        if empleado.empresa_id != empresa.id:
            raise ValidationError({'empleado': 'El empleado seleccionado no pertenece a tu empresa.'})

        serializer.save(empresa=empresa, modificado_por=user)

    def perform_update(self, serializer):
        user = self.request.user
        empleado = serializer.validated_data.get('empleado', serializer.instance.empleado)

        empresa = user.empresa
        if user.is_superuser:
            empresa = empleado.empresa

        if empresa is None:
            raise ValidationError({'empresa': 'El usuario autenticado no tiene una empresa asignada.'})
            
        if empleado.empresa_id != empresa.id:
            raise ValidationError({'empleado': 'El empleado seleccionado no pertenece a tu empresa.'})

        serializer.save(empresa=empresa, modificado_por=user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def generar_detalles(self, request, pk=None):
        liquidacion = self.get_object()
        try:
            liq_calculada = generar_detalle_horas_desde_horarios(liquidacion)
            serializer = self.get_serializer(liq_calculada)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {'error': 'Ocurrio un error interno procesando las fichadas.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LiquidacionDetalleHorasViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LiquidacionDetalleHorasSerializer
    permission_classes = [IsAdminOrOwnerReadOnly]

    def get_queryset(self):
        user = self.request.user
        liquidacion_id = self.request.query_params.get('liquidacion_id', None)
        qs = scope_queryset_to_user_empresa(
            LiquidacionDetalleHoras.objects.all(),
            user,
            field_name='liquidacion__empresa',
        )

        if not (user.is_superuser or user.groups.filter(name='Admin').exists()):
            qs = qs.filter(liquidacion__empleado=user)

        if liquidacion_id:
            qs = qs.filter(liquidacion_id=liquidacion_id)

        return qs

from .models import LiquidacionConcepto
from .serializers import LiquidacionConceptoSerializer

class LiquidacionConceptoViewSet(viewsets.ModelViewSet):
    serializer_class = LiquidacionConceptoSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        user = self.request.user
        liquidacion_id = self.request.query_params.get('liquidacion_id', None)
        qs = scope_queryset_to_user_empresa(
            LiquidacionConcepto.objects.all(),
            user,
            field_name='liquidacion__empresa',
        )

        if liquidacion_id:
            qs = qs.filter(liquidacion_id=liquidacion_id)

        return qs

    def perform_create(self, serializer):
        liquidacion = serializer.validated_data.get('liquidacion')
        if liquidacion.estado != Liquidacion.Estado.BORRADOR:
            raise ValidationError({'liquidacion': 'No se pueden agregar conceptos a una liquidación que no está en borrador.'})
        
        # Validate that the liquidacion belongs to the user's company
        empresa = self.request.user.empresa
        if not self.request.user.is_superuser:
            if liquidacion.empresa_id != empresa.id:
                raise ValidationError({'liquidacion': 'La liquidación no pertenece a tu empresa.'})

        serializer.save()
        liquidacion.calcular_totales()

    def perform_destroy(self, instance):
        liquidacion = instance.liquidacion
        if liquidacion.estado != Liquidacion.Estado.BORRADOR:
            raise ValidationError('No se pueden eliminar conceptos de una liquidación que no está en borrador.')
        
        instance.delete()
        liquidacion.calcular_totales()
