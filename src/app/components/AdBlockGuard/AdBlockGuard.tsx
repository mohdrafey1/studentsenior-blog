'use client';
import React from 'react';
import { useDetectAdBlock } from 'adblock-detect-react';

export default function AdBlockGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const adBlockDetected = useDetectAdBlock();

    if (adBlockDetected) {
        return (
            <div className='min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white text-center px-4'>
                <h1 className='text-3xl font-bold mb-3'>🚫 AdBlock Detected</h1>
                <p className='text-lg max-w-md'>
                    Please disable your AdBlocker to continue using Student
                    Senior Blogs. Ads help us keep the platform free for
                    students like you.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
