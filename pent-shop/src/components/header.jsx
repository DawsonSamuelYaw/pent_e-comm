import React, { useContext, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import logo from '../components/final_logo.png';
import { FaHeart, FaSearch, FaUser, FaTruck, FaTags } from 'react-icons/fa';
import { IoMdCart, IoMdClose } from 'react-icons/io';
import { CiLogin } from "react-icons/ci";
import { IoCreateOutline } from "react-icons/io5";
import { MdDashboard, MdLogout } from "react-icons/md";
import { Info } from '../context/info';
import { HiMenu } from 'react-icons/hi';
import axios from 'axios';

const Header = () => {
  const { cart } = useContext(Info);
  const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
const API_BASE_URL =   import.meta.env.VITE_API_URL || "http://localhost:5000"; 
  // Fetch user info from localStorage or backend
  const fetchUser = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (storedUser) {
      setUser(storedUser);
    } else if (token) {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } catch (err) {
        console.error('Error fetching user:', err);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  };

  useEffect(() => {
    fetchUser();

    const handleUserLoggedIn = () => fetchUser();
    window.addEventListener('userLoggedIn', handleUserLoggedIn);

    return () => window.removeEventListener('userLoggedIn', handleUserLoggedIn);
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        Swal.fire({
          title: 'Logged out!',
          text: 'You have been successfully logged out.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          window.location.href = "/login";
        });
      }
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Implement your search logic here
    }
  };

  return (
    <header className="font-[poppins] shadow-lg w-full bg-white z-50 sticky top-0 transition-all duration-300">
      {/* Top bar with gradient */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white text-xs sm:text-sm h-[42px] flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-2">
          <span className="animate-pulse">🎉</span>
          <a href="/" className="hover:underline transition-all duration-200 hover:text-blue-300">
            Welcome to Pent-Shop
          </a>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-xs">
          <div className="flex items-center space-x-2 hover:text-blue-300 transition-colors cursor-pointer">
            <FaTruck className="text-sm" />
            <span>Deliver to 423651</span>
          </div>
          <div className="w-px h-4 bg-gray-400"></div>
          <div className="flex items-center space-x-2 hover:text-blue-300 transition-colors cursor-pointer">
            <FaSearch className="text-sm" />
            <span>Track your order</span>
          </div>
          <div className="w-px h-4 bg-gray-400"></div>
          <div className="flex items-center space-x-2 hover:text-blue-300 transition-colors cursor-pointer">
            <FaTags className="text-sm" />
            <span>All Offers</span>
          </div>
        </div>
      </div>

      {/* Main bar with enhanced styling */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-4 max-w-[1400px] mx-auto gap-4">
        {/* Logo with enhanced hover effect */}
        <div className="w-36 sm:w-40 flex-shrink-0">
          <a href="/" className="block">
            <img 
              src={logo} 
              alt="Pent-Shop Logo" 
              className="w-full h-auto object-contain transition-all duration-300 hover:scale-110 hover:drop-shadow-lg" 
            />
          </a>
        </div>

        {/* Enhanced search bar */}
        <div className="flex-1 w-full sm:w-auto max-w-[600px]">
          <form onSubmit={handleSearch} className="relative">
            <div className={`flex items-center border-2 rounded-full px-4 bg-white transition-all duration-300 ${
              isSearchFocused ? 'border-blue-500 shadow-lg ring-4 ring-blue-100' : 'border-gray-300 shadow-sm hover:border-gray-400'
            }`}>
              <input 
                type="text" 
                placeholder="Search for anything..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full py-3 px-2 outline-none text-sm placeholder-gray-500" 
              />
              <button 
                type="submit"
                className="text-gray-600 hover:text-blue-600 text-lg transition-all duration-200 hover:scale-110 p-1"
              >
                <FaSearch />
              </button>
            </div>
          </form>
        </div>

        {/* Mobile menu icon with animation */}
        <div className="block md:hidden">
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            {showMobileMenu ? <IoMdClose size={26} /> : <HiMenu size={26} />}
          </button>
        </div>

        {/* Enhanced desktop right menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="relative group">
              <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <FaUser className="text-sm" />
                <span className="font-medium">{user.name?.split(' ')[0] || 'Account'}</span>
              </button>
              <div className="absolute invisible opacity-0 group-hover:visible group-hover:opacity-100 right-0 z-50 mt-2 bg-white border border-gray-200 shadow-xl rounded-xl w-56 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-3 bg-gray-50 rounded-t-xl">
                  <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
                <div className="py-2">
                  <a 
                    href="/dashboard" 
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 group"
                  >
                    <MdDashboard className="text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-700">Dashboard</span>
                  </a>
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center space-x-3 w-full text-left px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-red-600 group"
                  >
                    <MdLogout className="group-hover:scale-110 transition-transform" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <a 
                href="/login" 
                className="flex items-center space-x-2 bg-white border-2 border-blue-600 text-blue-600 py-2 px-5 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <span className="font-medium">Login</span>
                <CiLogin className="text-lg" />
              </a>
              <a 
                href="/sign" 
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-5 rounded-full hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <span className="font-medium">Sign Up</span>
                <IoCreateOutline className="text-lg" />
              </a>
            </div>
          )}

          {/* Enhanced cart and wishlist */}
          <div className="flex items-center space-x-3 text-2xl text-gray-700 ml-2">
            <a 
              href="/cart" 
              className="relative p-2 hover:text-blue-600 transition-all duration-200 transform hover:scale-110 hover:bg-blue-50 rounded-full group"
            >
              <IoMdCart />
              {cart?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center animate-pulse shadow-lg">
                  {cart.length > 99 ? '99+' : cart.length}
                </span>
              )}
            </a>
            <a 
              href="#" 
              className="p-2 hover:text-red-500 transition-all duration-200 transform hover:scale-110 hover:bg-red-50 rounded-full"
            >
              <FaHeart />
            </a>
          </div>
        </div>
      </div>

      {/* Enhanced mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg animate-fade-in">
          <div className="px-4 py-4 space-y-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <FaUser className="text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>
                <a 
                  href="/dashboard" 
                  className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <MdDashboard className="text-blue-600" />
                  <span>Dashboard</span>
                </a>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center space-x-3 w-full text-left p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                >
                  <MdLogout />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <a 
                  href="/login" 
                  className="flex items-center justify-center space-x-2 w-full border-2 border-blue-600 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  <span className="font-medium">Login</span>
                  <CiLogin className="text-lg" />
                </a>
                <a 
                  href="/sign" 
                  className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300"
                >
                  <span className="font-medium">Sign Up</span>
                  <IoCreateOutline className="text-lg" />
                </a>
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-200">
              <a 
                href="/cart" 
                className="flex items-center space-x-2 p-3 hover:bg-blue-50 rounded-lg transition-colors relative group"
              >
                <IoMdCart className="text-2xl text-gray-700 group-hover:text-blue-600" />
                <span className="text-sm font-medium">Cart</span>
                {cart?.length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-4 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </a>
              <a 
                href="#" 
                className="flex items-center space-x-2 p-3 hover:bg-red-50 rounded-lg transition-colors group"
              >
                <FaHeart className="text-2xl text-gray-700 group-hover:text-red-500" />
                <span className="text-sm font-medium">Wishlist</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
};

export default Header;