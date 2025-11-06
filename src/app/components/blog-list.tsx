'use client';
import React from 'react';
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
