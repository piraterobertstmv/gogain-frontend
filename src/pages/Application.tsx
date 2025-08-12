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
                
                const [transactions, clients, users, centers, services, costs] = await Promise.all([
                    fetch(`${apiUrl}transaction`, { headers }),
                    fetch(`${apiUrl}client`, { headers }),
                    fetch(`${apiUrl}users`, { headers }),
                    fetch(`${apiUrl}center`, { headers }),
                    fetch(`${apiUrl}service`, { headers }),
                    fetch(`${apiUrl}costs`, { headers })
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
                    costs.json()
                ]);
                
                // Log the results
                console.log('Fetched data:', {
                    transactions: results[0].transactions?.length || 0,
                    clients: results[1].client?.length || 0,
                    users: results[2].users?.length || 0,
                    centers: results[3].center?.length || 0,
                    services: results[4].service?.length || 0,
                    costs: results[5].costs?.length || 0
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
                
                setData({
                    transaction: sortedTransactions,
                    client: sortedClients,
                    users: results[2].users || [],
                    center: results[3].center || [],
                    service: results[4].service || [],
                    costs: results[5].costs || []
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [reload]);

    const [idButtonsLeft, setIdButtonsLeft] = useState(2)

    return <>
        <div className="bottom-bar-container">
            <Header user={user} />
        </div>
        <div className='d-flex flex-row' style={{ backgroundColor: "#FBFBFB", fontFamily: 'Inter, sans-serif' }}>
            <div style={{ width: "max-content" }}>
                <LeftButtonsRadio buttonsName={["Dashboard", "Set up", "Transactions", "Reports", "Settings"]} idButtonsName={idButtonsLeft} setIdButtonsLeft={setIdButtonsLeft} setUser={setUser}/>
            </div>
            <div>
                {(idButtonsLeft == 0) && (
                    <Dashboard data={data} />
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
            </div>
        </div>
    </>
}