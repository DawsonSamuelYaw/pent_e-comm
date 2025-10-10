import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Info } from '../context/info';
import { 
  ArrowLeft, 
  Star, 
  ShoppingCart, 
  Heart, 
  Shield, 
  Truck, 
  RotateCcw,
  Check,
  Plus,
  Minus
} from 'lucide-react';
import Swal from 'sweetalert2';

const API_BASE_URL =   import.meta.env.VITE_API_URL || "http://localhost:5000";  // Backend URL

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handlesubmitCart } = useContext(Info);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

   useEffect(() => {
  const fetchProduct = async () => {
    try {
      console.log("Looking for product with ID:", id);
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Product not found");
        }
        throw new Error(`Failed to fetch product (status ${res.status})`);
      }
      const product = await res.json();
      setProduct(product);
      setSelectedImage(product.images?.[0] || product.img);
    } catch (err) {
      console.error("Error details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchProduct();
}, [id]);

  const handleAddToCart = () => {
    if ((product.colors?.length > 0 && !selectedColor) || (product.sizes?.length > 0 && !selectedSize)) {
      Swal.fire('Select Options', 'Please select a color and size before adding to cart.', 'warning');
      return;
    }
    handlesubmitCart({
      ...product,
      selectedColor,
      selectedSize,
      quantity
    });
    Swal.fire('Added', `${quantity} item(s) added to cart!`, 'success');
  };

  const getImageUrl = (img) => {
    if (!img) return "/placeholder.jpg";
    return img.startsWith('/uploads') ? `${API_BASE_URL}${img}` : img;
  };

  const handleQuantityChange = (action) => {
    if (action === 'increase') {
      setQuantity(prev => prev + 1);
    } else if (action === 'decrease' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center font-[poppins]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center font-[poppins]">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 mb-4 text-lg font-semibold">Error: {error}</p>
          <button 
            onClick={() => navigate('/carts')} 
            className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-300 font-semibold"
          >
            Go back to products
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center font-[poppins]">
        <p className="text-gray-600 text-lg">No product found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-[poppins]">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-300 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">Back to Products</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left - Image Gallery */}
            <div className="p-8 bg-gray-50">
              <div className="sticky top-8">
                {/* Main Product Image */}
                <div className="relative mb-6 group">
                  <img
                    src={getImageUrl(selectedImage)}
                    alt={product.name}
                    className="w-full h-96 object-cover rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  />
                  
                  {/* Wishlist Button */}
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 group"
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'} group-hover:scale-110 transition-transform duration-300`} />
                  </button>

                  {/* Sale Badge */}
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    25% OFF
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {(product.images || [product.img]).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(img)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-3 transition-all duration-300 ${
                        selectedImage === img 
                          ? 'border-red-500 ring-2 ring-red-200' 
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`Thumbnail ${index}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Product Info */}
            <div className="p-8 flex flex-col">
              <div className="flex-1">
                {/* Product Title & Rating */}
                <div className="mb-6">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                    {product.name}
                  </h1>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="ml-2 text-gray-600 font-medium">(4.8)</span>
                    </div>
                    <span className="text-green-600 font-medium">In Stock</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline space-x-4 mb-6">
                    <span className="text-4xl font-bold text-red-600">GH¢{product.price}</span>
                    <span className="text-xl text-gray-500 line-through">GH¢{(product.price * 1.33).toFixed(2)}</span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Save 25%
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description || "Experience premium quality with this amazing product. Designed with attention to detail and crafted for excellence, this item will exceed your expectations and deliver outstanding performance."}
                  </p>
                </div>

                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Color</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((color, idx) => (
                        <button
                          key={idx}
                          className={`px-6 py-3 rounded-xl border-2 font-medium transition-all duration-300 ${
                            selectedColor === color 
                              ? 'border-red-500 bg-red-50 text-red-700 shadow-lg' 
                              : 'border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                          }`}
                          onClick={() => setSelectedColor(color)}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Size</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.sizes.map((size, idx) => (
                        <button
                          key={idx}
                          className={`px-6 py-3 rounded-xl border-2 font-medium transition-all duration-300 ${
                            selectedSize === size 
                              ? 'border-red-500 bg-red-50 text-red-700 shadow-lg' 
                              : 'border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                          }`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Quantity</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border-2 border-gray-200 rounded-xl">
                      <button
                        onClick={() => handleQuantityChange('decrease')}
                        className="p-3 hover:bg-gray-100 transition-colors duration-300 rounded-l-xl"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-6 py-3 font-semibold text-lg">{quantity}</span>
                      <button
                        onClick={() => handleQuantityChange('increase')}
                        className="p-3 hover:bg-gray-100 transition-colors duration-300 rounded-r-xl"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center justify-center space-x-3 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart - GH¢{(product.price * quantity).toFixed(2)}</span>
                </button>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                  <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl">
                    <Truck className="w-6 h-6 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Free Shipping</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl">
                    <RotateCcw className="w-6 h-6 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Easy Returns</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl">
                    <Shield className="w-6 h-6 text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">2 Year Warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;