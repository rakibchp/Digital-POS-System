import { afterEach, describe, expect, it, vi } from "vitest";
import {
  authenticate,
  createProduct,
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
});
