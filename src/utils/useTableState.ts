import { useState } from 'react'

export function useTableState() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  return {
    page,
    setPage,
    pageSize,
    search,
    setSearch,
    reset: () => {
      setPage(1)
      setSearch('')
    },
  }
}
