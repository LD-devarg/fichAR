from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import DiaSemana
from apps.empresa.models import Empresa, Sucursal

from .models import Horario

Usuario = get_user_model()


class TestHorarioViewSet(APITestCase):
    def setUp(self):
        self.empresa = Empresa.objects.create(nombre='Empresa Uno')
        self.otra_empresa = Empresa.objects.create(nombre='Empresa Dos')
        self.dia = DiaSemana.objects.create(dia='Lunes', orden=1)
        self.admin_group = Group.objects.create(name='Admin')

        self.admin = Usuario.objects.create_user(
            username='admin1',
            password='test1234',
            nombre='Admin Uno',
            email='admin1@example.com',
            empresa=self.empresa,
        )
        self.admin.groups.add(self.admin_group)

        self.empleado_local = Usuario.objects.create_user(
            username='empleado-local',
            password='test1234',
            nombre='Empleado Local',
            email='empleado-local@example.com',
            empresa=self.empresa,
        )
        self.empleado_ajeno = Usuario.objects.create_user(
            username='empleado-ajeno',
            password='test1234',
            nombre='Empleado Ajeno',
            email='empleado-ajeno@example.com',
            empresa=self.otra_empresa,
        )

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

        Horario.objects.create(
            empresa=self.empresa,
            empleado=self.empleado_local,
            dia=self.dia,
            hora_inicio='09:00',
            hora_fin='18:00',
            sucursal=self.sucursal,
        )
        Horario.objects.create(
            empresa=self.otra_empresa,
            empleado=self.empleado_ajeno,
            dia=self.dia,
            hora_inicio='10:00',
            hora_fin='19:00',
            sucursal=self.sucursal_ajena,
        )

        self.client.force_authenticate(self.admin)

    def test_admin_only_lists_horarios_from_its_empresa(self):
        response = self.client.get(reverse('horario-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['empresa'], self.empresa.id)

    def test_admin_cannot_create_horario_for_other_empresa(self):
        response = self.client.post(
            reverse('horario-list'),
            {
                'empresa': self.otra_empresa.id,
                'empleado': self.empleado_ajeno.id,
                'dia': self.dia.id,
                'hora_inicio': '08:00',
                'hora_fin': '12:00',
                'sucursal': self.sucursal_ajena.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('empleado', response.data)
