import { useEffect, useState } from 'react';
import { formatString } from '../../tools/tools';

export function InputFromService({ isCosts, name, addOrModifyValueInBodyApi, defaultValue, errorValue } : { isCosts: string, name: string, addOrModifyValueInBodyApi:any, defaultValue: string, errorValue: string }) {
    const [str, setStr] = useState(defaultValue.toString())
    const isBoolCosts: boolean = isCosts === "revenue"

    useEffect(() => {
        setStr(defaultValue.toString());
    }, [defaultValue]);

    let label = formatString(name)

    if (label === "Cost") {
        label = "Amount with taxes (€)"
    }

    if (label === "Cost without") {
        label = "Amount without taxes (€)"
    }

    if (label === "Taxes") {
        label = "Taxes (%)"
    }
    
    return <>
        <div className="mb-3">
            <label htmlFor="transactionDate" className="form-label">{label}</label>
            <input disabled={isBoolCosts} type="text" onChange={(e) => {setStr(e.target.value); addOrModifyValueInBodyApi(name, e.target.value)}} value={ str } className="form-control"/>
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
    </>
}