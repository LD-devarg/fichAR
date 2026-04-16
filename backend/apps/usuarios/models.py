from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    nombre = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    empresa = models.ForeignKey("empresa.Empresa", on_delete=models.CASCADE, null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre or self.username
    
    class Meta:
        verbose_name_plural = "Usuarios"


OPTIONS_TURNO = [
    ('Mañana', 'Mañana'),
    ('Tarde', 'Tarde'),
    ('Noche', 'Noche'),
    ('Indiferente', 'Indiferente'),
]

class ConfiguracionLaboral(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='configuracion_laboral')
    dias_laborales = models.ManyToManyField('core.DiaSemana', blank=True)
    valor_hora = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    turno_preferido = models.CharField(max_length=20, choices=OPTIONS_TURNO, default='Indiferente')

    def __str__(self):
        return f"Configuración laboral de {self.usuario.nombre}"
    
    class Meta:
        verbose_name_plural = "Configuraciones Laborales"