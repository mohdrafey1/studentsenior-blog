'use client';

import { useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { analytics } from './index';
import { staticSegments } from './routes';
import { routeTemplate } from './core';

export default function AnalyticsProvider() {
    const pathname = usePathname();
    const params = useParams();
    const template = routeTemplate(pathname || '/', params, staticSegments);
    const college = undefined; // Blog slugs are articles, never college identifiers.
    useEffect(() => analytics.start(), []);
    useEffect(() => {
        analytics.screen(template, college, pathname);
    }, [template, college, pathname]);
    return null;
}
