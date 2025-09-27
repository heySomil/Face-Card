"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
  colorAccent?: string;
}

export default function FeatureCard({ 
  title, 
  description, 
  icon,
  delay = 0,
  colorAccent = 'bg-indigo-600' 
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Generate a unique gradient based on colorAccent
  const gradientClass = colorAccent.includes('indigo') 
    ? 'from-amber-50 to-yellow-50'
    : colorAccent.includes('blue') 
      ? 'from-yellow-50 to-orange-50'
      : colorAccent.includes('purple') 
        ? 'from-purple-50 to-pink-50'
        : 'from-gray-50 to-slate-50';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative p-6 rounded-xl overflow-hidden
        transition-all duration-300 
        border border-gray-100
        ${isHovered ? 'shadow-lg -translate-y-1' : 'shadow-sm'}
        bg-gradient-to-br ${gradientClass}
      `}
    >
      {/* Accent border */}
      <div className={`absolute left-0 top-0 w-1 h-full ${colorAccent} transition-all duration-300 ${isHovered ? 'h-full' : 'h-1/2'}`}></div>
      
      <div className="flex items-start space-x-4">
        {/* Animated icon container */}
        <motion.div
          animate={{
            rotate: isHovered ? [0, -10, 10, -5, 5, 0] : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.5 }}
          className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center
            ${isHovered ? colorAccent + ' text-white' : 'bg-gray-100 text-gray-900'}
            transition-colors duration-300
          `}
        >
          {icon}
        </motion.div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
          <p className="text-gray-600 mb-2">{description}</p>
          
          {/* Animated learn more link */}
          <div className="inline-flex items-center text-black border-b border-transparent transition-all duration-300 hover:border-black mt-2">
            <span className="mr-1">Learn more</span>
            <motion.svg 
              animate={{ x: isHovered ? 5 : 0 }}
              className="w-4 h-4"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </motion.svg>
          </div>
        </div>
      </div>
      
      {/* Background decorative element */}
      <div className={`absolute right-0 bottom-0 w-24 h-24 rounded-tl-3xl -mr-8 -mb-8 opacity-5 ${colorAccent}`}></div>
    </motion.div>
  );
} 