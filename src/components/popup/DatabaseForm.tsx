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

    if (columnName == "transaction" && !('service' in dataToSendApi) && defaultValue != null) {
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
        updatedData[fieldName] = value

        if (fieldName == "isAdmin") {
            updatedData[fieldName] = value === "ADMINISTRATOR"
        }

        setDataToSendApi(updatedData)
    }

    function checkIfDataIsCorrect(): boolean {
        const tmpErr: any = {}

        if (columnName === "client" && "firstName" in dataToSendApi && "lastName" in dataToSendApi && "email" in dataToSendApi) {
            return true
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
                const response = await fetch(`${import.meta.env.VITE_API_URL}${colNameDb}/${defaultValue._id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok')
                }
                closePopupFunc()
            } catch (error) {
                console.error('Error:', error);
            }
        }
        await fetchData()
    }

    async function saveChange() {
        const isModifyOrNew = defaultValue === null ? "" : "/" + defaultValue._id;
        const colNameDb: string = columnName == "center" ? "centers" : columnName

        if (colNameDb == "users") {
            dataToSendApi["password"] = "password"
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}${colNameDb}${isModifyOrNew}`, {
                method: isModifyOrNew === "" ? "POST" : "PATCH",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSendApi)
            })

            if (!response.ok) {
                throw new Error('Network response was not ok')
            }
            closePopupFunc()
        } catch (error) {
            //alert('Something is wrong with the API call');
            console.error('Error:', error);
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
                                <InputList name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} listOfValues={["ADMINISTRATOR", "REGULAR USER"]} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""}/>
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