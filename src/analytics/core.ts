/** Browser-independent queue. Auth identity is local bookkeeping, never an event field. */
export const contentTypes = [
    'pyq',
    'note',
    'senior',
    'product',
    'syllabus',
    'quicknote',
    'solution',
    'video',
    'group',
    'opportunity',
    'lostfound',
    'blog',
    'affiliate',
] as const;
export type ContentType = (typeof contentTypes)[number];
type Props = Record<string, string | number | boolean>;
export interface AnalyticsEvent {
    eventId: string;
    anonId: string;
    sessionId: string;
    name: string;
    ts: string;
    screen?: string;
    college?: string;
    props: Props;
}
export interface Batch {
    sent: string;
    platform: 'web' | 'blog';
    events: AnalyticsEvent[];
}
export interface SavedQueue {
    identity: string | null;
    events: AnalyticsEvent[];
}
export interface SessionState {
    sessionId: string;
    lastActiveAt: number;
}
interface Options {
    anonId: string;
    platform: Batch['platform'];
    isNewInstall?: boolean;
    waitForIdentity?: boolean;
    restored?: SavedQueue;
    readSession?: () => SessionState | undefined;
    writeSession?: (session: SessionState) => void;
    now?: () => number;
    id?: () => string;
    persist: (value: SavedQueue) => void | Promise<void>;
    send: (
        batch: Batch,
        signal: AbortSignal,
    ) => Promise<{ status: number; retryAfter?: string | null }>;
    beacon?: (body: string) => boolean;
}
const objectId = /^[a-f\d]{24}$/i;
const token = /^[a-zA-Z\d_-]{8,128}$/;
const screenPattern = /^\/[a-zA-Z\d_/\[\]():+.-]*$/;
const fields: Record<string, readonly string[]> = {
    session_start: ['isNewInstall', 'launchSource'],
    screen_view: ['prevDurationMs'],
    heartbeat: ['sec'],
    content_view: ['type', 'id', 'source'],
    content_open: ['type', 'id'],
    share: ['type', 'id'],
    save_toggle: ['type', 'id', 'saved'],
    affiliate_click: ['productId'],
    search: ['scope', 'queryLength', 'resultCount'],
    contact_click: ['type', 'id', 'channel'],
    download_completed: ['type', 'id', 'bytes'],
    paywall_shown: ['type', 'id', 'tier'],
    content_unlocked: ['type', 'id', 'method'],
};
export function validContent(type: unknown, id: unknown): boolean {
    return (
        contentTypes.includes(type as ContentType) &&
        typeof id === 'string' &&
        objectId.test(id)
    );
}
function safeProps(name: string, input: Record<string, unknown>): Props | null {
    if (!Object.prototype.hasOwnProperty.call(fields, name)) return null;
    const allowed = fields[name];
    if (!allowed) return null;
    const result: Props = {};
    for (const key of allowed) {
        const value = input[key];
        if (
            typeof value === 'string' ||
            typeof value === 'boolean' ||
            (typeof value === 'number' && Number.isFinite(value))
        )
            result[key] = value;
    }
    if (allowed.includes('id') && !validContent(result.type, result.id))
        return null;
    if (
        name === 'affiliate_click' &&
        (typeof result.productId !== 'string' ||
            !objectId.test(result.productId))
    )
        return null;
    if (
        name === 'search' &&
        (typeof result.scope !== 'string' ||
            !/^[a-zA-Z\d_.:-]{1,80}$/.test(result.scope) ||
            !Number.isInteger(result.queryLength))
    )
        return null;
    if (name === 'search') {
        result.queryLength = Math.max(
            0,
            Math.min(10000, result.queryLength as number),
        );
    }
    if (
        name === 'search' &&
        result.resultCount !== undefined &&
        (!Number.isInteger(result.resultCount) ||
            Number(result.resultCount) < 0 ||
            Number(result.resultCount) > 1e7)
    )
        return null;
    if (
        name === 'session_start' &&
        result.isNewInstall !== undefined &&
        typeof result.isNewInstall !== 'boolean'
    )
        return null;
    if (
        name === 'session_start' &&
        result.launchSource !== undefined &&
        !['icon', 'deeplink', 'notification', 'unknown'].includes(
            String(result.launchSource),
        )
    )
        return null;
    if (
        name === 'screen_view' &&
        result.prevDurationMs !== undefined &&
        (!Number.isInteger(result.prevDurationMs) ||
            Number(result.prevDurationMs) < 0 ||
            Number(result.prevDurationMs) > 1800000)
    )
        return null;
    if (name === 'save_toggle' && typeof result.saved !== 'boolean')
        return null;
    if (
        name === 'heartbeat' &&
        (typeof result.sec !== 'number' || result.sec <= 0 || result.sec > 30)
    )
        return null;
    if (
        name === 'contact_click' &&
        !['phone', 'whatsapp', 'email', 'website', 'chat'].includes(
            String(result.channel),
        )
    )
        return null;
    if (
        name === 'content_unlocked' &&
        !['iap', 'rewarded_ad', 'premium', 'trial'].includes(
            String(result.method),
        )
    )
        return null;
    if (
        name === 'download_completed' &&
        result.bytes !== undefined &&
        (!Number.isInteger(result.bytes) ||
            Number(result.bytes) < 0 ||
            Number(result.bytes) > 1e10)
    )
        return null;
    if (
        result.tier !== undefined &&
        (typeof result.tier !== 'string' ||
            !/^[a-zA-Z\d_.:-]{1,80}$/.test(result.tier))
    )
        return null;
    if (
        name === 'content_view' &&
        ![
            'list',
            'search',
            'recent',
            'deeplink',
            'notification',
            'unknown',
        ].includes(String(result.source))
    )
        result.source = 'unknown';
    return result;
}
export function randomId(): string {
    return Array.from({ length: 32 }, (_, index) =>
        (
            (Math.random() * 16 + (index < 12 ? Date.now() / 16 ** index : 0)) &
            15
        ).toString(16),
    ).join('');
}
export function retryDelay(
    value: string | null | undefined,
    now: number,
    failures: number,
): number {
    const seconds = value ? Number(value) : NaN;
    const serverDelay = Number.isFinite(seconds)
        ? seconds * 1000
        : value
          ? Date.parse(value) - now
          : 0;
    return Math.max(
        1000,
        Math.min(60000, 1000 * 2 ** Math.min(failures, 6)),
        Number.isFinite(serverDelay) ? serverDelay : 0,
    );
}

export class AnalyticsQueue {
    private events: AnalyticsEvent[] = [];
    private identity: string | null;
    private sessionId: string;
    private route?: string;
    private routeKey?: string;
    private college?: string;
    private enteredAt: number;
    private activeSince: number | null;
    private hiddenAt: number | null = null;
    private failures = 0;
    private nextAttempt = 0;
    private flight: Promise<boolean> | null = null;
    private writes = Promise.resolve();
    private dirty = false;
    private persistTimer?: ReturnType<typeof setTimeout>;
    private persistedAt = 0;
    private lastActiveAt: number;
    private flightController: AbortController | null = null;
    private restoredIds = new Set<string>();
    private retiredSessions = new Set<string>();
    private paused = false;
    private identityReady: boolean;
    private now: () => number;
    private id: () => string;
    constructor(private options: Options) {
        this.now = options.now || Date.now;
        this.id = options.id || randomId;
        this.identity = options.restored?.identity || null;
        this.identityReady = !options.waitForIdentity;
        const savedSession = options.readSession?.();
        const reusable =
            savedSession &&
            token.test(savedSession.sessionId) &&
            Number.isFinite(savedSession.lastActiveAt) &&
            savedSession.lastActiveAt <= this.now() &&
            this.now() - savedSession.lastActiveAt < 1800000;
        this.sessionId = reusable ? savedSession.sessionId : this.id();
        this.lastActiveAt = this.now();
        this.saveSession();
        this.enteredAt = this.now();
        this.persistedAt = this.now();
        this.activeSince = this.now();
        // Treat browser storage as untrusted and rebuild the strict envelope.
        for (const value of (options.restored?.events || []).slice(-500)) {
            if (
                !value ||
                typeof value.eventId !== 'string' ||
                !token.test(value.eventId) ||
                value.anonId !== options.anonId ||
                typeof value.sessionId !== 'string' ||
                !token.test(value.sessionId) ||
                typeof value.ts !== 'string' ||
                !Number.isFinite(Date.parse(value.ts)) ||
                this.events.some((event) => event.eventId === value.eventId)
            )
                continue;
            const props = safeProps(value.name, value.props || {});
            if (!props) continue;
            this.events.push({
                eventId: value.eventId,
                anonId: options.anonId,
                sessionId: value.sessionId,
                name: value.name,
                ts: value.ts,
                props,
                ...(typeof value.screen === 'string' &&
                screenPattern.test(value.screen) &&
                value.screen.length <= 160
                    ? { screen: value.screen }
                    : {}),
                ...(typeof value.college === 'string' &&
                /^[a-z\d-]{1,100}$/.test(value.college)
                    ? { college: value.college }
                    : {}),
            });
        }
        this.restoredIds = new Set(this.events.map((event) => event.eventId));
        if (!reusable)
            this.track('session_start', {
                isNewInstall: !!options.isNewInstall,
                launchSource: 'unknown',
            });
    }
    get snapshot(): SavedQueue {
        return { identity: this.identity, events: [...this.events] };
    }
    get session(): string {
        return this.sessionId;
    }
    private persist() {
        this.dirty = true;
        if (this.persistTimer) return;
        this.persistTimer = setTimeout(
            () => {
                this.persistTimer = undefined;
                void this.flushPersistence();
            },
            Math.max(1, 1000 - (this.now() - this.persistedAt)),
        );
        this.persistTimer.unref?.();
    }
    flushPersistence(): Promise<void> {
        clearTimeout(this.persistTimer);
        this.persistTimer = undefined;
        this.writes = this.writes
            .catch(() => undefined)
            .then(async () => {
                if (!this.dirty) return;
                this.dirty = false;
                this.persistedAt = this.now();
                await this.options.persist(this.snapshot);
            })
            .catch(() => undefined);
        return this.writes;
    }
    private saveSession() {
        this.options.writeSession?.({
            sessionId: this.sessionId,
            lastActiveAt: this.lastActiveAt,
        });
    }
    private sharedSession(): SessionState | undefined {
        const shared = this.options.readSession?.();
        return shared &&
            !this.retiredSessions.has(shared.sessionId) &&
            token.test(shared.sessionId) &&
            Number.isFinite(shared.lastActiveAt) &&
            shared.lastActiveAt <= this.now() &&
            (shared.sessionId === this.sessionId ||
                shared.lastActiveAt >= this.lastActiveAt)
            ? shared
            : undefined;
    }
    /** Heartbeats do not count as interaction: an idle visible tab can expire. */
    activity(): boolean {
        if (this.paused) return false;
        const shared = this.sharedSession();
        if (shared) {
            this.sessionId = shared.sessionId;
            this.lastActiveAt = Math.max(
                this.lastActiveAt,
                shared.lastActiveAt,
            );
        }
        const rotated = this.now() - this.lastActiveAt >= 1800000;
        if (rotated) this.rotate();
        this.lastActiveAt = this.now();
        this.saveSession();
        return rotated;
    }
    track(name: string, input: Record<string, unknown> = {}): void {
        if (this.paused) return;
        const props = safeProps(name, input);
        if (!props) return;
        if (name !== 'heartbeat' && name !== 'session_start') this.activity();
        this.enqueue(name, props);
    }
    private enqueue(name: string, props: Props): void {
        if (this.paused) return;
        this.events.push({
            eventId: this.id(),
            anonId: this.options.anonId,
            sessionId: this.sessionId,
            name,
            ts: new Date(this.now()).toISOString(),
            ...(this.route ? { screen: this.route } : {}),
            ...(this.college ? { college: this.college } : {}),
            props,
        });
        this.events = this.events.slice(-500);
        this.persist();
        if (this.events.length >= 20) void this.flush();
    }
    screen(template: string, college?: string, routeKey = template): void {
        if (!screenPattern.test(template) || template.length > 160) return;
        this.college =
            college && /^[a-z\d-]{1,100}$/.test(college) ? college : undefined;
        const changed = routeKey !== this.routeKey;
        const prevDurationMs = this.route
            ? Math.min(1800000, Math.max(0, this.now() - this.enteredAt))
            : 0;
        if (changed) {
            this.route = template;
            this.routeKey = routeKey;
            this.enteredAt = this.now();
        }
        const rotated = this.activity();
        if (changed && !rotated)
            this.enqueue('screen_view', { prevDurationMs });
    }
    heartbeat(): void {
        if (this.activeSince === null || this.paused) return;
        const shared = this.sharedSession();
        const lastActivity = Math.max(
            this.lastActiveAt,
            shared?.lastActiveAt || 0,
        );
        if (this.now() - lastActivity >= 1800000) {
            this.activeSince = this.now();
            return;
        }
        if (shared) {
            this.sessionId = shared.sessionId;
            this.lastActiveAt = lastActivity;
        }
        const sec = Math.min(
            30,
            Math.max(0, (this.now() - this.activeSince) / 1000),
        );
        this.activeSince = this.now();
        if (sec > 0) this.track('heartbeat', { sec });
    }
    hide(): void {
        if (this.hiddenAt !== null) return;
        this.heartbeat();
        this.activeSince = null;
        this.hiddenAt = this.now();
        this.flushBeacon();
        void this.flushPersistence();
    }
    show(): void {
        this.activity();
        this.hiddenAt = null;
        this.activeSince = this.now();
        void this.flush();
    }
    private rotate(restoreScreen = true) {
        this.retiredSessions.add(this.sessionId);
        this.sessionId = this.id();
        this.lastActiveAt = this.now();
        this.saveSession();
        this.enteredAt = this.now();
        this.activeSince = this.hiddenAt === null ? this.now() : null;
        this.enqueue('session_start', {
            isNewInstall: false,
            launchSource: 'unknown',
        });
        if (restoreScreen && this.route)
            this.enqueue('screen_view', { prevDurationMs: 0 });
    }
    private batch(): Batch {
        const batch: Batch = {
            sent: new Date(this.now()).toISOString(),
            platform: this.options.platform,
            events: this.events.slice(0, 50),
        };
        // The browser keepalive budget is shared with other outstanding requests.
        while (
            batch.events.length &&
            new TextEncoder().encode(JSON.stringify(batch)).byteLength >= 48000
        )
            batch.events.pop();
        return batch;
    }
    flush(force = false): Promise<boolean> {
        if (this.flight) return this.flight;
        if (
            !this.identityReady ||
            (!force && this.paused) ||
            (!force && this.now() < this.nextAttempt)
        )
            return Promise.resolve(false);
        if (!this.events.length) return Promise.resolve(true);
        const controller = new AbortController();
        this.flightController = controller;
        this.flight = this.sendAll(controller.signal).finally(() => {
            if (this.flightController === controller) {
                this.flight = null;
                this.flightController = null;
            }
        });
        return this.flight;
    }
    private async sendAll(signal: AbortSignal): Promise<boolean> {
        // Bound a drain to the existing queue, even when new events arrive during transport.
        let remaining = this.events.length;
        while (this.events.length && remaining > 0 && !signal.aborted) {
            const batch = this.batch();
            if (!batch.events.length) {
                this.events.shift();
                this.persist();
                continue;
            }
            remaining -= batch.events.length;
            try {
                const result = await this.options.send(batch, signal);
                if (signal.aborted) return false;
                if (
                    (result.status >= 200 && result.status < 300) ||
                    result.status === 400 ||
                    result.status === 413
                ) {
                    const sentIds = new Set(
                        batch.events.map((event) => event.eventId),
                    );
                    this.events = this.events.filter(
                        (event) => !sentIds.has(event.eventId),
                    );
                    this.failures = 0;
                    this.nextAttempt = 0;
                    this.persist();
                } else {
                    this.nextAttempt =
                        this.now() +
                        retryDelay(
                            result.retryAfter,
                            this.now(),
                            ++this.failures,
                        );
                    return false;
                }
            } catch {
                if (signal.aborted) return false;
                this.nextAttempt =
                    this.now() + retryDelay(null, this.now(), ++this.failures);
                return false;
            }
        }
        return !this.events.length;
    }
    flushBeacon(): boolean {
        if (
            !this.identityReady ||
            this.paused ||
            this.now() < this.nextAttempt ||
            !this.events.length
        )
            return false;
        const batch = this.batch();
        if (!batch.events.length) return false;
        try {
            const accepted =
                this.options.beacon?.(JSON.stringify(batch)) || false;
            if (accepted) {
                const ids = new Set(batch.events.map((event) => event.eventId));
                this.events = this.events.filter(
                    (event) => !ids.has(event.eventId),
                );
                this.persist();
            }
            return accepted;
        } catch {
            return false;
        }
    }
    async prepareIdentityChange(): Promise<void> {
        this.heartbeat();
        this.paused = true;
        let expired = false;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const drain = async () => {
            if (this.flight) await this.flight;
            if (!expired) await this.flush(true);
        };
        await Promise.race([
            drain(),
            new Promise<void>((resolve) => {
                timeout = setTimeout(() => {
                    expired = true;
                    this.flightController?.abort();
                    this.flightController = null;
                    this.flight = null;
                    resolve();
                }, 1500);
            }),
        ]);
        clearTimeout(timeout);
        // Old-cookie requests are aborted before auth changes; their callbacks cannot retry.
        this.events = [];
        this.failures = 0;
        this.nextAttempt = 0;
        this.persist();
        void this.flushPersistence();
    }
    identify(identity: string | null, sharedChange = false): void {
        if (!this.identityReady) {
            const changed = identity !== this.identity;
            if (changed)
                this.events = this.events.filter(
                    (event) => !this.restoredIds.has(event.eventId),
                );
            this.identity = identity;
            this.identityReady = true;
            this.paused = false;
            if (changed) {
                const fresh = this.events;
                const shared = sharedChange ? this.sharedSession() : undefined;
                if (
                    shared &&
                    shared.sessionId !== this.sessionId &&
                    token.test(shared.sessionId) &&
                    this.now() - shared.lastActiveAt < 1800000
                ) {
                    this.sessionId = shared.sessionId;
                    this.lastActiveAt = shared.lastActiveAt;
                    this.events = fresh.filter(
                        (event) => event.name !== 'session_start',
                    );
                } else {
                    this.events = [];
                    this.rotate(
                        !fresh.some(
                            (event) =>
                                event.name === 'screen_view' &&
                                event.screen === this.route,
                        ),
                    );
                    // Reuse a buffered cold-start event instead of counting two starts.
                    if (fresh.some((event) => event.name === 'session_start'))
                        this.events = fresh;
                    else
                        this.events.push(
                            ...fresh.slice(-(500 - this.events.length)),
                        );
                }
                this.events = this.events.map((event) => ({
                    ...event,
                    sessionId: this.sessionId,
                }));
            }
            this.persist();
            return;
        }
        const changed = identity !== this.identity;
        if (changed) {
            this.flightController?.abort();
            this.flightController = null;
            this.flight = null;
            this.events = [];
        }
        this.identity = identity;
        const wasPaused = this.paused;
        this.paused = false;
        if (changed || wasPaused) {
            const shared = sharedChange ? this.sharedSession() : undefined;
            if (
                shared &&
                (!changed || shared.sessionId !== this.sessionId) &&
                token.test(shared.sessionId) &&
                this.now() - shared.lastActiveAt < 1800000
            ) {
                this.sessionId = shared.sessionId;
                this.lastActiveAt = shared.lastActiveAt;
            } else this.rotate();
        }
        this.persist();
    }
    reset(): void {
        this.identify(null);
    }
    cancelIdentityChange(): void {
        this.paused = false;
        this.activeSince = this.hiddenAt === null ? this.now() : null;
    }
}

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

/** Replace whole dynamic segments, including catch-all arrays; never include search/hash. */
export function routeTemplate(
    pathname: string,
    params: Record<string, string | string[] | undefined>,
    staticSegments: readonly string[] = [],
): string {
    let segments = pathname
        .split('?')[0]
        .split('#')[0]
        .split('/')
        .filter(Boolean);
    for (const [name, value] of Object.entries(params)) {
        if (value === undefined) continue;
        const values = Array.isArray(value) ? value : [value];
        for (let index = 0; index < segments.length; index++) {
            const matches = values.every((part, offset) => {
                try {
                    return (
                        !/^\[.*\]$/.test(segments[index + offset] || '') &&
                        safeDecode(segments[index + offset] || '') ===
                            safeDecode(part)
                    );
                } catch {
                    return false;
                }
            });
            if (values.length && matches) {
                segments.splice(
                    index,
                    values.length,
                    `[${Array.isArray(value) ? '...' : ''}${name}]`,
                );
                break;
            }
        }
    }
    // Unknown encoded/private segments on error routes are never emitted as raw paths.
    segments = segments.map((segment) =>
        /^\[(?:\.\.\.)?[a-zA-Z\d_-]+\]$/.test(segment) ||
        staticSegments.includes(segment)
            ? segment
            : '[unknown]',
    );
    return `/${segments.join('/')}`;
}
