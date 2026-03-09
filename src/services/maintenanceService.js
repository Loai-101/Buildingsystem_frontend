/**
 * Maintenance tickets and vendors – uses backend API.
 */
import api from './api';

/** Get all tickets. */
export function getTickets() {
  return api.get('/maintenance/tickets').then((res) => (Array.isArray(res.data) ? res.data : []));
}

/** Create ticket. */
export function createTicket(data) {
  return api
    .post('/maintenance/tickets', {
      title: data.title,
      category: data.category || 'General',
      priority: data.priority || 'Medium',
      description: data.description || '',
    })
    .then((res) => res.data);
}

/** Update ticket. */
export function updateTicket(id, updates) {
  return api.put(`/maintenance/tickets/${id}`, updates).then((res) => res.data);
}

/** Get vendors/contacts. */
export function getVendors() {
  return api.get('/maintenance/vendors').then((res) => (Array.isArray(res.data) ? res.data : []));
}

/** Create vendor/contact (admin only). */
export function addVendor(data) {
  return api
    .post('/maintenance/vendors', {
      name: data.name,
      title: data.title || '',
      phone: data.phone || '',
      category: data.category || '',
      image: data.image || null,
    })
    .then((res) => res.data);
}

/** Update vendor/contact (admin only). */
export function updateVendor(id, data) {
  return api
    .put(`/maintenance/vendors/${id}`, {
      name: data.name,
      title: data.title,
      phone: data.phone,
      category: data.category,
      image: data.image,
    })
    .then((res) => res.data);
}

/** Delete vendor/contact (admin only). */
export function deleteVendor(id) {
  return api.delete(`/maintenance/vendors/${id}`).then((res) => res.data);
}
