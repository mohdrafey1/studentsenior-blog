const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { Prism } = require('react-syntax-highlighter');
const { atomDark } = require('react-syntax-highlighter/dist/cjs/styles/prism');
test('updated syntax highlighter renders code as escaped text', () => {
    const html = renderToStaticMarkup(React.createElement(Prism, { language: 'text', style: atomDark }, '<img src=x onerror=alert(1)>'));
    assert.ok(html.includes('&lt;img')); assert.ok(!html.includes('<img'));
});
