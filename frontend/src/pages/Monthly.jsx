import { useState, useEffect } from 'react'
import { getMonthlyTotals, getMeta } from '../api/client'

export default function Monthly() {
  const [totals, setTotals] = useState([])
  const [currency, setCurrency] = useState('€')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMonthlyTotals(), getMeta()]).then(([t, m]) => {
      setTotals(t.data)
      setCurrency(m.data.currency)
      setLoading(false)
    })
  }, [])

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
                      const total = Number(r.total)
                      const swPct = total > 0 ? (Number(r.sw_total || 0) / total) * 100 : 0
                      const manPct = 100 - swPct
                      return (
                        <tr key={r.month}>
                          <td className="fw-semibold">
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
