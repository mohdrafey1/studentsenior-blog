'use client';

import dynamic from 'next/dynamic';

// ✅ dynamically import the actual AdSense component only on client
const AdSenseAd = dynamic(() => import('./AdSenseAd'), { ssr: false });

export default function ClientAd({ adSlot }: { adSlot: string }) {
    return (
        <AdSenseAd
            adSlot={adSlot}
            onAdLoad={() => console.log('Ad loaded')}
            onAdError={() => console.log('Ad failed')}
        />
    );
}
