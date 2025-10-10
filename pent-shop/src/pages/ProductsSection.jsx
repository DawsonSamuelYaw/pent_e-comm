import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiImage,
  FiDollarSign,
  FiPackage,
  FiEye,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiUpload,
  FiX,
  FiSave,
  FiRefreshCw,
  FiTrendingUp,
  FiShoppingBag
} from "react-icons/fi";

const API_BASE_URL =   import.meta.env.VITE_API_URL || "http://localhost:5000"; // Backend URL

const ProductsSection = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    colors: "",
    sizes: "",
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error("❌ Failed to fetch products:", err);
      Swal.fire("Error", "Failed to fetch products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply price filter
    if (priceFilter !== "all") {
      filtered = filtered.filter(product => {
        const price = parseFloat(product.price || 0);
        switch (priceFilter) {
          case "under-50":
            return price < 50;
          case "50-100":
            return price >= 50 && price <= 100;
          case "over-100":
            return price > 100;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "price-low":
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        case "price-high":
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case "newest":
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, priceFilter, sortBy]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    
    // Create image previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.description) {
      return Swal.fire("Missing fields", "Please fill all required fields.", "warning");
    }

    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("price", formData.price);
      payload.append("description", formData.description);
      payload.append("colors", formData.colors);
      payload.append("sizes", formData.sizes);
      images.forEach((img) => payload.append("images", img));

      const url = editingProduct 
        ? `${API_BASE_URL}/api/products/${editingProduct._id || editingProduct.id}`
        : `${API_BASE_URL}/api/products`;
      
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: payload,
      });

      const result = await res.json();

      if (res.ok) {
        Swal.fire("Success", `Product ${editingProduct ? 'updated' : 'added'} successfully`, "success");
        resetForm();
        fetchProducts();
      } else {
        Swal.fire("Error", result.message || `Failed to ${editingProduct ? 'update' : 'add'} product`, "error");
      }
    } catch (err) {
      console.error("❌ Failed to save product:", err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      price: product.price || "",
      description: product.description || "",
      colors: Array.isArray(product.colors) ? product.colors.join(", ") : (product.colors || ""),
      sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : (product.sizes || ""),
    });
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the product permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok) {
        Swal.fire("Deleted!", "Product deleted successfully", "success");
        fetchProducts();
      } else {
        Swal.fire("Error", result.message || "Failed to delete product", "error");
      }
    } catch (err) {
      console.error("❌ Failed to delete product:", err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", price: "", description: "", colors: "", sizes: "" });
    setImages([]);
    setImagePreviews([]);
    setShowAddForm(false);
    setEditingProduct(null);
  };

  const getImageUrl = (product) => {
    if (product.images && product.images.length > 0) return `${API_BASE_URL}${product.images[0]}`;
    return "/placeholder.jpg";
  };

  const formatList = (value) => {
    if (!value) return "N/A";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "string") return value;
    return "N/A";
  };

  const getProductStats = () => {
    const total = products.length;
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
    const avgPrice = total > 0 ? totalValue / total : 0;
    const outOfStock = products.filter(p => p.stock === 0 || p.stock === '0').length;

    return { total, totalValue, avgPrice, outOfStock };
  };

  const stats = getProductStats();

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <span className="ml-4 text-gray-600">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Products</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
              <FiPackage className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Value</p>
              <p className="text-2xl font-bold text-green-600 mt-1">₵{stats.totalValue.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
              <FiDollarSign className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Average Price</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">₵{stats.avgPrice.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
              <FiTrendingUp className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Categories</p>
              <p className="text-2xl font-bold text-red-600 mt-1">Active</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600">
              <FiShoppingBag className="text-white text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Products Panel */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800">Products Management</h2>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Price Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
              >
                <option value="all">All Prices</option>
                <option value="under-50">Under ₵50</option>
                <option value="50-100">₵50 - ₵100</option>
                <option value="over-100">Over ₵100</option>
              </select>

              {/* Sort */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 ${viewMode === "grid" ? "bg-red-500 text-white" : "bg-white text-gray-600"} hover:bg-red-50 transition-colors`}
                >
                  <FiGrid />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 ${viewMode === "list" ? "bg-red-500 text-white" : "bg-white text-gray-600"} hover:bg-red-50 transition-colors`}
                >
                  <FiList />
                </button>
              </div>

              {/* Add Product Button */}
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <FiPlus className="text-sm" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        <div className="p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || priceFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Start by adding your first product"
                }
              </p>
              {!searchTerm && priceFilter === "all" && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Add Your First Product
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product._id || product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <div className="relative h-48 bg-gray-100">
                        <img
                          src={getImageUrl(product)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder.jpg";
                          }}
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowProductDetails(true);
                            }}
                            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                            title="View Details"
                          >
                            <FiEye className="text-gray-600" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 truncate">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-red-600">₵{product.price}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <FiEdit3 className="text-xs" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id || product.id)}
                            className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <FiTrash2 className="text-xs" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Product</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Price</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Colors</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Sizes</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product._id || product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <img
                                src={getImageUrl(product)}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.src = "/placeholder.jpg";
                                }}
                              />
                              <div>
                                <div className="font-medium text-gray-800">{product.name}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-lg text-red-600">₵{product.price}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-gray-600">{formatList(product.colors)}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-gray-600">{formatList(product.sizes)}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowProductDetails(true);
                                }}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <FiEye />
                              </button>
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Product"
                              >
                                <FiEdit3 />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product._id || product.id)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Product"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter product name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (₵) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Available Colors
                  </label>
                  <input
                    type="text"
                    name="colors"
                    placeholder="Red, Blue, Green"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                    value={formData.colors}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Available Sizes
                  </label>
                  <input
                    type="text"
                    name="sizes"
                    placeholder="S, M, L, XL"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                    value={formData.sizes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  placeholder="Enter product description..."
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <FiUpload className="mx-auto text-gray-400 text-3xl mb-2" />
                    <p className="text-gray-600">Click to upload images or drag and drop</p>
                    <p className="text-gray-400 text-sm mt-1">PNG, JPG up to 10MB each</p>
                  </label>
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave />
                      {editingProduct ? "Update Product" : "Add Product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Product Details</h3>
              <button
                onClick={() => setShowProductDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Images */}
                <div>
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                    <img
                      src={getImageUrl(selectedProduct)}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.jpg";
                      }}
                    />
                  </div>
                  
                  {/* Additional Images */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.images.slice(1, 5).map((image, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={`${API_BASE_URL}${image}`}
                            alt={`${selectedProduct.name} ${index + 2}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "/placeholder.jpg";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Information */}
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{selectedProduct.name}</h1>
                    <p className="text-3xl font-bold text-red-600">₵{selectedProduct.price}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">{selectedProduct.description}</p>
                  </div>

                  {selectedProduct.colors && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Available Colors</h3>
                      <div className="flex flex-wrap gap-2">
                        {formatList(selectedProduct.colors).split(', ').map((color, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.sizes && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Available Sizes</h3>
                      <div className="flex flex-wrap gap-2">
                        {formatList(selectedProduct.sizes).split(', ').map((size, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Stats */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Product Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Product ID:</span>
                        <p className="font-medium text-gray-800">
                          #{(selectedProduct._id || selectedProduct.id)?.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-medium text-green-600">Active</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <p className="font-medium text-gray-800">
                          {selectedProduct.createdAt 
                            ? new Date(selectedProduct.createdAt).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <p className="font-medium text-gray-800">General</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowProductDetails(false);
                        handleEditProduct(selectedProduct);
                      }}
                      className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiEdit3 />
                      Edit Product
                    </button>
                    <button
                      onClick={() => {
                        setShowProductDetails(false);
                        handleDeleteProduct(selectedProduct._id || selectedProduct.id);
                      }}
                      className="flex-1 bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiTrash2 />
                      Delete Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsSection;