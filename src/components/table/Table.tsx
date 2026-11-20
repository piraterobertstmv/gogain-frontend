import {TableHead} from "./TableHead"
import {TableRow} from "./TableRow"
import { getVisibleColumns } from "./columns"
import './Table.css';
import React from 'react';

const PAGE_SIZE = 100;
// Shared empty array, so a missing filter doesn't create a new [] on every render
const NO_IDS: string[] = [];

const BASE_DELETE_COLUMNS: string[] = [
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
];

function fullName(entity: any, fallback: string) {
    return entity.firstName && entity.lastName
        ? `${entity.firstName} ${entity.lastName}`
        : (entity.name || fallback);
}

// Server paging: `data[column]` already holds just the current page, filtered on the server.
export interface ServerPaging {
    page: number;
    pageSize: number;
    total: number;
    loading: boolean;
    onPageChange: (page: number) => void;
}

export function Table({ column, data, resetDataFunc, user, filters, columnFilters, deleteFunction, toggleAllLines, deleteLines, serverPaging }: { column: string, data: any, resetDataFunc: any, user: any, filters: any, columnFilters: any, deleteFunction: any, toggleAllLines: any, deleteLines: any, serverPaging?: ServerPaging }) {
    const isTransactionTable = column === "transaction" || column === "costTransactions";
    const [page, setPage] = React.useState(0);

    const deleteColumns: string[] = React.useMemo(
        () => BASE_DELETE_COLUMNS.concat(columnFilters || []),
        [columnFilters]
    );

    // ID -> display name lookups, rebuilt only when the reference lists change
    // (previously rebuilt on every render, and every row was handed a brand-new object).
    const entityMappings = React.useMemo(() => {
        const mappings = {
            clients: {} as Record<string, string>,
            centers: {} as Record<string, string>,
            services: {} as Record<string, string>,
            workers: {} as Record<string, string>
        };
        (data.client || []).forEach((client: any) => { mappings.clients[client._id] = fullName(client, 'Unknown'); });
        (data.center || []).forEach((center: any) => { mappings.centers[center._id] = center.name || 'Unknown Center'; });
        (data.service || []).forEach((service: any) => { mappings.services[service._id] = service.name || 'Unknown Service'; });
        (data.users || []).forEach((worker: any) => { mappings.workers[worker._id] = fullName(worker, 'Unknown User'); });
        return mappings;
    }, [data.client, data.center, data.service, data.users]);

    const rowData = React.useMemo(() => ({ ...data, entityMappings }), [data, entityMappings]);

    // One ordered column list for both header and rows
    const visibleColumns = React.useMemo(
        () => getVisibleColumns(column, data[column] || [], deleteColumns),
        [column, data, deleteColumns]
    );

    const filterCenter: string[] = filters?.center || NO_IDS;
    const filterClient: string[] = filters?.client || NO_IDS;
    const filterWorker: string[] = filters?.worker || NO_IDS;
    const filterService: string[] = filters?.service || NO_IDS;

    // Filtered rows, computed during render (no effect + extra re-render)
    const rows: any[] = React.useMemo(() => {
        const all: any[] = data[column] || [];
        if (!isTransactionTable || serverPaging) return all;

        const matches = (selected: string[], value: string) => selected.length === 0 || selected.includes(value);
        return all.filter((line: any) =>
            matches(filterCenter, line.center) &&
            matches(filterClient, line.client) &&
            matches(filterWorker, line.worker) &&
            matches(filterService, line.service)
        );
    }, [data, column, isTransactionTable, serverPaging, filterCenter, filterClient, filterWorker, filterService]);

    // Back to the first page whenever the table or the filters change
    React.useEffect(() => { setPage(0); }, [column, filterCenter, filterClient, filterWorker, filterService]);

    const pageSize = serverPaging?.pageSize ?? PAGE_SIZE;
    const totalRows = serverPaging ? serverPaging.total : rows.length;
    const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
    const currentPage = Math.min(serverPaging ? serverPaging.page : page, pageCount - 1);
    const pageStart = currentPage * pageSize;
    const pageRows = serverPaging ? rows : rows.slice(pageStart, pageStart + pageSize);
    const goToPage = (target: number) => serverPaging ? serverPaging.onPageChange(target) : setPage(target);

    const selectedIds = React.useMemo(() => new Set<string>(deleteLines || []), [deleteLines]);

    // Helper function to get filter display names
    const getFilterDisplayNames = (filterIds: string[], mapping: Record<string, string>) => {
        return filterIds.map(id => mapping[id] || id).join(', ');
    };

    // Check if any filters are active
    const hasActiveFilters = filterCenter.length > 0 || filterClient.length > 0 || filterWorker.length > 0 || filterService.length > 0;

    const pagination = totalRows > pageSize && (
        <div className="d-flex align-items-center gap-2 my-2" style={{ fontSize: '14px' }}>
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 0} onClick={() => goToPage(0)}>«</button>
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 0} onClick={() => goToPage(currentPage - 1)}>‹ Previous</button>
            <span>
                Page {currentPage + 1} of {pageCount} · rows {pageStart + 1}–{Math.min(pageStart + pageSize, totalRows)} of {totalRows}
            </span>
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage >= pageCount - 1} onClick={() => goToPage(currentPage + 1)}>Next ›</button>
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage >= pageCount - 1} onClick={() => goToPage(pageCount - 1)}>»</button>
            {serverPaging?.loading && <span className="text-muted">Loading…</span>}
        </div>
    );

    return (
        <>
            {/* Active Filters Display */}
            {isTransactionTable && hasActiveFilters && (
                <div style={{
                    marginBottom: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    <strong>Active Filters:</strong>
                    {filterCenter.length > 0 && (
                        <span style={{ marginLeft: '15px' }}>
                            <strong>Center:</strong> {getFilterDisplayNames(filterCenter, entityMappings.centers)}
                        </span>
                    )}
                    {filterClient.length > 0 && (
                        <span style={{ marginLeft: '15px' }}>
                            <strong>Client:</strong> {getFilterDisplayNames(filterClient, entityMappings.clients)}
                        </span>
                    )}
                    {filterWorker.length > 0 && (
                        <span style={{ marginLeft: '15px' }}>
                            <strong>Worker:</strong> {getFilterDisplayNames(filterWorker, entityMappings.workers)}
                        </span>
                    )}
                    {filterService.length > 0 && (
                        <span style={{ marginLeft: '15px' }}>
                            <strong>Service:</strong> {getFilterDisplayNames(filterService, entityMappings.services)}
                        </span>
                    )}
                    <span style={{ marginLeft: '15px', color: '#6c757d' }}>
                        {serverPaging
                            ? `${totalRows} matching ${column === "costTransactions" ? "costs" : "transactions"}`
                            : `Showing ${rows.length} of ${data[column]?.length || 0} ${column === "costTransactions" ? "costs" : "transactions"}`}
                    </span>
                </div>
            )}

            {pagination}

            <table style={{ borderCollapse: "collapse", borderSpacing: "0px" }} className="table">
                <TableHead key={`${column}-head`} column={column} columns={visibleColumns} toggleAllLines={toggleAllLines}/>
                <tbody style={{borderCollapse: "collapse", borderSpacing: "0px"}}>
                    {pageRows.map((dataRow: any, index: number) => (
                        <TableRow
                            column={column}
                            columns={visibleColumns}
                            key={dataRow._id ?? index}
                            dataRow={dataRow}
                            data={rowData}
                            indexIn={pageStart + index + 1}
                            resetDataFunc={resetDataFunc}
                            user={user}
                            deleteFunction={deleteFunction}
                            isSelected={selectedIds.has(dataRow._id)}
                        />
                    ))}
                </tbody>
            </table>

            {pagination}
        </>
    )
}
