
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { api } from "./api";

import Login from "./pages/Login";
import LoginLayout from "./components/LoginLayout";
import Dashboard from "./pages/Dashboard";
import DriverProfiles from "./pages/DriverProfiles";
import AddDriver from "./pages/AddDriver";
import JeepneyUnits from "./pages/JeepneyUnits";
import JeepneyRoutes from "./pages/JeepneyRoutes";
import BoundaryRecords from "./pages/BoundaryRecords";
import LiveTracking from "./pages/LiveTracking";
import BorrowRequests from "./pages/BorrowRequests";
import "./styles/modern.css";

function App() {
  const [session, setSession] = useState(null);
  const [failure, setFailure] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const expire = () => {
      api("session/").then(setSession).catch(() => setSession({ username: null }));
    };
    window.addEventListener("session-expired", expire);
    api("session/", { signal: controller.signal }).then(setSession).catch((error) => {
      if (!controller.signal.aborted) setFailure(error.message);
    });
    return () => {
      controller.abort();
      window.removeEventListener("session-expired", expire);
    };
  }, [attempt]);

  if (!session) {
    return (
      <LoginLayout>
        <h1>Operator sign-in</h1>
        <p className={failure ? "operation-error" : "page-note"} role={failure ? "alert" : "status"}>
          {failure || "Checking session…"}
        </p>
        {failure && (
          <button className="btn btn-navy" onClick={() => {
            setFailure("");
            setAttempt((current) => current + 1);
          }}>Try again</button>
        )}
      </LoginLayout>
    );
  }

  async function signOut() {
    setSession(await api("session/logout/", { method: "POST" }));
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={session.username
          ? <Navigate to="/dashboard" replace />
          : <Login onLogin={setSession} />}
        />
        <Route element={session.username
          ? <Outlet context={{ username: session.username, signOut }} />
          : <Navigate to="/" replace />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/drivers" element={<DriverProfiles />} />
          <Route path="/drivers/add" element={<AddDriver key="add" />} />
          <Route path="/drivers/:id/edit" element={<AddDriver key="edit" />} />
          <Route path="/jeepneys" element={<JeepneyUnits />} />
          <Route path="/jeepney-routes" element={<JeepneyRoutes />} />
          <Route path="/boundaries" element={<BoundaryRecords />} />
          <Route path="/tracking" element={<LiveTracking />} />
          <Route path="/requests" element={<BorrowRequests />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
