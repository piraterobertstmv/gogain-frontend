import './Table.css';
import { formatString } from '../../tools/tools';
import React from 'react';

export function TableHead({ column, objKeys, deleteColumns, toggleAllLines }: { column: string, objKeys: any, deleteColumns: string[], toggleAllLines: any }) {
    if (column === "transaction") {
        // Define the correct column order for transactions
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
                <tr>
                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                        <input
                            type="checkbox"
                            onChange={() => toggleAllLines()}
                            style={{ cursor: "pointer", width: "1vw" }}
                        />
                    </th>
                    
                    {/* Keep only one index column - this is the row number */}
                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>Index</th>
                    
                    {orderedColumns.map((colKey, index) => {
                        // Skip the database index field which shows all "1"s
                        if (updatedDeleteColumns.includes(colKey) || colKey === 'index') {
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

    // For non-transaction tables, use the original logic
    return (
        <thead>
            <tr>
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
