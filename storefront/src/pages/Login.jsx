import { useState } from "react";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import truckImage from "../assets/auth/caleb-ruiter-EmEQ6kK_5P0-unsplash.jpg";

export default function Login({ onClose, onNavigateToSignup }) {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("driver");
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log("Login", { email, password, rememberMe });
    setEmail("");
    setPassword("");
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Sign up", { fullName, email, password, agreeTerms });
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAgreeTerms(false);
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

      {/* Left Side - Truck Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hidden lg:block w-1/2 relative overflow-hidden bg-gray-900"
      >

        {/* Truck Image */}
        <img 
          src={truckImage} 
          alt="Logistics Truck"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center px-6 md:px-12 py-12 overflow-y-auto relative"
      >
        {/* Fixed Logo/Branding at Top - Center of White Area Only */}
        <div className="fixed top-0 left-0 right-0 lg:left-auto lg:w-1/2 z-30 bg-white px-6 md:px-12 py-6 pt-15 flex justify-center">
          <div className="max-w-sm">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-4xl font-bebas tracking-wide text-gray-900">
                <span className="text-red-600">M</span>
                <span>anifest Drives</span>
              </span>
            </div>
            <p className="text-gray-600 font-inter text-sm tracking-wide">Transportation group</p>
          </div>
        </div>

        <div className="w-full max-w-sm flex flex-col justify-center min-h-screen lg:min-h-auto pt-48 lg:pt-16">
          {/* Heading */}
          <h1 className="font-bebas text-4xl text-gray-900 mb-8 uppercase tracking-wide mt-4">
            {isSignup ? "Create Account" : "Client Login"}
          </h1>

          {/* Form Container */}
          <div className="w-full">
            {/* Login Form */}
            {!isSignup ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
                    Enter Email Address<span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm font-inter text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-red-600 focus:ring-1 focus:ring-red-200"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
                    Enter Password<span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter Password"
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

                {/* Remember Me Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 border border-gray-300 rounded cursor-pointer accent-red-600"
                  />
                  <label htmlFor="remember" className="ml-3 font-inter text-sm text-gray-700 cursor-pointer">
                    Remember Me
                  </label>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-inter font-semibold py-3 rounded-sm transition-all duration-300 text-lg"
                >
                  Log In
                </button>

                {/* Forgot Password Link */}
                <div className="text-center pt-2">
                  <a href="#" className="font-inter text-sm text-gray-700 hover:text-red-600 transition">
                    Forgot Password
                  </a>
                </div>

                {/* Sign Up Link */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="font-inter text-sm text-gray-700">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignup(true);
                        setEmail("");
                        setPassword("");
                        setRole("driver");
                        setRememberMe(false);
                      }}
                      className="text-red-600 hover:text-red-700 font-semibold transition"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              // Signup Form
              <form onSubmit={handleSignupSubmit} className="space-y-5">
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
                    onClick={() => {
                      setIsSignup(false);
                      setFullName("");
                      setEmail("");
                      setPassword("");
                      setConfirmPassword("");
                      setRole("driver");
                      setAgreeTerms(false);
                    }}
                    className="text-red-600 hover:text-red-700 font-semibold transition"
                  >
                    Log In
                  </button>
                </p>
              </div>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
