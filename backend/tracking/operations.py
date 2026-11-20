import json
from collections.abc import Mapping
from datetime import datetime, time, timedelta

from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError, transaction
from django.db.models import Count, Sum
from django.db.models.deletion import ProtectedError
from django.http import Http404, HttpResponse, JsonResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from rest_framework import mixins, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import BoundaryRecord, BorrowRequest, Driver, Jeepney, Route
from .serializers import (
    BoundaryRecordSerializer, BorrowRequestSerializer, DriverSerializer,
    JeepneySerializer, RouteSerializer,
)


@require_GET
@never_cache
@ensure_csrf_cookie
def session(request):
    return JsonResponse({"username": request.user.get_username() if request.user.is_authenticated else None})


@require_POST
@never_cache
def sign_in(request):
    try:
        data = json.loads(request.body)
        username, password = data["username"], data["password"]
        if not isinstance(username, str) or not isinstance(password, str):
            raise ValueError
    except (KeyError, ValueError, TypeError):
        return JsonResponse({"error": "Enter your username and password."}, status=400)
    user = authenticate(request, username=username.strip(), password=password)
    if user is None:
        return JsonResponse({"error": "Incorrect username or password."}, status=401)
    login(request, user)
    return JsonResponse({"username": user.get_username()})


@require_POST
@never_cache
def sign_out(request):
    logout(request)
    return JsonResponse({"username": None})


@require_GET
@never_cache
def dashboard(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Sign in to continue."}, status=401)
    today = timezone.localdate()
    start = timezone.make_aware(datetime.combine(today, time.min))
    end = timezone.make_aware(datetime.combine(today + timedelta(days=1), time.min))
    total = BoundaryRecord.objects.filter(paid_at__gte=start, paid_at__lt=end).aggregate(
        total=Sum("amount")
    )["total"]
    unpaid = BoundaryRecord.objects.filter(date=today, paid_at__isnull=True).aggregate(
        count=Count("id"), total=Sum("amount"),
    )
    return JsonResponse({
        "jeepneys": Jeepney.objects.filter(archived=False).count(),
        "drivers": Driver.objects.filter(archived=False).count(),
        "pending": BorrowRequest.objects.filter(status=BorrowRequest.Status.PENDING).count(),
        "boundary_today": str(total or 0),
        "unpaid_today": {"count": unpaid["count"], "amount": str(unpaid["total"] or 0)},
    })


@method_decorator(never_cache, name="dispatch")
class OperatorViewSet(viewsets.GenericViewSet):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]


class FleetViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin, mixins.DestroyModelMixin, OperatorViewSet,
):
    def perform_destroy(self, instance):
        instance.archived = True
        instance.save(update_fields=["archived"])


class JeepneyViewSet(FleetViewSet):
    queryset = Jeepney.objects.filter(archived=False).select_related("route").order_by("unit_no")
    serializer_class = JeepneySerializer


class DriverViewSet(FleetViewSet):
    queryset = Driver.objects.filter(archived=False).defer("photo").select_related("jeepney").order_by("name", "id")
    serializer_class = DriverSerializer

    @action(detail=True, methods=["get"])
    def photo(self, request, pk=None):
        driver = self.get_object()
        if not driver.photo_type:
            raise Http404
        response = HttpResponse(driver.photo, content_type=driver.photo_type)
        response["Cache-Control"] = "private, no-store"
        return response


class RouteViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin, mixins.DestroyModelMixin, OperatorViewSet,
):
    queryset = Route.objects.order_by("name")
    serializer_class = RouteSerializer

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError as exc:
            raise ValidationError("This route is assigned to a jeepney.") from exc


class BoundaryViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, OperatorViewSet):
    queryset = BoundaryRecord.objects.select_related("driver", "jeepney").order_by("-date", "-id")
    serializer_class = BoundaryRecordSerializer

    def perform_create(self, serializer):
        paid = serializer.validated_data.pop("paid")
        try:
            with transaction.atomic():
                serializer.save(paid_at=timezone.now() if paid else None)
        except IntegrityError as exc:
            if self.queryset.filter(
                jeepney=serializer.validated_data["jeepney"], date=serializer.validated_data["date"]
            ).exists():
                raise ValidationError("A boundary already exists for this jeepney and date.") from exc
            raise

    @action(detail=True, methods=["post"], url_path="pay")
    def pay(self, request, pk=None):
        record = self.get_object()
        self.get_queryset().filter(pk=record.pk, paid_at__isnull=True).update(paid_at=timezone.now())
        record.refresh_from_db()
        return Response(self.get_serializer(record).data)


class BorrowRequestViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, OperatorViewSet):
    queryset = BorrowRequest.objects.select_related("driver", "jeepney").order_by("-date", "-id")
    serializer_class = BorrowRequestSerializer

    @action(detail=True, methods=["post"])
    def decision(self, request, pk=None):
        borrow_request = self.get_object()
        status = request.data.get("status") if isinstance(request.data, Mapping) else None
        if status not in (BorrowRequest.Status.APPROVED, BorrowRequest.Status.DECLINED):
            raise ValidationError("Choose Approved or Declined.")
        updated = self.get_queryset().filter(
            pk=borrow_request.pk, status=BorrowRequest.Status.PENDING
        ).update(status=status)
        borrow_request.refresh_from_db()
        if not updated and borrow_request.status != status:
            return Response({"detail": "This request has already been decided."}, status=409)
        return Response(self.get_serializer(borrow_request).data)
