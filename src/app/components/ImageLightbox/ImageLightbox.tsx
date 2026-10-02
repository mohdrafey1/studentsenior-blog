'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    sizes?: string;
}

export default function ImageLightbox({
    src,
    alt,
    width,
    height,
    sizes,
}: ImageLightboxProps) {
    const [open, setOpen] = useState(false);
    const backdropRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };

        document.addEventListener('keydown', onKey);
        // Prevent background scroll while open
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, close]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === backdropRef.current) close();
    };

    return (
        <>
            {/* Thumbnail wrapper — clickable */}
            <button
                type='button'
                onClick={() => setOpen(true)}
                className='relative w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl'
                aria-label={`Preview image${alt ? `: ${alt}` : ''}`}
            >
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    sizes={sizes}
                    className='w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]'
                    unoptimized
                />
                {/* Zoom hint overlay */}
                <span className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 rounded-xl'>
                    <ZoomIn className='text-white w-8 h-8 drop-shadow-lg' />
                </span>
            </button>

            {/* Lightbox portal */}
            {open && (
                <div
                    ref={backdropRef}
                    onClick={handleBackdropClick}
                    role='dialog'
                    aria-modal='true'
                    aria-label={`Image preview${alt ? `: ${alt}` : ''}`}
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4'
                >
                    <div className='relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center'>
                        {/* Close button */}
                        <button
                            type='button'
                            onClick={close}
                            aria-label='Close preview'
                            className='absolute -top-10 right-0 text-white hover:text-neutral-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded'
                        >
                            <X className='w-7 h-7' />
                        </button>

                        {/* Full-size image */}
                        <div className='relative w-full max-h-[80vh] overflow-hidden rounded-xl shadow-2xl'>
                            <Image
                                src={src}
                                alt={alt}
                                width={width}
                                height={height}
                                className='w-full h-auto object-contain max-h-[80vh]'
                                unoptimized
                                priority
                            />
                        </div>

                        {/* Caption */}
                        {alt && (
                            <p className='mt-3 text-sm text-neutral-300 text-center'>
                                {alt}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
