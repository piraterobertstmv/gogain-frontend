import { useState } from "react";
import { ButtonsRadio } from "../components/ButtonsRadio"
import { DatabaseForm } from "../components/popup/DatabaseForm";
import { Table } from "../components/table/Table"
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { MultiFilterInput } from './MultipleFilterInput';
import { BatchTransactionForm } from '../components/BatchTransactionForm';
import { Toast, ToastContainer } from "react-bootstrap";
import './Transactions.css';
import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

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

export function Transactions({ data, reloadData, user } : { data: any, reloadData: () => void, user: any }) {
    // Add debug console logs
    console.log('Transactions component loaded');
    console.log('Data received:', data);
    console.log('User:', user);
    
    // Log transaction data specifically
    if (data && data.transaction) {
        console.log(`Transaction count: ${data.transaction.length}`);
        if (data.transaction.length > 0) {
            console.log('First transaction:', data.transaction[0]);
        } else {
            console.log('No transactions found in data');
        }
    } else {
        console.log('No transaction data available');
    }
    
    // Check backend API connection
    React.useEffect(() => {
        const checkBackend = async () => {
            try {
                // Use environment variable for API URL
                const apiUrl = import.meta.env.VITE_API_URL || 'https://gogain-backend.onrender.com/';
                console.log('Checking backend connection to:', apiUrl);
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                console.log('Backend connection result:', response.status, response.ok);
                
                // If we have the auth token, try to load transactions directly
                const token = localStorage.getItem('authToken');
                if (token) {
                    const transResponse = await fetch(`${apiUrl}transaction`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    if (transResponse.ok) {
                        const transData = await transResponse.json();
                        console.log('Transactions API response:', transData);
                    } else {
                        console.error('Failed to fetch transactions from API:', transResponse.status);
                    }
                }
            } catch (error) {
                console.error('Backend connection check failed:', error);
            }
        };
        
        checkBackend();
    }, []);

    const [show, setShow] = useState(false);
    const handleShow = () => setShow(true);

    const handleClose = () => {
        reloadData();
        setShow(false)
    }

    const [idButtons, setIdButtons] = useState(0);

    const buttonsName: string[] = [
        "transaction"
    ];

    // Filter available options based on user permissions
    const isAdmin = user?.isAdmin === true;
    const userPercentage = parseFloat(user?.percentage) || 0;
    const userCenterIds = user?.centers || [];
    const userServiceIds = user?.services || [];
    
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
    
    // Debug logging for filter permissions
    console.log('Transactions Filter Permissions:', {
        isAdmin,
        userPercentage,
        canFilter: 'Only admins can filter',
        canSeeAllData,
        userCenterIds,
        userServiceIds,
        centerIdsCount: centerIds.length,
        clientIdsCount: clientIds.length,
        workerIdsCount: workerIds.length,
        serviceIdsCount: serviceIds.length
    });
    
    // Debug logging for current filter states
    console.log('Current Filter States:', {
        filtersCenter,
        filtersClient,
        filtersWorker,
        filtersService
    });
    
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

    const toggleLine = (line: string) => {
        console.log('Toggling line:', line);
        setDeleteLines((prev) => {
            const newLines = prev.includes(line)
                ? prev.filter((item) => item !== line)
                : [...prev, line];
            console.log('New deleteLines state:', newLines);
            return newLines;
        });
    };

    const toggleAllLines = () => {
        const allTransactionIds = data.transaction.map((transaction: any) => transaction._id);

        setDeleteLines((prev) => {
            const isAllPresent = allTransactionIds.every((id :any) => prev.includes(id));

            if (isAllPresent) {
                return [];
            } else {
                return [...new Set([...prev, ...allTransactionIds])];
            }
        });
    };

    const apiUrl = import.meta.env.VITE_API_URL || 'https://gogain-backend.onrender.com/';

    async function deleteSelectedTransaction(selectedId: string) {
        try {
            console.log(`Deleting transaction ${selectedId} with URL: ${apiUrl}transaction/${selectedId}`);
            
            const response = await fetch(`${apiUrl}transaction/${selectedId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
            });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Delete failed:', errorData || response.statusText);
                setNotification({
                    show: true,
                    message: `Failed to delete transaction: ${errorData?.message || response.statusText}`,
                    type: 'danger'
                });
                throw new Error(errorData?.message || 'Failed to delete transaction');
            }
            
            console.log(`Successfully deleted transaction ${selectedId}`);
            return true;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            return false;
        }
    }

    async function deleteSelectedTransactions(selectedId: string[]) {
        if (selectedId.length === 0) {
            setNotification({
                show: true,
                message: 'No transactions selected for deletion',
                type: 'danger'
            });
            return;
        }
        
        const isConfirmed = window.confirm(`Are you sure you want to delete ${selectedId.length} transaction(s)?`);

        if (isConfirmed) {
            setIsDeleting(true);
            let successCount = 0;
            
            for (let i = 0; i < selectedId.length; i++) {
                const success = await deleteSelectedTransaction(selectedId[i]);
                if (success) successCount++;
            }
            
            setIsDeleting(false);
            
            if (successCount > 0) {
                // Clear selection after successful deletion
                setDeleteLines([]);
                // Show success notification
                setNotification({
                    show: true,
                    message: `Successfully deleted ${successCount} transaction(s)`,
                    type: 'success'
                });
                // Reload data only once after all deletions
                reloadData();
            }
            
            if (successCount < selectedId.length) {
                setNotification({
                    show: true,
                    message: `Deleted ${successCount} of ${selectedId.length} selected transactions. Some transactions could not be deleted.`,
                    type: 'danger'
                });
            }
        }
    }

    const [showBatchModal, setShowBatchModal] = useState(false);
    const [pdfImportStatus, setPdfImportStatus] = useState<string | null>(null);
    const [isPollingForImports, setIsPollingForImports] = useState(false);


    const handleCloseBatchForm = () => {
        setShowBatchModal(false);
        reloadData();
    };

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

            // Store current transaction count for comparison
            const currentTransactionCount = data?.transaction?.length || 0;

            // Construct the PDF extractor URL with the JWT token and backend parameter
            const backendUrl = 'https://gogain-backend.onrender.com';
            const pdfExtractorUrl = `https://pdf-expense-tracker.vercel.app?token=${encodeURIComponent(authToken)}&backend=${encodeURIComponent(backendUrl)}`;
            
            console.log('Opening PDF extractor with token and backend:', {
                hasToken: !!authToken,
                tokenLength: authToken.length,
                backendUrl: backendUrl,
                url: pdfExtractorUrl,
                currentTransactionCount
            });

            // Open in new tab
            const newWindow = window.open(pdfExtractorUrl, '_blank');
            
            if (!newWindow) {
                alert('Please allow pop-ups for this site to use the PDF import feature.');
                return;
            }

            // Start polling for new transactions
            setPdfImportStatus('PDF extractor opened. Waiting for import...');
            setIsPollingForImports(true);
            
            // Poll for changes every 3 seconds for up to 5 minutes
            let pollCount = 0;
            const maxPolls = 100; // 5 minutes
            
            const pollForNewTransactions = setInterval(() => {
                pollCount++;
                
                if (pollCount >= maxPolls) {
                    clearInterval(pollForNewTransactions);
                    setIsPollingForImports(false);
                    setPdfImportStatus(null);
                    console.log('Stopped polling for PDF imports (timeout)');
                    return;
                }

                // Reload data and check for new transactions
                reloadData();
                
                // Check if new transactions were added
                const newTransactionCount = data?.transaction?.length || 0;
                if (newTransactionCount > currentTransactionCount) {
                    const importedCount = newTransactionCount - currentTransactionCount;
                    clearInterval(pollForNewTransactions);
                    setIsPollingForImports(false);
                    setPdfImportStatus(`Successfully imported ${importedCount} transaction(s) from PDF!`);
                    
                    // Clear success message after 5 seconds
                    setTimeout(() => {
                        setPdfImportStatus(null);
                    }, 5000);
                    
                    console.log(`Detected ${importedCount} new transactions from PDF import`);
                }
            }, 3000);

            console.log('PDF extractor opened in new tab, polling started');
            
        } catch (error) {
            console.error('Error opening PDF extractor:', error);
            alert('Failed to open PDF extractor. Please try again.');
            setIsPollingForImports(false);
            setPdfImportStatus(null);
        }
    };

    // Add an effect to log the first transaction when data loads
    React.useEffect(() => {
        if (data && data.transaction && data.transaction.length > 0) {
            console.log('TRANSACTION OBJECT:', JSON.stringify(data.transaction[0], null, 2));
            console.log('TRANSACTION KEYS:', Object.keys(data.transaction[0]));
        }
    }, [data]);

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
            </Button>
            <button 
                className={deleteLines.length === 0 ? "logout-button-grey" : "logout-button"} 
                onClick={() => deleteSelectedTransactions(deleteLines)}
                disabled={isDeleting || deleteLines.length === 0}
            >
                {isDeleting ? 'Deleting...' : `Delete${deleteLines.length > 0 ? ` (${deleteLines.length})` : ''}`}
            </button>
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

        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add {buttonsName[idButtons]}</Modal.Title>
            </Modal.Header>
            <DatabaseForm columnName={buttonsName[idButtons]} data={data} defaultValue={null} closePopupFunc={handleClose} user={user} />
        </Modal>
        <Modal show={showBatchModal} onHide={handleCloseBatchForm} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Add Multiple Transactions</Modal.Title>
            </Modal.Header>
            <BatchTransactionForm 
                data={data} 
                closePopupFunc={handleCloseBatchForm} 
                user={user}
            />
        </Modal>
        
        <Table column={buttonsName[idButtons]} data={data} resetDataFunc={handleClose} user={user} filters={{center: filtersCenter, client: filtersClient, worker: filtersWorker, service: filtersService}} columnFilters={[]} deleteFunction={toggleLine} toggleAllLines={toggleAllLines} deleteLines={deleteLines}/>

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