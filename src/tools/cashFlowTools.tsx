import { findNameWithId } from './tools';
import { dateRangeBounds, dayKey, isInRange, monthKey, monthsBetween, netAmount, round2 } from './finance';

// All functions take `revenues` and `costs` lists as produced by splitEntries() in finance.ts:
// costs include BOTH cost-type transactions and the costTransactions collection.
// Amounts are excluding taxes (netAmount); the old code added the tax percentage to the amount.

function makeNameLookup(data: any, colInData: string) {
    const cache = new Map<string, string>();
    return (id: string) => {
        if (!cache.has(id)) cache.set(id, findNameWithId(data, id, colInData));
        return cache.get(id) as string;
    };
}

function roundRow(row: any) {
    Object.keys(row).forEach(key => {
        if (key !== 'name' && typeof row[key] === 'number') row[key] = round2(row[key]);
    });
    return row;
}

// Revenues, costs and net profit per entity (e.g. per center)
export function calculateCashFlowSummary(revenues: any[], costs: any[], colName: string, arrOfCol: string[]) {
    const totals = new Map<string, { revenues: number, costs: number }>();
    arrOfCol.forEach(id => totals.set(id, { revenues: 0, costs: 0 }));

    revenues.forEach(entry => { const t = totals.get(entry[colName]); if (t) t.revenues += netAmount(entry); });
    costs.forEach(entry => { const t = totals.get(entry[colName]); if (t) t.costs += netAmount(entry); });

    return arrOfCol.map(id => {
        const t = totals.get(id)!;
        return roundRow({ name: id, revenues: t.revenues, costs: t.costs, netProfit: t.revenues - t.costs });
    });
}

// Shared bucket logic for monthly/daily series: totals plus `${entity}_revenues/_costs/_netProfit` columns
function buildSeries(revenues: any[], costs: any[], colName: string, data: any, buckets: { key: string, label: string }[], keyOf: (date: any) => string) {
    const nameOf = makeNameLookup(data, colName === "worker" ? "users" : colName);
    const entityNames = [...new Set([...revenues, ...costs].map(entry => nameOf(entry[colName])).filter(Boolean))];

    const rows = buckets.map(bucket => {
        const row: any = { name: bucket.label, revenues: 0, costs: 0, netProfit: 0 };
        entityNames.forEach(name => {
            row[`${name}_revenues`] = 0;
            row[`${name}_costs`] = 0;
            row[`${name}_netProfit`] = 0;
        });
        return row;
    });
    const indexByKey = new Map(buckets.map((bucket, i) => [bucket.key, i]));

    const add = (entry: any, field: 'revenues' | 'costs') => {
        const index = indexByKey.get(keyOf(entry.date));
        if (index === undefined) return;
        const amount = netAmount(entry);
        rows[index][field] += amount;
        const name = nameOf(entry[colName]);
        if (name) rows[index][`${name}_${field}`] += amount;
    };
    revenues.forEach(entry => add(entry, 'revenues'));
    costs.forEach(entry => add(entry, 'costs'));

    return rows.map(row => {
        row.netProfit = row.revenues - row.costs;
        entityNames.forEach(name => {
            row[`${name}_netProfit`] = row[`${name}_revenues`] - row[`${name}_costs`];
        });
        return roundRow(row);
    });
}

// One row per month of [dateBegin, dateEnd]. Months are keyed by year+month
// (previously getMonth() only, which merged e.g. January 2025 with January 2026).
export function calculateMonthlyCashFlow(revenues: any[], costs: any[], colName: string, data: any, dateBegin: string, dateEnd: string) {
    return buildSeries(revenues, costs, colName, data, monthsBetween(dateBegin, dateEnd), monthKey);
}

// One row per day that has data (zero-padded UTC keys, sorted)
export function calculateDailyCashFlow(revenues: any[], costs: any[], colName: string, data: any) {
    const days = [...new Set([...revenues, ...costs].map(entry => dayKey(entry.date)))].sort();
    return buildSeries(revenues, costs, colName, data, days.map(day => ({ key: day, label: day })), dayKey);
}

function breakdown(entries: any[], nameOf: (entry: any) => string) {
    const totals = new Map<string, number>();
    entries.forEach(entry => {
        const name = nameOf(entry) || 'Unknown';
        totals.set(name, (totals.get(name) || 0) + netAmount(entry));
    });
    return [...totals.entries()].map(([name, value]) => ({ name, value: round2(value) }));
}

// Cost category breakdown for pie charts (cost categories, falling back to service names)
export function getCostCategoryBreakdown(costs: any[], data: any) {
    return breakdown(costs, entry =>
        findNameWithId(data, entry.service, 'costs') || findNameWithId(data, entry.service, 'service')
    );
}

// Revenue source breakdown for pie charts
export function getRevenueSourceBreakdown(revenues: any[], data: any) {
    return breakdown(revenues, entry => findNameWithId(data, entry.service, 'service'));
}

// Apply center / employee / date filters (dates are whole days, end date included)
export function applyFiltersToTransactions(revenues: any[], costs: any[], filters: any) {
    const { centers, employees, dateBegin, dateEnd } = filters;
    const bounds = dateRangeBounds(dateBegin, dateEnd);
    const centerSet = centers && centers.length > 0 ? new Set(centers) : null;
    const employeeSet = employees && employees.length > 0 ? new Set(employees) : null;

    const keep = (entry: any) =>
        isInRange(entry, bounds) &&
        (!centerSet || centerSet.has(entry.center)) &&
        (!employeeSet || employeeSet.has(entry.worker));

    return {
        filteredTransactions: revenues.filter(keep),
        filteredCostTransactions: costs.filter(keep)
    };
}
