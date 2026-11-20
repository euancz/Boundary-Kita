from django.contrib import admin
from .models import BoundaryRecord, BorrowRequest, Driver, Jeepney, GPSLog, Route

admin.site.register([BoundaryRecord, BorrowRequest, Driver, Route])

@admin.register(Jeepney)
class JeepneyAdmin(admin.ModelAdmin):
    list_display = (
        'unit_no',
        'plate_no',
        'route',
        'status',
        'archived',
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
