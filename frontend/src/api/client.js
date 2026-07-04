import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getExpenses = (params) => api.get('/expenses/', { params })
export const createExpense = (data) => api.post('/expenses/', data)
export const getExpense = (id) => api.get(`/expenses/${id}/`)
export const updateExpense = (id, data) => api.put(`/expenses/${id}/`, data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}/`)
export const getMonthlyTotals = () => api.get('/expenses/monthly-totals/')
export const getMeta = () => api.get('/expenses/meta/')
export const syncSplitwise = () => api.post('/sync/splitwise/')
