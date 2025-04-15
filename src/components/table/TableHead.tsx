import './Table.css';
import { formatString } from '../../tools/tools';
import React from 'react';

export function TableHead({ column, objKeys, deleteColumns, toggleAllLines }: { column: string, objKeys: any, deleteColumns: string[], toggleAllLines: any }) {
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
