import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Shield, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Pent from '../components/final_logo.png';
const API_BASE_URL =   import.meta.env.VITE_API_URL || "http://localhost:5000"; 
const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/login`,
        {
          email: form.email.trim(),
          password: form.password.trim(),
        },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );

      if (res.data.success) {
        const admin = res.data.admin || { name: 'Admin' };

        // Store admin info
        localStorage.setItem('adminToken', res.data.token || 'admintoken');
        localStorage.setItem('adminUser', JSON.stringify(admin));
        localStorage.setItem('adminLoggedIn', 'true');

        window.dispatchEvent(new Event('adminLoggedIn'));

        await Swal.fire({
          icon: 'success',
          title: `Welcome ${admin.name}!`,
          text: 'Login successful',
          confirmButtonColor: '#d33',
        });

        // Redirect to admin dashboard
        navigate('/admin', { replace: true });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: res.data.message || 'Invalid credentials',
          confirmButtonColor: '#d33',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.response?.data?.message || 'Server error or invalid credentials',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 font-[poppins] px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-72 h-72 bg-red-600 rounded-full -translate-x-36 -translate-y-36"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600 rounded-full translate-x-48 translate-y-48"></div>
      </div>

      {/* Logo Section */}
      <div className="flex justify-center mb-8 relative z-10">
        <img src={Pent} alt="Logo" className="w-80 object-contain drop-shadow-2xl" />
      </div>

      {/* Login Form */}
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl border border-gray-100 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Admin Login</h2>
          <p className="text-gray-500 text-sm">
            Secure access to administrative panel
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Admin Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="email"
                name="email"
                placeholder="Enter admin email"
                value={form.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Additional Options */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" className="rounded border-gray-300" />
              Remember me
            </label>
            <a href="#" className="text-red-600 hover:text-red-700 font-medium">
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Authenticating...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                Secure Login
              </div>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700 text-center">
            <Shield className="w-3 h-3 inline mr-1" />
            This is a secure admin area. All activities are monitored.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center relative z-10">
        <p className="text-xs text-gray-500">
          Need help? Contact{" "}
          <a href="mailto:support@pentshop.com" className="text-red-600 hover:underline">
            IT Support
          </a>
        </p>
        <p className="mt-2 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Pentecost E-Commerce Platform
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
