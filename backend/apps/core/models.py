from django.db import models

class DiaSemana(models.Model):
    dia = models.CharField(max_length=20, unique=True)
    orden = models.PositiveIntegerField(unique=True)

    def __str__(self):
        return self.dia
    class Meta:
        verbose_name_plural = "Días de la Semana"
        ordering = ['orden']

