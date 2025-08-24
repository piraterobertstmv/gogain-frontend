import './Login.css';
import logo from "../assets/Logo.png"
import illustration from "../assets/Illustration.png"
import { useState } from 'react'
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Login({setUser}: {setUser: any}) {
    const [email, setEmail] = useState<any>("");
    const [password, setPassword] = useState<any>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        console.log('Attempting login with:', { email });
        // Use environment variable for API URL instead of localhost
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/';
        console.log('API URL:', apiUrl);
        
        // Add more debugging information
        console.log('Full API endpoint:', `${apiUrl}users/login`);
        console.log('Environment:', import.meta.env.MODE);

        try {
            // Add a fetch to check if the backend is reachable
            console.log('Testing backend connection...');
            try {
                const testResponse = await fetch(`${apiUrl}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                console.log('Backend connection test result:', testResponse.ok, testResponse.status);
            } catch (testError) {
                console.error('Backend connection test failed:', testError);
            }

            const response = await fetch(`${apiUrl}users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('Login response status:', response.status);
            
            const responseData = await response.json();
            console.log('Login response data:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Login failed')
            }

            localStorage.setItem('authToken', responseData.authToken)
            setUser(responseData.user)
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <img src={logo} alt="GoGain Logo" className="logo" />
                <h2>Welcome <span role="img" aria-label="wave">👋</span></h2>
                <p>Log in to your GoGain account.</p>
                
                {isLoading ? (
                    <LoadingSpinner message="Logging in..." />
                ) : (
                    <form>
                        <label>Mail</label>
                        <input onChange={(e) => {setEmail(e.target.value)}} style={{marginBottom: "1vh"}} type="email" placeholder="example@email.com" />
                        
                        <label>Password</label>
                        <input onChange={(e) => {setPassword(e.target.value)}} style={{marginBottom: "1vh"}} type="password" placeholder="At least 8 characters" />
                        
                        {error && <div className="alert alert-danger" role="alert">{error}</div>}
                        
                        <button onClick={handleLogin} type="submit" className="login-button">Login</button>
                    </form>
                )}
            </div>
            
            <div className="login-image">
                <img src={illustration} alt="Fitness Training" />
            </div>
        </div>
    );
}
