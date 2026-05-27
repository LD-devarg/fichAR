import api from './api';

const cache = new Map();
const inflight = new Map();

const DEFAULT_TTL_MS = 30_000;
export const CATALOG_TTL_MS = 5 * 60_000;
export const SHORT_TTL_MS = 30_000;

function normalizeKey(url) {
  return url.startsWith('/') ? url.slice(1) : url;
}

export async function cachedGet(url, options = {}) {
  const key = normalizeKey(url);
  const ttl = options.ttl ?? DEFAULT_TTL_MS;
  const now = Date.now();
  const cached = cache.get(key);

  if (!options.force && cached && cached.expiresAt > now) {
    return cached.data;
  }

  if (!options.force && inflight.has(key)) {
    return inflight.get(key);
  }

  const request = api.get(key).then((response) => {
    cache.set(key, {
      data: response.data,
      expiresAt: Date.now() + ttl,
    });
    inflight.delete(key);
    return response.data;
  }).catch((error) => {
    inflight.delete(key);
    throw error;
  });

  inflight.set(key, request);
  return request;
}

export function setCachedGet(url, data, options = {}) {
  const key = normalizeKey(url);
  const ttl = options.ttl ?? DEFAULT_TTL_MS;
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

export function invalidateCache(prefixes) {
  const list = Array.isArray(prefixes) ? prefixes : [prefixes];
  const normalized = list.map(normalizeKey);

  for (const key of cache.keys()) {
    if (normalized.some((prefix) => key.startsWith(prefix))) {
      cache.delete(key);
    }
  }
}
