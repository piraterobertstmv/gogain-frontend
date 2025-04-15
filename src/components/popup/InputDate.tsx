import { useState } from 'react';
import { formatString } from '../../tools/tools';

export function InputDate({ name, addOrModifyValueInBodyApi, defaultValue, errorValue } : { name: string, addOrModifyValueInBodyApi: any, defaultValue: string, errorValue: string }) {
    const [date, setDate] = useState(defaultValue == null ? "" : defaultValue.slice(0, 10))
    
    return <>
        <div className="mb-3">
            <label htmlFor="transactionDate" className="form-label">{formatString(name)}</label>
            <input aria-label="Date" value={date} type="date" onChange={(e) => {setDate(e.target.value); addOrModifyValueInBodyApi(name, e.target.value)}} className="form-control"/>
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
    </>
}