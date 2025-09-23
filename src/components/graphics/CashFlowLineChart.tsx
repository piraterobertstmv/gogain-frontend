import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function CashFlowLineChart({ data }: { data: any[] }) {
    const colors = {
        revenues: "#28a745",
        costs: "#dc3545", 
        netProfit: "#007bff"
    };

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                    formatter={(value: any, name: string) => [
                        `€${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                        name === 'revenues' ? 'Revenue' : 
                        name === 'costs' ? 'Costs' : 'Net Profit'
                    ]}
                />
                <Legend 
                    formatter={(value: string) => 
                        value === 'revenues' ? 'Revenue' : 
                        value === 'costs' ? 'Costs' : 'Net Profit'
                    }
                />
                <Line 
                    type="monotone" 
                    dataKey="revenues" 
                    stroke={colors.revenues}
                    strokeWidth={2}
                    dot={{ fill: colors.revenues, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Line 
                    type="monotone" 
                    dataKey="costs" 
                    stroke={colors.costs}
                    strokeWidth={2}
                    dot={{ fill: colors.costs, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Line 
                    type="monotone" 
                    dataKey="netProfit" 
                    stroke={colors.netProfit}
                    strokeWidth={2}
                    dot={{ fill: colors.netProfit, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
