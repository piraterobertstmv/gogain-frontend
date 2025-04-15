import { CustomBarChart } from "../../components/graphics/CustomBarChart"
import { CustomLineChart } from "../../components/graphics/CustomLineChart"
import { findNameWithId } from '../../tools/tools';
import { useState } from 'react'
import { ButtonsRadio } from "../../components/ButtonsRadio";
import casaPadel from '../../assets/casa_padel.svg';
import goGain from '../../assets/Logo.png';
import PSG from '../../assets/Paris_Saint-Germain_Logo.svg';

export function FinancialTransaction({ data, dataFiltered, funcFilter, filterData, dateBeg, dateEnd, setDateBeg, setDateEnd, isGraphicView, setIsGraphicView, idButtons, setIdButtons } : { data: any, dataFiltered: any, funcFilter: any, filterData: any, dateBeg: any, dateEnd: any, setDateBeg: any, setDateEnd: any, isGraphicView: any, setIsGraphicView: any, idButtons: any, setIdButtons: any }) {
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

    const date1 = new Date(dateBeg);
    const date2 = new Date(dateEnd);

    const differenceInMs = Math.abs(date1.getTime() - date2.getTime());
    const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);

    const styleBut: string[] = ["1px solid #DEDEDE", "1px solid #D95213"]


    return <>
        <div style={{ display: "flex", width:"80vw" , flexDirection: "column", alignItems: "flex-start", margin:"3vw 3vw 1vw 3vw", backgroundColor: "#FFFFFF", borderRadius: "8px", height: "max-content", boxShadow: "0px 0px 4px 0px #00000040"}}>
            <div style={{ display: "flex", alignItems: "center", width: "-webkit-fill-available", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ margin: "2vw" }}>
                        <strong style={{ fontSize: "18px" }} >Financial Transactions</strong>
                    </div>
                    <input style={{ width: "9vw", marginRight: "1vw" }} aria-label="Date" value={dateBeg.slice(0, 10)} type="date" onChange={(e) => {setDateBeg(e.target.value)}} className="form-control"/>
                    <input style={{ width: "9vw", marginRight: "1vw" }} aria-label="Date" value={dateEnd.slice(0, 10)} type="date" onChange={(e) => {setDateEnd(e.target.value)}} className="form-control"/>
                    <span onClick={() => setIsGraphicView(false)} style={{ cursor: "pointer", height: "max-content", whiteSpace: "nowrap", fontSize:"16px", backgroundColor: "#FFFFFF", border: styleBut[+(!isGraphicView)], borderRadius: "8px", padding: "6px 10px 6px 10px", marginRight: "1vw"}}>This month</span>
                    <span onClick={() => setIsGraphicView(true)}  style={{ cursor: "pointer", height: "max-content", whiteSpace: "nowrap", fontSize:"16px", backgroundColor: "#FFFFFF", border: styleBut[+(isGraphicView)],  borderRadius: "8px", padding: "6px 10px 6px 10px"}}>This year</span>
                </div>

                <div>
                    <img style={{ width: '110px', height: '80px' }} src={casaPadel} alt="My Icon" />
                    <img style={{ height: '50px' }} src={goGain} alt="My Icon" />
                    <img style={{ width: '110px', height: '60px' }} src={PSG} alt="My Icon" />
                </div>
            </div>
            <div style={{margin: "0vw 1vw 1vw 1vw"}}>
                <ButtonsRadio buttonsName={["Revenue", "Costs", "Result", "Margin"]} onChangeFunction={setIdButtons} selectedButton={idButtons}/>
            </div>
            <div style={{ margin: "0 1vw 0 1vw " }}>
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
                    <label key={center} style={{ padding: "0vw 0vw 1vw 1vw" }} className="custom-checkbox">
                        <input
                            type="checkbox"
                            checked={filterData.includes(center)}
                            onChange={() => handleCheckboxChange(center)}
                            style={{ marginRight: "5px"}}
                        />
                        <span style={{ backgroundColor: checkboxs[center] ? `#${colors[index % 8]}` : "transparent", borderColor: checkboxs[center] ? `#${colorsStroke[index % 8]}`  : "black", borderWidth: "1px" }} className="checkmark"></span>
                        <span style={{ fontSize: "14px" }} >{findNameWithId(data, center, "center")}</span>
                    </label>
                ))}
            </div>
            {(differenceInDays <= 31) && (
                <CustomLineChart dataChart={dataFiltered} employes={centers} data={data} colName={"center"}/>
            )}
            {(differenceInDays > 31) && (
                <CustomBarChart dataChart={dataFiltered} centers={centers} data={data} typeOfUnity={idButtons == 3 ? '%' : '€'}/>    
            )}
        </div>
    </>
}