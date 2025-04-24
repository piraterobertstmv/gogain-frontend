import { useState } from 'react';
import { formatString } from '../../tools/tools';

export function InputService({ name, addOrModifyValueInBodyApi, data, defaultValue, errorValue, user } : { name: string, addOrModifyValueInBodyApi: any, data: any, defaultValue: string, errorValue: string, user: any }) {
    const [service, setService] = useState(defaultValue)
    const servicesAvailable: object[] = data.service

    function modifyService(e: any) {
        setService(e.target.value)
        addOrModifyValueInBodyApi(name, e.target.value)
    }

    return <>
        <div className="mb-3">
            <label htmlFor="transactionService" className="form-label">{formatString(name)}</label>
            <select value={service} className="form-select" onChange={(e) => {modifyService(e)}} id="transactionService" aria-label="transactionService">
                <option value="">-- Select Service --</option>
                {servicesAvailable.map((service :any) => (
                    user.services.includes(service._id) || user.isAdmin ? (
                        <option key={service._id} value={service._id}>{service.name}</option>
                    ) : null
                ))}
            </select>
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
</>
}