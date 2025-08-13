'use client';

import { useEffect, useRef } from 'react';

type Props = {
    adSlot: string;
    style?: React.CSSProperties;
    className?: string;
};

export default function AdSenseAd({
    adSlot,
    style = { display: 'block', width: '100%' },
    className = '',
}: Props) {
    const adRef = useRef<HTMLModElement>(null);
    const pushedRef = useRef(false);

    useEffect(() => {
        // 🛑 Skip ads in staging or localhost
        if (
            process.env.NEXT_PUBLIC_ENV === 'staging' ||
            window.location.hostname.includes('localhost')
        ) {
            console.log('AdSense disabled in staging/local');
            return;
        }

        // Ensure we are in the browser
        if (typeof window === 'undefined') return;

        // Load AdSense script only once
        const scriptId = 'adsbygoogle-js';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.async = true;
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4435788387381825`;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        }

        // Push ad only once
        if (!pushedRef.current && adRef.current) {
            try {
                // @ts-expect-error from Google
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                pushedRef.current = true;
            } catch (err) {
                console.error('AdSense load error:', err);
            }
        }
    }, []);

    // 🛑 Render nothing in staging/local
    if (
        typeof window !== 'undefined' &&
        (process.env.NEXT_PUBLIC_ENV === 'staging' ||
            window.location.hostname.includes('localhost'))
    ) {
        return null;
    }

    return (
        <ins
            ref={adRef}
            className={`adsbygoogle ${className}`}
            style={style}
            data-ad-client='ca-pub-4435788387381825'
            data-ad-slot={adSlot}
            data-ad-format='fluid'
            data-ad-layout-key='-fb+5w+4e-db+86'
        />
    );
}
