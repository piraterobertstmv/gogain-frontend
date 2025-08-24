import './Settings.css'
import { useState } from 'react';

export function Settings({ user } : { user: any }) {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)

    const handleChangePassword = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        if (password.length < 8) {
            setMessage({text: 'Password must have at least 8 characters', type: 'error'});
            setIsLoading(false);
            return;
        }

        try {
            // Use environment variable for API URL instead of hardcoded localhost
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/';
            console.log('Settings: Using API URL for password change:', apiUrl);
            
            // Get authentication token
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Authentication token not found');
            }
            
            const response = await fetch(`${apiUrl}users/${user._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password }),
            });
    
            console.log('Password change response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Password change failed')
            }

            setMessage({text: 'Password successfully changed', type: 'success'});
            setPassword(''); // Clear the password field after successful change

        } catch (error: any) {
            console.error('Password change error:', error);
            setMessage({text: `Password change failed: ${error.message || 'Unknown error'}`, type: 'error'});
        } finally {
            setIsLoading(false);
        }
    };
    
    return <>
        <div style={{display: "flex", alignItems: "flex-start", flexDirection: "column", marginTop: "1vw"}}>
            <span style={{ margin: "0vw 0vw 0vw 2vw", color: "rgb(115, 106, 101)"}}>
                Type your new password
            </span>
            <div style={{ marginLeft: "2vw", marginTop: "3vh", display: "flex" }}>
                <input
                    type={showPassword ? "text" : "password"}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    value={password}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                        marginLeft: "5px",
                        padding: "5px 10px",
                        cursor: "pointer",
                        backgroundColor: "#007BFF",
                        color: "#FFF",
                        border: "none",
                        borderRadius: "5px",
                        width: "10vw"
                    }}
                >
                    {showPassword ? "Hide" : "Show"}
                </button>
            </div>
            
            {message && (
                <div 
                    style={{ 
                        marginLeft: "2vw", 
                        marginTop: "2vh", 
                        padding: "10px", 
                        borderRadius: "5px",
                        backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                        color: message.type === 'success' ? '#155724' : '#721c24',
                        border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                    }}
                >
                    {message.text}
                </div>
            )}
            
            <button 
                className="logout-button" 
                onClick={handleChangePassword}
                disabled={isLoading}
            >
                {isLoading ? 'Changing password...' : 'Change password'}
            </button>
        </div>
    </>
}