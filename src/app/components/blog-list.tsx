'use client';
import React from 'react';
import { analytics } from '@/analytics';
import { shareAndTrack } from '@/analytics/share';
import { useRouter } from 'next/navigation';
import { BlogPost } from '@/constant/interface';
import BlogPostCard from './blog-post-card';

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

    const handleShare = async (post: BlogPost) => {
        const postUrl = `${window.location.origin}/${post.slug}`;
        try {
            if (navigator.share) {
                await shareAndTrack(
                    () =>
                        navigator.share({
                            title: post.title,
                            text: post.description,
                            url: postUrl,
                        }),
                    () =>
                        analytics.track('share', {
                            type: 'blog',
                            id: post._id,
                        }),
                );
            } else {
                await shareAndTrack(
                    () => navigator.clipboard.writeText(postUrl),
                    () =>
                        analytics.track('share', {
                            type: 'blog',
                            id: post._id,
                        }),
                );
                alert('Link copied to clipboard!');
            }
        } catch {
            /* A cancelled or failed share emits nothing. */
        }
    };

    return (
        <>
            {posts.map((post, idx) => (
                <BlogPostCard
                    key={post._id}
                    post={post}
                    priority={idx === 0 && currentPage === 1}
                    onShare={() => handleShare(post)}
                    onClick={() => handlePostClick(post.slug)}
                />
            ))}
        </>
    );
}
