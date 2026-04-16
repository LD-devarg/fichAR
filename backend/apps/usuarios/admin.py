from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    model = Usuario
    list_display = ("username", "nombre", "email", "empresa", "is_staff", "is_active", "creado_en")
    list_filter = ("is_staff", "is_superuser", "is_active", "groups", "empresa")
    search_fields = ("username", "nombre", "email")
    ordering = ("username",)

    fieldsets = UserAdmin.fieldsets + (
        ("Informacion adicional", {"fields": ("nombre", "empresa", "creado_en")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Informacion adicional", {"fields": ("nombre", "email", "empresa")}),
    )
    readonly_fields = ("creado_en",)
