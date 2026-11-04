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

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
}

export interface InventoryItem {
  productId: string;
  sku: string;
  name: string;
  quantityOnHand: number;
}

export interface InventoryAdjustmentInput {
  direction: "RECEIVE" | "REMOVE";
  quantity: number;
  reason: string;
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  quantityChange: number;
  quantityOnHand: number;
  reason: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  sku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  totalAmount: number;
  createdAt: string;
  customerId: string | null;
  customerName: string | null;
  items: SaleItem[];
}

export interface CreateSaleInput {
  customerId?: string;
  items: Array<{ productId: string; quantity: number }>;
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

function isCustomer(value: unknown): value is Customer {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "email" in value &&
    (typeof value.email === "string" || value.email === null) &&
    "phone" in value &&
    (typeof value.phone === "string" || value.phone === null) &&
    "createdAt" in value &&
    typeof value.createdAt === "string"
  );
}

function isInventoryItem(value: unknown): value is InventoryItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "productId" in value &&
    typeof value.productId === "string" &&
    "sku" in value &&
    typeof value.sku === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "quantityOnHand" in value &&
    typeof value.quantityOnHand === "number"
  );
}

function isInventoryAdjustment(value: unknown): value is InventoryAdjustment {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "productId" in value &&
    typeof value.productId === "string" &&
    "quantityChange" in value &&
    typeof value.quantityChange === "number" &&
    "quantityOnHand" in value &&
    typeof value.quantityOnHand === "number" &&
    "reason" in value &&
    typeof value.reason === "string" &&
    "createdAt" in value &&
    typeof value.createdAt === "string"
  );
}

function isSaleItem(value: unknown): value is SaleItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "productId" in value &&
    typeof value.productId === "string" &&
    "sku" in value &&
    typeof value.sku === "string" &&
    "productName" in value &&
    typeof value.productName === "string" &&
    "unitPrice" in value &&
    typeof value.unitPrice === "number" &&
    "quantity" in value &&
    typeof value.quantity === "number" &&
    "lineTotal" in value &&
    typeof value.lineTotal === "number"
  );
}

function isSale(value: unknown): value is Sale {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "totalAmount" in value &&
    typeof value.totalAmount === "number" &&
    "createdAt" in value &&
    typeof value.createdAt === "string" &&
    "customerId" in value &&
    (typeof value.customerId === "string" || value.customerId === null) &&
    "customerName" in value &&
    (typeof value.customerName === "string" || value.customerName === null) &&
    "items" in value &&
    Array.isArray(value.items) &&
    value.items.every(isSaleItem)
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

export async function getCustomers(authorization: string): Promise<Customer[]> {
  const payload = await request("/api/backend/customers", authorization);
  if (!Array.isArray(payload) || !payload.every(isCustomer)) {
    throw new ApiError("Backend returned an invalid customer list", 502);
  }
  return payload;
}

export async function createCustomer(
  authorization: string,
  customer: CreateCustomerInput,
): Promise<Customer> {
  const payload = await request("/api/backend/customers", authorization, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customer),
  });
  if (!isCustomer(payload)) {
    throw new ApiError("Backend returned an invalid customer", 502);
  }
  return payload;
}

export async function getInventory(
  authorization: string,
): Promise<InventoryItem[]> {
  const payload = await request("/api/backend/inventory", authorization);
  if (!Array.isArray(payload) || !payload.every(isInventoryItem)) {
    throw new ApiError("Backend returned an invalid inventory list", 502);
  }
  return payload;
}

export async function adjustInventory(
  authorization: string,
  productId: string,
  adjustment: InventoryAdjustmentInput,
): Promise<InventoryAdjustment> {
  const payload = await request(
    `/api/backend/inventory/${encodeURIComponent(productId)}/adjustments`,
    authorization,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adjustment),
    },
  );
  if (!isInventoryAdjustment(payload)) {
    throw new ApiError("Backend returned an invalid inventory adjustment", 502);
  }
  return payload;
}

export async function getSales(authorization: string): Promise<Sale[]> {
  const payload = await request("/api/backend/sales", authorization);
  if (!Array.isArray(payload) || !payload.every(isSale)) {
    throw new ApiError("Backend returned an invalid sales list", 502);
  }
  return payload;
}

export async function createSale(
  authorization: string,
  sale: CreateSaleInput,
): Promise<Sale> {
  const payload = await request("/api/backend/sales", authorization, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale),
  });
  if (!isSale(payload)) {
    throw new ApiError("Backend returned an invalid sale", 502);
  }
  return payload;
}
