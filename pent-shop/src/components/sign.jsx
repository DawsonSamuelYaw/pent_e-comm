import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock, Chrome, AlertCircle, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

const Sign = () => {
  const navigate = useNavigate();
  const API_BASE_URL =   import.meta.env.VITE_API_URL || "http://localhost:5000"; 
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: "weak", color: "text-red-500", width: "w-1/3" };
    if (password.length < 8) return { strength: "medium", color: "text-yellow-500", width: "w-2/3" };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: "strong", color: "text-green-500", width: "w-full" };
    }
    return { strength: "medium", color: "text-yellow-500", width: "w-2/3" };
  };

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(""); // Clear error when user starts typing
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate required fields
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.password?.trim()) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    // Name validation
    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    // Add loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      console.log("Attempting signup with data:", { 
        name: formData.name.trim(), 
        email: formData.email.trim(),
        password: "[hidden]"
      });

      // Make REAL API call to your backend
      const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies/sessions
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
        }),
      });

      const data = await response.json();
      console.log("Signup response:", data);

      if (response.ok && data.success) {
        // Success - account created
        setError("");
        
        // Show success message with SweetAlert
        Swal.fire({
          title: "Account Created Successfully!",
          text: `Welcome ${formData.name.split(" ")[0]}! Your account has been created. You can now login.`,
          icon: "success",
          confirmButtonText: "Go to Login",
          confirmButtonColor: "#4f46e5",
          timer: 3000,
          timerProgressBar: true,
          showClass: {
            popup: 'animate__animated animate__fadeInUp animate__faster'
          }
        }).then(() => {
          // Reset form
          setFormData({ name: "", email: "", password: "" });
          
          // Redirect to login page
          navigate("/login");
        });
        
      } else {
        // Handle server errors
        const errorMessage = data.message || "Failed to create account. Please try again.";
        setError(errorMessage);
        
        // Show error with SweetAlert
        Swal.fire({
          title: "Signup Failed",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "Try Again",
          confirmButtonColor: "#ef4444"
        });
      }

    } catch (err) {
      console.error("Signup error:", err);
      
      let errorMessage = "Something went wrong. Please try again.";
      
      // Handle specific error types
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = "Unable to connect to server. Please check if the server is running.";
      } else if (err.message.includes('NetworkError')) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      setError(errorMessage);
      
      // Show error with SweetAlert
      Swal.fire({
        title: "Connection Error",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "Retry",
        confirmButtonColor: "#ef4444"
      });
      
      // Shake animation for error
      const form = document.querySelector('.signup-form');
      form?.classList.add('shake');
      setTimeout(() => form?.classList.remove('shake'), 500);
      
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = (provider) => {
    Swal.fire({
      title: "Coming Soon!",
      text: `${provider} signup will be available in the next update.`,
      icon: "info",
      confirmButtonText: "OK",
      confirmButtonColor: "#4f46e5"
    });
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const isFormValid = formData.name.trim() && 
                     formData.email.includes('@') && 
                     formData.password.length >= 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 font-[poppins] relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
        <div className="flex flex-col lg:flex-row">
          
          {/* Left Side - Branding */}
          <div className="lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-8 lg:p-12 flex flex-col justify-center items-center text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-20 translate-y-20"></div>
              <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white rounded-full"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-600">P</span>
                  </div>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">PENT SHOP</h1>
                <p className="text-xl opacity-90 mb-8">Join Our Faith-Based Community</p>
              </div>
              
              <div className="space-y-4 text-left max-w-md">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Spiritual products & resources</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Secure & trusted platform</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>24/7 community support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                <p className="text-gray-600">Join thousands of faith-filled shoppers</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Registration Failed</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              <form className="space-y-6 signup-form" onSubmit={handleSubmit}>
                
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <div className={`relative transition-all duration-300 ${
                    focusedField === 'name' ? 'transform scale-105' : ''
                  }`}>
                    <User className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                      focusedField === 'name' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField('')}
                      className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 outline-none bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <div className={`relative transition-all duration-300 ${
                    focusedField === 'email' ? 'transform scale-105' : ''
                  }`}>
                    <Mail className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                      focusedField === 'email' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 outline-none bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <div className={`relative transition-all duration-300 ${
                    focusedField === 'password' ? 'transform scale-105' : ''
                  }`}>
                    <Lock className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                      focusedField === 'password' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      className="w-full pl-10 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 outline-none bg-gray-50 focus:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.width} ${
                              passwordStrength.strength === 'weak' ? 'bg-red-500' :
                              passwordStrength.strength === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${passwordStrength.color}`}>
                          {passwordStrength.strength}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Password should be at least 8 characters with uppercase, lowercase, and numbers
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 ${
                    loading || !isFormValid
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-gray-500 text-sm">or continue with</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* Google Signup */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 py-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 group"
                onClick={() => handleSocialSignup("Google")}
              >
                <Chrome className="w-5 h-5 text-gray-600 group-hover:text-gray-700" />
                <span className="font-medium text-gray-700">Continue with Google</span>
              </button>

              {/* Footer Links */}
              <div className="mt-8 text-center space-y-4">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <a href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-colors duration-200">
                    Sign in
                  </a>
                </p>
                <a href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors duration-200">
                  Forgot your password?
                </a>
              </div>

              {/* Terms */}
              <p className="mt-8 text-xs text-gray-500 text-center leading-relaxed">
                By creating an account, you agree to our{" "}
                <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
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

export default Sign;