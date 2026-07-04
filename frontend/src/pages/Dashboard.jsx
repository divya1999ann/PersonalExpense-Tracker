import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getExpenses, getMeta, deleteExpense } from '../api/client'

const PAGE_SIZE = 10

function monthToDateRange(month) {
  if (!month) return { date_from: '', date_to: '' }
  const [year, mon] = month.split('-').map(Number)
  const last = new Date(year, mon, 0).getDate()
  return {
    date_from: `${year}-${String(mon).padStart(2, '0')}-01`,
    date_to: `${year}-${String(mon).padStart(2, '0')}-${String(last).padStart(2, '0')}`,
  }
}

export default function Dashboard({ onFlash, syncCount = 0 }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [expenses, setExpenses] = useState([])
  const [meta, setMeta] = useState({ categories: [], payment_methods: [], currency: '€' })
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(true)

  const filters = {
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
    month: searchParams.get('month') || '',
    category: searchParams.get('category') || '',
    source: searchParams.get('source') || '',
    page: parseInt(searchParams.get('page') || '1'),
  }

  // Local state to track the two mutually exclusive date filter modes
  const [monthVal, setMonthVal] = useState(filters.month)
  const [dateFrom, setDateFrom] = useState(filters.date_from)
  const [dateTo, setDateTo] = useState(filters.date_to)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.month) {
        const { date_from, date_to } = monthToDateRange(filters.month)
        params.date_from = date_from
        params.date_to = date_to
      } else {
        if (filters.date_from) params.date_from = filters.date_from
        if (filters.date_to) params.date_to = filters.date_to
      }
      if (filters.category) params.category = filters.category
      if (filters.source) params.source = filters.source

      const [expRes, metaRes] = await Promise.all([
        getExpenses({ ...params, limit: PAGE_SIZE, offset: (filters.page - 1) * PAGE_SIZE }),
        getMeta(),
      ])
      setExpenses(expRes.data.results ?? expRes.data)
      setCount(expRes.data.count ?? expRes.data.length)
      setMeta(metaRes.data)
    } finally {
      setLoading(false)
    }
  }, [searchParams, syncCount])

  useEffect(() => { fetchData() }, [fetchData])

  const applyFilters = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const next = {}
    for (const [k, v] of fd.entries()) if (v) next[k] = v
    // month and date range are mutually exclusive — month takes priority
    if (next.month) { delete next.date_from; delete next.date_to }
    setSearchParams(next)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id)
    onFlash({ type: 'info', message: 'Expense deleted.' })
    fetchData()
  }

  const totalPages = Math.ceil(count / PAGE_SIZE)

  return (
    <>
      {/* Filter bar */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-body-tertiary d-flex justify-content-between align-items-center">
          <span className="fw-semibold"><i className="bi bi-funnel me-1" />Filters</span>
          <button className="btn btn-sm btn-link text-secondary p-0"
                  onClick={() => setFiltersOpen(o => !o)}>
            {filtersOpen ? 'Hide' : 'Show filters'}
          </button>
        </div>
        <div className={`collapse ${filtersOpen ? 'show' : ''}`}>
          <div className="card-body">
            <form onSubmit={applyFilters} className="row g-2 align-items-end">

              {/* Month picker */}
              <div className="col-6 col-md-2">
                <label className="form-label small mb-1">Month</label>
                <input
                  type="month" name="month" className="form-control form-control-sm"
                  value={monthVal}
                  onChange={e => { setMonthVal(e.target.value); setDateFrom(''); setDateTo('') }}
                />
              </div>

              <div className="col-auto d-flex align-items-end pb-1 text-muted small">or</div>

              {/* Date range */}
              <div className="col-6 col-md-2">
                <label className="form-label small mb-1">From</label>
                <input
                  type="date" name="date_from" className="form-control form-control-sm"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setMonthVal('') }}
                />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small mb-1">To</label>
                <input
                  type="date" name="date_to" className="form-control form-control-sm"
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setMonthVal('') }}
                />
              </div>

              {/* Category + Source */}
              <div className="col-6 col-md-2">
                <label className="form-label small mb-1">Category</label>
                <select name="category" className="form-select form-select-sm"
                        defaultValue={filters.category}>
                  <option value="">All categories</option>
                  {meta.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small mb-1">Source</label>
                <select name="source" className="form-select form-select-sm"
                        defaultValue={filters.source}>
                  <option value="">All</option>
                  <option value="manual">Manual</option>
                  <option value="splitwise">Splitwise</option>
                </select>
              </div>

              <div className="col-12 col-md-auto d-flex gap-2">
                <button type="submit" className="btn btn-sm btn-primary">Apply</button>
                <Link to="/" className="btn btn-sm btn-outline-secondary"
                      onClick={() => { setMonthVal(''); setDateFrom(''); setDateTo('') }}>
                  Clear
                </Link>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* Expense table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-body-tertiary d-flex justify-content-between align-items-center">
          <span className="fw-semibold"><i className="bi bi-list-ul me-1" />Expenses</span>
          <span className="text-muted small">{count} total</span>
        </div>

        {loading ? (
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="card-body text-center text-muted py-5">
            <i className="bi bi-inbox fs-3 d-block mb-2" />
            No expenses found. <Link to="/add">Add your first one.</Link>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-group-divider">
                  <tr>
                    <th>Date</th><th>Category</th><th>Description</th>
                    <th className="text-end">Amount</th>
                    <th className="d-none d-md-table-cell">Paid by</th>
                    <th className="d-none d-md-table-cell">Mode</th>
                    <th>Source</th><th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id}>
                      <td className="text-nowrap">
                        {new Date(exp.date + 'T00:00:00').toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td><span className="badge bg-secondary-subtle text-secondary-emphasis">{exp.category}</span></td>
                      <td className="text-truncate" style={{ maxWidth: 220 }}>{exp.description || '—'}</td>
                      <td className="text-end fw-semibold text-nowrap">{meta.currency}{Number(exp.amount).toFixed(2)}</td>
                      <td className="d-none d-md-table-cell text-muted small">{exp.paid_by || '—'}</td>
                      <td className="d-none d-md-table-cell text-muted small">{exp.mode || '—'}</td>
                      <td>
                        {exp.source === 'splitwise'
                          ? <span className="badge bg-info-subtle text-info-emphasis">SW</span>
                          : <span className="badge bg-secondary-subtle text-secondary-emphasis border">Manual</span>}
                      </td>
                      <td className="text-end text-nowrap">
                        <Link to={`/edit/${exp.id}`} className="btn btn-sm btn-outline-secondary py-0 px-2 me-1">
                          <i className="bi bi-pencil" />
                        </Link>
                        <button className="btn btn-sm btn-outline-danger py-0 px-2"
                                onClick={() => handleDelete(exp.id)}>
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="card-footer bg-body-tertiary d-flex justify-content-center">
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <li key={p} className={`page-item ${p === filters.page ? 'active' : ''}`}>
                        <button className="page-link"
                                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: p })}>
                          {p}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
