'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type Props = {
    adSlot: string;
    className?: string;
    style?: React.CSSProperties;
    onAdLoad?: () => void;
    onAdError?: () => void;
};

export default function AdSenseAd({
    adSlot,
    className = '',
    style = { display: 'block', width: '100%' },
    onAdLoad,
    onAdError,
}: Props) {
    const adRef = useRef<HTMLModElement>(null);
    const [loading, setLoading] = useState(true);
    const pushed = useRef(false);

    // Stable callbacks to avoid react-hooks/exhaustive-deps warning
    const handleLoad = useCallback(() => {
        onAdLoad?.();
    }, [onAdLoad]);

    const handleError = useCallback(() => {
        onAdError?.();
    }, [onAdError]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Disable ads for development/staging
        if (
            process.env.NEXT_PUBLIC_ENV === 'staging' ||
            window.location.hostname.includes('localhost')
        ) {
            return;
        }

        // Load AdSense script once
        const scriptId = 'adsbygoogle-js';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.async = true;
            script.src =
                'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4435788387381825';
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        }

        // Detect when ad actually renders (child added)
        let observer: MutationObserver | null = null;

        if (adRef.current) {
            observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    if (m.addedNodes.length > 0) {
                        setLoading(false);
                        handleLoad();
                        observer?.disconnect();
                    }
                }
            });

            observer.observe(adRef.current, { childList: true });
        }

        // Push only once
        if (!pushed.current && adRef.current) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                pushed.current = true;
            } catch (e) {
                console.error('Ad error:', e);
                setLoading(false);
                handleError();
            }
        }

        // Fail-safe timeout
        const timeout = setTimeout(() => {
            if (loading) {
                setLoading(false);
                handleError();
            }
        }, 4000);

        return () => {
            observer?.disconnect();
            clearTimeout(timeout);
        };
    }, [handleLoad, handleError, loading]);

    return (
        <>
            {!loading && (
                <ins
                    ref={adRef}
                    className={`adsbygoogle ${className}`}
                    style={style}
                    data-ad-client='ca-pub-4435788387381825'
                    data-ad-slot={adSlot}
                    data-ad-format='fluid'
                    data-ad-layout-key='-fb+5w+4e-db+86'
                />
            )}
        </>
    );
}
