from django.contrib import admin
from .models import Jeepney, GPSLog

@admin.register(Jeepney)
class JeepneyAdmin(admin.ModelAdmin):
    list_display = (
        'unit_no',
        'plate_no',
        'model',
        'status'
    )
    search_fields = ('unit_no', 'plate_no')


@admin.register(GPSLog)
class GPSLogAdmin(admin.ModelAdmin):
    list_display = (
        'jeepney',
        'latitude',
        'longitude',
        'speed',
        'recorded_at'
    )
    list_filter = ('jeepney',)