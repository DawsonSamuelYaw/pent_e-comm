import React, { useState, useEffect } from 'react';
import { IoIosArrowDown } from "react-icons/io";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdClose } from "react-icons/md";
import { FaShippingFast, FaTrophy, FaCreditCard, FaHeadset, FaStar, FaHeart } from "react-icons/fa";
import { BiCategory } from "react-icons/bi";
import { HiSparkles } from "react-icons/hi";
import Img1 from './the.jpg';
import Img2 from './bus.jpg';
import Img3 from './pen.jpg';
import BgImg from './jesus-bg.jpg';
import GiveLifeForm from '../components/GiveLifeForm';

const slides = [
  { 
    img: Img1,
    title: "Welcome to Our Ministry",
    subtitle: "Experience God's Love in Community",
    cta: "Join Us Today"
  },
  { 
    img: Img2,
    title: "Transform Lives Together",
    subtitle: "Building Faith, Hope, and Love",
    cta: "Get Involved"
  },
  { 
    img: Img3,
    title: "Serve with Purpose",
    subtitle: "Making a Difference in Our Community",
    cta: "Learn More"
  },
];

const Modal = ({ children, onClose, bgImage }) => (
  <div
    className="fixed inset-0 bg-gradient-to-br from-black/80 via-blue-900/20 to-purple-900/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn p-4"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-5xl max-h-[95vh] flex items-center justify-center rounded-2xl shadow-2xl overflow-hidden border border-white/20"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(30,64,175,0.3)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/30 to-black/60" />
      <div className="relative z-10 p-8 sm:p-12 text-center text-white w-full flex justify-center">
        {children}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 cursor-pointer right-4 bg-red-500/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-600 transition-all duration-300 transform hover:scale-110 shadow-lg border border-white/20 z-50"
      >
        <MdClose size={20} />
      </button>
    </div>
  </div>
);

const Home = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [current, setCurrent] = useState(0);
  const [showPopup, setShowPopup] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [wantsToGiveLife, setWantsToGiveLife] = useState(false);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true);

  const handleClosePopup = () => {
    setShowPopup(false);
    setAnswered(false);
    setWantsToGiveLife(false);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!isCarouselPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isCarouselPlaying]);

  const handleAnswer = (gaveLife) => {
    setAnswered(true);
    if (!gaveLife) {
      setWantsToGiveLife(true);
    } else {
      handleClosePopup();
    }
  };

  const handleFormSubmit = () => handleClosePopup();

  const categories = [
    { name: "Youth Ministry", icon: "🌟", color: "text-blue-600" },
    { name: "Men's Ministry", icon: "💪", color: "text-green-600" },
    { name: "Women's Ministry", icon: "🌸", color: "text-pink-600" },
    { name: "Children's Ministry", icon: "👶", color: "text-yellow-600" },
    { name: "Senior Ministry", icon: "👴", color: "text-purple-600" },
    { name: "Music Ministry", icon: "🎵", color: "text-indigo-600" }
  ];

  const features = [
    { 
      Icon: FaShippingFast, 
      title: "Fastest Delivery", 
      desc: "Same day delivery available",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 hover:bg-blue-100"
    },
    { 
      Icon: FaTrophy, 
      title: "24 Hours Return", 
      desc: "100% satisfaction guarantee",
      color: "from-amber-500 to-orange-500", 
      bgColor: "bg-amber-50 hover:bg-amber-100"
    },
    { 
      Icon: FaCreditCard, 
      title: "Secure Payment", 
      desc: "Your transactions are protected",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 hover:bg-green-100"
    },
    { 
      Icon: FaHeadset, 
      title: "24/7 Support", 
      desc: "We're here whenever you need",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 hover:bg-purple-100"
    }
  ];

  return (
    <div className="main font-[poppins] relative min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">

      {/* Modal popup with enhanced styling */}
      {showPopup && (
        <Modal onClose={handleClosePopup} bgImage={BgImg}>
          
          {!answered && (
            <div className="animate-slideUp">
              <div className="mb-6">
                <HiSparkles className="mx-auto text-6xl text-yellow-300 mb-4 animate-pulse" />
              </div>
              <h2 className="text-4xl sm:text-6xl font-extrabold mb-6 tracking-wide drop-shadow-2xl bg-gradient-to-r from-yellow-300 via-white to-blue-200 bg-clip-text text-transparent">
                DO YOU KNOW JESUS?
              </h2>
              <p className="mb-10 text-xl sm:text-2xl font-light text-blue-100 drop-shadow-lg">
                Have you given your life to Christ?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <button
                  onClick={() => handleAnswer(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-4 rounded-full text-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-white/20 backdrop-blur-sm min-w-[140px]"
                >
                  Yes ✨
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-10 py-4 rounded-full text-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-white/20 backdrop-blur-sm min-w-[140px]"
                >
                  No 🙏
                </button>
              </div>
            </div>
          )}
          {answered && wantsToGiveLife && (
            <div className="animate-slideUp">
              <GiveLifeForm onSubmit={handleFormSubmit} />
            </div>
          )}
        </Modal>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Category Dropdown */}
        <div className="py-6">
          <div
            className="relative z-30 w-fit"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl px-6 py-3 flex items-center text-sm hover:bg-white hover:border-blue-300 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <BiCategory className="text-blue-600 mr-2 text-lg" />
              <span className="text-gray-800 font-medium">All Categories</span>
              <IoIosArrowDown className={`ml-3 transition-all duration-300 text-blue-600 ${isHovered ? 'rotate-180 scale-110' : ''}`} />
            </div>
            {isHovered && (
              <div className="absolute left-0 mt-2 w-72 bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-200 z-40 animate-slideDown overflow-hidden">
                <div className="p-2">
                  {categories.map((category, idx) => (
                    <div key={idx} className="p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 cursor-pointer group">
                      <a href="#" className="flex items-center gap-3">
                        <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                          {category.icon}
                        </span>
                        <span className={`font-medium ${category.color} group-hover:translate-x-1 transition-transform duration-200`}>
                          {category.name}
                        </span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Carousel */}
        <div 
          className="relative rounded-3xl overflow-hidden z-10 h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[650px] shadow-2xl group"
          onMouseEnter={() => setIsCarouselPlaying(false)}
          onMouseLeave={() => setIsCarouselPlaying(true)}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full transition-all duration-1000 ease-in-out ${
                index === current ? 'opacity-100 visible z-20 scale-100' : 'opacity-0 invisible z-0 scale-105'
              }`}
            >
              <img
                src={slide.img}
                alt={`Slide ${index}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />
              
              {/* Slide Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 text-white">
                <div className="max-w-2xl">
                  <h3 className="text-3xl sm:text-5xl font-bold mb-4 drop-shadow-lg animate-slideUp">
                    {slide.title}
                  </h3>
                  <p className="text-lg sm:text-xl mb-6 text-gray-200 drop-shadow-md animate-slideUp" style={{animationDelay: '0.2s'}}>
                    {slide.subtitle}
                  </p>
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg animate-slideUp" style={{animationDelay: '0.4s'}}>
                    {slide.cta}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Enhanced Navigation Arrows */}
          <div className="absolute inset-0 flex justify-between items-center px-4 sm:px-8 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={prevSlide}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full shadow-lg hover:bg-white/30 hover:scale-110 transition-all duration-300 border border-white/30"
            >
              <MdKeyboardArrowLeft size={28} className="text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full shadow-lg hover:bg-white/30 hover:scale-110 transition-all duration-300 border border-white/30"
            >
              <MdKeyboardArrowRight size={28} className="text-white" />
            </button>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === current 
                    ? 'bg-white scale-125 shadow-lg' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Enhanced Features Section */}
        <div className="py-12 sm:py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Experience excellence in every aspect of our service
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className={`group ${feature.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full" />
                
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <feature.Icon className="text-2xl text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                  {feature.desc}
                </p>
                
                <div className="mt-4 flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">Learn more</span>
                  <MdKeyboardArrowRight className="ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Home;