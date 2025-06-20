import { useState, useEffect } from 'react'

import { Application } from './pages/Application'
import { Login } from './pages/Login'
import { startKeepAlive } from './services/KeepAliveService'
import { LoadingSpinner } from './components/LoadingSpinner'

function App() {
    const [user, setUser] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize keep-alive service
        const stopKeepAliveService = startKeepAlive();
        
        // Get user data on app load
        getUser();
        
        // Clean up keep-alive service when component unmounts
        return () => {
            stopKeepAliveService();
        };
    }, [])

    const getUser = async () => {
        // Return if no token
        const token = localStorage.getItem('authToken')
        if (!token) {
            setLoading(false)
            return
        }

        try {
            // Use environment variable for API URL instead of localhost
            const apiUrl = import.meta.env.VITE_API_URL || 'https://gogain-backend.onrender.com/';
            console.log('Using API URL:', apiUrl);
            
            const response = await fetch(`${apiUrl}users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data);
            } else {
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            localStorage.removeItem('authToken');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {loading ? (
                <div className="d-flex justify-content-center align-items-center vh-100">
                    <LoadingSpinner message="Loading your dashboard..." />
                </div>
            ) : Object.keys(user).length === 0 ? (
                <Login setUser={setUser} />
            ) : (
                <Application user={user} setUser={setUser}/>
            )}
        </>
    )
}

export default App;