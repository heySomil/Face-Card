"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MarketplaceHero() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center overflow-hidden pt-28 pb-20 md:pt-32 md:pb-28">
      {/* Enhanced background elements that better match the main layout gradient */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Removed static blur elements and replaced with animated ones */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 1.5 }}
          className="absolute top-[15%] -left-[5%] w-[45%] h-[45%] rounded-full bg-amber-300/20 blur-[70px]"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.12 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute top-1/3 right-[5%] w-[35%] h-[35%] rounded-full bg-orange-300/20 blur-[80px]"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1.5, delay: 0.6 }}
          className="absolute bottom-[10%] left-1/3 w-[40%] h-[40%] rounded-full bg-yellow-300/20 blur-[90px]"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 max-w-6xl text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-8"
        >
          Verification <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-yellow-600 font-extrabold">Marketplace</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12"
        >
          A platform for content creators and verification providers to verify AI-generated content and protect authentic human creations.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "#b45309" }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-amber-600 px-8 py-4 text-white font-medium transition-all duration-300 shadow-lg"
          >
            Verify Content
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, borderColor: "#d97706" }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-white/80 backdrop-blur-sm px-8 py-4 text-gray-900 font-medium border border-gray-200 transition-all duration-300 shadow-md"
          >
            Explore Providers
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
} 