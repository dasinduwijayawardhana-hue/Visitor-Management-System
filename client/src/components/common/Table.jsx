import React from 'react'
import Spinner from './Spinner.jsx'
import EmptyState from './EmptyState.jsx'

// Prisma models in this app never use a plain `id` field — they use
// entity-specific primary keys (employeeId, userId, visitorId, visitId,
// departmentId, logId...). The old default of rowKey='id' silently matched
// nothing on every single page, so React fell back to JSON.stringify(row)
// as the key. That makes every key change on every refetch (new Date
// objects, reordered fields, etc.), forcing React to discard and rebuild
// DOM nodes for rows that didn't actually change — this is what caused the
// "pages don't refresh properly" / rows-look-broken-after-edit symptoms.
// Callers should still pass an explicit `rowKey` for clarity, but this
// fallback searches common PK field names so a missing prop degrades
// gracefully instead of silently breaking reconciliation.
const COMMON_ID_FIELDS = ['id', 'employeeId', 'userId', 'visitorId', 'visitId', 'departmentId', 'logId', 'roleId']

function resolveRowKey(row, rowKey, index) {
  if (rowKey && row[rowKey] !== undefined && row[rowKey] !== null) return row[rowKey]
  const found = COMMON_ID_FIELDS.find((f) => row[f] !== undefined && row[f] !== null)
  if (found) return row[found]
  // Last-resort fallback — still better than JSON.stringify(row), which
  // changes on every refetch even when the row's identity hasn't.
  return `row-${index}`
}

// Generic table shell. `columns` = [{ key, header, render?(row) }]
export default function Table({ columns, rows, loading, emptyTitle = 'No records found', emptyDescription, rowKey }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading records…" />
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="table-shell">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={resolveRowKey(row, rowKey, index)}>
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row) : row[col.key] ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
