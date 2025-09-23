import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function CashFlowBarChart({ data, colors: customColors }: { data: any[], colors?: string[] }) {
    // Enhanced color palette with more distinct colors for each bar
    const defaultColors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", 
        "#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3", "#FF9F43",
        "#FF6348", "#2ED573", "#3742FA", "#F8B500", "#7B68EE"
    ];
    
    const colors = customColors || defaultColors;

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    padding: '10px',
                    borderRadius: '6px',
                    color: 'white'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {label}
                    </div>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} style={{ display: "flex", alignItems: "center" }}>
                            <span>€{Number(entry.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.map((_, index: number) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={colors[index % colors.length]}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
