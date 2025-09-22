import { useEffect, useState } from 'react'
import { LeftButtonsRadio } from "../components/LeftButtonsRadio"
import { Header } from "../components/Header"

import { Dashboard } from "./Dashboard";
import { Setup } from "./Setup";
import { Transactions } from "./Transactions";
import { Reports } from "./Reports";
import { Settings } from "./Settings";

import "./Application.css"

export function Application({user, setUser} : {user: any, setUser: any}) {
    const [reload, setReload] = useState(false)
    const handleReload = () => setReload(prev => !prev)

    const [data, setData] = useState<any>({})

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Use environment variable for API URL instead of hardcoded localhost
                const apiUrl = import.meta.env.VITE_API_URL || 'https://gogain-backend.onrender.com/';
                console.log('Application: Using API URL:', apiUrl);
                
                // Get the authentication token
                const token = localStorage.getItem('authToken');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                
                // Log headers for debugging
                console.log('Using headers:', headers);
                
                const [transactions, clients, users, centers, services, costCategories, costTransactions] = await Promise.all([
                    fetch(`${apiUrl}transaction`, { headers }),
                    fetch(`${apiUrl}client`, { headers }),
                    fetch(`${apiUrl}users`, { headers }),
                    fetch(`${apiUrl}center`, { headers }),
                    fetch(`${apiUrl}service`, { headers }),
                    fetch(`${apiUrl}costs`, { headers }),
                    fetch(`${apiUrl}cost-transactions`, { headers })
                ]);

                // Log responses for debugging
                console.log('Transaction response:', transactions.status, transactions.ok);
                console.log('Client response:', clients.status, clients.ok);
                console.log('Users response:', users.status, users.ok);
                
                const results = await Promise.all([
                    transactions.json(),
                    clients.json(),
                    users.json(),
                    centers.json(),
                    services.json(),
                    costCategories.json(),
                    costTransactions.json()
                ]);
                
                // Log the results
                console.log('Fetched data:', {
                    transactions: results[0].transactions?.length || 0,
                    clients: results[1].client?.length || 0,
                    users: results[2].users?.length || 0,
                    centers: results[3].center?.length || 0,
                    services: results[4].service?.length || 0,
                    costCategories: results[5].costs?.length || 0,
                    costTransactions: results[6].costs?.length || 0
                });
                
                // Sort clients by first name
                const sortedClients = results[1].client ? [...results[1].client].sort((a, b) => {
                    // Sort by firstName (case-insensitive)
                    return a.firstName.toLowerCase().localeCompare(b.firstName.toLowerCase());
                }) : [];
                
                // Sort transactions by date (oldest to newest)
                const sortedTransactions = results[0].transactions ? [...results[0].transactions].sort((a, b) => {
                    // Parse dates - handle both string dates and Date objects
                    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                    // Sort ascending (oldest first)
                    return dateA.getTime() - dateB.getTime();
                }) : [];
                
                // Filter data based on user permissions
                const isUserAdmin = user?.isAdmin === true;
                const userCenterIds = user?.centers || [];
                
                // Filter transactions for regular users (only show transactions from assigned centers)
                const filteredTransactions = isUserAdmin ? sortedTransactions : 
                    sortedTransactions.filter(transaction => 
                        userCenterIds.includes(transaction.center)
                    );
                
                console.log('User permissions:', { 
                    isAdmin: isUserAdmin, 
                    assignedCenters: userCenterIds,
                    totalTransactions: sortedTransactions.length,
                    filteredTransactions: filteredTransactions.length 
                });

                setData({
                    transaction: filteredTransactions,
                    client: sortedClients,
                    users: results[2].users || [],
                    center: results[3].center || [],
                    service: results[4].service || [],
                    costs: results[5].costs || [], // Cost categories (keep original)
                    costTransactions: results[6].costs || [] // Cost transactions for the costs table
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [reload]);

    const [idButtonsLeft, setIdButtonsLeft] = useState(2)

    // Define navigation based on user permissions
    const isAdmin = user?.isAdmin === true;
    const userPercentage = parseFloat(user?.percentage) || 0;
    const userHasCenters = user?.centers && user.centers.length > 0;
    const canAccessDashboard = isAdmin || (userHasCenters && userPercentage >= 50);
    const canAccessSetup = isAdmin || (userHasCenters && userPercentage >= 50);
    
    const allNavigation = ["Dashboard", "Set up", "Transactions", "Reports", "Settings"];
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
        // Map from admin indices: Dashboard=0->0, Setup=1->1, Transactions=2->2, Settings=4->3
        if (idButtonsLeft === 0) adjustedIdButtonsLeft = 0; // Dashboard
        else if (idButtonsLeft === 1) adjustedIdButtonsLeft = 1; // Setup
        else if (idButtonsLeft === 2) adjustedIdButtonsLeft = 2; // Transactions
        else if (idButtonsLeft === 4) adjustedIdButtonsLeft = 3; // Settings
        else adjustedIdButtonsLeft = 2; // Default to Transactions
    } else if (canAccessSetup && !canAccessDashboard) {
        // Regular user with setup but no dashboard: [Setup=0, Transactions=1, Settings=2]
        // Map from admin indices: Setup=1->0, Transactions=2->1, Settings=4->2
        if (idButtonsLeft === 1) adjustedIdButtonsLeft = 0; // Setup
        else if (idButtonsLeft === 2) adjustedIdButtonsLeft = 1; // Transactions
        else if (idButtonsLeft === 4) adjustedIdButtonsLeft = 2; // Settings
        else adjustedIdButtonsLeft = 1; // Default to Transactions
    } else if (canAccessDashboard && !canAccessSetup) {
        // Regular user with dashboard but no setup: [Dashboard=0, Transactions=1, Settings=2]
        // Map from admin indices: Dashboard=0->0, Transactions=2->1, Settings=4->2
        if (idButtonsLeft === 0) adjustedIdButtonsLeft = 0; // Dashboard
        else if (idButtonsLeft === 2) adjustedIdButtonsLeft = 1; // Transactions
        else if (idButtonsLeft === 4) adjustedIdButtonsLeft = 2; // Settings
        else adjustedIdButtonsLeft = 1; // Default to Transactions
    } else {
        // Regular user without dashboard or setup: [Transactions=0, Settings=1]
        // Map from admin indices: Transactions=2->0, Settings=4->1
        if (idButtonsLeft === 2) adjustedIdButtonsLeft = 0; // Transactions
        else if (idButtonsLeft === 4) adjustedIdButtonsLeft = 1; // Settings
        else adjustedIdButtonsLeft = 0; // Default to Transactions
    }

    // Custom click handler for regular users to map filtered indices to admin indices
    const handleNavigationClick = (filteredIndex: number) => {
        if (isAdmin) {
            setIdButtonsLeft(filteredIndex);
        } else if (canAccessDashboard && canAccessSetup) {
            // Regular user with dashboard and setup: [Dashboard=0, Setup=1, Transactions=2, Settings=3]
            // Map to admin indices: Dashboard=0->0, Setup=1->1, Transactions=2->2, Settings=3->4
            if (filteredIndex === 0) setIdButtonsLeft(0); // Dashboard
            else if (filteredIndex === 1) setIdButtonsLeft(1); // Setup
            else if (filteredIndex === 2) setIdButtonsLeft(2); // Transactions
            else if (filteredIndex === 3) setIdButtonsLeft(4); // Settings
        } else if (canAccessSetup && !canAccessDashboard) {
            // Regular user with setup but no dashboard: [Setup=0, Transactions=1, Settings=2]
            // Map to admin indices: Setup=0->1, Transactions=1->2, Settings=2->4
            if (filteredIndex === 0) setIdButtonsLeft(1); // Setup
            else if (filteredIndex === 1) setIdButtonsLeft(2); // Transactions
            else if (filteredIndex === 2) setIdButtonsLeft(4); // Settings
        } else if (canAccessDashboard && !canAccessSetup) {
            // Regular user with dashboard but no setup: [Dashboard=0, Transactions=1, Settings=2]
            // Map to admin indices: Dashboard=0->0, Transactions=1->2, Settings=2->4
            if (filteredIndex === 0) setIdButtonsLeft(0); // Dashboard
            else if (filteredIndex === 1) setIdButtonsLeft(2); // Transactions
            else if (filteredIndex === 2) setIdButtonsLeft(4); // Settings
        } else {
            // Regular user without dashboard or setup: [Transactions=0, Settings=1]
            // Map to admin indices: Transactions=0->2, Settings=1->4
            if (filteredIndex === 0) setIdButtonsLeft(2); // Transactions
            else if (filteredIndex === 1) setIdButtonsLeft(4); // Settings
        }
    };



    return <>
        <div className="bottom-bar-container">
            <Header user={user} />
        </div>
        <div className='d-flex flex-row' style={{ backgroundColor: "#FBFBFB", fontFamily: 'Inter, sans-serif' }}>
            <div style={{ width: "max-content" }}>
                <LeftButtonsRadio buttonsName={navigationItems} idButtonsName={adjustedIdButtonsLeft} setIdButtonsLeft={handleNavigationClick} setUser={setUser}/>
            </div>
            <div>
                {/* Admin users: full navigation */}
                {isAdmin && (
                    <>
                        {(idButtonsLeft == 0) && (
                            <Dashboard data={data} user={user} />
                        )}
                        {(idButtonsLeft == 1) && (
                            <Setup data={data} reloadData={handleReload} user={user} />
                        )}
                        {idButtonsLeft == 2 && (
                            <Transactions data={data} reloadData={handleReload} user={user} />
                        )}
                        {(idButtonsLeft == 3) && (
                            <Reports data={data}/>
                        )}
                        {(idButtonsLeft == 4) && (
                            <Settings user={user}/>
                        )}
                    </>
                )}
                
                {/* Regular users: limited navigation */}
                {!isAdmin && (
                    <>
                        {/* Dashboard for qualified regular users (centers assigned + ≥50% permission) */}
                        {adjustedIdButtonsLeft == 0 && canAccessDashboard && (
                            <Dashboard data={data} user={user} />
                        )}
                        {/* Setup for qualified regular users (centers assigned + ≥50% permission) */}
                        {((adjustedIdButtonsLeft == 1 && canAccessDashboard && canAccessSetup) || (adjustedIdButtonsLeft == 0 && !canAccessDashboard && canAccessSetup)) && (
                            <Setup data={data} reloadData={handleReload} user={user} />
                        )}
                        {/* Transactions */}
                        {((adjustedIdButtonsLeft == 2 && canAccessDashboard && canAccessSetup) || 
                          (adjustedIdButtonsLeft == 1 && canAccessDashboard && !canAccessSetup) ||
                          (adjustedIdButtonsLeft == 1 && !canAccessDashboard && canAccessSetup) ||
                          (adjustedIdButtonsLeft == 0 && !canAccessDashboard && !canAccessSetup)) && (
                            <Transactions data={data} reloadData={handleReload} user={user} />
                        )}
                        {/* Settings */}
                        {((adjustedIdButtonsLeft == 3 && canAccessDashboard && canAccessSetup) ||
                          (adjustedIdButtonsLeft == 2 && canAccessDashboard && !canAccessSetup) ||
                          (adjustedIdButtonsLeft == 2 && !canAccessDashboard && canAccessSetup) ||
                          (adjustedIdButtonsLeft == 1 && !canAccessDashboard && !canAccessSetup)) && (
                            <Settings user={user}/>
                        )}
                    </>
                )}
            </div>
        </div>
    </>
}