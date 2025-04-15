import { useState } from 'react';
import { formatString } from '../../tools/tools';

export function InputCenter({ name, addOrModifyValueInBodyApi, data, defaultValue, errorValue, user } : { name: string, addOrModifyValueInBodyApi: any, data: any, defaultValue: string, errorValue: string, user: any }) {
    const [center, setCenter] = useState(defaultValue)
    const centersAvailable: object[] = data.center

    return <>
        <div className="mb-3">
            <label htmlFor="transactionCenter" className="form-label">{formatString(name)}</label>
            <select value={center} className="form-select" onChange={(e) => {setCenter(e.target.value); addOrModifyValueInBodyApi(name, e.target.value)}} id="transactionCenter" aria-label="transactionCenter">
                {defaultValue === "" && (
                    <option value=""></option>
                )}
                {centersAvailable.map((center :any) => (
                    user.centers.includes(center._id) || user.isAdmin ? (
                        <option key={center._id} value={center._id}>{center.name}</option>
                    ) : null
                ))}
            </select>
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
</>
}