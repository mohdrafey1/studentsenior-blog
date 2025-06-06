"use client";

import React from "react";
import Image from "next/image";
import logo from "../../../public/logo.png";
import { Search } from "lucide-react";
import { Poppins, Inter } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  preload: true,
});

const Header: React.FC = () => {
  return (
    <header className="bg-gray-50 border-b border-gray-200 w-full px-4 sm:px-8 md:px-16 py-4">
      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 ">
          <Image
            src={logo}
            alt="Student Senior Blog"
            className="rounded-full"
            height={40}
            priority
          />
          <span
            className={`${poppins.className} text-xl text-gray-900 font-semibold`}
          >
            SS Blogs
          </span>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-auto bg-white rounded-full border border-gray-300 shadow-sm px-4 py-2 flex items-center focus-within:ring-2 focus-within:ring-blue-500">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            className={`ml-2 w-full sm:w-64 text-base text-gray-900 placeholder-gray-400 bg-transparent outline-none ${inter.className}`}
            aria-label="Search blog posts"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
