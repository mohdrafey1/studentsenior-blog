const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
// Exercise the production TypeScript core without adding a runtime dependency.
require.extensions['.ts'] = (module, filename) =>
    module._compile(
        ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2020,
            },
        }).outputText,
        filename,
    );
const {
    AnalyticsQueue,
    routeTemplate,
    retryDelay,
} = require('../src/analytics/core.ts');
const { browserIdentity } = require('../src/analytics/index.ts');
const anonId = 'a'.repeat(32),
    contentId = '507f1f77bcf86cd799439011';
function fixture(overrides = {}) {
    let now = Date.parse('2026-10-07T10:00:00Z'),
        counter = 0;
    const sends = [],
        writes = [];
    const queue = new AnalyticsQueue({
        anonId,
        platform: 'web',
        now: () => now,
        id: () => String(++counter).padStart(32, '0'),
        persist: (value) => writes.push(value),
        send: async (batch) => {
            sends.push(batch);
            return { status: 204 };
        },
        ...overrides,
    });
    return {
        queue,
        sends,
        writes,
        advance: (ms) => {
            now += ms;
        },
        time: () => now,
    };
}
test('track is synchronous, persistence is deferred and queue drops oldest at 500', async () => {
    const { queue, writes } = fixture({ waitForIdentity: true });
    assert.equal(writes.length, 0);
    for (let index = 0; index < 600; index++)
        queue.track('search', { scope: 'pyq', queryLength: index });
    assert.equal(queue.snapshot.events.length, 500);
    assert.equal(queue.snapshot.events[0].props.queryLength, 100);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(writes.at(-1).events.length, 500);
});
test('flush sends maximum 50 events, drains, stamps actual send time and keeps stable IDs', async () => {
    const { queue, sends, advance, time } = fixture({ waitForIdentity: true });
    for (let index = 0; index < 123; index++)
        queue.track('content_view', { type: 'pyq', id: contentId });
    const ids = queue.snapshot.events.map((event) => event.eventId);
    advance(42000);
    queue.identify(null);
    assert.equal(await queue.flush(), true);
    assert.deepEqual(
        sends.map((batch) => batch.events.length),
        [50, 50, 24],
    );
    assert.deepEqual(
        sends.flatMap((batch) => batch.events.map((event) => event.eventId)),
        ids,
    );
    assert.ok(
        sends.every((batch) => batch.sent === new Date(time()).toISOString()),
    );
    assert.equal(queue.snapshot.events.length, 0);
});
test('the threshold of 20 schedules a flush', async () => {
    const { queue, sends } = fixture();
    for (let index = 0; index < 19; index++)
        queue.track('search', { scope: 'pyq', queryLength: 1 });
    await queue.flush();
    assert.equal(sends[0].events.length, 20);
});
test('network, 5xx, and 429 retain events and Retry-After is respected', async () => {
    let calls = 0;
    const batches = [];
    const { queue, advance } = fixture({
        send: async (batch) => {
            batches.push(batch);
            calls++;
            if (calls === 1) throw new Error('offline');
            return calls === 2
                ? { status: 429, retryAfter: '120' }
                : { status: 204 };
        },
    });
    const ids = queue.snapshot.events.map((event) => event.eventId);
    assert.equal(await queue.flush(), false);
    assert.equal(await queue.flush(), false);
    assert.equal(calls, 1);
    advance(3000);
    assert.equal(await queue.flush(), false);
    advance(119000);
    assert.equal(await queue.flush(), false);
    assert.equal(calls, 2);
    advance(1000);
    assert.equal(await queue.flush(), true);
    assert.deepEqual(
        batches.map((batch) => batch.events.map((event) => event.eventId)),
        [ids, ids, ids],
    );
    assert.equal(
        retryDelay(
            'Wed, 07 Oct 2026 10:05:00 GMT',
            Date.parse('2026-10-07T10:00:00Z'),
            1,
        ),
        300000,
    );
});
for (const status of [400, 413, 503])
    test(`HTTP ${status} ${status === 503 ? 'retains' : 'drops'} a batch`, async () => {
        const { queue } = fixture({ send: async () => ({ status }) });
        await queue.flush();
        assert.equal(queue.snapshot.events.length, status === 503 ? 1 : 0);
    });
test('false and accepted beacon both retain stable IDs until acknowledged', () => {
    for (const accepted of [false, true]) {
        let body;
        const { queue } = fixture({
            beacon: (value) => {
                body = value;
                return accepted;
            },
            waitForIdentity: true,
        });
        for (let index = 0; index < 80; index++)
            queue.track('content_view', { type: 'note', id: contentId });
        queue.identify(null);
        const ids = queue.snapshot.events.map((event) => event.eventId);
        assert.equal(queue.flushBeacon(), accepted);
        assert.ok(Buffer.byteLength(body) < 48000);
        assert.equal(JSON.parse(body).events.length, 50);
        assert.deepEqual(
            queue.snapshot.events.map((event) => event.eventId),
            ids,
        );
    }
});
test('identity change flushes old auth, pauses new events, drops failure and rotates for login/logout', async () => {
    let auth = 'old',
        fail = true;
    const owners = [];
    const { queue } = fixture({
        send: async () => {
            owners.push(auth);
            return { status: fail ? 503 : 204 };
        },
    });
    queue.identify('old');
    const firstSession = queue.session;
    queue.track('content_view', { type: 'pyq', id: contentId });
    await queue.prepareIdentityChange();
    queue.track('search', { scope: 'pyq', queryLength: 20 });
    assert.equal(queue.snapshot.events.length, 0);
    auth = 'new';
    fail = false;
    queue.identify('new');
    assert.notEqual(queue.session, firstSession);
    assert.ok(
        queue.snapshot.events.every((event) => event.name === 'session_start'),
    );
    assert.deepEqual(owners, ['old']);
    await queue.prepareIdentityChange();
    queue.reset();
    assert.ok(queue.snapshot.events.every((event) => event.anonId === anonId));
    assert.equal(queue.snapshot.identity, null);
});
test('same-account re-login rotates and auth transition does not bypass Retry-After', async () => {
    let calls = 0;
    const { queue } = fixture({
        send: async () => {
            calls++;
            return { status: 429, retryAfter: '300' };
        },
    });
    queue.identify('account');
    const before = queue.session;
    await queue.flush();
    await queue.prepareIdentityChange();
    queue.identify('account');
    assert.equal(calls, 1);
    assert.notEqual(queue.session, before);
});
test('startup waits for verified identity and drops only another account restored events', async () => {
    const initial = fixture();
    initial.queue.identify('previous');
    for (let index = 0; index < 40; index++)
        initial.queue.track('search', { scope: 'pyq', queryLength: index });
    const restored = initial.queue.snapshot;
    // Use disjoint IDs as two genuine cold starts do.
    let id = 500;
    const { queue, sends } = fixture({
        restored,
        waitForIdentity: true,
        id: () => String(++id).padStart(32, '0'),
    });
    queue.track('content_view', { type: 'note', id: contentId });
    await queue.flush();
    assert.equal(sends.length, 0);
    queue.identify('current');
    await queue.flush();
    assert.deepEqual(
        sends.flatMap((batch) => batch.events.map((event) => event.name)),
        ['session_start', 'content_view'],
    );
});
test('restored queue for the same verified identity retries previous event IDs', async () => {
    const old = fixture({ waitForIdentity: true });
    old.queue.identify('same');
    old.queue.track('share', { type: 'note', id: contentId });
    let id = 700;
    const current = fixture({
        restored: old.queue.snapshot,
        waitForIdentity: true,
        id: () => String(++id).padStart(32, '0'),
    });
    current.queue.identify('same');
    await current.queue.flush();
    assert.ok(
        current.sends[0].events.some(
            (event) =>
                event.eventId === old.queue.snapshot.events.at(-1).eventId,
        ),
    );
});
test('serialized writes cannot restore an older snapshot over a new queue', async () => {
    let finish;
    const writes = [];
    const { queue } = fixture({
        persist: async (value) => {
            if (!writes.length)
                await new Promise((resolve) => {
                    finish = resolve;
                });
            writes.push(value);
        },
    });
    await Promise.resolve();
    queue.track('share', { type: 'note', id: contentId });
    await Promise.resolve();
    assert.equal(writes.length, 0);
    finish();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(writes.at(-1).events.length, 2);
});
test('heartbeats cap foreground seconds and final hide emits once; 30 minute hidden rotates', () => {
    const { queue, advance } = fixture();
    advance(45000);
    queue.heartbeat();
    advance(12345);
    queue.hide();
    queue.hide();
    assert.deepEqual(
        queue.snapshot.events
            .filter((event) => event.name === 'heartbeat')
            .map((event) => event.props.sec),
        [30, 12.345],
    );
    const session = queue.session;
    advance(1799999);
    queue.show();
    assert.equal(queue.session, session);
    queue.hide();
    advance(1800000);
    queue.show();
    assert.notEqual(queue.session, session);
});
test('screen duration is capped and dynamic item changes with same template emit a new view', () => {
    const { queue, advance } = fixture();
    queue.screen(
        '/[slug]/notes/[note-slug]',
        'college',
        '/college/notes/first-private-title',
    );
    advance(1900000);
    queue.screen(
        '/[slug]/notes/[note-slug]',
        'college',
        '/college/notes/second-private-title',
    );
    const events = queue.snapshot.events.filter(
        (event) => event.name === 'screen_view',
    );
    assert.equal(events.length, 2);
    assert.equal(events[1].props.prevDurationMs, 1800000);
    assert.ok(!JSON.stringify(queue.snapshot).includes('private-title'));
});
test('PII, raw URLs, slug IDs and server-only names are never queued', () => {
    const { queue } = fixture();
    queue.track('content_view', { type: 'blog', id: 'private-title' });
    queue.track('login', { email: 'person@example.test' });
    queue.track('search', {
        scope: 'blog',
        queryLength: 4,
        query: 'private-name',
        token: 'secret',
    });
    queue.screen('/secret?token=private');
    assert.deepEqual(
        queue.snapshot.events.map((event) => event.name),
        ['session_start', 'search'],
    );
    assert.deepEqual(queue.snapshot.events.at(-1).props, {
        scope: 'blog',
        queryLength: 4,
    });
});
test('route templates replace scalar, encoded and catch-all params, strip queries and mask unknown error paths', () => {
    assert.equal(
        routeTemplate(
            '/college/notes/private%20name?q=secret',
            { slug: 'college', note: 'private name' },
            ['notes'],
        ),
        '/[slug]/notes/[note]',
    );
    assert.equal(
        routeTemplate('/notes/a/b/c', { slug: ['a', 'b', 'c'] }, ['notes']),
        '/notes/[...slug]',
    );
    assert.equal(
        routeTemplate('/unknown/alice/token-secret', {}, ['notes']),
        '/[unknown]/[unknown]/[unknown]',
    );
    assert.equal(
        routeTemplate('/+not-found', {}, ['+not-found']),
        '/+not-found',
    );
});
test('anonymous ID survives cookie/localStorage loss independently and cookie lasts one year', () => {
    const values = new Map();
    let cookie = '';
    const storage = {
        getItem: (key) => values.get(key) || null,
        setItem: (key, value) => values.set(key, value),
    };
    const first = browserIdentity(storage, '', (value) => {
        cookie = value;
    });
    assert.equal(first.anonId.length, 32);
    assert.equal(first.isNewInstall, true);
    assert.match(cookie, /Max-Age=31536000/);
    assert.equal(browserIdentity(storage, '', () => {}).anonId, first.anonId);
    values.clear();
    assert.equal(
        browserIdentity(storage, cookie, () => {}).anonId,
        first.anonId,
    );
    assert.equal(
        browserIdentity(storage, cookie, () => {}).isNewInstall,
        false,
    );
});
test('corrupt storage prototype names and unsupported labels cannot crash or leak freeform props', () => {
    const initial = fixture().queue.snapshot.events[0];
    const restored = {
        identity: null,
        events: [
            { ...initial, name: 'constructor' },
            { ...initial, name: 'toString' },
            { ...initial, sessionId: undefined },
            {
                ...initial,
                name: 'contact_click',
                props: {
                    type: 'senior',
                    id: contentId,
                    channel: 'private@example.test',
                },
            },
            {
                ...initial,
                name: 'session_start',
                props: { launchSource: 'private-name' },
            },
            {
                ...initial,
                name: 'paywall_shown',
                props: { type: 'pyq', id: contentId, tier: 'free form name' },
            },
        ],
    };
    const { queue } = fixture({ restored });
    queue.track('constructor');
    queue.track('toString');
    assert.deepEqual(
        queue.snapshot.events.map((event) => event.name),
        ['session_start'],
    );
});

test('browser adapter sends credentialed keepalive requests and text/plain hidden-page beacons', async () => {
    const keys = ['window', 'document', 'navigator', 'location', 'fetch'];
    const descriptors = Object.fromEntries(
        keys.map((key) => [
            key,
            Object.getOwnPropertyDescriptor(globalThis, key),
        ]),
    );
    const requests = [],
        beacons = [],
        listeners = new Map(),
        values = new Map();
    const storage = {
        getItem: (key) => values.get(key) || null,
        setItem: (key, value) => values.set(key, value),
    };
    const document = {
        cookie: '',
        visibilityState: 'visible',
        addEventListener: (name, fn) => listeners.set(name, fn),
        removeEventListener: (name) => listeners.delete(name),
    };
    const replacements = {
        window: {
            localStorage: storage,
            setTimeout,
            clearTimeout,
            setInterval: () => 1,
            clearInterval: () => {},
            addEventListener: (name, fn) => listeners.set(name, fn),
            removeEventListener: (name) => listeners.delete(name),
        },
        document,
        location: { protocol: 'https:' },
        navigator: {
            sendBeacon: (url, body) => {
                beacons.push({ url, body });
                return false;
            },
        },
        fetch: async (url, options) => {
            requests.push({ url, options });
            return { status: 204, headers: new Headers() };
        },
    };
    for (const [key, value] of Object.entries(replacements))
        Object.defineProperty(globalThis, key, {
            configurable: true,
            writable: true,
            value,
        });
    try {
        const { analytics } = require('../src/analytics/index.ts');
        const stop = analytics.start();
        analytics.identify(null);
        analytics.track('content_view', { type: 'blog', id: contentId });
        await analytics.flush();
        const request = requests[0];
        const platform =
            require('../package.json').name === 'studentsenior-blog'
                ? 'blog'
                : 'web';
        assert.ok(request.url.endsWith('/events'));
        assert.equal(request.options.credentials, 'include');
        assert.equal(request.options.keepalive, true);
        assert.equal(JSON.parse(request.options.body).platform, platform);
        assert.equal(request.options.headers['X-Platform'], platform);
        assert.match(document.cookie, /Max-Age=31536000/);
        assert.match(document.cookie, /Secure/);
        analytics.track('share', { type: 'blog', id: contentId });
        document.visibilityState = 'hidden';
        listeners.get('visibilitychange')();
        assert.equal(beacons[0].body.type, 'text/plain');
        assert.ok(beacons[0].body.size < 48000);
        const beacon = JSON.parse(await beacons[0].body.text());
        await analytics.flush();
        assert.ok(
            JSON.parse(requests[1].options.body).events.some(
                (event) => event.eventId === beacon.events[0].eventId,
            ),
        );
        stop();
    } finally {
        for (const key of keys) {
            if (descriptors[key])
                Object.defineProperty(globalThis, key, descriptors[key]);
            else delete globalThis[key];
        }
    }
});
