
from django.db import models
from django.utils import timezone


class Route(models.Model):
    name = models.CharField(max_length=120, unique=True)
    fare = models.DecimalField(max_digits=8, decimal_places=2)
    distance = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return self.name

class Jeepney(models.Model):
    unit_no = models.CharField(max_length=50, unique=True)
    plate_no = models.CharField(max_length=50)
    status = models.CharField(
        max_length=20,
        default="active"
    )
    route = models.ForeignKey(Route, on_delete=models.PROTECT, blank=True, null=True)
    archived = models.BooleanField(default=False)

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

    class Meta:
        indexes = [models.Index(fields=["jeepney", "-recorded_at", "-id"])]


class Driver(models.Model):
    name = models.CharField(max_length=120)
    address = models.CharField(max_length=250)
    contact = models.CharField(max_length=40)
    license = models.CharField(max_length=50, unique=True)
    license_expiry = models.DateField()
    jeepney = models.ForeignKey(Jeepney, on_delete=models.PROTECT, blank=True, null=True)
    photo = models.BinaryField(blank=True, null=True)
    photo_type = models.CharField(max_length=20, blank=True)
    archived = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class BoundaryRecord(models.Model):
    jeepney = models.ForeignKey(Jeepney, on_delete=models.PROTECT)
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT)
    date = models.DateField(default=timezone.localdate)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["jeepney", "date"], name="one_boundary_per_unit_day")
        ]


class BorrowRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        DECLINED = "declined", "Declined"

    driver = models.ForeignKey(Driver, on_delete=models.PROTECT)
    jeepney = models.ForeignKey(Jeepney, on_delete=models.PROTECT)
    date = models.DateField(default=timezone.localdate)
    reason = models.CharField(max_length=500)
    status = models.CharField(max_length=10, choices=Status, default=Status.PENDING)
