import { CashFlowLineChart } from "../../components/graphics/CashFlowLineChart"
import { findNameWithId } from '../../tools/tools';
import casaPadel from '../../assets/casa_padel.svg';
import goGain from '../../assets/Logo.png';
import PSG from '../../assets/Paris_Saint-Germain_Logo.svg';

export function CashFlowSummary({ 
    data, 
    dataFiltered, 
    dateBeg, 
    dateEnd, 
    setDateBeg, 
    setDateEnd, 
    isGraphicView, 
    setIsGraphicView 
}: { 
    data: any, 
    dataFiltered: any, 
    dateBeg: any, 
    dateEnd: any, 
    setDateBeg: any, 
    setDateEnd: any, 
    isGraphicView: any, 
    setIsGraphicView: any 
}) {

    const styleBut: string[] = ["1px solid #DEDEDE", "1px solid #D95213"]

    // Prepare data for visualization - Line chart needs all three metrics
    const getLineChartData = () => {
        return dataFiltered.map((item: any) => ({
            name: findNameWithId(data, item.name, "center"),
            revenues: item.revenues,
            costs: item.costs,
            netProfit: item.netProfit
        }));
    };

    const lineChartData = getLineChartData();

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
                        <strong style={{ fontSize: "18px" }}>💰 Cash Flow Summary</strong>
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
                        This month
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
                        This year
                    </span>
                </div>

                <div>
                    <img style={{ width: '110px', height: '80px' }} src={casaPadel} alt="My Icon" />
                    <img style={{ height: '50px' }} src={goGain} alt="My Icon" />
                    <img style={{ width: '110px', height: '60px' }} src={PSG} alt="My Icon" />
                </div>
            </div>
            

            <div style={{ width: "100%", height: "400px", padding: "20px" }}>
                <CashFlowLineChart 
                    data={lineChartData}
                />
            </div>

            {/* Summary Table */}
            <div style={{ width: "100%", padding: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8f9fa" }}>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Center</th>
                            <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #dee2e6" }}>💰 Revenue</th>
                            <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #dee2e6" }}>💸 Costs</th>
                            <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #dee2e6" }}>📈 Net Profit</th>
                            <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #dee2e6" }}>📊 Margin %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataFiltered.map((item: any) => {
                            const margin = item.revenues > 0 ? ((item.netProfit / item.revenues) * 100) : 0;
                            return (
                                <tr key={item.name} style={{ borderBottom: "1px solid #dee2e6" }}>
                                    <td style={{ padding: "12px" }}>
                                        {findNameWithId(data, item.name, "center")}
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
    );
}
