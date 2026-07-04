import { useState, useEffect } from 'react'
import { getMonthlyTotals, getMeta, getCategoryTotals } from '../api/client'

function monthToDateRange(month) {
  const [year, mon] = month.split('-').map(Number)
  const last = new Date(year, mon, 0).getDate()
  return {
    date_from: `${year}-${String(mon).padStart(2, '0')}-01`,
    date_to: `${year}-${String(mon).padStart(2, '0')}-${String(last).padStart(2, '0')}`,
  }
}

export default function Monthly() {
  const [totals, setTotals] = useState([])
  const [currency, setCurrency] = useState('€')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [catData, setCatData] = useState({})
  const [catLoading, setCatLoading] = useState(false)

  useEffect(() => {
    Promise.all([getMonthlyTotals(), getMeta()]).then(([t, m]) => {
      setTotals(t.data)
      setCurrency(m.data.currency)
      setLoading(false)
    })
  }, [])

  const toggleMonth = async (month) => {
    if (expanded === month) { setExpanded(null); return }
    setExpanded(month)
    if (catData[month]) return
    setCatLoading(true)
    const { date_from, date_to } = monthToDateRange(month)
    const res = await getCategoryTotals({ date_from, date_to })
    setCatData(d => ({ ...d, [month]: res.data }))
    setCatLoading(false)
  }

  const grandTotal = totals.reduce((s, r) => s + Number(r.total), 0)

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-body-tertiary fw-semibold">
            <i className="bi bi-bar-chart-line me-1" />Monthly Summary
          </div>

          {loading ? (
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : totals.length === 0 ? (
            <div className="card-body text-center text-muted py-5">
              <i className="bi bi-inbox fs-3 d-block mb-2" />
              No data yet.
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-group-divider">
                    <tr>
                      <th>Month</th>
                      <th className="text-end">Total</th>
                      <th className="text-end">Manual</th>
                      <th className="text-end">Splitwise</th>
                      <th style={{ width: 160 }}>Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totals.map(r => {
                      const monthKey = r.month.slice(0, 7)
                      const total = Number(r.total)
                      const swPct = total > 0 ? (Number(r.sw_total || 0) / total) * 100 : 0
                      const manPct = 100 - swPct
                      const isExpanded = expanded === monthKey
                      const cats = catData[monthKey] || []

                      return (
                        <>
                          <tr key={monthKey}
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleMonth(monthKey)}>
                            <td className="fw-semibold">
                              <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} me-1 small text-muted`} />
                              {new Date(r.month).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })}
                            </td>
                            <td className="text-end fw-semibold">{currency}{total.toFixed(2)}</td>
                            <td className="text-end text-muted">{currency}{Number(r.manual_total || 0).toFixed(2)}</td>
                            <td className="text-end text-muted">{currency}{Number(r.sw_total || 0).toFixed(2)}</td>
                            <td>
                              <div className="progress" style={{ height: 8 }}>
                                <div className="progress-bar bg-primary" style={{ width: `${manPct}%` }} title="Manual" />
                                <div className="progress-bar bg-info" style={{ width: `${swPct}%` }} title="Splitwise" />
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr key={monthKey + '-detail'}>
                              <td colSpan={5} className="p-0 border-0">
                                <div className="bg-body-secondary px-4 py-2">
                                  {catLoading && !cats.length ? (
                                    <div className="text-center py-2">
                                      <div className="spinner-border spinner-border-sm text-primary" />
                                    </div>
                                  ) : (
                                    <table className="table table-sm mb-0">
                                      <thead>
                                        <tr className="text-muted small">
                                          <th>Category</th>
                                          <th className="text-end">Amount</th>
                                          <th style={{ width: 120 }}>Share</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {cats.map(c => (
                                          <tr key={c.category}>
                                            <td className="small">{c.category}</td>
                                            <td className="text-end small fw-semibold">{currency}{Number(c.total).toFixed(2)}</td>
                                            <td>
                                              <div className="progress" style={{ height: 6 }}>
                                                <div className="progress-bar bg-primary"
                                                     style={{ width: `${(Number(c.total) / total) * 100}%` }} />
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                  <tfoot className="table-group-divider">
                    <tr>
                      <th>Total</th>
                      <th className="text-end">{currency}{grandTotal.toFixed(2)}</th>
                      <th className="text-end text-muted">
                        {currency}{totals.reduce((s, r) => s + Number(r.manual_total || 0), 0).toFixed(2)}
                      </th>
                      <th className="text-end text-muted">
                        {currency}{totals.reduce((s, r) => s + Number(r.sw_total || 0), 0).toFixed(2)}
                      </th>
                      <th />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="card-footer bg-body-tertiary d-flex gap-3 small text-muted">
                <span><span className="badge bg-primary me-1">&nbsp;</span>Manual</span>
                <span><span className="badge bg-info me-1">&nbsp;</span>Splitwise</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
