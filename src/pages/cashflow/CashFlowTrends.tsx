import { CashFlowLineChart } from "../../components/graphics/CashFlowLineChart"
import casaPadel from '../../assets/casa_padel.svg';
import goGain from '../../assets/Logo.png';
import PSG from '../../assets/Paris_Saint-Germain_Logo.svg';

export function CashFlowTrends({ 
    dataFiltered, 
    dateBeg, 
    dateEnd, 
    setDateBeg, 
    setDateEnd, 
    isGraphicView, 
    setIsGraphicView
}: { 
    dataFiltered: any, 
    dateBeg: any, 
    dateEnd: any, 
    setDateBeg: any, 
    setDateEnd: any, 
    isGraphicView: any, 
    setIsGraphicView: any
}) {
    const styleBut: string[] = ["1px solid #DEDEDE", "1px solid #D95213"]

    // Prepare data for visualization
    const getChartData = () => {
        if (!dataFiltered || dataFiltered.length === 0) return [];
        
        return dataFiltered.map((item: any) => ({
            name: item.name,
            revenues: item.revenues || 0,
            costs: item.costs || 0,
            netProfit: item.netProfit || 0
        }));
    };

    const chartData = getChartData();

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
                        <strong style={{ fontSize: "18px" }}>📈 Cash Flow Trends</strong>
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
                    <span 
                        onClick={() => setIsGraphicView(false)} 
                        style={{ 
                            cursor: "pointer", 
                            height: "max-content", 
                            whiteSpace: "nowrap", 
                            fontSize:"16px", 
                            backgroundColor: "#FFFFFF", 
                            border: styleBut[+(!isGraphicView)], 
                            borderRadius: "8px", 
                            padding: "6px 10px 6px 10px", 
                            marginRight: "1vw"
                        }}
                    >
                        Monthly
                    </span>
                    <span 
                        onClick={() => setIsGraphicView(true)}  
                        style={{ 
                            cursor: "pointer", 
                            height: "max-content", 
                            whiteSpace: "nowrap", 
                            fontSize:"16px", 
                            backgroundColor: "#FFFFFF", 
                            border: styleBut[+(isGraphicView)],  
                            borderRadius: "8px", 
                            padding: "6px 10px 6px 10px"
                        }}
                    >
                        Daily
                    </span>
                </div>

                <div>
                    <img style={{ width: '110px', height: '80px' }} src={casaPadel} alt="My Icon" />
                    <img style={{ height: '50px' }} src={goGain} alt="My Icon" />
                    <img style={{ width: '110px', height: '60px' }} src={PSG} alt="My Icon" />
                </div>
            </div>
            

            {/* Chart Display */}
            <div style={{ width: "100%", height: "500px", padding: "20px" }}>
                <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
                    {isGraphicView ? "📅 Daily Cash Flow Trends" : "📊 Monthly Cash Flow Trends"}
                </h3>
                
                {chartData.length > 0 ? (
                        <CashFlowLineChart 
                            data={chartData}
                        />
                ) : (
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "center", 
                        alignItems: "center", 
                        height: "100%",
                        color: "#6c757d",
                        fontSize: "18px"
                    }}>
                        📊 No data available for the selected filters and date range
                    </div>
                )}
            </div>

            {/* Summary Table */}
            {chartData.length > 0 && (
                <div style={{ width: "100%", padding: "20px", borderTop: "1px solid #dee2e6" }}>
                    <h4 style={{ marginBottom: "15px" }}>📋 Detailed Breakdown</h4>
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa" }}>
                                <tr>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                                        {isGraphicView ? "Date" : "Month"}
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #dee2e6" }}>💰 Revenue</th>
                                    <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #dee2e6" }}>💸 Costs</th>
                                    <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #dee2e6" }}>📈 Net Profit</th>
                                    <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #dee2e6" }}>📊 Margin %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chartData.map((item: any, index: number) => {
                                    const margin = item.revenues > 0 ? ((item.netProfit / item.revenues) * 100) : 0;
                                    return (
                                        <tr key={index} style={{ borderBottom: "1px solid #dee2e6" }}>
                                            <td style={{ padding: "12px" }}>
                                                {item.name}
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "right", color: "#28a745" }}>
                                                €{item.revenues.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "right", color: "#dc3545" }}>
                                                €{item.costs.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ 
                                                padding: "12px", 
                                                textAlign: "right", 
                                                color: item.netProfit >= 0 ? "#28a745" : "#dc3545",
                                                fontWeight: "bold"
                                            }}>
                                                €{item.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ 
                                                padding: "12px", 
                                                textAlign: "right", 
                                                color: margin >= 0 ? "#28a745" : "#dc3545"
                                            }}>
                                                {margin.toFixed(1)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
