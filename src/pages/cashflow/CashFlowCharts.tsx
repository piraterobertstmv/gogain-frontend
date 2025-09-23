import { CashFlowPieChart } from "../../components/graphics/CashFlowPieChart"
import { CashFlowLineChart } from "../../components/graphics/CashFlowLineChart"
import { CashFlowBarChart } from "../../components/graphics/CashFlowBarChart"
import { useState } from 'react'
import casaPadel from '../../assets/casa_padel.svg';
import goGain from '../../assets/Logo.png';
import PSG from '../../assets/Paris_Saint-Germain_Logo.svg';

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CashFlowCharts({ 
    revenueData, 
    costData,
    monthlyData,
    dateBeg, 
    dateEnd, 
    setDateBeg, 
    setDateEnd
}: { 
    revenueData: any,
    costData: any,
    monthlyData: any,
    dateBeg: any, 
    dateEnd: any, 
    setDateBeg: any, 
    setDateEnd: any
}) {
    const [chartView, setChartView] = useState(0); // 0: Overview, 1: Revenue Sources, 2: Cost Categories, 3: Monthly Trends


    // Prepare monthly trend data for line chart
    const getMonthlyTrendData = () => {
        return monthlyData.map((month: any, index: number) => ({
            name: months[index],
            revenues: month.revenues || 0,
            costs: month.costs || 0,
            netProfit: month.netProfit || 0
        }));
    };

    const monthlyTrendData = getMonthlyTrendData();

    const renderChart = () => {
        switch (chartView) {
            case 0: // Overview - Revenue vs Costs by Month
                return (
                    <div style={{ width: "100%", height: "500px" }}>
                        <h3 style={{ textAlign: "center", marginBottom: "20px" }}>📊 Monthly Revenue vs Costs</h3>
                        <CashFlowLineChart 
                            data={monthlyTrendData}
                        />
                    </div>
                );
            
            case 1: // Revenue Sources Pie Chart
                return (
                    <div style={{ width: "100%", height: "600px", marginBottom: "40px" }}>
                        <h3 style={{ textAlign: "center", marginBottom: "30px" }}>💰 Revenue by Source</h3>
                        <CashFlowPieChart 
                            data={revenueData}
                            title="Revenue Sources"
                        />
                    </div>
                );
            
            case 2: // Cost Categories Pie Chart
                return (
                    <div style={{ width: "100%", height: "600px", marginBottom: "40px" }}>
                        <h3 style={{ textAlign: "center", marginBottom: "30px" }}>💸 Expenses by Category</h3>
                        <CashFlowPieChart 
                            data={costData}
                            title="Cost Categories"
                        />
                    </div>
                );
            
            case 3: // Net Profit Trend
                return (
                    <div style={{ width: "100%", height: "500px" }}>
                        <h3 style={{ textAlign: "center", marginBottom: "20px" }}>📈 Net Profit Trend</h3>
                        <CashFlowBarChart 
                            data={monthlyTrendData.map((month: any) => ({
                                name: month.name,
                                value: month.netProfit
                            }))}
                        />
                    </div>
                );
            
            default:
                return renderChart();
        }
    };

    return (
        <div style={{ 
            display: "flex", 
            width:"80vw", 
            flexDirection: "column", 
            alignItems: "flex-start", 
            margin:"3vw 3vw 1vw 3vw", 
            backgroundColor: "#FFFFFF", 
            borderRadius: "8px", 
            height: "max-content", 
            boxShadow: "0px 0px 4px 0px #00000040"
        }}>
            <div style={{ 
                display: "flex", 
                alignItems: "center", 
                width: "-webkit-fill-available", 
                justifyContent: "space-between" 
            }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ margin: "2vw" }}>
                        <strong style={{ fontSize: "18px" }}>📈 Cash Flow Charts</strong>
                    </div>
                    <input 
                        style={{ width: "9vw", marginRight: "1vw" }} 
                        aria-label="Date" 
                        value={dateBeg.slice(0, 10)} 
                        type="date" 
                        onChange={(e) => {setDateBeg(e.target.value)}} 
                        className="form-control"
                    />
                    <input 
                        style={{ width: "9vw", marginRight: "1vw" }} 
                        aria-label="Date" 
                        value={dateEnd.slice(0, 10)} 
                        type="date" 
                        onChange={(e) => {setDateEnd(e.target.value)}} 
                        className="form-control"
                    />
                </div>

                <div>
                    <img style={{ width: '110px', height: '80px' }} src={casaPadel} alt="My Icon" />
                    <img style={{ height: '50px' }} src={goGain} alt="My Icon" />
                    <img style={{ width: '110px', height: '60px' }} src={PSG} alt="My Icon" />
                </div>
            </div>
            
            {/* Chart Type Selector */}
            <div style={{ margin: "0vw 1vw 1vw 1vw", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {[
                    { id: 0, label: "📊 Overview", icon: "📊" },
                    { id: 1, label: "💰 Revenue Sources", icon: "💰" },
                    { id: 2, label: "💸 Cost Categories", icon: "💸" },
                    { id: 3, label: "📈 Profit Trend", icon: "📈" }
                ].map(chart => (
                    <button
                        key={chart.id}
                        onClick={() => setChartView(chart.id)}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: chartView === chart.id ? "#D95213" : "#FFFFFF",
                            color: chartView === chart.id ? "#FFFFFF" : "#D95213",
                            border: "2px solid #D95213",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        {chart.icon} {chart.label}
                    </button>
                ))}
            </div>
            

            {/* Chart Display */}
            <div style={{ width: "100%", padding: "20px" }}>
                {renderChart()}
            </div>

            {/* Summary Statistics */}
            <div style={{ width: "100%", padding: "20px", borderTop: "1px solid #dee2e6" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                    <div style={{ 
                        padding: "20px", 
                        backgroundColor: "#f8f9fa", 
                        borderRadius: "8px",
                        textAlign: "center"
                    }}>
                        <h4 style={{ color: "#28a745", margin: "0 0 10px 0" }}>💰 Total Revenue</h4>
                        <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#28a745" }}>
                            €{revenueData.reduce((sum: number, item: any) => sum + item.value, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    
                    <div style={{ 
                        padding: "20px", 
                        backgroundColor: "#f8f9fa", 
                        borderRadius: "8px",
                        textAlign: "center"
                    }}>
                        <h4 style={{ color: "#dc3545", margin: "0 0 10px 0" }}>💸 Total Costs</h4>
                        <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#dc3545" }}>
                            €{costData.reduce((sum: number, item: any) => sum + item.value, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    
                    <div style={{ 
                        padding: "20px", 
                        backgroundColor: "#f8f9fa", 
                        borderRadius: "8px",
                        textAlign: "center"
                    }}>
                        <h4 style={{ color: "#007bff", margin: "0 0 10px 0" }}>📈 Net Profit</h4>
                        <p style={{ 
                            fontSize: "24px", 
                            fontWeight: "bold", 
                            margin: 0, 
                            color: (revenueData.reduce((sum: number, item: any) => sum + item.value, 0) - costData.reduce((sum: number, item: any) => sum + item.value, 0)) >= 0 ? "#28a745" : "#dc3545"
                        }}>
                            €{(revenueData.reduce((sum: number, item: any) => sum + item.value, 0) - costData.reduce((sum: number, item: any) => sum + item.value, 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    
                    <div style={{ 
                        padding: "20px", 
                        backgroundColor: "#f8f9fa", 
                        borderRadius: "8px",
                        textAlign: "center"
                    }}>
                        <h4 style={{ color: "#6c757d", margin: "0 0 10px 0" }}>📊 Profit Margin</h4>
                        <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#6c757d" }}>
                            {(() => {
                                const totalRevenue = revenueData.reduce((sum: number, item: any) => sum + item.value, 0);
                                const totalCosts = costData.reduce((sum: number, item: any) => sum + item.value, 0);
                                const margin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue * 100) : 0;
                                return `${margin.toFixed(1)}%`;
                            })()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
