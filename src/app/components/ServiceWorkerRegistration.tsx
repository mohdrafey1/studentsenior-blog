"use client";
import { useEffect } from 'react';
export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
        navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
            .then(registration => registration.update()).catch(() => undefined);
    }, []);
    return null;
}
