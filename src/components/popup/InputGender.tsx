import { useState } from 'react';
import { formatString } from '../../tools/tools';

export function InputGender({ name, addOrModifyValueInBodyApi, defaultValue, errorValue } : { name: string, addOrModifyValueInBodyApi: any, defaultValue: string, errorValue: string }) {
    const [gender, setGender] = useState(defaultValue)

    return <>
        <div className="mb-3">
            <label htmlFor="transactionDate" className="form-label">{formatString(name)}</label>
            <select value={gender} className="form-select" onChange={(e) => {setGender(e.target.value); addOrModifyValueInBodyApi(name, e.target.value)}} id="clientGender" aria-label="clientGender">
                {defaultValue === "" && (
                    <option value=""></option>
                )}
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
    </>
}