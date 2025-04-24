import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import './Table.css';
import { DatabaseForm } from "../popup/DatabaseForm";
import React from 'react';

function formatNumber(value: number): string {
    if (value % 1 !== 0) {
        return value.toFixed(2)
    }
    return value.toString()
}

export function TableRow({ column, data, dataRow, indexIn, deleteColumns, resetDataFunc, user, deleteFunction, deleteLines }: { column: string, data: any, dataRow: any , indexIn: number, deleteColumns: string[], resetDataFunc: any, user: any, deleteFunction: any, deleteLines: any }) {
    const [show, setShow] = useState(false);

    const handleClose = () => {
        setShow(false)
        resetDataFunc()
    }
    const handleShow = () => setShow(true);

    const findCorrectValue = (key: string, value: any) => {
        function findWithId(dataFiltered: any, id: string) {
            if (dataFiltered == undefined)
                return ""
            return dataFiltered.find((element: any) => element._id === id) || "";
        }

        if (value === "" || value == undefined)
            return ""

        if (key == "center") {
            // If we have stored the original center name, use it
            if (dataRow.originalCenterName) {
                return dataRow.originalCenterName;
            }
            
            // Check if we have this center in our entity mappings
            if (data.entityMappings && data.entityMappings.centers && data.entityMappings.centers[value]) {
                return data.entityMappings.centers[value];
            }
            
            if (data.center == undefined)
                return ""
            const centerData = findWithId(data.center, value);
            return centerData && centerData.name ? centerData.name : value;
        }

        if (key == "client") {
            // If we have stored the original client name, use it
            if (dataRow.originalClientName) {
                return dataRow.originalClientName;
            }
            
            if (dataRow.typeOfClient == "supplier")
                return dataRow.client;
            
            // Check if we have this client in our entity mappings
            if (data.entityMappings && data.entityMappings.clients && data.entityMappings.clients[value]) {
                return data.entityMappings.clients[value];
            }
            
            if (data.client == undefined)
                return value; // Return the value/ID as last resort
                
            const clientData = findWithId(data.client, value);
            if (!clientData || !clientData.firstName) {
                return value; // Return the ID if no name found
            }
            return (clientData.firstName ?? "") + " " + (clientData.lastName ?? "");
        }

        if (key == "worker") {
            // If we have stored the original worker name, use it
            if (dataRow.originalWorkerName) {
                return dataRow.originalWorkerName;
            }
            
            // Check if we have this worker in our entity mappings
            if (data.entityMappings && data.entityMappings.workers && data.entityMappings.workers[value]) {
                return data.entityMappings.workers[value];
            }
            
            // Check if it's the current user
            if (value === user._id) {
                return `${user.firstName} ${user.lastName}`;
            }
            
            if (data.users == undefined)
                return value;
                
            const userData = findWithId(data.users, value);
            if (!userData || !userData.firstName) {
                return value; // Return the ID if no name found
            }
            return (userData.firstName ?? "") + " " + (userData.lastName ?? "");
        }

        if (key == "service") {
            // If we have stored the original service name, use it
            if (dataRow.originalServiceName) {
                return dataRow.originalServiceName;
            }
            
            // Check if we have this service in our entity mappings
            if (data.entityMappings && data.entityMappings.services && data.entityMappings.services[value]) {
                return data.entityMappings.services[value];
            }
            
            if (data.service == undefined)
                return value;
                
            let serviceData = findWithId(data.service, value);
            if (serviceData === "") {
                serviceData = findWithId(data.costs, value);
            }
            return (serviceData && serviceData.name) ? serviceData.name : value;
        }

        if (key == "centers") {
            let res: string = ""
            if (value.length == 0 || value[0] == '')
                return ""
            for (let i = 0; i < value.length; i++) {
                const centerInfo: any = findWithId(data.center, value[i])
                if (centerInfo === "")
                    return ""
                res += ", " + findWithId(data.center, value[i]).name
            }
            return res.substring(2)
        }

        if (key == "services") {
            let res: string = ""
            if (value.length == 0 || value[0] == '')
                return "" 
            
            for (let i = 0; i < value.length; i++) {
                const serviceInfo: any = findWithId(data.service, value[i])
                if (serviceInfo === "")
                    return ""
                res += ", " + findWithId(data.service, value[i]).name
            }
            return res.substring(2)
        }

        if (key == "date" || key == "birthdate") {
            // First check if we have the original date format from import
            if (dataRow.originalDateFormat) {
                return dataRow.originalDateFormat;
            }
            
            // If no value or not a string, return empty
            if (!value || typeof value !== 'string') return "";
            
            // For dates in YYYY-MM-DD format (ISO), convert to DD/MM/YYYY for display
            if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
                return value.slice(8, 10) + "/" + value.slice(5, 7) + "/" + value.slice(0, 4);
            }
            
            // For dates in other formats, return as is
            return value;
        }

        if (key == "isAdmin") {
            return value == true ? "ADMINISTRATOR" : "REGULAR USER"
        }
    
        if (key == "lastName") {
            return value.toUpperCase()
        }

        if (key == "taxes" || key == "tax" || key == "percentage") {
            return value + "%"
        }

        if (key == "cost") {
            return value + '€'
        }

        return value
    }

    function findCorrectDefaultValue() {
        const res = { ...dataRow }

        if ('isAdmin' in res) {
            if (res['isAdmin'])
                res['isAdmin'] = 'ADMINISTRATOR'
            else
                res['isAdmin'] = 'REGULAR USER'
        }

        return res
    }

    const backgroundColors: string[] = ["#fff", "#eee"]

    // For transaction tables, use the defined column order
    if (column === "transaction") {
        // Define a list of fields that should be excluded from display
        const excludedFields = [
            ...deleteColumns,
            "index" // Exclude the redundant index field that shows all "1"s
        ];
        
        const orderedColumns = [
            "date", 
            "center", 
            "client", 
            "cost", // amount with taxes
            // amount without taxes is added dynamically after cost
            "worker", 
            "taxes", 
            "typeOfTransaction", 
            "typeOfMovement", 
            "frequency", 
            "typeOfClient", 
            "service"
        ];

        return (
            <>
                {(user.isAdmin || user._id == dataRow.worker) && (
                    <tr onClick={handleShow}>
                        <td style={{ backgroundColor: backgroundColors[indexIn % 2], verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                            <input
                                type="checkbox"
                                checked={deleteLines.includes(dataRow._id)}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    console.log('Checkbox toggled for transaction:', dataRow._id);
                                    deleteFunction(dataRow._id);
                                }}
                                style={{ cursor: "pointer", width: "1vw" }}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Select transaction ${indexIn}`}
                            />
                        </td>
                        <td style={{ backgroundColor: backgroundColors[indexIn % 2], verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }} scope="row">{indexIn.toString()}</td>
                        
                        {orderedColumns.map((key, index) => {
                            if (excludedFields.includes(key)) return null;
                            
                            const value = dataRow[key];
                            
                            return (
                                <React.Fragment key={`cell-${index}`}>
                                    <td scope="col" style={{ backgroundColor: backgroundColors[indexIn % 2], cursor: "pointer", verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                                        {findCorrectValue(key, value)}
                                    </td>

                                    {key === "cost" && !deleteColumns.includes("amountWithTaxes") && (
                                        <td style={{ backgroundColor: backgroundColors[indexIn % 2], cursor: "pointer", verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                                            {formatNumber(dataRow.cost / (1 + ((dataRow.taxes) / 100))) + '€'}
                                        </td>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tr>
                )}

                <Modal show={show} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add {column}</Modal.Title>
                    </Modal.Header>
                    <DatabaseForm columnName={column} data={data} defaultValue={findCorrectDefaultValue()} closePopupFunc={handleClose} user={user}/>
                </Modal>
            </>
        );
    }

    // For non-transaction tables, use the original logic
    return (
    <>
        {(column != "transaction" || (user.isAdmin || user._id == dataRow.worker)) && (
            <tr onClick={handleShow}>
                {column == "transaction" && (
                    <td style={{ backgroundColor: backgroundColors[indexIn % 2], verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                        <input
                            type="checkbox"
                            checked={deleteLines.includes(dataRow._id)}
                            onChange={(e) => {
                                e.stopPropagation();
                                console.log('Checkbox toggled for transaction:', dataRow._id);
                                deleteFunction(dataRow._id);
                            }}
                            style={{ cursor: "pointer", width: "1vw" }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select transaction ${indexIn}`}
                        />
                    </td>
                )}
                <td style={{ backgroundColor: backgroundColors[indexIn % 2], verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }} scope="row">{indexIn.toString()}</td>
                
                {Object.entries(dataRow ?? {}).map(([key, value]: any, index: number) => {
                    if (!deleteColumns.includes(key) && index !== 0) {
                        return (
                            <React.Fragment key={`header-${index}`}>
                                <td scope="col" style={{ backgroundColor: backgroundColors[indexIn % 2], cursor: "pointer", verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                                    {findCorrectValue(key, value)}
                                </td>

                                {column === "transaction" && key === "cost" && !deleteColumns.includes("amountWithTaxes") && (
                                    <td style={{ backgroundColor: backgroundColors[indexIn % 2], cursor: "pointer", verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }} key={`amount-with-taxes-${index}`}>
                                        {formatNumber(dataRow.cost / (1 + ((dataRow.taxes) / 100))) + '€'}
                                    </td>
                                )}
                            </React.Fragment>
                        )
                    }
                    return null
                })}
            </tr>
        )}

        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add {column}</Modal.Title>
            </Modal.Header>
            <DatabaseForm columnName={column} data={data} defaultValue={findCorrectDefaultValue()} closePopupFunc={handleClose} user={user}/>
        </Modal>
    </>
    )
}