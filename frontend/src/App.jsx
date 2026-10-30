import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import RegisterItem from "./pages/RegisterItem";
import MyBelongings from "./pages/MyBelongings";
import FeedbackPage from "./pages/FeedbackPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<StudentDashboard />} />
      <Route path="/register" element={<RegisterItem />} />
      <Route path="/belongings" element={<MyBelongings />} />
      <Route path="/feedback" element={<FeedbackPage />} />
    </Routes>
  );
}

export default App;