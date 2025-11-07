'use client';
import React, { useEffect, useState } from 'react';
import { DetectAdblock } from '@scthakuri/adblock-detector';

export default function AdBlockGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const [adBlockDetected, setAdBlockDetected] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const detectAdBlock = async () => {
            try {
                DetectAdblock((enabled: boolean) => {
                    setAdBlockDetected(enabled);
                    setIsLoaded(true);
                });
            } catch (err) {
                // If detection fails, assume AdBlock is present (safe fallback)
                setAdBlockDetected(true);
                setIsLoaded(true);
            }
        };

        detectAdBlock();
    }, []);

    if (!isLoaded) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-900 text-white text-xl'>
                Checking for AdBlock...
            </div>
        );
    }

    if (adBlockDetected) {
        return (
            <div className='min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white text-center px-4'>
                <h1 className='text-3xl font-bold mb-3'>🚫 AdBlock Detected</h1>
                <p className='text-lg max-w-md'>
                    Please disable your AdBlocker to continue using{' '}
                    <span className='font-semibold'>Student Senior Blogs</span>.
                    Ads help us keep the platform free for students like you.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
