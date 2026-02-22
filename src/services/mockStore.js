/**
 * Simple localStorage-backed store for mock data.
 * Replace with real API calls in api.js when backend is ready.
 */
const PREFIX = 'hatten_mock_';

export function getMockStore(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMockStore(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('mockStore save failed', e);
  }
}
