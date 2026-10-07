'use client';
import { analytics } from '@/analytics';
import { SearchTracker } from '@/analytics/search';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar } from 'lucide-react';
import Header from '@/app/components/header';
import Footer from '@/app/components/Footer';
import { Poppins } from 'next/font/google';
import { api } from '@/config/apiConfig';
import { BlogPost } from '@/constant/interface';
import { formatDate } from '@/utils/formatting';
import { optimizeCloudinaryUrl } from '@/utils/cloudinary';

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '600'],
    preload: true,
});

// Separate the search results content into a client component
function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const requestedPage = Number(searchParams.get('page'));
    const page =
        Number.isSafeInteger(requestedPage) && requestedPage > 0
            ? requestedPage
            : 1;
    const [retry, setRetry] = useState(0);
    const pageSize = 20;
    const tracker = useRef(new SearchTracker());
    tracker.current.update(query);
    const [searchResults, setSearchResults] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const fetchSearchResults = async () => {
            if (!query.trim()) {
                setSearchResults([]);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch(
                    `${api.blog.search}?q=${encodeURIComponent(query)}&page=${page}&limit=${pageSize}`,
                    { signal: controller.signal },
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch search results');
                }

                const data = await response.json();
                if (data.success !== true || !Array.isArray(data.data))
                    throw new Error('Unexpected search response');
                setSearchResults(data.data);
                if (!controller.signal.aborted) {
                    const props = tracker.current.settleFirstPage(query, page);
                    if (props)
                        analytics.track('search', { scope: 'blog', ...props });
                }
            } catch {
                if (controller.signal.aborted) return;
                console.error('Search request failed');
                setError('Failed to load search results. Please try again.');
                setSearchResults([]);
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };

        fetchSearchResults();
        return () => controller.abort();
    }, [query, page, retry]);

    return (
        <div className='mb-8'>
            <Link
                href='/'
                className='inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-all duration-300 hover:gap-3 group'
            >
                <ArrowLeft className='w-4 h-4 transition-transform group-hover:-translate-x-1' />
                <span className='font-medium'>Back to Blog</span>
            </Link>

            <h1
                className={`text-2xl sm:text-3xl font-bold mt-4 mb-6 ${poppins.className}`}
            >
                Search Results for:{' '}
                <span className='text-blue-600'>&quot;{query}&quot;</span>
            </h1>

            {isLoading && (
                <div className='flex justify-center items-center py-12'>
                    <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
                </div>
            )}

            {error && (
                <div className='bg-red-50 border-l-4 border-red-500 p-4 mb-6'>
                    <p className='text-red-700' role='alert'>
                        {error}
                    </p>
                    <button
                        type='button'
                        className='mt-2 rounded border px-3 py-2'
                        onClick={() => setRetry((value) => value + 1)}
                    >
                        Try again
                    </button>
                </div>
            )}

            {!isLoading &&
                searchResults.length === 0 &&
                query.trim() &&
                !error && (
                    <div className='bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded'>
                        <p className='text-blue-800'>
                            No results found for your search.
                        </p>
                    </div>
                )}

            {!isLoading && !query.trim() && (
                <div className='bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded'>
                    <p className='text-yellow-800'>
                        Enter a search term to find posts.
                    </p>
                </div>
            )}

            {!isLoading && !error && query.trim() && (
                <nav
                    aria-label='Search result pages'
                    className='mb-6 flex items-center gap-4'
                >
                    {page > 1 && (
                        <Link
                            href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
                            className='rounded border px-3 py-2'
                        >
                            Previous
                        </Link>
                    )}
                    <span>Page {page}</span>
                    {searchResults.length === pageSize && (
                        <Link
                            href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
                            className='rounded border px-3 py-2'
                        >
                            Next
                        </Link>
                    )}
                </nav>
            )}
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {searchResults.map((post) => (
                    <Link
                        prefetch={false}
                        key={post._id}
                        href={`/${post.slug}`}
                        className='group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300'
                    >
                        {post.banner && (
                            <div className='relative h-48 w-full overflow-hidden'>
                                <Image
                                    src={optimizeCloudinaryUrl(
                                        post.banner || '',
                                        'f_auto,q_auto,c_fill,w_300,dpr_auto',
                                    )}
                                    alt={post.title}
                                    fill
                                    className='object-cover group-hover:scale-105 transition-transform duration-500'
                                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                                    unoptimized
                                />
                            </div>
                        )}
                        <div className='p-6'>
                            <h2 className='text-xl font-semibold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors'>
                                {post.title}
                            </h2>
                            {post.description && (
                                <p className='text-gray-600 mb-4 line-clamp-2'>
                                    {post.description}
                                </p>
                            )}
                            <div className='flex flex-wrap items-center gap-4 text-sm text-gray-500'>
                                {post.createdAt && (
                                    <div className='flex items-center gap-1'>
                                        <Calendar className='w-4 h-4' />
                                        <span>
                                            {formatDate(post.createdAt)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// Main page component with Suspense boundary
export default function SearchResultsPage() {
    return (
        <>
            <Header />
            <main className='min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                    <Suspense
                        fallback={
                            <div className='flex justify-center items-center py-12'>
                                <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
                            </div>
                        }
                    >
                        <SearchResults />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </>
    );
}
