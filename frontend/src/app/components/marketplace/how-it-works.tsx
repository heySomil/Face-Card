"use client";
import { useEffect, useState, useRef } from "react";
import { useInView } from 'react-intersection-observer';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

export default function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  // Setup framer-motion scroll animations
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });
  
  // Transform values for parallax effects
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  
  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [inView]);
  
  // Enhanced scroll animation with smoother transitions
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const sectionTop = sectionRef.current.getBoundingClientRect().top;
      const sectionHeight = sectionRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      
      // Calculate how far we've scrolled through the section
      const scrollProgress = Math.max(0, Math.min(1, (windowHeight - sectionTop) / (sectionHeight + windowHeight)));
      
      // Map progress to steps (0-3) with smoother transitions
      if (scrollProgress <= 0.2) setActiveStep(0);
      else if (scrollProgress <= 0.45) setActiveStep(1);
      else if (scrollProgress <= 0.7) setActiveStep(2);
      else setActiveStep(3);
    };
    
    window.addEventListener('scroll', handleScroll);
    // Initial calculation
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const steps = [
    {
      title: "Content Submission",
      description: "Content creator pastes AI-generated content for verification and selects verification type",
      icon: "1",
      partnerName: "World App",
      partnerLogo: "/world_logo.svg",
      bgColor: "from-amber-50 to-yellow-50"
    },
    {
      title: "Payment Processing",
      description: "Service initiates Metal token payment on Base chain for verification services",
      icon: "2",
      partnerName: "Metal",
      partnerLogo: "/metal-logo.svg",
      bgColor: "from-purple-50 to-pink-50"
    },
    {
      title: "Verification Analysis",
      description: "Smart contracts on Rootstock analyze content patterns and authenticity",
      icon: "3",
      partnerName: "Rootstock",
      partnerLogo: "/rootstock-logo.png",
      bgColor: "from-emerald-50 to-cyan-50"
    },
    {
      title: "Results & Credentials",
      description: "Receive detailed report with authenticity score and option to mint credential NFT",
      icon: "4",
      partnerName: "World App",
      partnerLogo: "/world_logo.svg",
      bgColor: "from-amber-50 to-orange-50"
    }
  ];

  return (
    <div ref={ref} className="w-full relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center mb-24 relative z-10"
      >
        <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900">How It Works</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Our streamlined verification process leverages blockchain technology for secure, transparent content verification.
        </p>
      </motion.div>

      <div ref={sectionRef} className="relative pb-36 min-h-[1500px]">
        {/* Centered fixed-width container for better alignment */}
        <div className="absolute left-0 right-0 mx-auto h-full" style={{ width: "1.5px" }}>
          {/* Animated vertical timeline line */}
          <motion.div 
            className="absolute h-full w-full bg-gray-200 rounded-full"
            style={{ 
              background: "linear-gradient(to bottom, #000, #666)",
              height: "100%"
            }}
          />
        </div>
        
        {/* Moving dot that animates between steps */}
        <motion.div 
          className="absolute w-7 h-7 rounded-full bg-black z-20 shadow-lg"
          style={{ 
            top: `calc(${activeStep * 25}% + 7.5rem)`,
            left: "50%",
            marginLeft: "-3.5px",
            boxShadow: '0 0 20px rgba(0,0,0,0.3)'
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Inner pulse animation */}
          <motion.div
            className="absolute inset-0 rounded-full bg-black"
            animate={{ 
              scale: [1, 1.8, 1],
              opacity: [1, 0, 1]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
        
        {/* Steps */}
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          const isLeft = index % 2 === 0;
          
          return (
            <div 
              key={index}
              className={`
                relative
                transition-all duration-700 ease-out
              `}
              style={{ 
                top: `${index * 25}%`,
                position: 'absolute',
                width: '100%',
                paddingTop: '2rem',
                paddingBottom: '2rem',
              }}
            >
              <div className={`
                flex items-center
                ${isLeft ? 'justify-end pr-[52%] pl-4' : 'justify-start pl-[52%] pr-4'}
              `}>
                <motion.div 
                  initial={{ opacity: 0, x: isLeft ? 50 : -50 }}
                  animate={isVisible ? { 
                    opacity: 1, 
                    x: 0,
                    scale: isActive ? 1.05 : 1,
                    y: isActive ? -5 : 0,
                  } : { opacity: 0, x: isLeft ? 50 : -50 }}
                  transition={{ 
                    duration: 0.7, 
                    delay: index * 0.15,
                    ease: "easeOut"
                  }}
                  className={`
                    max-w-md bg-gradient-to-br ${step.bgColor} rounded-xl p-8 
                    border border-gray-200 shadow-md
                    ${isActive ? 'border-black shadow-xl' : ''}
                    transition-all duration-500
                  `}
                >
                  <div className={`flex items-start ${isLeft ? 'justify-end' : ''} gap-5`}>
                    <div className={`order-${isLeft ? '2' : '1'} flex-shrink-0`}>
                      <motion.div 
                        className={`
                          w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold
                          ${isActive ? 'bg-black text-white' : 'bg-white text-gray-700 border border-gray-200'}
                          transition-all duration-300 shadow-md
                        `}
                        animate={isActive ? {
                          scale: [1, 1.1, 1],
                          rotate: [0, -5, 5, 0],
                        } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {step.icon}
                      </motion.div>
                    </div>
                    
                    <div className={`order-${isLeft ? '1' : '2'} ${isLeft ? 'text-right' : 'text-left'}`}>
                      <motion.h3 
                        className={`
                          text-2xl font-semibold mb-3 
                          ${isActive ? 'text-black' : 'text-gray-800'}
                          transition-colors duration-300
                        `}
                        animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {step.title}
                      </motion.h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                      
                      {step.partnerName && (
                        <div className={`flex items-center ${isLeft ? 'justify-end' : 'justify-start'} text-sm`}>
                          <span className="text-gray-500 mr-2">Powered by:</span>
                          <motion.div 
                            className="flex items-center"
                            animate={isActive ? {
                              x: [0, isLeft ? -3 : 3, 0],
                            } : {}}
                            transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
                          >
                            {step.partnerLogo ? (
                              <img 
                                src={step.partnerLogo} 
                                alt={step.partnerName} 
                                className="w-16 h-10 mr-2 bg-white p-1 border border-gray-100 shadow-sm object-contain" 
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-300 mr-1"></div>
                            )}
                            <span className="font-medium text-black">{step.partnerName}</span>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Connecting dot */}
              <motion.div 
                className={`
                  absolute top-[7.5rem]
                  w-7 h-7 rounded-full border-3 border-white
                  ${isActive ? 'bg-black' : 'bg-gray-300'}
                  transition-all duration-300 z-10
                `}
                style={{
                  left: "50%",
                  marginLeft: "-3.5px"
                }}
                animate={isActive ? {
                  scale: [1, 1.3, 1],
                  boxShadow: ['0 0 0 0 rgba(0,0,0,0)', '0 0 0 5px rgba(0,0,0,0.1)', '0 0 0 0 rgba(0,0,0,0)']
                } : {}}
                transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
              />
            </div>
          );
        })}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.6 }}
        className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-8 mt-16 text-center shadow-md relative overflow-hidden border border-gray-200"
      >
        <h3 className="text-xl font-semibold mb-4 text-black">Want to learn more about our verification process?</h3>
        <motion.a 
          href="#" 
          className="text-black inline-flex items-center border-b border-black pb-0.5 hover:pb-1 transition-all"
          whileHover={{ x: 5 }}
        >
          Read our technical whitepaper
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </motion.a>
      </motion.div>
    </div>
  );
} 