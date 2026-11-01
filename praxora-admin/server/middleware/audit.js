import { db } from '../db.js';
import crypto from 'crypto';

const SENSITIVE_KEY_REGEX = /^(password|passwd|pwd|token|jwt|secret|auth|bearer|apiKey|api_key|privateKey|private_key|credential|creditCard|ssn|hash|password_hash)$/i;

/**
 * Recursively scrubs passwords, tokens, secrets, hashes, and Bearer/JWT values
 * from strings, arrays, or objects before persistence or presentation.
 */
export function scrubSensitiveData(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    let sanitized = data;
    // Replace JWTs
    sanitized = sanitized.replace(/\beyJ[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\b/g, '[REDACTED_JWT]');
    // Replace Bearer tokens
    sanitized = sanitized.replace(/(Bearer\s+)[A-Za-z0-9\-_\.]+/gi, '$1[REDACTED]');
    // Replace password/secret key-values in JSON-like strings
    sanitized = sanitized.replace(/("?(?:password|passwd|pwd|secret|token|api_?key)"?\s*[:=]\s*)"(?:[^"\\]|\\.)*"/gi, '$1"[REDACTED]"');
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(item => scrubSensitiveData(item));
  }

  if (typeof data === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        clean[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        clean[key] = scrubSensitiveData(value);
      } else if (typeof value === 'string') {
        clean[key] = scrubSensitiveData(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  return data;
}

export function logAuditAction({ userId, action, targetType, targetId = null, details = null, req = null }) {
  try {
    const id = 'aud-' + crypto.randomUUID();
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';

    // Scrub sensitive data prior to insertion
    const scrubbed = scrubSensitiveData(details);
    const detailsString = typeof scrubbed === 'object' && scrubbed !== null ? JSON.stringify(scrubbed) : scrubbed;

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, userId, action, targetType, targetId, detailsString, ipAddress);

    return id;
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
    return null;
  }
}
