from rest_framework import serializers
from .models import Liquidacion, LiquidacionDetalleHoras, LiquidacionConcepto

class LiquidacionConceptoSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiquidacionConcepto
        fields = '__all__'

class LiquidacionDetalleHorasSerializer(serializers.ModelSerializer):
    semana = serializers.ReadOnlyField()
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)
    hora_inicio = serializers.TimeField(source='horario.hora_inicio', read_only=True)
    hora_fin = serializers.TimeField(source='horario.hora_fin', read_only=True)

    class Meta:
        model = LiquidacionDetalleHoras
        fields = '__all__'

class LiquidacionSerializer(serializers.ModelSerializer):
    resumen_semanal = serializers.ReadOnlyField()
    nombre_empleado = serializers.CharField(source='empleado.nombre', read_only=True)
    conceptos = LiquidacionConceptoSerializer(many=True, read_only=True)
    detalle_horas = LiquidacionDetalleHorasSerializer(many=True, read_only=True)

    class Meta:
        model = Liquidacion
        fields = [
            'id', 'empleado', 'empresa', 'periodo_anio', 'periodo_mes',
            'fecha_desde', 'fecha_hasta', 'estado', 'total_horas',
            'monto_horas', 'total_plus', 'total_descuentos',
            'total_adelantos', 'total_ajustes', 'total_neto',
            'creado_en', 'resumen_semanal', 'conceptos', 'nombre_empleado',
            'detalle_horas'
        ]
        read_only_fields = ['empresa', 'creado_en', 'modificado_en', 'modificado_por']

