type QueryValue = string | number | boolean | null | undefined;

type ProxyFetchOptions = Omit<RequestInit, "body"> & {
  query?: Record<string, QueryValue>;
  body?: unknown;
};

function normalizePath(path: string) {
  return path.replace(/^\/+/, "");
}

function buildQueryString(query?: Record<string, QueryValue>) {
  if (!query) {
    return "";
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    params.set(key, String(value));
  });
  const rendered = params.toString();
  return rendered ? `?${rendered}` : "";
}

export function buildProxyUrl(path: string, query?: Record<string, QueryValue>) {
  const normalized = normalizePath(path);
  const queryString = buildQueryString(query);
  return `/api/proxy/${normalized}${queryString}`;
}

function isJsonBody(body: unknown) {
  return (
    body !== null &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  );
}

export async function proxyFetch(path: string, options: ProxyFetchOptions = {}) {
  const { query, headers, body, ...rest } = options;
  const url = buildProxyUrl(path, query);
  const requestHeaders = new Headers(headers);

  let requestBody: unknown = body;
  if (isJsonBody(body)) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  return fetch(url, {
    ...rest,
    headers: requestHeaders,
    body: requestBody as BodyInit | null,
  });
}

export async function proxyFetchJson<T>(path: string, options: ProxyFetchOptions = {}) {
  const response = await proxyFetch(path, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error ?? "Proxy request failed";
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
