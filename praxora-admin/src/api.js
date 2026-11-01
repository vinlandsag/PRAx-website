/**
 * src/api.js
 *
 * Praxora Standalone Admin Dashboard - Decoupled API Service Layer
 *
 * Provides a clean, modular abstraction between UI views and the backend.
 * Configured via VITE_API_BASE_URL to support both standalone local development
 * and future seamless integration with the main platform backend.
 */

// Resolves base API endpoint from environment or defaults to relative '/api'
const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  if (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  return '/api';
};

export const API_BASE = getApiBase();

/**
 * Token management supporting canonical 'praxora_token' with backward-compatible fallbacks.
 */
export function getToken() {
  if (typeof localStorage === 'undefined') return '';
  return (
    localStorage.getItem('praxora_token') ||
    localStorage.getItem('veylith_token') ||
    localStorage.getItem('questline_token') ||
    ''
  );
}

export function setToken(token) {
  if (typeof localStorage === 'undefined') return;
  if (token) {
    localStorage.setItem('praxora_token', token);
    localStorage.setItem('veylith_token', token);
  } else {
    localStorage.removeItem('praxora_token');
    localStorage.removeItem('veylith_token');
    localStorage.removeItem('questline_token');
  }
}

/**
 * Centralized HTTP request dispatcher with bearer token authorization,
 * structured JSON body handling, and standardized error formatting.
 */
export async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || response.statusText || 'Request failed';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.code = data.code || 'API_ERROR';
    error.data = data;
    throw error;
  }

  return data;
}

// =============================================================================
// Modular Domain Services (for direct consumption or future microservices)
// =============================================================================

export const authService = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  getMe: () => request('/auth/me'),
  switchPersona: (role) => request('/auth/switch-persona', { method: 'POST', body: { role } }),
};

export const dashboardService = {
  getStats: () => request('/admin/dashboard/stats'),
};

export const taskService = {
  getTasks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/tasks${q ? `?${q}` : ''}`);
  },
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (taskData) => request('/tasks', { method: 'POST', body: taskData }),
  updateTask: (id, taskData) => request(`/tasks/${id}`, { method: 'PUT', body: taskData }),
  duplicateTask: (id) => request(`/tasks/${id}/duplicate`, { method: 'POST' }),
  setTaskStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};

export const submissionService = {
  getSubmissions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/submissions${q ? `?${q}` : ''}`);
  },
  getSubmission: (id) => request(`/submissions/${id}`),
  submitTask: (taskId, payload) => request(`/submissions/task/${taskId}/submit`, { method: 'POST', body: payload }),
  reviewSubmission: (id, payload) => request(`/submissions/${id}/review`, { method: 'POST', body: payload }),
};

export const memberService = {
  getMembers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/admin/members${q ? `?${q}` : ''}`);
  },
  getMemberProfile: (id) => request(`/admin/members/${id}`),
  updateMemberRole: (id, role) => request(`/admin/members/${id}/role`, { method: 'PATCH', body: { role } }),
  updateMemberStatus: (id, status) => request(`/admin/members/${id}/status`, { method: 'PATCH', body: { status } }),
  getInvitations: () => request('/admin/members/invitations/list'),
  createInvitation: (payload) => request('/admin/members/invitations', { method: 'POST', body: payload }),
  revokeInvitation: (id) => request(`/admin/members/invitations/${id}`, { method: 'DELETE' }),
};

export const chatService = {
  getChatMessages: () => request('/chat/messages'),
  sendChatMessage: (content) => request('/chat/messages', { method: 'POST', body: { content } }),
  flagChatMessage: (id, payload) => request(`/chat/messages/${id}/flag`, { method: 'POST', body: payload }),
  getFlaggedMessages: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/chat/moderation/flagged${q ? `?${q}` : ''}`);
  },
  reviewFlaggedMessage: (id, payload) => request(`/chat/moderation/flagged/${id}/review`, { method: 'POST', body: payload }),
  deleteChatMessage: (id) => request(`/chat/messages/${id}`, { method: 'DELETE' }),
  togglePinChatMessage: (id) => request(`/chat/messages/${id}/pin`, { method: 'PATCH' }),
  muteUser: (payload) => request('/chat/moderation/mute-user', { method: 'POST', body: payload }),
  unmuteUser: (userId) => request('/chat/moderation/unmute-user', { method: 'POST', body: { userId } }),
  getModerationHistory: () => request('/chat/moderation/history'),
};

export const auditService = {
  getAuditLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/admin/audit-logs${q ? `?${q}` : ''}`);
  },
};

// =============================================================================
// Unified API Client (100% Backwards-Compatible with Existing Components)
// =============================================================================

export const api = {
  // Auth
  ...authService,

  // Dashboard Stats
  getDashboardStats: dashboardService.getStats,

  // Tasks
  ...taskService,

  // Submissions & Points
  ...submissionService,

  // Members & Invitations
  ...memberService,

  // Chat & Moderation
  ...chatService,

  // Audit Logs
  ...auditService,
};

export default api;
