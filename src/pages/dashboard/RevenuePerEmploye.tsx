import { CustomLineChart } from "../../components/graphics/CustomLineChart"
import { findNameWithId } from '../../tools/tools';
import { useState } from 'react'
import { MultiSelect } from './MultiSelect'

export function RevenuePerEmploye({ data, dataFiltered, funcFilter, filterData, dateBeg, dateEnd, setDateBeg, setDateEnd, setFilterCenterEmploye, isGraphicView, setIsGraphicView  } : { data: any, dataFiltered: any, funcFilter: any, filterData: any, dateBeg: any, dateEnd: any, setDateBeg: any, setDateEnd: any, setFilterCenterEmploye: any, isGraphicView: any, setIsGraphicView: any }) {
    const employes = data["users"].map((item: { _id: string }) => item._id)
    // const centers = data["center"].map((item: { _id: string }) => item._id)

    const [allCheck, setAllCheck] = useState(true)

    const [checkboxs, setCheckboxs] = useState(() => {
        const initialCheckboxState: any = {};
        employes.forEach((id: string) => {
            initialCheckboxState[id] = true;
        });
        return initialCheckboxState;
    });
    
    const handleCheckboxChange = (item: string) => {
        funcFilter((prev: string[])=> {
            if (prev.includes(item)) {
                return prev.filter(filterData => filterData !== item)
            } else {
                return [...prev, item]
            }
        })

        setCheckboxs((prevState: any) => ({
            ...prevState,
            [item]: !prevState[item],
        }));
    }

    const handleAllCheckboxChange = () => {
        let state: boolean = true
        if (filterData.length === employes.length) {
            funcFilter([])
            state = false
            setAllCheck(false)
        } else {
            funcFilter(employes)
            setAllCheck(true)
        }

        const initialCheckboxState: any = {}
        employes.forEach((id: string) => {
            initialCheckboxState[id] = state
        })
        setCheckboxs(initialCheckboxState)
    }

    const colors = ["FF9D70", "FFDDCD", "E5AB90", "CA7852", "202864", "5461C7", "6CBDFF", "5396D4"]
    const colorsStroke = ["D95213", "E9A98C", "BF8062", "934F30", "141940", "29358F", "3284C7", "2E6293"]

    const styleBut: string[] = ["1px solid #DEDEDE", "1px solid #D95213"]


    const options = data.center.map((item: any) => item._id);

    const handleSelectionChange = (selected: any[]) => {
        setFilterCenterEmploye(selected)
    };

    return <>
        <div style={{ display: "flex", width:"39vw" , flexDirection: "column", alignItems: "flex-start", margin:"1vw 3vw 3vw 1vw", backgroundColor: "#FFFFFF", borderRadius: "8px", height: "max-content", boxShadow: "0px 0px 4px 0px #00000040"}}>
            <div style={{ display: "flex", marginBottom: "1vh", marginTop: "1vh", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ margin: "2vw 2vw 1vh 2vw" , width: "26vw" }}>
                        <strong style={{ fontSize: "18px" }} >Revenue per employe</strong>
                    </div>

                    <div style={{ margin: "5px", width: "-webkit-fill-available", marginRight: "1vw" }}>
                        {/* <select onChange={(e) => {setFilterCenterEmploye(e.target.value)}} className="form-select" id="transactionTypeOfTransaction" aria-label="transactionTypeOfTransaction">
                            {centers.map((center: string) => (
                                <option value={center}>{findNameWithId(data, center, "center")}</option>
                            ))}
                        </select> */}
                        <MultiSelect data={data} options={options} onSelectionChange={handleSelectionChange} />
                    </div>
                </div>
                <div style={{display: "flex", padding: "1vw"}}>
                    <input style={{ width: "9vw", marginRight: "1vw" }} aria-label="Date" value={dateBeg.slice(0, 10)} type="date" onChange={(e) => {setDateBeg(e.target.value)}} className="form-control"/>
                    <input style={{ width: "9vw", marginRight: "1vw" }} aria-label="Date" value={dateEnd.slice(0, 10)} type="date" onChange={(e) => {setDateEnd(e.target.value)}} className="form-control"/>
                    <span onClick={() => setIsGraphicView(false)} style={{ cursor: "pointer", height: "max-content", whiteSpace: "nowrap", fontSize:"16px", backgroundColor: "#FFFFFF", border: styleBut[+(!isGraphicView)], borderRadius: "8px", padding: "6px 10px 6px 10px", marginRight: "1vw"}}>This month</span>
                    <span onClick={() => setIsGraphicView(true)}  style={{ cursor: "pointer", height: "max-content", whiteSpace: "nowrap", fontSize:"16px", backgroundColor: "#FFFFFF", border: styleBut[+(isGraphicView)],  borderRadius: "8px", padding: "6px 10px 6px 10px"}}>This year</span>
                </div>
            </div>
            <div style={{ margin: "0 1vw 0 1vw " }}>
                <label style={{ padding: "0vw 0vw 1vw 1vw" }} className="custom-checkbox">
                    <input
                        type="checkbox"
                        checked={filterData.length === employes.length}
                        onChange={handleAllCheckboxChange}
                        style={{ marginRight: "5px" }}
                    />
                    <span style={{ backgroundColor: allCheck ? `#C0FEC2` : "transparent", borderColor: allCheck ? `#67D46A`  : "black", borderWidth: "1px" }} className="checkmark"></span>
                    <span style={{ fontSize: "14px" }}>All</span>
                </label>

                {employes.map((employe: string, index: number) => (
                    <label key={employe} style={{ padding: "0vw 0vw 1vw 1vw" }} className="custom-checkbox">
                        <input
                            type="checkbox"
                            checked={filterData.includes(employe)}
                            onChange={() => handleCheckboxChange(employe)}
                            style={{ marginRight: "5px" }}
                        />
                        <span style={{ backgroundColor: checkboxs[employe] ? `#${colors[index % 8]}` : "transparent", borderColor: checkboxs[employe] ? `#${colorsStroke[index % 8]}`  : "black", borderWidth: "1px" }} className="checkmark"></span>
                        <span style={{ fontSize: "14px" }} >{findNameWithId(data, employe, "users")}</span>
                    </label>
                ))}
            </div>
            <CustomLineChart dataChart={dataFiltered} employes={employes} data={data} colName={"users"}/>
        </div>
    </>
}