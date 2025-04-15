import "./CenterDatasView.css"
import { findNameWithId } from '../tools/tools';

export function CenterDatasTable({value, name, data} : {value: any, name: any, data: any}) {
    return (        
    <div className="table-container">
        <table>
            <thead>
            <tr>
                <th style={{ textAlign: "center" }} className="highlight">{name === "all" ? "All" : findNameWithId(data, name, "center")}</th>
                <th style={{ textAlign: "center" }}>Month</th>
                <th style={{ textAlign: "center" }}>Accumulated</th>
            </tr>
            </thead>
            <tbody>
            <tr style={{borderBottom: "black solid 0.5px"}}>
                <td style={{ fontWeight: "bold" }}>Revenue</td>
                <td>{value.month.income}</td>
                <td>{value.accumulated.income}</td>
            </tr>
            <tr style={{borderBottom: "black solid 0.5px"}}>
                <td style={{ fontWeight: "bold" }}>Costs</td>
                <td>{value.month.costs}</td>
                <td>{value.accumulated.costs}</td>
            </tr>
            <tr style={{borderBottom: "black solid 0.5px"}}>
                <td style={{ fontWeight: "bold" }}>Result</td>
                <td style={value.month.profit > 0 ? { color: "#44B635" } : { color: "#D22727" }}>{value.month.profit}</td>
                <td style={value.accumulated.profit > 0 ? { color: "#44B635" } : { color: "#D22727" }}>{value.accumulated.profit}</td>
            </tr>
            <tr>
                <td style={{ fontWeight: "bold" }}>Margin</td>
                <td>{value.month.margin}%</td>
                <td>{value.accumulated.margin}%</td>
            </tr>
            </tbody>
        </table>
    </div>
    )
}