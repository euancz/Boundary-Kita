from collections.abc import Mapping
from decimal import Decimal
from io import BytesIO

from PIL import Image, UnidentifiedImageError
from rest_framework import serializers
from rest_framework.reverse import reverse

from .models import BoundaryRecord, BorrowRequest, Driver, Jeepney, Route


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = ["id", "name", "fare", "distance"]
        extra_kwargs = {
            "fare": {"min_value": Decimal("0")},
            "distance": {"min_value": Decimal("0.01")},
        }


class FleetSerializer(serializers.ModelSerializer):
    def update(self, instance, validated_data):
        if validated_data:
            updated = type(instance).objects.filter(pk=instance.pk, archived=False).update(**validated_data)
            if not updated:
                raise serializers.ValidationError("This record has been archived.")
            instance.refresh_from_db()
        return instance


class JeepneySerializer(FleetSerializer):
    route_name = serializers.CharField(source="route.name", read_only=True, default=None)

    class Meta:
        model = Jeepney
        fields = ["id", "unit_no", "plate_no", "status", "route", "route_name", "archived"]
        read_only_fields = ["archived"]


class DriverSerializer(FleetSerializer):
    unit_no = serializers.CharField(source="jeepney.unit_no", read_only=True, default=None)
    photo = serializers.ImageField(write_only=True, required=False)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = [
            "id", "name", "address", "contact", "license", "license_expiry",
            "jeepney", "unit_no", "photo", "photo_url",
        ]

    def get_photo_url(self, driver):
        if driver.photo_type:
            return reverse("driver-photo", args=[driver.pk])
        return None

    def validate_jeepney(self, jeepney):
        if jeepney and jeepney.archived and (
            self.instance is None or self.instance.jeepney_id != jeepney.id
        ):
            raise serializers.ValidationError("Choose a registered jeepney.")
        return jeepney

    def to_internal_value(self, data):
        upload = data.get("photo") if isinstance(data, Mapping) else None
        if upload is not None and getattr(upload, "size", 0) > 2 * 1024 * 1024:
            raise serializers.ValidationError({"photo": "The photo must be 2 MB or smaller."})
        return super().to_internal_value(data)

    def validate(self, attrs):
        upload = attrs.pop("photo", None)
        if upload:
            with Image.open(upload) as image:
                if image.format not in {"JPEG", "PNG", "WEBP"}:
                    raise serializers.ValidationError({"photo": "Choose a JPEG, PNG, or WebP image."})
                if image.width * image.height > 16_000_000:
                    raise serializers.ValidationError({"photo": "Choose a smaller image."})
                try:
                    image.load()
                    output = BytesIO()
                    image.thumbnail((640, 640))
                    image.convert("RGB").save(output, format="JPEG", quality=88)
                except (OSError, ValueError, UnidentifiedImageError) as exc:
                    raise serializers.ValidationError({"photo": "Unable to read the image."}) from exc
            attrs.update(photo=output.getvalue(), photo_type="image/jpeg")
        return attrs


class RegisteredFleetSerializer(serializers.ModelSerializer):
    date = serializers.DateField()
    unit_no = serializers.CharField(source="jeepney.unit_no", read_only=True)
    driver_name = serializers.CharField(source="driver.name", read_only=True)

    def validate_jeepney(self, jeepney):
        if jeepney.archived:
            raise serializers.ValidationError("Choose a registered jeepney.")
        return jeepney

    def validate_driver(self, driver):
        if driver.archived:
            raise serializers.ValidationError("Choose a registered driver.")
        return driver


class BoundaryRecordSerializer(RegisteredFleetSerializer):
    paid = serializers.BooleanField(write_only=True, default=False)

    class Meta:
        model = BoundaryRecord
        fields = ["id", "jeepney", "unit_no", "driver", "driver_name", "date", "amount", "paid", "paid_at"]
        read_only_fields = ["paid_at"]
        extra_kwargs = {"amount": {"min_value": Decimal("0.01")}}


class BorrowRequestSerializer(RegisteredFleetSerializer):
    class Meta:
        model = BorrowRequest
        fields = ["id", "jeepney", "unit_no", "driver", "driver_name", "date", "reason", "status"]
        read_only_fields = ["status"]
