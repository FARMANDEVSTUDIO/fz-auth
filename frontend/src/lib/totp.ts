import crypto from 'crypto';

export function generateSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

export function getTotpUri(secret: string, email: string): string {
  return `otpauth://totp/FZ%20AUTH:${encodeURIComponent(email)}?secret=${secret}&issuer=FZ%20AUTH&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const now = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const expected = generateToken(secret, now + i);
    if (expected === token) return true;
  }
  return false;
}

function generateToken(secret: string, counter: number): string {
  const buffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }

  const decodedSecret = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', decodedSecret);
  hmac.update(buffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += BASE32_CHARS[(value >>> bits) & 0x1f];
    }
  }

  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

function base32Decode(str: string): Buffer {
  const cleaned = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleaned) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }

  return Buffer.from(bytes);
}
