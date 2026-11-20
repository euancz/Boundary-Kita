from django.urls import include, path
from rest_framework.routers import SimpleRouter

from . import operations

router = SimpleRouter()
router.register("drivers", operations.DriverViewSet, basename="driver")
router.register("jeepneys", operations.JeepneyViewSet, basename="jeepney")
router.register("routes", operations.RouteViewSet, basename="route")
router.register("boundaries", operations.BoundaryViewSet, basename="boundary")
router.register("requests", operations.BorrowRequestViewSet, basename="borrow-request")

urlpatterns = [
    path("session/", operations.session),
    path("session/login/", operations.sign_in),
    path("session/logout/", operations.sign_out),
    path("dashboard/", operations.dashboard),
    path("", include(router.urls)),
]
