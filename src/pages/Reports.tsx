import './Settings.css'
import { findNameWithId } from '../tools/tools';
import { useState } from 'react';

export function Reports({ data } : { data: any }) {
    const names = [
        "index",
        "date",
        "center",
        "client",
        "amount with taxes",
        "amount without taxes",
        "worker",
        "taxes",
        "type of transaction",
        "type of movement",
        "frequency",
        "type of client",
        "service",
    ]

    const [buttonStates, setButtonStates] = useState<Record<string, boolean>>(
        Object.fromEntries(names.map((name) => [name, true]))
    )

    const toggleButton = (name: string) => {
        setButtonStates((prevState) => ({
            ...prevState,
            [name]: !prevState[name],
        }))
    }


    function modifyData(data: any, allData: any) {
        let res: any[] = []

        for (let i = 0; i < data.length; i++) {
            let obj: any = {}

            for (let j = 0; j < names.length; j++) {
                if (buttonStates[names[j]]) {
                    let value: string = ""

                    if (names[j] == "index")
                        value = i.toString()

                    if (names[j] == "center")
                        value = findNameWithId(allData, data[i][names[j]], "center")

                    if (names[j] == "client") {
                        if (data[i]["typeOfClient"] == "client")
                            value = findNameWithId(allData, data[i][names[j]], "client")
                        else
                            value = data[i][names[j]]
                    }

                    if (names[j] == "worker")
                        value = findNameWithId(allData, data[i][names[j]], "users")       

                    if (names[j] == "service") {
                        if (data[i]["typeOfTransaction"] == "cost")
                            value = findNameWithId(allData, data[i][names[j]], "costs")
                        else
                            value = findNameWithId(allData, data[i][names[j]], "service")
                    }

                    if (names[j] == "amount without taxes")
                        value = (data[i]["cost"] / (1 + (data[i]["taxes"] / 100))).toFixed(2).toString()

                    if (names[j] == "amount with taxes")
                        value = data[i]["cost"]

                    if (names[j] == "type of transaction")
                        value = data[i]["typeOfTransaction"]

                    if (names[j] == "type of movement")
                        value = data[i]["typeOfMovement"]

                    if (names[j] == "type of client")
                        value = data[i]["typeOfClient"]

                    if (names[j] == "date")
                        value = data[i]["date"].slice(0, 10)

                    if (value === "")
                        value = data[i][names[j]]
                    
                    obj[names[j]] = value
                }
            }

            res.push(obj)
        }

        return res
    }

    function convertArrayToCSV(data: any[]) {
        if (data.length === 0) return "";

        const headers = Object.keys(data[0]);
        const csvRows = data.map((row) => {
            const csvRow = headers.map((header) => {
                return JSON.stringify(row[header] || "")
            })

            return csvRow.join(",")
        }
        );

        return [headers.join(","), ...csvRows].join("\n");
    }
  
    function downloadCSV(data: any[], filename: string = "transactions.csv", allData: any) {
        const csvContent = convertArrayToCSV(modifyData(data, allData));
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return <>
        <div style={{ margin: "1vw 0vw 0vw 0vw"}}>
            <span style={{ margin: "0vw 0vw 0vw 2vw", color: "rgb(115, 106, 101)"}}>
                Select the filters you need in your csv
            </span>
        </div>
        <div style={{ margin: "2vw" }}>
            {names.map((name) => (
                <button
                    key={name}
                    onClick={() => toggleButton(name)}
                    style={{
                        margin: "5px",
                        backgroundColor: buttonStates[name] ? "#C0FEC2" : "rgb(242, 242, 242)",
                        color: "black",
                        padding: "10px 15px",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                    }}
                >
                    {name}
                </button>
            ))}
        </div>
        <button className="logout-button" onClick={() => downloadCSV(data.transaction, "transactions.csv", data)}>
            Export
        </button>
    </>
}