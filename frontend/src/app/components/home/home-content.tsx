"use client";

import { Github } from "@/app/components/shared/icons";
import { nFormatter } from "@/app/lib/utils";
import { useEffect, useState } from "react";
import Link from "next/link";

interface HomeContentProps {
  stars: number;
  deployUrl: string;
}

export default function HomeContent({ stars, deployUrl }: HomeContentProps) {
  const [mounted, setMounted] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Show description after a delay
    const timer = setTimeout(() => {
      setShowDescription(true);
    }, 3200); // Slightly longer than title animation
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-96px)] w-full">
      <div className="z-10 w-full max-w-3xl px-5 xl:px-0 text-center transform -translate-y-8">
        <h1 
          className={`
            font-display font-bold tracking-[-0.02em] text-gray-900 leading-tight mb-6
            text-5xl md:text-7xl
            ${mounted ? 'animate-title-slow' : 'opacity-0'}
          `}
        >
          The future of payments
          <br className="hidden sm:inline" />
          is here.
          <span className="text-gray-900 animate-cursor">|</span>
        </h1>
        
        <p 
          className={`
            mt-6 text-gray-600 md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto
            transition-all duration-1000 ease-in-out
            ${showDescription ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}
          `}
        >
          Powered by Yellow Network, Wormhole cross-chain protocol, Walrus decentralized storage, Seal privacy technology, and Nautilus infrastructure - delivering secure, seamless biometric payments.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Link
            className="flex items-center justify-center rounded-full border border-indigo-600 bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-indigo-700 hover:border-indigo-700 shadow-sm hover:shadow-md"
            href="/user"
          >
            <svg
              className="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Start as User
          </Link>
          <Link
            className="flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-300 hover:border-gray-800 hover:shadow-md"
            href="/merchant"
          >
            <svg
              className="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Merchant Portal
          </Link>
        </div>
      </div>
    </div>
  );
} 