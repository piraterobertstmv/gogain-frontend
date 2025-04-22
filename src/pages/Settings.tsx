import './Settings.css'
import { useState } from 'react';

export function Settings({ user } : { user: any }) {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleChangePassword = async (e: any) => {
        e.preventDefault();

        if (password.length < 8) {
            alert('Password must have more than 8 characters')
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${user._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });
    
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Password failed')
            }

            alert('Password successfully changed')

        } catch (error: any) {
            alert('Password failed')
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
            <button className="logout-button" onClick={handleChangePassword}>
                Change password
            </button>
        </div>
    </>
}