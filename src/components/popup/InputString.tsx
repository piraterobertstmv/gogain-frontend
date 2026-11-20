import { useState } from 'react';
import { formatString } from '../../tools/tools';

export function InputString({ name, addOrModifyValueInBodyApi, defaultValue, errorValue, type = "text" } : { name: string, addOrModifyValueInBodyApi: any, defaultValue: string, errorValue: string, type?: string }) {
    const [str, setStr] = useState(defaultValue ?? "")

    let labelName = formatString(name)

    return <>
        <div className="mb-3">
            <label htmlFor="transactionDate" className="form-label">{labelName}</label>
            <input type={type} autoComplete={type === "password" ? "new-password" : undefined} value={str} onChange={(e) => {setStr(e.target.value); addOrModifyValueInBodyApi(name, e.target.value)}} className="form-control"/>
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
    </>
}