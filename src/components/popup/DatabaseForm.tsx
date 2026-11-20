import { useState } from 'react';
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
import React from 'react';
import { apiFetch, DataChange, extractSavedDoc } from '../../services/api';

// isAdmin arrives either as a boolean (API) or as "ADMINISTRATOR" (table row display value)
function isAdminValue(value: any): boolean {
    return value === true || value === "ADMINISTRATOR";
}

// Frontend column name -> backend route, when they differ
const API_ENDPOINTS: Record<string, string> = {
    costTransactions: "cost-transactions",
};

// closePopupFunc(change): called after a successful save/delete with what changed.
// (Closing the modal without saving calls the parent's handler with no argument.)
export function DatabaseForm({ columnName, data, defaultValue, closePopupFunc, user } : { columnName: string, data: any, defaultValue: any, closePopupFunc: (change?: DataChange) => void, user: any }) {
    const isNew = defaultValue === null;
    const isNewCostTransaction = isNew && columnName === "costTransactions";

    const [dataToSendApi, setDataToSendApi]:any = useState({
        ...(user.isAdmin ? {} : { worker: user._id }),
        typeOfClient: !isNew ? defaultValue.typeOfClient : "",
        // A cost entry is always of type "cost"; taxes default to 0% until edited
        ...(isNewCostTransaction ? { typeOfTransaction: "cost", taxes: 0 } : {}),
    })

    const [err, setErr]:any = useState({})

    // Amounts shown in the cost/taxes fields: the record's own values when editing,
    // replaced by the service's defaults when the user picks a revenue service.
    const [amountDefaults, setAmountDefaults] = useState<{ cost: number, taxes: number }>({
        cost: Number(defaultValue?.cost ?? 0) || 0,
        taxes: Number(defaultValue?.taxes ?? 0) || 0,
    })

    const transactionTemplate = {
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
    }

    // Cost entries use the same fields, minus the revenue/cost selector
    const costTransactionTemplate = Object.fromEntries(
        Object.entries(transactionTemplate).filter(([key]) => key !== "typeOfTransaction")
    )

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
        transaction: transactionTemplate,
        costTransactions: costTransactionTemplate,
        users: {
            email: "email",
            // Only asked when creating a user. Editing a user never touches the password
            // (users change their own in Settings).
            ...(isNew ? { password: "password" } : {}),
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

        // When a revenue service is picked, its price and tax become the amounts
        // (cost categories have no default price, so the typed amounts are kept).
        const selectedService = fieldName === "service"
            ? (data.service || []).find((s: any) => s._id === value)
            : undefined;

        if (selectedService) {
            setAmountDefaults({ cost: Number(selectedService.cost) || 0, taxes: Number(selectedService.tax) || 0 });
        }

        setDataToSendApi((prev: any) => {
            const updatedData = { ...prev };

            // Convert admin status immediately when changed
            if (fieldName === "isAdmin") {
                updatedData[fieldName] = value === "ADMINISTRATOR";
            } else {
                updatedData[fieldName] = value;
            }

            if (selectedService) {
                updatedData.cost = Number(selectedService.cost) || 0;
                updatedData.taxes = Number(selectedService.tax) || 0;
            } else if (fieldName === "service" && updatedData.taxes === undefined && isNew) {
                updatedData.taxes = 0;
            }

            return updatedData;
        })
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
                case "password":
                    if (typeof value !== "string" || value.length < 8) {
                        tmpErr[key] = "The password must have at least 8 characters";
                    }
                    break;
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
        const colNameDb: string = API_ENDPOINTS[columnName] ?? columnName

        const fetchData = async () => {
            try {
                const response = await apiFetch(`${colNameDb}/${defaultValue._id}`, { method: 'DELETE' });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: response.statusText }));
                    console.error('Server error:', errorData);
                    throw new Error(errorData.message || 'Network response was not ok');
                }
                closePopupFunc({ deletedIds: [defaultValue._id] })
            } catch (error: any) {
                console.error('Error:', error);
                alert(`Failed to delete: ${error.message || 'Unknown error'}`);
            }
        }
        await fetchData()
    }

    async function saveChange() {
        const isModifyOrNew = defaultValue === null ? "" : "/" + defaultValue._id;
        const colNameDb: string = API_ENDPOINTS[columnName] ?? columnName

        if (colNameDb == "users") {
            // Never send a password when editing a user. (This used to force
            // password = "password", resetting the user's password on every save.)
            if (!isNew) {
                delete dataToSendApi["password"];
            }

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
                // Field not in dataToSendApi - preserve existing value or default to false.
                // (The table passes isAdmin as the string "ADMINISTRATOR", so `=== true`
                // used to demote every admin whose row was edited.)
                dataToSendApi["isAdmin"] = !isNew && isAdminValue(defaultValue.isAdmin);
            }
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
            const response = await apiFetch(`${colNameDb}${isModifyOrNew}`, {
                method: isModifyOrNew === "" ? "POST" : "PATCH",
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

            // Hand the saved record back so the app can update it in memory.
            // If the response shape is unexpected, closing with {} makes the caller re-fetch the collection.
            const savedDoc = extractSavedDoc(await response.json().catch(() => null))
            closePopupFunc(savedDoc ? { upserted: [savedDoc] } : {})
        } catch (error: any) {
            console.error('Error:', error);
            alert(`Failed to save: ${error.message || 'Unknown error'}`);
        }
    }

    // Previously a useEffect copied the service's price into cost/taxes on mount, which
    // silently reset an edited transaction's real amount to the service default on save.
    // That now happens only when the user actually picks a service (see addOrModifyValueInBodyApi).
    const amountWithoutTaxes = amountDefaults.cost / (1 + (amountDefaults.taxes / 100))

    const [isCosts, setIsCosts] = useState(
        isNew ? (columnName === "costTransactions" ? "cost" : "revenue") : defaultValue.typeOfTransaction
    )
    
    return (
        <>
            <Modal.Body>
                <form>
                    {Object.entries(formTemplate[columnName] ?? {}).map(([key, value]: any, index: number) => (
                        <React.Fragment key={index}>
                            {(value === "string" || value === "phoneNumber" || value === "email" || value === "number" || value == "zipcode" || value == "percentage") && (
                                <InputString name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""} />
                            )}
                            {value === "password" && (
                                <InputString type="password" name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue="" errorValue={err[key] ?? ""} />
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
                                <InputList name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} listOfValues={["ADMINISTRATOR", "REGULAR USER"]} defaultValue={defaultValue === null ? "" : (isAdminValue(defaultValue[key]) ? "ADMINISTRATOR" : "REGULAR USER")} errorValue={err[key] ?? ""}/>
                            )}
                            {value == "isSupplier" && (
                                <InputIsSupplier name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={defaultValue === null ? "" : defaultValue[key]} errorValue={err[key] ?? ""}/>
                            )}
                            {value == "costFromService" && (
                                <InputFromService isCosts={isCosts} name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={amountDefaults.cost.toFixed(2)} errorValue={err[key] ?? ""}/>
                            )}
                            {value == "costWithoutFromService" && (
                                 <InputFromService isCosts={isCosts} name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={amountWithoutTaxes.toFixed(2)} errorValue={err[key] ?? ""}/>
                            )}
                            {value == "taxFromService" && (
                                <InputFromService isCosts={isCosts} name={key} addOrModifyValueInBodyApi={addOrModifyValueInBodyApi} defaultValue={String(amountDefaults.taxes)} errorValue={err[key] ?? ""}/>
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