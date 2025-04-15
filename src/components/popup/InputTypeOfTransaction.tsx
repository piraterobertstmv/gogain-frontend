import { useState } from 'react';
import { formatString } from '../../tools/tools';

export function InputTypeOfTransaction({ setIsCosts, name, addOrModifyValueInBodyApi, listOfValues, defaultValue, errorValue } : { setIsCosts: any, name: string, addOrModifyValueInBodyApi: any, listOfValues: string[], defaultValue: string, errorValue: string }) {
    const [typeOfTransaction, setTypeOfTransaction] = useState(defaultValue)

    return <>
        <div className="mb-3">
            <label htmlFor="transactionTypeOfTransaction" className="form-label">{formatString(name)}</label>
            <select value={typeOfTransaction} className="form-select" onChange={(e) => {setIsCosts(e.target.value); setTypeOfTransaction(e.target.value); addOrModifyValueInBodyApi(name, e.target.value)}} id="transactionTypeOfTransaction" aria-label="transactionTypeOfTransaction">
                {defaultValue === "" && (
                    <option value=""></option>
                )}
                {listOfValues.map((typeOfTransaction :string) => (
                    <option key={typeOfTransaction} value={typeOfTransaction}>{typeOfTransaction}</option>
                ))}
            </select>
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
</>
}