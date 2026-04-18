import { useState } from "react";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

const AUTH_USERS_KEY = "manifest-auth-users";
const AUTH_SESSION_KEY = "manifest-auth-session";

const DRIVER_DASHBOARD_URL = String(import.meta.env.VITE_DRIVER_DASHBOARD_URL || "http://localhost:5174").trim();
const COMPANY_DASHBOARD_URL = String(import.meta.env.VITE_COMPANY_DASHBOARD_URL || "http://localhost:5173").trim();

const seedUsers = [
  {
    fullName: "Driver Demo",
    email: "driver@manifestdrives.com",
    password: "driver123",
    role: "driver",
  },
  {
    fullName: "Company Demo",
    email: "company@manifestdrives.com",
    password: "company123",
    role: "company_manager",
  },
];

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

const RESERVED_EMAIL_ROLE_MAP = {
  "company@manifestdrives.com": "company_manager",
  "driver@manifestdrives.com": "driver",
};

const RESERVED_EMAIL_DASHBOARD_MAP = {
  "company@manifestdrives.com": COMPANY_DASHBOARD_URL,
  "driver@manifestdrives.com": DRIVER_DASHBOARD_URL,
};

const getEffectiveRole = (email, fallbackRole = "company_manager") =>
  RESERVED_EMAIL_ROLE_MAP[normalizeEmail(email)] || (fallbackRole === "driver" ? "driver" : "company_manager");

const getUserKey = (user) => `${normalizeEmail(user.email)}|${getEffectiveRole(user.email, user.role)}`;

const getDashboardUrlByRole = (role) => {
  if (role === "driver") {
    return DRIVER_DASHBOARD_URL;
  }

  return COMPANY_DASHBOARD_URL;
};

const getDashboardUrlByEmailOrRole = (email, role) => {
  const normalizedEmail = normalizeEmail(email);
  return RESERVED_EMAIL_DASHBOARD_MAP[normalizedEmail] || getDashboardUrlByRole(role);
};

const fetchRemoteAuthUsers = async () => {
  try {
    const response = await fetch("/api/auth/users");
    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    if (!Array.isArray(payload?.users)) {
      return [];
    }

    return payload.users;
  } catch {
    return [];
  }
};

const saveRemoteAuthUser = async (user) => {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    return response.ok;
  } catch {
    return false;
  }
};

const getAuthUsers = async () => {
  const merged = new Map();
  seedUsers.forEach((user) => {
    merged.set(getUserKey(user), user);
  });

  const remoteUsers = await fetchRemoteAuthUsers();
  remoteUsers.forEach((user) => {
    if (!user?.email || !user?.password || !user?.role) {
      return;
    }

    merged.set(getUserKey(user), {
      fullName: String(user.fullName || "User").trim(),
      email: normalizeEmail(user.email),
      password: String(user.password),
      role: getEffectiveRole(user.email, user.role),
    });
  });

  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    if (raw) {
      const storedUsers = JSON.parse(raw);
      if (Array.isArray(storedUsers)) {
        storedUsers.forEach((user) => {
          if (!user?.email || !user?.password || !user?.role) {
            return;
          }

          merged.set(getUserKey(user), {
            fullName: String(user.fullName || "User").trim(),
            email: normalizeEmail(user.email),
            password: String(user.password),
            role: getEffectiveRole(user.email, user.role),
          });
        });
      }
    }
  } catch {
    // If local storage parsing fails, continue with seeded users only.
  }

  return Array.from(merged.values());
};

const saveAuthUsers = (users) => {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
};

const saveSessionAndRedirect = (user) => {
  const effectiveRole = getEffectiveRole(user.email, user.role);
  const targetDashboardUrl = getDashboardUrlByEmailOrRole(user.email, effectiveRole);

  localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      fullName: user.fullName,
      email: normalizeEmail(user.email),
      role: effectiveRole,
      loggedInAt: new Date().toISOString(),
    }),
  );

  window.location.assign(targetDashboardUrl);
};

export default function Signup({ onClose, onNavigateToLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("driver");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setAuthError("Please accept the terms to continue signing up.");
      return;
    }

    const users = await getAuthUsers();
    const normalizedSignupEmail = normalizeEmail(email);
    const effectiveSignupRole = getEffectiveRole(normalizedSignupEmail, role);
    const userAlreadyExists = users.some(
      (user) => user.role === effectiveSignupRole && normalizeEmail(user.email) === normalizedSignupEmail,
    );

    if (userAlreadyExists) {
      setAuthError("This email is already registered for the selected role. Please log in.");
      return;
    }

    const newUser = {
      fullName: fullName.trim(),
      email: normalizedSignupEmail,
      password,
      role: effectiveSignupRole,
    };

    const savedRemotely = await saveRemoteAuthUser(newUser);
    if (!savedRemotely) {
      setAuthError("Unable to sync signup with Supabase. Please retry.");
      return;
    }

    saveAuthUsers([newUser, ...users]);
    setAuthError("");
    saveSessionAndRedirect(newUser);
  };

  return (
    <div className="min-h-screen flex overflow-hidden relative">
      {/* Close Button */}
      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.1 }}
        className="fixed top-6 left-6 z-50 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all"
      >
        <ChevronLeft size={24} />
      </motion.button>

      {/* Left Side - Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-6 md:px-16 py-12 overflow-y-auto"
      >
        <div className="max-w-md">
          {/* Logo/Branding */}
          <div className="mb-12">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-3xl font-bebas tracking-wide text-gray-900">
                <span className="text-red-600">L</span>
                <span>ogistics</span>
              </span>
            </div>
            <p className="text-gray-600 font-inter text-sm tracking-wide">Transportation group</p>
          </div>

          {/* Heading */}
          <h1 className="font-bebas text-4xl text-gray-900 mb-8 uppercase tracking-wide">Create Account</h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
                Full Name<span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-sm font-inter text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-600 focus:ring-1 focus:ring-red-200"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
                Email Address<span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                placeholder="john@logistics.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-sm font-inter text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-600 focus:ring-1 focus:ring-red-200"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
                Password<span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-sm font-inter text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-600 focus:ring-1 focus:ring-red-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
                Confirm Password<span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-sm font-inter text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-600 focus:ring-1 focus:ring-red-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-600 hover:text-gray-900"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
                Select Role<span className="text-red-600">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-sm font-inter text-gray-900 outline-none transition focus:border-red-600 focus:ring-1 focus:ring-red-200 appearance-none cursor-pointer bg-white"
                required
              >
                <option value="driver">Driver</option>
                <option value="company_manager">Company Manager</option>
              </select>
            </div>

            {authError ? (
              <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{authError}</p>
            ) : null}

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="agree"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 border border-gray-300 rounded cursor-pointer accent-red-600 mt-1"
              />
              <label htmlFor="agree" className="ml-3 font-inter text-sm text-gray-700 cursor-pointer">
                I agree to the <a href="#" className="text-red-600 hover:text-red-700">Terms & Conditions</a> and <a href="#" className="text-red-600 hover:text-red-700">Privacy Policy</a>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-inter font-semibold py-3 rounded-sm transition-all duration-300 text-lg"
            >
              Sign Up
            </button>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="font-inter text-sm text-gray-700">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-red-600 hover:text-red-700 font-semibold transition"
                >
                  Log In
                </button>
              </p>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Right Side - Truck Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hidden lg:block w-1/2 relative overflow-hidden bg-gray-900"
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/20 z-10" />

        {/* Truck Image */}
        <img 
          src="https://images.unsplash.com/photo-1577720643272-265f434f8fef?w=1200&h=1200&fit=crop" 
          alt="Logistics Truck"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </motion.div>
    </div>
  );
}
