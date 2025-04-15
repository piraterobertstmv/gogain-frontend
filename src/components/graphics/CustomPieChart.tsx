import {  PieChart, Cell, Pie, ResponsiveContainer } from "recharts";

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent } : { cx: any, cy: any, midAngle: any, innerRadius: any, outerRadius: any, percent: any}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function CustomPieChart({ dataChart, centers } : { dataChart: any, centers: string[] }) {
    const colors = ["#FF9D70", "#FFDDCD", "#E5AB90", "#CA7852", "#202864", "#5461C7", "#6CBDFF", "#5396D4"]

    const filteredData = dataChart.filter((data: any) => data.value !== 0);

    return <ResponsiveContainer width={"100%"} height={200}>
        <PieChart width={400} height={400}>
            <Pie data={filteredData} dataKey="value" cx="50%" cy="50%" outerRadius={85}             labelLine={false}
            label={renderCustomizedLabel}>
            {filteredData.map((value: any, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[centers.indexOf(value.name) % 8]} />
            ))}
            </Pie>
        </PieChart>
    </ResponsiveContainer>
}