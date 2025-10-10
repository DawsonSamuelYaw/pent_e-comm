// src/components/Cart.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Info } from '../context/info';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Star, Tag, Heart, Plus, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Cart = () => {
  const { cart, handlesubmitCart } = useContext(Info);
  const [products, setProducts] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status with backend
  const checkAuth = async () => {
    setAuthLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
        method: 'GET',
        credentials: 'include', // Important: includes cookies in request
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(data.isAuthenticated || false);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
    } finally {
      setAuthLoading(false);
    }
  };

  // Check authentication on mount and location change
  useEffect(() => {
    checkAuth();
  }, [location]);

  // Fetch products from local server
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("❌ Failed to fetch products:", err);
        Swal.fire("Error", "Failed to fetch products from server", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Handle checkout click with real-time auth check
  const handleProceedToCheckout = async () => {
    // Show loading
    Swal.fire({
      title: 'Checking authentication...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Check authentication status in real-time
      const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      Swal.close();

      if (data.isAuthenticated) {
        // User is authenticated, proceed to checkout
        navigate("/checkout");
      } else {
        // User is not authenticated, show login prompt
        Swal.fire({
          icon: 'warning',
          title: 'Login Required',
          text: 'You must log in before proceeding to checkout.',
          showCancelButton: true,
          confirmButtonText: 'Login Now',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#dc2626',
          background: '#ffffff',
          borderRadius: '16px',
          customClass: {
            popup: 'shadow-2xl',
            confirmButton: 'rounded-lg px-6 py-3',
            cancelButton: 'rounded-lg px-6 py-3'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            // Store intended destination
            sessionStorage.setItem("redirectAfterLogin", "/checkout");
            navigate("/login");
          }
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      Swal.close();
      
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Unable to verify authentication. Please try again.',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // Get product image (local server)
  const getImageUrl = (product) => {
    if (product.img) return `${API_BASE_URL}${product.img}`;
    if (product.images && product.images.length > 0) return `${API_BASE_URL}${product.images[0]}`;
    return "/placeholder.jpg";
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen font-[poppins] bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-red-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gradient-to-r from-red-500 to-pink-500 border-t-transparent mx-auto mb-6 shadow-lg"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-2 border-red-300 mx-auto opacity-20"></div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
            <p className="text-gray-700 text-xl font-semibold mb-2">Loading amazing deals...</p>
            <p className="text-gray-500 text-sm">Preparing the best offers for you</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 font-sans relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-96 h-96 bg-gradient-to-br from-red-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-4 w-72 h-72 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative bg-gradient-to-r from-red-600 via-red-700 to-pink-600 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          <div className="w-full h-full bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:30px_30px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-white/20 backdrop-blur-lg p-4 rounded-2xl border border-white/20 shadow-lg group hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-10 h-10 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-red-100 bg-clip-text">
                  Today's Deals
                </h1>
                <p className="text-red-100 text-lg sm:text-xl flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Discover amazing products at unbeatable prices</span>
                </p>
              </div>
            </div>
            
            {cart.length > 0 && (
              <div className="hidden sm:flex items-center space-x-4 bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/20 shadow-lg hover:bg-white/25 transition-colors duration-300">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-red-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                    {cart.length}
                  </div>
                </div>
                <span className="font-semibold text-lg">{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 lg:p-12 relative z-10">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-16 shadow-2xl max-w-lg mx-auto border border-white/50">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Tag className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No products available</h3>
              <p className="text-gray-500 text-lg">Check back later for amazing deals!</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {products.map((info) => (
              <div
                key={info.id}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer overflow-hidden border border-white/50 hover:border-red-200 relative"
                onClick={() => navigate(`/product/${info.id}`)}
                onMouseEnter={() => setHoveredProduct(info.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-red-500/10 group-hover:via-pink-500/5 group-hover:to-purple-500/10 rounded-2xl transition-all duration-500"></div>
                
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img
                    src={getImageUrl(info)}
                    alt={info.name}
                    className="w-full h-36 sm:h-40 object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = "/placeholder.jpg";
                    }}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <button 
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 shadow-lg"
                    onClick={e => e.stopPropagation()}
                  >
                    <Heart className="w-4 h-4 text-gray-600 hover:text-red-500 transition-colors duration-200" />
                  </button>

                  <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <button className="w-full bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-semibold py-2 rounded-lg hover:bg-white transition-colors duration-200 shadow-lg">
                      Quick View
                    </button>
                  </div>
                </div>

                <div className="p-4 relative z-10">
                  <h2 className="text-sm font-bold mb-2 line-clamp-2 text-gray-800 group-hover:text-red-600 transition-colors duration-300 leading-tight">
                    {info.name}
                  </h2>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className="w-3 h-3 fill-amber-400 text-amber-400 drop-shadow-sm" 
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-2 font-medium">(4.8)</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-green-600 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <div className="flex items-baseline space-x-2">
                        <p className="text-lg font-black text-red-600 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text">
                          GH¢{info.price}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    className="w-full bg-gradient-to-r from-red-600 via-red-700 to-pink-600 text-white text-sm px-4 py-3 rounded-xl hover:from-red-700 hover:via-red-800 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden group/btn"
                    onClick={e => {
                      e.stopPropagation();
                      handlesubmitCart(info);
                      Swal.fire({
                        icon: "success",
                        title: "Added to Cart",
                        text: `${info.name} has been added to your cart`,
                        timer: 1500,
                        showConfirmButton: false,
                        background: '#ffffff',
                        borderRadius: '16px',
                        customClass: {
                          popup: 'shadow-2xl'
                        }
                      });
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                    <Plus className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Add to Cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-white/50 shadow-2xl z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-2xl shadow-lg">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg flex items-center space-x-2">
                      <span>{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</span>
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </p>
                    <p className="text-sm text-gray-500 font-medium">Ready for checkout • Free shipping available</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleProceedToCheckout}
                className="bg-gradient-to-r from-red-600 via-red-700 to-pink-600 text-white px-8 py-4 rounded-2xl hover:from-red-700 hover:via-red-800 hover:to-pink-700 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center space-x-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative z-10">Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      )} */}

      {cart.length > 0 && (
        <div className="sm:hidden fixed top-6 right-4 z-40">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center space-x-3 border border-white/20 backdrop-blur-sm">
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                {cart.length}
              </div>
            </div>
            <span className="text-sm font-semibold">Cart</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;