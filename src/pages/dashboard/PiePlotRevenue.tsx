import { CustomPieChart } from "../../components/graphics/CustomPieChart"
import { findNameWithId } from '../../tools/tools';
import { useState } from 'react'

export function PiePlotRevenue({ data, dataFiltered, dataFilteredCumul, funcFilter, filterData, dateBeg, dateEnd, setDateBeg, setDateEnd, isGraphicView, setIsGraphicView } : { data: any, dataFiltered: any, dataFilteredCumul: any, funcFilter: any, filterData: any, dateBeg: any, dateEnd: any, setDateBeg: any, setDateEnd: any, isGraphicView: any, setIsGraphicView: any }) {
    const centers = data["center"].map((item: { _id: string }) => item._id);

    const [allCheck, setAllCheck] = useState(true)

    const [checkboxs, setCheckboxs] = useState(() => {
        const initialCheckboxState: any = {};
        centers.forEach((id: string) => {
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
        if (filterData.length === centers.length) {
            funcFilter([])
            state = false
            setAllCheck(false)
        } else {
            funcFilter(centers)
            setAllCheck(true)
        }

        const initialCheckboxState: any = {}
        centers.forEach((id: string) => {
            initialCheckboxState[id] = state
        })
        setCheckboxs(initialCheckboxState)
    }

    const colors = ["FF9D70", "FFDDCD", "E5AB90", "CA7852", "202864", "5461C7", "6CBDFF", "5396D4"]
    const colorsStroke = ["D95213", "E9A98C", "BF8062", "934F30", "141940", "29358F", "3284C7", "2E6293"]

    const styleBut: string[] = ["1px solid #DEDEDE", "1px solid #D95213"]

    return <>
        <div style={{ display: "flex", width:"39vw", flexDirection: "column", alignItems: "flex-start", margin:"1vw 1vw 3vw 3vw", backgroundColor: "#FFFFFF", borderRadius: "8px", height: "max-content", boxShadow: "0px 0px 4px 0px #00000040"}}>
            <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ margin: "2vw 2vw 2vh 2vw" }}>
                    <strong style={{ fontSize: "18px" }} >Revenue Repartition</strong>
                </div>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginLeft: "2vw", marginBottom: "2vh" }}>
                    <input style={{ width: "9vw", marginRight: "1vw" }} aria-label="Date" value={dateBeg.slice(0, 10)} type="date" onChange={(e) => {setDateBeg(e.target.value)}} className="form-control"/>
                    <input style={{ width: "9vw", marginRight: "1vw" }} aria-label="Date" value={dateEnd.slice(0, 10)} type="date" onChange={(e) => {setDateEnd(e.target.value)}} className="form-control"/>
                    <span onClick={() => setIsGraphicView(false)} style={{ cursor: "pointer", height: "max-content", whiteSpace: "nowrap", fontSize:"16px", backgroundColor: "#FFFFFF", border: styleBut[+(!isGraphicView)], borderRadius: "8px", padding: "6px 10px 6px 10px", marginRight: "1vw"}}>This month</span>
                    <span onClick={() => setIsGraphicView(true)}  style={{ cursor: "pointer", height: "max-content", whiteSpace: "nowrap", fontSize:"16px", backgroundColor: "#FFFFFF", border: styleBut[+(isGraphicView)],  borderRadius: "8px", padding: "6px 10px 6px 10px"}}>This year</span>
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ margin: "0 1vw 0 1vw ", display: "flex", flexDirection: "column" }}>
                    <label style={{ padding: "0vw 0vw 1vw 1vw" }} className="custom-checkbox">
                        <input
                            type="checkbox"
                            checked={filterData.length === centers.length}
                            onChange={handleAllCheckboxChange}
                            style={{ marginRight: "5px" }}
                        />
                        <span style={{ backgroundColor: allCheck ? `#C0FEC2` : "transparent", borderColor: allCheck ? `#67D46A`  : "black", borderWidth: "1px" }} className="checkmark"></span>
                        <span style={{ fontSize: "14px" }}>All</span>
                    </label>

                    {centers.map((center: string, index: number) => (
                        <label key={center} style={{ padding: "0vw 0vw 3px 1vw" }} className="custom-checkbox">
                            <input
                                type="checkbox"
                                checked={filterData.includes(center)}
                                onChange={() => handleCheckboxChange(center)}
                                style={{ marginRight: "5px" }}
                            />
                            <span style={{ backgroundColor: checkboxs[center] ? `#${colors[index % 8]}` : "transparent", borderColor: checkboxs[center] ? `#${colorsStroke[index % 8]}` : "black", borderWidth: "1px" }} className="checkmark"></span>
                            <span style={{ fontSize: "14px" }} >{findNameWithId(data, center, "center")}</span>
                        </label>
                    ))}
                </div>
                <div style={{ width: "100%", display: "flex"}}>
                    <div style={{ width: "50%" }}>
                        <span style={{ display: "flex", justifyContent: "center", fontWeight: "700" }}>Revenue</span>
                        <CustomPieChart dataChart={dataFilteredCumul} centers={centers} data={data}/>
                    </div>
                    <div style={{ width: "50%" }}>
                        <span style={{ display: "flex", justifyContent: "center", fontWeight: "700" }}>Result</span>
                        <CustomPieChart dataChart={dataFiltered} centers={centers} data={data}/>
                    </div>
                </div>
            </div>
        </div>
    </>
}