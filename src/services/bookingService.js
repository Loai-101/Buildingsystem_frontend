/**
 * Majlis booking service.
 * Mock data with localStorage persistence.
 * Replace with real API when backend is ready.
 */

const STORAGE_KEY = 'hatten_majlis_bookings';
const MIN_GAP_MINUTES = 3 * 60; // at least 3 hours between bookings on the same day

/** Parse "HH:mm" to minutes since midnight. Returns null if empty/invalid. */
function timeToMinutes(t) {
  if (!t || typeof t !== 'string') return null;
  const parts = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!parts) return null;
  const h = parseInt(parts[1], 10);
  const m = parseInt(parts[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/** Get [start, end] in minutes for a booking. No times = full day [0, 24*60]. */
function bookingRange(b) {
  const s = timeToMinutes(b.startTime);
  const e = timeToMinutes(b.endTime);
  if (s == null && e == null) return [0, 24 * 60];
  if (s != null && e != null) return [Math.min(s, e), Math.max(s, e)];
  if (s != null) return [s, s + 60];
  return [e - 60, e];
}

/** True if two ranges are at least MIN_GAP_MINUTES apart (no overlap, gap >= 3h). */
function hasMinGap(start1, end1, start2, end2) {
  return end1 + MIN_GAP_MINUTES <= start2 || end2 + MIN_GAP_MINUTES <= start1;
}

/** True if there is an approved booking on this date (exclude one booking by id). Approved day = fully booked, no other bookings allowed. */
function hasApprovedBookingOnDate(bookings, dateStr, excludeId) {
  return bookings.some(
    (b) => b.id !== excludeId && b.status === 'Approved' && b.date.slice(0, 10) === dateStr
  );
}

/** True if booking 'b' conflicts with any other booking on the same day (3-hour gap rule). Ignores approved – check hasApprovedBookingOnDate first. */
function conflictsWithSameDay(b, others, excludeId) {
  const [s, e] = bookingRange(b);
  for (const o of others) {
    if (o.id === excludeId) continue;
    if (o.date.slice(0, 10) !== b.date.slice(0, 10)) continue;
    const [s2, e2] = bookingRange(o);
    if (!hasMinGap(s, e, s2, e2)) return true;
  }
  return false;
}

function loadBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

/** Today in YYYY-MM-DD (local date). */
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isPastDate(dateStr) {
  return dateStr < todayStr();
}

/** Get all bookings. Backend: GET /bookings */
export function getBookings() {
  return Promise.resolve(loadBookings());
}

/** Create booking request (pending). Backend: POST /bookings */
export function createBooking(data) {
  const bookings = loadBookings();
  const dateStr = typeof data.date === 'string' ? data.date.slice(0, 10) : data.date;
  const id = 'B' + Date.now();
  const newBooking = {
    id,
    date: dateStr,
    startTime: data.startTime || '',
    endTime: data.endTime || '',
    name: data.name,
    notes: data.notes || '',
    status: 'Pending',
    createdDate: new Date().toISOString(),
  };
  if (isPastDate(dateStr)) {
    return Promise.reject(new Error('Past dates cannot be booked.'));
  }
  if (hasApprovedBookingOnDate(bookings, dateStr, null)) {
    return Promise.reject(new Error('This date is already approved. The day is fully booked.'));
  }
  if (conflictsWithSameDay(newBooking, bookings, null)) {
    return Promise.reject(new Error('This day already has a booking within 3 hours of the requested time. Please choose a time at least 3 hours apart.'));
  }
  bookings.push(newBooking);
  saveBookings(bookings);
  return Promise.resolve(newBooking);
}

/** Approve or reject booking. Backend: PATCH /bookings/:id */
export function updateBookingStatus(id, status) {
  if (!['Approved', 'Rejected'].includes(status)) {
    return Promise.reject(new Error('Invalid status'));
  }
  const bookings = loadBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return Promise.reject(new Error('Booking not found'));
  bookings[idx].status = status;
  saveBookings(bookings);
  return Promise.resolve(bookings[idx]);
}

/** Update booking date and/or status (e.g. when dragging to new date – set status to Pending). Backend: PATCH /bookings/:id */
export function updateBooking(id, updates) {
  const bookings = loadBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return Promise.reject(new Error('Booking not found'));
  const dateStr = updates.date != null ? String(updates.date).slice(0, 10) : bookings[idx].date.slice(0, 10);
  const startTime = updates.startTime !== undefined ? updates.startTime : bookings[idx].startTime;
  const endTime = updates.endTime !== undefined ? updates.endTime : bookings[idx].endTime;
  const status = updates.status !== undefined ? updates.status : bookings[idx].status;
  const wouldBe = { id, date: dateStr, startTime, endTime, status };
  if (isPastDate(dateStr)) {
    return Promise.reject(new Error('Past dates cannot be booked.'));
  }
  if (hasApprovedBookingOnDate(bookings, dateStr, id)) {
    return Promise.reject(new Error('This date is already approved. The day is fully booked.'));
  }
  if (conflictsWithSameDay(wouldBe, bookings, id)) {
    return Promise.reject(new Error('This day already has a booking within 3 hours of this time. Bookings must be at least 3 hours apart.'));
  }
  bookings[idx].date = dateStr;
  bookings[idx].status = status;
  bookings[idx].startTime = startTime;
  bookings[idx].endTime = endTime;
  saveBookings(bookings);
  return Promise.resolve(bookings[idx]);
}

/** Get approved dates (for calendar blocking) */
export function getApprovedDates() {
  const bookings = loadBookings();
  return Promise.resolve(
    bookings.filter((b) => b.status === 'Approved').map((b) => b.date.slice(0, 10))
  );
}
