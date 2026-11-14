// Pure offline-first Device-Bound Licensing & Demo Trial service

export const DEVICE_ID_STORAGE_KEY = 'kasirkita_device_id';
export const LICENSE_KEY_STORAGE_KEY = 'kasirkita_license_key';

export const LICENSE_SECRET_SALT = 'JACS_POS_2026_PRO';
export const DEVELOPER_MASTER_KEY = 'JACS-MASTER-9926';

export const DEMO_MAX_TRANSACTIONS = 15;

const ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Pure synchronous SHA-256 implementation (FIPS 180-4) so license generation
 * and validation work identically across all browsers and offline contexts.
 */
function sha256Bytes(message: string): Uint8Array {
  const utf8 = unescape(encodeURIComponent(message));
  const msgBytes = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) {
    msgBytes[i] = utf8.charCodeAt(i);
  }

  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  const bitLen = msgBytes.length * 8;
  const paddedLen = Math.ceil((msgBytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(msgBytes);
  padded[msgBytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);

  const W = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(offset + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3);
      const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }

    let a = H[0], b = H[1], c = H[2], d = H[3];
    let e = H[4], f = H[5], g = H[6], h = H[7];

    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) {
    outView.setUint32(i * 4, H[i], false);
  }
  return out;
}

function generateRandomCodeChars(length: number): string {
  let result = '';
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(length);
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < length; i++) {
      result += ALPHANUMERIC_CHARS[arr[i] % ALPHANUMERIC_CHARS.length];
    }
    return result;
  }
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC_CHARS[Math.floor(Math.random() * ALPHANUMERIC_CHARS.length)];
  }
  return result;
}

export function normalizeDeviceId(raw: string): string {
  return raw.trim().toUpperCase();
}

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing && /^KSK-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(existing.trim().toUpperCase())) {
      return existing.trim().toUpperCase();
    }
    const rand = generateRandomCodeChars(8);
    const deviceId = `KSK-${rand.slice(0, 4)}-${rand.slice(4, 8)}`;
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    return deviceId;
  } catch {
    return 'KSK-OFFL-0001';
  }
}

/**
 * Generates a deterministic 12-character activation key formatted as ACT-XXXX-XXXX-XXXX
 * derived from SHA-256(`${deviceId}:JACS_POS_2026_PRO`).
 */
export function generateActivationCode(deviceId: string): string {
  const normalizedId = normalizeDeviceId(deviceId);
  const digest = sha256Bytes(`${normalizedId}:${LICENSE_SECRET_SALT}`);

  let raw12 = '';
  for (let i = 0; i < 12; i++) {
    // Combine pairs of SHA-256 bytes for uniform distribution across 36 chars
    const val = (digest[i * 2] << 8) | digest[i * 2 + 1];
    raw12 += ALPHANUMERIC_CHARS[val % ALPHANUMERIC_CHARS.length];
  }

  return `ACT-${raw12.slice(0, 4)}-${raw12.slice(4, 8)}-${raw12.slice(8, 12)}`;
}

export function normalizeActivationCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

export function validateActivationCode(inputCode: string, deviceId: string): boolean {
  const normalized = normalizeActivationCode(inputCode);
  if (!normalized) return false;

  if (normalized === DEVELOPER_MASTER_KEY) {
    return true;
  }

  const expected = generateActivationCode(deviceId);
  if (normalized === expected) {
    return true;
  }

  // Also tolerate code entered without dashes
  const stripDashes = (s: string) => s.replace(/-/g, '');
  return stripDashes(normalized) === stripDashes(expected);
}

export function getStoredActivatedLicense(deviceId: string): string | null {
  try {
    const saved = localStorage.getItem(LICENSE_KEY_STORAGE_KEY);
    if (!saved) return null;
    return validateActivationCode(saved, deviceId) ? normalizeActivationCode(saved) : null;
  } catch {
    return null;
  }
}

export function saveActivatedLicense(inputCode: string, deviceId: string): boolean {
  if (!validateActivationCode(inputCode, deviceId)) {
    return false;
  }
  const normalized = normalizeActivationCode(inputCode);
  const canonical =
    normalized === DEVELOPER_MASTER_KEY
      ? DEVELOPER_MASTER_KEY
      : generateActivationCode(deviceId);
  try {
    localStorage.setItem(LICENSE_KEY_STORAGE_KEY, canonical);
    return true;
  } catch {
    return false;
  }
}
