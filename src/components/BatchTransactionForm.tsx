import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { InputDate } from './popup/InputDate';
import { InputCenter } from './popup/InputCenter';
import { InputService } from './popup/InputService';
import { InputClient } from './popup/InputClient';
import { InputTypeOfTransaction } from './popup/InputTypeOfTransaction';
import { InputIsSupplier } from './popup/InputIsSupplier';

interface BatchTransactionFormProps {
    data: any;
    closePopupFunc: () => void;
    user: any;
}

type InputChangeHandler = (name: string, value: any) => void;

export function BatchTransactionForm({ data, closePopupFunc, user }: BatchTransactionFormProps) {
    const [transactions, setTransactions] = useState<any[]>([{
        worker: user._id,
        typeOfClient: "client",
        typeOfTransaction: "revenue",
        typeOfMovement: "bank transfer",
        frequency: "ordinary",
        cost: 0,
        taxes: 0,
        date: new Date().toISOString().slice(0, 10),
    }]);
    
    const [commonFields, setCommonFields] = useState<any>({
        date: new Date().toISOString().slice(0, 10),
        worker: user._id,
        center: "",
        service: "",
        typeOfTransaction: "revenue",
    });
    
    const [numTransactions, setNumTransactions] = useState(1);
    
    // Calculate total with taxes
    const calculateTotalWithTaxes = (cost: number, taxes: number) => {
        const costValue = parseFloat(cost.toString()) || 0;
        const taxesValue = parseFloat(taxes.toString()) || 0;
        return costValue + taxesValue;
    };
    
    // Update all transactions with common fields
    const updateCommonField: InputChangeHandler = (field, value) => {
        setCommonFields({
            ...commonFields,
            [field]: value
        });
        
        // Update this field in all transactions
        setTransactions(transactions.map(t => ({
            ...t,
            [field]: value
        })));
        
        // If the service is being updated, update cost and taxes for all transactions
        if (field === 'service') {
            const service = data.service.find((s: any) => s._id === value);
            if (service) {
                const updatedTransactions = transactions.map(t => ({
                    ...t,
                    service: value,
                    cost: service.cost || 0,
                    taxes: service.tax || 0
                }));
                setTransactions(updatedTransactions);
            }
        }
    };
    
    // Update a specific transaction
    const updateTransaction = (index: number, field: string, value: any) => {
        const updatedTransactions = [...transactions];
        updatedTransactions[index] = {
            ...updatedTransactions[index],
            [field]: value
        };
        
        // If cost or taxes are updated, recalculate the total
        if (field === 'cost' || field === 'taxes') {
            const cost = field === 'cost' ? value : updatedTransactions[index].cost || 0;
            const taxes = field === 'taxes' ? value : updatedTransactions[index].taxes || 0;
            updatedTransactions[index].totalWithTaxes = calculateTotalWithTaxes(cost, taxes);
        }
        
        setTransactions(updatedTransactions);
    };
    
    // Add a new transaction row
    const addTransactionRow = () => {
        setNumTransactions(numTransactions + 1);
        setTransactions([
            ...transactions, 
            {
                ...commonFields,
                client: "",
                cost: 0,
                taxes: 0,
                totalWithTaxes: 0,
                typeOfClient: "client",
                typeOfMovement: "bank transfer",
                frequency: "ordinary",
            }
        ]);
    };
    
    // Remove a transaction row
    const removeTransactionRow = (index: number) => {
        if (transactions.length > 1) {
            setNumTransactions(numTransactions - 1);
            setTransactions(transactions.filter((_, i) => i !== index));
        }
    };
    
    // Save all transactions
    const saveTransactions = async () => {
        // Check if all required fields are filled
        const requiredFields = ['date', 'worker', 'center', 'client', 'service', 'cost', 'taxes', 'typeOfTransaction'];
        
        const isValid = transactions.every(transaction => {
            return requiredFields.every(field => {
                return transaction[field] !== undefined && transaction[field] !== "";
            });
        });
        
        if (!isValid) {
            alert("Please fill all required fields for all transactions");
            return;
        }
        
        try {
            // Use environment variable for API URL instead of hardcoded localhost
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/';
            
            const response = await fetch(`${apiUrl}transactions/batch`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ transactions })
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            closePopupFunc();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to save transactions');
        }
    };
    
    // When service is selected, update cost and taxes

    
    return (
        <Modal.Body>
            <div className="mb-4">
                <h5>Common Fields</h5>
                <div className="row">
                    <div className="col-md-6">
                        <InputDate 
                            name="date" 
                            addOrModifyValueInBodyApi={updateCommonField} 
                            defaultValue={commonFields.date} 
                            errorValue=""
                        />
                    </div>
                    <div className="col-md-6">
                        <InputCenter 
                            name="center" 
                            addOrModifyValueInBodyApi={updateCommonField} 
                            data={data} 
                            defaultValue={commonFields.center} 
                            errorValue=""
                            user={user}
                        />
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <InputService 
                            name="service" 
                            addOrModifyValueInBodyApi={updateCommonField} 
                            data={data} 
                            defaultValue={commonFields.service} 
                            errorValue=""
                            user={user}
                        />
                    </div>
                    <div className="col-md-6">
                        <InputTypeOfTransaction 
                            setIsCosts={() => {}} 
                            name="typeOfTransaction" 
                            addOrModifyValueInBodyApi={updateCommonField} 
                            listOfValues={["revenue", "cost"]} 
                            defaultValue={commonFields.typeOfTransaction} 
                            errorValue=""
                        />
                    </div>
                </div>
            </div>
            
            <hr />
            
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Transactions ({numTransactions})</h5>
                <Button variant="success" onClick={addTransactionRow}>Add Transaction</Button>
            </div>
            
            {transactions.map((transaction, index) => (
                <div key={index} className="transaction-row mb-4 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6>Transaction #{index + 1}</h6>
                        {transactions.length > 1 && (
                            <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => removeTransactionRow(index)}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                    
                    <div className="row">
                        <div className="col-md-6">
                            <InputClient 
                                name="client" 
                                addOrModifyValueInBodyApi={(name: string, value: any) => updateTransaction(index, name, value)} 
                                data={data} 
                                defaultValue={transaction.client} 
                                errorValue=""
                                isSupplier={transaction.typeOfClient}
                            />
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label>Cost</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    value={transaction.cost} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTransaction(index, 'cost', parseFloat(e.target.value) || 0)}
                                />
                            </Form.Group>
                        </div>
                    </div>
                    
                    <div className="row mt-2">
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label>Taxes</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    value={transaction.taxes} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTransaction(index, 'taxes', parseFloat(e.target.value) || 0)}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <InputIsSupplier 
                                name="typeOfClient" 
                                addOrModifyValueInBodyApi={(name: string, value: any) => updateTransaction(index, name, value)} 
                                defaultValue={transaction.typeOfClient} 
                                errorValue=""
                            />
                        </div>
                    </div>
                </div>
            ))}
            
            <div className="d-flex justify-content-end mt-4">
                <Button variant="secondary" className="me-2" onClick={closePopupFunc}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={saveTransactions}>
                    Save All Transactions
                </Button>
            </div>
        </Modal.Body>
    );
} 