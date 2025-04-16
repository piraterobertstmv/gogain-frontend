import { findNameWithId } from '../tools/tools';
import { FinancialTransaction } from "./dashboard/FinancialTransaction";
import { PiePlotRevenue } from "./dashboard/PiePlotRevenue";
import { RevenuePerEmploye } from './dashboard/RevenuePerEmploye';
import { CenterDatasView } from './CenterDatasView'

import { useEffect, useState } from 'react';

import "./dashboard.css"

const months: string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// applyFilter(data, "center", ["66eb4e85615c83d533d03876", "66eb4e96615c83d533d0387b"], ["2024-01-01T00:00:00.000Z", "2024-12-31T00:00:00.000Z"])
function applyFilter(data: any, colName: string, whiteListId: string[], dateRange: string[], centerFilter: string[]) {
    let filteredData: any[] = []
    
    if (!data?.transaction || !Array.isArray(data.transaction)) {
        console.log("No valid transaction data available");
        return filteredData;
    }

    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[1]);
    
    // Set times to start and end of day for accurate filtering
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log("Filtering with:", {
        colName,
        whiteListId,
        dateRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        centerFilter,
        totalTransactions: data.transaction.length
    });

    // Directly iterate over the array
    data.transaction.forEach((value: any) => {
        const targetDate = new Date(value.date);
        targetDate.setHours(0, 0, 0, 0); // Normalize time for comparison

        if (whiteListId.includes(value[colName])) {
            if (targetDate >= startDate && targetDate <= endDate) {
                if (centerFilter.length === 0 || centerFilter.includes(value.center)) {
                    console.log("Including transaction:", {
                        id: value._id,
                        date: value.date,
                        type: value.typeOfTransaction,
                        amount: value.cost + value.taxes
                    });
                    filteredData.push(value);
                }
            }
        }
    });

    console.log("Filtered data summary:", {
        count: filteredData.length,
        costs: filteredData.filter(t => t.typeOfTransaction === "cost").length,
        revenues: filteredData.filter(t => t.typeOfTransaction === "revenue").length
    });
    
    return filteredData;
}

// sumRevenuPerColName(dataFiltered, "center")
function sumRevenuPerColName(dataFiltered: any, colName: string, arrOfCol: string[], isCumul: boolean) {
    console.log("Calculating sums for:", {
        dataLength: dataFiltered.length,
        colName,
        arrOfColLength: arrOfCol.length,
        isCumul
    });

    let sumData: any[] = []

    for (let i = 0; i < arrOfCol.length; i++) {
        sumData[i] = { 
            name: arrOfCol[i], 
            value: 0,
            costs: 0,
            revenues: 0
        }

        dataFiltered.forEach((value: any) => {
            if (arrOfCol[i] === value[colName]) {
                // Calculate total amount including taxes
                const totalAmount = value.cost + value.taxes;
                
                console.log("Processing transaction:", {
                    id: value._id,
                    type: value.typeOfTransaction,
                    cost: value.cost,
                    taxes: value.taxes,
                    total: totalAmount,
                    date: value.date,
                    colName: value[colName]
                });

                if (value.typeOfTransaction === "cost") {
                    sumData[i].costs += totalAmount;
                    if (!isCumul) {
                        sumData[i].value -= totalAmount; // Subtract costs in non-cumulative mode
                    }
                } else if (value.typeOfTransaction === "revenue") {
                    sumData[i].revenues += totalAmount;
                    sumData[i].value += totalAmount; // Always add revenues
                }
            }
        });

        // Round all values
        sumData[i].value = parseFloat((sumData[i].value).toFixed(2));
        sumData[i].costs = parseFloat((sumData[i].costs).toFixed(2));
        sumData[i].revenues = parseFloat((sumData[i].revenues).toFixed(2));
    }

    console.log("Final calculation results:", sumData);
    return sumData;
}

// sumRevenuPerColNamePerDate(dataFiltered, "center")
function sumRevenuPerColNamePerDate(dataFiltered: any, colName: string, data: any, idCalculus: number) {
    let sumDataDate: any[] = []
    let sumDataDateMargin: any = []

    const colInData: string = colName === "worker" ? "users" : colName

    // Initialize arrays with default values
    for (let i = 0; i < 12; i++) {
        let defaultObj: any = {name: months[i]}
        let defaultObjMargin: any = {name: months[i]}

        // Create unique sets of entities to avoid duplicates
        const uniqueEntities = new Set(dataFiltered.map((value: any) => value[colName]));
        
        uniqueEntities.forEach((entityId: any) => {
            const name = findNameWithId(data, entityId, colInData);
            defaultObj[name] = 0;
            defaultObjMargin[name] = {
                cost: 0,
                revenue: 0
            };
        });

        sumDataDate.push(defaultObj);
        sumDataDateMargin.push(defaultObjMargin);
    }

    // Process transactions
    dataFiltered.forEach((value: any) => {
        const date = new Date(value.date);
        const monthNumber = date.getMonth();
        const name = findNameWithId(data, value[colName], colInData);
        const totalAmount = value.cost + value.taxes;

        console.log("Processing monthly transaction:", {
            id: value._id,
            month: monthNumber,
            name,
            type: value.typeOfTransaction,
            amount: totalAmount,
            calcMode: idCalculus
        });

        switch (idCalculus) {
            case 0: // Revenue only
                if (value.typeOfTransaction === "revenue") {
                    sumDataDate[monthNumber][name] += totalAmount;
                }
                break;
            case 1: // Costs only
                if (value.typeOfTransaction === "cost") {
                    sumDataDate[monthNumber][name] += totalAmount;
                }
                break;
            case 2: // Net (Revenue - Costs)
                if (value.typeOfTransaction === "cost") {
                    sumDataDate[monthNumber][name] -= totalAmount;
                } else {
                    sumDataDate[monthNumber][name] += totalAmount;
                }
                break;
            case 3: // Margin calculation
                if (value.typeOfTransaction === "cost") {
                    sumDataDateMargin[monthNumber][name].cost += totalAmount;
                } else {
                    sumDataDateMargin[monthNumber][name].revenue += totalAmount;
                }
                break;
        }
    });

    // Calculate margins if needed
    if (idCalculus === 3) {
        for (let i = 0; i < 12; i++) {
            Object.entries(sumDataDateMargin[i]).forEach(([key]: [string, any]) => {
                if (key !== "name") {
                    const revenue = sumDataDateMargin[i][key].revenue;
                    const cost = sumDataDateMargin[i][key].cost;
                    sumDataDate[i][key] = revenue === 0 ? 0 : ((revenue - cost) / revenue) * 100;
                }
            });
        }
    }
    
    // Round all numbers to 2 decimal places
    for (let i = 0; i < 12; i++) {
        Object.entries(sumDataDate[i]).forEach(([key]: [string, any]) => {
            if (key !== "name") {
                sumDataDate[i][key] = parseFloat((sumDataDate[i][key]).toFixed(2));
            }
        });
    }

    console.log("Monthly calculation results:", sumDataDate);
    return sumDataDate;
}

// sumRevenuPerColNamePerDay(dataFiltered, "worker", data, idCalculus)
function sumRevenuPerColNamePerDay(dataFiltered: any, colName: string, data: any, idCalculus: number) {
    let sumData: any[] = [];
    const colInData: string = colName === "worker" ? "users" : colName;
    
    // Create a unique list of days in the dataset
    const uniqueDays = new Set();
    dataFiltered.forEach((value: any) => {
        const date = new Date(value.date);
        const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        uniqueDays.add(dayKey);
    });
    
    // Initialize the structure
    const sortedDays = Array.from(uniqueDays).sort();
    sortedDays.forEach((day: any) => {
        const dayObj: any = { name: day };
        
        // Create unique sets of entities to avoid duplicates
        const uniqueEntities = new Set(dataFiltered.map((value: any) => value[colName]));
        
        uniqueEntities.forEach((entityId: any) => {
            const name = findNameWithId(data, entityId, colInData);
            dayObj[name] = 0;
        });
        
        sumData.push(dayObj);
    });
    
    // Process transactions
    dataFiltered.forEach((value: any) => {
        const date = new Date(value.date);
        const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        const dayIndex = sortedDays.indexOf(dayKey);
        
        if (dayIndex >= 0) {
            const name = findNameWithId(data, value[colName], colInData);
            const totalAmount = value.cost + value.taxes;
            
            switch (idCalculus) {
                case 0: // Revenue only
                    if (value.typeOfTransaction === "revenue") {
                        sumData[dayIndex][name] += totalAmount;
                    }
                    break;
                case 1: // Costs only
                    if (value.typeOfTransaction === "cost") {
                        sumData[dayIndex][name] += totalAmount;
                    }
                    break;
                case 2: // Net (Revenue - Costs)
                    if (value.typeOfTransaction === "cost") {
                        sumData[dayIndex][name] -= totalAmount;
                    } else {
                        sumData[dayIndex][name] += totalAmount;
                    }
                    break;
            }
        }
    });
    
    return sumData;
}

export function Dashboard({ data }: { data: any }) {
    // Get initial date values
    const now = new Date();
    const initialYear = now.getFullYear();
    const initialMonth = now.getMonth() + 1;
    const initialMaxDays = new Date(initialYear, initialMonth, 0).getDate();

    // State declarations for date and filter controls - using static values for now
    const [financialTransItems, setFinancialTransItems] = useState<string[]>([]);
    const [piePlotRevenueItems, setPiePlotRevenueItems] = useState<string[]>([]);
    const [revenuePerEmployeItems, setRevenuePerEmployeItems] = useState<string[]>([]);
    // Using constants instead of state since setters aren't used in current UI
    const currentYear = initialYear;
    const monthNumber = initialMonth;
    const maxDays = initialMaxDays;
    
    const [isFilterFinancal, setIsFilterFinancal] = useState<boolean>(true);
    const [isFilterPiePlot, setIsFilterPiePlot] = useState<boolean>(true);
    const [isFilterRevenue, setIsFilterRevenue] = useState<boolean>(true);
    const [isGraphicView, setIsGraphicView] = useState<boolean>(true);
    const [idButtons, setIdButtons] = useState<number>(0);

    // Initialize centers and employees
    const centers = data?.center?.map((item: { _id: string }) => item._id) || [];
    const employes = data?.users?.map((item: { _id: string }) => item._id) || [];

    // Initialize date filters with proper formatting
    const formatDate = (year: number, month: number, day: number) => {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const [filterFinDateBegin, setFilterFinDateBegin] = useState<string>(formatDate(currentYear, 1, 1));
    const [filterFinDateEnd, setFilterFinDateEnd] = useState<string>(formatDate(currentYear, monthNumber, maxDays));
    const [filterPieDateBegin, setFilterPieDateBegin] = useState<string>(formatDate(currentYear, 1, 1));
    const [filterPieDateEnd, setFilterPieDateEnd] = useState<string>(formatDate(currentYear, monthNumber, maxDays));
    const [filterRevDateBegin, setFilterRevDateBegin] = useState<string>(formatDate(currentYear, 1, 1));
    const [filterRevDateEnd, setFilterRevDateEnd] = useState<string>(formatDate(currentYear, monthNumber, maxDays));
    const [filterCenterEmploye, setFilterCenterEmploye] = useState<string[]>([]);

    const styleBut: string[] = ["1px solid #DEDEDE", "1px solid #D95213"];

    // Calculate date differences after state declarations
    const date1 = new Date(filterFinDateBegin);
    const date2 = new Date(filterFinDateEnd);
    const differenceInMs = Math.abs(date1.getTime() - date2.getTime());
    const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);

    // Debug log for incoming data
    console.log("Dashboard received data:", {
        transactionCount: data?.transaction?.length || 0,
        centerCount: data?.center?.length || 0,
        userCount: data?.users?.length || 0,
        transactions: data?.transaction?.map((t: any) => ({
            id: t._id,
            date: t.date,
            type: t.typeOfTransaction,
            cost: t.cost,
            taxes: t.taxes,
            total: t.cost + t.taxes
        }))
    });

    useEffect(() => {
        if (!data?.transaction) return;

        // Initialize financial items with center IDs
        setFinancialTransItems(centers);
        setPiePlotRevenueItems(centers);
        setRevenuePerEmployeItems(employes);

        // Log data for debugging
        console.log("Dashboard data updated:", {
            transactionCount: data.transaction.length,
            year: currentYear,
            month: monthNumber,
            days: maxDays
        });
    }, [data, centers, employes]); // Add dependencies

    useEffect(() => {
        if (!data?.transaction) return;

        console.log("Calculating financial items with:", {
            currentYear,
            monthNumber,
            maxDays,
            transactionCount: data.transaction.length
        });

        // Get filtered data for each calculation
        const financialData = applyFilter(
            data,
            "center",
            centers,
            [`${filterFinDateBegin}T00:00:00.000Z`, `${filterFinDateEnd}T00:00:00.000Z`],
            []
        );

        const piePlotData = applyFilter(
            data,
            "center",
            centers,
            [`${filterPieDateBegin}T00:00:00.000Z`, `${filterPieDateEnd}T00:00:00.000Z`],
            []
        );

        const employeeData = applyFilter(
            data,
            "worker",
            employes,
            [`${filterRevDateBegin}T00:00:00.000Z`, `${filterRevDateEnd}T00:00:00.000Z`],
            filterCenterEmploye
        );

        console.log("Filtered data:", {
            financial: financialData.length,
            piePlot: piePlotData.length,
            employee: employeeData.length
        });

        // Calculate sums and update state
        sumRevenuPerColName(financialData, "center", centers, false);
        sumRevenuPerColNamePerDate(piePlotData, "center", data, idButtons);
        sumRevenuPerColNamePerDay(employeeData, "worker", data, idButtons);

        setFinancialTransItems(centers);
        setPiePlotRevenueItems(centers);
        setRevenuePerEmployeItems(employes);
    }, [
        data,
        centers,
        employes,
        filterFinDateBegin,
        filterFinDateEnd,
        filterPieDateBegin,
        filterPieDateEnd,
        filterRevDateBegin,
        filterRevDateEnd,
        filterCenterEmploye,
        idButtons,
        currentYear,
        monthNumber,
        maxDays
    ]); // Add all dependencies

    useEffect(() => {
        if (!isFilterFinancal) {
            setFilterFinDateBegin(formatDate(currentYear, monthNumber, 1))
            setFilterFinDateEnd(formatDate(currentYear, monthNumber, maxDays))
        } else {
            setFilterFinDateBegin(formatDate(currentYear, 1, 1))
            setFilterFinDateEnd(formatDate(currentYear, 12, 31))    
        }
    }, [isFilterFinancal, currentYear, monthNumber, maxDays])

    useEffect(() => {
        if (!isFilterPiePlot) {
            setFilterPieDateBegin(formatDate(currentYear, monthNumber, 1))
            setFilterPieDateEnd(formatDate(currentYear, monthNumber, maxDays))
        } else {
            setFilterPieDateBegin(formatDate(currentYear, 1, 1))
            setFilterPieDateEnd(formatDate(currentYear, 12, 31))    
        }
    }, [isFilterPiePlot, currentYear, monthNumber, maxDays])

    useEffect(() => {
        if (!isFilterRevenue) {
            setFilterRevDateBegin(formatDate(currentYear, monthNumber, 1))
            setFilterRevDateEnd(formatDate(currentYear, monthNumber, maxDays))
        } else {
            setFilterRevDateBegin(formatDate(currentYear, 1, 1))
            setFilterRevDateEnd(formatDate(currentYear, 12, 31))    
        }
    }, [isFilterRevenue, currentYear, monthNumber, maxDays])

    // Calculate filtered data whenever data or filters change
    const dataFilteredFinancial = applyFilter(data, "center", financialTransItems, [`${filterFinDateBegin}T00:00:00.000Z`, `${filterFinDateEnd}T00:00:00.000Z`], [])
    const dataFilteredPiePlot = applyFilter(data, "center", piePlotRevenueItems,[`${filterPieDateBegin}T00:00:00.000Z`, `${filterPieDateEnd}T00:00:00.000Z`], [])
    const dataFilteredPerEmp = applyFilter(data, "worker", revenuePerEmployeItems, [`${filterRevDateBegin}T00:00:00.000Z`, `${filterRevDateEnd}T00:00:00.000Z`], filterCenterEmploye)

    // Add debug logging for filtered data
    useEffect(() => {
        const februaryData = dataFilteredFinancial.filter((t: any) => {
            const date = new Date(t.date);
            return date.getMonth() === 1; // February is month 1
        });

        console.log("Filtered Data Debug:", {
            totalFiltered: dataFilteredFinancial.length,
            februaryTransactions: februaryData.map((t: any) => ({
                id: t._id,
                date: t.date,
                type: t.typeOfTransaction,
                amount: t.cost + t.taxes
            })),
            currentFilters: {
                centers: financialTransItems,
                dateRange: [`${filterFinDateBegin}T00:00:00.000Z`, `${filterFinDateEnd}T00:00:00.000Z`]
            }
        });
    }, [dataFilteredFinancial, financialTransItems, filterFinDateBegin, filterFinDateEnd]);

    return <>
        <div>
            <div style={{ padding: "3vw 3vw 0vw 3vw", display: "flex", justifyContent: "space-between"}}>
                <span onClick={() => setIsGraphicView(true)} style={{ cursor: "pointer", whiteSpace: "nowrap", fontSize:"16px", backgroundColor: "#FFFFFF", border: styleBut[+(isGraphicView)], borderRadius: "8px", padding: "10px 15vw 10px 17vw"}}>Center Datas</span>
                <span onClick={() => setIsGraphicView(false)}  style={{ cursor: "pointer", whiteSpace: "nowrap", fontSize:"16px", backgroundColor: "#FFFFFF", border: styleBut[+(!isGraphicView)], borderRadius: "8px", padding: "10px 17vw 10px 15vw"}}>Graphics</span>
            </div>
            {(isGraphicView) && (
                <CenterDatasView data={data}/>
            )}
            {(!isGraphicView) && (
            <div>
                {(differenceInDays <= 31) && (
                    <FinancialTransaction data={data} dataFiltered={sumRevenuPerColNamePerDay(dataFilteredFinancial, "center", data, idButtons)} funcFilter={setFinancialTransItems} filterData={financialTransItems} dateBeg={filterFinDateBegin} dateEnd={filterFinDateEnd} setDateBeg={setFilterFinDateBegin} setDateEnd={setFilterFinDateEnd} isGraphicView={isFilterFinancal} setIsGraphicView={setIsFilterFinancal} idButtons={idButtons} setIdButtons={setIdButtons}/>
                )}
                {(differenceInDays > 31) && (
                    <FinancialTransaction data={data} dataFiltered={sumRevenuPerColNamePerDate(dataFilteredFinancial, "center", data, idButtons)} funcFilter={setFinancialTransItems} filterData={financialTransItems} dateBeg={filterFinDateBegin} dateEnd={filterFinDateEnd} setDateBeg={setFilterFinDateBegin} setDateEnd={setFilterFinDateEnd} isGraphicView={isFilterFinancal} setIsGraphicView={setIsFilterFinancal} idButtons={idButtons} setIdButtons={setIdButtons}/>
                )}
                <div style={{ display: "flex" }}>
                    <PiePlotRevenue data={data} dataFiltered={sumRevenuPerColName(dataFilteredPiePlot, "center", centers, false)} dataFilteredCumul={sumRevenuPerColName(dataFilteredPiePlot, "center", centers, true)} funcFilter={setPiePlotRevenueItems} filterData={piePlotRevenueItems} dateBeg={filterPieDateBegin} dateEnd={filterPieDateEnd} setDateBeg={setFilterPieDateBegin} setDateEnd={setFilterPieDateEnd} isGraphicView={isFilterPiePlot} setIsGraphicView={setIsFilterPiePlot}/>
                    {(isFilterRevenue) && (
                        <RevenuePerEmploye data={data} dataFiltered={sumRevenuPerColNamePerDate(dataFilteredPerEmp, "worker", data, idButtons)} funcFilter={setRevenuePerEmployeItems} filterData={revenuePerEmployeItems} dateBeg={filterRevDateBegin} dateEnd={filterRevDateEnd} setDateBeg={setFilterRevDateBegin} setDateEnd={setFilterRevDateEnd} setFilterCenterEmploye={setFilterCenterEmploye} isGraphicView={isFilterRevenue} setIsGraphicView={setIsFilterRevenue}/>
                    )}
                    {(!isFilterRevenue) && (
                        <RevenuePerEmploye data={data} dataFiltered={sumRevenuPerColNamePerDay(dataFilteredPerEmp, "worker", data, idButtons)} funcFilter={setRevenuePerEmployeItems} filterData={revenuePerEmployeItems} dateBeg={filterRevDateBegin} dateEnd={filterRevDateEnd} setDateBeg={setFilterRevDateBegin} setDateEnd={setFilterRevDateEnd} setFilterCenterEmploye={setFilterCenterEmploye} isGraphicView={isFilterRevenue} setIsGraphicView={setIsFilterRevenue}/>
                    )}
                </div>
            </div>
            )}
        </div>
    </>
}