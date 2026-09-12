export interface GeoResult {
  location: string;
  countryCode: string;
}

export async function getGeoInfo(ip: string): Promise<string | null> {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Local';
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'success') return null;
    return `${data.city || ''}, ${data.country || ''}`.replace(/^, /, '');
  } catch {
    return null;
  }
}

export async function batchGeoLookup(ips: string[]): Promise<Record<string, GeoResult>> {
  const results: Record<string, GeoResult> = {};
  const toResolve: string[] = [];

  for (const ip of ips) {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      results[ip] = { location: 'Local', countryCode: '' };
    } else {
      toResolve.push(ip);
    }
  }

  if (toResolve.length === 0) return results;

  const batch = toResolve.slice(0, 100);
  try {
    const res = await fetch('http://ip-api.com/batch?fields=query,status,country,countryCode,city', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      for (const item of data) {
        if (item.status === 'success') {
          results[item.query] = {
            location: `${item.city || ''}, ${item.country || ''}`.replace(/^, /, ''),
            countryCode: item.countryCode || '',
          };
        }
      }
    }
  } catch {
    // silent fail
  }

  return results;
}

const FLAG_OFFSET = 0x1F1E6 - 65;

export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(
    code.charCodeAt(0) + FLAG_OFFSET - 32,
    code.charCodeAt(1) + FLAG_OFFSET - 32
  );
}
