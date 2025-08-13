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
    const pushedRef = useRef(false); // ✅ Track if we already pushed

    useEffect(() => {
        // Load AdSense script only once
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

        // Render ad only once
        if (!pushedRef.current) {
            try {
                // @ts-expect-error injected by Google script
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                pushedRef.current = true; // ✅ Prevent multiple pushes
            } catch (err) {
                console.error('AdSense error:', err);
            }
        }
    }, []);

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
