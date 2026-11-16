import { useMemo, useState } from 'react'
import { PAGE_SIZE } from '../utils/constants'

// Simple client-side pagination helper for endpoints that return a full
// array without server-side paging (or as a fallback while paging params
// are wired up per-endpoint).
export default function usePagination(items = [], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages))

  return { page, totalPages, pageItems, goTo, setPage: goTo }
}
