from django.db import models

# Create your models here.
class Empresa(models.Model):
    nombre = models.CharField(max_length=255)
    administrador = models.ForeignKey('usuarios.Usuario', on_delete=models.SET_NULL, null=True, blank=True, related_name='empresas_administradas')
    creado_en = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name_plural = "Empresas"

class Sucursal(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='sucursales')
    nombre = models.CharField(max_length=255)
    direccion = models.CharField(max_length=255)
    creado_en = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nombre} - {self.empresa.nombre}"
    
    class Meta:
        verbose_name_plural = "Sucursales"