from rest_framework import serializers
from .models import Horario

class HorarioSerializer(serializers.ModelSerializer):
    nombre_sucursal = serializers.CharField(source='sucursal.nombre', read_only=True)
    nombre_dia = serializers.CharField(source='dia.dia', read_only=True)
    nombre_empleado = serializers.CharField(source='empleado.nombre', read_only=True)

    class Meta:
        model = Horario
        fields = '__all__'
