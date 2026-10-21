/** Tracks a query's first settled response; page/filter changes reuse that query. */
export class SearchTracker {
    private current = '';
    private emitted = '';
    constructor(initialQuery = '', skipInitial = false) {
        this.current = initialQuery.trim();
        this.emitted = skipInitial ? this.current : '';
    }
    update(query: string) {
        const next = query.trim();
        if (next !== this.current) {
            this.current = next;
            this.emitted = '';
        }
    }
    settleFirstPage(query: string, page: number) {
        return page === 1 ? this.settle(query, undefined) : null;
    }
    settle(
        query: string,
        total: unknown,
    ): { queryLength: number; resultCount?: number } | null {
        const term = query.trim();
        if (!term || term !== this.current || term === this.emitted)
            return null;
        this.emitted = term;
        return {
            queryLength: term.length,
            ...(typeof total === 'number' &&
            Number.isInteger(total) &&
            total >= 0
                ? { resultCount: total }
                : {}),
        };
    }
}

/** API list endpoints currently use totalItems; newer envelopes may use total. */
export function searchTotal(value: unknown): number | undefined {
    const candidate =
        typeof value === 'number'
            ? value
            : value && typeof value === 'object'
              ? ((value as { total?: unknown; totalItems?: unknown }).total ??
                (value as { totalItems?: unknown }).totalItems)
              : undefined;
    return typeof candidate === 'number' &&
        Number.isInteger(candidate) &&
        candidate >= 0
        ? candidate
        : undefined;
}

/** An explicit submission can call the same tracker before this quiet-period fallback. */
export function scheduleSettledSearch(settle: () => void): () => void {
    const timer = setTimeout(settle, 1500);
    return () => clearTimeout(timer);
}
