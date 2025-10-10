import React, { useContext, useEffect, useState } from 'react';
import { Info } from '../context/info';
import { FaRegTrashAlt } from 'react-icons/fa';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const API_BASE_URL =   import.meta.env.VITE_API_URL || "http://localhost:5000";  // Backend URL

const ShowCart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, handlesubmitCart, decreaseQty } = useContext(Info);
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProductsData(data);
      } catch (err) {
        console.error('❌ Failed to fetch products:', err);
        Swal.fire('Error', 'Failed to fetch products', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const getImageUrl = (product) => {
    if (product.img) return `${API_BASE_URL}${product.img}`;
    if (product.images?.length) return `${API_BASE_URL}${product.images[0]}`;
    return "/placeholder.jpg";
  };

  const detailedCart = cart.map(cartItem => {
    const product = productsData.find(p => p.id === cartItem.id) || {};
    return {
      ...product,
      ...cartItem,
      price: product.price || cartItem.price,
      img: product.img || cartItem.img,
      images: product.images || cartItem.images,
      name: product.name || cartItem.name,
    };
  });

  const total = detailedCart.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = item.quantity || 1;
    return sum + price * quantity;
  }, 0);

  const handleProceedToCheckout = () => {
    if (detailedCart.length === 0) {
      Swal.fire('Cart Empty', 'Your cart is empty!', 'warning');
      return;
    }
    navigate('/checkout');
  };

  if (loading) return <p>Loading cart...</p>;

  return (
    <div className="font-[poppins] p-8 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-red-600">My Cart</h1>
        <p className="text-gray-600 mt-1">
          You have {detailedCart.length} {detailedCart.length === 1 ? 'item' : 'items'} in your cart.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1">
          {detailedCart.length === 0 ? (
            <p className="text-gray-500">Your cart is empty.</p>
          ) : (
            <div className="grid gap-6">
              {detailedCart.map((item) => (
                <div
                  className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4"
                  key={`${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`}
                >
                  <img
                    src={getImageUrl(item)}
                    alt={item.name || 'Product image'}
                    className="w-24 h-24 object-cover rounded-md"
                  />

                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">{item.name}</h2>
                    <p className="text-gray-600">
                      GHS {(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}
                    </p>
                    {item.selectedColor && <p className="text-sm text-gray-500">Color: {item.selectedColor}</p>}
                    {item.selectedSize && <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>}
                  </div>

                  <div className="flex gap-1 items-center">
                    <button onClick={() => handlesubmitCart({ ...item, price: item.price })}><FiPlus /></button>
                    <span className="text-sm">{item.quantity || 1}</span>
                    <button onClick={() => decreaseQty(item.id)}><FiMinus /></button>
                  </div>

                  <button
                    className="text-red-600 hover:text-red-800 text-xl cursor-pointer"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <FaRegTrashAlt />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block w-px bg-black h-auto"></div>

        <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>

          <div className="space-y-2 mb-6">
            {detailedCart.map((item) => (
              <div
                key={`${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`}
                className="flex justify-between text-sm"
              >
                <span>
                  {item.name}
                  {item.selectedColor && ` (${item.selectedColor})`}
                  {item.selectedSize && ` [${item.selectedSize}]`}
                  × {item.quantity || 1}
                </span>
                <span>GHS {(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <hr className="my-4" />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>GHS {total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleProceedToCheckout}
            className="mt-6 w-full bg-red-600 text-white py-3 rounded hover:bg-red-700"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShowCart;
