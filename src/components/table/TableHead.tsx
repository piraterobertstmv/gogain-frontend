import './Table.css';
import { columnLabel, isTransactionTable } from './columns';

const headerCellStyle = { verticalAlign: "middle", textAlign: "center", borderStyle: "solid", borderWidth: "0.5px" } as const;

// `columns` comes from getVisibleColumns(), the same list TableRow renders,
// so header and cells always line up.
export function TableHead({ column, columns, toggleAllLines }: { column: string, columns: string[], toggleAllLines: any }) {
    return (
        <thead>
            <tr>
                {isTransactionTable(column) && (
                    <th style={headerCellStyle}>
                        <input
                            type="checkbox"
                            onChange={() => toggleAllLines?.()}
                            style={{ cursor: "pointer", width: "1vw" }}
                            aria-label="Select all"
                        />
                    </th>
                )}
                <th style={headerCellStyle}>Index</th>
                {columns.map((key) => (
                    <th scope="col" key={key} style={headerCellStyle}>
                        {columnLabel(column, key)}
                    </th>
                ))}
            </tr>
        </thead>
    );
}
