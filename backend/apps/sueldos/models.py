from django.db import models

class Liquidacion(models.Model):
    class Estado(models.TextChoices):
        BORRADOR = "BORRADOR", "Borrador"
        CERRADA = "CERRADA", "Cerrada"
        PAGADA = "PAGADA", "Pagada"

    empleado = models.ForeignKey("usuarios.Usuario", on_delete=models.CASCADE, related_name="liquidaciones")
    empresa = models.ForeignKey("empresa.Empresa", on_delete=models.CASCADE, related_name="liquidaciones")
    periodo_anio = models.PositiveSmallIntegerField()
    periodo_mes = models.PositiveSmallIntegerField()
    fecha_desde = models.DateField()
    fecha_hasta = models.DateField()
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.BORRADOR)

    total_horas = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    monto_horas = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_plus = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_descuentos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_adelantos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_ajustes = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    creado_en = models.DateTimeField(auto_now_add=True)
    modificado_en = models.DateTimeField(auto_now=True)
    modificado_por = models.ForeignKey(
        "usuarios.Usuario",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="liquidaciones_modificadas",
    )

    def __str__(self):
        return f"Liquidación de {self.empleado.nombre} - {self.empresa.nombre} - {self.periodo_mes}/{self.periodo_anio}"

    def calcular_totales(self):
        from decimal import Decimal
        from django.db.models import Sum

        # Calcular totales de horas
        detalles = self.detalle_horas.aggregate(
            t_horas=Sum('horas'),
            t_monto=Sum('subtotal')
        )
        self.total_horas = detalles['t_horas'] or Decimal('0.00')
        self.monto_horas = detalles['t_monto'] or Decimal('0.00')

        # Calcular totales por concepto
        from .models import LiquidacionConcepto
        conceptos = self.conceptos.all()
        
        self.total_plus = sum(c.monto for c in conceptos if c.tipo == LiquidacionConcepto.Tipo.PLUS) or Decimal('0.00')
        self.total_descuentos = sum(c.monto for c in conceptos if c.tipo == LiquidacionConcepto.Tipo.DESCUENTO) or Decimal('0.00')
        self.total_adelantos = sum(c.monto for c in conceptos if c.tipo == LiquidacionConcepto.Tipo.ADELANTO) or Decimal('0.00')
        self.total_ajustes = sum(c.monto for c in conceptos if c.tipo == LiquidacionConcepto.Tipo.AJUSTE) or Decimal('0.00')

        # Calcular monto neto
        self.total_neto = (
            self.monto_horas 
            + self.total_plus 
            + self.total_ajustes 
            - self.total_descuentos 
            - self.total_adelantos
        )
        self.save(update_fields=[
            'total_horas', 'monto_horas', 'total_plus', 
            'total_descuentos', 'total_adelantos', 'total_ajustes', 'total_neto'
        ])

    @property
    def resumen_semanal(self):
        """
        Agrupa los detalles de las horas de la liquidación separándolos por las semanas del mes.
        """
        from collections import defaultdict
        from decimal import Decimal
        resumen = defaultdict(lambda: {'horas': Decimal('0.00'), 'subtotal': Decimal('0.00')})
        
        for detalle in self.detalle_horas.all():
            sem = detalle.semana
            resumen[sem]['horas'] += detalle.horas
            resumen[sem]['subtotal'] += detalle.subtotal
            
        return dict(resumen)

    class Meta:
        verbose_name_plural = "Liquidaciones"
        ordering = ['-periodo_anio', '-periodo_mes', 'empleado__nombre']


class LiquidacionDetalleHoras(models.Model):
    liquidacion = models.ForeignKey(Liquidacion, on_delete=models.CASCADE, related_name="detalle_horas")
    fecha = models.DateField()
    sucursal = models.ForeignKey("empresa.Sucursal", on_delete=models.CASCADE)
    horario = models.ForeignKey("horarios.Horario", on_delete=models.SET_NULL, null=True, blank=True)

    horas = models.DecimalField(max_digits=6, decimal_places=2)
    valor_hora = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)


    def __str__(self):
        return f"{self.liquidacion} - {self.fecha} - {self.horas} horas"
    
    @property
    def semana(self):
        """
        Calcula a qué semana del mes pertenece la fecha del registro.
        Las semanas van de Lunes (0) a Domingo (6).
        La Semana 1 arranca el día 1 del mes y termina en su primer domingo.
        """
        import math
        primer_dia_mes = self.fecha.replace(day=1)
        dias_hasta_primer_domingo = 6 - primer_dia_mes.weekday()
        
        if self.fecha.day <= 1 + dias_hasta_primer_domingo:
            return 1
            
        dias_restantes = self.fecha.day - (1 + dias_hasta_primer_domingo)
        return 1 + math.ceil(dias_restantes / 7.0)
        
    class Meta:
        verbose_name_plural = "Detalle de Horas en Liquidaciones"
        ordering = ['fecha']

class LiquidacionConcepto(models.Model):
    class Tipo(models.TextChoices):
        PLUS = "PLUS", "Plus"
        DESCUENTO = "DESCUENTO", "Descuento"
        ADELANTO = "ADELANTO", "Adelanto"
        AJUSTE = "AJUSTE", "Ajuste"

    liquidacion = models.ForeignKey(Liquidacion, on_delete=models.CASCADE, related_name="conceptos")
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    descripcion = models.CharField(max_length=255)
    monto = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.liquidacion} - {self.tipo} - {self.descripcion} - {self.monto}"
    
    class Meta:
        verbose_name_plural = "Conceptos en Liquidaciones"
        ordering = ['tipo', 'descripcion']
        