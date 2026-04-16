from .models import DiaSemana
from rest_framework import serializers

class DiaSemanaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiaSemana
        fields = ['id', 'dia', 'orden']
        
