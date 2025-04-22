import { useState, useEffect } from 'react'

import { Application } from './pages/Application'
import { Login } from './pages/Login'

function App() {
    const [user, setUser] = useState<any>({});

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            fetchUserData(token);
        }
    }, [])

    const fetchUserData = async (token: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
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
        }
    }

    return (
        <>
            {Object.keys(user).length === 0 ? (
                <Login setUser={setUser} />
            ) : (
                <Application user={user} setUser={setUser}/>
            )}
        </>
    )
}


export default App;