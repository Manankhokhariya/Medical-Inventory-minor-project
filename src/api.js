const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

let onUnauthorizedCallback = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorizedCallback = fn;
}

function handleResponse(res) {
  if (res.status === 401 && onUnauthorizedCallback) {
    onUnauthorizedCallback();
  }
}

export function getAuthHeaders(user) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (user) {
    headers['x-user-id'] = user.id;
    headers['x-user-role'] = user.role;
    headers['x-user-name'] = user.name;
  }
  return headers;
}

export const api = {
  setUnauthorizedHandler,
  getAuthHeaders,

  async login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login');
    return data;
  },

  async register(userData) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    return data;
  },

  async getMe(user) {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders(user)
    });
    handleResponse(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Account no longer exists or session expired.');
    return data;
  },

  async getInventory(user, filterUserId = null) {
    const query = filterUserId ? `?userId=${encodeURIComponent(filterUserId)}` : '';
    const res = await fetch(`${BASE_URL}/inventory${query}`, {
      headers: getAuthHeaders(user)
    });
    handleResponse(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch inventory');
    return data;
  },

  async createInventoryItem(user, itemData) {
    const res = await fetch(`${BASE_URL}/inventory`, {
      method: 'POST',
      headers: getAuthHeaders(user),
      body: JSON.stringify(itemData)
    });
    handleResponse(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create medicine record');
    return data;
  },

  async updateInventoryItem(user, id, updates) {
    const res = await fetch(`${BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(user),
      body: JSON.stringify(updates)
    });
    handleResponse(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update medicine record');
    return data;
  },

  async deleteInventoryItem(user, id) {
    const res = await fetch(`${BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(user)
    });
    handleResponse(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete medicine record');
    return data;
  },

  async getUsers(user) {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: getAuthHeaders(user)
    });
    handleResponse(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
    return data;
  },

  async updateUser(user, id, updates) {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(user),
      body: JSON.stringify(updates)
    });
    handleResponse(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user');
    return data;
  },

  async deleteUser(user, id) {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(user)
    });
    handleResponse(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
    return data;
  },

  async getLogs(user) {
    const res = await fetch(`${BASE_URL}/logs`, {
      headers: getAuthHeaders(user)
    });
    handleResponse(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch logs');
    return data;
  },

  async updateLog(user, id, updates) {
    const res = await fetch(`${BASE_URL}/logs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(user),
      body: JSON.stringify(updates)
    });
    handleResponse(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update log');
    return data;
  },

  async deleteLog(user, id) {
    const res = await fetch(`${BASE_URL}/logs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(user)
    });
    handleResponse(res);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete log');
    return data;
  }
};
