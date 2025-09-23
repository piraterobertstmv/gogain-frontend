import { 
    calculateCashFlowSummary, 
    calculateMonthlyCashFlow, 
    calculateDailyCashFlow,
    getCostCategoryBreakdown,
    getRevenueSourceBreakdown,
    applyFiltersToTransactions 
} from '../tools/cashFlowTools';
import { CashFlowSummary } from './cashflow/CashFlowSummary';
import { CashFlowCharts } from './cashflow/CashFlowCharts';
import { CashFlowTrends } from './cashflow/CashFlowTrends';

import { useState, useMemo } from 'react';

import "./dashboard.css"

export function CashFlow({ data, user }: { data: any, user: any }) {
    console.log('CashFlow component loaded');
    console.log('Data received:', data);
    console.log('User:', user);

    // Safe access to data with null checks
    const allCenters = useMemo(() => {
        if (!data?.center || !Array.isArray(data.center)) return [];
        return data.center.map((item: { _id: string }) => item._id);
    }, [data?.center]);
    
    const allEmployees = useMemo(() => {
        if (!data?.users || !Array.isArray(data.users)) return [];
        return data.users.map((item: { _id: string }) => item._id);
    }, [data?.users]);

    // User permissions
    const isAdmin = user?.isAdmin === true;
    const userCenterIds = user?.centers || [];
    
    const employes = useMemo(() => {
        if (!data?.users || !Array.isArray(data.users)) return [];
        return isAdmin ? allEmployees : 
            allEmployees.filter((employeeId: string) => {
                const employee = data.users.find((u: any) => u._id === employeeId);
                return employee?.centers?.some((centerIds: string) => userCenterIds.includes(centerIds));
            });
    }, [isAdmin, allEmployees, userCenterIds, data?.users]);

    const centers = isAdmin ? allCenters : userCenterIds;

    // State for filters and views
    const [filterCenterCashFlow] = useState<string[]>([]);
    const [filterCashFlowDateBegin, setFilterCashFlowDateBegin] = useState<string>("2024-01-01");
    const [filterCashFlowDateEnd, setFilterCashFlowDateEnd] = useState<string>("2025-12-31");
    const [isFilterCashFlow, setIsFilterCashFlow] = useState<boolean>(false);

    // Chart view states
    const [filterChartDateBegin, setFilterChartDateBegin] = useState<string>("2024-01-01");
    const [filterChartDateEnd, setFilterChartDateEnd] = useState<string>("2025-12-31");

    // Trend view states
    const [filterTrendDateBegin, setFilterTrendDateBegin] = useState<string>("2024-01-01");
    const [filterTrendDateEnd, setFilterTrendDateEnd] = useState<string>("2025-12-31");
    const [isFilterTrend, setIsFilterTrend] = useState<boolean>(false);

    // View toggle
    const [isGraphicView, setIsGraphicView] = useState<boolean>(false);

    // Get broader date range to include all data (2024-2026)
    const currentYear = new Date().getFullYear();
    const defaultDateRange = [`${currentYear - 1}-01-01T00:00:00.000Z`, `${currentYear + 1}-12-31T00:00:00.000Z`];

    // Enhanced filter function for cash flow data
    const applyFilterToCashFlow = (
        transactions: any[], 
        costTransactions: any[], 
        whiteListId: string[], 
        dateRange: string[], 
        centerFilter: string[]
    ) => {
        const filters = {
            centers: centerFilter.length > 0 ? centerFilter : undefined,
            employees: whiteListId,
            dateBegin: dateRange[0],
            dateEnd: dateRange[1]
        };

        return applyFiltersToTransactions(transactions, costTransactions, filters);
    };

    // Filtered data for cash flow summary
    const dataFilteredCashFlow = useMemo(() => {
        const dateRange = [
            filterCashFlowDateBegin || defaultDateRange[0],
            filterCashFlowDateEnd || defaultDateRange[1]
        ];
        
        return applyFilterToCashFlow(
            data?.transaction || [],
            data?.costTransactions || [],
            [], // employees filter (empty = all employees)
            dateRange,
            centers // centers filter - show all centers
        );
    }, [data?.transaction, data?.costTransactions, centers, filterCashFlowDateBegin, filterCashFlowDateEnd, filterCenterCashFlow]);

    // Filtered data for charts
    const dataFilteredChart = useMemo(() => {
        const dateRange = [
            filterChartDateBegin || defaultDateRange[0],
            filterChartDateEnd || defaultDateRange[1]
        ];
        
        return applyFilterToCashFlow(
            data?.transaction || [],
            data?.costTransactions || [],
            [], // employees filter (empty = all employees)
            dateRange,
            centers // centers filter - show all centers
        );
    }, [data?.transaction, data?.costTransactions, centers, filterChartDateBegin, filterChartDateEnd]);

    // Filtered data for trends
    const dataFilteredTrend = useMemo(() => {
        const dateRange = [
            filterTrendDateBegin || defaultDateRange[0],
            filterTrendDateEnd || defaultDateRange[1]
        ];
        
        return applyFilterToCashFlow(
            data?.transaction || [],
            data?.costTransactions || [],
            employes, // employees filter - show all employees
            dateRange,
            [] // centers filter (empty = all centers)
        );
    }, [data?.transaction, data?.costTransactions, employes, filterTrendDateBegin, filterTrendDateEnd]);

    return (
        <div className="main-container">
            <div className="header-section">
                <h1 className="page-title">💰 Cash Flow Analysis</h1>
                <p className="page-subtitle">Complete financial overview combining revenue and expenses</p>
                
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
                {!isGraphicView ? (
                    // Table view
                    <>
                        <div className="dashboard-section">
                            <CashFlowSummary 
                                data={data} 
                                dataFiltered={calculateCashFlowSummary(
                                    dataFilteredCashFlow.filteredTransactions,
                                    dataFilteredCashFlow.filteredCostTransactions,
                                    "center",
                                    centers
                                )}
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
                                dataFiltered={isFilterTrend ? 
                                    calculateDailyCashFlow(
                                        dataFilteredTrend.filteredTransactions,
                                        dataFilteredTrend.filteredCostTransactions,
                                        "worker",
                                        data
                                    ) :
                                    calculateMonthlyCashFlow(
                                        dataFilteredTrend.filteredTransactions,
                                        dataFilteredTrend.filteredCostTransactions,
                                        "worker",
                                        data
                                    )
                                }
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
                            revenueData={getRevenueSourceBreakdown(
                                dataFilteredChart.filteredTransactions,
                                data
                            )}
                            costData={getCostCategoryBreakdown(
                                dataFilteredChart.filteredCostTransactions,
                                data
                            )}
                            monthlyData={calculateMonthlyCashFlow(
                                dataFilteredChart.filteredTransactions,
                                dataFilteredChart.filteredCostTransactions,
                                "center",
                                data
                            )}
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
