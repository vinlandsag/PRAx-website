/**
 * src/services/index.js
 *
 * Praxora Domain Service Module Re-exports
 * Exposes specialized service modules for future microservices and backend decoupling.
 */

export {
  API_BASE,
  getToken,
  setToken,
  request,
  authService,
  dashboardService,
  taskService,
  submissionService,
  memberService,
  chatService,
  auditService,
  api,
  default,
} from '../api.js';
