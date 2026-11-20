// Single source of truth for money and period calculations used by Dashboard, Cash Flow and Reports.
//
// Data model reminders:
// - `cost` is the amount INCLUDING taxes; `taxes` is a PERCENTAGE (e.g. 20 for 20%).
//   (The old code computed `cost + taxes`, i.e. added a percentage to euros.)
// - Costs live in two places: transactions with typeOfTransaction === "cost", and the
//   separate costTransactions collection. Every report must include both.
// - Dates are stored as UTC midnight, so periods are computed in UTC.

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Amount excluding taxes: cost / (1 + taxes%). Falls back to `cost` if taxes is missing/invalid. */
export function netAmount(entry: any): number {
    const cost = Number(entry?.cost) || 0;
    const taxes = Number(entry?.taxes);
    if (!Number.isFinite(taxes) || taxes <= -100) return cost;
    return cost / (1 + taxes / 100);
}

export function isRevenue(entry: any): boolean {
    return entry?.typeOfTransaction === "revenue";
}

/** Revenues and costs from both collections, with cost entries normalised to typeOfTransaction "cost". */
export function getAllEntries(data: any): any[] {
    const transactions: any[] = data?.transaction || [];
    const costTransactions: any[] = (data?.costTransactions || []).map((entry: any) =>
        entry.typeOfTransaction === "cost" ? entry : { ...entry, typeOfTransaction: "cost" }
    );
    return [...transactions, ...costTransactions];
}

export function splitEntries(data: any): { revenues: any[], costs: any[] } {
    const all = getAllEntries(data);
    return {
        revenues: all.filter(isRevenue),
        costs: all.filter(entry => entry.typeOfTransaction === "cost"),
    };
}

function pad(n: number) {
    return String(n).padStart(2, "0");
}

/** "2026-03" (UTC) */
export function monthKey(date: any): string {
    const d = new Date(date);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

/** "2026-03-05" (UTC, zero-padded so it sorts correctly) */
export function dayKey(date: any): string {
    const d = new Date(date);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Start/end timestamps (inclusive, whole days, UTC) for "YYYY-MM-DD" filter values. */
export function dateRangeBounds(dateBegin?: string, dateEnd?: string): { start: number, end: number } {
    const start = dateBegin ? Date.parse(`${dateBegin.slice(0, 10)}T00:00:00.000Z`) : -Infinity;
    const end = dateEnd ? Date.parse(`${dateEnd.slice(0, 10)}T23:59:59.999Z`) : Infinity;
    return { start: Number.isNaN(start) ? -Infinity : start, end: Number.isNaN(end) ? Infinity : end };
}

export function isInRange(entry: any, bounds: { start: number, end: number }): boolean {
    const t = Date.parse(entry?.date);
    return !Number.isNaN(t) && t >= bounds.start && t <= bounds.end;
}

export interface Period {
    key: string;    // "2026-03"
    label: string;  // "Mar" (single year) or "Mar 2026" (range spans several years)
}

const MAX_MONTHS = 120;

/**
 * Every month between two dates (inclusive). Labels include the year only when the range
 * covers more than one year, so January 2025 and January 2026 are no longer merged.
 */
export function monthsBetween(dateBegin: string, dateEnd: string): Period[] {
    const begin = new Date(`${dateBegin.slice(0, 10)}T00:00:00.000Z`);
    const end = new Date(`${dateEnd.slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(begin.getTime()) || Number.isNaN(end.getTime()) || begin > end) return [];

    const multiYear = begin.getUTCFullYear() !== end.getUTCFullYear();
    const periods: Period[] = [];
    let year = begin.getUTCFullYear();
    let month = begin.getUTCMonth();

    while ((year < end.getUTCFullYear() || (year === end.getUTCFullYear() && month <= end.getUTCMonth())) && periods.length < MAX_MONTHS) {
        periods.push({
            key: `${year}-${pad(month + 1)}`,
            label: multiYear ? `${MONTH_LABELS[month]} ${year}` : MONTH_LABELS[month],
        });
        month++;
        if (month === 12) { month = 0; year++; }
    }
    return periods;
}

export function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Default report range: the whole current year. */
export function currentYearRange(): { begin: string, end: string } {
    const year = new Date().getFullYear();
    return { begin: `${year}-01-01`, end: `${year}-12-31` };
}
