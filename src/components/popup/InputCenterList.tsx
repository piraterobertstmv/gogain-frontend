import { useState } from 'react';
import { formatString } from '../../tools/tools';

export function InputCenterList({ name, addOrModifyValueInBodyApi, data, defaultValue, errorValue } : { name: string, addOrModifyValueInBodyApi: any, data: any, defaultValue: string[], errorValue: string }) {
    const initialCenters: any = {}
    
    if (defaultValue !== null) {
        defaultValue.map((center: string) => {
            initialCenters[center] = true
        })
    }
    
    const [centers, setCenters]: any = useState(initialCenters)
    
    function changeCenters(name: string, event: any) {
        const updatedCenters = { ...centers }
        updatedCenters[event.target.value] = event.target.checked
        setCenters(updatedCenters)

        const centerListToSend: string[] = []
        Object.entries(updatedCenters).forEach(([key, value]) => {
            if (value)
                centerListToSend.push(key)
        });

        addOrModifyValueInBodyApi(name, centerListToSend)
    }

    return <>
        <div className="mb-3">
            <label htmlFor="clientCenters" className="form-label">{formatString(name)}</label>
            {data.center.map((center :any, index :number) => (
                <div className="form-check" key={index}>
                    <input className='form-check-input' onChange={(e) => {changeCenters(name, e)}} checked={centers[center._id]} type='checkbox' value={center._id} id={center._id} />
                    <label className='form-check-label' htmlFor={center._id}>
                        {center.name}
                    </label>
                </div>
            ))}
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
    </>
}