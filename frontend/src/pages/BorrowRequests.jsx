
import { useState } from "react";
import PageLayout from "../components/PageLayout";

export default function BorrowRequests() {
  const [requests, setRequests] = useState([
    {
      id: 1,
      driver: "Juan Dela Cruz",
      jeepney: "Unit 002",
      date: "2026-10-25",
      reason: "Temporary replacement jeepney",
      status: "Pending",
    },
    {
      id: 2,
      driver: "Pedro Santos",
      jeepney: "Unit 003",
      date: "2026-10-25",
      reason: "Requesting an available unit",
      status: "Pending",
    },
  ]);

  function updateStatus(id, status) {
    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? { ...request, status }
          : request
      )
    );
  }

  return (
    <PageLayout title="Borrow Requests">
      {requests.map((request) => (
        <div className="record-card" key={request.id}>
          <div>
            <strong>{request.driver}</strong>
            <small>Jeepney: {request.jeepney}</small>
            <small>Date: {request.date}</small>
            <small>Reason: {request.reason}</small>
            <small>Status: {request.status}</small>

            {request.status === "Pending" && (
              <div className="form-actions">
                <button
                  className="btn btn-green"
                  onClick={() =>
                    updateStatus(request.id, "Approved")
                  }
                >
                  APPROVE
                </button>

                <button
                  className="btn btn-red"
                  onClick={() =>
                    updateStatus(request.id, "Declined")
                  }
                >
                  DECLINE
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </PageLayout>
  );
}
