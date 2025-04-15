import { useState } from 'react';
import { formatString } from '../../tools/tools';

export function InputServiceList({ name, addOrModifyValueInBodyApi, data, defaultValue, errorValue } : { name: string, addOrModifyValueInBodyApi: any, data: any, defaultValue: string[], errorValue: string }) {
    const initialServices: any = {}
    
    if (defaultValue !== null) {
        defaultValue.map((center: string) => {
            initialServices[center] = true
        })
    }
    
    const [services, setServices]: any = useState(initialServices)
    
    function changeServices(name: string, event: any) {
        const updatedServices = { ...services }
        updatedServices[event.target.value] = event.target.checked
        setServices(updatedServices)

        const centerListToSend: string[] = []
        Object.entries(updatedServices).forEach(([key, value]) => {
            if (value)
                centerListToSend.push(key)
        });

        addOrModifyValueInBodyApi(name, centerListToSend)
    }
    
    return <>
        <div className="mb-3">
            <label htmlFor="clientServices" className="form-label">{formatString(name)}</label>
            {data.service.map((service :any, index :number) => (
                <div className="form-check" key={index}>
                    <input className='form-check-input' onChange={(e) => {changeServices(name, e)}} checked={services[service._id]} type='checkbox' value={service._id} id={service._id} />
                    <label className='form-check-label' htmlFor={service._id}>
                        {service.name}
                    </label>
                </div>
            ))}
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
    </>
}