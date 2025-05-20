import { useEffect, useState } from 'react';
import { formatString } from '../../tools/tools';

export function InputFromService({ isCosts, name, addOrModifyValueInBodyApi, defaultValue, errorValue } : { isCosts: string, name: string, addOrModifyValueInBodyApi:any, defaultValue: string, errorValue: string }) {
    const [str, setStr] = useState(defaultValue.toString());
    const [isEditable, setIsEditable] = useState(false);
    const isBoolCosts: boolean = isCosts === "revenue";

    useEffect(() => {
        setStr(defaultValue.toString());
    }, [defaultValue]);

    let label = formatString(name);

    if (label === "Cost") {
        label = "Amount with taxes (€)";
    }

    if (label === "Cost without") {
        label = "Amount without taxes (€)";
    }

    if (label === "Taxes") {
        label = "Taxes (%)";
    }
    
    return <>
        <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <label htmlFor="transactionDate" className="form-label mb-0">{label}</label>
                {isBoolCosts && (
                    <button
                        type="button"
                        className="btn btn-sm btn-link text-decoration-none p-0"
                        onClick={() => setIsEditable(!isEditable)}
                    >
                        {isEditable ? "Use default" : "Edit"}
                    </button>
                )}
            </div>
            <input 
                disabled={isBoolCosts && !isEditable} 
                type="text" 
                onChange={(e) => {
                    setStr(e.target.value); 
                    addOrModifyValueInBodyApi(name, e.target.value);
                }} 
                value={str} 
                className="form-control"
            />
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
    </>;
}