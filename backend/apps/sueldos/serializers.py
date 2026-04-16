from rest_framework import serializers
from .models import Liquidacion, LiquidacionDetalleHoras, LiquidacionConcepto

class LiquidacionConceptoSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiquidacionConcepto
        fields = '__all__'

class LiquidacionDetalleHorasSerializer(serializers.ModelSerializer):
    # Exponemos la propiedad en tiempo de lectura
    semana = serializers.ReadOnlyField() 
    
    class Meta:
        model = LiquidacionDetalleHoras
        fields = '__all__'

class LiquidacionSerializer(serializers.ModelSerializer):
    # Exponemos la sumatoria de las semanas automáticamente
    resumen_semanal = serializers.ReadOnlyField() 
    
    # Anidamos los conceptos (plus, adelantos, etc) para mandarle todo al frontend junto
    conceptos = LiquidacionConceptoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Liquidacion
        fields = [
            'id', 'empleado', 'empresa', 'periodo_anio', 'periodo_mes', 
            'fecha_desde', 'fecha_hasta', 'estado', 'total_horas', 
            'monto_horas', 'total_plus', 'total_descuentos', 
            'total_adelantos', 'total_ajustes', 'total_neto', 
            'creado_en', 'resumen_semanal', 'conceptos'
        ]
