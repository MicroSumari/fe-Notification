async function request<T>(
  url: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

export function apiGet<T>(url: string, token: string) {
  return request<T>(url, token);
}

export function apiPost<T>(url: string, token: string, body: unknown) {
  return request<T>(url, token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(url: string, token: string, body: unknown) {
  return request<T>(url, token, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function apiPatch<T>(url: string, token: string, body?: unknown) {
  return request<T>(url, token, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(url: string, token: string) {
  return request<T>(url, token, { method: "DELETE" });
}
