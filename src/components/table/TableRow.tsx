import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import './Table.css';
import { DatabaseForm } from "../popup/DatabaseForm";
import React from 'react';
import { netAmount } from '../../tools/finance';
import { isTransactionTable, NET_AMOUNT_COLUMN } from './columns';

function formatNumber(value: number): string {
    // Always show 2 decimal places with European comma format
    return value.toFixed(2).replace('.', ',')
}

// Memoized: a row only re-renders when its own data, selection or the lookup tables change.
export const TableRow = React.memo(TableRowInner);

// `columns` is the same ordered list TableHead renders (see columns.ts), so cells always line up.
function TableRowInner({ column, columns, data, dataRow, indexIn, resetDataFunc, user, deleteFunction, isSelected }: { column: string, columns: string[], data: any, dataRow: any , indexIn: number, resetDataFunc: any, user: any, deleteFunction: any, isSelected: boolean }) {
    const [show, setShow] = useState(false);

    // `change` is only provided after a successful save/delete; plain closing does nothing else.
    const handleClose = (change?: any) => {
        setShow(false)
        if (change) resetDataFunc(change)
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
            
            // Check if we have this client in our entity mappings. This also covers older
            // supplier rows, which the backend used to save as a Client id instead of text.
            if (data.entityMappings && data.entityMappings.clients && data.entityMappings.clients[value]) {
                return data.entityMappings.clients[value];
            }

            if (dataRow.typeOfClient == "supplier")
                return dataRow.client;
            
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

        if (key == "typeOfMovement") {
            // Map movement types to proper GoGain values for display
            const movementMappings: Record<string, string> = {
                'cash': 'cash',
                'bank transfer': 'bank transfer',
                'transfer': 'bank transfer',
                'bank_transfer': 'bank transfer',
                'wire': 'bank transfer',
                'wire transfer': 'bank transfer',
                'card': 'card',
                'card payment': 'card',
                'credit card': 'card',
                'debit card': 'card',
                'bank check': 'bank check',
                'check': 'bank check',
                'cheque': 'bank check',
                'direct_debit': 'bank transfer',
                'direct debit': 'bank transfer',
                'electronic': 'bank transfer',
                'other': 'card'
            };
            
            const movementLower = (value || '').toString().toLowerCase().trim();
            
            // Try exact match first
            if (movementMappings[movementLower]) {
                return movementMappings[movementLower];
            }
            
            // Try partial matches
            for (const [key, mappedValue] of Object.entries(movementMappings)) {
                if (movementLower.includes(key)) {
                    return mappedValue;
                }
            }
            
            // Return original value if no mapping found
            return value || 'card';
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
            return formatNumber(value) + '€'
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

    const background = indexIn % 2 === 0 ? "#fff" : "#eee"
    const cellStyle = { backgroundColor: background, cursor: "pointer", verticalAlign: "middle", borderStyle: "solid", borderWidth: "0.5px" } as const

    function renderCell(key: string) {
        if (key === NET_AMOUNT_COLUMN) {
            return formatNumber(netAmount(dataRow)) + '€'
        }
        const cellValue = findCorrectValue(key, dataRow[key])
        if (typeof cellValue === 'object' && cellValue !== null) {
            return Array.isArray(cellValue) ? cellValue.join(", ") : ""
        }
        return cellValue || ""
    }

    const showCheckbox = isTransactionTable(column)

    return (
        <>
            <tr onClick={handleShow} style={column === "users" ? { cursor: canEdit ? "pointer" : "default", opacity: canEdit ? 1 : 0.7 } : undefined}>
                {showCheckbox && (
                    <td style={cellStyle}>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                                e.stopPropagation();
                                deleteFunction(dataRow._id);
                            }}
                            style={{ cursor: "pointer", width: "1vw" }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select row ${indexIn}`}
                        />
                    </td>
                )}

                {/* Row number */}
                <td style={cellStyle} scope="row">{indexIn}</td>

                {columns.map((key) => (
                    <td key={key} style={cellStyle}>{renderCell(key)}</td>
                ))}
            </tr>

            <Modal show={show} onHide={() => handleClose()}>
                <Modal.Header closeButton>
                    <Modal.Title>{column === "costTransactions" ? "Edit cost" : `Edit ${column}`}</Modal.Title>
                </Modal.Header>
                <DatabaseForm columnName={column} data={data} defaultValue={findCorrectDefaultValue()} closePopupFunc={handleClose} user={user}/>
            </Modal>
        </>
    )
}
