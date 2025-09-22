import './Table.css';
import { formatString } from '../../tools/tools';
import React, { useEffect, useRef } from 'react';

export function TableHead({ column, objKeys, deleteColumns, toggleAllLines }: { column: string, objKeys: any, deleteColumns: string[], toggleAllLines: any }) {
    const headerRowRef = useRef<HTMLTableRowElement>(null);
    
    // A post-render effect to clean up duplicate Index columns
    useEffect(() => {
        if (headerRowRef.current && column === "transaction") {
            // Get all th elements with text content "Index"
            const thElements = headerRowRef.current.querySelectorAll('th');
            let indexHeaders = Array.from(thElements).filter(th => 
                th.textContent && th.textContent.trim() === 'Index'
            );
            
            // If we found more than one Index header, remove all after the first
            if (indexHeaders.length > 1) {
                console.log(`Found ${indexHeaders.length} Index headers, removing extras`);
                for (let i = 1; i < indexHeaders.length; i++) {
                    indexHeaders[i].style.display = 'none';
                }
            }
        }
    }, [column, objKeys]);

    if (column === "transaction") {
        // IMPORTANT: We're making this component simpler - we'll clean up the DOM after render
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

        // Add 'index' to deleteColumns if it's not already there
        const updatedDeleteColumns = [...deleteColumns];
        if (!updatedDeleteColumns.includes('index')) {
            updatedDeleteColumns.push('index');
        }

        return (
            <thead>
                <tr ref={headerRowRef}>
                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                        <input
                            type="checkbox"
                            onChange={() => toggleAllLines()}
                            style={{ cursor: "pointer", width: "1vw" }}
                        />
                    </th>
                    
                    {/* Index column (only one) */}
                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>Index</th>
                    
                    {orderedColumns.map((colKey, index) => {
                        // Skip the database index field and any explicitly excluded columns
                        if (updatedDeleteColumns.includes(colKey)) {
                            return null;
                        }

                        return (
                            <React.Fragment key={`header-${index}`}>
                                <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                                    {colKey === "cost" ? "Amount with taxes" : formatString(colKey)}
                                </th>

                                {colKey === "cost" && !updatedDeleteColumns.includes("amountWithTaxes") && (
                                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                                        Amount without taxes
                                    </th>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tr>
            </thead>
        );
    }

    if (column === "costs") {
        // Costs table - identical to transactions but shows cost categories instead of services
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
            "typeOfClient"
        ];

        // Add 'index' to deleteColumns if it's not already there
        const updatedDeleteColumns = [...deleteColumns];
        if (!updatedDeleteColumns.includes('index')) {
            updatedDeleteColumns.push('index');
        }

        return (
            <thead>
                <tr ref={headerRowRef}>
                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                        <input
                            type="checkbox"
                            onChange={() => toggleAllLines()}
                            style={{ cursor: "pointer", width: "1vw" }}
                        />
                    </th>
                    
                    {/* Index column (only one) */}
                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>Index</th>
                    
                    {orderedColumns.map((colKey, index) => {
                        // Skip the database index field and any explicitly excluded columns
                        if (updatedDeleteColumns.includes(colKey)) {
                            return null;
                        }

                        return (
                            <React.Fragment key={`header-${index}`}>
                                <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                                    {colKey === "cost" ? "Amount with taxes" : formatString(colKey)}
                                </th>

                                {colKey === "cost" && !updatedDeleteColumns.includes("amountWithTaxes") && (
                                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                                        Amount without taxes
                                    </th>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tr>
            </thead>
        );
    }

    if (column === "users") {
        // Custom column order for users table to match the design
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
            <thead>
                <tr ref={headerRowRef}>
                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>Index</th>
                    
                    {orderedColumns.map((colKey, index) => {
                        // Skip any explicitly excluded columns
                        if (deleteColumns.includes(colKey)) {
                            return null;
                        }

                        return (
                            <th scope="col" key={`header-${index}`} style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                                {colKey === "isAdmin" ? "Is admin" : 
                                 colKey === "centers" ? "Centers" :
                                 colKey === "services" ? "Services" :
                                 colKey === "lastName" ? "Last name" :
                                 colKey === "firstName" ? "First name" :
                                 colKey === "percentage" ? "Percentage" :
                                 colKey === "email" ? "Email" :
                                 formatString(colKey)}
                            </th>
                        );
                    })}
                </tr>
            </thead>
        );
    }

    // For non-transaction tables, use the original logic but add ref for cleanup
    return (
        <thead>
            <tr ref={headerRowRef}>
                {column == "transaction" && (
                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                        <input
                            type="checkbox"
                            onChange={() => toggleAllLines()}
                            style={{ cursor: "pointer", width: "1vw" }}
                        />
                    </th>
                )}

                <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>Index</th>
                {objKeys.map((objKey: string, index: number) => {
                    if (!deleteColumns.includes(objKey)) {
                        return (
                            <React.Fragment key={`header-${index}`}>
                                <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                                    {objKey === "cost" ? formatString("Amount with taxes") : formatString(objKey)}
                                </th>

                                {column === "transaction" && objKey === "cost" && !deleteColumns.includes("amountWithTaxes") && (
                                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }} key={`amount-with-taxes-${index}`}>
                                        Amount without taxes
                                    </th>
                                )}
                            </React.Fragment>
                        )
                    }
                    return null
                })}
            </tr>
        </thead>
    );
}
