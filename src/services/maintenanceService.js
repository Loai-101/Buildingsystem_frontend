/**
 * Maintenance tickets and vendors service.
 * Mock data with localStorage persistence.
 * Replace with real API when backend is ready.
 */

const TICKETS_KEY = 'hatten_maintenance_tickets';
const VENDORS_KEY = 'hatten_maintenance_vendors';

function loadTickets() {
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTickets(tickets) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
}

function loadVendors() {
  try {
    const raw = localStorage.getItem(VENDORS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (list.length > 0) return list;
    return [
      { id: 'v1', name: 'ABC Plumbing', title: 'Plumber', phone: '+60 12-345 6789', category: 'Plumbing', image: null },
      { id: 'v2', name: 'XYZ Electrical', title: 'Electrician', phone: '+60 12-987 6543', category: 'Electrical', image: null },
    ];
  } catch {
    return [
      { id: 'v1', name: 'ABC Plumbing', title: 'Plumber', phone: '+60 12-345 6789', category: 'Plumbing', image: null },
      { id: 'v2', name: 'XYZ Electrical', title: 'Electrician', phone: '+60 12-987 6543', category: 'Electrical', image: null },
    ];
  }
}

function saveVendors(vendors) {
  localStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
}

/** Get all tickets. Backend: GET /maintenance/tickets */
export function getTickets() {
  return Promise.resolve(loadTickets());
}

/** Create ticket. Backend: POST /maintenance/tickets */
export function createTicket(data) {
  const tickets = loadTickets();
  const id = 'T' + Date.now();
  const ticket = {
    id,
    title: data.title,
    category: data.category || 'General',
    priority: data.priority || 'Medium',
    status: 'Open',
    createdDate: new Date().toISOString().slice(0, 10),
    description: data.description || '',
  };
  tickets.push(ticket);
  saveTickets(tickets);
  return Promise.resolve(ticket);
}

/** Update ticket (e.g. status). Backend: PUT /maintenance/tickets/:id */
export function updateTicket(id, updates) {
  const tickets = loadTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) return Promise.reject(new Error('Ticket not found'));
  tickets[idx] = { ...tickets[idx], ...updates };
  saveTickets(tickets);
  return Promise.resolve(tickets[idx]);
}

/** Get vendors/contacts. Backend: GET /maintenance/vendors */
export function getVendors() {
  return Promise.resolve(loadVendors());
}
