import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { User, Package, Calendar, CreditCard, ShoppingBag, Edit3, Save, X } from 'lucide-react';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    // Check multiple possible localStorage keys for user data
    let loggedInUser = null;
    let userDataString = null;

    // Try different possible keys
    const possibleKeys = ['user', 'loggedInUser', 'currentUser', 'authUser'];
    
    for (const key of possibleKeys) {
      userDataString = localStorage.getItem(key);
      if (userDataString && userDataString !== 'null' && userDataString !== 'undefined') {
        try {
          loggedInUser = JSON.parse(userDataString);
          if (loggedInUser && (loggedInUser.email || loggedInUser.username)) {
            console.log(`Found user data in localStorage key: ${key}`, loggedInUser);
            break;
          }
        } catch (error) {
          console.error(`Error parsing user data from ${key}:`, error);
        }
      }
    }

    if (!loggedInUser || !(loggedInUser.email || loggedInUser.username)) {
      console.log('No valid user found in localStorage, redirecting to login');
      navigate('/login');
      return;
    }

    // Set user data immediately
    setUser(loggedInUser);
    setFormData({
      name: loggedInUser.name || loggedInUser.username || '',
      email: loggedInUser.email || '',
    });
    setLoading(false);

    // Fetch user orders using email or username as identifier
    const userIdentifier = loggedInUser.email || loggedInUser.username;
    if (userIdentifier) {
      fetchUserOrders(userIdentifier);
    } else {
      setOrdersLoading(false);
    }
  }, [navigate]);

  const fetchUserOrders = async (userIdentifier) => {
    try {
      setOrdersLoading(true);
      console.log('Fetching orders for user:', userIdentifier);
      
      const response = await fetch('http://localhost:5000/api/orders');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }
      
      const allOrders = await response.json();
      console.log('All orders received:', allOrders);
      
      // Filter orders for the current user (case-insensitive)
      // Check multiple possible fields where user identifier might be stored
      const userOrders = Array.isArray(allOrders) 
        ? allOrders.filter(order => {
            const orderEmail = order.userEmail || order.email || order.user?.email;
            const orderUsername = order.username || order.user?.username || order.user?.name;
            const orderUserId = order.userId || order.user?.id || order.user?._id;
            
            // Check if any of the order identifiers match the current user
            return (
              (orderEmail && orderEmail.toLowerCase() === userIdentifier.toLowerCase()) ||
              (orderUsername && orderUsername.toLowerCase() === userIdentifier.toLowerCase()) ||
              (orderUserId && orderUserId.toString() === userIdentifier.toString())
            );
          })
        : [];
      
      console.log(`Filtered orders for ${userIdentifier}:`, userOrders);
      
      // Sort orders by creation date (newest first)
      userOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || a.orderDate || 0);
        const dateB = new Date(b.createdAt || b.date || b.orderDate || 0);
        return dateB - dateA;
      });
      
      setOrders(userOrders);
      
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      
      // Show error message to user only if it's a network error
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        Swal.fire({
          title: 'Connection Error',
          text: 'Unable to load order history. Please check your internet connection and try again.',
          icon: 'warning',
          confirmButtonColor: '#dc2626',
        });
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      // Basic validation
      if (!formData.name.trim()) {
        Swal.fire({
          title: 'Error!',
          text: 'Name cannot be empty.',
          icon: 'error',
          confirmButtonColor: '#dc2626',
        });
        return;
      }

      if (!formData.email.trim()) {
        Swal.fire({
          title: 'Error!',
          text: 'Email cannot be empty.',
          icon: 'error',
          confirmButtonColor: '#dc2626',
        });
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        Swal.fire({
          title: 'Error!',
          text: 'Please enter a valid email address.',
          icon: 'error',
          confirmButtonColor: '#dc2626',
        });
        return;
      }

      const updatedUser = {
        ...user,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        updatedAt: new Date().toISOString()
      };

      // Update localStorage with new data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Also update other possible keys to ensure consistency
      localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));

      setUser(updatedUser);
      setEditMode(false);

      Swal.fire({
        title: 'Updated!',
        text: 'Your profile has been updated successfully.',
        icon: 'success',
        confirmButtonColor: '#dc2626',
      });

      // If email changed, refetch orders
      if (user.email !== formData.email.trim().toLowerCase()) {
        fetchUserOrders(formData.email.trim().toLowerCase());
      }

    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update profile. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, logout!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear all possible user data keys
        const userKeys = ['user', 'loggedInUser', 'currentUser', 'authUser', 'userToken'];
        userKeys.forEach(key => localStorage.removeItem(key));
        
        navigate('/login');
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    });
  };

  const refreshOrders = () => {
    if (user?.email || user?.username) {
      const userIdentifier = user.email || user.username;
      fetchUserOrders(userIdentifier);
    }
  };

  // Show loading state
  if (loading || !user) {
    return (
      <div className="font-[poppins] min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-[poppins] min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-red-600 p-3 rounded-full">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
                <p className="text-gray-600 mt-1">{user.name || user.username || 'User'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <User className="w-6 h-6 mr-2 text-red-600" />
                  Profile
                </h2>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors duration-200"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {!editMode ? (
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-red-50 p-2 rounded-lg">
                      <User className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="text-gray-900 font-medium">{user.name || user.username || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-red-50 p-2 rounded-lg">
                      <CreditCard className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="text-gray-900 font-medium break-words">{user.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-red-50 p-2 rounded-lg">
                      <Calendar className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="text-gray-900 font-medium">
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          name: user.name || user.username || '',
                          email: user.email || '',
                        });
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Orders Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                    <Package className="w-6 h-6 mr-2 text-red-600" />
                    Order History
                    {orders.length > 0 && (
                      <span className="ml-2 bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full">
                        {orders.length}
                      </span>
                    )}
                  </h2>
                  <button
                    onClick={refreshOrders}
                    disabled={ordersLoading}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 transition-colors duration-200"
                  >
                    {ordersLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              <div className="p-6">
                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchases Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Hey {user.name?.split(' ')[0] || user.username || 'there'}! You haven't made any purchases yet. 
                      <br />Start shopping to see your order history here!
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {orders.map((order, index) => (
                      <div 
                        key={order._id || order.id || index} 
                        className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 bg-gray-50/50"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                Order #{order.reference || order._id?.slice(-8) || `ORD-${index + 1}`}
                              </h3>
                              <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusColor(order.status)}`}>
                                {order.status || 'Pending'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(order.createdAt || order.date || order.orderDate || Date.now()).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-600">
                              {formatCurrency(order.amount || order.total || order.totalAmount || 0)}
                            </p>
                          </div>
                        </div>

                        {((order.products && order.products.length > 0) || (order.items && order.items.length > 0)) && (
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <Package className="w-4 h-4 mr-1" />
                              Order Items:
                            </p>
                            <div className="grid gap-2">
                              {(order.products || order.items || []).map((item, itemIndex) => (
                                <div key={itemIndex} className="flex justify-between items-center bg-white p-3 rounded border">
                                  <div>
                                    <p className="font-medium text-gray-900">{item.name || item.title}</p>
                                    <p className="text-sm text-gray-600">
                                      {formatCurrency(item.price)} × {item.quantity || 1}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-gray-900">
                                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;