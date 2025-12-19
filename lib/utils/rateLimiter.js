// Simple in-memory rate limiter for candidate applications
// Rate limit: Maximum submissions per IP address within a time window

const rateLimitStore = new Map();

// Configuration
const RATE_LIMIT_CONFIG = {
  maxSubmissions: 3, // Maximum submissions allowed
  windowMs: 60 * 60 * 1000, // Time window in milliseconds (1 hour)
  blockDurationMs: 24 * 60 * 60 * 1000, // Block duration after exceeding limit (24 hours)
};

/**
 * Check if an IP address has exceeded the rate limit
 * @param {string} ip - Client IP address
 * @returns {Object} { allowed: boolean, retryAfter: number|null, message: string }
 */
export function checkRateLimit(ip) {
  const now = Date.now();
  const clientData = rateLimitStore.get(ip);

  // First time accessing
  if (!clientData) {
    rateLimitStore.set(ip, {
      count: 1,
      firstAttempt: now,
      blockedUntil: null,
    });
    return {
      allowed: true,
      retryAfter: null,
      remaining: RATE_LIMIT_CONFIG.maxSubmissions - 1,
      message: 'Request allowed',
    };
  }

  // Check if currently blocked
  if (clientData.blockedUntil && now < clientData.blockedUntil) {
    const retryAfter = Math.ceil((clientData.blockedUntil - now) / 1000); // seconds
    const hoursRemaining = Math.ceil(retryAfter / 3600);
    return {
      allowed: false,
      retryAfter,
      remaining: 0,
      message: `Too many submission attempts. Please try again in ${hoursRemaining} hour(s).`,
    };
  }

  // Check if the time window has expired - reset counter
  if (now - clientData.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
    rateLimitStore.set(ip, {
      count: 1,
      firstAttempt: now,
      blockedUntil: null,
    });
    return {
      allowed: true,
      retryAfter: null,
      remaining: RATE_LIMIT_CONFIG.maxSubmissions - 1,
      message: 'Request allowed',
    };
  }

  // Increment counter
  clientData.count += 1;

  // Check if exceeded limit
  if (clientData.count > RATE_LIMIT_CONFIG.maxSubmissions) {
    clientData.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
    const retryAfter = Math.ceil(RATE_LIMIT_CONFIG.blockDurationMs / 1000);
    return {
      allowed: false,
      retryAfter,
      remaining: 0,
      message: `Too many submission attempts. You have been temporarily blocked for 24 hours.`,
    };
  }

  return {
    allowed: true,
    retryAfter: null,
    remaining: RATE_LIMIT_CONFIG.maxSubmissions - clientData.count,
    message: 'Request allowed',
  };
}

/**
 * Get client IP address from request headers
 * Handles various proxy scenarios
 * @param {Request} request - Next.js API request
 * @returns {string} Client IP address
 */
export function getClientIP(request) {
  // Check for common proxy headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for may contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Fallback to connection remote address (won't work behind proxies)
  return request.headers.get('x-forwarded-for') || 'unknown';
}

/**
 * Clean up expired entries from rate limit store
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    // Remove entries that are no longer blocked and past the window
    if (
      (!data.blockedUntil || now > data.blockedUntil) &&
      now - data.firstAttempt > RATE_LIMIT_CONFIG.windowMs
    ) {
      rateLimitStore.delete(ip);
    }
  }
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
}

/**
 * Get rate limit configuration (useful for displaying to users)
 * @returns {Object} Rate limit configuration
 */
export function getRateLimitConfig() {
  return {
    maxSubmissions: RATE_LIMIT_CONFIG.maxSubmissions,
    windowHours: RATE_LIMIT_CONFIG.windowMs / (60 * 60 * 1000),
    blockDurationHours: RATE_LIMIT_CONFIG.blockDurationMs / (60 * 60 * 1000),
  };
}
