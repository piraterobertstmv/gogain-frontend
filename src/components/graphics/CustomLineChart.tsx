import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

export function CustomLineChart({ dataChart, employes, data, colName } : { dataChart: any, employes: string[], data: any, colName: string }) {
    const colNames: string[] = getAllColNames(dataChart)
    const colors = ["FF9D70", "FFDDCD", "E5AB90", "CA7852", "202864", "5461C7", "6CBDFF", "5396D4"]

    const employesNames: string[] = []
    for (let i = 0; i < employes.length; i++) {
        employesNames.push(findNameWithId(data, employes[i], colName))
    }

    return <ResponsiveContainer width="100%" height={400}>
        <LineChart
            width={500}
            height={300}
            data={dataChart}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
        >
        <CartesianGrid strokeDasharray="1 1" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10}/>
        <YAxis axisLine={false} tickLine={false} tickMargin={10}/>
        <Tooltip />
        {colNames.map((colName, _) => (
            <Line 
                type="monotone"
                key={colName} 
                dataKey={colName}
                stroke={`#${colors[employesNames.indexOf(colName) % 8]}`} 
            />
        ))}
        </LineChart>
    </ResponsiveContainer>
}