/**
 * Majlis booking service – uses backend API.
 */
import api from './api';

/** Get all bookings. */
export function getBookings() {
  return api.get('/bookings').then((res) => (Array.isArray(res.data) ? res.data : []));
}

/** Create booking request (pending). */
export function createBooking(data) {
  return api
    .post('/bookings', {
      date: typeof data.date === 'string' ? data.date.slice(0, 10) : data.date,
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      name: data.name,
      notes: data.notes || '',
    })
    .then((res) => res.data)
    .catch((err) => Promise.reject(new Error(err.response?.data?.error || err.message)));
}

/** Approve or reject booking. */
export function updateBookingStatus(id, status) {
  if (!['Approved', 'Rejected'].includes(status)) {
    return Promise.reject(new Error('Invalid status'));
  }
  return api
    .patch(`/bookings/${id}`, { status })
    .then((res) => res.data)
    .catch((err) => Promise.reject(new Error(err.response?.data?.error || err.message)));
}

/** Update booking date and/or status. */
export function updateBooking(id, updates) {
  return api
    .patch(`/bookings/${id}`, updates)
    .then((res) => res.data)
    .catch((err) => Promise.reject(new Error(err.response?.data?.error || err.message)));
}

/** Get approved dates (for calendar blocking). */
export function getApprovedDates() {
  return api.get('/bookings/approved-dates').then((res) => (Array.isArray(res.data) ? res.data : []));
}
