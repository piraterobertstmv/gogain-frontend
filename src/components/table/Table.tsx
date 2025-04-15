import {TableHead} from "./TableHead"
import {TableRow} from "./TableRow"
import './Table.css';


export function Table({ column, data, resetDataFunc, user, filters, columnFilters, deleteFunction, toggleAllLines, deleteLines }: { column: string, data: any, resetDataFunc: any, user: any, filters: any, columnFilters: any, deleteFunction: any, toggleAllLines: any, deleteLines: any }) {
    const deleteColumns: string[] = [
        "_id",
        "__v",
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