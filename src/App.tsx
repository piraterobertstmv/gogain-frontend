import { useState, useEffect } from 'react'

import { Application } from './pages/Application'
import { Login } from './pages/Login'

function App() {
    const [user, setUser] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUser();
    }, [])

    const getUser = async () => {
        // Return if no token
        const token = localStorage.getItem('authToken')
        if (!token) {
            setLoading(false)
            return
        }

        try {
            // Use localhost URL directly for development
            const apiUrl = 'http://localhost:3001/';
            
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
                <p>Loading...</p>
            ) : Object.keys(user).length === 0 ? (
                <Login setUser={setUser} />
            ) : (
                <Application user={user} setUser={setUser}/>
            )}
        </>
    )
}


export default App;