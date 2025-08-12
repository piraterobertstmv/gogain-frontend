import {TableHead} from "./TableHead"
import {TableRow} from "./TableRow"
import './Table.css';
import React from 'react';

export function Table({ column, data, resetDataFunc, user, filters, columnFilters, deleteFunction, toggleAllLines, deleteLines }: { column: string, data: any, resetDataFunc: any, user: any, filters: any, columnFilters: any, deleteFunction: any, toggleAllLines: any, deleteLines: any }) {
    const foundClient: string[] = []
    const foundCenter: string[] = []
    const foundWorker: string[] = []
    const foundService: string[] = []
    const [rows, setRows] = React.useState<any[]>([])

    const deleteColumns: string[] = [
        "_id",
        "__v",
        "index",
        "secondaryPhoneNumber",
        "originalDateFormat",
        "originalClientName",
        "originalCenterName",
        "originalServiceName", 
        "originalWorkerName"
    ].concat(columnFilters)
    
    // Remove the old rows variable since we're using state now
    // const rows = data[column] ?? [];

    // Create comprehensive entity mappings for display
    const entityMappings = {
        clients: {} as Record<string, string>,
        centers: {} as Record<string, string>,
        services: {} as Record<string, string>,
        workers: {} as Record<string, string>
    };
    
    // Map clients
    if (data.client && Array.isArray(data.client)) {
        data.client.forEach((client: any) => {
            const name = client.firstName && client.lastName 
                ? `${client.firstName} ${client.lastName}`
                : (client.name || 'Unknown');
            entityMappings.clients[client._id] = name;
        });
    }
    
    // Map centers
    if (data.center && Array.isArray(data.center)) {
        data.center.forEach((center: any) => {
            entityMappings.centers[center._id] = center.name || 'Unknown Center';
        });
    }
    
    // Map services
    if (data.service && Array.isArray(data.service)) {
        data.service.forEach((service: any) => {
            entityMappings.services[service._id] = service.name || 'Unknown Service';
        });
    }

    // Map workers (users)
    if (data.users && Array.isArray(data.users)) {
        data.users.forEach((worker: any) => {
            const name = worker.firstName && worker.lastName 
                ? `${worker.firstName} ${worker.lastName}`
                : (worker.name || 'Unknown User');
            entityMappings.workers[worker._id] = name;
        });
    }

    React.useEffect(() => {
        if (data[column]) {
            let tmp: any = []

            // For transactions, show all by default unless filters are specifically applied
            if (column == "transaction") {
                // Only apply filters if they are actually selected
                const hasActiveFilters = filters.center.length > 0 || filters.client.length > 0 || 
                                       filters.worker.length > 0 || filters.service.length > 0;
                
                if (!hasActiveFilters) {
                    // No filters active, show all transactions
                    tmp = [...data[column]];
                } else {
                    // Apply filters only to transactions that have the required fields
                    tmp = data[column].filter((line: any) => {
                        const centerMatch = filters.center.length === 0 || 
                                          (line.center && filters.center.includes(line.center));
                        const clientMatch = filters.client.length === 0 || 
                                         (line.client && filters.client.includes(line.client));
                        const workerMatch = filters.worker.length === 0 || 
                                         (line.worker && filters.worker.includes(line.worker));
                        const serviceMatch = filters.service.length === 0 || 
                                          (line.service && filters.service.includes(line.service));
                        
                        return centerMatch && clientMatch && workerMatch && serviceMatch;
                    });
                }
                
                // Populate filter options
                data[column].forEach((line: any) => {
                    if (line.client && !foundClient.includes(line.client)) {
                        foundClient.push(line.client);
                    }
                    if (line.center && !foundCenter.includes(line.center)) {
                        foundCenter.push(line.center);
                    }
                    if (line.worker && !foundWorker.includes(line.worker)) {
                        foundWorker.push(line.worker);
                    }
                    if (line.service && !foundService.includes(line.service)) {
                        foundService.push(line.service);
                    }
                });
            } else {
                // For non-transaction tables, use original logic
                for (let i = 0; i < data[column].length; i++) {
                    let line = data[column][i];
                    if ((filters.center.length == 0 || filters.center.includes(line.center)) &&
                        (filters.client.length == 0 || filters.client.includes(line.client)) &&
                        (filters.worker.length == 0 || filters.worker.includes(line.worker)) &&
                        (filters.service.length == 0 || filters.service.includes(line.service))) {
                        tmp.push(line);
                    }
                }
            }

            // Apply column-specific filters if any
            if (column === "transaction" && columnFilters && columnFilters.length > 0) {
                tmp = tmp.filter((transaction: any) => {
                    for (const filter of columnFilters) {
                        const { column, value, operator } = filter;
                        
                        if (!(column in transaction)) continue;
                        
                        const transactionValue = transaction[column];
                        
                        switch (operator) {
                            case 'equals':
                                if (transactionValue !== value) return false;
                                break;
                            case 'notEquals':
                                if (transactionValue === value) return false;
                                break;
                            case 'contains':
                                if (!String(transactionValue).includes(value)) return false;
                                break;
                            case 'notContains':
                                if (String(transactionValue).includes(value)) return false;
                                break;
                            case 'startsWith':
                                if (!String(transactionValue).startsWith(value)) return false;
                                break;
                            case 'endsWith':
                                if (!String(transactionValue).endsWith(value)) return false;
                                break;
                            default:
                                break;
                        }
                    }
                    return true;
                });
            }
            
            // Update the rows state to display the filtered data
            setRows(tmp);
        }
    }, [data, column, filters, columnFilters])

    // Add debug effect
    React.useEffect(() => {
        if (column === "transaction" && data[column]?.length > 0) {
            console.log(
                "Table component - transaction object keys:", 
                Object.keys(data[column][0]),
                "deleteColumns:", 
                deleteColumns
            );
        }
    }, [column, data, deleteColumns]);

    // Add debug output for first transaction
    if (column === "transaction" && data[column]?.length > 0) {
        console.log("First transaction:", data[column][0]);
    }
    
    // Find any additional index-like fields that need to be excluded
    if (column === "transaction" && data[column]?.length > 0) {
        const firstTransaction = data[column][0];
        Object.keys(firstTransaction).forEach(key => {
            if (key.toLowerCase().includes('index') && !deleteColumns.includes(key)) {
                deleteColumns.push(key);
            }
        });
    }

    // Debug: count how many rows pass the filter
    let visibleRows = 0;
    rows.forEach((row: any) => {
        // The original isRowFiltered function is removed, so we'll just check if the row is included in the filtered data
        // This might need adjustment based on the new filtering logic if it's different.
        // For now, we'll assume if the row is in the 'rows' state, it's visible.
        // If the filtering logic changed, this count might not be accurate.
        visibleRows++;
    });
    console.log(`Table: ${visibleRows} out of ${rows.length} rows will be visible for ${column}`);

    return (
        <table style={{ borderCollapse: "collapse", borderSpacing: "0px" }} className="table">
            <TableHead column={column} objKeys={Object.keys(data[column]?.[0] || {})} deleteColumns={deleteColumns} toggleAllLines={toggleAllLines}/>
            <tbody style={{borderCollapse: "collapse", borderSpacing: "0px"}}>
                {rows.map((dataRow: any, index: number) => 
                    // The original isRowFiltered function is removed, so we'll just check if the row is included in the filtered data
                    // This might need adjustment based on the new filtering logic if it's different.
                    // For now, we'll assume if the row is in the 'rows' state, it's visible.
                    // If the filtering logic changed, this count might not be accurate.
                    <TableRow 
                            column={column} 
                            key={index} 
                            dataRow={dataRow} 
                            data={{...data, entityMappings}} 
                            indexIn={index + 1} 
                            deleteColumns={deleteColumns} 
                            resetDataFunc={resetDataFunc} 
                            user={user} 
                            deleteFunction={deleteFunction} 
                            deleteLines={deleteLines}
                        />
                )}
            </tbody>
        </table>
    )
}