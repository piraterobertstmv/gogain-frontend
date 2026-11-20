import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from '../components/Header';
import { LeftButtonsRadio } from '../components/LeftButtonsRadio';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Dashboard } from './Dashboard';
import { CashFlow } from './CashFlow';
import { Setup } from './Setup';
import { Transactions } from './Transactions';
import { Reports } from './Reports';
import { Settings } from './Settings';
import { applyChangeToList, CollectionName, DataChange, fetchCollection, isTransactionCollection, REFERENCE_COLLECTIONS } from '../services/api';
import { TransactionsVersionContext } from '../services/serverData';

// Called by pages after something was saved or deleted.
// - With a `change`: the data is patched in memory (no network).
// - Without one: only that collection is downloaded again.
export type OnDataChange = (collection: CollectionName, change?: DataChange) => void;

export function Application({ user, setUser }: { user: any, setUser: any }) {
    const [data, setData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Latest data, readable from callbacks without re-creating them
    const dataRef = useRef<any>(data);
    useEffect(() => { dataRef.current = data; }, [data]);

    // Bumped whenever a transaction or cost changes; the paged lists and report totals
    // (see services/serverData.ts) re-fetch when it changes.
    const [transactionsVersion, setTransactionsVersion] = useState(0);

    // Download the given reference collections (all of them on first load) and merge them into `data`.
    // Transactions are not downloaded here any more — they're paged / aggregated on the server.
    const refresh = useCallback(async (collections: CollectionName[] = REFERENCE_COLLECTIONS) => {
        try {
            const lists = await Promise.all(collections.map(fetchCollection));
            setData((prev: any) => {
                const next = { ...prev };
                collections.forEach((name, i) => { next[name] = lists[i]; });
                return next;
            });
            setLoadError(null);
        } catch (error: any) {
            console.error('Error fetching data:', error);
            setLoadError(error.message || 'Failed to load data');
        }
    }, []);

    useEffect(() => {
        refresh().finally(() => setIsLoading(false));
    }, [refresh]);

    const onDataChange: OnDataChange = useCallback((collection, change) => {
        // Transactions/costs live on the server: just tell the lists and reports to re-fetch
        if (isTransactionCollection(collection)) {
            setTransactionsVersion(v => v + 1);
        } else if (!change || (!change.upserted?.length && !change.deletedIds?.length)) {
            refresh([collection]);
            return;
        } else {
            setData((prev: any) => ({ ...prev, [collection]: applyChangeToList(collection, prev[collection], change) }));
        }

        // Saving a transaction with a new client name creates that client on the server.
        // Fetch clients only in that case.
        if (isTransactionCollection(collection) && change?.upserted?.length) {
            const known = new Set((dataRef.current.client || []).map((c: any) => c._id));
            const hasUnknownClient = change.upserted.some(doc =>
                doc && doc.typeOfClient !== 'supplier' && doc.client && !known.has(doc.client)
            );
            if (hasUnknownClient) refresh(['client']);
        }
    }, [refresh]);

    const [idButtonsLeft, setIdButtonsLeft] = useState(2)

    // Define navigation based on user permissions
    const isAdmin = user?.isAdmin === true;
    const userPercentage = parseFloat(user?.percentage) || 0;
    const userHasCenters = user?.centers && user.centers.length > 0;
    const canAccessDashboard = isAdmin || (userHasCenters && userPercentage >= 50);
    const canAccessSetup = true; // All users can access Setup (to create clients, centers, services, costs)
    
    const allNavigation = ["Dashboard", "Cash Flow", "Set up", "Transactions", "Reports", "Settings"];
    const regularUserNavigation = canAccessSetup ? 
        (canAccessDashboard ? ["Dashboard", "Set up", "Transactions", "Settings"] : ["Set up", "Transactions", "Settings"]) :
        (canAccessDashboard ? ["Dashboard", "Transactions", "Settings"] : ["Transactions", "Settings"]);
    
    const navigationItems = isAdmin ? allNavigation : regularUserNavigation;
    
    // Map admin navigation indices to regular user indices
    let adjustedIdButtonsLeft;
    if (isAdmin) {
        adjustedIdButtonsLeft = idButtonsLeft;
    } else if (canAccessDashboard && canAccessSetup) {
        // Regular user with dashboard and setup: [Dashboard=0, Setup=1, Transactions=2, Settings=3]
        // Map from admin indices: Dashboard=0->0, Setup=2->1, Transactions=3->2, Settings=5->3
        if (idButtonsLeft === 0) adjustedIdButtonsLeft = 0; // Dashboard
        else if (idButtonsLeft === 2) adjustedIdButtonsLeft = 1; // Setup
        else if (idButtonsLeft === 3) adjustedIdButtonsLeft = 2; // Transactions
        else if (idButtonsLeft === 5) adjustedIdButtonsLeft = 3; // Settings
        else adjustedIdButtonsLeft = 2; // Default to Transactions
    } else if (canAccessSetup && !canAccessDashboard) {
        // Regular user with setup but no dashboard: [Setup=0, Transactions=1, Settings=2]
        // Map from admin indices: Setup=2->0, Transactions=3->1, Settings=5->2
        if (idButtonsLeft === 2) adjustedIdButtonsLeft = 0; // Setup
        else if (idButtonsLeft === 3) adjustedIdButtonsLeft = 1; // Transactions
        else if (idButtonsLeft === 5) adjustedIdButtonsLeft = 2; // Settings
        else adjustedIdButtonsLeft = 1; // Default to Transactions
    } else if (canAccessDashboard && !canAccessSetup) {
        // Regular user with dashboard but no setup: [Dashboard=0, Transactions=1, Settings=2]
        // Map from admin indices: Dashboard=0->0, Transactions=3->1, Settings=5->2
        if (idButtonsLeft === 0) adjustedIdButtonsLeft = 0; // Dashboard
        else if (idButtonsLeft === 3) adjustedIdButtonsLeft = 1; // Transactions
        else if (idButtonsLeft === 5) adjustedIdButtonsLeft = 2; // Settings
        else adjustedIdButtonsLeft = 1; // Default to Transactions
    } else {
        // Regular user without dashboard or setup: [Transactions=0, Settings=1]
        // Map from admin indices: Transactions=3->0, Settings=5->1
        if (idButtonsLeft === 3) adjustedIdButtonsLeft = 0; // Transactions
        else if (idButtonsLeft === 5) adjustedIdButtonsLeft = 1; // Settings
        else adjustedIdButtonsLeft = 0; // Default to Transactions
    }

    // Custom click handler for regular users to map filtered indices to admin indices
    const handleNavigationClick = (filteredIndex: number) => {
        if (isAdmin) {
            setIdButtonsLeft(filteredIndex);
        } else if (canAccessDashboard && canAccessSetup) {
            // Regular user with dashboard and setup: [Dashboard=0, Setup=1, Transactions=2, Settings=3]
            // Map to admin indices: Dashboard=0->0, Setup=1->2, Transactions=2->3, Settings=3->5
            if (filteredIndex === 0) setIdButtonsLeft(0); // Dashboard
            else if (filteredIndex === 1) setIdButtonsLeft(2); // Setup
            else if (filteredIndex === 2) setIdButtonsLeft(3); // Transactions
            else if (filteredIndex === 3) setIdButtonsLeft(5); // Settings
        } else if (canAccessSetup && !canAccessDashboard) {
            // Regular user with setup but no dashboard: [Setup=0, Transactions=1, Settings=2]
            // Map to admin indices: Setup=0->2, Transactions=1->3, Settings=2->5
            if (filteredIndex === 0) setIdButtonsLeft(2); // Setup
            else if (filteredIndex === 1) setIdButtonsLeft(3); // Transactions
            else if (filteredIndex === 2) setIdButtonsLeft(5); // Settings
        } else if (canAccessDashboard && !canAccessSetup) {
            // Regular user with dashboard but no setup: [Dashboard=0, Transactions=1, Settings=2]
            // Map to admin indices: Dashboard=0->0, Transactions=1->3, Settings=2->5
            if (filteredIndex === 0) setIdButtonsLeft(0); // Dashboard
            else if (filteredIndex === 1) setIdButtonsLeft(3); // Transactions
            else if (filteredIndex === 2) setIdButtonsLeft(5); // Settings
        } else {
            // Regular user without dashboard or setup: [Transactions=0, Settings=1]
            // Map to admin indices: Transactions=0->3, Settings=1->5
            if (filteredIndex === 0) setIdButtonsLeft(3); // Transactions
            else if (filteredIndex === 1) setIdButtonsLeft(5); // Settings
        }
    };


    return (
        <TransactionsVersionContext.Provider value={transactionsVersion}>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <Header 
                user={user} 
            />
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <LeftButtonsRadio 
                    buttonsName={navigationItems}
                    idButtonsName={adjustedIdButtonsLeft}
                    setIdButtonsLeft={handleNavigationClick}
                    setUser={setUser}
                />
                <div style={{ flex: 1, overflow: "auto" }}>
                {loadError && (
                    <div className="alert alert-danger m-3 d-flex justify-content-between align-items-center" role="alert">
                        <span>Could not load data: {loadError}</span>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => refresh()}>Retry</button>
                    </div>
                )}
                {isLoading ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <LoadingSpinner message="Loading data..." />
                    </div>
                ) : <>
                {isAdmin && (
                    <>
                        {(idButtonsLeft == 0) && (
                            <Dashboard data={data} user={user} />
                        )}
                        {(idButtonsLeft == 1) && (
                            <CashFlow data={data} user={user} />
                        )}
                        {(idButtonsLeft == 2) && (
                            <Setup data={data} onDataChange={onDataChange} user={user} />
                        )}
                        {idButtonsLeft == 3 && (
                            <Transactions data={data} onDataChange={onDataChange} user={user} />
                        )}
                        {(idButtonsLeft == 4) && (
                            <Reports data={data} />
                        )}
                        {(idButtonsLeft == 5) && (
                            <Settings user={user}/>
                        )}
                    </>
                )}
                {!isAdmin && (
                    <>
                        {(adjustedIdButtonsLeft == 0 && canAccessDashboard) && (
                            <Dashboard data={data} user={user} />
                        )}
                        {(adjustedIdButtonsLeft == 0 && !canAccessDashboard && canAccessSetup) && (
                            <Setup data={data} onDataChange={onDataChange} user={user} />
                        )}
                        {(adjustedIdButtonsLeft == 0 && !canAccessDashboard && !canAccessSetup) && (
                            <Transactions data={data} onDataChange={onDataChange} user={user} />
                        )}
                        {(adjustedIdButtonsLeft == 1 && canAccessDashboard && canAccessSetup) && (
                            <Setup data={data} onDataChange={onDataChange} user={user} />
                        )}
                        {(adjustedIdButtonsLeft == 1 && canAccessDashboard && !canAccessSetup) && (
                            <Transactions data={data} onDataChange={onDataChange} user={user} />
                        )}
                        {(adjustedIdButtonsLeft == 1 && !canAccessDashboard && canAccessSetup) && (
                            <Transactions data={data} onDataChange={onDataChange} user={user} />
                        )}
                        {(adjustedIdButtonsLeft == 1 && !canAccessDashboard && !canAccessSetup) && (
                            <Settings user={user}/>
                        )}
                        {(adjustedIdButtonsLeft == 2) && (
                            canAccessDashboard ? (
                                <Transactions data={data} onDataChange={onDataChange} user={user} />
                            ) : (
                                <Settings user={user}/>
                            )
                        )}
                        {(adjustedIdButtonsLeft == 3) && (
                            <Settings user={user}/>
                        )}
                    </>
                )}
                </>}
                </div>
            </div>
        </div>
        </TransactionsVersionContext.Provider>
    );
}
