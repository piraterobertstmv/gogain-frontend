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
                const responses = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/transaction`),
                    fetch(`${import.meta.env.VITE_API_URL}/client`),
                    fetch(`${import.meta.env.VITE_API_URL}/users`),
                    fetch(`${import.meta.env.VITE_API_URL}/center`),
                    fetch(`${import.meta.env.VITE_API_URL}/service`),
                    fetch(`${import.meta.env.VITE_API_URL}/costs`)
                ]);

                const results = await Promise.all(responses.map(r => r.json()));
                
                setData({
                    transaction: results[0].transactions || [],
                    client: results[1].client || [],
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
                <LeftButtonsRadio isUserAdmin={user.isAdmin} buttonsName={["Dashboard", "Set up", "Transactions", "Reports", "Settings"]} idButtonsName={idButtonsLeft} setIdButtonsLeft={setIdButtonsLeft} setUser={setUser}/>
            </div>
            <div>
                {(idButtonsLeft == 0 && user.isAdmin) && (
                    <Dashboard data={data} />
                )}
                {(idButtonsLeft == 1) && (
                    <Setup data={data} reloadData={handleReload} user={user} />
                )}
                {idButtonsLeft == 2 && (
                    <Transactions data={data} reloadData={handleReload} user={user} />
                )}
                {(idButtonsLeft == 3 && user.isAdmin) && (
                    <Reports data={data}/>
                )}
                {(idButtonsLeft == 4) && (
                    <Settings user={user}/>
                )}
            </div>
        </div>
    </>
}