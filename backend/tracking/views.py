
import secrets

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Jeepney, GPSLog

import json


# GET: Retrieve the latest GPS coordinates
def latest_location(request):
    gps = GPSLog.objects.order_by(
        "-recorded_at", "-id"
    ).first()

    if gps is None:
        return JsonResponse({
            "message": "No GPS data available"
        })

    return JsonResponse({
        "jeepney": gps.jeepney.unit_no,
        "latitude": float(gps.latitude),
        "longitude": float(gps.longitude),
        "speed": gps.speed,
        "recorded_at": gps.recorded_at.isoformat()
    })


# POST: Receive coordinates from ESP32/Postman
@csrf_exempt
@require_POST
def receive_location(request):

    # 1. Verify tracker token
    expected_token = settings.TRACKER_API_TOKEN
    provided_token = request.headers.get(
        "X-Tracker-Token", ""
    )

    if (
        not expected_token
        or not secrets.compare_digest(
            expected_token,
            provided_token
        )
    ):
        return JsonResponse(
            {"error": "Unauthorized tracker"},
            status=401
        )

    # 2. Read JSON request
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "Invalid JSON format"},
            status=400
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"error": "Expected a JSON object"},
            status=400
        )

    # 3. Validate incoming GPS values
    try:
        jeepney_id = int(data["jeepney_id"])
        latitude = float(data["latitude"])
        longitude = float(data["longitude"])
        speed = float(data.get("speed", 0))

        import math

        if not all(map(math.isfinite, [
            latitude, longitude, speed
        ])):
            raise ValueError()

        if not (-90 <= latitude <= 90):
            raise ValueError()

        if not (-180 <= longitude <= 180):
            raise ValueError()

        if speed < 0 or speed > 500:
            raise ValueError()

    except (KeyError, ValueError, TypeError, OverflowError):
        return JsonResponse(
            {"error": "Invalid GPS data"},
            status=400
        )

    # 4. Find the registered jeepney
    try:
        jeepney = Jeepney.objects.get(id=jeepney_id)
    except Jeepney.DoesNotExist:
        return JsonResponse(
            {"error": "Jeepney not found"},
            status=404
        )

    # 5. Save GPS coordinates
    gps = GPSLog.objects.create(
        jeepney=jeepney,
        latitude=latitude,
        longitude=longitude,
        speed=speed
    )

    # 6. Return confirmation
    return JsonResponse({
        "message": "GPS location saved successfully",
        "gps_id": gps.id,
        "jeepney": jeepney.unit_no,
        "latitude": float(gps.latitude),
        "longitude": float(gps.longitude),
        "speed": gps.speed
    }, status=201)
