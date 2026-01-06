'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/config/apiConfig';

export default function ViewTracker({ slug }: { slug: string }) {
    const hasViewed = useRef(false);

    useEffect(() => {
        if (hasViewed.current) return;

        const incrementView = async () => {
            try {
                // Using fetch directly to keep it lightweight
                await fetch(api.blog.incrementView(slug), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                hasViewed.current = true;
            } catch (error) {
                console.error('Failed to increment view count:', error);
            }
        };

        incrementView();
    }, [slug]);

    return null;
}
