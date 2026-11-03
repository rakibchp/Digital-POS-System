export interface AuthSession {
  username: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  createdAt: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  price: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function createAuthorization(username: string, password: string): string {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return `Basic ${btoa(binary)}`;
}

async function request(
  path: string,
  authorization: string,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    credentials: "omit",
    headers: {
      ...init?.headers,
      Authorization: authorization,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string"
      ) {
        message = body.message;
      }
    } catch {
      // Some authentication and proxy errors have an empty response body.
    }

    throw new ApiError(message, response.status);
  }

  return response.json();
}

function isAuthSession(value: unknown): value is AuthSession {
  return (
    typeof value === "object" &&
    value !== null &&
    "username" in value &&
    typeof value.username === "string"
  );
}

function isProduct(value: unknown): value is Product {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "sku" in value &&
    typeof value.sku === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "price" in value &&
    typeof value.price === "number" &&
    "createdAt" in value &&
    typeof value.createdAt === "string"
  );
}

export async function authenticate(
  username: string,
  password: string,
): Promise<{ session: AuthSession; authorization: string }> {
  const authorization = createAuthorization(username, password);
  const payload = await request(
    "/api/backend/auth/session",
    authorization,
  );
  if (!isAuthSession(payload)) {
    throw new ApiError("Backend returned an invalid session response", 502);
  }
  return { session: payload, authorization };
}

export async function getProducts(authorization: string): Promise<Product[]> {
  const payload = await request("/api/backend/products", authorization);
  if (!Array.isArray(payload) || !payload.every(isProduct)) {
    throw new ApiError("Backend returned an invalid product list", 502);
  }
  return payload;
}

export async function createProduct(
  authorization: string,
  product: CreateProductInput,
): Promise<Product> {
  const payload = await request("/api/backend/products", authorization, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!isProduct(payload)) {
    throw new ApiError("Backend returned an invalid product", 502);
  }
  return payload;
}
