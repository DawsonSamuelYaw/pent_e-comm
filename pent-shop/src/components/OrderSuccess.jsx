import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const OrderSuccess = () => {
  const { orderReference } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const printRef = useRef();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!orderReference) {
      setError("No order reference provided.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders/reference/${orderReference}`);
        if (!res.ok) throw new Error("Order not found or backend unavailable");

        const data = await res.json();
        setOrder(data);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderReference, API_URL]);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt - ${order.reference}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #10b981;
              padding-bottom: 20px;
            }
            .header h1 { 
              color: #10b981; 
              margin: 0;
              font-size: 28px;
            }
            .order-info {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .products-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .products-table th,
            .products-table td {
              text-align: left;
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            .products-table th {
              background: #f3f4f6;
              font-weight: 600;
            }
            .total-section {
              border-top: 2px solid #10b981;
              padding-top: 15px;
              text-align: right;
            }
            .total-amount {
              font-size: 20px;
              font-weight: bold;
              color: #10b981;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 14px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Receipt</h1>
            <p>Thank you for your purchase!</p>
          </div>
          
          <div class="order-info">
            <h3>Order Information</h3>
            <p><strong>Order Reference:</strong> ${order.reference}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}</p>
            <p><strong>Customer Email:</strong> ${order.userEmail}</p>
          </div>

          <table class="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.products?.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>GHS ${Number(item.price).toFixed(2)}</td>
                  <td>GHS ${(Number(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No products found</td></tr>'}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-amount">
              Total Amount: GHS ${Number(order.amount).toFixed(2)}
            </div>
          </div>

          <div class="footer">
            <p>This is a computer-generated receipt. Thank you for your business!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Loading State
  if (loading) {
    return (
      <div className="font-[Poppins] bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Loading Order Details</h2>
          <p className="text-slate-600">Please wait while we fetch your order information...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="font-[Poppins] bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Order Not Found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Return to Store
          </a>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="font-[Poppins] bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-600 mb-2">No Order Data</h2>
          <p className="text-slate-500">Unable to find order information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-[Poppins] bg-gradient-to-br from-green-50 via-white to-green-50 min-h-screen relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-bounce opacity-80"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">Order Confirmed! 🎉</h1>
          <p className="text-green-100 text-lg">Thank you for your purchase. Your order has been successfully placed.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div ref={printRef} className="divide-y divide-slate-200">
            {/* Order Header */}
            <div className="p-8 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Order Details
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-slate-600 w-24">Reference:</span>
                      <span className="font-mono font-medium text-slate-800 bg-slate-200 px-3 py-1 rounded-lg text-sm">
                        {order.reference}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-slate-600 w-24">Date:</span>
                      <span className="font-medium text-slate-800">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status & Contact
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-slate-600 w-20">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status?.toLowerCase() === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status?.toLowerCase() === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-slate-600 w-20">Email:</span>
                      <span className="font-medium text-slate-800">{order.userEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Items Purchased ({order.products?.length || 0})
              </h3>

              {order.products && order.products.length > 0 ? (
                <div className="space-y-4">
                  {order.products.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">{item.name}</h4>
                          <p className="text-sm text-slate-500">
                            GHS {Number(item.price).toFixed(2)} each
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-800">
                          GHS {(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-slate-500">No products found in this order</p>
                </div>
              )}
            </div>

            {/* Total Section */}
            <div className="p-8 bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-600">Total Amount Paid</p>
                  <p className="text-xs text-slate-500 mt-1">Including all fees and taxes</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">
                    GHS {Number(order.amount).toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600">Payment Confirmed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handlePrint}
            className="flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>

          <a 
            href="/" 
            className="flex items-center px-8 py-4 bg-white text-slate-700 font-medium border border-slate-300 rounded-xl hover:bg-slate-50 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Continue Shopping
          </a>

          <button 
            onClick={() => window.location.href = `mailto:support@yourstore.com?subject=Order ${order.reference}&body=Hi, I have a question about my order ${order.reference}`}
            className="flex items-center px-8 py-4 bg-slate-600 text-white font-medium rounded-xl hover:bg-slate-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Need Help?
          </button>
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
              <ul className="text-blue-800 space-y-2 text-sm">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  You'll receive an order confirmation email shortly
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  We'll send tracking information when your order ships
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Expected delivery time: 2-5 business days
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;