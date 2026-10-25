
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DriverProfiles from "./pages/DriverProfiles";
import AddDriver from "./pages/AddDriver";
import JeepneyUnits from "./pages/JeepneyUnits";
import JeepneyRoutes from "./pages/JeepneyRoutes";
import BoundaryRecords from "./pages/BoundaryRecords";
import LiveTracking from "./pages/LiveTracking";
import BorrowRequests from "./pages/BorrowRequests";
import "./styles/storyboard.css";
import "./styles/storyboard.css";
import "./styles/modern.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/drivers" element={<DriverProfiles />} />
        <Route path="/drivers/add" element={<AddDriver />} />
        <Route path="/jeepneys" element={<JeepneyUnits />} />
        <Route path="/jeepney-routes" element={<JeepneyRoutes />} />
        <Route path="/boundaries" element={<BoundaryRecords />} />
        <Route path="/tracking" element={<LiveTracking />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/requests" element={<BorrowRequests />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
