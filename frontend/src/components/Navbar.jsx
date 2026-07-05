import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { syncSplitwise } from '../api/client'

export default function Navbar({ onSyncResult }) {
  const [syncing, setSyncing] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const handleSync = async () => {
    setSyncing(true)
    try {
      const { data } = await syncSplitwise()
      onSyncResult({
        type: 'success',
        message: `Sync complete — imported ${data.imported}, skipped ${data.skipped}.`,
      })
    } catch (err) {
      const msg = err.response?.data?.error || 'Sync failed.'
      onSyncResult({ type: 'danger', message: msg })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/">
          <i className="bi bi-wallet2 me-1" />
          My Expenses
        </Link>

        <div className="d-flex align-items-center gap-2 order-md-2">
          <Link className="btn btn-sm btn-outline-light" to="/add">
            <i className="bi bi-plus-lg" />
            <span className="d-none d-sm-inline ms-1">Add</span>
          </Link>
          <button className="btn btn-sm btn-outline-info" onClick={handleSync} disabled={syncing}>
            {syncing
              ? <><span className="spinner-border spinner-border-sm" role="status" /><span className="d-none d-sm-inline ms-1">Syncing…</span></>
              : <><i className="bi bi-arrow-repeat" /><span className="d-none d-sm-inline ms-1">Sync Splitwise</span></>}
          </button>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navMenu"
          >
            <span className="navbar-toggler-icon" />
          </button>
        </div>

        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto align-items-md-center gap-2">
            <li className="nav-item">
              <Link className="nav-link text-white" to="/">
                <i className="bi bi-list-ul me-1" />Expenses
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/monthly">
                <i className="bi bi-bar-chart-line me-1" />Summary
              </Link>
            </li>
            <li className="nav-item">
              <button className="btn btn-sm btn-outline-secondary" onClick={toggleTheme} title="Toggle theme">
                <i className={`bi bi-${theme === 'light' ? 'moon' : 'sun'}`} />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
