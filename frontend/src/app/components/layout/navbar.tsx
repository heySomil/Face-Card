"use client";

import Link from "next/link";
import Image from "next/image";
import useScroll from "@/app/lib/hooks/use-scroll";

export default function NavBar() {
  const scrolled = useScroll(50);

  return (
    <>
      <div
        className={`fixed top-0 flex w-full justify-center ${
          scrolled
            ? "border-b border-gray-200 bg-white/40 backdrop-blur-md"
            : "bg-transparent"
        } z-30 transition-all duration-300`}
      >
        <div className="mx-5 flex h-16 w-full max-w-screen-xl items-center justify-between">
          <Link href="/" className="flex items-center mt-1 relative">
            <div className="relative w-[160px] h-[40px]">
              <object 
                data="/paywiser-logo.svg" 
                type="image/svg+xml"
                className="w-full h-full pointer-events-none"
                aria-label="PayWiser logo"
              />
              <div className="absolute inset-0 cursor-pointer" aria-hidden="true"></div>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/user"
              className="flex items-center justify-center rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm px-5 py-1.5 text-sm font-medium text-gray-800 shadow-sm transition-all duration-300 hover:border-gray-800 hover:bg-white h-[40px] mt-1"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              User
            </Link>
            <Link
              href="/merchant"
              className="flex items-center justify-center rounded-full border border-indigo-300 bg-indigo-600 backdrop-blur-sm px-5 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-700 h-[40px] mt-1"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
              </svg>
              Merchant
            </Link>
          </div>
        </div>
      </div>
      
      {/* Additional transparent gradient to help transition */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-white/90 to-transparent pointer-events-none z-20" />
    </>
  );
}