import { useState } from 'react';
import { formatString } from '../../tools/tools';

export function InputWorker({ name, addOrModifyValueInBodyApi, data, defaultValue, errorValue, user } : { name: string, addOrModifyValueInBodyApi: any, data: any, defaultValue: string, errorValue: string, user: any }) {
    const [worker, setWorker] = useState(user.isAdmin ? defaultValue : user._id)
    const workersAvailable: object[] = data.users

    return <>
        <div className="mb-3">
            <label htmlFor="transactionWorker" className="form-label">{formatString(name)}</label>
            <select value={worker} className="form-select" onChange={(e) => {setWorker(e.target.value); addOrModifyValueInBodyApi(name, e.target.value)}} id="transactionWorker" aria-label="transactionWorker" disabled={!user.isAdmin}>
                {defaultValue === "" && (
                    <option value=""></option>
                )}
                {workersAvailable.map((worker :any) => (
                    <option key={worker._id} value={worker._id}>{worker.lastName + " " + worker.firstName}</option>
                ))}
            </select>
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
    </>
}