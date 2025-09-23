import { PieChart, Cell, Pie, ResponsiveContainer, Tooltip } from "recharts";

export function CashFlowPieChart({ data }: { data: any[], title?: string }) {
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
    const filteredData = data.filter((item: any) => item.value > 0);
    
    // Calculate total for percentage
    const total = filteredData.reduce((sum: number, item: any) => sum + item.value, 0);
    
    // Add percentage to each item
    const dataWithPercent = filteredData.map((item: any, index: number) => {
        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return {
            ...item,
            percent,
            color: colors[index % colors.length]
        };
    });
    
    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{ 
                    backgroundColor: '#fff', 
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{data.name}</p>
                    <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                        €{Number(data.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({data.percent}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    // Split data into two columns for left and right layout
    const midPoint = Math.ceil(dataWithPercent.length / 2);
    const leftColumnData = dataWithPercent.slice(0, midPoint);
    const rightColumnData = dataWithPercent.slice(midPoint);

    return (
        <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
            {/* Left Column Legend */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '8px',
                width: '250px',
                fontSize: '12px'
            }}>
                {leftColumnData.map((entry: any, index: number) => (
                    <div key={`legend-left-${index}`} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        backgroundColor: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `2px solid ${entry.color}`,
                        boxShadow: '0px 2px 6px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            backgroundColor: entry.color,
                            marginRight: '10px',
                            borderRadius: '4px'
                        }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                {entry.percent}%
                            </div>
                            <div style={{ 
                                color: '#666', 
                                fontSize: '12px',
                                lineHeight: '1.2'
                            }}>
                                {entry.name}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Center Pie Chart */}
            <div style={{ width: '300px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={dataWithPercent} 
                            dataKey="value" 
                            nameKey="name"
                            cx="50%" 
                            cy="50%" 
                            outerRadius={120}
                            innerRadius={0}
                            paddingAngle={2}
                            label={false}
                            labelLine={false}
                        >
                            {dataWithPercent.map((entry: any, index: number) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Right Column Legend */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '8px',
                width: '250px',
                fontSize: '12px'
            }}>
                {rightColumnData.map((entry: any, index: number) => (
                    <div key={`legend-right-${index}`} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        backgroundColor: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `2px solid ${entry.color}`,
                        boxShadow: '0px 2px 6px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            backgroundColor: entry.color,
                            marginRight: '10px',
                            borderRadius: '4px'
                        }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                {entry.percent}%
                            </div>
                            <div style={{ 
                                color: '#666', 
                                fontSize: '12px',
                                lineHeight: '1.2'
                            }}>
                                {entry.name}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
