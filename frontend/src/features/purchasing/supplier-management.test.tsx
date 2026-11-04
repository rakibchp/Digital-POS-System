import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createPurchaseReceipt,
  getInventory,
  getProducts,
  getPurchaseReceipts,
  getSuppliers,
  type PurchaseReceipt,
} from "@/lib/api/backend";
import { SupplierManagement } from "./supplier-management";

vi.mock("@/lib/api/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/backend")>();
  return {
    ...actual,
    createPurchaseReceipt: vi.fn(),
    createSupplier: vi.fn(),
    getInventory: vi.fn(),
    getProducts: vi.fn(),
    getPurchaseReceipts: vi.fn(),
    getSuppliers: vi.fn(),
  };
});

const supplier = {
  id: "supplier-1",
  name: "Coffee Co",
  email: null,
  phone: null,
  createdAt: "2026-11-04T00:00:00Z",
};

const product = {
  id: "product-1",
  sku: "COFFEE-01",
  name: "Coffee",
  price: 4,
  createdAt: "2026-11-04T00:00:00Z",
};

const receipt: PurchaseReceipt = {
  id: "receipt-1",
  supplierId: supplier.id,
  supplierName: supplier.name,
  supplierReference: "INV-204",
  totalCost: 10,
  createdAt: "2026-11-04T00:00:00Z",
  items: [
    {
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      quantity: 4,
      unitCost: 2.5,
      lineCost: 10,
    },
  ],
};

describe("SupplierManagement", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("records supplier deliveries and updates the on-hand stock display", async () => {
    vi.mocked(getSuppliers).mockResolvedValue([supplier]);
    vi.mocked(getProducts).mockResolvedValue([product]);
    vi.mocked(getInventory).mockResolvedValue([
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantityOnHand: 5,
      },
    ]);
    vi.mocked(getPurchaseReceipts).mockResolvedValue([]);
    vi.mocked(createPurchaseReceipt).mockResolvedValue(receipt);

    render(
      <SupplierManagement authorization="Basic token" onSignOut={vi.fn()} />,
    );

    await screen.findByRole("button", { name: "Record delivery" });
    fireEvent.change(screen.getByLabelText("Supplier reference (optional)"), {
      target: { value: "INV-204" },
    });
    fireEvent.change(screen.getByLabelText("Product"), {
      target: { value: product.id },
    });
    fireEvent.change(screen.getByLabelText("Unit cost"), {
      target: { value: "2.50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record delivery" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Received 1 product from Coffee Co",
    );
    expect(createPurchaseReceipt).toHaveBeenCalledWith("Basic token", {
      supplierId: supplier.id,
      supplierReference: "INV-204",
      items: [{ productId: product.id, quantity: 1, unitCost: 2.5 }],
    });
    await waitFor(() =>
      expect(screen.getByRole("cell", { name: "9" })).toBeInTheDocument(),
    );
  });

  it("signs out when loading data returns unauthorized", async () => {
    vi.mocked(getSuppliers).mockRejectedValue(
      new ApiError("Unauthorized", 401),
    );
    const onSignOut = vi.fn();

    render(
      <SupplierManagement
        authorization="Basic expired"
        onSignOut={onSignOut}
      />,
    );

    await waitFor(() => expect(onSignOut).toHaveBeenCalledOnce());
  });
});
