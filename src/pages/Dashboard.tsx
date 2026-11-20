import { findNameWithId } from '../tools/tools';
import { dateRangeBounds, dayKey, isInRange, monthKey, monthsBetween, netAmount, round2 } from '../tools/finance';
import { useAggregateEntries } from '../services/serverData';
import { FinancialTransaction } from "./dashboard/FinancialTransaction";
import { PiePlotRevenue } from "./dashboard/PiePlotRevenue";
import { RevenuePerEmploye } from './dashboard/RevenuePerEmploye';
import { CenterDatasView } from './CenterDatasView'

import { useEffect, useState, useMemo } from 'react';

import "./dashboard.css"

const NO_IDS: string[] = [];

// Memoised id -> display name for one collection ("center", "users", ...) during a calculation
function makeNameLookup(data: any, colInData: string) {
    const cache = new Map<string, string>();
    return (id: string) => {
        if (!cache.has(id)) cache.set(id, findNameWithId(data, id, colInData));
        return cache.get(id) as string;
    };
}

// Entries (revenues + costs from both collections) whose `colName` is in `whiteListId`,
// dated within [dateBegin, dateEnd] (whole days) and, optionally, in one of `centerFilter`.
function applyFilter(entries: any[], colName: string, whiteListId: string[], dateBegin: string, dateEnd: string, centerFilter: string[]) {
    const allowed = new Set(whiteListId);
    const centers = new Set(centerFilter);
    const bounds = dateRangeBounds(dateBegin, dateEnd);

    return entries.filter((value: any) =>
        allowed.has(value[colName]) &&
        isInRange(value, bounds) &&
        (centers.size === 0 || centers.has(value.center))
    );
}

// Totals per entity (e.g. per center): revenues, costs and value (= revenue − costs, or revenue only when cumulative)
function sumRevenuPerColName(dataFiltered: any[], colName: string, arrOfCol: string[], isCumul: boolean) {
    return arrOfCol.map((id: string) => {
        let revenues = 0;
        let costs = 0;

        dataFiltered.forEach((value: any) => {
            if (value[colName] !== id) return;
            const amount = netAmount(value);
            if (value.typeOfTransaction === "cost") costs += amount;
            else if (value.typeOfTransaction === "revenue") revenues += amount;
        });

        return {
            name: id,
            value: round2(isCumul ? revenues : revenues - costs),
            costs: round2(costs),
            revenues: round2(revenues)
        };
    });
}

// idCalculus: 0 = revenue, 1 = costs, 2 = result (revenue − costs), 3 = margin %
function addToBucket(bucket: any, name: string, value: any, idCalculus: number) {
    const amount = netAmount(value);
    const isCost = value.typeOfTransaction === "cost";

    switch (idCalculus) {
        case 0: if (!isCost) bucket[name] += amount; break;
        case 1: if (isCost) bucket[name] += amount; break;
        case 2: bucket[name] += isCost ? -amount : amount; break;
        case 3:
            if (isCost) bucket.__margin[name].cost += amount;
            else bucket.__margin[name].revenue += amount;
            break;
    }
}

function finalizeBuckets(buckets: any[], idCalculus: number) {
    return buckets.map((bucket) => {
        const { __margin, ...row } = bucket;
        Object.keys(row).forEach((key) => {
            if (key === "name") return;
            if (idCalculus === 3) {
                const { revenue, cost } = __margin[key];
                row[key] = revenue === 0 ? 0 : ((revenue - cost) / revenue) * 100;
            }
            row[key] = round2(row[key]);
        });
        return row;
    });
}

function emptyBucket(name: string, entityNames: string[]) {
    const bucket: any = { name, __margin: {} };
    entityNames.forEach((entityName) => {
        bucket[entityName] = 0;
        bucket.__margin[entityName] = { cost: 0, revenue: 0 };
    });
    return bucket;
}

// One row per month between dateBegin and dateEnd, one column per entity.
// Months are keyed by year+month, so the same month of different years is no longer merged.
function sumRevenuPerColNamePerDate(dataFiltered: any[], colName: string, data: any, idCalculus: number, dateBegin: string, dateEnd: string) {
    const nameOf = makeNameLookup(data, colName === "worker" ? "users" : colName);
    const entityNames = [...new Set(dataFiltered.map((value: any) => nameOf(value[colName])))];
    const periods = monthsBetween(dateBegin, dateEnd);
    const indexByKey = new Map(periods.map((period, i) => [period.key, i]));
    const buckets = periods.map((period) => emptyBucket(period.label, entityNames));

    dataFiltered.forEach((value: any) => {
        const index = indexByKey.get(monthKey(value.date));
        if (index === undefined) return;
        addToBucket(buckets[index], nameOf(value[colName]), value, idCalculus);
    });

    return finalizeBuckets(buckets, idCalculus);
}

// One row per day that has data (sorted, zero-padded UTC keys), one column per entity.
function sumRevenuPerColNamePerDay(dataFiltered: any[], colName: string, data: any, idCalculus: number) {
    const nameOf = makeNameLookup(data, colName === "worker" ? "users" : colName);
    const entityNames = [...new Set(dataFiltered.map((value: any) => nameOf(value[colName])))];
    const days = [...new Set(dataFiltered.map((value: any) => dayKey(value.date)))].sort();
    const indexByKey = new Map(days.map((day, i) => [day, i]));
    const buckets = days.map((day) => emptyBucket(day, entityNames));

    dataFiltered.forEach((value: any) => {
        const index = indexByKey.get(dayKey(value.date));
        if (index === undefined) return;
        addToBucket(buckets[index], nameOf(value[colName]), value, idCalculus);
    });

    return finalizeBuckets(buckets, idCalculus);
}

export function Dashboard({ data, user }: { data: any, user?: any }) {
    // Get initial date values
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthNumber = now.getMonth() + 1;
    const maxDays = new Date(currentYear, monthNumber, 0).getDate();

    const [financialTransItems, setFinancialTransItems] = useState<string[]>([]);
    const [piePlotRevenueItems, setPiePlotRevenueItems] = useState<string[]>([]);
    const [revenuePerEmployeItems, setRevenuePerEmployeItems] = useState<string[]>([]);

    const [isFilterFinancal, setIsFilterFinancal] = useState<boolean>(true);
    const [isFilterPiePlot, setIsFilterPiePlot] = useState<boolean>(true);
    const [isFilterRevenue, setIsFilterRevenue] = useState<boolean>(true);
    const [isGraphicView, setIsGraphicView] = useState<boolean>(false);
    const [idButtons, setIdButtons] = useState<number>(0);

    // Initialize centers and employees based on user permissions
    const isAdmin = user?.isAdmin === true;
    const userCenterIds: string[] = user?.centers || NO_IDS;


    const allCenters = useMemo(() => {
        if (!data?.center || !Array.isArray(data.center)) return NO_IDS;
        return data.center.map((item: { _id: string }) => item._id);
    }, [data?.center]);

    const allEmployees = useMemo(() => {
        if (!data?.users || !Array.isArray(data.users)) return NO_IDS;
        return data.users.map((item: { _id: string }) => item._id);
    }, [data?.users]);

    // For admins: all centers and employees. For regular users: their centers and related employees.
    const centers = useMemo(() => {
        if (isAdmin) return allCenters;
        const filteredCenters = userCenterIds.filter((centerId: string) => allCenters.includes(centerId));
        return filteredCenters.length > 0 ? filteredCenters : allCenters;
    }, [isAdmin, allCenters, userCenterIds]);

    const employes = useMemo(() => {
        if (!data?.users || !Array.isArray(data.users)) return NO_IDS;
        if (isAdmin) return allEmployees;
        const filteredEmployees = allEmployees.filter((employeeId: string) => {
            const employee = data.users.find((u: any) => u._id === employeeId);
            return employee?.centers?.some((centerIds: string) => userCenterIds.includes(centerIds));
        });
        return filteredEmployees.length > 0 ? filteredEmployees : allEmployees;
    }, [isAdmin, allEmployees, userCenterIds, data?.users]);

    // Initialize date filters with proper formatting
    const formatDate = (year: number, month: number, day: number) => {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const [filterFinDateBegin, setFilterFinDateBegin] = useState<string>(formatDate(currentYear, 1, 1));
    const [filterFinDateEnd, setFilterFinDateEnd] = useState<string>(formatDate(currentYear, 12, 31));
    const [filterPieDateBegin, setFilterPieDateBegin] = useState<string>(formatDate(currentYear, 1, 1));
    const [filterPieDateEnd, setFilterPieDateEnd] = useState<string>(formatDate(currentYear, 12, 31));
    const [filterRevDateBegin, setFilterRevDateBegin] = useState<string>(formatDate(currentYear, 1, 1));
    const [filterRevDateEnd, setFilterRevDateEnd] = useState<string>(formatDate(currentYear, 12, 31));
    const [filterCenterEmploye, setFilterCenterEmploye] = useState<string[]>([]);

    const styleBut: string[] = ["1px solid #DEDEDE", "1px solid #D95213"];

    const differenceInDays = Math.abs(new Date(filterFinDateBegin).getTime() - new Date(filterFinDateEnd).getTime()) / (1000 * 60 * 60 * 24);

    // Select every center/employee by default. Only re-run when the available lists change
    // (it used to also run on every data/filter change, wiping the user's checkbox choices).
    useEffect(() => {
        setFinancialTransItems(centers);
        setPiePlotRevenueItems(centers);
    }, [centers]);

    useEffect(() => {
        setRevenuePerEmployeItems(employes);
    }, [employes]);

    // "This month" / "This year" toggles
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

    // Totals computed by the server (GET /reports/aggregate) for each chart's own date range.
    // They come back as one summary entry per entity and period (revenues and costs from both
    // collections, excluding taxes), so the calculations below work exactly as before.
    const financialAgg = useAggregateEntries({ from: filterFinDateBegin, to: filterFinDateEnd, by: 'center', period: differenceInDays <= 31 ? 'day' : 'month' });
    const pieAgg = useAggregateEntries({ from: filterPieDateBegin, to: filterPieDateEnd, by: 'center' });
    // The employee chart's center filter is applied on the server (the totals are grouped by worker)
    const employeeAgg = useAggregateEntries({ from: filterRevDateBegin, to: filterRevDateEnd, by: 'worker', period: isFilterRevenue ? 'month' : 'day', center: filterCenterEmploye });

    // "Center Datas" view: all-time totals and current-month totals per center (only fetched when shown)
    const monthRange = { from: formatDate(currentYear, monthNumber, 1), to: formatDate(currentYear, monthNumber, maxDays) };
    const centerAllTimeAgg = useAggregateEntries(isGraphicView ? { by: 'center' } : null);
    const centerMonthAgg = useAggregateEntries(isGraphicView ? { by: 'center', ...monthRange } : null);

    const dataFilteredFinancial = useMemo(
        () => applyFilter(financialAgg.entries, "center", financialTransItems, filterFinDateBegin, filterFinDateEnd, NO_IDS),
        [financialAgg.entries, financialTransItems, filterFinDateBegin, filterFinDateEnd]
    );
    const dataFilteredPiePlot = useMemo(
        () => applyFilter(pieAgg.entries, "center", piePlotRevenueItems, filterPieDateBegin, filterPieDateEnd, NO_IDS),
        [pieAgg.entries, piePlotRevenueItems, filterPieDateBegin, filterPieDateEnd]
    );
    const dataFilteredPerEmp = useMemo(
        () => applyFilter(employeeAgg.entries, "worker", revenuePerEmployeItems, filterRevDateBegin, filterRevDateEnd, NO_IDS),
        [employeeAgg.entries, revenuePerEmployeItems, filterRevDateBegin, filterRevDateEnd]
    );
    const reportError = financialAgg.error || pieAgg.error || employeeAgg.error || centerAllTimeAgg.error || centerMonthAgg.error;

    const financialChartData = useMemo(() => differenceInDays <= 31
        ? sumRevenuPerColNamePerDay(dataFilteredFinancial, "center", data, idButtons)
        : sumRevenuPerColNamePerDate(dataFilteredFinancial, "center", data, idButtons, filterFinDateBegin, filterFinDateEnd),
        [dataFilteredFinancial, data, idButtons, differenceInDays, filterFinDateBegin, filterFinDateEnd]
    );
    const pieResult = useMemo(() => sumRevenuPerColName(dataFilteredPiePlot, "center", centers, false), [dataFilteredPiePlot, centers]);
    const pieRevenue = useMemo(() => sumRevenuPerColName(dataFilteredPiePlot, "center", centers, true), [dataFilteredPiePlot, centers]);
    const employeeChartData = useMemo(() => isFilterRevenue
        ? sumRevenuPerColNamePerDate(dataFilteredPerEmp, "worker", data, idButtons, filterRevDateBegin, filterRevDateEnd)
        : sumRevenuPerColNamePerDay(dataFilteredPerEmp, "worker", data, idButtons),
        [dataFilteredPerEmp, data, idButtons, isFilterRevenue, filterRevDateBegin, filterRevDateEnd]
    );

    return <>
        <div>
            <div style={{ padding: "3vw 3vw 0vw 3vw", display: "flex", justifyContent: "space-between"}}>
                <span onClick={() => setIsGraphicView(true)} style={{ cursor: "pointer", whiteSpace: "nowrap", fontSize:"16px", backgroundColor: "#FFFFFF", border: styleBut[+(isGraphicView)], borderRadius: "8px", padding: "10px 15vw 10px 17vw"}}>Center Datas</span>
                <span onClick={() => setIsGraphicView(false)}  style={{ cursor: "pointer", whiteSpace: "nowrap", fontSize:"16px", backgroundColor: "#FFFFFF", border: styleBut[+(!isGraphicView)], borderRadius: "8px", padding: "10px 17vw 10px 15vw"}}>Graphics</span>
            </div>
            {reportError && (
                <div className="alert alert-danger" style={{ margin: "1vw 3vw" }}>Could not load report totals: {reportError}</div>
            )}
            {(isGraphicView) && (
                <CenterDatasView data={data} allTimeEntries={centerAllTimeAgg.entries} monthEntries={centerMonthAgg.entries}/>
            )}
            {(!isGraphicView) && (
            <div>
                <FinancialTransaction data={data} dataFiltered={financialChartData} funcFilter={setFinancialTransItems} filterData={financialTransItems} dateBeg={filterFinDateBegin} dateEnd={filterFinDateEnd} setDateBeg={setFilterFinDateBegin} setDateEnd={setFilterFinDateEnd} isGraphicView={isFilterFinancal} setIsGraphicView={setIsFilterFinancal} idButtons={idButtons} setIdButtons={setIdButtons}/>
                <div style={{ display: "flex" }}>
                    <PiePlotRevenue data={data} dataFiltered={pieResult} dataFilteredCumul={pieRevenue} funcFilter={setPiePlotRevenueItems} filterData={piePlotRevenueItems} dateBeg={filterPieDateBegin} dateEnd={filterPieDateEnd} setDateBeg={setFilterPieDateBegin} setDateEnd={setFilterPieDateEnd} isGraphicView={isFilterPiePlot} setIsGraphicView={setIsFilterPiePlot}/>
                    <RevenuePerEmploye data={data} dataFiltered={employeeChartData} funcFilter={setRevenuePerEmployeItems} filterData={revenuePerEmployeItems} dateBeg={filterRevDateBegin} dateEnd={filterRevDateEnd} setDateBeg={setFilterRevDateBegin} setDateEnd={setFilterRevDateEnd} setFilterCenterEmploye={setFilterCenterEmploye} isGraphicView={isFilterRevenue} setIsGraphicView={setIsFilterRevenue}/>
                </div>
            </div>
            )}
        </div>
    </>
}
