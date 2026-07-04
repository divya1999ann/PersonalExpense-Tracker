import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { createExpense, updateExpense, getExpense, getMeta } from '../api/client'

export default function ExpenseForm({ onFlash }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const today = new Date().toISOString().split('T')[0]

  const [meta, setMeta] = useState({ categories: [], modes: [], currency: '€' })
  const [form, setForm] = useState({
    date: today, category: '', amount: '', description: '', paid_by: '', mode: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getMeta().then(r => setMeta(r.data))
    if (isEdit) {
      getExpense(id).then(r => {
        const { date, category, amount, description, paid_by, mode } = r.data
        setForm({ date, category, amount, description: description || '', paid_by: paid_by || '', mode: mode || '' })
      })
    }
  }, [id])

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (isEdit) {
        await updateExpense(id, form)
        onFlash({ type: 'success', message: 'Expense updated.' })
      } else {
        await createExpense(form)
        onFlash({ type: 'success', message: 'Expense added.' })
      }
      navigate('/')
    } catch (err) {
      const detail = err.response?.data
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : 'Failed to save.'
      onFlash({ type: 'danger', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-body-tertiary fw-semibold">
            <i className={`bi bi-${isEdit ? 'pencil' : 'plus-lg'} me-1`} />
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>

              <div className="mb-3">
                <label className="form-label" htmlFor="date">Date</label>
                <input type="date" id="date" name="date" className="form-control" required
                       value={form.date} onChange={handleChange} />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="category">Category</label>
                <input type="text" id="category" name="category" className="form-control" required
                       list="category-list" placeholder="Select or type a category"
                       value={form.category} onChange={handleChange} />
                <datalist id="category-list">
                  {meta.categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="amount">Amount</label>
                <div className="input-group">
                  <span className="input-group-text">{meta.currency}</span>
                  <input type="number" id="amount" name="amount" className="form-control" required
                         step="0.01" min="0" placeholder="0.00"
                         value={form.amount} onChange={handleChange} />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="description">Description / Notes</label>
                <textarea id="description" name="description" className="form-control" rows={2}
                          placeholder="What was this for?"
                          value={form.description} onChange={handleChange} />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="paid_by">Paid by</label>
                <input type="text" id="paid_by" name="paid_by" className="form-control"
                       placeholder="e.g. Me, Sarah, John…"
                       value={form.paid_by} onChange={handleChange} />
              </div>

              <div className="mb-4">
                <label className="form-label" htmlFor="mode">Mode</label>
                <select id="mode" name="mode" className="form-select"
                        value={form.mode} onChange={handleChange}>
                  <option value="">— Select —</option>
                  {meta.modes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1" disabled={submitting}>
                  <i className="bi bi-check-lg me-1" />
                  {submitting ? 'Saving…' : 'Save'}
                </button>
                <Link to="/" className="btn btn-outline-secondary flex-grow-1">Cancel</Link>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
