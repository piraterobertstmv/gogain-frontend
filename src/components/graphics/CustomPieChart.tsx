import { PieChart, Cell, Pie, ResponsiveContainer } from "recharts";

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent } : { cx: any, cy: any, midAngle: any, innerRadius: any, outerRadius: any, percent: any}) => {
  // Calculate the position for the label outside the pie
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Calculate the end point for the connecting line
  const lineEndRadius = outerRadius * 1.05;
  const lineEndX = cx + lineEndRadius * Math.cos(-midAngle * RADIAN);
  const lineEndY = cy + lineEndRadius * Math.sin(-midAngle * RADIAN);
  
  // Calculate the start point for the line (on the pie surface)
  const lineStartRadius = outerRadius;
  const lineStartX = cx + lineStartRadius * Math.cos(-midAngle * RADIAN);
  const lineStartY = cy + lineStartRadius * Math.sin(-midAngle * RADIAN);

  // Format percentage
  const percentValue = (percent * 100).toFixed(0);
  
  return (
    <g>
      {/* Line connecting the pie to the label */}
      <line 
        x1={lineStartX} 
        y1={lineStartY} 
        x2={lineEndX} 
        y2={lineEndY} 
        stroke="#999999" 
        strokeWidth={1} 
      />
      
      {/* Percentage label */}
      <text 
        x={x} 
        y={y} 
        fill="#000000" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${percentValue}%`}
      </text>
    </g>
  );
};

export function CustomPieChart({ dataChart, centers } : { dataChart: any, centers: string[] }) {
    const colors = ["#FF9D70", "#FFDDCD", "#E5AB90", "#CA7852", "#202864", "#5461C7", "#6CBDFF", "#5396D4"]

    const filteredData = dataChart.filter((data: any) => data.value !== 0);

    return <ResponsiveContainer width={"100%"} height={200}>
        <PieChart width={400} height={400}>
            <Pie 
              data={filteredData} 
              dataKey="value" 
              cx="50%" 
              cy="50%" 
              outerRadius={70}
              paddingAngle={1}
              labelLine={true}
              label={renderCustomizedLabel}
            >
            {filteredData.map((value: any, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[centers.indexOf(value.name) % 8]} />
            ))}
            </Pie>
        </PieChart>
    </ResponsiveContainer>
}