import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adjustInventory,
  authenticate,
  createProduct,
  createCustomer,
  createPurchaseReceipt,
  createSupplier,
  createSale,
  getInventory,
  getCustomers,
  getPurchaseReceipts,
  getProducts,
  getSalesReport,
  getSuppliers,
  getSales,
  returnSale,
  updateInventoryReorderPoint,
} from "./backend";

describe("backend API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates an inventory reorder point", async () => {
    const inventoryItem = {
      productId: "product-1",
      sku: "COFFEE-01",
      name: "Coffee",
      quantityOnHand: 5,
      reorderPoint: 3,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => inventoryItem,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateInventoryReorderPoint("Basic token", "product-1", 3),
    ).resolves.toEqual(inventoryItem);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/backend/inventory/product-1/reorder-point",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ reorderPoint: 3 }),
      }),
    );
  });

  it("authenticates with Basic credentials without browser-managed cookies", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ username: "cashier" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await authenticate("cashier", "secret");

    expect(result.session.username).toBe("cashier");
    expect(result.authorization).toBe(`Basic ${btoa("cashier:secret")}`);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/backend/auth/session",
      expect.objectContaining({
        cache: "no-store",
        credentials: "omit",
        headers: { Authorization: result.authorization },
      }),
    );
  });

  it("returns authenticated products", async () => {
    const product = {
      id: "product-1",
      sku: "COFFEE-01",
      name: "Coffee",
      price: 3.5,
      createdAt: "2026-11-04T00:00:00Z",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [product],
      }),
    );

    await expect(getProducts("Basic token")).resolves.toEqual([product]);
  });

  it("surfaces API errors when product creation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ message: "Duplicate SKU" }),
      }),
    );

    await expect(
      createProduct("Basic token", {
        sku: "COFFEE-01",
        name: "Coffee",
        price: 3.5,
      }),
    ).rejects.toMatchObject({
      message: "Duplicate SKU",
      status: 409,
    });
  });

  it("loads and creates customers", async () => {
    const customer = {
      id: "customer-1",
      name: "Sam Customer",
      email: "sam@example.com",
      phone: null,
      createdAt: "2026-11-04T00:00:00Z",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [customer] })
      .mockResolvedValueOnce({ ok: true, json: async () => customer });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCustomers("Basic token")).resolves.toEqual([customer]);
    await expect(
      createCustomer("Basic token", {
        name: "Sam Customer",
        email: "sam@example.com",
      }),
    ).resolves.toEqual(customer);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/backend/customers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Sam Customer", email: "sam@example.com" }),
      }),
    );
  });

  it("loads inventory and records a stock adjustment", async () => {
    const inventoryItem = {
      productId: "product-1",
      sku: "COFFEE-01",
      name: "Coffee",
      quantityOnHand: 5,
      reorderPoint: 3,
    };
    const adjustment = {
      id: "adjustment-1",
      productId: "product-1",
      quantityChange: 3,
      quantityOnHand: 8,
      reason: "Supplier delivery",
      createdAt: "2026-11-04T00:00:00Z",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [inventoryItem],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => adjustment,
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getInventory("Basic token")).resolves.toEqual([inventoryItem]);
    await expect(
      adjustInventory("Basic token", "product-1", {
        direction: "RECEIVE",
        quantity: 3,
        reason: "Supplier delivery",
      }),
    ).resolves.toEqual(adjustment);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/backend/inventory/product-1/adjustments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          direction: "RECEIVE",
          quantity: 3,
          reason: "Supplier delivery",
        }),
      }),
    );
  });

  it("loads suppliers and receipts and records a received delivery", async () => {
    const supplier = {
      id: "supplier-1",
      name: "Coffee Co",
      email: null,
      phone: null,
      createdAt: "2026-11-04T00:00:00Z",
    };
    const receipt = {
      id: "receipt-1",
      supplierId: "supplier-1",
      supplierName: "Coffee Co",
      supplierReference: "INV-204",
      totalCost: 10,
      createdAt: "2026-11-04T00:00:00Z",
      items: [
        {
          productId: "product-1",
          sku: "COFFEE-01",
          productName: "Coffee",
          quantity: 4,
          unitCost: 2.5,
          lineCost: 10,
        },
      ],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [supplier] })
      .mockResolvedValueOnce({ ok: true, json: async () => supplier })
      .mockResolvedValueOnce({ ok: true, json: async () => [receipt] })
      .mockResolvedValueOnce({ ok: true, json: async () => receipt });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSuppliers("Basic token")).resolves.toEqual([supplier]);
    await expect(
      createSupplier("Basic token", { name: "Coffee Co" }),
    ).resolves.toEqual(supplier);
    await expect(getPurchaseReceipts("Basic token")).resolves.toEqual([receipt]);
    await expect(
      createPurchaseReceipt("Basic token", {
        supplierId: "supplier-1",
        supplierReference: "INV-204",
        items: [{ productId: "product-1", quantity: 4, unitCost: 2.5 }],
      }),
    ).resolves.toEqual(receipt);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/backend/purchases/receipts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          supplierId: "supplier-1",
          supplierReference: "INV-204",
          items: [{ productId: "product-1", quantity: 4, unitCost: 2.5 }],
        }),
      }),
    );
  });

  it("loads recent sales and submits checkout items", async () => {
    const sale = {
      id: "sale-1",
      totalAmount: 7,
      createdAt: "2026-11-04T00:00:00Z",
      customerId: null,
      customerName: null,
      paymentMethod: "CASH",
      amountTendered: 7,
      changeDue: 0,
      returnedAt: null,
      returnReason: null,
      refundAmount: null,
      items: [
        {
          productId: "product-1",
          sku: "COFFEE-01",
          productName: "Coffee",
          unitPrice: 3.5,
          quantity: 2,
          lineTotal: 7,
        },
      ],
    };
    const returnedSale = {
      ...sale,
      returnedAt: "2026-11-04T01:00:00Z",
      returnReason: "Customer return",
      refundAmount: 7,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [sale] })
      .mockResolvedValueOnce({ ok: true, json: async () => sale })
      .mockResolvedValueOnce({ ok: true, json: async () => returnedSale });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSales("Basic token")).resolves.toEqual([sale]);
    await expect(
      createSale("Basic token", {
        paymentMethod: "CASH",
        amountTendered: 7,
        items: [{ productId: "product-1", quantity: 2 }],
      }),
    ).resolves.toEqual(sale);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/backend/sales",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          paymentMethod: "CASH",
          amountTendered: 7,
          items: [{ productId: "product-1", quantity: 2 }],
        }),
      }),
    );
    await expect(
      returnSale("Basic token", "sale-1", { reason: "Customer return" }),
    ).resolves.toEqual(returnedSale);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/backend/sales/sale-1/return",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ reason: "Customer return" }),
      }),
    );
  });

  it("loads a date-range sales report", async () => {
    const report = {
      from: "2026-11-01",
      to: "2026-11-04",
      sales: [],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => report,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getSalesReport("Basic token", report.from, report.to),
    ).resolves.toEqual(report);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/backend/sales/report?from=2026-11-01&to=2026-11-04",
      expect.objectContaining({
        cache: "no-store",
        headers: { Authorization: "Basic token" },
      }),
    );
  });
});
