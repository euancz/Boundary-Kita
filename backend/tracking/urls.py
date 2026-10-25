from django.urls import path
from .views import latest_location, receive_location

urlpatterns = [
    path(
        "latest/",
        latest_location,
        name="latest_location"
    ),

    path(
        "location/",
        receive_location,
        name="receive_location"
    ),
]