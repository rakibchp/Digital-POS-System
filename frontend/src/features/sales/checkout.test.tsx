import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createSale,
  getInventory,
  getProducts,
  getSales,
  type Product,
} from "@/lib/api/backend";
import { Checkout } from "./checkout";

vi.mock("@/lib/api/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/backend")>();
  return {
    ...actual,
    createSale: vi.fn(),
    getInventory: vi.fn(),
    getProducts: vi.fn(),
    getSales: vi.fn(),
  };
});

const product: Product = {
  id: "product-1",
  sku: "COFFEE-01",
  name: "Coffee",
  price: 3.5,
  createdAt: "2026-11-04T00:00:00Z",
};

describe("Checkout", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("loads stock, completes a sale, and updates the on-hand quantity", async () => {
    vi.mocked(getProducts).mockResolvedValue([product]);
    vi.mocked(getInventory).mockResolvedValue([
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantityOnHand: 5,
      },
    ]);
    vi.mocked(getSales).mockResolvedValue([]);
    vi.mocked(createSale).mockResolvedValue({
      id: "sale-1",
      totalAmount: 7,
      createdAt: "2026-11-04T00:00:00Z",
      items: [
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          unitPrice: product.price,
          quantity: 2,
          lineTotal: 7,
        },
      ],
    });

    render(<Checkout authorization="Basic token" onSignOut={vi.fn()} />);
    expect(await screen.findByText("Coffee")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    fireEvent.click(screen.getByRole("button", { name: "Add one Coffee" }));
    expect(screen.getAllByText("$7.00")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Complete sale" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Sale complete");
    expect(createSale).toHaveBeenCalledWith("Basic token", {
      items: [{ productId: "product-1", quantity: 2 }],
    });
    await waitFor(() => {
      expect(screen.getByText("3 in stock")).toBeInTheDocument();
    });
    expect(screen.getByText("Sale · 2 items")).toBeInTheDocument();
  });

  it("prevents adding more than available inventory", async () => {
    vi.mocked(getProducts).mockResolvedValue([product]);
    vi.mocked(getInventory).mockResolvedValue([
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantityOnHand: 1,
      },
    ]);
    vi.mocked(getSales).mockResolvedValue([]);

    render(<Checkout authorization="Basic token" onSignOut={vi.fn()} />);
    await screen.findByText("Coffee");
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(screen.getByRole("button", { name: "Add one Coffee" })).toBeDisabled();
  });

  it("signs out if the protected API rejects the credentials", async () => {
    vi.mocked(getProducts).mockRejectedValue(new ApiError("Unauthorized", 401));
    vi.mocked(getInventory).mockResolvedValue([]);
    vi.mocked(getSales).mockResolvedValue([]);
    const onSignOut = vi.fn();

    render(<Checkout authorization="Basic expired" onSignOut={onSignOut} />);
    await waitFor(() => expect(onSignOut).toHaveBeenCalledOnce());
  });
});
