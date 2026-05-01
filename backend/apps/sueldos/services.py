from decimal import Decimal
from datetime import datetime, date
from collections import defaultdict
from apps.sueldos.models import Liquidacion, LiquidacionDetalleHoras
from apps.horarios.models import Horario

def generar_detalle_horas_desde_horarios(liquidacion):
    """
    Toma una liquidación (que tiene fechas desde/hasta) y procesa los horarios (turnos planificados) del empleado
    para generar el detalle de horas día por día, y luego recalcula los totales.
    """
    if liquidacion.estado != Liquidacion.Estado.BORRADOR:
        raise ValueError("Solo se pueden regenerar las horas de una liquidación en estado BORRADOR.")

    # 1. Limpiamos los detalles de horas existentes
    liquidacion.detalle_horas.all().delete()

    # 2. Obtenemos todos los turnos (horarios) del periodo
    horarios = Horario.objects.filter(
        empleado=liquidacion.empleado,
        empresa=liquidacion.empresa,
        fecha__gte=liquidacion.fecha_desde,
        fecha__lte=liquidacion.fecha_hasta
    ).order_by('fecha', 'hora_inicio')

    # Agruparemos las horas planificadas por fecha. Key: fecha, Value: {'horas': Decimal, 'sucursal': obj, 'horario_id': int}
    resumen_diario = defaultdict(lambda: {'horas': Decimal('0.00'), 'sucursal': None, 'horario_id': None})

    # 3. Procesamos los turnos
    for turno in horarios:
        inicio = datetime.combine(date.min, turno.hora_inicio)
        fin = datetime.combine(date.min, turno.hora_fin)
        diferencia = fin - inicio
        horas = Decimal(diferencia.total_seconds() / 3600.0)
        
        if horas < 0:
            horas += Decimal('24.00')

        fecha = turno.fecha
        resumen_diario[fecha]['horas'] += horas
        resumen_diario[fecha]['sucursal'] = turno.sucursal
        resumen_diario[fecha]['horario_id'] = turno.id
    
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
                    horario_id=datos['horario_id'],
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
