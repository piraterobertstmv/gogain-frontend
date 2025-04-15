import './Login.css';
import logo from "../assets/Logo.png"
import illustration from "../assets/Illustration.png"
import { useState } from 'react'

export function Login({setUser}: {setUser: any}) {
    const [email, setEmail] = useState<any>("");
    const [password, setPassword] = useState<any>("");


    const handleLogin = async (e: any) => {
        e.preventDefault();

        try {
            const response = await fetch(`${import.meta.env.VITE_API_KEY}users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Login failed')
            }

            const data = await response.json()
            localStorage.setItem('authToken', data.authToken)
            setUser(data.user)
        } catch (error: any) {
            alert('Login failed')
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <img src={logo} alt="GoGain Logo" className="logo" />
                <h2>Welcome <span role="img" aria-label="wave">👋</span></h2>
                <p>Log in to your GoGain account.</p>
                
                <form>
                    <label>Mail</label>
                    <input onChange={(e) => {setEmail(e.target.value)}} style={{marginBottom: "1vh"}} type="email" placeholder="example@email.com" />
                    
                    <label>Password</label>
                    <input onChange={(e) => {setPassword(e.target.value)}} style={{marginBottom: "1vh"}} type="password" placeholder="At least 8 characters" />
                    
                    <button onClick={handleLogin} type="submit" className="login-button">Login</button>
                </form>
            </div>
            
            <div className="login-image">
                <img src={illustration} alt="Fitness Training" />
            </div>
        </div>
    );
}
