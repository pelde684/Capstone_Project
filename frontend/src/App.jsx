import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import StudentDashboard from "./pages/StudentDashboard";
import RegisterItem from "./pages/RegisterItem";
import MyBelongings from "./pages/MyBelongings";
import FeedbackPage from "./pages/FeedbackPage";
import Footer from "./public/Footer";
import { getToken } from "./api";

// Pages after login need a saved token, otherwise go back to the login page.
// The footer is added here once, so every logged-in page gets it.
function RequireAuth({ children }) {
  if (!getToken()) return <Navigate to="/" replace />;
  return (
    <>
      {children}
      <Footer loggedIn />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<RequireAuth><StudentDashboard /></RequireAuth>} />
      <Route path="/register" element={<RequireAuth><RegisterItem /></RequireAuth>} />
      <Route path="/belongings" element={<RequireAuth><MyBelongings /></RequireAuth>} />
      <Route path="/feedback" element={<RequireAuth><FeedbackPage /></RequireAuth>} />
    </Routes>
  );
}

export default App;