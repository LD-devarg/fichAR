from decimal import Decimal
from collections import defaultdict
from apps.sueldos.models import Liquidacion, LiquidacionDetalleHoras
from apps.asistencia.models import Asistencia

def generar_detalle_horas_desde_fichadas(liquidacion):
    """
    Toma una liquidación (que tiene fechas desde/hasta) y procesa las fichadas del empleado
    para generar el detalle de horas día por día, y luego recalcula los totales.
    """
    if liquidacion.estado != Liquidacion.Estado.BORRADOR:
        raise ValueError("Solo se pueden regenerar las horas de una liquidación en estado BOORRADOR.")

    # 1. Limpiamos los detalles de horas existentes
    liquidacion.detalle_horas.all().delete()

    # 2. Obtenemos todas las fichadas del periodo
    asistencias = Asistencia.objects.filter(
        empleado=liquidacion.empleado,
        empresa=liquidacion.empresa,
        fecha_hora__date__gte=liquidacion.fecha_desde,
        fecha_hora__date__lte=liquidacion.fecha_hasta
    ).order_by('fecha_hora')

    # Agruparemos las horas trabajadas por fecha. Key: fecha, Value: {'horas': Decimal, 'sucursal': obj}
    resumen_diario = defaultdict(lambda: {'horas': Decimal('0.00'), 'sucursal': None})

    entrada_activa = None

    # 3. Procesamos las fichadas cruzando (entrada -> salida)
    for asis in asistencias:
        if asis.tipo_fichada == 'entrada':
            entrada_activa = asis
        elif asis.tipo_fichada == 'salida' and entrada_activa:
            # Calculamos la diferencia de tiempo en horas
            diferencia = asis.fecha_hora - entrada_activa.fecha_hora
            horas = Decimal(diferencia.total_seconds() / 3600.0)
            
            fecha = entrada_activa.fecha_hora.date()
            resumen_diario[fecha]['horas'] += horas
            resumen_diario[fecha]['sucursal'] = asis.sucursal
            
            # Reseteamos por si ingresa de vuelta en el mismo día
            entrada_activa = None 
    
    # 4. Obtenemos el valor asignado por hora del empleado
    config = getattr(liquidacion.empleado, 'configuracion_laboral', None)
    valor_hora = config.valor_hora if config else Decimal('0.00')

    detalles_a_crear = []
    
    # 5. Creamos los registros detallados correspondientes a cada día
    for fecha, datos in resumen_diario.items():
        if datos['horas'] > 0:
            subtotal = datos['horas'] * valor_hora
            detalles_a_crear.append(
                LiquidacionDetalleHoras(
                    liquidacion=liquidacion,
                    fecha=fecha,
                    sucursal=datos['sucursal'],
                    horas=datos['horas'],
                    valor_hora=valor_hora,
                    subtotal=subtotal
                )
            )

    # 6. Guardamos los detalles en la base de datos
    if detalles_a_crear:
        LiquidacionDetalleHoras.objects.bulk_create(detalles_a_crear)

    # 7. Disparamos la auto-calculadora para consolidar el monto final en el recibo
    liquidacion.calcular_totales()
    
    return liquidacion
