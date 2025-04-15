import { useState } from 'react';

export function InputIsSupplier({ name, addOrModifyValueInBodyApi, defaultValue, errorValue } : { name: string, addOrModifyValueInBodyApi: any, defaultValue: string, errorValue: string }) {
    const [isSupplier, setIsSupplier] = useState(defaultValue)

    return <>
        <div className="mb-3">
            <label htmlFor="transactionDate" className="form-label">{"Client / Supplier"}</label>
            <select value={isSupplier} className="form-select" onChange={(e) => {setIsSupplier(e.target.value); addOrModifyValueInBodyApi(name, e.target.value)}} id="clientIsSupplier" aria-label="clientIsSupplier">
                {defaultValue === "" && (
                    <option value=""></option>
                )}
                <option value="client">client</option>
                <option value="supplier">supplier</option>
            </select>
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
    </>
}