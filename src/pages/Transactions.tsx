import { useState } from "react";
import { ButtonsRadio } from "../components/ButtonsRadio"
import { DatabaseForm } from "../components/popup/DatabaseForm";
import { Table } from "../components/table/Table"
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { MultiFilterInput } from './MultipleFilterInput';
import { BatchTransactionForm } from '../components/BatchTransactionForm';
import { Toast, ToastContainer, Form } from "react-bootstrap";
import './Transactions.css';
import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import type { OnDataChange } from './Application';
import { apiFetch, CollectionName, DataChange, fetchPage } from '../services/api';
import { usePagedList } from '../services/serverData';

// function toCamelCaseArray(names: string[]): string[] {
//     return names.map(name =>
//         name
//             .toLowerCase()
//             .split(' ')
//             .map((word, index) => 
//                 index === 0 
//                     ? word
//                     : word.charAt(0).toUpperCase() + word.slice(1)
//             )
//             .join('')
//     );
// }

const NO_COLUMN_FILTERS: string[] = [];
const PAGE_SIZE = 100;

export function Transactions({ data, onDataChange, user } : { data: any, onDataChange: OnDataChange, user: any }) {
    // (Removed: a mount-time "connection check" that downloaded every transaction a
    // second time only to log it, plus several console.logs that ran on every render.)

    const [show, setShow] = useState(false);
    const handleShow = () => setShow(true);

    const [idButtons, setIdButtons] = useState(0);
    const [subNavigation, setSubNavigation] = useState(0); // 0 = transactions, 1 = costs
    const currentCollection: CollectionName = subNavigation === 0 ? "transaction" : "costTransactions";

    // Called when a form closes; `change` is only set after a successful save/delete,
    // and only that record is updated in memory (no reload).
    const handleClose = React.useCallback((change?: DataChange) => {
        setShow(false)
        if (change) onDataChange(currentCollection, change);
    }, [onDataChange, currentCollection])

    const buttonsName: string[] = [
        "transaction"
    ];

    const subNavigationNames: string[] = [
        "Transactions",
        "Costs"
    ];

    // Filter available options based on user permissions
    const isAdmin = user?.isAdmin === true;
    
    // Filter sub-navigation based on user permissions - only admins can see Costs
    const filteredSubNavigationNames = isAdmin ? subNavigationNames : ["Transactions"];
    const userCenterIds: string[] = user?.centers || NO_COLUMN_FILTERS; // stable fallback (a new [] each render would loop the filter effect)
    
    // Determine user's permission level
    const canFilter = isAdmin; // Only admins can filter
    const canSeeAllData = isAdmin;
    
    // Center IDs: Admins see all, regular users see only assigned centers
    const centerIds = Array.isArray(data.center) ? 
        (canSeeAllData ? data.center.map((item: any) => item._id) : 
         data.center.filter((item: any) => userCenterIds.includes(item._id)).map((item: any) => item._id)) : [];
    
    // Client IDs: Only admins can filter by client
    const clientIds = Array.isArray(data.client) ? 
        (canSeeAllData ? data.client.map((item: any) => item._id) : []) : [];
    
    // Worker IDs: Only admins can filter by worker
    const workerIds = Array.isArray(data.users) ? 
        (canSeeAllData ? data.users.map((item: any) => item._id) : []) : [];
    
    // Service IDs: Only admins can filter by service
    const serviceIds = Array.isArray(data.service) ? 
        (canSeeAllData ? data.service.map((item: any) => item._id) : []) : [];
    
    const [filtersCenter, setFiltersCenter] = useState<string[]>([]);
    const [filtersClient, setFiltersClient] = useState<string[]>([]);
    const [filtersWorker, setFiltersWorker] = useState<string[]>([]);
    const [filtersService, setFiltersService] = useState<string[]>([]);
    
    // Stable object so the table doesn't recompute its rows on unrelated re-renders
    const tableFilters = React.useMemo(
        () => ({ center: filtersCenter, client: filtersClient, worker: filtersWorker, service: filtersService }),
        [filtersCenter, filtersClient, filtersWorker, filtersService]
    );

    // Server-side paging: only the current page is downloaded, filtered on the server.
    // It re-fetches automatically after any save/delete (see services/serverData.ts).
    const [page, setPage] = useState(0);
    React.useEffect(() => { setPage(0); }, [subNavigation, filtersCenter, filtersClient, filtersWorker, filtersService]);
    const list = usePagedList(currentCollection, {
        page,
        limit: PAGE_SIZE,
        center: filtersCenter,
        client: filtersClient,
        worker: filtersWorker,
        service: filtersService,
    });
    const tableData = React.useMemo(() => ({ ...data, [currentCollection]: list.items }), [data, currentCollection, list.items]);
    const serverPaging = React.useMemo(
        () => ({ page, pageSize: PAGE_SIZE, total: list.total, loading: list.loading, onPageChange: setPage }),
        [page, list.total, list.loading]
    );

    // Initialize filters based on user permissions
    React.useEffect(() => {
        if (!canFilter) {
            // For regular users (any percentage), automatically set center filter to their assigned centers
            setFiltersCenter(userCenterIds);
            setFiltersClient([]);
            setFiltersWorker([]);
            setFiltersService([]);
        }
    }, [canFilter, userCenterIds]);

    const [deleteLines, setDeleteLines] = useState<string[]>([])
    const [isDeleting, setIsDeleting] = useState(false);
    const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success'|'danger'}>({
        show: false,
        message: '',
        type: 'success'
    });

    // Stable callback so memoized rows don't all re-render when one checkbox changes
    const toggleLine = React.useCallback((line: string) => {
        setDeleteLines((prev) => prev.includes(line)
            ? prev.filter((item) => item !== line)
            : [...prev, line]
        );
    }, []);

    const toggleAllLines = () => {
        // Selects every row on the current page
        const allIds = list.items.map((item: any) => item._id);

        setDeleteLines((prev) => {
            const isAllPresent = allIds.every((id :any) => prev.includes(id));

            if (isAllPresent) {
                return [];
            } else {
                return [...new Set([...prev, ...allIds])];
            }
        });
    };

    // Selected rows belong to the current tab; don't carry them over to the other one
    React.useEffect(() => { setDeleteLines([]); }, [subNavigation]);

    async function deleteSelectedTransaction(selectedId: string) {
        const endpoint = subNavigation === 0 ? 'transaction' : 'cost-transactions';
        const itemType = subNavigation === 0 ? 'transaction' : 'cost transaction';
        try {
            const response = await apiFetch(`${endpoint}/${selectedId}`, { method: 'DELETE' });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Delete failed:', errorData || response.statusText);
                setNotification({
                    show: true,
                    message: `Failed to delete ${itemType}: ${errorData?.message || errorData?.error || response.statusText}`,
                    type: 'danger'
                });
                return false;
            }
            return true;
        } catch (error) {
            console.error(`Error deleting ${itemType}:`, error);
            return false;
        }
    }

    async function deleteSelectedTransactions(selectedId: string[]) {
        const itemType = subNavigation === 0 ? 'transaction' : 'cost';
        const itemTypePlural = subNavigation === 0 ? 'transactions' : 'costs';
        
        if (selectedId.length === 0) {
            setNotification({
                show: true,
                message: `No ${itemTypePlural} selected for deletion`,
                type: 'danger'
            });
            return;
        }
        
        const isConfirmed = window.confirm(`Are you sure you want to delete ${selectedId.length} ${itemType}(s)?`);

        if (isConfirmed) {
            setIsDeleting(true);
            const deletedIds: string[] = [];
            
            for (const id of selectedId) {
                if (await deleteSelectedTransaction(id)) deletedIds.push(id);
            }
            
            setIsDeleting(false);
            
            if (deletedIds.length > 0) {
                setDeleteLines([]);
                setNotification({
                    show: true,
                    message: `Successfully deleted ${deletedIds.length} ${itemType}(s)`,
                    type: 'success'
                });
                // Remove the deleted rows locally instead of reloading everything
                onDataChange(currentCollection, { deletedIds });
            }
            
            if (deletedIds.length < selectedId.length) {
                setNotification({
                    show: true,
                    message: `Deleted ${deletedIds.length} of ${selectedId.length} selected ${itemTypePlural}. Some ${itemTypePlural} could not be deleted.`,
                    type: 'danger'
                });
            }
        }
    }

    const [showBatchModal, setShowBatchModal] = useState(false);
    const [pdfImportStatus, setPdfImportStatus] = useState<string | null>(null);
    const [isPollingForImports, setIsPollingForImports] = useState(false);
    
    // Center selection for PDF import
    const [selectedCenterId, setSelectedCenterId] = useState<string>('');
    
    // Helper function to get available centers for the current user
    const getUserAvailableCenters = () => {
        if (!data?.center || !Array.isArray(data.center)) return [];
        
        if (user?.isAdmin) {
            return data.center;
        } else {
            // Filter centers based on user's assigned centers
            return data.center.filter((center: any) => 
                user?.centers?.includes(center._id)
            );
        }
    };
    
    // Auto-select center if user has only one center available
    React.useEffect(() => {
        const availableCenters = getUserAvailableCenters();
        if (availableCenters.length === 1 && !selectedCenterId) {
            setSelectedCenterId(availableCenters[0]._id);
        }
    }, [data?.center, user?.centers, selectedCenterId]);
    
    // Prevent regular users from accessing costs tab
    React.useEffect(() => {
        if (!isAdmin && subNavigation === 1) {
            setSubNavigation(0); // Force back to transactions tab
        }
    }, [isAdmin, subNavigation]);


    // `change` is only set when the batch was saved
    const handleCloseBatchForm = (change?: DataChange) => {
        setShowBatchModal(false);
        if (change) onDataChange("transaction", change);
    };

    // PDF import polling: the interval lives in a ref so it can be cleared on unmount.
    // It asks the server how many cost transactions exist (a 1-row page) instead of
    // downloading them.
    const pollRef = React.useRef<number | null>(null);
    React.useEffect(() => () => { if (pollRef.current) window.clearInterval(pollRef.current); }, []);
    const countCosts = async () => (await fetchPage('costTransactions', { page: 0, limit: 1 })).total;

    // Handle PDF import by opening external PDF extractor with JWT token
    const handlePdfImport = () => {
        try {
            // Get the JWT token from localStorage
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No auth token found');
                alert('Authentication required. Please log in again.');
                return;
            }

            // Get available centers and validate selection
            const availableCenters = getUserAvailableCenters();
            let centerToUse = selectedCenterId;
            
            // Auto-select if only one center available
            if (!centerToUse && availableCenters.length === 1) {
                centerToUse = availableCenters[0]._id;
                setSelectedCenterId(centerToUse);
            }
            
            // Require center selection for multi-center users
            if (!centerToUse && availableCenters.length > 1) {
                alert('Please select a center before importing PDF transactions.');
                return;
            }
            
            // If no centers available, show error
            if (!centerToUse) {
                alert('No centers available for PDF import. Please contact your administrator.');
                return;
            }

            // PDF imports are saved as cost transactions, so watch that collection
            const countBeforePromise = countCosts().catch(() => null);

            // Construct the PDF extractor URL with center selection
            const backendUrl = 'https://gogain-backend.onrender.com';
            const pdfExtractorUrl = `https://pdf-expense-tracker.vercel.app/expense-tracker.html?token=${encodeURIComponent(authToken)}&backend=${encodeURIComponent(backendUrl)}&center=${encodeURIComponent(centerToUse)}`;
            
            // Open in new tab
            const newWindow = window.open(pdfExtractorUrl, '_blank');
            
            if (!newWindow) {
                alert('Please allow pop-ups for this site to use the PDF import feature.');
                return;
            }

            // Start polling for new transactions
            setPdfImportStatus('PDF extractor opened. Waiting for import...');
            setIsPollingForImports(true);
            
            // Poll every 5 seconds for up to 5 minutes, re-downloading only the cost
            // transactions (previously: all 7 collections every 3 seconds).
            if (pollRef.current) window.clearInterval(pollRef.current);
            let pollCount = 0;
            const maxPolls = 60;

            pollRef.current = window.setInterval(async () => {
                pollCount++;

                const countBefore = await countBeforePromise;
                const countNow = await countCosts().catch(() => null);
                if (countBefore !== null && countNow !== null && countNow > countBefore) {
                    onDataChange("costTransactions");
                    if (pollRef.current) window.clearInterval(pollRef.current);
                    pollRef.current = null;
                    setIsPollingForImports(false);
                    setPdfImportStatus(`Successfully imported ${countNow - countBefore} cost(s) from PDF!`);
                    setTimeout(() => setPdfImportStatus(null), 5000);
                    return;
                }

                if (pollCount >= maxPolls) {
                    if (pollRef.current) window.clearInterval(pollRef.current);
                    pollRef.current = null;
                    setIsPollingForImports(false);
                    setPdfImportStatus(null);
                    return;
                }

            }, 5000);

        } catch (error) {
            console.error('Error opening PDF extractor:', error);
            alert('Failed to open PDF extractor. Please try again.');
            setIsPollingForImports(false);
            setPdfImportStatus(null);
        }
    };

    // Floating scroll buttons state
    const [showScrollUp, setShowScrollUp] = useState(false);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const scrollDivRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleScroll = () => {
            const div = scrollDivRef.current;
            if (!div) return;
            const scrollTop = div.scrollTop;
            const clientHeight = div.clientHeight;
            const scrollHeight = div.scrollHeight;
            setShowScrollUp(scrollTop > 100);
            setShowScrollDown(scrollTop + clientHeight < scrollHeight - 100);
        };
        const div = scrollDivRef.current;
        if (div) {
            div.addEventListener('scroll', handleScroll);
            handleScroll();
        }
        return () => {
            if (div) div.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleScrollToTop = () => {
        if (scrollDivRef.current) {
            scrollDivRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const handleScrollToBottom = () => {
        if (scrollDivRef.current) {
            scrollDivRef.current.scrollTo({ top: scrollDivRef.current.scrollHeight, behavior: 'smooth' });
        }
    };
    const handleKeyDownUp = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') handleScrollToTop();
    };
    const handleKeyDownDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') handleScrollToBottom();
    };

    return <>
    <div ref={scrollDivRef} className='p-5' style={{height: "100vh", overflow:"auto"}}>
        <div style={{ display: "flex", alignItems: "center" }}>
            <ButtonsRadio buttonsName={buttonsName} onChangeFunction={setIdButtons} selectedButton={idButtons}/>
            <Button className='m-2'style={{ borderRadius: "25px", backgroundColor: "#F2F2F2", color:"#706762", borderColor: 'transparent', height: "33px", width: "33px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={handleShow}>
                +
            </Button>
            <Button 
                onClick={() => setShowBatchModal(true)}
                style={{ marginLeft: '10px', backgroundColor: "#FFEEE7", border: "solid 0.5px #D95213", color: "#D95213" }}
            >
                Add Multiple Transactions
            </Button>
            
            {/* PDF Import - Only show for admin users */}
            {isAdmin && (
                <>
                    {/* Center Selection for PDF Import - Only show for multi-center users */}
                    {getUserAvailableCenters().length > 1 && (
                        <div style={{ display: 'inline-block', marginLeft: '10px' }}>
                            <Form.Select 
                                value={selectedCenterId}
                                onChange={(e) => setSelectedCenterId(e.target.value)}
                                style={{ 
                                    width: '200px', 
                                    height: '38px',
                                    border: "solid 1px #4CAF50",
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">Select Center for PDF Import</option>
                                {getUserAvailableCenters().map((center: any) => (
                                    <option key={center._id} value={center._id}>
                                        {center.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>
                    )}
                    
                    <Button 
                        onClick={handlePdfImport}
                        style={{ 
                            marginLeft: '10px', 
                            backgroundColor: "#E8F5E8", 
                            border: "solid 0.5px #4CAF50", 
                            color: "#2E7D32" 
                        }}
                    >
                        <i className="fas fa-file-pdf me-2"></i>
                        Import from PDF
                        {getUserAvailableCenters().length === 1 && (
                            <span style={{ fontSize: '12px', marginLeft: '5px' }}>
                                ({getUserAvailableCenters()[0]?.name})
                            </span>
                        )}
                    </Button>
                </>
            )}
            <button 
                className={deleteLines.length === 0 ? "logout-button-grey" : "logout-button"} 
                onClick={() => deleteSelectedTransactions(deleteLines)}
                disabled={isDeleting || deleteLines.length === 0}
            >
                {isDeleting ? 'Deleting...' : `Delete${deleteLines.length > 0 ? ` (${deleteLines.length})` : ''}`}
            </button>
        </div>

        {/* Sub-navigation for Transactions vs Costs */}
        <div style={{ display: "flex", alignItems: "center", marginTop: "10px", marginBottom: "10px" }}>
            {filteredSubNavigationNames.map((name, index) => (
                <button
                    key={index}
                    onClick={() => setSubNavigation(index)}
                    style={{
                        padding: "8px 16px",
                        marginRight: "10px",
                        backgroundColor: subNavigation === index ? "#007bff" : "#f8f9fa",
                        color: subNavigation === index ? "white" : "#495057",
                        border: "1px solid #dee2e6",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px"
                    }}
                >
                    {name}
                </button>
            ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", marginTop: "1vh" }}>
            {/* Center filter: Only for admins */}
            {canFilter && (
                <MultiFilterInput name='Center' data={data} availableFilters={centerIds} modifyFilter={setFiltersCenter}/>
            )}
            
            {/* Client filter: Only for admins */}
            {canFilter && (
                <MultiFilterInput name='Client' data={data} availableFilters={clientIds} modifyFilter={setFiltersClient}/>
            )}
            
            {/* Worker filter: Only for admins */}
            {canFilter && (
                <MultiFilterInput name='Worker' data={data} availableFilters={workerIds} modifyFilter={setFiltersWorker}/>
            )}
            
            {/* Service filter: Only for admins */}
            {canFilter && (
                <MultiFilterInput name='Service' data={data} availableFilters={serviceIds} modifyFilter={setFiltersService}/>
            )}
            
            {/* Clear All Filters Button: Only for admins */}
            {canFilter && (filtersCenter.length > 0 || filtersClient.length > 0 || filtersWorker.length > 0 || filtersService.length > 0) && (
                <Button 
                    onClick={() => {
                        setFiltersCenter([]);
                        setFiltersClient([]);
                        setFiltersWorker([]);
                        setFiltersService([]);
                    }}
                    style={{ 
                        marginLeft: '10px', 
                        backgroundColor: "#6c757d", 
                        border: "solid 0.5px #6c757d", 
                        color: "#ffffff",
                        fontSize: '12px',
                        padding: '4px 8px'
                    }}
                >
                    Clear All Filters
                </Button>
            )}
            
            {/* Spacer to push scroll button to the right with proper separation */}
            <div style={{ flex: 1 }}></div>
            
            {showScrollDown && (
                <button
                    className="bg-white rounded-full shadow p-2 flex items-center justify-center hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Scroll to bottom"
                    tabIndex={0}
                    onClick={handleScrollToBottom}
                    onKeyDown={handleKeyDownDown}
                    style={{ height: '33px', width: '33px', marginLeft: '20px' }}
                >
                    <FaArrowDown className="w-5 h-5 text-gray-700" />
                </button>
            )}
        </div>

        <ToastContainer position="top-end" className="p-3 mt-5" style={{ zIndex: 1050 }}>
            <Toast 
                show={notification.show} 
                onClose={() => setNotification({...notification, show: false})} 
                delay={5000} 
                autohide 
                bg={notification.type}
            >
                <Toast.Header>
                    <strong className="me-auto">{notification.type === 'success' ? 'Success' : 'Error'}</strong>
                </Toast.Header>
                <Toast.Body className={notification.type === 'success' ? '' : 'text-white'}>
                    {notification.message}
                </Toast.Body>
            </Toast>
            
            {/* PDF Import Status Toast */}
            <Toast 
                show={!!pdfImportStatus} 
                onClose={() => setPdfImportStatus(null)} 
                delay={isPollingForImports ? 0 : 5000} 
                autohide={!isPollingForImports}
                bg={pdfImportStatus?.includes('Successfully') ? 'success' : 'info'}
            >
                <Toast.Header>
                    <strong className="me-auto">
                        {isPollingForImports ? (
                            <>
                                <i className="fas fa-spinner fa-spin me-2"></i>
                                PDF Import
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check-circle me-2"></i>
                                PDF Import Success
                            </>
                        )}
                    </strong>
                </Toast.Header>
                <Toast.Body className={pdfImportStatus?.includes('Successfully') ? '' : 'text-white'}>
                    {pdfImportStatus}
                </Toast.Body>
            </Toast>
        </ToastContainer>

        <Modal show={show} onHide={() => handleClose()}>
            <Modal.Header closeButton>
                <Modal.Title>Add {subNavigation === 0 ? "Transaction" : "Cost"}</Modal.Title>
            </Modal.Header>
            <DatabaseForm columnName={subNavigation === 0 ? "transaction" : "costTransactions"} data={data} defaultValue={null} closePopupFunc={handleClose} user={user} />
        </Modal>
        <Modal show={showBatchModal} onHide={() => handleCloseBatchForm()} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Add Multiple Transactions</Modal.Title>
            </Modal.Header>
            <BatchTransactionForm 
                data={data} 
                closePopupFunc={handleCloseBatchForm} 
                user={user}
            />
        </Modal>
        
        {list.error && (
            <div className="alert alert-danger">Could not load {subNavigation === 0 ? "transactions" : "costs"}: {list.error}</div>
        )}
        <Table
            key={subNavigation === 0 ? "transactions" : "costs"}
            column={subNavigation === 0 ? "transaction" : "costTransactions"} 
            data={tableData} 
            serverPaging={serverPaging}
            resetDataFunc={handleClose} 
            user={user} 
            filters={tableFilters} 
            columnFilters={NO_COLUMN_FILTERS} 
            deleteFunction={toggleLine} 
            toggleAllLines={toggleAllLines} 
            deleteLines={deleteLines}
        />

        {/* Floating Scroll Buttons */}
        {showScrollUp && (
            <button
                className="fixed bottom-20 right-6 z-50 bg-white rounded-full shadow-lg p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Scroll to top"
                tabIndex={0}
                onClick={handleScrollToTop}
                onKeyDown={handleKeyDownUp}
            >
                <FaArrowUp className="w-5 h-5 text-gray-700" />
            </button>
        )}
    </div>
    </>
}