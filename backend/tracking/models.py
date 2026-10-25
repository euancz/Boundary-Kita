
from django.db import models

class Jeepney(models.Model):
    unit_no = models.CharField(max_length=50, unique=True)
    plate_no = models.CharField(max_length=50)
    status = models.CharField(
        max_length=20,
        default="active"
    )

    def __str__(self):
        return self.unit_no


class GPSLog(models.Model):
    jeepney = models.ForeignKey(
        Jeepney,
        on_delete=models.CASCADE,
        related_name="gps_logs"
    )

    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7
    )

    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7
    )

    speed = models.FloatField(default=0)

    recorded_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.jeepney.unit_no} - {self.recorded_at}"
