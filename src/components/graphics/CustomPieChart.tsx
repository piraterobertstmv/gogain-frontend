import { PieChart, Cell, Pie, ResponsiveContainer, Tooltip } from "recharts";
import { findNameWithId } from '../../tools/tools';

export function CustomPieChart({ dataChart, centers, data } : { dataChart: any, centers: string[], data?: any }) {
    // Updated color palette with more distinct, higher-contrast colors
    const colors = [
        "#FF6B6B", // bright red
        "#4ECDC4", // teal
        "#FFD166", // yellow
        "#6A0572", // purple
        "#1A535C", // dark teal
        "#3A86FF", // bright blue
        "#8338EC", // violet
        "#FF9F1C"  // orange
    ];

    // Filter out any data points with zero value
    const filteredData = dataChart.filter((data: any) => data.value !== 0);
    
    // Calculate total for percentage
    const total = filteredData.reduce((sum: number, item: any) => sum + item.value, 0);
    
    // Add percentage to each item for the legend
    const dataWithPercent = filteredData.map((item: any) => {
        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return {
            ...item,
            percent,
            // Find center name if available
            centerName: data && centers.includes(item.name) ? 
                findNameWithId(data, item.name, "center") : 
                item.name
        };
    });
    
    // Custom tooltip to show percentage and value
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ 
                    backgroundColor: '#fff', 
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}>
                    <p>{`${payload[0].name}: ${payload[0].value}`}</p>
                    <p style={{ fontWeight: 'bold' }}>{`${payload[0].payload.percent}%`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                    <Pie 
                        data={dataWithPercent} 
                        dataKey="value" 
                        nameKey="centerName"
                        cx="50%" 
                        cy="50%" 
                        outerRadius={60}
                        innerRadius={0}
                        paddingAngle={2}
                        // Remove the label
                        label={false}
                        labelLine={false}
                    >
                        {dataWithPercent.map((entry: any, index: number) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={colors[centers.indexOf(entry.name) % 8]}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            
            {/* Custom legend with percentages */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                flexWrap: 'wrap',
                justifyContent: 'center',
                fontSize: '12px',
                marginTop: '10px',
                gap: '8px'
            }}>
                {dataWithPercent.map((entry: any, index: number) => (
                    <div key={`legend-${index}`} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        backgroundColor: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${colors[centers.indexOf(entry.name) % 8]}`,
                        boxShadow: '0px 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ 
                            width: '12px', 
                            height: '12px', 
                            backgroundColor: colors[centers.indexOf(entry.name) % 8],
                            marginRight: '6px',
                            borderRadius: '2px'
                        }} />
                        <span style={{ fontWeight: 'bold' }}>{entry.percent}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}