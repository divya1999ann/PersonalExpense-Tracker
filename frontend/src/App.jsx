import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Flash from './components/Flash'
import Dashboard from './pages/Dashboard'
import ExpenseForm from './pages/ExpenseForm'
import Monthly from './pages/Monthly'

export default function App() {
  const [flash, setFlash] = useState(null)
  const [syncCount, setSyncCount] = useState(0)

  const handleSyncResult = (result) => {
    setFlash(result)
    if (result.type === 'success') setSyncCount(c => c + 1)
  }

  return (
    <BrowserRouter>
      <Navbar onSyncResult={handleSyncResult} />
      <div className="container py-4">
        <Flash flash={flash} onDismiss={() => setFlash(null)} />
        <Routes>
          <Route path="/" element={<Dashboard onFlash={setFlash} syncCount={syncCount} />} />
          <Route path="/add" element={<ExpenseForm onFlash={setFlash} />} />
          <Route path="/edit/:id" element={<ExpenseForm onFlash={setFlash} />} />
          <Route path="/monthly" element={<Monthly />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
