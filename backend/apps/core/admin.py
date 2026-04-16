from django.contrib import admin
from .models import DiaSemana

@admin.register(DiaSemana)
class DiaSemanaAdmin(admin.ModelAdmin):
    list_display = ('dia', 'orden')
    ordering = ('orden',)

