
import { useState } from "react";
import PageLayout from "../components/PageLayout";

export default function BoundaryRecords() {
  const [payments, setPayments] = useState([
    { id: 1, unit: "001", driver: "Juan", amount: 800, paid: true },
    { id: 2, unit: "002", driver: "Pedro", amount: 800, paid: true },
    { id: 3, unit: "003", driver: "Mario", amount: 800, paid: false },
  ]);

  const [selectedUnit, setSelectedUnit] = useState("all");

  const filtered = payments.filter(
    (payment) =>
      selectedUnit === "all" || payment.unit === selectedUnit
  );

  const totalCollected = filtered
    .filter((p) => p.paid)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalUnpaid = filtered
    .filter((p) => !p.paid)
    .reduce((sum, p) => sum + p.amount, 0);

  function recordPayment() {
    const unpaid = filtered.find((p) => !p.paid);

    if (!unpaid) {
      alert("No unpaid boundaries in the current selection.");
      return;
    }

    setPayments((current) =>
      current.map((p) =>
        p.id === unpaid.id ? { ...p, paid: true } : p
      )
    );
  }

  return (
    <PageLayout title="Boundary Records">
      <div className="toolbar">
        <input type="date" defaultValue="2026-10-01" />

        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
        >
          <option value="all">All units</option>
          <option value="001">Unit 001</option>
          <option value="002">Unit 002</option>
          <option value="003">Unit 003</option>
        </select>
      </div>

      {filtered.map((payment) => (
        <div className="record-card" key={payment.id}>
          <div>
            <strong>
              Unit #{payment.unit} - {payment.driver}
            </strong>
            <small>₱{payment.amount.toLocaleString()}</small>
          </div>

          <span
            className={`status-label ${
              payment.paid ? "status-paid" : "status-unpaid"
            }`}
          >
            {payment.paid ? "PAID" : "UNPAID"}
          </span>
        </div>
      ))}

      <div className="payment-totals">
        <p>Total collected: ₱{totalCollected.toLocaleString()}</p>
        <p>Total unpaid: ₱{totalUnpaid.toLocaleString()}</p>
      </div>

      <button
        className="btn btn-navy full-width"
        onClick={recordPayment}
      >
        + RECORD BOUNDARY PAYMENT
      </button>
    </PageLayout>
  );
}
