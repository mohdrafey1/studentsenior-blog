'use client';

import { useEffect, useRef } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { analytics } from './index';
import { staticSegments } from './routes';
import { type ContentType, routeTemplate, validContent } from './core';

export default function TrackContentView({
    type,
    id,
}: {
    type: ContentType;
    id?: string;
}) {
    const pathname = usePathname();
    const params = useParams();
    const template = routeTemplate(pathname || '/', params, staticSegments);
    const college = undefined; // Blog slugs are articles, never college identifiers.
    const last = useRef('');
    useEffect(() => {
        if (!validContent(type, id)) return;
        const key = `${pathname}:${type}:${id}`;
        if (last.current === key) return;
        last.current = key;
        analytics.screen(template, college, pathname);
        analytics.track('content_view', { type, id, source: 'unknown' });
    }, [type, id, pathname, template, college]);
    return null;
}
