/**
 * Accounts/finance service – uses backend API.
 */
import api from './api';

/** Get all records (for filtering in UI). */
export function getAllRecords() {
  return api.get('/accounts').then((res) => res.data);
}

/** Get records for a specific year and month. */
export function getRecordsByYearMonth(year, month) {
  return api.get('/accounts', { params: { year, month } }).then((res) => res.data);
}

/** Get all records for a year (for year dashboard). */
export function getRecordsByYear(year) {
  return api.get('/accounts', { params: { year } }).then((res) => res.data);
}

/** Add a new record. */
export function addRecord(record) {
  return api
    .post('/accounts', {
      date: record.date,
      type: record.type,
      category: record.category || '',
      description: record.description || '',
      amount: record.amount,
      year: record.year,
      month: record.month,
      attachment: record.attachment != null ? record.attachment : null,
    })
    .then((res) => res.data);
}

/** Update record. */
export function updateRecord(id, updates) {
  return api.put(`/accounts/${id}`, updates).then((res) => res.data);
}

/** Delete record. */
export function deleteRecord(id) {
  return api.delete(`/accounts/${id}`).then(() => ({ id }));
}

/** Get distinct years: from records + admin-added years. */
export function getYearsWithRecords() {
  return api.get('/accounts/years').then((res) => res.data);
}

/** Admin only: add a year so it appears in the list. */
export function addYear(year) {
  const y = Number(year);
  if (!Number.isInteger(y) || y < 2000 || y > 2100) {
    return Promise.reject(new Error('Please enter a valid year (2000–2100).'));
  }
  return api.post('/accounts/years', { year: y }).then((res) => res.data);
}

/** Admin only: delete a year and all its records. */
export function deleteYear(year) {
  const y = Number(year);
  if (!Number.isInteger(y) || y < 2000 || y > 2100) {
    return Promise.reject(new Error('Please enter a valid year (2000–2100).'));
  }
  return api.delete(`/accounts/years/${y}`).then((res) => res.data);
}
