import { useState, useEffect } from 'react';
import { findNameWithId } from '../../tools/tools'

export function InputClient({ name, addOrModifyValueInBodyApi, data, defaultValue, errorValue, isSupplier } : { name: string, addOrModifyValueInBodyApi: any, data: any, defaultValue: string, errorValue: string, isSupplier: string }) {
    const [client, setClient] = useState(defaultValue)
    const [searchText, setSearchText] = useState(findNameWithId(data, defaultValue, "client"));
    const [showDropdown, setShowDropdown] = useState(false);
    const clientsAvailable: any[] = data.client || []

    const filteredClients = clientsAvailable.filter((client: any) =>
        (client.lastName + " " + client.firstName).toLowerCase().includes(searchText.toLowerCase())
    )

    // Update client value when search text changes
    useEffect(() => {
        if (searchText && filteredClients.length === 0) {
            // If no matching clients found, use the search text as new client name
            addOrModifyValueInBodyApi(name, searchText);
        }
    }, [searchText, filteredClients.length, name, addOrModifyValueInBodyApi]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchText(value);
        setShowDropdown(value.length > 0);
        
        // If typing and no exact match, treat as new client
        const exactMatch = filteredClients.find((client: any) => 
            (client.lastName + " " + client.firstName).toLowerCase() === value.toLowerCase()
        );
        
        if (exactMatch) {
            setClient(exactMatch._id);
            addOrModifyValueInBodyApi(name, exactMatch._id);
        } else {
            // New client name
            setClient(value);
            addOrModifyValueInBodyApi(name, value);
        }
    };

    const selectExistingClient = (selectedClient: any) => {
        setClient(selectedClient._id);
        setSearchText(selectedClient.lastName + " " + selectedClient.firstName);
        addOrModifyValueInBodyApi(name, selectedClient._id);
        setShowDropdown(false);
    };

    const createNewClient = () => {
        setClient(searchText);
        addOrModifyValueInBodyApi(name, searchText);
        setShowDropdown(false);
    };

    return <>
        <div className="mb-3">
            {isSupplier === "supplier" ? (
                <>
                <label htmlFor="transactionClient" className="form-label">{"Supplier"}</label>
                <input 
                    type="text"
                    value={client}
                    onChange={(e) => {setClient(e.target.value); addOrModifyValueInBodyApi(name, e.target.value)}}
                    className="form-control"
                    id="transactionClient"
                    aria-label="transactionClient"
                    placeholder="Enter supplier name..."
                />
                </>
            ) : (
                <>
                <div style={{ position: "relative" }}>
                    <label htmlFor="transactionClient" className="form-label">{"Client"}</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search or type new client name..."
                        value={searchText}
                        onChange={handleSearchChange}
                        onFocus={() => setShowDropdown(searchText.length > 0)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow clicking dropdown
                        id="transactionClient"
                        aria-label="transactionClient"
                    />
                    {showDropdown && (
                        <div className="dropdown-menu" style={{ display: "block", position: "absolute", zIndex: 1000, width: "100%" }}>
                            {filteredClients.map((client: any) => (
                                <button
                                    key={client._id}
                                    type="button"
                                    className="dropdown-item"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        selectExistingClient(client);
                                    }}
                                >
                                    {client.lastName + " " + client.firstName}
                                </button>
                            ))}
                            {filteredClients.length === 0 && searchText.trim() && (
                                <button
                                    type="button"
                                    className="dropdown-item text-primary"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        createNewClient();
                                    }}
                                >
                                    <strong>+ Create new client: "{searchText}"</strong>
                                </button>
                            )}
                            {filteredClients.length === 0 && !searchText.trim() && (
                                <span className="dropdown-item text-muted">Start typing to search or create new client</span>
                            )}
                        </div>
                    )}
                    {(errorValue !== "") && (
                        <span style={{ color: 'red' }}>{errorValue}</span>
                    )}
                </div>
                </>
            )}
        </div>
    </>
}