'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import logo from '../../../public/favicon.png';
import { Search, X } from 'lucide-react';
import { Poppins, Inter } from 'next/font/google';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Font setup
const poppins = Poppins({
    subsets: ['latin'],
    weight: ['600', '700'],
    preload: true,
});

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500'],
    preload: true,
});

// SearchBar Component
function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

    useEffect(() => {
        const query = searchParams.get('q') || '';
        setSearchQuery(query);
    }, [searchParams]);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    const clearSearch = () => {
        setSearchQuery('');
        router.push('/');
    };

    return (
        <div
            className={`w-[160px] sm:w-[220px] md:w-[280px] lg:w-[320px] bg-white rounded-full border ${
                isSearchFocused
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : 'border-gray-300'
            } shadow-sm px-3 py-1.5 flex items-center transition-all duration-200`}
        >
            <Search className='w-4 h-4 text-gray-500' />
            <input
                type='text'
                placeholder='Search...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`ml-2 w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none ${inter.className}`}
                aria-label='Search blog posts'
            />
            {searchQuery && (
                <button
                    onClick={clearSearch}
                    className='ml-2 text-gray-500 hover:text-gray-700 transition-colors'
                    aria-label='Clear search'
                >
                    <X className='w-4 h-4' />
                </button>
            )}
        </div>
    );
}

// Header Component
const Header: React.FC = () => {
    return (
        <header className='bg-gray-50 border-b border-gray-200 w-full px-4 sm:px-8 md:px-16 py-2 sticky top-0 z-50'>
            <div className='w-full flex flex-row items-center justify-between px-4 sm:px-8 md:px-16'>
                {/* Logo */}
                <Link href='/' className='flex items-center gap-0 shrink-0'>
                    <Image
                        src={logo}
                        alt='Student Senior Blog'
                        className='rounded-full'
                        height={50}
                        width={50}
                        priority
                    />
                    <span
                        className={`${poppins.className} text-xl sm:text-2xl text-gray-900 font-semibold`}
                    >
                        Blogs
                    </span>
                </Link>

                {/* Search Bar with Suspense fallback */}
                <Suspense
                    fallback={
                        <div className='w-full max-w-[300px] h-[44px] bg-gray-100 rounded-full animate-pulse' />
                    }
                >
                    <SearchBar />
                </Suspense>
            </div>
        </header>
    );
};

export default Header;
