import {
    calculateCashFlowSummary,
    calculateMonthlyCashFlow,
    calculateDailyCashFlow,
    getCostCategoryBreakdown,
    getRevenueSourceBreakdown,
    applyFiltersToTransactions
} from '../tools/cashFlowTools';
import { currentYearRange } from '../tools/finance';
import { useAggregateEntries } from '../services/serverData';
import { CashFlowSummary } from './cashflow/CashFlowSummary';
import { CashFlowCharts } from './cashflow/CashFlowCharts';
import { CashFlowTrends } from './cashflow/CashFlowTrends';

import { useState, useMemo, useEffect } from 'react';

import "./dashboard.css"

const NO_IDS: string[] = [];

function currentMonthRange(): { begin: string, end: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    const mm = String(month).padStart(2, '0');
    return { begin: `${year}-${mm}-01`, end: `${year}-${mm}-${String(lastDay).padStart(2, '0')}` };
}

export function CashFlow({ data, user }: { data: any, user: any }) {
    const allCenters = useMemo(() => {
        if (!data?.center || !Array.isArray(data.center)) return NO_IDS;
        return data.center.map((item: { _id: string }) => item._id);
    }, [data?.center]);

    const allEmployees = useMemo(() => {
        if (!data?.users || !Array.isArray(data.users)) return NO_IDS;
        return data.users.map((item: { _id: string }) => item._id);
    }, [data?.users]);

    // User permissions
    const isAdmin = user?.isAdmin === true;
    const userCenterIds: string[] = user?.centers || NO_IDS;

    const employes = useMemo(() => {
        if (!data?.users || !Array.isArray(data.users)) return NO_IDS;
        return isAdmin ? allEmployees :
            allEmployees.filter((employeeId: string) => {
                const employee = data.users.find((u: any) => u._id === employeeId);
                return employee?.centers?.some((centerIds: string) => userCenterIds.includes(centerIds));
            });
    }, [isAdmin, allEmployees, userCenterIds, data?.users]);

    const centers = isAdmin ? allCenters : userCenterIds;

    // Default to the current year (was hard-coded to 2024-01-01 … 2025-12-31, hiding all 2026 data)
    const yearRange = currentYearRange();

    // Summary
    const [filterCashFlowDateBegin, setFilterCashFlowDateBegin] = useState<string>(yearRange.begin);
    const [filterCashFlowDateEnd, setFilterCashFlowDateEnd] = useState<string>(yearRange.end);
    const [isFilterCashFlow, setIsFilterCashFlow] = useState<boolean>(true); // true = "This year"

    // Charts
    const [filterChartDateBegin, setFilterChartDateBegin] = useState<string>(yearRange.begin);
    const [filterChartDateEnd, setFilterChartDateEnd] = useState<string>(yearRange.end);

    // Trends
    const [filterTrendDateBegin, setFilterTrendDateBegin] = useState<string>(yearRange.begin);
    const [filterTrendDateEnd, setFilterTrendDateEnd] = useState<string>(yearRange.end);
    const [isFilterTrend, setIsFilterTrend] = useState<boolean>(false); // false = monthly, true = daily

    // View toggle
    const [isGraphicView, setIsGraphicView] = useState<boolean>(false);

    // The summary's "This month" / "This year" buttons now actually set the date range
    useEffect(() => {
        const range = isFilterCashFlow ? currentYearRange() : currentMonthRange();
        setFilterCashFlowDateBegin(range.begin);
        setFilterCashFlowDateEnd(range.end);
    }, [isFilterCashFlow]);

    // Totals come from the server (GET /reports/aggregate): revenues and costs from both
    // collections, excluding taxes. Regular users are limited to their centers on the server.
    const centerParam = isAdmin ? undefined : userCenterIds;
    const summaryAgg = useAggregateEntries({ from: filterCashFlowDateBegin, to: filterCashFlowDateEnd, by: 'center', center: centerParam });
    const trendAgg = useAggregateEntries({ from: filterTrendDateBegin, to: filterTrendDateEnd, by: 'worker', period: isFilterTrend ? 'day' : 'month' });
    const chartByServiceAgg = useAggregateEntries(isGraphicView ? { from: filterChartDateBegin, to: filterChartDateEnd, by: 'service', center: centerParam } : null);
    const chartMonthlyAgg = useAggregateEntries(isGraphicView ? { from: filterChartDateBegin, to: filterChartDateEnd, by: 'center', period: 'month', center: centerParam } : null);
    const reportError = summaryAgg.error || trendAgg.error || chartByServiceAgg.error || chartMonthlyAgg.error;

    const split = (entries: any[]) => ({
        revenues: entries.filter(e => e.typeOfTransaction === 'revenue'),
        costs: entries.filter(e => e.typeOfTransaction === 'cost'),
    });

    const summaryData = useMemo(() => {
        const { revenues, costs } = split(summaryAgg.entries);
        return calculateCashFlowSummary(revenues, costs, "center", centers);
    }, [summaryAgg.entries, centers]);

    const trendData = useMemo(() => {
        const { revenues, costs } = split(trendAgg.entries);
        // Keep the existing employee restriction (only employees sharing the user's centers)
        const filtered = applyFiltersToTransactions(revenues, costs, { employees: employes, dateBegin: filterTrendDateBegin, dateEnd: filterTrendDateEnd });
        return isFilterTrend
            ? calculateDailyCashFlow(filtered.filteredTransactions, filtered.filteredCostTransactions, "worker", data)
            : calculateMonthlyCashFlow(filtered.filteredTransactions, filtered.filteredCostTransactions, "worker", data, filterTrendDateBegin, filterTrendDateEnd);
    }, [trendAgg.entries, employes, isFilterTrend, data, filterTrendDateBegin, filterTrendDateEnd]);

    const chartRevenueData = useMemo(() => getRevenueSourceBreakdown(split(chartByServiceAgg.entries).revenues, data), [chartByServiceAgg.entries, data]);
    const chartCostData = useMemo(() => getCostCategoryBreakdown(split(chartByServiceAgg.entries).costs, data), [chartByServiceAgg.entries, data]);
    const chartMonthlyData = useMemo(() => {
        const { revenues, costs } = split(chartMonthlyAgg.entries);
        return calculateMonthlyCashFlow(revenues, costs, "center", data, filterChartDateBegin, filterChartDateEnd);
    }, [chartMonthlyAgg.entries, data, filterChartDateBegin, filterChartDateEnd]);

    return (
        <div className="main-container">
            <div className="header-section">
                <h1 className="page-title">💰 Cash Flow Analysis</h1>
                <p className="page-subtitle">Complete financial overview combining revenue and expenses (amounts excluding taxes)</p>

                {/* Toggle between table and graphics view */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: "20px",
                    marginBottom: "20px"
                }}>
                    <button
                        onClick={() => setIsGraphicView(false)}
                        style={{
                            padding: "10px 20px",
                            marginRight: "10px",
                            backgroundColor: !isGraphicView ? "#D95213" : "#FFFFFF",
                            color: !isGraphicView ? "#FFFFFF" : "#D95213",
                            border: "2px solid #D95213",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        📊 Financial Tables
                    </button>
                    <button
                        onClick={() => setIsGraphicView(true)}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: isGraphicView ? "#D95213" : "#FFFFFF",
                            color: isGraphicView ? "#FFFFFF" : "#D95213",
                            border: "2px solid #D95213",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        📈 Charts & Graphs
                    </button>
                </div>
            </div>

            <div className="dashboard-content">
                {reportError && (
                    <div className="alert alert-danger" style={{ margin: "1vw 3vw" }}>Could not load report totals: {reportError}</div>
                )}
                {!isGraphicView ? (
                    // Table view
                    <>
                        <div className="dashboard-section">
                            <CashFlowSummary
                                data={data}
                                dataFiltered={summaryData}
                                dateBeg={filterCashFlowDateBegin}
                                dateEnd={filterCashFlowDateEnd}
                                setDateBeg={setFilterCashFlowDateBegin}
                                setDateEnd={setFilterCashFlowDateEnd}
                                isGraphicView={isFilterCashFlow}
                                setIsGraphicView={setIsFilterCashFlow}
                            />
                        </div>

                        <div className="dashboard-section">
                            <CashFlowTrends
                                dataFiltered={trendData}
                                dateBeg={filterTrendDateBegin}
                                dateEnd={filterTrendDateEnd}
                                setDateBeg={setFilterTrendDateBegin}
                                setDateEnd={setFilterTrendDateEnd}
                                isGraphicView={isFilterTrend}
                                setIsGraphicView={setIsFilterTrend}
                            />
                        </div>
                    </>
                ) : (
                    // Graphics view
                    <div className="dashboard-section">
                        <CashFlowCharts
                            revenueData={chartRevenueData}
                            costData={chartCostData}
                            monthlyData={chartMonthlyData}
                            dateBeg={filterChartDateBegin}
                            dateEnd={filterChartDateEnd}
                            setDateBeg={setFilterChartDateBegin}
                            setDateEnd={setFilterChartDateEnd}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
