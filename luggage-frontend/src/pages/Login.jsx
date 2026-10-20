import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    // Admin login
    if (email.toLowerCase().includes("admin")) {
      navigate("/admin/dashboard");
    } else {
      // Operator login
      navigate("/operator/dashboard");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center relative px-4"
      style={{
        backgroundImage: "url('/college.jpeg')",
      }}
    >
      {/* Dark background overlay */}
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"></div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">

        {/* Logo and title */}
        <div className="text-center mb-6">

          <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl">
            <BriefcaseBusiness
              size={42}
              className="text-white"
            />
          </div>

          <h1 className="text-3xl font-bold text-white mt-4">
            Luggage Room
          </h1>

          <p className="text-blue-200 mt-1">
            QR Management System
          </p>

        </div>

        {/* Login card */}
        <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">

          <h2 className="text-2xl font-bold text-white">
            Welcome Back
          </h2>

          <p className="text-slate-400 mt-1 mb-7">
            Login to access the system
          </p>

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email
              </label>

              <div className="relative">

                <Mail
                  size={19}
                  className="absolute left-4 top-3.5 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-lg py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500"
                />

              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>

              <div className="relative">

                <Lock
                  size={19}
                  className="absolute left-4 top-3.5 text-slate-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-lg py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500"
                />

              </div>
            </div>

            {/* Login */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              Login
              <ArrowRight size={18} />
            </button>

          </form>

          {/* Demo information */}
          <div className="bg-blue-900/40 border border-blue-800/50 rounded-lg p-4 mt-6">

            <p className="text-blue-300 font-semibold">
              Demo Login
            </p>

            <p className="text-blue-200 text-sm mt-1">
              Use any email for Operator.
            </p>

            <p className="text-blue-200 text-sm">
              Include "admin" in email for Admin.
            </p>

          </div>

          {/* Student Login */}
          <button
            onClick={() => navigate("/student/login")}
            className="w-full text-slate-400 hover:text-white text-sm mt-6"
          >
            Student Login
          </button>

        </div>
      </div>
    </div>
  );
}