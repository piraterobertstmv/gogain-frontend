// React hooks for data that now lives on the server instead of in the startup download:
// - useAggregateEntries: report totals for charts (Dashboard, Cash Flow)
// - usePagedList: one page of transactions / cost transactions
//
// Both re-fetch automatically when the "transactions version" changes, which Application
// bumps after any transaction or cost is created, edited or deleted.

import { createContext, useContext, useEffect, useState } from 'react';
import { aggregateToEntries, AggregateParams, CollectionName, fetchAggregate, fetchPage, PageParams } from './api';

export const TransactionsVersionContext = createContext(0);

export function useAggregateEntries(params: AggregateParams | null): { entries: any[], loading: boolean, error: string | null } {
    const version = useContext(TransactionsVersionContext);
    const [state, setState] = useState<{ entries: any[], loading: boolean, error: string | null }>({ entries: [], loading: params !== null, error: null });
    const key = params ? JSON.stringify(params) : null;

    useEffect(() => {
        if (!params) {
            setState({ entries: [], loading: false, error: null });
            return;
        }
        let cancelled = false;
        setState(prev => ({ ...prev, loading: true, error: null }));
        fetchAggregate(params)
            .then(rows => { if (!cancelled) setState({ entries: aggregateToEntries(rows, params), loading: false, error: null }); })
            .catch(error => { if (!cancelled) setState({ entries: [], loading: false, error: error.message || 'Failed to load report' }); });
        return () => { cancelled = true; };
        // `key` captures every field of params
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, version]);

    return state;
}

export function usePagedList(collection: CollectionName, params: PageParams): { items: any[], total: number, loading: boolean, error: string | null } {
    const version = useContext(TransactionsVersionContext);
    const [state, setState] = useState<{ items: any[], total: number, loading: boolean, error: string | null }>({ items: [], total: 0, loading: true, error: null });
    const key = JSON.stringify(params);

    useEffect(() => {
        let cancelled = false;
        setState(prev => ({ ...prev, loading: true, error: null }));
        fetchPage(collection, params)
            .then(({ items, total }) => { if (!cancelled) setState({ items, total, loading: false, error: null }); })
            .catch(error => { if (!cancelled) setState(prev => ({ ...prev, loading: false, error: error.message || 'Failed to load' })); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collection, key, version]);

    return state;
}
