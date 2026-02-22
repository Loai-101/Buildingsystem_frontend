/**
 * Accounts/finance service.
 * Currently uses mock data with localStorage persistence.
 * Replace with api.get/post/put/delete when backend is ready.
 */

const STORAGE_KEY = 'hatten_accounts';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/** Get all records (for filtering in UI). Backend: GET /accounts */
export function getAllRecords() {
  return Promise.resolve(loadFromStorage());
}

/** Get records for a specific year and month. Backend: GET /accounts?year=&month= */
export function getRecordsByYearMonth(year, month) {
  const all = loadFromStorage();
  const list = all.filter(
    (r) => Number(r.year) === Number(year) && Number(r.month) === Number(month)
  );
  return Promise.resolve(list);
}

/** Add a new record. Backend: POST /accounts */
export function addRecord(record) {
  const all = loadFromStorage();
  const id = String(Date.now());
  const newRecord = { id, ...record };
  all.push(newRecord);
  saveToStorage(all);
  return Promise.resolve(newRecord);
}

/** Update record. Backend: PUT /accounts/:id */
export function updateRecord(id, updates) {
  const all = loadFromStorage();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return Promise.reject(new Error('Record not found'));
  all[idx] = { ...all[idx], ...updates };
  saveToStorage(all);
  return Promise.resolve(all[idx]);
}

/** Delete record. Backend: DELETE /accounts/:id */
export function deleteRecord(id) {
  const all = loadFromStorage().filter((r) => r.id !== id);
  saveToStorage(all);
  return Promise.resolve({ id });
}

const EXTRA_YEARS_KEY = 'hatten_accounts_extra_years';

function loadExtraYears() {
  try {
    const raw = localStorage.getItem(EXTRA_YEARS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExtraYears(years) {
  localStorage.setItem(EXTRA_YEARS_KEY, JSON.stringify(years));
}

/** Get distinct years: from records + admin-added years (front-end only) */
export function getYearsWithRecords() {
  const all = loadFromStorage();
  const fromRecords = [...new Set(all.map((r) => Number(r.year)))].filter(Boolean);
  const extra = loadExtraYears();
  const combined = [...new Set([...fromRecords, ...extra])].filter(Boolean).sort((a, b) => b - a);
  if (combined.length === 0) return Promise.resolve([new Date().getFullYear()]);
  return Promise.resolve(combined);
}

/** Admin only: add a year so it appears in the list (front-end only) */
export function addYear(year) {
  const y = Number(year);
  if (!Number.isInteger(y) || y < 2000 || y > 2100) {
    return Promise.reject(new Error('Please enter a valid year (2000–2100).'));
  }
  const extra = loadExtraYears();
  if (extra.includes(y)) return Promise.resolve(y);
  extra.push(y);
  extra.sort((a, b) => b - a);
  saveExtraYears(extra);
  return Promise.resolve(y);
}
