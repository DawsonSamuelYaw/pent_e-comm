import React, { useEffect, useState } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { IoMdClose } from "react-icons/io";
import COP from './COP.jpg';
import Image3 from './img1.jpg';
import Image2 from './img2.jpg';

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [COP, Image2, Image3];

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  return (
    <>
      {/* Modal */}
      {!isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-[500px] relative">
            <h2 className="text-2xl font-bold mb-4">Welcome to the Church of Pentecost Shop</h2>
            <p className="mb-6">
              Explore various ministry shops, including Peme, Youth, Children, and more. We are glad to have you here!
            </p>
            <h1>Fill this form to give your life to Christ</h1>
            <form action="">
              <div className="form flex flex-col space-y-2">
                <div className="f-1">
                  <input type="text" placeholder='Full Name' className='p-2 w-full focus:outline-none border-l border-black'/>
                </div>
                <div className="f-2">
                  <input type="text" placeholder='Age' className='p-2 w-full focus:outline-none border-l border-black'/>
                </div>
                <div className="f-3">
                  <select className='p-2 w-full focus:outline-none border-l border-black'>
                    <option value="">-SELECT REGION-</option>
                    {/* Add other regions here */}
                    <option value="Greater Accra Region">Greater Accra Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Eastern Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                    <option value="Ashanti Region">Ashanti Region</option>
                  </select>
                </div>
                <div className="f-4">
                  <input type="text" placeholder='Area' className='p-2 w-full focus:outline-none border-l border-black'/>
                </div>
                <div className="f-4">
                  <input type="text" placeholder='Mobile Number' className='p-2 w-full focus:outline-none border-l border-black'/>
                </div>
                <div className="f-5">
                  <input type="text" placeholder='Email' className='p-2 w-full focus:outline-none border-l border-black'/>
                </div>
              </div>
            </form>
            <button className="bg-blue-600 text-white px-4 py-2 w-full my-[10px] rounded">
              CLICK TO BE SAVED
            </button>
            <IoMdClose onClick={closeModal} className='cursor-pointer absolute top-2 right-2 text-2xl'/>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="flex flex-col md:flex-row justify-between p-4 space-y-6 md:space-y-0 md:space-x-8">
        {/* Left Section */}
        <div className="sec-1 flex flex-col space-y-6 md:w-1/4 p-4 border-r border-gray-300">
          <a href="#" className="text-lg hover:text-blue-600 transition">Peme Ministry Shop</a>
          <a href="#" className="text-lg hover:text-blue-600 transition">Youth Ministry Shop</a>
          <a href="#" className="text-lg hover:text-blue-600 transition">Children Ministry Shop</a>
          <a href="#" className="text-lg hover:text-blue-600 transition">Book Shop</a>
          <a href="#" className="text-lg hover:text-blue-600 transition">Song Shop</a>
        </div>

        {/* Right Section - Slideshow with "Shop Now" button */}
        <div
          className="sec-2 md:w-3/4 relative flex justify-center items-center bg-cover bg-center"
          style={{
            backgroundImage: `url(${images[currentImageIndex]})`,
            height: '300px',
          }}
        >
          {/* Shop Now button overlay */}
          <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 cursor-pointer hover:bg-blue-700 transition">
            <FaShoppingCart />
            <span>Shop Now</span>
          </div>

          {/* Navigation circles */}
          <div className="absolute bottom-4 right-4 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-3 h-3 rounded-full ${
                  currentImageIndex === index ? 'bg-blue-600' : 'bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
