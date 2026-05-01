from rest_framework import serializers
from .models import Asistencia

class AsistenciaSerializer(serializers.ModelSerializer):
    nombre_empleado = serializers.CharField(source='empleado.nombre', read_only=True)
    nombre_sucursal = serializers.CharField(source='sucursal.nombre', read_only=True)
    class Meta:
        model = Asistencia
        fields = '__all__'
        # Obligamos a que el 'empleado' que ficha sea el que está autenticado enviando el token (API)
        # Evita que alguien pase un id_empleado fraudulento por JSON intentando fichar por otro.
        read_only_fields = ('empleado', 'empresa', 'fecha_hora')
