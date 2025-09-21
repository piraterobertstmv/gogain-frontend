import { useState, useEffect, useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import './Table.css';
import { DatabaseForm } from "../popup/DatabaseForm";
import React from 'react';

function formatNumber(value: number): string {
    // Always show 2 decimal places with European comma format
    return value.toFixed(2).replace('.', ',')
}

export function TableRow({ column, data, dataRow, indexIn, deleteColumns, resetDataFunc, user, deleteFunction, deleteLines }: { column: string, data: any, dataRow: any , indexIn: number, deleteColumns: string[], resetDataFunc: any, user: any, deleteFunction: any, deleteLines: any }) {
    const [show, setShow] = useState(false);
    const rowRef = useRef<HTMLTableRowElement>(null);

    // Effect to hide duplicate Index cells
    useEffect(() => {
        if (rowRef.current && column === "transaction") {
            // We know the 2nd column is the intended index column (row number)
            const cells = rowRef.current.querySelectorAll('td');
            
            if (cells.length > 2) {
                // Check if cell at index 2 contains the value "1" (the problematic index column)
                // Note: cell at index 0 is checkbox, cell at index 1 is the row number
                let valueAtIndex2 = cells[2].textContent?.trim();
                
                // If we find a cell with content "1" at index 2, hide it - it's our duplicate index
                if (valueAtIndex2 === '1') {
                    cells[2].style.display = 'none';
                }
            }
        }
    }, [indexIn, column]);

    const handleClose = () => {
        setShow(false)
        resetDataFunc()
    }
    
    // Check if user can edit this type of data
    const isAdmin = user?.isAdmin === true;
    const canEdit = isAdmin || column !== "users";
    
    const handleShow = () => {
        if (canEdit) {
            setShow(true);
        }
    };

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

        // Ensure we always return a string or number, never an object
        if (typeof value === 'object' && value !== null) {
            // For arrays, join them with commas
            if (Array.isArray(value)) {
                return value.join(", ");
            }
            // For other objects, return empty string to avoid showing complex data
            return "";
        }

        return value || ""
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
        return (
            <>
                <tr onClick={handleShow} ref={rowRef}>
                    <td style={{ backgroundColor: backgroundColors[indexIn % 2], verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                        <input
                            type="checkbox"
                            checked={deleteLines.includes(dataRow._id)}
                            onChange={(e) => {
                                e.stopPropagation();
                                deleteFunction(dataRow._id);
                            }}
                            style={{ cursor: "pointer", width: "1vw" }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select transaction ${indexIn}`}
                        />
                    </td>
                    
                    {/* Index cell - this is the row number */}
                    <td style={{ backgroundColor: backgroundColors[indexIn % 2], verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }} scope="row">{indexIn.toString()}</td>
                    
                    {/* We need to include the problematic index cell so our DOM manipulation works */}
                    {dataRow.index && (
                        <td style={{ backgroundColor: backgroundColors[indexIn % 2], verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                            {dataRow.index}
                        </td>
                    )}
                    
                    {Object.entries(dataRow ?? {}).map(([key, value]: any, index: number) => {
                        if (!deleteColumns.includes(key) && index !== 0) {
                            return (
                                <React.Fragment key={`header-${index}`}>
                                    <td scope="col" style={{ backgroundColor: backgroundColors[indexIn % 2], cursor: "pointer", verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                                        {(() => {
                                            const cellValue = findCorrectValue(key, value);
                                            if (typeof cellValue === 'object' && cellValue !== null) {
                                                // For arrays, join them
                                                if (Array.isArray(cellValue)) {
                                                    return cellValue.join(", ");
                                                }
                                                // For other objects, return empty string
                                                return "";
                                            }
                                            return cellValue || "";
                                        })()}
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

                <Modal show={show} onHide={handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add {column}</Modal.Title>
                    </Modal.Header>
                    <DatabaseForm columnName={column} data={data} defaultValue={findCorrectDefaultValue()} closePopupFunc={handleClose} user={user}/>
                </Modal>
            </>
        );
    }

    // For users tables, use the specific column order to match the design
    if (column === "users") {
        const orderedColumns = [
            "email",
            "isAdmin", 
            "centers",
            "services",
            "lastName",
            "firstName",
            "percentage"
        ];

        return (
            <>
                <tr onClick={handleShow} ref={rowRef} style={{ cursor: canEdit ? "pointer" : "default", opacity: canEdit ? 1 : 0.7 }}>
                    {/* Index cell - this is the row number */}
                    <td style={{ backgroundColor: backgroundColors[indexIn % 2], verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }} scope="row">{indexIn.toString()}</td>
                    
                    {orderedColumns.map((key, index) => {
                        // Skip any explicitly excluded columns
                        if (deleteColumns.includes(key)) {
                            return null;
                        }

                        const value = dataRow[key];
                        return (
                            <td key={`user-${index}`} scope="col" style={{ backgroundColor: backgroundColors[indexIn % 2], cursor: "pointer", verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                                {(() => {
                                    console.log(`Processing users table - key: ${key}, value:`, value);
                                    const cellValue = findCorrectValue(key, value);
                                    console.log(`Processed value for ${key}:`, cellValue);
                                    if (typeof cellValue === 'object' && cellValue !== null) {
                                        // For arrays, join them
                                        if (Array.isArray(cellValue)) {
                                            return cellValue.join(", ");
                                        }
                                        // For other objects, return empty string
                                        return "";
                                    }
                                    return cellValue || "";
                                })()}
                            </td>
                        );
                    })}
                </tr>

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
        <tr onClick={handleShow} ref={rowRef}>
            <td style={{ backgroundColor: backgroundColors[indexIn % 2], verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }} scope="row">{indexIn.toString()}</td>
                
            {Object.entries(dataRow ?? {}).map(([key, value]: any, index: number) => {
                if (!deleteColumns.includes(key) && index !== 0) {
                    return (
                        <React.Fragment key={`header-${index}`}>
                            <td scope="col" style={{ backgroundColor: backgroundColors[indexIn % 2], cursor: "pointer", verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                                {(() => {
                                    const cellValue = findCorrectValue(key, value);
                                    if (typeof cellValue === 'object' && cellValue !== null) {
                                        // For arrays, join them
                                        if (Array.isArray(cellValue)) {
                                            return cellValue.join(", ");
                                        }
                                        // For other objects, return empty string
                                        return "";
                                    }
                                    return cellValue || "";
                                })()}
                            </td>
                        </React.Fragment>
                    )
                }
                return null
            })}
        </tr>

        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add {column}</Modal.Title>
            </Modal.Header>
            <DatabaseForm columnName={column} data={data} defaultValue={findCorrectDefaultValue()} closePopupFunc={handleClose} user={user}/>
        </Modal>
    </>
    )
}