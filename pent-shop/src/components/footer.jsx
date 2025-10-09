import React, { useState } from 'react';
import { AiOutlineSend } from "react-icons/ai";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaMapMarkerAlt, FaEnvelope, FaPhone, FaHeart, FaArrowUp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi";
import { BiSupport } from "react-icons/bi";
import { MdAccountCircle, MdLink } from "react-icons/md";
import { BsDownload, BsQrCode } from "react-icons/bs";
import App from './app.png';
import Png from './png.png';
import What from './what.jpg';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubscribing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubscribing(false);
    setEmail('');
    
    // Show success message (you can replace with your preferred notification)
    alert('Successfully subscribed! 🎉');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { Icon: FaFacebookF, href: "#", color: "hover:text-blue-400", bg: "hover:bg-blue-400/20" },
    { Icon: FaXTwitter, href: "#", color: "hover:text-gray-300", bg: "hover:bg-gray-300/20" },
    { Icon: FaInstagram, href: "#", color: "hover:text-pink-400", bg: "hover:bg-pink-400/20" },
    { Icon: FaLinkedinIn, href: "#", color: "hover:text-blue-500", bg: "hover:bg-blue-500/20" },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-900 via-[#181A1E] to-black text-white font-[Poppins] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #3b82f6 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%)`
        }} />
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        >
          <FaArrowUp />
        </button>
      )}

      {/* Main Footer Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        
        {/* Newsletter Section */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <HiSparkles className="mx-auto text-4xl text-yellow-400 mb-4 animate-pulse" />
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Stay Connected with PENT SHOP
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join our community and get exclusive deals, early access to new products, and special offers!
            </p>
          </div>
          
          <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
            <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email for 10% off" 
                className="bg-transparent text-white px-6 py-4 outline-none flex-grow placeholder:text-gray-300 text-base"
                required
              />
              <button 
                type="submit"
                disabled={isSubscribing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubscribing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <AiOutlineSend className="text-lg" />
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Support Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <BiSupport className="text-blue-400 text-xl" />
              </div>
              <h3 className="text-xl font-bold">Support Center</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors duration-200 group">
                <FaMapMarkerAlt className="text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-gray-300">Tema Newtown, Ghana</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors duration-200 group">
                <FaEnvelope className="text-green-400 group-hover:scale-110 transition-transform duration-200" />
                <a href="mailto:pentshop@gmail.com" className="text-gray-300 hover:text-white transition-colors duration-200">
                  pentshop@gmail.com
                </a>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors duration-200 group">
                <FaPhone className="text-purple-400 group-hover:scale-110 transition-transform duration-200" />
                <a href="tel:+233559539493" className="text-gray-300 hover:text-white transition-colors duration-200">
                  +233 559 539 493
                </a>
              </div>
            </div>
          </div>

          {/* Account Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <MdAccountCircle className="text-green-400 text-xl" />
              </div>
              <h3 className="text-xl font-bold">My Account</h3>
            </div>
            
            <div className="space-y-3">
              {[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Login / Register", href: "/login" },
                { label: "Shopping Cart", href: "/cart" },
                { label: "Wishlist", href: "/wishlist" },
                { label: "Browse Shop", href: "/shop" }
              ].map((link, index) => (
                <a 
                  key={index}
                  href={link.href} 
                  className="block text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-200 py-2 border-l-2 border-transparent hover:border-blue-400 pl-4"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <MdLink className="text-purple-400 text-xl" />
              </div>
              <h3 className="text-xl font-bold">Quick Links</h3>
            </div>
            
            <div className="space-y-3">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "FAQ & Help", href: "/faq" },
                { label: "Contact Us", href: "/contact" },
                { label: "About Us", href: "/about" }
              ].map((link, index) => (
                <a 
                  key={index}
                  href={link.href} 
                  className="block text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-200 py-2 border-l-2 border-transparent hover:border-purple-400 pl-4"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Download App Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-600/20 rounded-lg">
                <BsDownload className="text-pink-400 text-xl" />
              </div>
              <h3 className="text-xl font-bold">Get Our App</h3>
            </div>
            
            <p className="text-gray-300 mb-4">Download our mobile app for the best shopping experience</p>
            
            <div className="flex items-start gap-4 mb-6">
              <div className="p-2 bg-white/10 rounded-lg">
                <BsQrCode className="text-white text-lg" />
              </div>
              <img src={What} alt="QR Code" className="w-16 h-16 object-contain rounded-lg border border-white/20" />
              <div className="space-y-3">
                <img src={Png} alt="App Store" className="w-28 hover:scale-105 transition-transform duration-200 cursor-pointer" />
                <img src={App} alt="Google Play" className="w-28 hover:scale-105 transition-transform duration-200 cursor-pointer" />
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Follow Us</h4>
              <div className="flex gap-3">
                {socialLinks.map(({ Icon, href, color, bg }, index) => (
                  <a
                    key={index}
                    href={href}
                    className={`p-3 bg-white/10 backdrop-blur-sm rounded-full ${color} ${bg} transition-all duration-300 transform hover:scale-110 border border-white/20`}
                  >
                    <Icon className="text-lg" />
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Divider with gradient */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              PENT SHOP
            </div>
            <div className="hidden md:block w-px h-6 bg-white/20" />
            <p className="text-gray-400 text-sm">
              Empowering communities through faith and commerce
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>© 2024 PENT SHOP. Made with</span>
            <FaHeart className="text-red-400 animate-pulse" />
            <span>All Rights Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;