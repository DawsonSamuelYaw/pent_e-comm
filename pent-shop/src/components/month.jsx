import React, { useContext, useEffect, useState } from 'react';
import { Info } from '../context/info';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShoppingCart } from 'lucide-react';
import Swal from 'sweetalert2';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MonthDeals = () => {
  const { handlesubmitCart } = useContext(Info);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        
        // Limit to first 5 products for "September Deals"
        setProducts(data.slice(0, 5));
      } catch (err) {
        console.error("❌ Failed to fetch products:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch products from server",
          confirmButtonColor: '#dc2626',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Get product image URL
  const getImageUrl = (product) => {
    if (product.img) return `${API_BASE_URL}${product.img}`;
    if (product.images && product.images.length > 0) return `${API_BASE_URL}${product.images[0]}`;
    return "/placeholder.jpg";
  };

  // Handle add to cart
  const handleAddToCart = (item) => {
    handlesubmitCart(item);
    Swal.fire({
      icon: "success",
      title: "Added to Cart",
      text: `${item.name} has been added to your cart`,
      timer: 1500,
      showConfirmButton: false,
      background: '#ffffff',
      borderRadius: '16px',
      customClass: {
        popup: 'shadow-2xl'
      }
    });
  };

  if (loading) {
    return (
      <div className="font-[poppins] px-4 sm:px-8 py-8 bg-gray-100">
        <h1 className="border-l-8 border-red-600 pl-4 text-2xl sm:text-3xl font-bold text-red-600 mb-6">
          September Deals
        </h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading deals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="font-[poppins] px-4 sm:px-8 py-8 bg-gray-100">
      {/* Section Header */}
      <h1 className="border-l-8 border-red-600 pl-4 text-2xl sm:text-3xl font-bold text-red-600 mb-6">
        September Deals
      </h1>

      {/* Check if products exist */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg p-8 shadow-md max-w-md mx-auto">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No deals available</h3>
            <p className="text-gray-500">Check back later for amazing deals!</p>
          </div>
        </div>
      ) : (
        /* Horizontal Scrollable Products */
        <div className="flex overflow-x-auto gap-5 pb-4 no-scrollbar">
          {products.map((item) => (
            <div
              key={item.id}
              className="min-w-[160px] max-w-[180px] sm:min-w-[200px] sm:max-w-[220px] bg-white p-4 rounded-lg shadow hover:shadow-md transition-all text-center cursor-pointer"
              onClick={() => navigate(`/product/${item.id}`)}
            >
              <img
                src={getImageUrl(item)}
                alt={item.name}
                className="w-full h-32 sm:h-40 object-cover rounded-md mb-3"
                onError={(e) => {
                  e.target.src = "/placeholder.jpg";
                }}
              />
              <h2 className="text-sm font-semibold mb-1 truncate">{item.name}</h2>
              <p className="text-xs text-gray-600 mb-3">GH¢{item.price}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent navigation when clicking add to cart
                  handleAddToCart(item);
                }}
                className="bg-red-600 text-white text-xs px-4 py-1.5 rounded hover:bg-red-700 transition"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthDeals;