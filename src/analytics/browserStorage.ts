import { randomId, type SavedQueue, type SessionState } from './core';

type Store = Pick<
    Storage,
    'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'
>;
const LEASE_MS = 90000;
const validId = /^[a-zA-Z\d_-]{8,128}$/;

/** A queue belongs to one page instance. Expired leases can be recovered on startup. */
export function tabStorage(
    storage: Store | undefined,
    prefix: string,
    identity: string | null,
    now = Date.now,
    tabId = randomId(),
) {
    const key = `${prefix}:${tabId}`;
    const lease = `${prefix}:lease:${tabId}`;
    const sessionKey = `${prefix}:session`;
    const read = (name: string) => {
        try {
            return JSON.parse(storage?.getItem(name) || 'null');
        } catch {
            return null;
        }
    };
    const write = (name: string, value: unknown) => {
        try {
            if (!storage) return false;
            storage.setItem(name, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    };
    const remove = (name: string) => {
        try {
            storage?.removeItem(name);
        } catch {
            /* Best effort. */
        }
    };
    const renew = () => write(lease, now() + LEASE_MS);
    const candidates: string[] = [prefix]; // Migrate the previous single-queue format.
    try {
        for (let index = 0; index < (storage?.length || 0); index++) {
            const candidate = storage?.key(index);
            if (
                candidate?.startsWith(`${prefix}:`) &&
                validId.test(candidate.slice(prefix.length + 1))
            )
                candidates.push(candidate);
        }
    } catch {
        /* Storage is optional. */
    }
    const events = new Map<string, SavedQueue['events'][number]>();
    const claimed: string[] = [];
    for (const candidate of candidates) {
        if (candidate === key) continue;
        const owner = candidate.slice(prefix.length + 1);
        const ownerLease = `${prefix}:lease:${owner}`;
        if (candidate !== prefix && Number(read(ownerLease)) > now()) continue;
        const value = read(candidate);
        if (!value || !Array.isArray(value.events)) continue;
        // Claim before reading it into our queue so another starter skips this lease.
        write(ownerLease, now() + LEASE_MS);
        if (value.identity === identity) {
            for (const event of value.events)
                if (event && typeof event.eventId === 'string')
                    events.set(event.eventId, event);
        }
        claimed.push(candidate);
    }
    const restored: SavedQueue = {
        identity,
        events: [...events.values()]
            .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts))
            .slice(-500),
    };
    renew();
    // Secure recovered events in our own key before deleting their former owner.
    if (claimed.length && write(key, restored)) {
        for (const candidate of claimed) {
            remove(candidate);
            remove(`${prefix}:lease:${candidate.slice(prefix.length + 1)}`);
        }
    }
    let lastSessionWrite = 0;
    let currentSession: SessionState | undefined;
    return {
        key,
        restored,
        renew,
        release: () => remove(lease),
        persist(value: SavedQueue) {
            write(key, value);
        },
        readSession(): SessionState | undefined {
            const value = read(sessionKey);
            return value &&
                typeof value.sessionId === 'string' &&
                validId.test(value.sessionId) &&
                Number.isFinite(value.lastActiveAt)
                ? value
                : currentSession;
        },
        writeSession(value: SessionState) {
            const changed = value.sessionId !== currentSession?.sessionId;
            currentSession = value;
            if (changed || now() - lastSessionWrite >= 1000) {
                lastSessionWrite = now();
                write(sessionKey, value);
            }
        },
    };
}
