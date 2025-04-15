import { useState } from "react";
import { findNameWithId } from '../../tools/tools';

export function MultiSelect({ data, options, onSelectionChange }: { data: any, options: any[], onSelectionChange: (selected: any[]) => void }) {
    const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const toggleSelection = (option: any) => {
        const newSelectedOptions = selectedOptions.includes(option)
            ? selectedOptions.filter(item => item !== option) // Remove if already selected
            : [...selectedOptions, option]; // Add if not already selected

        setSelectedOptions(newSelectedOptions);
        onSelectionChange(newSelectedOptions);
    };

    return (
        <div style={{ position: "relative" }}>
            <div 
                style={{ border: "1px solid #ccc", padding: "8px", cursor: "pointer", borderRadius: "7px" }} 
                onClick={() => setDropdownVisible(!dropdownVisible)}
            >
                {selectedOptions.length > 0
                    ? selectedOptions.map(id => findNameWithId(data, id, "center")).join(", ") // Show selected options
                    : "ALL"}
            </div>

            {dropdownVisible && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: "0",
                        border: "1px solid #ccc",
                        backgroundColor: "white",
                        width: "100%",
                        zIndex: 1,
                    }}
                >
                    {options.map(option => (
                        <label key={option} style={{ display: "flex", alignItems: "center", padding: "8px" }}>
                            <input
                                type="checkbox"
                                checked={selectedOptions.includes(option)}
                                onChange={() => toggleSelection(option)}
                                style={{width: "auto", marginRight: "5px"}}
                            />{" "}
                            {findNameWithId(data, option, "center")}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
