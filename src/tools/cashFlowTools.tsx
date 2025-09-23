import { findNameWithId } from './tools';

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Enhanced function that combines transactions and cost transactions
export function calculateCashFlowSummary(transactions: any[], costTransactions: any[], colName: string, arrOfCol: string[]) {
    let summaryData: any[] = [];

    for (let i = 0; i < arrOfCol.length; i++) {
        summaryData[i] = { 
            name: arrOfCol[i], 
            revenues: 0,
            costs: 0,
            netProfit: 0
        };

        // Process regular transactions (revenue)
        transactions.forEach((value: any) => {
            if (arrOfCol[i] === value[colName] && value.typeOfTransaction === "revenue") {
                const totalAmount = value.cost + value.taxes;
                summaryData[i].revenues += totalAmount;
            }
        });

        // Process cost transactions (expenses)
        costTransactions.forEach((value: any) => {
            if (arrOfCol[i] === value[colName]) {
                const totalAmount = value.cost + value.taxes;
                summaryData[i].costs += totalAmount;
            }
        });

        // Calculate net profit
        summaryData[i].netProfit = summaryData[i].revenues - summaryData[i].costs;

        // Round all values
        summaryData[i].revenues = parseFloat(summaryData[i].revenues.toFixed(2));
        summaryData[i].costs = parseFloat(summaryData[i].costs.toFixed(2));
        summaryData[i].netProfit = parseFloat(summaryData[i].netProfit.toFixed(2));
    }

    return summaryData;
}

// Enhanced monthly cash flow calculation
export function calculateMonthlyCashFlow(transactions: any[], costTransactions: any[], colName: string, data: any) {
    let monthlyData: any[] = [];
    const colInData: string = colName === "worker" ? "users" : colName;

    // Initialize arrays for 12 months
    for (let i = 0; i < 12; i++) {
        monthlyData[i] = {
            name: months[i],
            revenues: 0,
            costs: 0,
            netProfit: 0
        };

        // Add entity-specific data
        const uniqueEntities = new Set([
            ...transactions.map((value: any) => value[colName]),
            ...costTransactions.map((value: any) => value[colName])
        ]);
        
        uniqueEntities.forEach((entityId: any) => {
            const name = findNameWithId(data, entityId, colInData);
            if (name) {
                monthlyData[i][`${name}_revenues`] = 0;
                monthlyData[i][`${name}_costs`] = 0;
                monthlyData[i][`${name}_netProfit`] = 0;
            }
        });
    }

    // Process revenue transactions
    transactions.forEach((value: any) => {
        if (value.typeOfTransaction === "revenue") {
            const date = new Date(value.date);
            const monthNumber = date.getMonth();
            const name = findNameWithId(data, value[colName], colInData);
            const totalAmount = value.cost + value.taxes;

            monthlyData[monthNumber].revenues += totalAmount;
            if (name) {
                monthlyData[monthNumber][`${name}_revenues`] += totalAmount;
            }
        }
    });

    // Process cost transactions
    costTransactions.forEach((value: any) => {
        const date = new Date(value.date);
        const monthNumber = date.getMonth();
        const name = findNameWithId(data, value[colName], colInData);
        const totalAmount = value.cost + value.taxes;

        monthlyData[monthNumber].costs += totalAmount;
        if (name) {
            monthlyData[monthNumber][`${name}_costs`] += totalAmount;
        }
    });

    // Calculate net profit for each month and entity
    for (let i = 0; i < 12; i++) {
        monthlyData[i].netProfit = monthlyData[i].revenues - monthlyData[i].costs;
        
        Object.keys(monthlyData[i]).forEach(key => {
            if (key.endsWith('_revenues')) {
                const entityName = key.replace('_revenues', '');
                const revenues = monthlyData[i][`${entityName}_revenues`] || 0;
                const costs = monthlyData[i][`${entityName}_costs`] || 0;
                monthlyData[i][`${entityName}_netProfit`] = revenues - costs;
            }
        });

        // Round all values
        Object.keys(monthlyData[i]).forEach(key => {
            if (key !== 'name' && typeof monthlyData[i][key] === 'number') {
                monthlyData[i][key] = parseFloat(monthlyData[i][key].toFixed(2));
            }
        });
    }

    return monthlyData;
}

// Enhanced daily cash flow calculation
export function calculateDailyCashFlow(transactions: any[], costTransactions: any[], colName: string, data: any) {
    let dailyData: any[] = [];
    const colInData: string = colName === "worker" ? "users" : colName;
    
    // Create a unique list of days from both datasets
    const uniqueDays = new Set();
    [...transactions, ...costTransactions].forEach((value: any) => {
        const date = new Date(value.date);
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        uniqueDays.add(dayKey);
    });
    
    const sortedDays = Array.from(uniqueDays).sort();
    
    // Initialize daily structure
    sortedDays.forEach(dayKey => {
        const dayObj: any = {
            name: dayKey,
            revenues: 0,
            costs: 0,
            netProfit: 0
        };

        // Add entity-specific data
        const uniqueEntities = new Set([
            ...transactions.map((value: any) => value[colName]),
            ...costTransactions.map((value: any) => value[colName])
        ]);
        
        uniqueEntities.forEach((entityId: any) => {
            const name = findNameWithId(data, entityId, colInData);
            if (name) {
                dayObj[`${name}_revenues`] = 0;
                dayObj[`${name}_costs`] = 0;
                dayObj[`${name}_netProfit`] = 0;
            }
        });

        dailyData.push(dayObj);
    });

    // Process revenue transactions
    transactions.forEach((value: any) => {
        if (value.typeOfTransaction === "revenue") {
            const date = new Date(value.date);
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const dayIndex = sortedDays.indexOf(dayKey);
            const name = findNameWithId(data, value[colName], colInData);
            const totalAmount = value.cost + value.taxes;

            if (dayIndex !== -1) {
                dailyData[dayIndex].revenues += totalAmount;
                if (name) {
                    dailyData[dayIndex][`${name}_revenues`] += totalAmount;
                }
            }
        }
    });

    // Process cost transactions
    costTransactions.forEach((value: any) => {
        const date = new Date(value.date);
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayIndex = sortedDays.indexOf(dayKey);
        const name = findNameWithId(data, value[colName], colInData);
        const totalAmount = value.cost + value.taxes;

        if (dayIndex !== -1) {
            dailyData[dayIndex].costs += totalAmount;
            if (name) {
                dailyData[dayIndex][`${name}_costs`] += totalAmount;
            }
        }
    });

    // Calculate net profit for each day and entity
    dailyData.forEach(day => {
        day.netProfit = day.revenues - day.costs;
        
        Object.keys(day).forEach(key => {
            if (key.endsWith('_revenues')) {
                const entityName = key.replace('_revenues', '');
                const revenues = day[`${entityName}_revenues`] || 0;
                const costs = day[`${entityName}_costs`] || 0;
                day[`${entityName}_netProfit`] = revenues - costs;
            }
        });

        // Round all values
        Object.keys(day).forEach(key => {
            if (key !== 'name' && typeof day[key] === 'number') {
                day[key] = parseFloat(day[key].toFixed(2));
            }
        });
    });

    return dailyData;
}

// Get cost category breakdown for pie charts
export function getCostCategoryBreakdown(costTransactions: any[], data: any) {
    const categoryTotals: any = {};

    costTransactions.forEach((transaction: any) => {
        const categoryName = findNameWithId(data, transaction.service, 'costs') || 'Unknown';
        const totalAmount = transaction.cost + transaction.taxes;
        
        if (categoryTotals[categoryName]) {
            categoryTotals[categoryName] += totalAmount;
        } else {
            categoryTotals[categoryName] = totalAmount;
        }
    });

    // Convert to array format for charts
    return Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value: parseFloat((value as number).toFixed(2))
    }));
}

// Get revenue source breakdown for pie charts
export function getRevenueSourceBreakdown(transactions: any[], data: any) {
    const sourceTotals: any = {};

    transactions.forEach((transaction: any) => {
        if (transaction.typeOfTransaction === "revenue") {
            const sourceName = findNameWithId(data, transaction.service, 'service') || 'Unknown';
            const totalAmount = transaction.cost + transaction.taxes;
            
            if (sourceTotals[sourceName]) {
                sourceTotals[sourceName] += totalAmount;
            } else {
                sourceTotals[sourceName] = totalAmount;
            }
        }
    });

    // Convert to array format for charts
    return Object.entries(sourceTotals).map(([name, value]) => ({
        name,
        value: parseFloat((value as number).toFixed(2))
    }));
}

// Apply filters to both transaction types
export function applyFiltersToTransactions(transactions: any[], costTransactions: any[], filters: any) {
    const { centers, employees, dateBegin, dateEnd } = filters;

    const filterTransaction = (transaction: any) => {
        // Date filter
        if (dateBegin || dateEnd) {
            const transactionDate = new Date(transaction.date);
            if (dateBegin && transactionDate < new Date(dateBegin)) return false;
            if (dateEnd && transactionDate > new Date(dateEnd)) return false;
        }

        // Center filter
        if (centers && centers.length > 0 && !centers.includes(transaction.center)) {
            return false;
        }

        // Employee filter
        if (employees && employees.length > 0 && !employees.includes(transaction.worker)) {
            return false;
        }

        return true;
    };

    return {
        filteredTransactions: transactions.filter(filterTransaction),
        filteredCostTransactions: costTransactions.filter(filterTransaction)
    };
}
