import './Table.css';
import { formatString } from '../../tools/tools';
import React from 'react';

export function TableHead({ column, objKeys, deleteColumns, toggleAllLines }: { column: string, objKeys: any, deleteColumns: string[], toggleAllLines: any }) {
    if (column === "transaction") {
        // IMPORTANT: We're removing the second Index column entirely
        const transactionFieldOrder = [
            "checkbox", // This is the checkbox column
            "rowIndex", // This is our manually added row index, not from the data
            "date", 
            "center", 
            "client", 
            "cost", // amount with taxes
            "amountWithoutTaxes", // amount without taxes is added manually
            "worker", 
            "taxes", 
            "typeOfTransaction", 
            "typeOfMovement", 
            "frequency", 
            "typeOfClient", 
            "service"
        ];

        return (
            <thead>
                <tr>
                    {/* Checkbox column */}
                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>
                        <input
                            type="checkbox"
                            onChange={() => toggleAllLines()}
                            style={{ cursor: "pointer", width: "1vw" }}
                        />
                    </th>
                    
                    {/* Index column (only one) */}
                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px 0.5px 0.5px 0.5px" }}>Index</th>
                    
                    {/* Date column */}
                    <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        {formatString("date")}
                    </th>
                    
                    {/* Center column */}
                    <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        {formatString("center")}
                    </th>
                    
                    {/* Client column */}
                    <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        {formatString("client")}
                    </th>
                    
                    {/* Amount with taxes column */}
                    <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        Amount with taxes
                    </th>
                    
                    {/* Amount without taxes column */}
                    <th style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        Amount without taxes
                    </th>
                    
                    {/* Worker column */}
                    <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        {formatString("worker")}
                    </th>
                    
                    {/* Taxes column */}
                    <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        {formatString("taxes")}
                    </th>
                    
                    {/* Type of transaction column */}
                    <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        {formatString("typeOfTransaction")}
                    </th>
                    
                    {/* Type of movement column */}
                    <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        {formatString("typeOfMovement")}
                    </th>
                    
                    {/* Frequency column */}
                    <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        {formatString("frequency")}
                    </th>
                    
                    {/* Type of client column */}
                    <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        {formatString("typeOfClient")}
                    </th>
                    
                    {/* Service column */}
                    <th scope="col" style={{ verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" }}>
                        {formatString("service")}
                    </th>
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
                    // For non-transaction tables, also filter out any index-like columns
                    if (!deleteColumns.includes(objKey) && objKey !== 'index' && !objKey.toLowerCase().includes('index')) {
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
