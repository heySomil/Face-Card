"use client";
import { useEffect, useState } from "react";
import { useInView } from 'react-intersection-observer';

export default function CtaSection() {
  const [isVisible, setIsVisible] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  
  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [inView]);

  return (
    <div ref={ref} className="w-full">
      <div 
        className={`
          relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-800 via-indigo-700 to-purple-800 clean-shadow
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          transition-all duration-1000 ease-out
        `}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -left-10 top-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-xl"></div>
          <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-purple-500/20 blur-2xl"></div>
        </div>
        
        <div className="relative z-10 p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
          <div 
            className={`
              max-w-2xl
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
              transition-all duration-700 ease-out
            `}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">Ready to verify your content?</h2>
            <p className="text-indigo-100 text-lg mb-8">
              Join the Authentica platform today and access cutting-edge verification technologies to protect and authenticate your content.
            </p>
            <div 
              className={`
                flex flex-wrap gap-4
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                transition-all duration-700 ease-out delay-300
              `}
            >
              <button className="rounded-full bg-white text-indigo-700 px-8 py-3 font-medium hover:bg-gray-100 transition-colors shadow-xl">
                Get Started
              </button>
              <button className="rounded-full bg-indigo-600/30 backdrop-blur-sm text-white px-8 py-3 font-medium border border-indigo-400/30 hover:bg-indigo-600/40 transition-all">
                Learn More
              </button>
            </div>
          </div>
          
          <div 
            className={`
              flex-shrink-0
              ${isVisible ? 'opacity-100 translate-y-0 rotate-0' : 'opacity-0 translate-y-10 rotate-6'}
              transition-all duration-1000 ease-out delay-200
            `}
          >
            <div className="relative w-72 h-72 rounded-2xl bg-gradient-to-br from-indigo-600/80 to-indigo-900/80 backdrop-blur-sm flex items-center justify-center p-8 shadow-xl overflow-hidden border border-indigo-500/20">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-purple-500/30 blur-xl"></div>
              <div className="text-center text-white z-10">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-white font-bold text-2xl mb-3">
                  Authentica
                </div>
                <div className="text-indigo-100 text-md">
                  Verifying AI-Generated Content
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 