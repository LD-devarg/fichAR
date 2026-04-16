from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import DiaSemana
from apps.empresa.models import Empresa
from .models import ConfiguracionLaboral

Usuario = get_user_model()


class TestUsuarioViewSet(APITestCase):
    def setUp(self):
        self.empresa = Empresa.objects.create(nombre='Empresa Uno')
        self.admin_group = Group.objects.create(name='Admin')
        self.admin = Usuario.objects.create_user(
            username='admin1',
            password='test1234',
            nombre='Admin Uno',
            email='admin1@example.com',
            empresa=self.empresa,
        )
        self.admin.groups.add(self.admin_group)
        self.lunes = DiaSemana.objects.create(dia='Lunes', orden=1)
        self.martes = DiaSemana.objects.create(dia='Martes', orden=2)
        self.client.force_authenticate(self.admin)

    def test_create_usuario_with_configuracion_laboral(self):
        response = self.client.post(
            reverse('usuario-list'),
            {
                'username': 'empleado1',
                'nombre': 'Empleado Uno',
                'email': 'empleado1@example.com',
                'password': 'clave1234',
                'rol': 'Empleado',
                'configuracion_laboral': {
                    'valor_hora': '4500.00',
                    'turno_preferido': 'Indiferente',
                    'dias_laborales': [self.lunes.id, self.martes.id],
                },
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        usuario = Usuario.objects.get(username='empleado1')
        self.assertEqual(usuario.empresa, self.empresa)
        self.assertTrue(usuario.check_password('clave1234'))
        self.assertTrue(usuario.groups.filter(name='Empleado').exists())

        configuracion = ConfiguracionLaboral.objects.get(usuario=usuario)
        self.assertEqual(str(configuracion.valor_hora), '4500.00')
        self.assertEqual(configuracion.turno_preferido, 'Indiferente')
        self.assertEqual(configuracion.dias_laborales.count(), 2)
