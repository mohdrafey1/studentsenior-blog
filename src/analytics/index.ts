'use client';

import { AnalyticsQueue, randomId, type SavedQueue } from './core';
const PLATFORM = 'blog' as const;
const ANON_KEY = 'ss_analytics_anon';
const QUEUE_KEY = `ss_analytics_queue_${PLATFORM}`;
const IDENTITY_KEY = `ss_analytics_identity_${PLATFORM}`;
let client: AnalyticsQueue | undefined;
let stop: (() => void) | undefined;

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
    let restored: SavedQueue | undefined;
    try {
        const value = JSON.parse(storage?.getItem(QUEUE_KEY) || 'null');
        if (
            value &&
            Array.isArray(value.events) &&
            (value.identity === null || typeof value.identity === 'string')
        )
            restored = value;
    } catch {
        /* Ignore corrupt or unavailable persistence. */
    }
    const endpoint = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v2').replace(/\/+$/, '')}/events`;
    client = new AnalyticsQueue({
        ...identity,
        platform: PLATFORM,
        restored,
        waitForIdentity: false,
        persist: (value) => {
            try {
                storage?.setItem(QUEUE_KEY, JSON.stringify(value));
            } catch {
                /* Quota exhaustion cannot interrupt user actions. */
            }
        },
        send: async (batch) => {
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 5000);
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    credentials: 'include',
                    keepalive: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Platform': PLATFORM,
                        'X-Anon-Id': identity.anonId,
                    },
                    body: JSON.stringify(batch),
                    signal: controller.signal,
                });
                return {
                    status: response.status,
                    retryAfter: response.headers.get('Retry-After'),
                };
            } finally {
                window.clearTimeout(timeout);
            }
        },
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
        getClient()?.screen(template, college, routeKey);
    },
    flush() {
        return getClient()?.flush() || Promise.resolve(true);
    },
    prepareIdentityChange() {
        return getClient()?.prepareIdentityChange() || Promise.resolve();
    },
    identify(id: string | null) {
        getClient()?.identify(id);
        try {
            localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
        } catch {
            /* Optional cross-tab guard. */
        }
    },
    reset() {
        this.identify(null);
    },
    cancelIdentityChange() {
        getClient()?.cancelIdentityChange();
    },
    start() {
        const queue = getClient();
        if (!queue || stop) return () => undefined;
        const visibility = () =>
            document.visibilityState === 'hidden' ? queue.hide() : queue.show();
        const hidden = () => queue.hide();
        const visible = () => {
            if (document.visibilityState !== 'hidden') queue.show();
        };
        const online = () => {
            void queue.flush();
        };
        const identityChanged = (event: StorageEvent) => {
            if (event.key !== IDENTITY_KEY) return;
            try {
                const identity = JSON.parse(event.newValue || 'null');
                if (identity === null || typeof identity === 'string')
                    queue.identify(identity);
            } catch {
                /* Ignore malformed external storage. */
            }
        };
        const timer = window.setInterval(() => {
            if (document.visibilityState !== 'hidden') queue.heartbeat();
            void queue.flush();
        }, 30000);
        document.addEventListener('visibilitychange', visibility);
        window.addEventListener('pagehide', hidden);
        window.addEventListener('pageshow', visible);
        window.addEventListener('online', online);
        window.addEventListener('storage', identityChanged);
        if (document.visibilityState === 'hidden') queue.hide();
        stop = () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', visibility);
            window.removeEventListener('pagehide', hidden);
            window.removeEventListener('pageshow', visible);
            window.removeEventListener('online', online);
            window.removeEventListener('storage', identityChanged);
            stop = undefined;
        };
        return stop;
    },
};
