import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

// 👇 Use environment variable (default to localhost if not set)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/users";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email input, 2: Reset form
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock navigation (replace with React Router's useNavigate in real app)
  const navigate = (path) => {
    console.log(`Navigating to: ${path}`);
    // useNavigate()(path);
  };

  // Password validation rules
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return {
      isValid: minLength && hasUpper && hasLower && hasNumber,
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
    };
  };

  const passwordValidation = validatePassword(newPassword);

  // Step 1: Verify email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email) {
      setError("Email is required.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }), // 👈 lowercase
      });

      const data = await response.json();

      if (data.success) {
        setStep(2);
        setSuccess("Email verified! Please enter your new password.");
      } else {
        setError(data.message || "No account found with this email.");
      }
    } catch (err) {
      console.warn("Backend not available, using localStorage fallback");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      let users = [];
      try {
        users = JSON.parse(localStorage.getItem("users")) || [];
      } catch {
        users = [];
      }

      const userExists = users.some(
        (user) => user.email === email.toLowerCase()
      );

      if (userExists) {
        setStep(2);
        setSuccess("Email verified! Please enter your new password.");
      } else {
        setError("No account found with this email.");
      }
    }

    setLoading(false);
  };

  // Step 2: Reset password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (!passwordValidation.isValid) {
      setError("Please ensure your password meets all requirements.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(), // 👈 lowercase
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setError("");
        setSuccess("Password updated successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.message || "Failed to update password.");
      }
    } catch (err) {
      console.warn("Backend not available, using localStorage fallback");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        let users = JSON.parse(localStorage.getItem("users")) || [];
        const userIndex = users.findIndex(
          (user) => user.email === email.toLowerCase()
        );

        if (userIndex !== -1) {
          users[userIndex].password = newPassword;
          localStorage.setItem("users", JSON.stringify(users));
          setError("");
          setSuccess("Password updated successfully! Redirecting to login...");
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setError("Failed to update password. Please try again.");
        }
      } catch {
        setError("Failed to update password. Please try again.");
      }
    }

    setLoading(false);
  };

  const PasswordRequirement = ({ met, text }) => (
    <div
      className={`flex items-center space-x-2 text-xs ${
        met ? "text-green-600" : "text-gray-400"
      }`}
    >
      {met ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <div className="w-3 h-3 border border-gray-300 rounded-full" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4 font-[Poppins]">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #dc2626 2px, transparent 2px), 
                             radial-gradient(circle at 75% 75%, #dc2626 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl p-8 w-full max-w-md border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {step === 1 ? "Reset Password" : "Create New Password"}
          </h1>
          <p className="text-gray-600 text-sm">
            {step === 1
              ? "Enter your registered email address to continue"
              : "Choose a strong password for your account"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step >= 1
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              1
            </div>
            <div
              className={`w-16 h-1 ${
                step >= 2 ? "bg-red-600" : "bg-gray-200"
              } rounded`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step >= 2
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 text-green-600 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Step 1: Email Input */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              onClick={handleEmailSubmit}
              disabled={loading || !email}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Verifying..." : "Continue"}</span>
            </button>
          </div>
        )}

        {/* Step 2: Password Reset */}
        {step === 2 && (
          <div className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create new password"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {newPassword && (
                <div className="mt-3 space-y-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Password must contain:
                  </p>
                  <PasswordRequirement
                    met={passwordValidation.minLength}
                    text="At least 8 characters"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasUpper}
                    text="One uppercase letter"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasLower}
                    text="One lowercase letter"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasNumber}
                    text="One number"
                  />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                    confirmPassword && newPassword !== confirmPassword
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-red-500"
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-600 text-xs mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handlePasswordReset}
                disabled={
                  loading ||
                  !passwordValidation.isValid ||
                  newPassword !== confirmPassword
                }
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? "Updating..." : "Reset Password"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Back to Login */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-red-600 hover:text-red-700 hover:underline transition-colors font-medium"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
