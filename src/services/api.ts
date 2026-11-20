// Shared API helpers: base URL, auth header, and the list of collections the app loads.

export const API_URL: string = import.meta.env.VITE_API_URL || 'https://gogain-backend.onrender.com/';

export function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('authToken');
    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });
}

// Name used in the app's `data` object -> backend route and the key holding the list in the response.
export const COLLECTIONS = {
    transaction:      { path: 'transaction',       key: 'transactions' },
    costTransactions: { path: 'cost-transactions', key: 'costs' },
    client:           { path: 'client',            key: 'client' },
    users:            { path: 'users',             key: 'users' },
    center:           { path: 'center',            key: 'center' },
    service:          { path: 'service',           key: 'service' },
    costs:            { path: 'costs',             key: 'costs' },
} as const;

export type CollectionName = keyof typeof COLLECTIONS;
export const ALL_COLLECTIONS = Object.keys(COLLECTIONS) as CollectionName[];

// Loaded once at startup. Transactions and cost transactions are NOT loaded up front any more:
// the Transactions page fetches them page by page and reports use server-side totals.
export const REFERENCE_COLLECTIONS: CollectionName[] = ['client', 'users', 'center', 'service', 'costs'];

export function isTransactionCollection(name: CollectionName): boolean {
    return name === 'transaction' || name === 'costTransactions';
}

function toQuery(params: Record<string, any>): string {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
            if (value.length > 0) search.set(key, value.join(','));
        } else {
            search.set(key, String(value));
        }
    });
    const query = search.toString();
    return query ? `?${query}` : '';
}

export interface PageParams {
    page: number;
    limit: number;
    center?: string[];
    client?: string[];
    worker?: string[];
    service?: string[];
}

export async function fetchPage(name: CollectionName, params: PageParams): Promise<{ items: any[], total: number }> {
    const { path, key } = COLLECTIONS[name];
    const response = await apiFetch(`${path}${toQuery(params as any)}`);
    if (!response.ok) throw new Error(`Failed to load ${path} (${response.status})`);
    const json = await response.json();
    return { items: json[key] || [], total: json.total ?? 0 };
}

export interface AggregateParams {
    from?: string;               // YYYY-MM-DD
    to?: string;                 // YYYY-MM-DD
    by?: 'center' | 'worker' | 'service';
    period?: 'month' | 'day';
    center?: string[];
    worker?: string[];
}

export interface AggregateRow {
    center?: string;
    worker?: string;
    service?: string;
    period?: string;             // "2026-03" or "2026-03-05"
    type: 'revenue' | 'cost';
    amount: number;              // excluding taxes
    count: number;
}

export async function fetchAggregate(params: AggregateParams): Promise<AggregateRow[]> {
    const response = await apiFetch(`reports/aggregate${toQuery(params as any)}`);
    if (!response.ok) throw new Error(`Failed to load report (${response.status})`);
    const json = await response.json();
    return json.rows || [];
}

/**
 * Turn server totals into "summary entries" shaped like transactions
 * ({ center|worker|service, date, typeOfTransaction, cost: amount, taxes: 0 }),
 * so the existing chart calculations in tools/finance.ts and cashFlowTools.tsx work unchanged.
 * The date is the start of the period, clamped to the requested `from` date so that a
 * partial first month still falls inside the date-range filters.
 */
export function aggregateToEntries(rows: AggregateRow[], params: AggregateParams): any[] {
    const fromTime = params.from ? Date.parse(`${params.from}T00:00:00.000Z`) : null;
    return rows.map(row => {
        let date: string;
        if (row.period) {
            const start = Date.parse(row.period.length === 7 ? `${row.period}-01T00:00:00.000Z` : `${row.period}T00:00:00.000Z`);
            date = new Date(fromTime !== null ? Math.max(start, fromTime) : start).toISOString();
        } else {
            date = new Date(fromTime ?? 0).toISOString();
        }
        return {
            ...(params.by ? { [params.by]: (row as any)[params.by] } : {}),
            date,
            typeOfTransaction: row.type,
            cost: row.amount,
            taxes: 0,
            count: row.count,
        };
    });
}

// Describes what changed after a save/delete, so the app can patch its data in memory
// instead of downloading every collection again.
export interface DataChange {
    upserted?: any[];
    deletedIds?: string[];
}

function byDateAsc(a: any, b: any) {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
}

// Keep the same ordering the app has always used.
export function sortCollection(name: CollectionName, items: any[]): any[] {
    if (name === 'transaction' || name === 'costTransactions') {
        return [...items].sort(byDateAsc);
    }
    if (name === 'client') {
        return [...items].sort((a, b) =>
            (a.firstName || '').toLowerCase().localeCompare((b.firstName || '').toLowerCase())
        );
    }
    return items;
}

export async function fetchCollection(name: CollectionName): Promise<any[]> {
    const { path, key } = COLLECTIONS[name];
    const response = await apiFetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load ${path} (${response.status})`);
    }
    const json = await response.json();
    return sortCollection(name, json[key] || []);
}

// Apply a DataChange to one collection's array.
export function applyChangeToList(name: CollectionName, list: any[] = [], change: DataChange): any[] {
    let result = list;

    if (change.deletedIds && change.deletedIds.length > 0) {
        const removed = new Set(change.deletedIds);
        result = result.filter(item => !removed.has(item._id));
    }

    if (change.upserted && change.upserted.length > 0) {
        const updates = new Map(change.upserted.filter(Boolean).map(doc => [doc._id, doc]));
        result = result.map(item => updates.has(item._id) ? { ...item, ...updates.get(item._id) } : item);
        const existingIds = new Set(result.map(item => item._id));
        const added = [...updates.values()].filter(doc => !existingIds.has(doc._id));
        if (added.length > 0) {
            result = [...result, ...added];
        }
        result = sortCollection(name, result);
    }

    return result;
}

// Backend responses wrap the saved document differently per route
// ({ transaction }, { costTransaction }, { updatedCenter: [doc] }, ...). Find it.
export function extractSavedDoc(json: any): any | null {
    if (!json || typeof json !== 'object') return null;
    for (const value of Object.values(json)) {
        if (Array.isArray(value) && value[0] && typeof value[0] === 'object' && '_id' in value[0]) return value[0];
        if (value && typeof value === 'object' && !Array.isArray(value) && '_id' in (value as any)) return value;
    }
    return null;
}
