import React, { useState, useEffect } from "react";
import { 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiRefreshCw, 
  FiEye, 
  FiUser, 
  FiDollarSign,
  FiPackage,
  FiCalendar,
  FiTrendingUp,
  FiX
} from "react-icons/fi";

const OrdersSection = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updating, setUpdating] = useState({}); // Track which orders are being updated
const API_BASE_URL =   import.meta.env.VITE_API_URL || "http://localhost:5000"; 
  const statusOptions = ["Pending", "Processing", "Delivered", "Cancelled"];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors
      
      console.log("🔄 Fetching orders...");
      const res = await fetch(`${API_BASE_URL}/api/orders`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const ordersData = Array.isArray(data) ? data : [];
      
      console.log(`✅ Fetched ${ordersData.length} orders`);
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      setError(`Failed to load orders: ${err.message}`);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.userEmail?.toLowerCase().includes(searchLower) ||
        order.reference?.toLowerCase().includes(searchLower) ||
        order._id?.toLowerCase().includes(searchLower) ||
        order.id?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
        case "oldest":
          return new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0);
        case "amount-high":
          return (b.amount || 0) - (a.amount || 0);
        case "amount-low":
          return (a.amount || 0) - (b.amount || 0);
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, sortBy]);

  const handleStatusChange = async (orderId, newStatus) => {
    // Prevent multiple simultaneous updates for the same order
    if (updating[orderId]) {
      return;
    }

    try {
      setUpdating(prev => ({ ...prev, [orderId]: true }));
      console.log(`🔄 Updating order ${orderId} status to: ${newStatus}`);
      
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown server error' }));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      const updatedOrder = await res.json();
      console.log(`✅ Order status updated successfully`);
      
      // Update local state immediately to prevent refetching loop
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          const currentOrderId = order._id || order.id;
          const updatedOrderId = updatedOrder._id || updatedOrder.id;
          
          if (currentOrderId === updatedOrderId) {
            return { ...order, status: newStatus, updatedAt: new Date().toISOString() };
          }
          return order;
        })
      );

      // Show success message briefly
      console.log(`✅ Order ${orderId} status updated to ${newStatus}`);

    } catch (err) {
      console.error("❌ Error updating order status:", err);
      alert(`Failed to update status: ${err.message}`);
      
      // Revert the select dropdown to original status if update failed
      const originalOrder = orders.find(o => (o._id || o.id) === orderId);
      if (originalOrder) {
        // Force re-render by updating the key or triggering a state change
        setOrders(prev => [...prev]);
      }
    } finally {
      setUpdating(prev => {
        const newUpdating = { ...prev };
        delete newUpdating[orderId];
        return newUpdating;
      });
    }
  };

  const getStatusBadge = (status) => {
    const base = "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1";
    switch (status?.toLowerCase()) {
      case "pending":
        return <span className={`${base} bg-yellow-100 text-yellow-800`}>⏳ Pending</span>;
      case "processing":
        return <span className={`${base} bg-blue-100 text-blue-800`}>⚡ Processing</span>;
      case "delivered":
        return <span className={`${base} bg-green-100 text-green-800`}>✅ Delivered</span>;
      case "cancelled":
        return <span className={`${base} bg-red-100 text-red-800`}>❌ Cancelled</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-800`}>❓ {status || "Unknown"}</span>;
    }
  };

  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.status?.toLowerCase() === 'pending').length;
    const delivered = orders.filter(o => o.status?.toLowerCase() === 'delivered').length;
    const totalRevenue = orders
      .filter(o => o.status?.toLowerCase() === 'delivered')
      .reduce((sum, o) => sum + (o.amount || 0), 0);

    return { total, pending, delivered, totalRevenue };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        <span className="ml-4 text-gray-600">Loading orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-lg font-medium mb-2">⚠️ Error</div>
        <p className="text-red-700 mb-4">{error}</p>
        <button 
          onClick={fetchOrders}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
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
              <p className="text-gray-600 text-sm font-medium">Total Orders</p>
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
              <p className="text-gray-600 text-sm font-medium">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600">
              <FiCalendar className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Delivered Orders</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.delivered}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
              <FiTrendingUp className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">₵{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600">
              <FiDollarSign className="text-white text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Orders Panel */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800">Orders Management</h2>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status.toLowerCase()}>{status}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Highest Amount</option>
                <option value="amount-low">Lowest Amount</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                disabled={loading}
              >
                <FiRefreshCw className={`text-sm ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg">No orders found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Orders will appear here when customers make purchases"
                }
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Order ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Products</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const orderId = order._id || order.id;
                  return (
                    <tr key={orderId} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-800">
                          #{orderId?.slice(-8).toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.reference}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <FiUser className="text-white text-sm" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {order.userEmail?.split('@')[0] || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.userEmail || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-lg text-gray-800">
                          ₵{(order.amount || 0).toFixed(2)}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="max-w-xs">
                          {order.products?.slice(0, 2).map((p, index) => (
                            <div key={`${orderId}-${index}`} className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">{p.name || 'Unknown Product'}</span>
                              <span className="text-gray-400"> × {p.quantity || 1}</span>
                            </div>
                          ))}
                          {(order.products?.length || 0) > 2 && (
                            <div className="text-xs text-gray-400">
                              +{order.products.length - 2} more items
                            </div>
                          )}
                          {!order.products?.length && (
                            <div className="text-sm text-gray-400">No products</div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          {getStatusBadge(order.status)}
                          <select
                            value={order.status || "Pending"}
                            onChange={(e) => handleStatusChange(orderId, e.target.value)}
                            disabled={updating[orderId]}
                            className="block w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          {updating[orderId] && (
                            <div className="text-xs text-blue-600 flex items-center gap-1">
                              <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              Updating...
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          {formatDate(order.createdAt || order.date)}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Order Details</h3>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Order ID:</span> #{(selectedOrder._id || selectedOrder.id)?.slice(-8).toUpperCase()}</div>
                    <div><span className="text-gray-500">Reference:</span> {selectedOrder.reference || 'N/A'}</div>
                    <div><span className="text-gray-500">Amount:</span> ₵{(selectedOrder.amount || 0).toFixed(2)}</div>
                    <div><span className="text-gray-500">Status:</span> {getStatusBadge(selectedOrder.status)}</div>
                    <div><span className="text-gray-500">Date:</span> {formatDate(selectedOrder.createdAt || selectedOrder.date)}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Email:</span> {selectedOrder.userEmail || 'N/A'}</div>
                    <div><span className="text-gray-500">Name:</span> {selectedOrder.userEmail?.split('@')[0] || 'Unknown'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Products Ordered</h4>
                <div className="space-y-3">
                  {selectedOrder.products?.length ? selectedOrder.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">{product.name || 'Unknown Product'}</div>
                        <div className="text-sm text-gray-500">Quantity: {product.quantity || 1}</div>
                        <div className="text-sm text-gray-500">Unit Price: ₵{(product.price || 0).toFixed(2)}</div>
                      </div>
                      <div className="font-semibold text-gray-800">
                        ₵{((product.price || 0) * (product.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-gray-500">
                      No products found for this order
                    </div>
                  )}
                </div>
                
                {selectedOrder.products?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Total Amount:</span>
                      <span className="font-bold text-xl text-gray-800">₵{(selectedOrder.amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersSection;