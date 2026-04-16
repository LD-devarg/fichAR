from django.contrib import admin

from .models import Empresa, Sucursal


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "administrador", "activo", "creado_en")
    list_filter = ("activo", "creado_en")
    search_fields = ("nombre", "administrador__username", "administrador__email", "administrador__nombre")
    ordering = ("nombre",)


@admin.register(Sucursal)
class SucursalAdmin(admin.ModelAdmin):
    list_display = ("nombre", "empresa", "direccion", "activo", "creado_en")
    list_filter = ("activo", "empresa", "creado_en")
    search_fields = ("nombre", "empresa__nombre", "direccion")
    ordering = ("empresa__nombre", "nombre")
