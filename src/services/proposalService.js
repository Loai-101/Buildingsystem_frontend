/**
 * Proposals and votes – uses backend API.
 * Resident: sees counts only. Admin: sees full vote details.
 */
import api from './api';

export function getProposals() {
  return api.get('/proposals').then((res) => (Array.isArray(res.data) ? res.data : []));
}

export function getProposal(id) {
  return api.get(`/proposals/${id}`).then((res) => res.data);
}

export function createProposal({ title, description }) {
  return api
    .post('/proposals', { title: (title || '').trim(), description: (description || '').trim() })
    .then((res) => res.data);
}

export function voteProposal(id, vote) {
  return api.post(`/proposals/${id}/vote`, { vote: vote === 'reject' ? 'reject' : 'approve' }).then((res) => res.data);
}

export function deleteProposal(id) {
  return api.delete(`/proposals/${id}`).then(() => ({ id }));
}

export function updateProposalStatus(id, status) {
  return api.patch(`/proposals/${id}`, { status: status === 'closed' ? 'closed' : 'open' }).then((res) => res.data);
}
