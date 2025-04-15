import { useState } from "react";
import { findNameWithId } from "../tools/tools";

export function MultiFilterInput({
    name,
    data,
    availableFilters,
    modifyFilter,
}: {
    name: string;
    data: any;
    availableFilters: string[];
    modifyFilter: any;
}) {
    const [filters, setFilters] = useState<string[]>([]);

    const toggleFilter = (filter: string) => {
        let updatedFilters;
        if (filters.includes(filter)) {
            updatedFilters = filters.filter((f) => f !== filter);
        } else {
            updatedFilters = [...filters, filter];
        }
        setFilters(updatedFilters);
        modifyFilter(updatedFilters);
    };

    function removeFirstCharUppercase(str: string) {
        if (!str) return "";
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    return (
        <div style={{ padding: "5px 40px 20px 0px" }}>
            <h4 style={{ color: "rgb(115, 106, 101)" }}>{name}</h4>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginBottom: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "10px",
                    maxHeight: "15vh",
                    overflowY: "auto",
                }}
            >
                {availableFilters.map((filter, index) => (
                    <label
                        key={index}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            gap: "10px",
                            fontSize: "11px"
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={filters.includes(filter)}
                            onChange={() => toggleFilter(filter)}
                            style={{ cursor: "pointer", width: "1vw" }}
                        />
                        {name === "Worker"
                            ? findNameWithId(data, filter, "users")
                            : findNameWithId(data, filter, removeFirstCharUppercase(name))}
                    </label>
                ))}
            </div>
            <div>
                {filters.map((filter, index) => (
                    <span
                        key={index}
                        style={{
                            display: "inline-flex",
                            backgroundColor: "#f5f5f5",
                            padding: "5px 10px",
                            margin: "5px",
                            borderRadius: "20px",
                            border: "1px solid #a7a7a7",
                            alignItems: "center",
                            fontSize: "11px"
                        }}
                    >
                        {name === "Worker"
                            ? findNameWithId(data, filter, "users")
                            : findNameWithId(data, filter, removeFirstCharUppercase(name))}
                        <button
                            onClick={() => toggleFilter(filter)}
                            style={{
                                marginLeft: "8px",
                                backgroundColor: "#EE4F4F",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                textAlign: "center",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
}
