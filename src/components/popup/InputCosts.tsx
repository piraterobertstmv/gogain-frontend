import { useState } from 'react';

export function InputCosts({ name, addOrModifyValueInBodyApi, data, defaultValue, errorValue } : { name: string, addOrModifyValueInBodyApi: any, data: any, defaultValue: string, errorValue: string }) {
    const [costs, setCosts] = useState(defaultValue)
    const costsAvailable: object[] = data.costs

    function modifyCosts(e: any) {
        setCosts(e.target.value)
        addOrModifyValueInBodyApi(name, e.target.value)
    }

    return <>
        <div className="mb-3">
            <label htmlFor="transactionCosts" className="form-label">{"Cost"}</label>
            <select value={costs} className="form-select" onChange={(e) => {modifyCosts(e)}} id="transactionCosts" aria-label="transactionCosts">
                {defaultValue === "" && (
                    <option value=""></option>
                )}
                {costsAvailable.map((costs :any) => (
                    <option key={costs._id} value={costs._id}>{costs.name}</option>
                ))}
            </select>
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
</>
}