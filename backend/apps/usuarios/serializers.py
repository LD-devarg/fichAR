from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import serializers

from .models import ConfiguracionLaboral

Usuario = get_user_model()


class ConfiguracionLaboralSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionLaboral
        fields = ['id', 'usuario', 'dias_laborales', 'valor_hora', 'turno_preferido']
        extra_kwargs = {
            'usuario': {'required': False},
        }


class UsuarioSerializer(serializers.ModelSerializer):
    configuracion_laboral = ConfiguracionLaboralSerializer(required=False)
    nombres_grupos = serializers.SerializerMethodField(read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    rol = serializers.ChoiceField(choices=['Admin', 'Empleado'], write_only=True, required=False, default='Empleado')

    class Meta:
        model = Usuario
        fields = [
            'id',
            'username',
            'email',
            'nombre',
            'empresa',
            'is_active',
            'is_superuser',
            'nombres_grupos',
            'configuracion_laboral',
            'password',
            'rol',
        ]
        read_only_fields = ['is_superuser', 'nombres_grupos']

    def get_nombres_grupos(self, obj):
        return [g.name for g in obj.groups.all()]

    def _sync_configuracion(self, usuario, configuracion_data):
        if not configuracion_data:
            return

        dias_laborales = configuracion_data.pop('dias_laborales', None)
        configuracion, _ = ConfiguracionLaboral.objects.get_or_create(usuario=usuario)

        for field, value in configuracion_data.items():
            setattr(configuracion, field, value)

        configuracion.usuario = usuario
        configuracion.save()

        if dias_laborales is not None:
            configuracion.dias_laborales.set(dias_laborales)

    def _sync_role(self, usuario, rol):
        if not rol:
            return

        group, _ = Group.objects.get_or_create(name=rol)
        usuario.groups.remove(*usuario.groups.exclude(name=rol))
        usuario.groups.add(group)

    def create(self, validated_data):
        configuracion_data = validated_data.pop('configuracion_laboral', None)
        password = validated_data.pop('password', None)
        rol = validated_data.pop('rol', 'Empleado')

        usuario = Usuario(**validated_data)
        if password:
            usuario.set_password(password)
        else:
            usuario.set_unusable_password()
        usuario.save()

        self._sync_role(usuario, rol)
        self._sync_configuracion(usuario, configuracion_data)
        return usuario

    def update(self, instance, validated_data):
        configuracion_data = validated_data.pop('configuracion_laboral', None)
        password = validated_data.pop('password', None)
        rol = validated_data.pop('rol', None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.set_password(password)

        instance.save()

        self._sync_role(instance, rol)
        self._sync_configuracion(instance, configuracion_data)
        return instance
