import {TableHead} from "./TableHead"
import {TableRow} from "./TableRow"
import './Table.css';
import React from 'react';

export function Table({ column, data, resetDataFunc, user, filters, columnFilters, deleteFunction, toggleAllLines, deleteLines }: { column: string, data: any, resetDataFunc: any, user: any, filters: any, columnFilters: any, deleteFunction: any, toggleAllLines: any, deleteLines: any }) {
    const foundClient: string[] = []
    const foundCenter: string[] = []
    const foundWorker: string[] = []
    const foundService: string[] = []
    const [rows, setRows] = React.useState<any[]>(data[column] || [])

    // Initialize rows when data changes
    React.useEffect(() => {
        if (data[column]) {
            setRows(data[column]);
        }
    }, [data, column]);

    const deleteColumns: string[] = [
        "_id",
        "__v",
        "index",
        "secondaryPhoneNumber",
        "originalDateFormat",
        "originalClientName",
        "originalCenterName",
        "originalServiceName", 
        "originalWorkerName",
        "permissions",
        "role",
        "assignedCenters",
        "assignedServices"
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
            // For transactions, apply filters
            if (column === "transaction" || column === "costTransactions") {
                let filteredData = [...data[column]];
                
                // Apply filters if they exist
                if (filters) {
                    // Filter by center
                    if (filters.center && filters.center.length > 0) {
                        filteredData = filteredData.filter((line: any) => 
                            filters.center.includes(line.center)
                        );
                    }
                    
                    // Filter by client
                    if (filters.client && filters.client.length > 0) {
                        filteredData = filteredData.filter((line: any) => 
                            filters.client.includes(line.client)
                        );
                    }
                    
                    // Filter by worker
                    if (filters.worker && filters.worker.length > 0) {
                        filteredData = filteredData.filter((line: any) => 
                            filters.worker.includes(line.worker)
                        );
                    }
                    
                    // Filter by service
                    if (filters.service && filters.service.length > 0) {
                        filteredData = filteredData.filter((line: any) => 
                            filters.service.includes(line.service)
                        );
                    }
                }
                
                setRows(filteredData);
                
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
                // For non-transaction tables, just show all data without complex filtering
                setRows(data[column]);
            }
        }
    }, [data, column, filters])

    // Debug: count how many rows pass the filter
    let visibleRows = 0;
    rows.forEach(() => {
        visibleRows++;
    });

    // Helper function to get filter display names
    const getFilterDisplayNames = (filterIds: string[], mapping: Record<string, string>) => {
        return filterIds.map(id => mapping[id] || id).join(', ');
    };

    // Check if any filters are active
    const hasActiveFilters = filters && (
        (filters.center && filters.center.length > 0) ||
        (filters.client && filters.client.length > 0) ||
        (filters.worker && filters.worker.length > 0) ||
        (filters.service && filters.service.length > 0)
    );

    return (
        <>
            {/* Active Filters Display */}
            {(column === "transaction" || column === "costTransactions") && hasActiveFilters && (
                <div style={{ 
                    marginBottom: '10px', 
                    padding: '8px 12px', 
                    backgroundColor: '#f8f9fa', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    <strong>Active Filters:</strong>
                    {filters.center && filters.center.length > 0 && (
                        <span style={{ marginLeft: '15px' }}>
                            <strong>Center:</strong> {getFilterDisplayNames(filters.center, entityMappings.centers)}
                        </span>
                    )}
                    {filters.client && filters.client.length > 0 && (
                        <span style={{ marginLeft: '15px' }}>
                            <strong>Client:</strong> {getFilterDisplayNames(filters.client, entityMappings.clients)}
                        </span>
                    )}
                    {filters.worker && filters.worker.length > 0 && (
                        <span style={{ marginLeft: '15px' }}>
                            <strong>Worker:</strong> {getFilterDisplayNames(filters.worker, entityMappings.workers)}
                        </span>
                    )}
                    {filters.service && filters.service.length > 0 && (
                        <span style={{ marginLeft: '15px' }}>
                            <strong>Service:</strong> {getFilterDisplayNames(filters.service, entityMappings.services)}
                        </span>
                    )}
                    <span style={{ marginLeft: '15px', color: '#6c757d' }}>
                        Showing {rows.length} of {data[column]?.length || 0} {column === "costTransactions" ? "costs" : "transactions"}
                    </span>
                </div>
            )}
            
            <table style={{ borderCollapse: "collapse", borderSpacing: "0px" }} className="table">
                <TableHead key={`${column}-head`} column={column} objKeys={Object.keys(data[column]?.[0] || {})} deleteColumns={deleteColumns} toggleAllLines={toggleAllLines}/>
                <tbody style={{borderCollapse: "collapse", borderSpacing: "0px"}}>
                    {rows.map((dataRow: any, index: number) => {
                        return (
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
                        );
                    })}
                </tbody>
            </table>
        </>
    )
}