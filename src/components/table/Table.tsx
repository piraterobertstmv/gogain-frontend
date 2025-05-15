import {TableHead} from "./TableHead"
import {TableRow} from "./TableRow"
import './Table.css';
import React from 'react';

export function Table({ column, data, resetDataFunc, user, filters, columnFilters, deleteFunction, toggleAllLines, deleteLines }: { column: string, data: any, resetDataFunc: any, user: any, filters: any, columnFilters: any, deleteFunction: any, toggleAllLines: any, deleteLines: any }) {
    const foundClient: string[] = []
    const foundCenter: string[] = []
    const foundWorker: string[] = []
    const foundService: string[] = []

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
    
    const rows = data[column] ?? [];

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

    function isRowFiltered(dataRow: any) {
        if (filters.center.length > 0)
            if (!filters.center.includes(dataRow.center))
                return false

        if (filters.client.length > 0)
            if (!filters.client.includes(dataRow.client))
                return false

        if (filters.worker.length > 0)
            if (!filters.worker.includes(dataRow.worker))
                return false

        if (filters.service.length > 0)
            if (!filters.service.includes(dataRow.service))
                return false

        return true
    }

    React.useEffect(() => {
        if (data[column]) {
            let tmp: any = []

            let valid: string[] = []
            if (column == "transaction") {
                valid = filters.center.concat(filters.client).concat(filters.worker).concat(filters.service)
            }
            
            for (let i = 0; i < data[column].length; i++) {
                let line = data[column][i]
                if ((valid.length == 0 || column != "transaction") ||
                    ((filters.center.length == 0 || filters.center.includes(line.center)) &&
                        (filters.client.length == 0 || filters.client.includes(line.client)) &&
                        (filters.worker.length == 0 || filters.worker.includes(line.worker)) &&
                        (filters.service.length == 0 || filters.service.includes(line.service))))
                    tmp.push(line)
                
                if (column == "transaction") {
                    if (line.client != undefined && !foundClient.includes(line.client))
                        foundClient.push(line.client)
                    if (line.center != undefined && !foundCenter.includes(line.center))
                        foundCenter.push(line.center)
                    if (line.worker != undefined && !foundWorker.includes(line.worker))
                        foundWorker.push(line.worker)
                    if (line.service != undefined && !foundService.includes(line.service))
                        foundService.push(line.service)
                }
            }

            // Check if additional column-specific filters are active
            if (column === "transaction" && columnFilters && columnFilters.length > 0) {
                tmp = tmp.filter((transaction: any) => {
                    // Apply each column filter
                    for (const filter of columnFilters) {
                        const { column, value, operator } = filter;
                        
                        // Skip if the column doesn't exist on the transaction
                        if (!(column in transaction)) continue;
                        
                        const transactionValue = transaction[column];
                        
                        // Apply the appropriate comparison based on operator
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
                            // Add more operators as needed
                            default:
                                break;
                        }
                    }
                    
                    // If we reach here, all filters have passed
                    return true;
                });
            }
            
            // Skip updating the filteredData since it's not used
            // This variable was removed to fix TypeScript build errors (TS6133)
            // setFilteredData(tmp)
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

    return (
        <table style={{ borderCollapse: "collapse", borderSpacing: "0px" }} className="table">
            <TableHead column={column} objKeys={Object.keys(data[column]?.[0] || {})} deleteColumns={deleteColumns} toggleAllLines={toggleAllLines}/>
            <tbody style={{borderCollapse: "collapse", borderSpacing: "0px"}}>
                {rows.map((dataRow: any, index: number) => 
                    isRowFiltered(dataRow) ? (
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
                    ) : null
                )}
            </tbody>
        </table>
    )
}