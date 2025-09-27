"use client";

import { useState, useEffect } from "react";
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';

export default function ProviderSection() {
  const [activeTab, setActiveTab] = useState("accuracy");
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [inView]);
  
  const providers = [
    {
      id: "realtext",
      name: "RealText Systems",
      logo: "/images/provider-logos/realtext.svg", // Placeholder path
      logoText: "R",
      logoColor: "#4F46E5", // indigo
      logoBackground: "bg-indigo-600",
      accuracy: 99.2,
      speed: 3.4,
      price: 4.5,
      specialty: "Technical Documentation",
      specialtyIcon: "📄",
      description: "Highest accuracy for technical documentation verification",
      isPopular: true,
    },
    {
      id: "verifyai",
      name: "VerifyAI Labs",
      logo: "/images/provider-logos/verifyai.svg", // Placeholder path
      logoText: "V",
      logoColor: "#0EA5E9", // sky blue
      logoBackground: "bg-sky-500",
      accuracy: 98.7,
      speed: 1.2,
      price: 2.5,
      specialty: "Academic Papers",
      specialtyIcon: "🎓",
      description: "Cutting edge language pattern recognition with specialized academic focus",
      isPopular: true,
    },
    {
      id: "truecontent",
      name: "TrueContent",
      logo: "/images/provider-logos/truecontent.svg", // Placeholder path
      logoText: "T",
      logoColor: "#000000", // black
      logoBackground: "bg-black",
      accuracy: 97.5,
      speed: 0.8,
      price: 3.8,
      specialty: "News Articles",
      specialtyIcon: "📰",
      description: "Industry standard for news verification with real-time fact checking",
      isPopular: false,
    },
    {
      id: "authenticheck",
      name: "AuthentiCheck",
      logo: "/images/provider-logos/authenticheck.svg", // Placeholder path
      logoText: "A",
      logoColor: "#9333EA", // purple
      logoBackground: "bg-purple-600",
      accuracy: 96.9,
      speed: 2.5,
      price: 1.7,
      specialty: "Creative Writing",
      specialtyIcon: "✍️",
      description: "Specialized in creative content with stylistic analysis",
      isPopular: false,
    }
  ];
  
  // Sort providers based on active tab
  const sortedProviders = [...providers].sort((a, b) => {
    if (activeTab === "accuracy") return b.accuracy - a.accuracy;
    if (activeTab === "speed") return a.speed - b.speed;
    if (activeTab === "price") return a.price - b.price;
    return 0;
  });
  
  // Function to render metric bars
  const renderMetricBar = (value: number, maxValue: number, color: string) => {
    const percentage = (value / maxValue) * 100;
    return (
      <div className="ml-2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };
  
  return (
    <div ref={ref} className="w-full">
      <div 
        className={`
          text-center mb-16
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          transition-all duration-700 ease-out
        `}
      >
        <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900">Verification Providers</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Our marketplace creates healthy competition between verification algorithm providers, delivering better results for users.
        </p>
      </div>
      
      {/* Sort Controls */}
      <div 
        className={`
          mb-12
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          transition-all duration-700 ease-out delay-200
        `}
      >
        <div className="flex justify-center">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            {["accuracy", "speed", "price"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab 
                    ? "bg-black text-white shadow-md" 
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Sort by {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Apple-style product comparison grid with enhanced styles */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="rounded-2xl overflow-hidden shadow-xl border border-gray-200"
      >
        <div className="relative">
          {/* Header row */}
          <div className="grid grid-cols-5 border-b border-gray-200">
            <div className="bg-white p-6 rounded-tl-xl"></div>
            {sortedProviders.map((provider, index) => (
              <div 
                key={`header-${provider.name}`} 
                className={`bg-white p-4 text-center border-l border-gray-200 relative
                  ${index === sortedProviders.length - 1 ? 'rounded-tr-xl' : ''}
                `}
                onMouseEnter={() => setHoveredRow(provider.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div className="h-16 flex items-center justify-center mt-4">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className={`w-12 h-12 rounded-full ${provider.logoBackground} flex items-center justify-center text-white font-bold text-lg shadow-md`}
                  >
                    {provider.logoText}
                  </motion.div>
                </div>
                <h3 className="text-base font-semibold mt-2 mb-1 text-black">{provider.name}</h3>
                <p className="text-xs text-gray-600 line-clamp-1">{provider.specialty}</p>
              </div>
            ))}
          </div>
          
          {/* Accuracy row */}
          <div className={`grid grid-cols-5 border-b border-gray-200 bg-gray-50`}>
            <div className="p-6 flex items-center font-medium text-black">
              <span>Accuracy</span>
            </div>
            {sortedProviders.map((provider) => (
              <div 
                key={`accuracy-${provider.name}`} 
                className={`p-6 text-center border-l border-gray-200 transition-colors duration-200
                  ${hoveredRow === provider.id ? 'bg-gray-100' : 'bg-gray-50'}
                `}
                onMouseEnter={() => setHoveredRow(provider.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div className="flex items-center justify-center">
                  <span className="text-xl font-medium text-black">{provider.accuracy}%</span>
                  {renderMetricBar(provider.accuracy, 100, provider.logoBackground)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Speed row */}
          <div className="grid grid-cols-5 border-b border-gray-200 bg-white">
            <div className="p-6 flex items-center font-medium text-black">
              <span>Speed</span>
            </div>
            {sortedProviders.map((provider) => (
              <div 
                key={`speed-${provider.name}`} 
                className={`p-6 text-center border-l border-gray-200 transition-colors duration-200
                  ${hoveredRow === provider.id ? 'bg-gray-100' : 'bg-white'}
                `}
                onMouseEnter={() => setHoveredRow(provider.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div className="flex items-center justify-center">
                  <span className="text-xl font-medium text-black">{provider.speed}s</span>
                  {/* Lower is better for speed */}
                  {renderMetricBar(4 - provider.speed, 4, provider.logoBackground)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Price row */}
          <div className="grid grid-cols-5 border-b border-gray-200 bg-gray-50">
            <div className="p-6 flex items-center font-medium text-black">
              <span>Price per check</span>
            </div>
            {sortedProviders.map((provider) => (
              <div 
                key={`price-${provider.name}`} 
                className={`p-6 text-center border-l border-gray-200 transition-colors duration-200
                  ${hoveredRow === provider.id ? 'bg-gray-100' : 'bg-gray-50'}
                `}
                onMouseEnter={() => setHoveredRow(provider.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div className="flex items-center justify-center">
                  <span className="text-xl font-medium text-black">${provider.price}</span>
                  {/* Lower is better for price */}
                  {renderMetricBar(5 - provider.price, 5, provider.logoBackground)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Specialty row */}
          <div className="grid grid-cols-5 border-b border-gray-200 bg-white">
            <div className="p-6 flex items-center font-medium text-black">
              <span>Specialty</span>
            </div>
            {sortedProviders.map((provider) => (
              <div 
                key={`specialty-${provider.name}`} 
                className={`p-6 text-center border-l border-gray-200 transition-colors duration-200
                  ${hoveredRow === provider.id ? 'bg-gray-100' : 'bg-white'}
                `}
                onMouseEnter={() => setHoveredRow(provider.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div className="flex items-center justify-center">
                  <span className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm
                    border border-gray-200 shadow-sm
                    ${hoveredRow === provider.id ? provider.logoBackground + ' text-white' : 'bg-white text-gray-800'}
                    transition-colors duration-300
                  `}>
                    <span className="mr-1">{provider.specialtyIcon}</span>
                    {provider.specialty}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Button row */}
          <div className="grid grid-cols-5">
            <div className="bg-white p-6 rounded-bl-xl flex items-center">
              <span className="font-medium text-black opacity-0">Action</span>
            </div>
            {sortedProviders.map((provider, index) => (
              <div 
                key={`button-${provider.name}`} 
                className={`p-6 text-center border-l border-gray-200 transition-colors duration-200
                  ${hoveredRow === provider.id ? 'bg-gray-100' : 'bg-white'}
                  ${index === sortedProviders.length - 1 ? 'rounded-br-xl' : ''}
                `}
                onMouseEnter={() => setHoveredRow(provider.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    py-2 px-5 text-sm font-medium rounded-full shadow-md
                    transition-colors duration-300
                    ${hoveredRow === provider.id ? provider.logoBackground + ' text-white' : 'bg-black text-white'}
                  `}
                >
                  Select Provider
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Compare all providers button */}
      <div 
        className={`
          text-center mt-8
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          transition-all duration-700 ease-out delay-500
        `}
      >
        <motion.a 
          href="#" 
          className="inline-flex items-center text-black border-b border-black pb-0.5 hover:pb-1 transition-all"
          whileHover={{ x: 5 }}
        >
          Compare all providers
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </motion.a>
      </div>
    </div>
  );
} 