"""
URL configuration for configs project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.sueldos.views import LiquidacionViewSet, LiquidacionDetalleHorasViewSet, LiquidacionConceptoViewSet
from apps.asistencia.views import AsistenciaViewSet
from apps.core.views import DiaSemanaViewSet
from apps.horarios.views import HorarioViewSet
from apps.usuarios.views import UsuarioViewSet, ConfiguracionLaboralViewSet
from apps.empresa.views import SucursalViewSet, EmpresaViewSet

api_router = DefaultRouter()
# Rutas de Sueldos (RRHH, recibos, botones mágicos)
api_router.register(r'sueldos/liquidaciones', LiquidacionViewSet, basename='liquidacion')
api_router.register(r'sueldos/detalles', LiquidacionDetalleHorasViewSet, basename='liquidacion-detalle')
api_router.register(r'sueldos/conceptos', LiquidacionConceptoViewSet, basename='liquidacion-concepto')

# Rutas de Operadores (Fichadas, marcadores de entrada/salida)
api_router.register(r'asistencia', AsistenciaViewSet, basename='asistencia')

# Rutas de Tablas/Teoría (Configuración general de la franquicia)
api_router.register(r'horarios', HorarioViewSet, basename='horario')
api_router.register(r'empresa/sucursales', SucursalViewSet, basename='sucursal')
api_router.register(r'empresa/empresas', EmpresaViewSet, basename='empresa')
api_router.register(r'core/dias-semana', DiaSemanaViewSet, basename='dia-semana')

# Rutas del Núcleo (Gestión de los humanos y sus turnos deseados)
api_router.register(r'usuarios/configuracion', ConfiguracionLaboralViewSet, basename='configuracion-laboral')
api_router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(api_router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns = [
        path("__debug__/", include("debug_toolbar.urls")),
        *urlpatterns,
    ]
