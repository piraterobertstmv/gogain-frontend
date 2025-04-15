import { useState } from 'react';
import { findNameWithId } from '../../tools/tools'

export function InputClient({ name, addOrModifyValueInBodyApi, data, defaultValue, errorValue, isSupplier } : { name: string, addOrModifyValueInBodyApi: any, data: any, defaultValue: string, errorValue: string, isSupplier: string }) {
    const [client, setClient] = useState(defaultValue)
    const [searchText, setSearchText] = useState(findNameWithId(data, defaultValue, "client"));
    const clientsAvailable: object[] = data.client

    const filteredClients = clientsAvailable.filter((client: any) =>
        (client.lastName + " " + client.firstName).toLowerCase().includes(searchText.toLowerCase())
    )

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
                />
                </>
            ) : (
                <>
                <div>
                    <label htmlFor="transactionClient" className="form-label">{"Client"}</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search client..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        id="transactionClient"
                        aria-label="transactionClient"
                    />
                    <div className="dropdown-menu" style={{ display: (searchText && filteredClients.length !== 1) ? "block" : "none", position: "absolute" }}>
                        {filteredClients.map((client: any) => (
                            <button
                                key={client._id}
                                className="dropdown-item"
                                onClick={(e) => {
                                    e.preventDefault()
                                    setClient(client._id);
                                    setSearchText(client.lastName + " " + client.firstName);
                                    addOrModifyValueInBodyApi(name, client._id);
                                }}
                            >
                                {client.lastName + " " + client.firstName}
                            </button>
                        ))}
                        {filteredClients.length === 0 && (
                            <span className="dropdown-item">No results found</span>
                        )}
                    </div>
                    {(errorValue !== "") && (
                        <span style={{ color: 'red' }}>{errorValue}</span>
                    )}
                </div>
                </>
            )}
            {(errorValue !== "") && (
                <span style={{ color: 'red' }}>{errorValue}</span>
            )}
        </div>
    </>
}