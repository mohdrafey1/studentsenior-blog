"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import logo from "../../../public/image192.png";
import { Search, X } from "lucide-react";
import { Poppins, Inter } from "next/font/google";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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

// Search component that uses client-side functionality
function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

    // Initialize search query from URL params
    useEffect(() => {
        const query = searchParams.get("q") || "";
        setSearchQuery(query);
    }, [searchParams]);

    // Handle search submission
    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/blog/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    // Handle Enter key press
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery("");
        router.push("/");
    };

    return (
        <div
            className={`w-full sm:w-auto bg-white rounded-full border ${
                isSearchFocused
                    ? "border-blue-500 ring-2 ring-blue-500"
                    : "border-gray-300"
            } shadow-sm px-4 py-2 flex items-center transition-all duration-200`}
        >
            <Search className="w-5 h-5 text-gray-500" />
            <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`ml-2 w-full sm:w-64 text-base text-gray-900 placeholder-gray-400 bg-transparent outline-none ${inter.className}`}
                aria-label="Search blog posts"
            />
            {searchQuery && (
                <button
                    onClick={clearSearch}
                    className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Clear search"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}

// Main header component
const Header: React.FC = () => {
    return (
        <header className="bg-gray-50 border-b border-gray-200 w-full px-4 sm:px-8 md:px-16 py-2 sticky top-0 z-50">
            <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
                {/* Logo */}
                <Link href={`/`}>
                    <div className="flex items-center">
                        <Image
                            src={logo}
                            alt="Student Senior Blog"
                            className="rounded-full"
                            height={60}
                            priority
                        />
                        <span
                            className={`${poppins.className} text-2xl text-gray-900 font-semibold`}
                        >
                            Blogs
                        </span>
                    </div>
                </Link>

                {/* Search Bar with Suspense */}
                <Suspense
                    fallback={
                        <div className="w-full sm:w-[320px] h-[44px] bg-gray-100 rounded-full animate-pulse" />
                    }
                >
                    <SearchBar />
                </Suspense>
            </div>
        </header>
    );
};

export default Header;
