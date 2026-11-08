// HMAC-signed admin tokens (Web Crypto, works in the Worker runtime and browsers).
// Pure helpers: the secret is always passed in by server-side callers.

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

export function constantTimeEqual(a: string, b: string) {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function passwordMatches(input: string, expected: string) {
  // Compare equal-length digests so timing does not leak length or content.
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(input)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  return constantTimeEqual(b64url(a), b64url(b));
}

export async function sha256Hex(input: string) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(input)));
  return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Database write key derived from the admin password (the database stores only its hash). */
export function adminKey(password: string) {
  return sha256Hex(`naphium-admin-v1:${password}`);
}

/** Session signing secret: explicit secret if set, otherwise derived from the password. */
export async function sessionSecret(explicit: string | undefined, password: string | undefined) {
  if (explicit) return explicit;
  if (!password) return undefined;
  return sha256Hex(`naphium-session-v1:${password}`);
}

export async function signToken(secret: string, ttlSeconds: number, now = Date.now()) {
  const exp = Math.floor(now / 1000) + ttlSeconds;
  const payload = `admin.${exp}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifyToken(secret: string, token: string | undefined | null, now = Date.now()) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Math.floor(now / 1000)) return false;
  const expected = await hmac(secret, `${parts[0]}.${parts[1]}`);
  return constantTimeEqual(expected, parts[2] ?? "");
}
