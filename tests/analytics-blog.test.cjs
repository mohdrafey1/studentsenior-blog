const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const Module = require('node:module');
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

test('blog adapter has no unused login or identity API', () => {
    const { analytics } = require('../src/analytics/index.ts');
    for (const name of [
        'identify',
        'reset',
        'prepareIdentityChange',
        'cancelIdentityChange',
    ])
        assert.equal(name in analytics, false);
});

test('blog cards track native and clipboard share success, never cancellation', async () => {
    const calls = [];
    const filename = require.resolve('../src/app/components/blog-list.tsx');
    const cardModule = new Module(filename, module);
    cardModule.paths = module.paths;
    cardModule.require = (name) => {
        if (name === '@/analytics')
            return { analytics: { track: (...args) => calls.push(args) } };
        if (name === '@/analytics/share')
            return require('../src/analytics/share.ts');
        if (name === 'next/navigation')
            return { useRouter: () => ({ push() {} }) };
        if (name === './blog-post-card')
            return { __esModule: true, default: 'article' };
        return require(name);
    };
    cardModule._compile(
        ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                jsx: ts.JsxEmit.ReactJSX,
                esModuleInterop: true,
            },
        }).outputText,
        filename,
    );
    const post = {
        _id: '507f1f77bcf86cd799439011',
        slug: 'private-title',
        title: 'Private title',
        description: 'Private text',
    };
    const tree = cardModule.exports.default({ posts: [post], currentPage: 1 });
    const handleShare = tree.props.children[0].props.onShare;
    const originals = Object.fromEntries(
        ['window', 'navigator', 'alert'].map((name) => [
            name,
            Object.getOwnPropertyDescriptor(globalThis, name),
        ]),
    );
    let resolve;
    const clipboard = [];
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { location: { origin: 'https://blog.example.test' } },
    });
    Object.defineProperty(globalThis, 'alert', {
        configurable: true,
        value() {},
    });
    try {
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: {
                clipboard: {
                    writeText: async (value) => {
                        clipboard.push(value);
                    },
                },
                share: () =>
                    new Promise((done) => {
                        resolve = done;
                    }),
            },
        });
        const pending = handleShare();
        assert.equal(calls.length, 0);
        assert.deepEqual(clipboard, [
            'https://blog.example.test/private-title',
        ]);
        resolve();
        await pending;
        assert.deepEqual(calls, [['share', { type: 'blog', id: post._id }]]);
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: {
                share: async () => {
                    throw new DOMException('Cancelled', 'AbortError');
                },
            },
        });
        await handleShare();
        assert.equal(calls.length, 1);
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: { clipboard: { writeText: async () => {} } },
        });
        await handleShare();
        assert.equal(calls.length, 2);
        assert.ok(!JSON.stringify(calls).includes('Private'));
    } finally {
        for (const [name, descriptor] of Object.entries(originals)) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    }
});

test('blog search constructs its tracker only once across renders', () => {
    const React = require('react');
    const filename = require.resolve('../src/app/search/page.tsx');
    const loaded = new Module(filename, module);
    const ref = { current: null };
    let constructions = 0;
    loaded.require = (name) => {
        if (name === 'react')
            return {
                ...React,
                useState: (initial) => [initial, () => {}],
                useEffect() {},
                useRef: () => ref,
            };
        if (name === '@/analytics/search')
            return {
                SearchTracker: class {
                    constructor() {
                        constructions++;
                    }
                    update() {}
                },
            };
        if (name === 'next/navigation')
            return { useSearchParams: () => new URLSearchParams('q=exam') };
        if (name === 'next/font/google')
            return { Poppins: () => ({ className: '' }) };
        if (name === '@/config/apiConfig') return { api: {} };
        if (name === '@/utils/cloudinary')
            return { optimizeCloudinaryUrl: (value) => value };
        if (name === '@/utils/formatting')
            return { formatDate: (value) => value };
        if (name === '@/analytics') return { analytics: { track() {} } };
        if (name.startsWith('@/app/components/'))
            return { __esModule: true, default: 'div' };
        return require(name);
    };
    loaded._compile(
        ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                jsx: ts.JsxEmit.ReactJSX,
                esModuleInterop: true,
            },
        }).outputText,
        filename,
    );
    const find = (node) => {
        if (!node || typeof node !== 'object') return;
        if (
            typeof node.type === 'function' &&
            node.type.name === 'SearchResults'
        )
            return node.type;
        for (const child of React.Children.toArray(node.props?.children)) {
            const match = find(child);
            if (match) return match;
        }
    };
    const results = find(loaded.exports.default());
    assert.ok(results);
    results();
    results();
    results();
    assert.equal(constructions, 1);
});
