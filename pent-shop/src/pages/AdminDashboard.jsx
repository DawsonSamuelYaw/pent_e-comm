import React, { useState, useEffect } from "react";
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiBarChart2,
  FiBell,
  FiSettings,
  FiLogOut,
  FiEdit3,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiWifi,
  FiWifiOff,
} from "react-icons/fi";

import OrdersSection from "./OrdersSection";
import ProductsSection from "./ProductsSection";
import SpiritualSubmissions from "../components/SpiritualSubmissions";
import ContentManagementSystem from "./ContentManagementSystem";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [adminName] = useState(localStorage.getItem("adminName") || "Admin");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newSubmissionsCount, setNewSubmissionsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Enhanced notification state
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState("");
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    totalPosts: 0
  });

  // Service health tracking
  const [serviceHealth, setServiceHealth] = useState({
    notifications: 'unknown',
    database: 'unknown',
    backend: 'unknown',
    lastChecked: null
  });

  // Enhanced notification system
  const showNotification = (msg, type = "info", duration = 5000) => {
    setNotification(msg);
    setNotificationType(type);
    setTimeout(() => {
      setNotification("");
      setNotificationType("");
    }, duration);
  };

  // Backend URL configuration
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  
  // Generic API request function with better error handling
  const makeAPIRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...options
    };

    console.log(`Making API request to: ${url}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log(`Request to ${url} timed out`);
      }, options.timeout || 10000);

      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`Response status for ${url}:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP ${response.status} error for ${url}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Request failed'}`);
      }

      const data = await response.json();
      console.log(`Success response from ${url}:`, data);
      return data;

    } catch (error) {
      console.error(`Request failed for ${url}:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection.');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please ensure the backend is running on http://localhost:5000');
      } else if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Connection refused. Server may be down.');
      }
      
      throw error;
    }
  };

  // Check backend health
  const checkBackendHealth = async () => {
    try {
      const response = await makeAPIRequest('/api/health', { timeout: 5000 });
      setServiceHealth(prev => ({
        ...prev,
        backend: 'healthy',
        lastChecked: new Date().toISOString()
      }));
      return true;
    } catch (err) {
      console.error("Backend health check failed:", err);
      setServiceHealth(prev => ({
        ...prev,
        backend: 'unhealthy',
        lastChecked: new Date().toISOString()
      }));
      return false;
    }
  };

  // Check notification service health
  const checkNotificationHealth = async () => {
    try {
      const data = await makeAPIRequest('/api/notifications/health', { timeout: 5000 });
      
      const isHealthy = data.success;
      setServiceHealth(prev => ({
        ...prev,
        notifications: isHealthy ? 'healthy' : 'unhealthy',
        lastChecked: new Date().toISOString()
      }));
      
      return isHealthy;
    } catch (err) {
      console.error("Notification health check failed:", err);
      setServiceHealth(prev => ({
        ...prev,
        notifications: 'unhealthy',
        lastChecked: new Date().toISOString()
      }));
      return false;
    }
  };

  // Logout handler with confirmation
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("adminLoggedIn");
      localStorage.removeItem("adminId");
      localStorage.removeItem("adminName");
      window.location.href = "/admin-login";
    }
  };

  // Fetch dashboard analytics with retry logic
  const fetchDashboardStats = async (retryCount = 0) => {
    try {
      const data = await makeAPIRequest('/api/analytics/dashboard', { timeout: 10000 });
      
      if (data.success) {
        setDashboardStats(data.stats);
        setServiceHealth(prev => ({ ...prev, database: 'healthy' }));
      } else {
        throw new Error('Dashboard stats request failed');
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setServiceHealth(prev => ({ ...prev, database: 'unhealthy' }));
      
      if (retryCount < 2) {
        console.log(`Retrying dashboard stats fetch (${retryCount + 1}/3)...`);
        setTimeout(() => fetchDashboardStats(retryCount + 1), 2000);
      }
    }
  };

  // Fetch users for notifications with enhanced error handling
  const fetchUsers = async (retryCount = 0) => {
    try {
      const data = await makeAPIRequest('/api/users', { timeout: 8000 });
      
      const userList = Array.isArray(data) ? data : data.users || [];
      setUsers(userList);
      
      if (userList.length === 0) {
        showNotification("No users found in the system", "info");
      }
      
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
      
      if (retryCount < 2) {
        console.log(`Retrying user fetch (${retryCount + 1}/3)...`);
        setTimeout(() => fetchUsers(retryCount + 1), 2000);
      } else {
        showNotification(`Failed to load users: ${err.message}`, "error");
      }
    }
  };

  // Fetch notifications count with error handling
  const fetchNotifications = async () => {
    try {
      const [ordersData, submissionsData] = await Promise.allSettled([
        makeAPIRequest('/api/orders', { timeout: 5000 }),
        makeAPIRequest('/api/spiritual-submissions', { timeout: 5000 })
      ]);

      if (ordersData.status === 'fulfilled' && ordersData.value) {
        setNewOrdersCount(Array.isArray(ordersData.value) ? ordersData.value.length : 0);
      }

      if (submissionsData.status === 'fulfilled' && submissionsData.value) {
        setNewSubmissionsCount(Array.isArray(submissionsData.value) ? submissionsData.value.length : 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    // Check backend health on component mount
    checkBackendHealth();

    if (activeTab === "notifications") {
      fetchUsers();
      checkNotificationHealth();
    }
    if (activeTab === "dashboard") {
      fetchDashboardStats();
    }
    fetchNotifications();

    // Health check interval
    const healthInterval = setInterval(() => {
      if (activeTab === "notifications") {
        checkNotificationHealth();
      }
      checkBackendHealth();
    }, 60000); // Every minute

    // Data refresh interval
    const dataInterval = setInterval(() => {
      fetchNotifications();
      if (activeTab === "dashboard") {
        fetchDashboardStats();
      }
    }, 30000);
    
    return () => {
      clearInterval(healthInterval);
      clearInterval(dataInterval);
    };
  }, [activeTab]);

  // Enhanced send notification function
  const sendNotification = async () => {
    if (!selectedUser) {
      showNotification("Please select a user", "error");
      return;
    }
    
    if (!message.trim()) {
      showNotification("Please enter a message", "error");
      return;
    }

    if (message.trim().length > 1000) {
      showNotification("Message is too long (max 1000 characters)", "error");
      return;
    }

    const selectedUserObj = users.find(user => user.email === selectedUser);
    if (!selectedUserObj) {
      showNotification("Selected user not found", "error");
      return;
    }

    // Check backend health first
    const isBackendHealthy = await checkBackendHealth();
    if (!isBackendHealthy) {
      showNotification("Backend server is not responding. Please check if the server is running on http://localhost:5000", "error");
      return;
    }

    // Check service health
    const isServiceHealthy = await checkNotificationHealth();
    if (!isServiceHealthy) {
      showNotification("Notification service is currently unavailable. Please try again later.", "error");
      return;
    }

    try {
      setLoading(true);
      
      const requestBody = {
        email: selectedUserObj.email,
        name: selectedUserObj.name,
        message: message.trim()
      };

      console.log('Sending notification with payload:', requestBody);

      const data = await makeAPIRequest('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        timeout: 15000
      });
      
      if (data.success) {
        showNotification(`Email sent successfully to ${selectedUserObj.name}!`, "success");
        setMessage("");
        setSelectedUser("");
      } else {
        throw new Error(data.message || "Failed to send notification");
      }
    } catch (err) {
      console.error("Error sending notification:", err);
      showNotification(`Failed to send notification: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced send to all users function
  const sendToAllUsers = async () => {
    if (!message.trim()) {
      showNotification("Please enter a message", "error");
      return;
    }

    if (message.trim().length > 1000) {
      showNotification("Message is too long (max 1000 characters)", "error");
      return;
    }

    if (users.length === 0) {
      showNotification("No users found", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to send this message to all ${users.length} users? This action cannot be undone.`)) {
      return;
    }

    // Check backend health first
    const isBackendHealthy = await checkBackendHealth();
    if (!isBackendHealthy) {
      showNotification("Backend server is not responding. Please check if the server is running.", "error");
      return;
    }

    // Check service health
    const isServiceHealthy = await checkNotificationHealth();
    if (!isServiceHealthy) {
      showNotification("Notification service is currently unavailable. Please try again later.", "error");
      return;
    }

    try {
      setLoading(true);
      
      const batchSize = 3; // Reduced batch size for stability
      const batches = [];
      
      for (let i = 0; i < users.length; i += batchSize) {
        batches.push(users.slice(i, i + batchSize));
      }

      let successful = 0;
      let failed = 0;

      for (const [batchIndex, batch] of batches.entries()) {
        console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} users`);
        
        const promises = batch.map(user => 
          makeAPIRequest('/api/notifications', {
            method: 'POST',
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              message: message.trim()
            }),
            timeout: 30000 // Longer timeout for batch operations
          }).then(() => 'success')
            .catch((error) => {
              console.error(`Failed to send to ${user.email}:`, error);
              return 'failed';
            })
        );

        const results = await Promise.allSettled(promises);
        successful += results.filter(r => r.status === 'fulfilled' && r.value === 'success').length;
        failed += results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value === 'failed')).length;

        // Brief delay between batches
        if (batchIndex < batches.length - 1) {
          console.log(`Waiting before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (successful > 0) {
        showNotification(`Emails sent to ${successful} users${failed > 0 ? `, ${failed} failed` : ''}`, "success", 8000);
        setMessage("");
        setSelectedUser("");
      } else {
        showNotification("Failed to send emails to all users", "error");
      }
    } catch (err) {
      console.error("Error sending bulk notifications:", err);
      showNotification(`Error occurred while sending bulk notifications: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Navigation items
  const navigationItems = [
    { key: "dashboard", icon: FiHome, label: "Dashboard", badge: null },
    { key: "orders", icon: FiPackage, label: "Orders", badge: newOrdersCount },
    { key: "products", icon: FiUsers, label: "Products", badge: null },
    { key: "cms", icon: FiEdit3, label: "Content Manager", badge: null },
    { key: "spiritualSubmissions", icon: "🙏", label: "Life to Christ Form", badge: newSubmissionsCount },
    { key: "reports", icon: FiBarChart2, label: "Reports", badge: null },
    { key: "notifications", icon: FiBell, label: "Notifications", badge: null },
    { key: "settings", icon: FiSettings, label: "Settings", badge: null },
  ];

  return (
    <div className="flex min-h-screen font-[poppins] bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out shadow-2xl`}>
        <div className="p-6 flex flex-col h-full">
          {/* Logo Section */}
          <div className="mb-8 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  Pent-Shop
                </h2>
                <p className="text-slate-300 text-sm mt-1">Admin Portal</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="w-1 h-4 bg-slate-400"></div>
            </button>
          </div>

          {/* Welcome Message */}
          {!sidebarCollapsed && (
            <div className="mb-8 p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-xl border border-red-500/20">
              <p className="text-slate-300 text-sm">Welcome back,</p>
              <p className="font-semibold text-white">{adminName}</p>
              <div className="mt-2 text-xs text-slate-400">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = typeof item.icon === 'string' ? null : item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`group flex items-center gap-4 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === item.key
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center justify-center w-5 h-5">
                    {IconComponent ? (
                      <IconComponent className={`text-lg ${activeTab === item.key ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    ) : (
                      <span className="text-lg">{item.icon}</span>
                    )}
                  </div>
                  
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium truncate flex-1">
                        {item.label}
                      </span>
                      {item.badge && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-3 rounded-xl transition-all duration-200 mt-6"
          >
            <FiLogOut className="text-lg" />
            {!sidebarCollapsed && <span className="font-medium">Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-8 py-6 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 capitalize">
                  {activeTab === "spiritualSubmissions" ? "Life to Christ Forms" : activeTab}
                </h1>
                <p className="text-gray-600 mt-1">
                  {activeTab === "dashboard" && "Overview of your admin panel"}
                  {activeTab === "orders" && "Manage customer orders"}
                  {activeTab === "products" && "Manage your product catalog"}
                  {activeTab === "cms" && "Manage website content"}
                  {activeTab === "spiritualSubmissions" && "Review spiritual form submissions"}
                  {activeTab === "notifications" && "Send emails to users"}
                  {activeTab === "reports" && "Analytics and reports"}
                  {activeTab === "settings" && "System configuration"}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Backend Health Indicator */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  serviceHealth.backend === 'healthy' 
                    ? 'bg-green-100 text-green-700' 
                    : serviceHealth.backend === 'unhealthy'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {serviceHealth.backend === 'healthy' ? <FiWifi /> : <FiWifiOff />}
                  <span>
                    {serviceHealth.backend === 'healthy' ? 'Backend Online' : 
                     serviceHealth.backend === 'unhealthy' ? 'Backend Offline' : 'Checking...'}
                  </span>
                </div>

                {/* Service Health Indicator */}
                {activeTab === "notifications" && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    serviceHealth.notifications === 'healthy' 
                      ? 'bg-green-100 text-green-700' 
                      : serviceHealth.notifications === 'unhealthy'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {serviceHealth.notifications === 'healthy' ? <FiWifi /> : <FiWifiOff />}
                    <span>
                      {serviceHealth.notifications === 'healthy' ? 'Email Service' : 
                       serviceHealth.notifications === 'unhealthy' ? 'Email Offline' : 'Checking...'}
                    </span>
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-red-50 to-red-100 px-4 py-2 rounded-full">
                  <span className="text-red-700 font-medium text-sm">
                    {users.length} Total Users
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-8">
            {/* Enhanced Notification System */}
            {notification && (
              <div className={`mb-6 p-4 rounded-xl border-l-4 shadow-lg animate-in slide-in-from-top duration-300 ${
                notificationType === 'success' 
                  ? 'bg-green-50 text-green-800 border-green-400' :
                notificationType === 'error' 
                  ? 'bg-red-50 text-red-800 border-red-400' :
                  'bg-blue-50 text-blue-800 border-blue-400'
              }`}>
                <div className="flex items-center gap-3">
                  {notificationType === 'success' && <FiCheck className="text-green-600" />}
                  {notificationType === 'error' && <FiAlertCircle className="text-red-600" />}
                  <span className="font-medium">{notification}</span>
                  <button
                    onClick={() => setNotification("")}
                    className="ml-auto p-1 hover:bg-white/50 rounded-full"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            )}

            {/* Backend Connection Warning */}
            {serviceHealth.backend === 'unhealthy' && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <FiAlertCircle className="text-red-600" />
                  <div>
                    <h4 className="font-semibold text-red-800">Backend Connection Issues</h4>
                    <p className="text-red-700 text-sm">
                      Cannot connect to the backend server at {API_BASE_URL}. 
                      Please ensure your Node.js server is running and accessible.
                    </p>
                    <div className="mt-2">
                      <button 
                        onClick={checkBackendHealth}
                        className="text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-red-800"
                      >
                        Retry Connection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Content */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                {/* Service Health Banner */}
                {serviceHealth.database === 'unhealthy' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <FiAlertCircle className="text-red-600" />
                      <div>
                        <h4 className="font-semibold text-red-800">Service Issues Detected</h4>
                        <p className="text-red-700 text-sm">Some services may be experiencing connectivity issues. Data may be delayed.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {[
                    { label: "Total Users", value: dashboardStats.totalUsers, color: "from-blue-500 to-blue-600", icon: FiUsers },
                    { label: "Total Orders", value: dashboardStats.totalOrders, color: "from-green-500 to-green-600", icon: FiPackage },
                    { label: "Products", value: dashboardStats.totalProducts, color: "from-purple-500 to-purple-600", icon: FiBarChart2 },
                    { label: "Revenue", value: `₵${(dashboardStats.totalRevenue || 0).toFixed(2)}`, color: "from-yellow-500 to-yellow-600", icon: FiBarChart2 },
                    { label: "Content Posts", value: dashboardStats.totalPosts, color: "from-red-500 to-red-600", icon: FiEdit3 },
                  ].map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
                          </div>
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                            <IconComponent className="text-white text-xl" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "View Orders", action: () => setActiveTab("orders"), color: "from-blue-500 to-blue-600" },
                      { label: "Add Product", action: () => setActiveTab("products"), color: "from-green-500 to-green-600" },
                      { label: "Create Content", action: () => setActiveTab("cms"), color: "from-purple-500 to-purple-600" },
                      { label: "Send Notification", action: () => setActiveTab("notifications"), color: "from-red-500 to-red-600" },
                    ].map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className={`p-4 rounded-xl bg-gradient-to-r ${action.color} text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other Components */}
            {activeTab === "orders" && <OrdersSection />}
            {activeTab === "products" && <ProductsSection />}
            {activeTab === "cms" && <ContentManagementSystem />}
            {activeTab === "spiritualSubmissions" && <SpiritualSubmissions />}
            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="max-w-6xl mx-auto space-y-8">
                {/* System Settings */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                    <h2 className="text-2xl font-bold text-white">System Settings</h2>
                    <p className="text-blue-100 mt-2">Configure your admin panel preferences</p>
                  </div>
                  
                  <div className="p-8 space-y-8">
                    {/* Profile Settings */}
                    <div className="border-b border-gray-200 pb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">Profile Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name</label>
                          <input
                            type="text"
                            value={adminName}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter admin name"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="admin@pentshop.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* API Configuration */}
                    <div className="border-b border-gray-200 pb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">API Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Backend URL</label>
                          <input
                            type="text"
                            value={API_BASE_URL}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                            readOnly
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={checkBackendHealth}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
                          >
                            Test Connection
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Preferences */}
                    <div className="border-b border-gray-200 pb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">Dashboard Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-800">Sidebar Collapsed by Default</h4>
                            <p className="text-sm text-gray-600">Start with collapsed sidebar</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sidebarCollapsed}
                              onChange={() => setSidebarCollapsed(!sidebarCollapsed)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-800">Auto-refresh Data</h4>
                            <p className="text-sm text-gray-600">Automatically refresh dashboard data every 30 seconds</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Email Settings */}
                    <div className="border-b border-gray-200 pb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">Email Notification Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Server</label>
                          <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="smtp.gmail.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                          <input
                            type="number"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="587"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Username</label>
                          <input
                            type="email"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="your-email@gmail.com"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={checkNotificationHealth}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
                          >
                            Test Email Service
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Security Settings */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">Security Settings</h3>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="password"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Current password"
                            />
                            <input
                              type="password"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="New password"
                            />
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FiAlertCircle className="text-yellow-600" />
                            <h4 className="font-medium text-yellow-800">Session Management</h4>
                          </div>
                          <p className="text-yellow-700 text-sm mb-3">Current session expires after inactivity</p>
                          <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            Extend Session
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex justify-end space-x-4">
                        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                        <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
              <div className="max-w-7xl mx-auto space-y-8">
                {/* Analytics Overview */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                    <h2 className="text-2xl font-bold text-white">Analytics & Reports</h2>
                    <p className="text-purple-100 mt-2">Comprehensive insights into your business performance</p>
                  </div>
                  
                  <div className="p-8">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 text-sm font-medium">This Month</p>
                            <p className="text-2xl font-bold text-blue-800">{dashboardStats.totalOrders}</p>
                            <p className="text-blue-600 text-xs">Total Orders</p>
                          </div>
                          <FiPackage className="text-blue-500 text-2xl" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 text-sm font-medium">Revenue</p>
                            <p className="text-2xl font-bold text-green-800">₵{(dashboardStats.totalRevenue || 0).toFixed(2)}</p>
                            <p className="text-green-600 text-xs">Total Earnings</p>
                          </div>
                          <FiBarChart2 className="text-green-500 text-2xl" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 text-sm font-medium">Users</p>
                            <p className="text-2xl font-bold text-purple-800">{dashboardStats.totalUsers}</p>
                            <p className="text-purple-600 text-xs">Active Users</p>
                          </div>
                          <FiUsers className="text-purple-500 text-2xl" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-red-600 text-sm font-medium">Products</p>
                            <p className="text-2xl font-bold text-red-800">{dashboardStats.totalProducts}</p>
                            <p className="text-red-600 text-xs">In Catalog</p>
                          </div>
                          <FiPackage className="text-red-500 text-2xl" />
                        </div>
                      </div>
                    </div>

                    {/* Charts and Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      {/* Sales Chart */}
                      <div className="bg-gray-50 p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Trends</h3>
                        <div className="h-64 flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <FiBarChart2 className="text-4xl text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Sales chart would appear here</p>
                            <p className="text-sm text-gray-400">Integrate with Chart.js or similar</p>
                          </div>
                        </div>
                      </div>

                      {/* User Growth */}
                      <div className="bg-gray-50 p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
                        <div className="h-64 flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <FiUsers className="text-4xl text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">User growth chart</p>
                            <p className="text-sm text-gray-400">Show user registration trends</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-gray-50 p-6 rounded-xl mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                      <div className="space-y-4">
                        {[
                          { action: "New order received", time: "2 hours ago", type: "order" },
                          { action: "User registered", time: "4 hours ago", type: "user" },
                          { action: "Product updated", time: "6 hours ago", type: "product" },
                          { action: "Email notification sent", time: "8 hours ago", type: "notification" },
                          { action: "New spiritual submission", time: "1 day ago", type: "submission" },
                        ].map((activity, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                activity.type === 'order' ? 'bg-green-100 text-green-600' :
                                activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                                activity.type === 'product' ? 'bg-purple-100 text-purple-600' :
                                activity.type === 'notification' ? 'bg-red-100 text-red-600' :
                                'bg-yellow-100 text-yellow-600'
                              }`}>
                                {activity.type === 'order' && <FiPackage />}
                                {activity.type === 'user' && <FiUsers />}
                                {activity.type === 'product' && <FiBarChart2 />}
                                {activity.type === 'notification' && <FiBell />}
                                {activity.type === 'submission' && "🙏"}
                              </div>
                              <span className="font-medium text-gray-800">{activity.action}</span>
                            </div>
                            <span className="text-sm text-gray-500">{activity.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Export Options */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Reports</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="flex items-center justify-center gap-2 p-4 border-2 border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                          <FiBarChart2 />
                          <span>Sales Report</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 p-4 border-2 border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-colors">
                          <FiUsers />
                          <span>User Report</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 p-4 border-2 border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                          <FiPackage />
                          <span>Inventory Report</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Products</h3>
                    <div className="space-y-3">
                      {["Holy Bible", "Prayer Book", "Gospel Music CD", "Cross Necklace", "Devotional Guide"].map((product, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-700">{product}</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{Math.floor(Math.random() * 50) + 10} sold</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">System Health</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Backend Server</span>
                        <div className={`flex items-center gap-2 ${serviceHealth.backend === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                          {serviceHealth.backend === 'healthy' ? <FiWifi /> : <FiWifiOff />}
                          <span className="text-sm">{serviceHealth.backend === 'healthy' ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Email Service</span>
                        <div className={`flex items-center gap-2 ${serviceHealth.notifications === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                          {serviceHealth.notifications === 'healthy' ? <FiCheck /> : <FiAlertCircle />}
                          <span className="text-sm">{serviceHealth.notifications === 'healthy' ? 'Active' : 'Issues'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setActiveTab("orders")}
                        className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        View All Orders
                      </button>
                      <button 
                        onClick={() => setActiveTab("users")}
                        className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        Manage Users
                      </button>
                      <button 
                        onClick={() => setActiveTab("notifications")}
                        className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        Send Notifications
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Enhanced Notifications Section */}
            {activeTab === "notifications" && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
                    <h2 className="text-2xl font-bold text-white">Email Notifications</h2>
                    <p className="text-red-100 mt-2">Send personalized messages to your users</p>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    {/* Connection Status */}
                    {serviceHealth.backend === 'unhealthy' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <FiAlertCircle className="text-red-600" />
                          <div>
                            <h4 className="font-semibold text-red-800">Backend Connection Failed</h4>
                            <p className="text-red-700 text-sm">
                              Cannot connect to {API_BASE_URL}. Please ensure your Node.js server is running.
                            </p>
                            <div className="mt-2 text-xs text-red-600">
                              Try: <code>npm start</code> or <code>node server.js</code> in your backend directory
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Service Status */}
                    {serviceHealth.notifications !== 'healthy' && serviceHealth.backend === 'healthy' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <FiAlertCircle className="text-yellow-600" />
                          <div>
                            <h4 className="font-semibold text-yellow-800">Email Service Status</h4>
                            <p className="text-yellow-700 text-sm">
                              {serviceHealth.notifications === 'unhealthy' 
                                ? 'Email service is currently unavailable. Please check your email configuration.' 
                                : 'Checking email service availability...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* User Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Select Recipient
                      </label>
                      <select
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        disabled={loading || serviceHealth.backend === 'unhealthy'}
                      >
                        <option value="">Choose a user...</option>
                        {Array.isArray(users) && users.length > 0 ? (
                          users.map((user) => (
                            <option key={user._id || user.id} value={user.email}>
                              {user.name} ({user.email})
                            </option>
                          ))
                        ) : (
                          <option disabled>No users found</option>
                        )}
                      </select>
                    </div>

                    {/* Message Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Message Content
                      </label>
                      <textarea
                        placeholder="Compose your message here... You can include personalized content, updates, or announcements."
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 resize-none"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        disabled={loading || serviceHealth.backend === 'unhealthy'}
                        maxLength={1000}
                      ></textarea>
                      <div className="text-right text-sm text-gray-500 mt-2">
                        {message.length}/1000 characters
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={sendNotification}
                        disabled={loading || !selectedUser || !message.trim() || serviceHealth.backend === 'unhealthy'}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {loading ? "Sending..." : "Send to Selected User"}
                      </button>

                      <button
                        onClick={sendToAllUsers}
                        disabled={loading || !message.trim() || users.length === 0 || serviceHealth.backend === 'unhealthy'}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {loading ? "Sending..." : `Send to All Users (${users.length})`}
                      </button>
                    </div>

                    {/* Debug Information */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="bg-gray-50 rounded-xl p-4 text-sm">
                        <h4 className="font-semibold text-gray-800 mb-2">Debug Information</h4>
                        <div className="space-y-1 text-gray-600">
                          <p>API Base URL: {API_BASE_URL}</p>
                          <p>Backend Status: {serviceHealth.backend}</p>
                          <p>Email Service: {serviceHealth.notifications}</p>
                          <p>Users Loaded: {users.length}</p>
                          <p>Last Health Check: {serviceHealth.lastChecked ? new Date(serviceHealth.lastChecked).toLocaleTimeString() : 'Never'}</p>
                        </div>
                      </div>
                    )}

                    {/* User Stats */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                          <p className="text-gray-600 text-sm">Total Users</p>
                        </div>
                        <div>
                          <p className={`text-2xl font-bold ${
                            serviceHealth.backend === 'healthy' && serviceHealth.notifications === 'healthy' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {serviceHealth.backend === 'healthy' && serviceHealth.notifications === 'healthy' 
                              ? 'Ready' 
                              : 'Offline'}
                          </p>
                          <p className="text-gray-600 text-sm">System Status</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            {serviceHealth.lastChecked ? 'Updated' : 'Ready'}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {serviceHealth.lastChecked 
                              ? new Date(serviceHealth.lastChecked).toLocaleTimeString() 
                              : 'Status'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Email Tips */}
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3">Email Tips</h4>
                      <ul className="text-blue-700 text-sm space-y-2">
                        <li>• Keep messages clear and concise</li>
                        <li>• Include a clear call-to-action if needed</li>
                        <li>• Test with a single user before sending to all</li>
                        <li>• Large bulk sends are processed in batches to ensure reliability</li>
                      </ul>
                    </div>

                    {/* Troubleshooting */}
                    {serviceHealth.backend === 'unhealthy' && (
                      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                        <h4 className="font-semibold text-red-800 mb-3">Troubleshooting Steps</h4>
                        <ol className="text-red-700 text-sm space-y-2 list-decimal list-inside">
                          <li>Ensure your Node.js backend server is running on port 5000</li>
                          <li>Check that CORS is properly configured for your frontend URL</li>
                          <li>Verify your .env file contains EMAIL_USER and EMAIL_PASS</li>
                          <li>Test the server health endpoint: <code className="bg-red-100 px-1 rounded">{API_BASE_URL}/api/health</code></li>
                          <li>Check browser console for detailed error messages</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Under Construction */}
            {(activeTab === "reports" || activeTab === "settings") && (
              <div className="text-center py-20">
                <div className="bg-white rounded-2xl p-12 shadow-lg max-w-md mx-auto">
                  <div className="text-6xl mb-6">🚧</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Under Construction</h3>
                  <p className="text-gray-600">
                    The <strong>{activeTab}</strong> feature is currently being developed.
                    Check back soon for updates!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;