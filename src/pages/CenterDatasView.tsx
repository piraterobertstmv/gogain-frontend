import "./CenterDatasView.css"
import { CenterDatasTable } from './CenterDatasTable'
import { findNameWithId } from '../tools/tools';
import casaPadel from '../assets/casa_padel.svg';
import goGain from '../assets/Logo.png';
import PSG from '../assets/Paris_Saint-Germain_Logo.svg';

function createDataToView(data: any) {
    let dataToView: any = {
        all: { month: { income: 0, costs: 0, profit: 0, margin: 0 }, accumulated: { income: 0, costs: 0, profit: 0, margin: 0 }}
    }

    for (let i = 0; i < data.center.length; i++) {
        let incomePerMonth = 0
        let costsPerMonth = 0

        let incomeAccumul = 0
        let costsAccumul = 0

        data.transaction.forEach((transaction: any) => {
            if (transaction.center == data.center[i]._id) {
                const dateToCheck = new Date(transaction.date)
                const currentDate = new Date()

                if (transaction.typeOfTransaction === "revenue") {
                    incomeAccumul += (transaction.cost / (1 + (transaction.taxes / 100)))
                
                    if (dateToCheck.getUTCFullYear() === currentDate.getUTCFullYear() && dateToCheck.getUTCMonth() === currentDate.getUTCMonth())
                        incomePerMonth += (transaction.cost / (1 + (transaction.taxes / 100)))

                } else {
                    costsAccumul += (transaction.cost / (1 + (transaction.taxes / 100)))
                    if (dateToCheck.getUTCFullYear() === currentDate.getUTCFullYear() && dateToCheck.getUTCMonth() === currentDate.getUTCMonth())
                        costsPerMonth += (transaction.cost / (1 + (transaction.taxes / 100)))
                }
            }
        })

        dataToView[data.center[i]._id] = {
            month: { 
                income: parseFloat((incomePerMonth).toFixed(2)), 
                costs: parseFloat((costsPerMonth).toFixed(2)), 
                profit: parseFloat((incomePerMonth - costsPerMonth).toFixed(2)), 
                margin: incomePerMonth == 0 ? "0" : parseFloat((((incomePerMonth - costsPerMonth) / incomePerMonth) * 100).toFixed(2))
            }, 
            accumulated: { 
                income: parseFloat((incomeAccumul).toFixed(2)), 
                costs: parseFloat((costsAccumul).toFixed(2)), 
                profit: parseFloat((incomeAccumul - costsAccumul).toFixed(2)), 
                margin: incomeAccumul == 0 ? "0" : parseFloat((((incomeAccumul - costsAccumul) / incomeAccumul) * 100).toFixed(2))
            } 
        }
    }

    let incomeAll = 0
    let costsAll = 0
    let incomeAllMonth = 0
    let costsAllMonth = 0

    Object.entries(dataToView).forEach(([_, value]: any) => {
        incomeAll += value.accumulated.income
        costsAll += value.accumulated.costs
        incomeAllMonth += value.month.income
        costsAllMonth += value.month.costs
    })

    dataToView.all = { 
        month: { 
            income: parseFloat((incomeAllMonth).toFixed(2)), 
            costs: parseFloat((costsAllMonth).toFixed(2)), 
            profit: parseFloat((incomeAllMonth - costsAllMonth).toFixed(2)), 
            margin: incomeAllMonth == 0 ? "0" : parseFloat((((incomeAllMonth - costsAllMonth) / incomeAllMonth) * 100).toFixed(2))
        },
        accumulated: { 
            income: parseFloat((incomeAll).toFixed(2)), 
            costs: parseFloat((costsAll).toFixed(2)), 
            profit: parseFloat((incomeAll - costsAll).toFixed(2)), 
            margin: incomeAll == 0 ? "0" : parseFloat((((incomeAll - costsAll) / incomeAll) * 100).toFixed(2))
        }}

    return dataToView
}

// function concentrateData(data: any, dataToView: any) {
//     let res: any = {
//         All: dataToView.all,
//         GoGain: {
//             month: { costs: 0, income: 0, margin: 0, profit: 0 },
//             accumulated: { costs: 0, income: 0, margin: 0, profit: 0 }
//         },
//         CasaPadel: {
//             month: { costs: 0, income: 0, margin: 0, profit: 0 },
//             accumulated: { costs: 0, income: 0, margin: 0, profit: 0 }
//         },
//         PSG: {
//             month: { costs: 0, income: 0, margin: 0, profit: 0 },
//             accumulated: { costs: 0, income: 0, margin: 0, profit: 0 }
//         },
//     }

//     const keys = Object.keys(dataToView);
//     for (let i = 0; i < keys.length; i++) {
//         const key = keys[i]
//         const value = dataToView[key]

//         const name = findNameWithId(data, key, "center")

//         if (name === "CASA PADEL 1" || name === "CASA PADEL 2" || name === "CASA PADEL 2") {
//             res.CasaPadel.month.costs += value.month.costs
//             res.CasaPadel.month.income += value.month.income

//             res.CasaPadel.accumulated.costs += value.accumulated.costs
//             res.CasaPadel.accumulated.income += value.accumulated.income
//         }

//         if (name === "BOSQUET" || name === "CORPORATE" || name === "APP" || name === "DIGITAL (GAIN ONE)") {
//             res.GoGain.month.costs += value.month.costs
//             res.GoGain.month.income += value.month.income

//             res.GoGain.accumulated.costs += value.accumulated.costs
//             res.GoGain.accumulated.income += value.accumulated.income
//         }

//         if (name === "PSG") {
//             res.PSG.month.costs += value.month.costs
//             res.PSG.month.income += value.month.income

//             res.PSG.accumulated.costs += value.accumulated.costs
//             res.PSG.accumulated.income += value.accumulated.income
//         }
//     }

//     res.GoGain.month.profit = parseFloat((res.GoGain.month.income - res.GoGain.month.costs).toFixed(2))
//     res.CasaPadel.month.profit = parseFloat((res.CasaPadel.month.income - res.CasaPadel.month.costs).toFixed(2))
//     res.PSG.month.profit = parseFloat((res.PSG.month.income - res.PSG.month.costs).toFixed(2))

//     res.GoGain.accumulated.profit = parseFloat((res.GoGain.accumulated.income - res.GoGain.accumulated.costs).toFixed(2))
//     res.CasaPadel.accumulated.profit = parseFloat((res.CasaPadel.accumulated.income - res.CasaPadel.accumulated.costs).toFixed(2))
//     res.PSG.accumulated.profit = parseFloat((res.PSG.accumulated.income - res.PSG.accumulated.costs).toFixed(2))

//     res.GoGain.month.margin = res.GoGain.month.income == 0 ? "0" : parseFloat((((res.GoGain.month.income - res.GoGain.month.costs) / res.GoGain.month.income) * 100).toFixed(2))
//     res.CasaPadel.month.margin = res.CasaPadel.month.income == 0 ? "0" : parseFloat((((res.CasaPadel.month.income - res.CasaPadel.month.costs) / res.CasaPadel.month.income) * 100).toFixed(2))
//     res.PSG.month.margin = res.PSG.month.income == 0 ? "0" : parseFloat((((res.PSG.month.income - res.PSG.month.costs) / res.PSG.month.income) * 100).toFixed(2))

//     res.GoGain.accumulated.margin = res.GoGain.accumulated.income == 0 ? "0" : parseFloat((((res.GoGain.accumulated.income - res.GoGain.accumulated.costs) / res.GoGain.accumulated.income) * 100).toFixed(2))
//     res.CasaPadel.accumulated.margin = res.CasaPadel.accumulated.income == 0 ? "0" : parseFloat((((res.CasaPadel.accumulated.income - res.CasaPadel.accumulated.costs) / res.CasaPadel.accumulated.income) * 100).toFixed(2))
//     res.PSG.accumulated.margin = res.PSG.accumulated.income == 0 ? "0" : parseFloat((((res.PSG.accumulated.income - res.PSG.accumulated.costs) / res.PSG.accumulated.income) * 100).toFixed(2))

//     return res
// }



export function CenterDatasView({ data } : { data: any }) {
    const dataToView: any = createDataToView(data)
    // const dataToView: any = concentrateData(data, dataToViewRaw)
    return <>
    <div style={{ display: "flex", flexWrap: "wrap", flexDirection: "column" }}>
        <div style={{ marginTop: "1vh", marginLeft: "1vw" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <span style={{ fontSize: "2em", marginLeft: "2vw", fontWeight: "600" }}>All</span>

            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {Object.entries(dataToView).map(([key, value]: any) => (
                    key === "all" && <CenterDatasTable value={value} name={key} data={data} />
                ))}
                <div style={{ width: "-webkit-fill-available", display: "flex", justifyContent: "space-evenly" }}>
                    <img style={{ marginRight:"15px", width: '210px', height: '110px' }} src={casaPadel} alt="My Icon" />
                    <img style={{ marginRight:"35px", height: '130px' }} src={goGain} alt="My Icon" />
                    <img style={{ marginRight:"15px", width: '110px', height: '180px' }} src={PSG} alt="My Icon" />
                </div>
            </div>
        </div>

        <div style={{ marginTop: "1vh", marginLeft: "1vw" }}>
            <span style={{ fontSize: "2em", marginLeft: "2vw", fontWeight: "600" }}>GoGain</span>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
            {Object.entries(dataToView).map(([key, value]: any) => (
                (findNameWithId(data, key, "center") === "BOSQUET" || findNameWithId(data, key, "center") === "CORPORATE" || findNameWithId(data, key, "center") === "APP" || findNameWithId(data, key, "center") === "DIGITAL (GAIN ONE)") && <CenterDatasTable value={value} name={key} data={data} />
            ))}
            </div>
        </div>

        <div style={{ marginTop: "1vh", marginLeft: "1vw" }}>
            <span style={{ fontSize: "2em", marginLeft: "2vw", fontWeight: "600" }}>Casa Padel</span>
            {/* <img style={{ width: '110px', height: '80px' }} src={myIcon} alt="My Icon" /> */}
            <div style={{ display: "flex", flexWrap: "nowrap" }}>
            {Object.entries(dataToView).map(([key, value]: any) => (
                (findNameWithId(data, key, "center") === "CASA PADEL 1" || findNameWithId(data, key, "center") === "CASA PADEL 2" || findNameWithId(data, key, "center") === "CASA PADEL 3") && <CenterDatasTable value={value} name={key} data={data} />
            ))}
            </div>
        </div>

        <div style={{ marginTop: "1vh", marginLeft: "1vw" }}>
            <span style={{ fontSize: "2em", marginLeft: "2vw", fontWeight: "600" }}>PSG</span>
            {Object.entries(dataToView).map(([key, value]: any) => (
                findNameWithId(data, key, "center") === "PSG" && <CenterDatasTable value={value} name={key} data={data} />
            ))}
        </div>
    </div>
    </>
}