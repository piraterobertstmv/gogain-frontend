import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { findNameWithId } from '../../tools/tools'

function getAllColNames(dataChart: any) {
    let colNames: string[] = []

    if (dataChart.length == 0)
        return []

    Object.keys(dataChart[0]).forEach(key => {
        if (key != "name")
            colNames.push(key)
    })

    return colNames
}

const months: any = {
    Jan: "January",
    Feb: "February",
    Mar: "March",
    Apr: "April",
    May: "May",
    Jun: "June",
    Jul: "July",
    Aug: "August",
    Sep: "September",
    Oct: "October",
    Nov: "November",
    Dec: "December"
};

export function CustomBarChart({ dataChart, centers, data, typeOfUnity } : { dataChart: any, centers: string[], data: any, typeOfUnity: string }) {

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          return (
            <div key={months[label]} className="custom-tooltip" style={{ backgroundColor: "rgba(0, 0, 0, 0.36)", padding: "5px" }}>
                <div style={{ color: "white" }} className="mb-3">
                    {months[label]}
                </div>
                {payload.map((value: any) => (
                    <div style={{ display: "flex" }} className="mb-1">
                        <span style={{ color: "white" }}>{`${value.name}: ${value.value}${typeOfUnity}`}</span>
                    </div>
                ))}
            </div>
          );
        }
      
        return null;
    };

    const colNames: string[] = getAllColNames(dataChart)
    const colors = ["FF9D70", "FFDDCD", "E5AB90", "CA7852", "202864", "5461C7", "6CBDFF", "5396D4"]

    const centersNames: string[] = []
    for (let i = 0; i < centers.length; i++) {
        centersNames.push(findNameWithId(data, centers[i], "center"))
    }

    return <ResponsiveContainer width={"100%"} height={300}>
        <BarChart data={dataChart} margin={{top: 20, right: 20, left: 20, bottom: 20}}>
            <CartesianGrid strokeDasharray="1 1" vertical={false} />
            <ReferenceLine y="0" stroke="black" strokeDasharray="0 0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 14, fill: '#A2A3A5' }}/>
            <YAxis axisLine={false} tickLine={false} tickMargin={10} unit={"€"}  tick={{ fontSize: 14, fill: '#A2A3A5' }}/>
            <Tooltip content={<CustomTooltip />}/>
            {colNames.map((colName, index) => (
                <Bar 
                    key={colName} 
                    dataKey={colName} 
                    stackId={`stack-${index}`} 
                    fill={`#${colors[centersNames.indexOf(colName) % 8]}`} 
                />
            ))}
        </BarChart>
    </ResponsiveContainer>
}