import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { 
  FaEye, 
  FaEyeSlash, 
  FaEnvelope, 
  FaLock, 
  FaUser,
  FaGoogle,
  FaFacebook,
  FaApple,
  FaShieldAlt,
  FaArrowRight
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { MdSecurity } from "react-icons/md";

const log = "/imgs/image 55.png";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    setIsFormValid(formData.email.includes('@') && formData.password.length >= 6);
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError("Both email and password are required");
      setLoading(false);
      return;
    }

    // Add loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/login",
        {
          email: formData.email.trim(),
          password: formData.password.trim(),
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      console.log("Login response:", res.data);

      // Save user info
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }

      // Notify other components
      window.dispatchEvent(new Event("userLoggedIn"));

      Swal.fire({
        title: "Welcome Back! 🎉",
        text: `Hello ${res.data.user.name?.split(" ")[0] || "User"}! You've successfully logged in.`,
        icon: "success",
        confirmButtonText: "Continue",
        confirmButtonColor: "#10b981",
        timer: 2000,
        timerProgressBar: true,
        showClass: {
          popup: 'animate__animated animate__fadeInUp animate__faster'
        }
      }).then(() => navigate("/"));
    } catch (err) {
      console.error("Login error (frontend):", err);

      let errorMessage = "An unexpected error occurred";
      if (err.response) {
        errorMessage = err.response.data?.message || "Invalid credentials. Please try again.";
      } else if (err.request) {
        errorMessage = "Unable to connect to server. Please check your connection.";
      }

      setError(errorMessage);
      
      // Shake animation for error
      const form = document.querySelector('.login-form');
      form?.classList.add('shake');
      setTimeout(() => form?.classList.remove('shake'), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    // Implement social login logic here
  };

  return (
    <div className="min-h-screen font-[Poppins] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex shadow-2xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur-sm border border-white/20 max-w-5xl w-full">
        
        {/* Left Side - Image & Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <img 
            src={log} 
            alt="Login Illustration" 
            className="w-full h-full object-cover opacity-80"
          />
          
          {/* Overlay Content */}
          <div className="absolute inset-0 p-12 flex flex-col justify-between text-white">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <HiSparkles className="text-2xl text-white" />
                </div>
                <h2 className="text-3xl font-bold">PENT SHOP</h2>
              </div>
              <h3 className="text-4xl font-bold mb-4 leading-tight">
                Welcome Back to Our Community
              </h3>
              <p className="text-lg text-white/90 leading-relaxed">
                Join thousands of members in our faith-based marketplace. Shop with purpose, connect with community.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white/90">
                <FaShieldAlt className="text-xl" />
                <span>Secure & Trusted Platform</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <MdSecurity className="text-xl" />
                <span>Your Data is Protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12">
          <div className="max-w-md mx-auto space-y-8">
            
            {/* Header */}
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
                  <FaUser className="text-2xl text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Welcome Back
                </h1>
                <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 animate-fadeIn">
                <div className="p-2 bg-red-100 rounded-full">
                  <MdSecurity className="text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Authentication Failed</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6 login-form" onSubmit={handleSubmit}>
              
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <div className={`relative transition-all duration-300 ${
                  focusedField === 'email' ? 'transform scale-105' : ''
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaEnvelope className={`text-lg transition-colors duration-300 ${
                      focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className={`relative transition-all duration-300 ${
                  focusedField === 'password' ? 'transform scale-105' : ''
                }`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className={`text-lg transition-colors duration-300 ${
                      focusedField === 'password' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none bg-gray-50 focus:bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                    Remember me
                  </span>
                </label>
                <a 
                  href="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all duration-200"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 ${
                  loading || !isFormValid
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Signing you in...
                  </>
                ) : (
                  <>
                    Sign In
                    <FaArrowRight className="text-sm" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { Icon: FaGoogle, name: "Google", color: "hover:bg-red-50 hover:text-red-600 hover:border-red-200" },
                { Icon: FaFacebook, name: "Facebook", color: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" },
                { Icon: FaApple, name: "Apple", color: "hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300" }
              ].map(({ Icon, name, color }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSocialLogin(name)}
                  className={`p-4 border-2 border-gray-200 rounded-xl transition-all duration-300 transform hover:scale-105 ${color}`}
                >
                  <Icon className="text-xl mx-auto" />
                </button>
              ))}
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <a 
                  href="/sign" 
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-all duration-200"
                >
                  Create Account
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

          <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;