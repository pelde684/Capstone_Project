import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import RegisterItem from "./pages/RegisterItem";
import MyBelongings from "./pages/MyBelongings";
import FeedbackPage from "./pages/FeedbackPage";
import { getToken } from "./api";

// Pages after login need a saved token, otherwise go back to the login page
function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<RequireAuth><StudentDashboard /></RequireAuth>} />
      <Route path="/register" element={<RequireAuth><RegisterItem /></RequireAuth>} />
      <Route path="/belongings" element={<RequireAuth><MyBelongings /></RequireAuth>} />
      <Route path="/feedback" element={<RequireAuth><FeedbackPage /></RequireAuth>} />
    </Routes>
  );
}

export default App;
