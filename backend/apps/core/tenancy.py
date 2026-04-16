from rest_framework.exceptions import PermissionDenied


def get_user_empresa(user):
    return getattr(user, "empresa", None)


def scope_queryset_to_user_empresa(queryset, user, field_name="empresa"):
    if not user or not user.is_authenticated:
        return queryset.none()
    if user.is_superuser:
        return queryset

    empresa = get_user_empresa(user)
    if empresa is None:
        return queryset.none()

    return queryset.filter(**{field_name: empresa})


def ensure_same_empresa(instance, user, label="registro", attr_name="empresa"):
    if user.is_superuser:
        return

    empresa = get_user_empresa(user)
    instance_empresa = getattr(instance, attr_name, None)

    if empresa is None or instance_empresa != empresa:
        raise PermissionDenied(f"No tienes permiso para operar sobre este {label}.")
