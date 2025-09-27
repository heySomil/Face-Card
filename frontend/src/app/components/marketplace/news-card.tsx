"use client";
import { useEffect, useState } from "react";

interface NewsCardProps {
  title: string;
  source: string;
  date: string;
  summary: string;
  imageUrl: string;
  delay?: number;
}

export default function NewsCard({ 
  title, 
  source, 
  date, 
  summary, 
  imageUrl,
  delay = 0 
}: NewsCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Source badge color
  function getSourceColor(sourceName: string): string {
    if (sourceName === "Nature") return "bg-green-600";
    if (sourceName === "Reuters") return "bg-amber-600";
    if (sourceName === "The Guardian") return "bg-orange-600";
    return "bg-gray-600";
  }
  
  return (
    <div 
      className={`
        bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all
        ${isVisible ? 'opacity-100' : 'opacity-0'} 
        transition-all duration-700 ease-out
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Image container with proper aspect ratio */}
      <div className="relative w-full pt-[56.25%] bg-gray-100"> {/* 16:9 aspect ratio */}
        <img 
          src={imageUrl || `https://placehold.co/800x450/e9e9e9/808080?text=${encodeURIComponent(source)}`}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Source badge */}
        <div className="absolute bottom-3 left-3 flex items-center">
          <div className={`${getSourceColor(source)} text-white text-xs font-medium px-2 py-1 rounded`}>
            {source}
          </div>
          <div className="ml-2 text-xs font-medium text-white bg-black/60 px-2 py-1 rounded">
            {date}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-3 text-black">{title}</h3>
        <p className="text-gray-600 text-sm">{summary}</p>
      </div>
      
      <div className="px-6 pb-4">
        <a href="#" className="text-black inline-flex items-center text-sm border-b border-black pb-0.5">
          Read full article
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
} 