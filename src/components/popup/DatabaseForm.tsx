import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { InputString } from './InputString';
import { InputGender } from './InputGender';
import { InputDate } from './InputDate';
import { InputCenter } from './InputCenter';
import { InputService } from './InputService';
import { InputCosts } from './InputCosts';
import { InputClient } from './InputClient';
import { InputWorker } from './InputWorker';
import { InputList } from './InputList';
import { InputCenterList } from './InputCenterList';
import { InputServiceList } from './InputServiceList';
import { InputIsSupplier } from './InputIsSupplier';
import { InputFromService } from './InputFromService';
import { InputTypeOfTransaction } from './InputTypeOfTransaction';
import { findObjWithId } from '../../tools/tools';
import React from 'react';

export function DatabaseForm({ columnName, data, defaultValue, closePopupFunc, user } : { columnName: string, data: any, defaultValue: any, closePopupFunc: any, user: any }) {
    const [dataToSendApi, setDataToSendApi]:any = useState(user.isAdmin ? {
        typeOfClient: defaultValue !== null ? defaultValue.typeOfClient : "",
    } : {
        worker: user._id,
        typeOfClient: defaultValue !== null ? defaultValue.typeOfClient : "",
    })

    const [err, setErr]:any = useState({})

    if ((columnName == "transaction" || columnName == "costTransactions") && !('service' in dataToSendApi) && defaultValue != null) {
        addOrModifyValueInBodyApi('service', defaultValue.service)
    }

    const formTemplate: any = {
        center: {
            name: "string"
        },
        client: {
            firstName: "string",
            lastName: "string",
            email: "email",
            phoneNumber: "phoneNumber",
            gender: "gender",
            birthdate: "date",
            zipcode: "zipcode",
            city: "string",
            address: "string"
        },
        service: {
            name: "string",
            cost: "number",
            tax: "percentage"
        },
        transaction: {
            date: "date",
            worker: "worker",
            center: "center",
            typeOfTransaction: "listTransaction",
            typeOfClient: "isSupplier",
            client: "client",
            service: "service",
            cost: "costFromService",
            costWithout: "costWithoutFromService",
            taxes: "taxFromService",
            typeOfMovement: "listMovement",
            frequency: "listFrequency"
        },
        users: {
            email: "email",
            centers: "centerList",
            services: "serviceList",
            lastName: "string",
            firstName: "string",
            isAdmin: "listAdmin",
            percentage: "percentage",
        },
        costs: {
            name: "string"
        }
    }

    function addOrModifyValueInBodyApi(fieldName: string, value: any) {
        if (fieldName == "costWithout")
            return

        let updatedData = { ...dataToSendApi };
        
        // Convert admin status immediately when changed
        if (fieldName === "isAdmin") {
            updatedData[fieldName] = value === "ADMINISTRATOR";
        } else {
            updatedData[fieldName] = value;
        }

        setDataToSendApi(updatedData)
    }

    function checkIfDataIsCorrect(): boolean {
        const tmpErr: any = {}

        if (columnName === "client" && "firstName" in dataToSendApi && "lastName" in dataToSendApi && "email" in dataToSendApi) {
            return true
        }

        if (columnName === "service" && "name" in dataToSendApi) {
            if (!dataToSendApi.name || dataToSendApi.name.trim() === "") {
                tmpErr["name"] = "Service name cannot be empty"
            }
            if (!("cost" in dataToSendApi) || dataToSendApi.cost === "" || isNaN(Number(dataToSendApi.cost))) {
                addOrModifyValueInBodyApi("cost", "0");
            }
            if (!("tax" in dataToSendApi) || dataToSendApi.tax === "" || isNaN(Number(dataToSendApi.tax))) {
                addOrModifyValueInBodyApi("tax", "0");
            }
            setErr(tmpErr);
            return Object.keys(tmpErr).length === 0;
        }

        if (defaultValue === null) {
            Object.entries(formTemplate[columnName]).forEach(([key]: [string, any]) => {
                if (!(key in dataToSendApi) && (key != "costWithout")) {
                    if (!(columnName == "client" && key != "firstName" && key != "lastName" && key != "email"))
                        tmpErr[key] = "This value cannot be empty"
                }
            })
        }

        Object.entries(dataToSendApi).forEach(([key, value]: [string, any]) => {
            const typeOfInput: string = formTemplate[columnName][key]

            if (value === "" && key in formTemplate[columnName]&& (columnName != "client" && ((key != "phoneNumber") && (key != "gender") && key != "birthdate" && key != "zipcode" && key != "city" && key != "address")))
                tmpErr[key] = "This value cannot be empty"

            switch (typeOfInput) {
                case "date":
                    break;
                
                case "email":
                    if (!value.includes('@') || !value.includes('.')) {
                        tmpErr[key] = "This value must contain a \'@\' and a '.'"
                    }
                    break;

                // case "gender":
                //     if (!(value === "male" || value === "female")) {
                //         tmpErr[key] = "This value must be \'male\' or \'female\'"
                //     }
                //     break;
                
                // case "phoneNumber":
                //     if (!/^\+?\d{10,20}$/.test(value)) {
                //         tmpErr[key] = "This value must be a valid phone number";
                //     }                    
                //     break;
                
                case "number":
                    if (!/^\d+$/.test(value)) {
                        tmpErr[key] = "This value must be a number"
                    }
                    break;
                // case "zipcode":
                //     if (!/^\d{4,9}$/.test(value) && (columnName != "client" && value !== "")) {
                //         tmpErr[key] = "This value must be between 4 and 9 numbers"
                //     }
                //     break;
                case "percentage":
                    const numValue = Number(value);
                    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
                        tmpErr[key] = "This value must be a number between 0 and 100";
                    }
                    break;
            }
        });

        setErr(tmpErr)

        if (Object.keys(tmpErr).length === 0)
            return true
        return false
    }

    async function deleteDataCurrentRow() {
        const colNameDb: string = columnName == "center" ? "centers" : columnName

        const fetchData = async () => {
            try {
                // Use environment variable for API URL instead of hardcoded localhost
                const apiUrl = import.meta.env.VITE_API_URL || 'https://gogain-backend.onrender.com/';
                
                const response = await fetch(`${apiUrl}${colNameDb}/${defaultValue._id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: response.statusText }));
                    console.error('Server error:', errorData);
                    throw new Error(errorData.message || 'Network response was not ok');
                }
                closePopupFunc()
            } catch (error: any) {
                console.error('Error:', error);
                alert(`Failed to delete: ${error.message || 'Unknown error'}`);
            }
        }
        await fetchData()
    }

    async function saveChange() {
        const isModifyOrNew = defaultValue === null ? "" : "/" + defaultValue._id;
        const colNameDb: string = columnName == "center" ? "centers" : columnName

        if (colNameDb == "users") {
            dataToSendApi["password"] = "password"
            
            // Only set percentage if it's actually being updated, otherwise preserve existing value
            if ("percentage" in dataToSendApi && dataToSendApi.percentage !== "") {
                // Convert percentage string to number
                dataToSendApi["percentage"] = parseFloat(dataToSendApi.percentage) || 0;
            } else if (defaultValue !== null && !("percentage" in dataToSendApi)) {
                // Preserve existing percentage when editing user without changing percentage
                dataToSendApi["percentage"] = defaultValue.percentage;
            } else if (defaultValue === null) {
                // Only set to 0 for new users
                dataToSendApi["percentage"] = 0;
            }
            
            // Preserve existing centers and services when not being updated
            if (!("centers" in dataToSendApi)) {
                if (defaultValue !== null && defaultValue.centers) {
                    dataToSendApi["centers"] = defaultValue.centers;
                } else {
                    dataToSendApi["centers"] = [];
                }
            }
            if (!("services" in dataToSendApi)) {
                if (defaultValue !== null && defaultValue.services) {
                    dataToSendApi["services"] = defaultValue.services;
                } else {
                    dataToSendApi["services"] = [];
                }
            }
            
            // FORCE convert isAdmin to boolean - handle all cases
            if ("isAdmin" in dataToSendApi) {
                const currentValue = dataToSendApi["isAdmin"];
                if (currentValue === "ADMINISTRATOR" || currentValue === true) {
                    dataToSendApi["isAdmin"] = true;
                } else {
                    dataToSendApi["isAdmin"] = false;
                }
            } else {
                // Field not in dataToSendApi - preserve existing value or default to false
                dataToSendApi["isAdmin"] = (defaultValue !== null && defaultValue.isAdmin === true) ? true : false;
            }
            console.log('Final isAdmin value:', dataToSendApi["isAdmin"], typeof dataToSendApi["isAdmin"]);
        }

        if (colNameDb == "client") {
            if (!("gender" in dataToSendApi)) {
                dataToSendApi["gender"] = ""
            }
            if (!("phoneNumber" in dataToSendApi)) {
                dataToSendApi["phoneNumber"] = ""
            }
            if (!("birthdate" in dataToSendApi)) {
                dataToSendApi["birthdate"] = ""
            }
            if (!("zipcode" in dataToSendApi)) {
                dataToSendApi["zipcode"] = ""
            }
            if (!("city" in dataToSendApi)) {
                dataToSendApi["city"] = ""
            }
            if (!("address" in dataToSendApi)) {
                dataToSendApi["address"] = ""
            }
        }

        if (!checkIfDataIsCorrect())
            return;

        try {
            // Debug: Log the data being sent
            console.log('Data being sent to API:', dataToSendApi);
            
            // Use environment variable for API URL instead of hardcoded localhost
            const apiUrl = import.meta.env.VITE_API_URL || 'https://gogain-backend.onrender.com/';
            
            const response = await fetch(`${apiUrl}${colNameDb}${isModifyOrNew}`, {
                method: isModifyOrNew === "" ? "POST" : "PATCH",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(dataToSendApi)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                console.error('Server error:', errorData);
                
                // Handle validation errors
                if (errorData.errors) {
                    const newErrors: any = {};
                    // Map backend validation errors to form fields
                    Object.entries(errorData.errors).forEach(([field, message]: [string, any]) => {
                        newErrors[field] = message;
                    });
                    setErr(newErrors);
                    throw new Error(errorData.message || 'Validation failed');
                }
                
                throw new Error(errorData.message || 'Network response was not ok');
            }
            closePopupFunc()
        } catch (error: any) {
            console.error('Error:', error);
            alert(`Failed to save: ${error.message || 'Unknown error'}`);
        }
    }

    function findValueFromService(columnServiceName: string, id: string) {
        for (let i = 0; i < data.service.length; i++) {
            if (data.service[i]._id == id) {
                return data.service[i][columnServiceName]
            }
        }

        if (defaultValue === null)
            return 0
        return defaultValue[columnServiceName === "tax" ? "taxes" : "cost"]
    }

    useEffect(() => {
        const serviceData = findObjWithId(data, dataToSendApi.service, "service")

        let updatedData = { ...dataToSendApi };
        updatedData["cost"] = serviceData.cost
        updatedData["taxes"] = serviceData.tax

        setDataToSendApi(updatedData)
    }, [dataToSendApi.service]);



    const [isCosts, setIsCosts] = useState(defaultValue == null ? "revenue" : defaultValue.typeOfTransaction)
    
    return (
        <>
            <Modal.Body>
                <form>
                    {Object.entries(formTemplate[columnName] ?? {}).map(([key, value]: any, index: number) => (
                        <React.Fragment key={index}>
                            {(value === "string" || value === "phoneNumber" || value === "email" || value === "number" || value == "zipcode" || value == "percentage") && (
                                <InputString name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""} />
                            )}
                            {value === "date" && (
                                <InputDate name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""} />
                            )}
                            {value === "gender" && (
                                <InputGender name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""} />
                            )}
                            {value === "center" && (
                                <InputCenter name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} data={data} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""} user={user}/>
                            )}
                            {value === "service" && (
                                isCosts === "cost" ? (
                                    <InputCosts name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} data={data} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""}/>
                                ) : (
                                    <InputService name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} data={data} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""} user={user}/>
                                )
                            )}
                            {value === "client" && (
                                <InputClient name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} data={data} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""} isSupplier={dataToSendApi.typeOfClient}/>
                            )}
                            {value === "worker" && (
                                <InputWorker name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} data={data} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""} user={user}/>
                            )}
                            {value === "centerList" && (
                                <InputCenterList name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} data={data} defaultValue={defaultValue === null ? null : defaultValue[key]} errorValue={err[key] ?? ""}/>
                            )}
                            {value === "serviceList" && (
                                <InputServiceList name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} data={data} defaultValue={defaultValue === null ? null : defaultValue[key]} errorValue={err[key] ?? ""}/>
                            )}
                            {value == "listTransaction" && (
                                <InputTypeOfTransaction setIsCosts={setIsCosts} name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} listOfValues={["revenue", "cost"]} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""}/>
                            )}
                            {value == "listMovement" && (
                                <InputList name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} listOfValues={["cash", "bank transfer", "card", "bank check"]} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""}/>
                            )}
                            {value == "listFrequency" && (
                                <InputList name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} listOfValues={["ordinary", "extraordinary"]} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""}/>
                            )}
                            {value == "listAdmin" && (
                                <InputList name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} listOfValues={["ADMINISTRATOR", "REGULAR USER"]} defaultValue={defaultValue === null ? "" : (defaultValue[key] === true ? "ADMINISTRATOR" : "REGULAR USER")} errorValue={err[key] ?? ""}/>
                            )}
                            {value == "isSupplier" && (
                                <InputIsSupplier name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""}/>
                            )}
                            {value == "costFromService" && (
                                <InputFromService isCosts={isCosts} name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={findValueFromService("cost", dataToSendApi.service).toFixed(2)} errorValue={err[key] ?? ""}/>
                            )}
                            {value == "costWithoutFromService" && (
                                 <InputFromService isCosts={isCosts} name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={ (findValueFromService("cost", dataToSendApi.service) / (1 + (findValueFromService("tax", dataToSendApi.service) / 100))).toFixed(2) } errorValue={err[key] ?? ""}/>   
                            )}
                            {value == "taxFromService" && (
                                <InputFromService isCosts={isCosts} name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={findValueFromService("tax", dataToSendApi.service)} errorValue={err[key] ?? ""}/>
                            )}
                        </React.Fragment>
                    ))}
                </form>
            </Modal.Body>



            <Modal.Footer>
                {(defaultValue === null) ? (
                    <span></span>
                ) : (
                    <Button variant='secondary' onClick={deleteDataCurrentRow} style={{ backgroundColor: "#FFF3EE", border: "solid 0.5px rgba(217, 82, 19, 0.24)", color: "#D95213"}} className="btn btn-danger">
                        Delete
                    </Button>
                )}
                <Button variant="primary" onClick={saveChange} style={{ backgroundColor: "#E9FFDB", border: "solid 0.5px rgba(101, 178, 53, 0.54)", color: "#65B235"}}>
                    Save Changes
                </Button>
            </Modal.Footer>
        </>
    )
}