"use client";
import { useEffect, useState } from "react";
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function NFTCredential() {
  const [isVisible, setIsVisible] = useState(false);
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

  return (
    <div ref={ref} className="relative z-10 max-w-6xl mx-auto text-white py-12">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            NFT Credentials for Human Creation
          </h2>
          <p className="text-lg md:text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed">
            Protect your authentic human-created content with blockchain-backed NFT credentials
          </p>
        </motion.div>
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* NFT Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full lg:w-2/5"
          >
            <div className="perspective-card mx-auto max-w-sm">
              <div className="nft-card relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-black/10 z-10"></div>
                
                {/* NFT Interior Elements */}
                <div className="absolute inset-0 flex flex-col p-6 z-20">
                  {/* Certificate Header */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-indigo-200 uppercase tracking-wider mb-1">Authentica</div>
                    <div className="text-lg font-bold text-white">Human Creation Certificate</div>
                  </div>
                  
                  {/* Certificate Badge/Emblem */}
                  <div className="flex-grow flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm p-4 flex items-center justify-center">
                        <svg className="w-16 h-16 text-white animate-spin-slow" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90C72.0914 90 90 72.0914 90 50C90 27.9086 72.0914 10 50 10Z" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" />
                          <path d="M65 36.25L45 56.25L35 46.25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      
                      {/* Glowing orb in the center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 blur-sm"></div>
                        <div className="absolute w-8 h-8 rounded-full bg-white/80 blur-sm"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Certificate Details */}
                  <div className="mt-4">
                    <div className="text-xs font-medium text-indigo-200 mb-1">Verification Score</div>
                    <div className="text-2xl font-bold text-white mb-2">98.7%</div>
                    <div className="flex justify-between mb-2">
                      <div>
                        <div className="text-xs font-medium text-indigo-200 mb-1">Verification Method</div>
                        <div className="text-sm font-medium text-white">Neural Watermarking</div>
                      </div>
                      <div className="border-l border-white/10 pl-2">
                        <div className="text-xs font-medium text-indigo-200 mb-1">Provider</div>
                        <div className="text-sm font-medium text-white">Authentica</div>
                      </div>
                    </div>
                    <div className="text-xs text-indigo-200 pt-2 border-t border-white/10">
                      <span className="inline-block w-16 overflow-hidden text-ellipsis">0x7f9c...</span> • Apr 2023
                    </div>
                  </div>
                </div>
                
                {/* Holographic effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20"></div>
                
                {/* Background patterns */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Benefits section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full lg:w-3/5"
          >
            <h3 className="text-2xl font-bold mb-6 text-center lg:text-left text-indigo-200">Benefits of NFT Credentials</h3>
            <p className="text-indigo-100 mb-8 text-center lg:text-left leading-relaxed">
              When human-created content is verified with a confidence score above 95%, 
              creators can mint an NFT credential as proof of authenticity.
            </p>
            <div className="space-y-6 mb-8">
              {[
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
                  title: "Verifiable Proof of Human Creation",
                  description: "Blockchain-based verification provides indisputable evidence that your content was created by a human, not AI."
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
                  title: "Protect Intellectual Property",
                  description: "Establish clear ownership and provenance for your creative works, preventing unauthorized AI-generated replicas."
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
                  title: "Seamless Sharing & Embedding",
                  description: "Easily share your verification credentials across platforms or embed them directly into your website or portfolio."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.6 + (index * 0.15) }}
                  className="flex items-start gap-4 group"
                >
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      {item.icon}
                    </svg>
                  </motion.div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">{item.title}</h4>
                    <p className="text-indigo-100 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 font-medium shadow-lg hover:shadow-indigo-500/20"
              >
                Mint Your NFT
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="rounded-full bg-indigo-600/30 backdrop-blur-sm text-white px-8 py-4 font-medium border border-indigo-400/30 hover:bg-indigo-600/40"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Add this to your CSS file (animations.css)
// .perspective-card {
//   perspective: 1000px;
// }
// 
// .nft-card {
//   transform-style: preserve-3d;
//   transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
// }
// 
// .nft-card:hover {
//   transform: rotateY(8deg) rotateX(5deg);
// }
// 
// @keyframes spin-slow {
//   from {
//     transform: rotate(0deg);
//   }
//   to {
//     transform: rotate(360deg);
//   }
// }
// 
// .animate-spin-slow {
//   animation: spin-slow 12s linear infinite;
// } 