import type { Batch } from './core';

/** text/plain is CORS safelisted: analytics needs no OPTIONS request. */
export async function sendBatch(
    endpoint: string,
    batch: Batch,
    parent: AbortSignal,
) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    parent.addEventListener('abort', abort, { once: true });
    if (parent.aborted) controller.abort();
    const timeout = setTimeout(abort, 5000);
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            keepalive: true,
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(batch),
            signal: controller.signal,
        });
        return {
            status: response.status,
            retryAfter: response.headers.get('Retry-After'),
        };
    } finally {
        clearTimeout(timeout);
        parent.removeEventListener('abort', abort);
    }
}
