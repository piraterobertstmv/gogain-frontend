// Single definition of which columns a table shows, used by BOTH TableHead and TableRow.
// (Previously the header used a fixed order while rows printed fields in database order,
// plus an extra "index" cell, so columns drifted and DOM hacks hid cells after render.)

import { formatString } from '../../tools/tools';

export const NET_AMOUNT_COLUMN = "__amountWithoutTaxes"; // virtual column, computed from cost/taxes

const TRANSACTION_COLUMNS = [
    "date",
    "center",
    "client",
    "cost",               // amount with taxes
    NET_AMOUNT_COLUMN,    // amount without taxes
    "worker",
    "taxes",
    "typeOfTransaction",
    "typeOfMovement",
    "frequency",
    "typeOfClient",
    "service"
];

const USER_COLUMNS = ["email", "isAdmin", "centers", "services", "lastName", "firstName", "percentage"];

const USER_LABELS: Record<string, string> = {
    isAdmin: "Is admin",
    centers: "Centers",
    services: "Services",
    lastName: "Last name",
    firstName: "First name",
    percentage: "Percentage",
    email: "Email",
};

export function isTransactionTable(column: string): boolean {
    return column === "transaction" || column === "costTransactions";
}

/** Ordered list of column keys to display for a table. */
export function getVisibleColumns(column: string, rows: any[], deleteColumns: string[]): string[] {
    const hidden = new Set(deleteColumns);

    if (isTransactionTable(column)) {
        return TRANSACTION_COLUMNS.filter(key => !hidden.has(key));
    }
    if (column === "users") {
        return USER_COLUMNS.filter(key => !hidden.has(key));
    }

    // Other tables (clients, centers, services, costs): every field that appears in any row,
    // in first-seen order — not just the first row's fields.
    const keys: string[] = [];
    const seen = new Set<string>();
    rows.forEach(row => {
        Object.keys(row || {}).forEach(key => {
            if (!seen.has(key) && !hidden.has(key)) {
                seen.add(key);
                keys.push(key);
            }
        });
    });
    return keys;
}

export function columnLabel(column: string, key: string): string {
    if (key === NET_AMOUNT_COLUMN) return "Amount without taxes";
    if (key === "cost") return "Amount with taxes";
    if (column === "users" && USER_LABELS[key]) return USER_LABELS[key];
    return formatString(key);
}
