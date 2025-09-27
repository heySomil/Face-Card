"use client";

import React, { useState, useEffect, useRef } from "react";

interface TypewriterProps {
  text: string;
  delay?: number;
}

export default function TypewriterComponent({ text, delay = 50 }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const typeNextCharacter = (index: number) => {
      if (!isMounted) return;
      
      if (index <= text.length) {
        setDisplayedText(text.substring(0, index));
        
        const randomDelay = delay * (0.8 + Math.random() * 0.5); // Natural typing variation
        
        timeoutId = setTimeout(() => {
          typeNextCharacter(index + 1);
        }, index === text.length ? 1000 : randomDelay);
      } else {
        setIsTyping(false);
      }
    };
    
    typeNextCharacter(0);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [text, delay]);
  
  // Blink the cursor only after typing is complete
  useEffect(() => {
    if (!isTyping && cursorRef.current) {
      const cursorElement = cursorRef.current;
      const interval = setInterval(() => {
        cursorElement.style.opacity = cursorElement.style.opacity === "0" ? "1" : "0";
      }, 530);
      
      return () => clearInterval(interval);
    }
  }, [isTyping]);

  return (
    <span className="inline-block relative">
      {displayedText}
      <span 
        ref={cursorRef}
        className={`
          inline-block w-[3px] h-[1em] 
          bg-black ml-0.5 align-middle
          ${isTyping ? "opacity-100" : "transition-opacity duration-530"}
        `}
        style={{ 
          transform: "translateY(-5%)"
        }}
      />
    </span>
  );
} 