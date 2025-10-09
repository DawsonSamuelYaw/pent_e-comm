import React, { useContext, useState, useEffect } from "react";
import { Info } from "../context/info";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const { cart, setCart } = useContext(Info);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    paymentMethod: "",
    momoNumber: "",
    momoNetwork: "",
    paypalEmail: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ FIX DATADOG STORAGE ISSUE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
      } catch (e) {
        console.warn('Storage not available, some features may not work');
        window.DD_STORAGE_AVAILABLE = false;
      }
    }
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePaymentSelection = (method) => {
    setFormData({ ...formData, paymentMethod: method });
    setError("");
  };

  const total = cart.reduce(
    (sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 1),
    0
  );

  const validateForm = () => {
    const { fullName, email, phone, address, city, paymentMethod, momoNumber, momoNetwork, paypalEmail } = formData;
    
    if (!fullName?.trim()) return "Full name is required";
    if (!email?.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email";
    if (!phone?.trim()) return "Phone number is required";
    if (!address?.trim()) return "Address is required";
    if (!city?.trim()) return "City is required";
    if (!paymentMethod) return "Please select a payment method";
    
    if (paymentMethod === "momo") {
      if (!momoNumber?.trim()) return "MoMo number is required";
      if (!momoNetwork) return "MoMo network is required";
    }
    
    if (paymentMethod === "paypal" && !paypalEmail?.trim()) {
      return "PayPal email is required";
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    const { fullName, email, phone, address, city, paymentMethod, momoNumber, momoNetwork, paypalEmail } = formData;

    const orderData = {
      userEmail: email.trim().toLowerCase(),
      amount: parseFloat(total.toFixed(2)),
      reference: "",
      products: cart.map((item) => ({
        productId: item.id || item._id || `temp_${Date.now()}_${Math.random()}`,
        name: item.name || "Unknown Product",
        price: parseFloat(item.price || 0),
        quantity: parseInt(item.quantity || 1),
      })),
      status: "Pending",
      paymentMethod,
      customerInfo: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim()
      },
      paymentInfo: {
        momoNumber: paymentMethod === "momo" ? momoNumber.trim() : "",
        momoNetwork: paymentMethod === "momo" ? momoNetwork : "",
        paypalEmail: paymentMethod === "paypal" ? paypalEmail.trim() : ""
      }
    };

    try {
      setLoading(true);
      setError("");

      if (paymentMethod === "paystack") {
        const paystackRes = await fetch(`${API_URL}/api/paystack/initiate`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            fullName: fullName.trim(),
            amount: parseFloat(total.toFixed(2)),
            products: orderData.products,
          }),
        });

        if (!paystackRes.ok) {
          const errorData = await paystackRes.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${paystackRes.status}: Failed to initialize payment`);
        }

        const paystackData = await paystackRes.json();

        if (paystackData.status === "success") {
          console.log("✅ Paystack initialized:", paystackData.reference);
          
          try {
            localStorage.removeItem("cart");
          } catch (storageError) {
            console.warn("Could not clear cart from localStorage:", storageError);
          }
          
          setCart([]);
          window.location.href = paystackData.authorization_url;
        } else {
          throw new Error(paystackData.message || "Payment initialization failed");
        }
      } else {
        orderData.reference = `${paymentMethod.toUpperCase()}-TXN-${Date.now()}`;

        const orderRes = await fetch(`${API_URL}/api/orders`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(orderData),
        });

        if (!orderRes.ok) {
          const errorData = await orderRes.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${orderRes.status}: Failed to create order`);
        }

        const savedOrder = await orderRes.json();
        console.log("✅ Order created:", savedOrder._id);

        try {
          localStorage.removeItem("cart");
        } catch (storageError) {
          console.warn("Could not clear cart from localStorage:", storageError);
        }
        
        setCart([]);
        navigate(`/success/${orderData.reference}`);
      }
    } catch (err) {
      console.error("❌ Checkout error:", err);
      setError(err.message || "Failed to process order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-[Poppins] bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Secure Checkout</h1>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-6 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-green-600 font-medium">Cart</span>
            </div>
            <div className="h-px bg-slate-300 flex-1"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">2</span>
              </div>
              <span className="text-sm text-red-600 font-medium">Checkout</span>
            </div>
            <div className="h-px bg-slate-300 flex-1"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                <span className="text-slate-500 text-sm font-semibold">3</span>
              </div>
              <span className="text-sm text-slate-500">Confirmation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Customer Information */}
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Customer Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                    <input 
                      type="text" 
                      name="fullName" 
                      placeholder="Enter your full name" 
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none" 
                      value={formData.fullName} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="your.email@example.com" 
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none" 
                      value={formData.email} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      placeholder="+233 XX XXX XXXX" 
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none" 
                      value={formData.phone} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                    <input 
                      type="text" 
                      name="city" 
                      placeholder="Enter your city" 
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none" 
                      value={formData.city} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Address *</label>
                  <textarea 
                    name="address" 
                    placeholder="Enter your full delivery address" 
                    rows="3"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none resize-none" 
                    value={formData.address} 
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Payment Method *
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { key: "momo", name: "Mobile Money", icon: "📱" },
                    { key: "hubtel", name: "Hubtel", icon: "💳" },
                    { key: "paypal", name: "PayPal", icon: "🌐" },
                    { key: "paystack", name: "Paystack", icon: "💎" }
                  ].map((method) => (
                    <div
                      key={method.key}
                      onClick={() => handlePaymentSelection(method.key)}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.paymentMethod === method.key 
                          ? "border-red-500 bg-red-50 shadow-lg" 
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      {formData.paymentMethod === method.key && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-2xl mb-2">{method.icon}</div>
                        <img 
                          src={`/imgs/${method.key}.png`} 
                          alt={method.name} 
                          className="h-6 mx-auto mb-2" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <p className="text-xs font-medium text-slate-700">{method.name}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conditional Payment Fields */}
                {formData.paymentMethod === "momo" && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="font-medium text-slate-800">Mobile Money Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Network Provider *</label>
                        <select 
                          name="momoNetwork" 
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none" 
                          value={formData.momoNetwork} 
                          onChange={handleChange}
                          required
                        >
                          <option value="">-- Select Network --</option>
                          <option value="MTN">MTN Mobile Money</option>
                          <option value="Vodafone">Vodafone Cash</option>
                          <option value="AirtelTigo">AirtelTigo Money</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Money Number *</label>
                        <input 
                          type="tel" 
                          name="momoNumber" 
                          placeholder="0XX XXX XXXX" 
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none" 
                          value={formData.momoNumber} 
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.paymentMethod === "paypal" && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="font-medium text-slate-800 mb-4">PayPal Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">PayPal Email *</label>
                      <input 
                        type="email" 
                        name="paypalEmail" 
                        placeholder="your.paypal@email.com" 
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none" 
                        value={formData.paypalEmail} 
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || cart.length === 0}
                  className={`w-full mt-6 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg ${
                    loading || cart.length === 0
                      ? "bg-slate-400 cursor-not-allowed text-white" 
                      : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:shadow-xl transform hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    `Complete Order • GHS ${total.toFixed(2)}`
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 sticky top-8">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Order Summary
                </h2>
              </div>
              
              <div className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <p className="text-slate-500">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <div key={item.id || item._id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                          <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">{item.name}</p>
                            <p className="text-sm text-slate-500">
                              GHS {parseFloat(item.price || 0).toFixed(2)} × {item.quantity || 1}
                            </p>
                          </div>
                          <p className="font-semibold text-slate-800">
                            GHS {(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal:</span>
                        <span className="font-medium">GHS {total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Delivery Fee:</span>
                        <span className="font-medium text-green-600">Free</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Tax:</span>
                        <span className="font-medium">GHS 0.00</span>
                      </div>
                      <div className="border-t border-slate-200 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-slate-800">Total:</span>
                          <span className="text-xl font-bold text-red-600">GHS {total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-sm text-green-800">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Secure SSL encrypted checkout
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;