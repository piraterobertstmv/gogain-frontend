import { useState } from "react";
import { ButtonsRadio } from "../components/ButtonsRadio"
import { DatabaseForm } from "../components/popup/DatabaseForm";
import { Table } from "../components/table/Table"
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { MultiFilterInput } from './MultipleFilterInput';
import { BatchTransactionForm } from '../components/BatchTransactionForm';
import { PdfTransactionImporter } from '../components/PdfTransactionImporter';
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
                    const transResponse = await fetch(`${apiUrl}transactions`, {
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

    const centerIds = Array.isArray(data.center) ? data.center.map((item: any) => item._id) : [];
    const clientIds = Array.isArray(data.client) ? data.client.map((item: any) => item._id) : [];
    const workerIds = Array.isArray(data.users) ? data.users.map((item: any) => item._id) : [];
    const serviceIds = Array.isArray(data.service) ? data.service.map((item: any) => item._id) : [];

    const [filtersCenter, setFiltersCenter] = useState<string[]>([]);
    const [filtersClient, setFiltersClient] = useState<string[]>([]);
    const [filtersWorker, setFiltersWorker] = useState<string[]>([]);
    const [filtersService, setFiltersService] = useState<string[]>([]);

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
    const [showPdfImporter, setShowPdfImporter] = useState(false);


    const handleCloseBatchForm = () => {
        setShowBatchModal(false);
        reloadData();
    };

    const handleClosePdfImporter = () => {
        setShowPdfImporter(false);
        reloadData();
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
                onClick={() => setShowPdfImporter(true)}
                style={{ 
                    marginLeft: '10px', 
                    backgroundColor: "#F2F2F2", 
                    border: "solid 0.5px #736A65", 
                    color: "#706762" 
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
            <MultiFilterInput name='Center' data={data}  availableFilters={centerIds}  modifyFilter={setFiltersCenter}/>
            <MultiFilterInput name='Client' data={data}  availableFilters={clientIds}  modifyFilter={setFiltersClient}/>
            <MultiFilterInput name='Worker' data={data}  availableFilters={workerIds}  modifyFilter={setFiltersWorker}/>
            <MultiFilterInput name='Service' data={data} availableFilters={serviceIds} modifyFilter={setFiltersService}/>
            {showScrollDown && (
                <button
                    className="ml-auto bg-white rounded-full shadow p-2 flex items-center justify-center hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Scroll to bottom"
                    tabIndex={0}
                    onClick={handleScrollToBottom}
                    onKeyDown={handleKeyDownDown}
                    style={{ height: '33px', width: '33px' }}
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
        
        {/* PDF Transaction Importer with all required props explicitly defined */}
        <PdfTransactionImporter 
            show={showPdfImporter}
            onHide={handleClosePdfImporter}
            onSuccess={reloadData}
            data={data}
            user={user}
        />
        
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