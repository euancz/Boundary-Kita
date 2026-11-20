from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import Client, TestCase, override_settings
from django.utils import timezone

from .models import BoundaryRecord, BorrowRequest, Driver, Jeepney


class OperationsTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="operator", password="test-operator-password")
        cls.unit = Jeepney.objects.create(unit_no="001", plate_no="ABC 1234")
        cls.driver = Driver.objects.create(
            name="Test Driver", address="Station", contact="09123456789",
            license="LICENSE-1", license_expiry="2030-06-01", jeepney=cls.unit,
        )

    def test_session_login_requires_csrf_and_protects_operator_data(self):
        client = Client(enforce_csrf_checks=True)
        credentials = {"username": "operator", "password": "test-operator-password"}
        self.assertEqual(client.get("/api/drivers/").status_code, 403)
        self.assertEqual(client.post("/api/session/login/", credentials, content_type="application/json").status_code, 403)
        client.get("/api/session/")
        token = client.cookies["csrftoken"].value
        response = client.post(
            "/api/session/login/", credentials, content_type="application/json", headers={"x-csrftoken": token},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(client.get("/api/drivers/").json()[0]["id"], self.driver.id)

    def test_boundary_cannot_be_duplicated_and_payment_is_idempotent(self):
        self.client.force_login(self.user)
        data = {
            "jeepney": self.unit.id, "driver": self.driver.id,
            "date": timezone.localdate().isoformat(), "amount": "750.50",
        }
        created = self.client.post("/api/boundaries/", data, content_type="application/json")
        self.assertEqual(created.status_code, 201)
        unpaid = self.client.get("/api/dashboard/").json()["unpaid_today"]
        self.assertEqual(unpaid["count"], 1)
        self.assertEqual(Decimal(unpaid["amount"]), Decimal("750.50"))
        self.assertEqual(self.client.post("/api/boundaries/", data, content_type="application/json").status_code, 400)
        payment_url = f"/api/boundaries/{created.json()['id']}/pay/"
        first = self.client.post(payment_url).json()
        self.assertIsNotNone(first["paid_at"])
        self.assertEqual(self.client.post(payment_url).json()["paid_at"], first["paid_at"])
        dashboard = self.client.get("/api/dashboard/").json()
        self.assertEqual(Decimal(dashboard["boundary_today"]), Decimal("750.50"))
        self.assertEqual(dashboard["unpaid_today"]["count"], 0)

        self.assertEqual(self.client.delete(f"/api/jeepneys/{self.unit.id}/").status_code, 204)
        self.assertEqual(self.client.get("/api/jeepneys/").json(), [])
        self.assertEqual(BoundaryRecord.objects.filter(jeepney=self.unit).count(), 1)

    def test_request_cannot_be_declined_after_approval(self):
        self.client.force_login(self.user)
        borrow = BorrowRequest.objects.create(jeepney=self.unit, driver=self.driver, reason="Replacement")
        url = f"/api/requests/{borrow.id}/decision/"
        self.assertEqual(self.client.post(url, {"status": "approved"}).status_code, 200)
        self.assertEqual(self.client.post(url, {"status": "declined"}).status_code, 409)
        borrow.refresh_from_db()
        self.assertEqual(borrow.status, BorrowRequest.Status.APPROVED)

    @override_settings(TRACKER_API_TOKEN="tracker-test-token")
    def test_tracker_writes_with_token_and_operator_reads_per_unit(self):
        report = {"jeepney_id": self.unit.id, "latitude": 15.4834123, "longitude": 120.5931478, "speed": 14.5}
        url = "/api/tracking/location/"
        self.assertEqual(self.client.post(url, report, content_type="application/json").status_code, 401)
        headers = {"x-tracker-token": "tracker-test-token"}
        invalid = {**report, "latitude": 150}
        self.assertEqual(self.client.post(url, invalid, content_type="application/json", headers=headers).status_code, 400)
        self.assertEqual(self.client.post(url, report, content_type="application/json", headers=headers).status_code, 201)
        self.assertEqual(self.client.get("/api/tracking/latest/").status_code, 401)
        self.client.force_login(self.user)
        latest = self.client.get("/api/tracking/latest/", {"jeepney_id": self.unit.id}).json()
        self.assertEqual(latest["latitude"], report["latitude"])
        self.assertEqual(latest["longitude"], report["longitude"])
        self.assertEqual(self.client.get("/api/tracking/latest/", {"jeepney_id": self.unit.id + 1}).json(),
                         {"message": "No GPS data available"})
