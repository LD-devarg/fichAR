from django.db import models


class Horario(models.Model):
    empresa = models.ForeignKey('empresa.Empresa', on_delete=models.CASCADE, related_name='horarios')
    empleado = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='horarios_asignados', null=True, blank=True)
    import django.utils.timezone
    fecha = models.DateField(default=django.utils.timezone.now)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    sucursal = models.ForeignKey('empresa.Sucursal', on_delete=models.CASCADE, related_name='horarios')
    creado_en = models.DateTimeField(auto_now_add=True)
    modificado_en = models.DateTimeField(auto_now=True)
    modificado_por = models.ForeignKey('usuarios.Usuario', on_delete=models.SET_NULL, null=True, blank=True, related_name='horarios_modificados')

    def __str__(self):
        return f"{self.empresa.nombre} - {self.sucursal.nombre} - {self.fecha}: {self.hora_inicio} - {self.hora_fin}"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.sucursal and self.sucursal.empresa_id and self.empresa_id != self.sucursal.empresa_id:
            raise ValidationError({
                "sucursal": "La sucursal seleccionada no pertenece a la empresa del horario."
            })

        if self.empleado and self.empleado.empresa_id and self.empleado.empresa_id != self.empresa_id:
            raise ValidationError({
                "empleado": "El empleado seleccionado no pertenece a la empresa del horario."
            })

        if self.empleado and self.fecha:
            config = getattr(self.empleado, 'configuracion_laboral', None)
            if config:
                dias_permitidos = config.dias_laborales.all()
                if dias_permitidos.exists() and not dias_permitidos.filter(orden=self.fecha.isoweekday()).exists():
                    raise ValidationError({
                        "empleado": f"El empleado {self.empleado.nombre} no tiene configurado trabajar ese dia."
                    })

        if self.empleado and self.fecha and self.hora_inicio and self.hora_fin:
            qs = type(self).objects.filter(empleado=self.empleado, fecha=self.fecha)
            if self.pk:
                qs = qs.exclude(pk=self.pk)

            for turno in qs:
                if self.hora_inicio < turno.hora_fin and turno.hora_inicio < self.hora_fin:
                    raise ValidationError({
                        "hora_inicio": f"{self.empleado.nombre} ya tiene otro turno asignado ese dia ({turno.hora_inicio.strftime('%H:%M')} a {turno.hora_fin.strftime('%H:%M')} en {turno.sucursal.nombre}) que entra en conflicto."
                    })

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = "Horarios"
        ordering = ['empresa', 'sucursal', 'fecha', 'hora_inicio']
