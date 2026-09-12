// Parse human duration ("30d", "12h", "1y", "lifetime") into seconds.
const LIFETIME_SECONDS = 100 * 365 * 24 * 3600; // ~100 years

function parseDuration(input) {
  if (input == null) return null;
  const str = String(input).trim().toLowerCase();
  if (str === 'lifetime' || str === 'perm' || str === 'permanent') return LIFETIME_SECONDS;
  const m = /^(\d+)\s*([smhdwy])$/.exec(str);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = { s: 1, m: 60, h: 3600, d: 86400, w: 604800, y: 31536000 }[m[2]];
  if (!unit || n <= 0) return null;
  return n * unit;
}

// Turn seconds back into a short readable string.
function humanize(seconds) {
  if (seconds >= LIFETIME_SECONDS - 1) return 'lifetime';
  const units = [['y', 31536000], ['d', 86400], ['h', 3600], ['m', 60], ['s', 1]];
  const parts = [];
  let rem = Math.floor(seconds);
  for (const [label, size] of units) {
    if (rem >= size) {
      const v = Math.floor(rem / size);
      rem -= v * size;
      parts.push(`${v}${label}`);
    }
  }
  return parts.join(' ') || '0s';
}

module.exports = { parseDuration, humanize, LIFETIME_SECONDS };
