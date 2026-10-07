'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { BlogPost } from '@/constant/interface';
import BlogPostCard from './blog-post-card';
import ClientAd from './Ads/AdsClient';

export default function BlogPostList({
    posts,
    currentPage,
}: {
    posts: BlogPost[];
    currentPage: number;
}) {
    const router = useRouter();

    const handlePostClick = (slug: string) => {
        router.push(`/${slug}`);
    };

    const handleShare = (post: BlogPost) => {
        const postUrl = `${window.location.origin}/${post.slug}`;
        navigator.clipboard.writeText(postUrl);
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.description,
                url: postUrl,
            });
        } else {
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'>
            {posts.map((post, idx) => {
                const showAdAfter = (idx + 1) % 4 === 0 && idx !== posts.length - 1;
                return (
                    <React.Fragment key={post._id}>
                        <BlogPostCard
                            post={post}
                            priority={idx === 0 && currentPage === 1}
                            onShare={() => handleShare(post)}
                            onClick={() => handlePostClick(post.slug)}
                        />
                        {showAdAfter && (
                            <div className='col-span-full my-2'>
                                <ClientAd adSlot='4650270379' />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
