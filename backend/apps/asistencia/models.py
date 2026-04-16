from django.db import models


OPTIONS_TIPO_FICHADA = [
    ('entrada', 'Entrada'),
    ('salida', 'Salida')
]


class Asistencia(models.Model):
    empresa = models.ForeignKey('empresa.Empresa', on_delete=models.CASCADE, related_name='asistencias')
    empleado = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='asistencias')
    sucursal = models.ForeignKey('empresa.Sucursal', on_delete=models.CASCADE, related_name='asistencias')
    tipo_fichada = models.CharField(max_length=20, choices=OPTIONS_TIPO_FICHADA)
    fecha_hora = models.DateTimeField()
    creado_en = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.empresa.nombre} - {self.empleado.nombre} - {self.sucursal.nombre} - {self.tipo_fichada} - {self.fecha_hora}"
    
    class Meta:
        verbose_name_plural = "Asistencias"
        ordering = ['-fecha_hora']

