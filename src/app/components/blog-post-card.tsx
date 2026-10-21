'use client';

import React from 'react';
import { Share2, User, Clock } from 'lucide-react';
import { Poppins, Inter } from 'next/font/google';
import { formatDate, getReadTime } from '@/utils/formatting';
import { optimizeCloudinaryUrl } from '@/utils/cloudinary';
import Image from 'next/image';

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

export interface BlogPostCardProps {
    post: {
        _id: string;
        slug: string;
        title: string;
        banner?: string;
        description?: string;
        content?: string;
        tags?: string[];
        author?: string;
        total_likes?: number;
        total_reads?: number;
        isDraft?: boolean;
        updatedAt?: string;
        createdAt?: string;
    };
    isLiked?: boolean;
    onClick?: () => void;
    onLike?: () => void;
    onShare?: () => void;
    ariaLabel?: string;
    priority?: boolean;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({
    post,
    onClick,
    onShare,
    ariaLabel,
    priority,
}) => {
    const handleKeyDown = (event: React.KeyboardEvent, action?: () => void) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action?.();
        }
    };

    const formattedDate = formatDate(post.createdAt);

    return (
        // <Link key={post._id} href={`/blog/post/${post.slug}`} className='block'>
        <article
            className='group bg-white cursor-pointer border border-slate-100 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-0.5 flex flex-col sm:flex-row h-full relative'
            onClick={onClick}
            onKeyDown={(e) => handleKeyDown(e, onClick)}
            tabIndex={onClick ? 0 : undefined}
            role={onClick ? 'button' : 'article'}
            aria-label={ariaLabel || `Blog post: ${post.title}`}
        >
            {post.banner && (
                <div className='w-full sm:w-36 md:w-48 h-40 sm:h-auto relative flex-shrink-0 overflow-hidden'>
                    <div className='absolute inset-0 bg-slate-50' />
                    <Image
                        src={optimizeCloudinaryUrl(
                            post.banner || '',
                            'f_auto,q_auto,c_fill,w_300,dpr_auto'
                        )}
                        fill
                        alt={`Cover image for ${post.title}`}
                        className='object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105'
                        loading={priority ? 'eager' : 'lazy'}
                        sizes='(max-width: 640px) 100vw, 200px'
                        decoding='async'
                        unoptimized
                    />
                </div>
            )}

            <div className='p-4 sm:p-5 flex flex-col flex-grow w-full bg-white relative'>
                {post.tags && post.tags.length > 0 && (
                    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-blue-600 bg-blue-50 uppercase tracking-wider mb-2 w-fit'>
                        {post.tags[0]}
                    </span>
                )}

                <h2
                    className={`text-lg sm:text-xl font-bold text-slate-900 mb-1.5 leading-tight tracking-tight transition-colors duration-200 group-hover:text-blue-600 ${poppins.className}`}
                >
                    {post.title}
                </h2>

                {post.description && (
                    <p
                        className={`text-slate-600 mb-4 text-sm leading-relaxed line-clamp-2 ${inter.className}`}
                    >
                        {post.description}
                    </p>
                )}

                <div className='flex items-center gap-2 mt-auto'>
                    <div className='w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200/60'>
                        <User className='h-3.5 w-3.5 text-slate-500' />
                    </div>
                    <div className='flex flex-col'>
                        <div className='flex items-center text-xs text-slate-600 gap-1.5 flex-wrap'>
                            <span className='font-semibold text-slate-900'>
                                {post.author}
                            </span>
                            <span className='text-slate-300'>•</span>
                            <time dateTime={post.updatedAt}>
                                {formattedDate}
                            </time>
                            <span className='text-slate-300'>•</span>
                            <div className='flex items-center gap-1'>
                                <Clock className='w-3 h-3' />
                                <span>{getReadTime(post.content)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onShare?.();
                    }}
                    className='absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    aria-label='Share this post'
                >
                    <Share2 className='w-4 h-4' />
                </button>
            </div>
        </article>
        // </Link>
    );
};

export default BlogPostCard;
