from rest_framework import permissions

def user_is_admin(user):
    if not user or not user.is_authenticated:
        return False
    return user.is_superuser or user.groups.filter(name='Admin').exists()

def user_is_empleado(user):
    if not user or not user.is_authenticated:
        return False
    return user.is_superuser or user.groups.filter(name='Empleado').exists()


class IsAdminUserRole(permissions.BasePermission):
    """
    Acceso concedido SÓLO a Superusuarios o miembros del grupo 'Admin'.
    Se utilizará en endpoints exclusivos de gerencia como:
    - CRUD completo de Usuarios (crear, echar empleados)
    - CRUD completo de Horarios
    - Modificar o crear Liquidaciones manualmente.
    """
    def has_permission(self, request, view):
        return user_is_admin(request.user)


class IsEmpleadoRoleForAsistencia(permissions.BasePermission):
    """
    Acceso pensado pura y exclusivamente para crear registros de Asistencia (Entrada / Salida).
    Otorga paso si estás en el grupo 'Empleado'.
    """
    def has_permission(self, request, view):
        # Permite acceder a la vista general si es empleado
        if request.method == 'POST':
            return user_is_empleado(request.user)
        # Un admin quizás necesite ver el historial general con GET
        return user_is_admin(request.user) or user_is_empleado(request.user)


class IsAdminOrOwnerReadOnly(permissions.BasePermission):
    """
    Permiso híbrido a nivel de Objeto (Ideal para Liquidaciones):
    - Admin/Superuser: Puede leer, escribir, borrar CUALQUIER registro.
    - Empleado: Puede SOLAMENTE LEER (GET) pero única y exclusivamente si el dueño del registro es él mismo.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Si es Admin, tiene pase libre en el objeto.
        if user_is_admin(request.user):
            return True
            
        # Si el usuario actual quiere hacer un POST/PUT/DELETE, lo bloqueamos (solo admin puede).
        # Los empleados solo tienen métodos seguros (GET, HEAD, OPTIONS).
        if request.method not in permissions.SAFE_METHODS:
            return False
            
        # Verificamos que el dueño del registro (Liquidacion, DetalleHora, etc) sea el usuario que pide verlo.
        if hasattr(obj, 'empleado'):
            return obj.empleado == request.user
            
        # Por si el objeto en cuestión consultado es el mismo modelo de 'Usuario' en vez de liquidación
        if hasattr(obj, 'username'):
            return obj == request.user

        return False
