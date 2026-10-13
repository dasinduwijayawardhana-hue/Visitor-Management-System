/**
 * JWTs are stateless, so "logout" normally just means the client discards
 * its token. To let logout actually invalidate a token server-side (e.g. if
 * a device is stolen), we keep a short-lived blacklist of revoked tokens.
 *
 * NOTE: this in-memory Set only works for a single Node process. For a
 * multi-instance / production deployment, swap this for a Redis SET with a
 * TTL equal to the token's remaining lifetime (e.g. `SETEX blacklist:<jti> <ttl> 1`).
 */
const blacklist = new Set();

function revoke(token) {
  blacklist.add(token);
}

function isRevoked(token) {
  return blacklist.has(token);
}

// Periodic cleanup isn't strictly necessary since access tokens are short
// lived, but for long-running processes we cap the set size defensively.
setInterval(() => {
  if (blacklist.size > 10000) blacklist.clear();
}, 60 * 60 * 1000).unref();

module.exports = { revoke, isRevoked };
