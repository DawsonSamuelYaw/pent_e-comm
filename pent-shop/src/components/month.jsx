import React, { useContext } from 'react';
import { Info } from '../context/info';
const Mac = '/imgs/child-w.jpeg';
const Ja  = 'imgs/cloth.jpeg';
const pe  = 'imgs/pem.jpeg';
const CAm = '/imgs/youth-1.jpeg';
const Con = '/imgs/youth-f.jpeg';

const products = [
  {
    id: 1,
    img: Mac,
    name: "Children's Ministry @50",
    price: "50.00"
  },
  {
    id: 2,
    img: CAm,
    name: "Youth T-Shirt",
    price: "45.00"
  },
  {
    id: 3,
    img: Ja,
    name: "Youth Cloth",
    price: "550.00"
  },
  {
    id: 4,
    img: Con,
    name: "Youth Long Sleeves (Men)",
    price: "120.00"
  },
  {
    id: 5,
    img: pe,
    name: "PEMEM CLOTH",
    price: "470.00"
  }
];

const MonthDeals = () => {
  const { handlesubmitCart } = useContext(Info);

  return (
    <div className="font-[poppins] px-4 sm:px-8 py-8 bg-gray-100">
      {/* Section Header */}
      <h1 className="border-l-8 border-red-600 pl-4 text-2xl sm:text-3xl font-bold text-red-600 mb-6">
        September Deals
      </h1>

      {/* Horizontal Scrollable Products */}
      <div className="flex overflow-x-auto gap-5 pb-4 no-scrollbar">
        {products.map((item) => (
          <div
            key={item.id}
            className="min-w-[160px] max-w-[180px] sm:min-w-[200px] sm:max-w-[220px] bg-white p-4 rounded-lg shadow hover:shadow-md transition-all text-center"
          >
            <img
              src={item.img}
              alt={item.name}
              className="w-full h-32 sm:h-40 object-cover rounded-md mb-3"
            />
            <h2 className="text-sm font-semibold mb-1 truncate">{item.name}</h2>
            <p className="text-xs text-gray-600 mb-3">GH¢{item.price}</p>
            <button
              onClick={() => handlesubmitCart(item)}
              className="bg-red-600 text-white text-xs px-4 py-1.5 rounded hover:bg-red-700 transition"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthDeals;
