from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.empresa.models import Empresa, Sucursal

from .models import Asistencia

Usuario = get_user_model()


class TestAsistenciaViewSet(APITestCase):
    def setUp(self):
        self.empresa = Empresa.objects.create(nombre='Empresa Uno')
        self.otra_empresa = Empresa.objects.create(nombre='Empresa Dos')
        self.empleado_group = Group.objects.create(name='Empleado')
        self.sucursal = Sucursal.objects.create(
            empresa=self.empresa,
            nombre='Sucursal Centro',
            direccion='Calle 123',
        )
        self.sucursal_ajena = Sucursal.objects.create(
            empresa=self.otra_empresa,
            nombre='Sucursal Ajena',
            direccion='Calle 999',
        )
        self.empleado = Usuario.objects.create_user(
            username='empleado1',
            password='test1234',
            nombre='Empleado Uno',
            email='empleado1@example.com',
            empresa=self.empresa,
        )
        self.empleado.groups.add(self.empleado_group)
        self.client.force_authenticate(self.empleado)

    def test_create_uses_empresa_y_empleado_del_contexto(self):
        response = self.client.post(
            reverse('asistencia-list'),
            {
                'empresa': self.otra_empresa.id,
                'empleado': 999,
                'sucursal': self.sucursal.id,
                'tipo_fichada': 'entrada',
                'fecha_hora': '2026-01-01T00:00:00Z',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        asistencia = Asistencia.objects.get()
        self.assertEqual(asistencia.empresa, self.empresa)
        self.assertEqual(asistencia.empleado, self.empleado)
        self.assertEqual(asistencia.sucursal, self.sucursal)

    def test_create_rejects_sucursal_de_otra_empresa(self):
        response = self.client.post(
            reverse('asistencia-list'),
            {
                'sucursal': self.sucursal_ajena.id,
                'tipo_fichada': 'entrada',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sucursal', response.data)
