'use client';

import { AnalyticsQueue, randomId } from './core';
import { tabStorage } from './browserStorage';
import { sendBatch } from './transport';
const PLATFORM = 'blog' as const;
const ANON_KEY = 'ss_analytics_anon';
const QUEUE_KEY = `ss_analytics_queue_${PLATFORM}`;
let client: AnalyticsQueue | undefined;
let stop: (() => void) | undefined;
let persistence: ReturnType<typeof tabStorage> | undefined;

export function browserIdentity(
    storage: Pick<Storage, 'getItem' | 'setItem'> | undefined,
    cookie: string,
    writeCookie: (value: string) => void,
) {
    let mirror: string | null = null;
    try {
        mirror = storage?.getItem(ANON_KEY) || null;
    } catch {
        /* Private browsing may deny storage. */
    }
    const savedCookie = cookie
        .split(';')
        .map((value) => value.trim())
        .find((value) => value.startsWith(`${ANON_KEY}=`))
        ?.slice(ANON_KEY.length + 1);
    const saved = [savedCookie, mirror].find(
        (value) => value && /^[a-f\d]{32}$/i.test(value),
    );
    const anonId = saved || randomId();
    try {
        storage?.setItem(ANON_KEY, anonId);
    } catch {
        /* Keep the in-memory identity. */
    }
    try {
        writeCookie(
            `${ANON_KEY}=${anonId}; Path=/; Max-Age=31536000; SameSite=Lax`,
        );
    } catch {
        /* Cookie restrictions must not affect navigation. */
    }
    return { anonId, isNewInstall: !saved };
}

function getClient(): AnalyticsQueue | undefined {
    if (typeof window === 'undefined') return undefined;
    if (client) return client;
    let storage: Storage | undefined;
    try {
        storage = window.localStorage;
    } catch {
        /* Storage is optional. */
    }
    const identity = browserIdentity(storage, document.cookie, (value) => {
        document.cookie =
            value + (location.protocol === 'https:' ? '; Secure' : '');
    });
    persistence = tabStorage(storage, QUEUE_KEY, null);
    const endpoint = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v2').replace(/\/+$/, '')}/events`;
    client = new AnalyticsQueue({
        ...identity,
        platform: PLATFORM,
        restored: persistence.restored,
        readSession: persistence.readSession,
        writeSession: persistence.writeSession,
        persist: persistence.persist,
        send: (batch, signal) => sendBatch(endpoint, batch, signal),
        beacon: (body) =>
            typeof navigator.sendBeacon === 'function' &&
            navigator.sendBeacon(
                endpoint,
                new Blob([body], { type: 'text/plain' }),
            ),
    });
    return client;
}

export const analytics = {
    track(name: string, props: Record<string, unknown> = {}) {
        getClient()?.track(name, props);
    },
    screen(template: string, college?: string, routeKey?: string) {
        getClient()?.screen(template, undefined, routeKey);
    },
    flush() {
        return getClient()?.flush() || Promise.resolve(true);
    },
    start() {
        const queue = getClient();
        if (!queue || stop) return () => undefined;
        const visibility = () =>
            document.visibilityState === 'hidden' ? queue.hide() : queue.show();
        const hidden = () => {
            queue.hide();
            void queue.flushPersistence().then(() => persistence?.release());
        };
        const visible = () => {
            if (document.visibilityState !== 'hidden') {
                persistence?.renew();
                queue.show();
            }
        };
        const online = () => {
            void queue.flush();
        };
        const interaction = () => queue.activity();
        const timer = window.setInterval(() => {
            persistence?.renew();
            if (document.visibilityState !== 'hidden') queue.heartbeat();
            void queue.flush();
        }, 30000);
        for (const event of ['pointerdown', 'keydown', 'scroll', 'touchstart'])
            document.addEventListener(event, interaction, { passive: true });
        document.addEventListener('visibilitychange', visibility);
        window.addEventListener('pagehide', hidden);
        window.addEventListener('pageshow', visible);
        window.addEventListener('online', online);
        if (document.visibilityState === 'hidden') queue.hide();
        stop = () => {
            window.clearInterval(timer);
            for (const event of [
                'pointerdown',
                'keydown',
                'scroll',
                'touchstart',
            ])
                document.removeEventListener(event, interaction);
            void queue.flushPersistence();
            document.removeEventListener('visibilitychange', visibility);
            window.removeEventListener('pagehide', hidden);
            window.removeEventListener('pageshow', visible);
            window.removeEventListener('online', online);
            stop = undefined;
        };
        return stop;
    },
};
