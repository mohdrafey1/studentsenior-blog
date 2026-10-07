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
    await queue.flushPersistence();
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
test('rejected beacon retains IDs and accepted beacon removes only its batch', () => {
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
            accepted ? ids.slice(50) : ids,
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
test('same-account re-login rotates and forced auth flush bypasses Retry-After', async () => {
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
    assert.equal(calls, 2);
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
test('serialized persistence coalesces pending changes into the latest snapshot', async () => {
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
    const first = queue.flushPersistence();
    await new Promise((resolve) => setImmediate(resolve));
    queue.track('share', { type: 'note', id: contentId });
    const latest = queue.flushPersistence();
    assert.equal(writes.length, 0);
    finish();
    await Promise.all([first, latest]);
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
    advance(1700000);
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
    advance(1700000);
    queue.activity();
    advance(200000);
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
        analytics.identify?.(null);
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
        assert.deepEqual(request.options.headers, {
            'Content-Type': 'text/plain',
        });
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

const { tabStorage } = require('../src/analytics/browserStorage.ts');
const { sendBatch } = require('../src/analytics/transport.ts');
const { SearchTracker } = require('../src/analytics/search.ts');
const { shareAndTrack } = require('../src/analytics/share.ts');
function memoryStorage() {
    const values = new Map();
    return {
        get length() {
            return values.size;
        },
        key: (index) => [...values.keys()][index] || null,
        getItem: (key) => values.get(key) || null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
    };
}
test('session survives reload/new tab; visible idle expires, heartbeats never extend activity', () => {
    let now = 10000000,
        session;
    let count = 0;
    const options = {
        now: () => now,
        id: () => String(++count).padStart(32, '0'),
        readSession: () => session,
        writeSession: (value) => {
            session = value;
        },
        waitForIdentity: true,
    };
    const a = fixture(options).queue;
    now += 1000;
    const b = fixture(options).queue;
    assert.equal(a.session, b.session);
    assert.equal(b.snapshot.events.length, 0);
    for (let n = 0; n < 60; n++) {
        now += 30000;
        b.heartbeat();
    }
    const previous = b.session;
    b.activity();
    assert.notEqual(b.session, previous);
    assert.equal(
        b.snapshot.events.filter((e) => e.name === 'session_start').length,
        1,
    );
    a.activity();
    assert.equal(a.session, b.session);
    assert.equal(
        a.snapshot.events.filter((e) => e.name === 'session_start').length,
        1,
    );
});
test('login in one tab rotates once and the other tab adopts the shared session', () => {
    let session,
        count = 0;
    const options = {
        readSession: () => session,
        writeSession: (value) => {
            session = value;
        },
        id: () => String(++count).padStart(32, '0'),
    };
    const a = fixture(options).queue;
    const b = fixture(options).queue;
    a.identify('account');
    b.identify('account', true);
    assert.equal(a.session, b.session);
    assert.equal(
        b.snapshot.events.filter((e) => e.name === 'session_start').length,
        0,
    );
});
test('route params decode both sides and consume only the first matching segment', () => {
    assert.equal(
        routeTemplate(
            '/college/notes/hello%20world',
            { slug: 'college', note: 'hello%20world' },
            ['notes'],
        ),
        '/[slug]/notes/[note]',
    );
    assert.equal(
        routeTemplate(
            '/x/resources/bca/bca',
            { slug: 'x', courseCode: 'bca' },
            ['resources'],
        ),
        '/[slug]/resources/[courseCode]/[unknown]',
    );
    assert.equal(
        routeTemplate('/x/a/a', { first: 'a', second: 'a', slug: 'x' }),
        '/[slug]/[first]/[second]',
    );
    assert.equal(
        routeTemplate('/a%20b/c%2Bd', { slug: ['a%20b', 'c+d'] }),
        '/[...slug]',
    );
});
test('live tabs keep independent queues; dead queues merge once by eventId and cap oldest at 500', () => {
    let now = 1000;
    const storage = memoryStorage();
    const a = tabStorage(storage, 'queue', null, () => now, 'aaaaaaaa');
    const event = { eventId: 'event0001', ts: new Date(now).toISOString() };
    a.persist({ identity: null, events: [event] });
    const b = tabStorage(storage, 'queue', null, () => now, 'bbbbbbbb');
    assert.equal(b.restored.events.length, 0);
    b.persist({
        identity: null,
        events: [
            event,
            { eventId: 'event0002', ts: new Date(now).toISOString() },
        ],
    });
    now += 90001;
    const c = tabStorage(storage, 'queue', null, () => now, 'cccccccc');
    assert.deepEqual(
        c.restored.events.map((e) => e.eventId),
        ['event0001', 'event0002'],
    );
    assert.equal(storage.getItem(a.key), null);
    assert.equal(storage.getItem(b.key), null);
    const d = tabStorage(storage, 'queue', null, () => now, 'dddddddd');
    assert.equal(d.restored.events.length, 0);
    c.persist({
        identity: null,
        events: Array.from({ length: 550 }, (_, i) => ({
            eventId: `event${i}`,
            ts: new Date(i).toISOString(),
        })),
    });
    c.release();
    const e = tabStorage(storage, 'queue', null, () => now, 'eeeeeeee');
    assert.equal(e.restored.events.length, 500);
    assert.equal(e.restored.events[0].eventId, 'event50');
});
test('per-tab recovery discards another identity and session state persists across tabs', () => {
    const storage = memoryStorage();
    const a = tabStorage(storage, 'queue', 'old', () => 1000, 'aaaaaaaa');
    a.persist({
        identity: 'old',
        events: [{ eventId: 'event0001', ts: new Date(1).toISOString() }],
    });
    a.writeSession({ sessionId: 'session1', lastActiveAt: 1000 });
    a.release();
    const b = tabStorage(storage, 'queue', 'new', () => 1001, 'bbbbbbbb');
    assert.equal(b.restored.events.length, 0);
    assert.deepEqual(b.readSession(), {
        sessionId: 'session1',
        lastActiveAt: 1000,
    });
});
test('persistence writes at most once per second and hide persists the latest queue', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { queue, writes, advance } = fixture({ waitForIdentity: true });
    queue.track('search', { scope: 'pyq', queryLength: 3 });
    t.mock.timers.tick(999);
    await Promise.resolve();
    assert.equal(writes.length, 0);
    advance(1000);
    t.mock.timers.tick(1);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(writes.length, 1);
    queue.track('search', { scope: 'pyq', queryLength: 4 });
    t.mock.timers.tick(999);
    await Promise.resolve();
    assert.equal(writes.length, 1);
    queue.hide();
    await queue.flushPersistence();
    assert.equal(writes.length, 2);
    assert.ok(writes[1].events.some((e) => e.props.queryLength === 4));
});
test('identity flush has one 1.5 second deadline, aborts transport and cannot retry with next auth', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let signal,
        finish,
        calls = 0;
    const { queue } = fixture({
        send: async (_batch, input) => {
            signal = input;
            calls++;
            return new Promise((resolve) => {
                finish = resolve;
            });
        },
    });
    const flight = queue.flush();
    const changing = queue.prepareIdentityChange();
    t.mock.timers.tick(1500);
    await changing;
    assert.equal(signal.aborted, true);
    assert.equal(queue.snapshot.events.length, 0);
    queue.identify('next-account');
    finish({ status: 503 });
    await flight;
    assert.equal(calls, 1);
    assert.equal(queue.snapshot.events[0].name, 'session_start');
});
test('fetch transport is safelisted and obeys the identity abort signal', async () => {
    const original = global.fetch;
    let request;
    global.fetch = async (_url, options) => {
        request = options;
        return new Promise((_resolve, reject) =>
            options.signal.addEventListener('abort', () =>
                reject(new Error('aborted')),
            ),
        );
    };
    try {
        const controller = new AbortController();
        const sent = sendBatch(
            '/events',
            { platform: 'web', sent: new Date().toISOString(), events: [] },
            controller.signal,
        );
        assert.deepEqual(request.headers, { 'Content-Type': 'text/plain' });
        assert.equal(request.keepalive, true);
        controller.abort();
        await assert.rejects(sent, /aborted/);
        assert.equal(request.signal.aborted, true);
    } finally {
        global.fetch = original;
    }
});
test('search sends one settled total per query, ignores pagination, filters and stale responses', () => {
    const tracker = new SearchTracker();
    tracker.update('math');
    assert.deepEqual(tracker.settle('math', 137), {
        queryLength: 4,
        resultCount: 137,
    });
    assert.equal(tracker.settle('math', 15), null);
    tracker.update('science');
    assert.equal(tracker.settle('math', 137), null);
    assert.deepEqual(tracker.settle('science', 50), {
        queryLength: 7,
        resultCount: 50,
    });
    tracker.update('');
    tracker.update('math');
    assert.ok(tracker.settle('math', 137));
    const sharedLink = new SearchTracker('calculator', true);
    assert.equal(sharedLink.settle('calculator', 2), null);
    sharedLink.update('books');
    assert.deepEqual(sharedLink.settle('books', 20), {
        queryLength: 5,
        resultCount: 20,
    });
});
test('native share records only after resolution and never after cancellation/failure', async () => {
    let count = 0,
        resolve;
    const pending = shareAndTrack(
        () =>
            new Promise((done) => {
                resolve = done;
            }),
        () => count++,
    );
    assert.equal(count, 0);
    resolve();
    await pending;
    assert.equal(count, 1);
    await assert.rejects(
        shareAndTrack(
            async () => {
                throw new DOMException('Cancelled', 'AbortError');
            },
            () => count++,
        ),
    );
    assert.equal(count, 1);
});
test('blog search tracks only the first results page once for each query', () => {
    const tracker = new SearchTracker('exam');
    assert.equal(tracker.settleFirstPage('exam', 2), null);
    assert.deepEqual(tracker.settleFirstPage('exam', 1), { queryLength: 4 });
    assert.equal(tracker.settleFirstPage('exam', 1), null);
    tracker.update('college');
    assert.equal(tracker.settleFirstPage('college', 3), null);
    assert.deepEqual(tracker.settleFirstPage('college', 1), { queryLength: 7 });
});
test('settled search uses API totalItems or total, never current page length', () => {
    const { searchTotal } = require('../src/analytics/search.ts');
    const response = {
        data: {
            notes: Array(20),
            pagination: { currentPage: 2, totalItems: 137, totalPages: 7 },
        },
    };
    assert.equal(searchTotal(response.data.pagination), 137);
    assert.equal(searchTotal({ total: 155, totalItems: 137 }), 155);
    assert.equal(searchTotal(42), 42);
    assert.equal(searchTotal({ currentPage: 1 }), undefined);
});
test('initial auth mismatch rotates the restored session and rebinds buffered views without changing IDs', () => {
    let shared = {
        sessionId: 'old_session_1234',
        lastActiveAt: Date.parse('2026-10-07T10:00:00Z'),
    };
    const { queue } = fixture({
        waitForIdentity: true,
        restored: { identity: 'old-account', events: [] },
        readSession: () => shared,
        writeSession: (value) => {
            shared = value;
        },
    });
    queue.screen('/pyqs');
    const id = queue.snapshot.events[0].eventId;
    queue.identify('new-account');
    assert.notEqual(queue.session, 'old_session_1234');
    const view = queue.snapshot.events.find(
        (event) => event.name === 'screen_view',
    );
    assert.equal(view.eventId, id);
    assert.equal(view.sessionId, queue.session);
    assert.equal(
        queue.snapshot.events.filter((event) => event.name === 'session_start')
            .length,
        1,
    );
});
test('initial auth mismatch preserves one cold-start event and adopts another tab rotation without duplicating it', () => {
    const { queue } = fixture({ waitForIdentity: true });
    const first = queue.snapshot.events[0].eventId;
    queue.identify('account');
    assert.equal(queue.snapshot.events.length, 1);
    assert.equal(queue.snapshot.events[0].eventId, first);
    let shared = {
        sessionId: 'old_session_1234',
        lastActiveAt: Date.parse('2026-10-07T10:00:00Z'),
    };
    const pending = fixture({
        waitForIdentity: true,
        readSession: () => shared,
        writeSession: (value) => {
            shared = value;
        },
    }).queue;
    pending.screen('/pyqs');
    shared = { ...shared, sessionId: 'another_tab_new_session' };
    pending.identify('account', true);
    assert.equal(pending.session, shared.sessionId);
    assert.equal(pending.snapshot.events.length, 1);
    assert.equal(pending.snapshot.events[0].sessionId, shared.sessionId);
});
test('initial identity rotation retains its session start and latest 499 events at queue capacity', () => {
    const { queue } = fixture({
        waitForIdentity: true,
        restored: { identity: 'old-account', events: [] },
        readSession: () => ({
            sessionId: 'old_session_1234',
            lastActiveAt: Date.parse('2026-10-07T10:00:00Z'),
        }),
    });
    for (let index = 0; index < 500; index++)
        queue.track('search', { scope: 'pyq', queryLength: index });
    const newestId = queue.snapshot.events.at(-1).eventId;
    queue.identify('new-account');
    assert.equal(queue.snapshot.events.length, 500);
    assert.equal(queue.snapshot.events[0].name, 'session_start');
    assert.equal(queue.snapshot.events[1].props.queryLength, 1);
    assert.equal(queue.snapshot.events.at(-1).eventId, newestId);
});
