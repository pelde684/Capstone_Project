import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PageBackground from "./components/PageBackground";

import Login from "./pages/Login";

import OperatorDashboard from "./pages/OperatorDashboard";
import ScanQR from "./pages/ScanQR";
import Verification from "./pages/Verification";
import Handover from "./pages/Handover";

import AdminDashboard from "./pages/AdminDashboard";
import Students from "./pages/Students";
import Reports from "./pages/Reports";
import SystemRecords from "./pages/SystemRecords";

import StudentDashboard from "./pages/StudentDashboard";
import MyBelongings from "./pages/MyBelongings";
import RegisterLuggage from "./pages/RegisterLuggage";

function SystemPages() {
  return (
    <PageBackground>
      <Routes>

        {/* Operator */}
        <Route
          path="/operator/dashboard"
          element={<OperatorDashboard />}
        />

        <Route
          path="/operator/scan"
          element={<ScanQR />}
        />

        <Route
          path="/operator/verification"
          element={<Verification />}
        />

        <Route
          path="/operator/handover"
          element={<Handover />}
        />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/students"
          element={<Students />}
        />

        <Route
          path="/admin/reports"
          element={<Reports />}
        />

        <Route
          path="/admin/records"
          element={<SystemRecords />}
        />

        {/* Student */}
        <Route
          path="/student/dashboard"
          element={<StudentDashboard />}
        />

        <Route
          path="/student/belongings"
          element={<MyBelongings />}
        />

        <Route
          path="/student/register"
          element={<RegisterLuggage />}
        />

      </Routes>
    </PageBackground>
  );
}

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* All system pages */}
        <Route
          path="/*"
          element={<SystemPages />}
        />

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}