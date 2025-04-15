import { useState } from 'react';
import { InputDate } from './popup/InputDate';
import { InputCenter } from './popup/InputCenter';
import { InputService } from './popup/InputService';
import { InputClient } from './popup/InputClient';
import { InputTypeOfTransaction } from './popup/InputTypeOfTransaction';
import { InputIsSupplier } from './popup/InputIsSupplier';
import { InputWorker } from './popup/InputWorker';

interface DatabaseFormProps {
    columnName: string;
    data: any;
    defaultValue: any;
    closePopupFunc: any;
    user: any;
    onSuccess: () => void;
}

export function DatabaseForm({ columnName, data, defaultValue, closePopupFunc, user, onSuccess }: DatabaseFormProps) {
    const [bodyApi, setBodyApi] = useState<any>({
        worker: user._id,
        typeOfClient: "client",
        typeOfTransaction: "revenue",
        typeOfMovement: "bank transfer",
        frequency: "ordinary",
        cost: 0,
        taxes: 0,
        date: new Date().toISOString().slice(0, 10),
    });

    const addOrModifyValueInBodyApi = (name: string, value: any) => {
        setBodyApi((prevState: any) => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_KEY}transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(bodyApi)
            });

            if (response.ok) {
                closePopupFunc();
                onSuccess(); // Call onSuccess after successful submission
            } else {
                console.error('Failed to submit transaction:', await response.text());
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleInputChange = (value: string) => {
        // Implementation here
    };

    return (
        <div className="p-4">
            <InputDate 
                name="date" 
                addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} 
                defaultValue={bodyApi.date} 
                errorValue=""
            />
            <InputCenter 
                name="center" 
                addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} 
                data={data} 
                defaultValue={bodyApi.center} 
                errorValue=""
                user={user}
            />
            <InputClient 
                name="client" 
                addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} 
                data={data} 
                defaultValue={bodyApi.client} 
                errorValue=""
                isSupplier={bodyApi.typeOfClient}
            />
            <InputService 
                name="service" 
                addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} 
                data={data} 
                defaultValue={bodyApi.service} 
                errorValue=""
                user={user}
            />
            <InputTypeOfTransaction 
                setIsCosts={() => {}} 
                name="typeOfTransaction" 
                addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} 
                listOfValues={["revenue", "cost"]} 
                defaultValue={bodyApi.typeOfTransaction} 
                errorValue=""
            />
            <InputIsSupplier 
                name="typeOfClient" 
                addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} 
                defaultValue={bodyApi.typeOfClient} 
                errorValue=""
            />
            <InputWorker 
                name="worker" 
                addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} 
                data={data} 
                defaultValue={bodyApi.worker} 
                errorValue=""
                user={user}
            />
            <button onClick={handleSubmit} className="btn btn-primary mt-3">
                Submit
            </button>
        </div>
    );
} 