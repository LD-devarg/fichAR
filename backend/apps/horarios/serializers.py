from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Horario

class HorarioSerializer(serializers.ModelSerializer):
    nombre_sucursal = serializers.CharField(source='sucursal.nombre', read_only=True)
    nombre_empleado = serializers.CharField(source='empleado.nombre', read_only=True)
    username_empleado = serializers.CharField(source='empleado.username', read_only=True)

    class Meta:
        model = Horario
        fields = '__all__'
        read_only_fields = ['empresa', 'creado_en', 'modificado_en', 'modificado_por']

    def validate(self, attrs):
        # Build a temporary (unsaved) instance to run model-level clean() validations
        instance = self.instance or Horario()
        for attr, value in attrs.items():
            setattr(instance, attr, value)
        # empresa is set by the view after validation, so only run clean if it's already set
        if instance.empresa_id:
            try:
                instance.clean()
            except DjangoValidationError as e:
                raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else {'non_field_errors': e.messages})
        return attrs
