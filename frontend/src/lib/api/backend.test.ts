import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adjustInventory,
  authenticate,
  createProduct,
  getInventory,
  getProducts,
} from "./backend";

describe("backend API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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

  it("loads inventory and records a stock adjustment", async () => {
    const inventoryItem = {
      productId: "product-1",
      sku: "COFFEE-01",
      name: "Coffee",
      quantityOnHand: 5,
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
});
