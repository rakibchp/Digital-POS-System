import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createSale,
  getCustomers,
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
    getCustomers: vi.fn(),
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
        reorderPoint: 2,
      },
    ]);
    vi.mocked(getSales).mockResolvedValue([]);
    vi.mocked(getCustomers).mockResolvedValue([
      {
        id: "customer-1",
        name: "Sam Customer",
        email: "sam@example.com",
        phone: null,
        createdAt: "2026-11-04T00:00:00Z",
      },
    ]);
    vi.mocked(createSale).mockResolvedValue({
      id: "sale-1",
      totalAmount: 7,
      createdAt: "2026-11-04T00:00:00Z",
      customerId: "customer-1",
      customerName: "Sam Customer",
      paymentMethod: "CASH",
      amountTendered: 10,
      changeDue: 3,
      returnedAt: null,
      returnReason: null,
      refundAmount: null,
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

    fireEvent.change(screen.getByLabelText("Customer"), {
      target: { value: "customer-1" },
    });
    fireEvent.change(screen.getByLabelText("Cash received"), {
      target: { value: "10.00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    fireEvent.click(screen.getByRole("button", { name: "Add one Coffee" }));
    expect(screen.getAllByText("$7.00")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Complete sale" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Change $3.00");
    expect(createSale).toHaveBeenCalledWith("Basic token", {
      customerId: "customer-1",
      paymentMethod: "CASH",
      amountTendered: 10,
      items: [{ productId: "product-1", quantity: 2 }],
    });
    await waitFor(() => {
      expect(screen.getByText("3 in stock")).toBeInTheDocument();
    });
    expect(screen.getByText("Sale · 2 items")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Receipt sale-1" })).toBeInTheDocument();
    const receipt = within(screen.getByRole("region", { name: "Receipt sale-1" }));
    expect(receipt.getByText("Cash received")).toBeInTheDocument();
    expect(receipt.getByText("$10.00")).toBeInTheDocument();
  });

  it("does not submit cash payment below the sale total", async () => {
    vi.mocked(getProducts).mockResolvedValue([product]);
    vi.mocked(getInventory).mockResolvedValue([
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantityOnHand: 5,
        reorderPoint: 2,
      },
    ]);
    vi.mocked(getSales).mockResolvedValue([]);
    vi.mocked(getCustomers).mockResolvedValue([]);

    render(<Checkout authorization="Basic token" onSignOut={vi.fn()} />);
    await screen.findByText("Coffee");
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    fireEvent.change(screen.getByLabelText("Cash received"), {
      target: { value: "2.00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Complete sale" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cash received must be at least the sale total.",
    );
    expect(createSale).not.toHaveBeenCalled();
  });

  it("submits a card payment without cash tender details", async () => {
    vi.mocked(getProducts).mockResolvedValue([product]);
    vi.mocked(getInventory).mockResolvedValue([
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantityOnHand: 5,
        reorderPoint: 2,
      },
    ]);
    vi.mocked(getSales).mockResolvedValue([]);
    vi.mocked(getCustomers).mockResolvedValue([]);
    vi.mocked(createSale).mockResolvedValue({
      id: "sale-card",
      totalAmount: 3.5,
      createdAt: "2026-11-04T00:00:00Z",
      customerId: null,
      customerName: null,
      paymentMethod: "CARD",
      amountTendered: 3.5,
      changeDue: 0,
      returnedAt: null,
      returnReason: null,
      refundAmount: null,
      items: [
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          lineTotal: product.price,
        },
      ],
    });

    render(<Checkout authorization="Basic token" onSignOut={vi.fn()} />);
    await screen.findByText("Coffee");
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    fireEvent.change(screen.getByLabelText("Payment method"), {
      target: { value: "CARD" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Complete sale" }));

    await waitFor(() => {
      expect(createSale).toHaveBeenCalledWith("Basic token", {
        paymentMethod: "CARD",
        items: [{ productId: "product-1", quantity: 1 }],
      });
    });
    expect(
      screen.getByText(/must still be processed on your payment terminal/i),
    ).toBeInTheDocument();
  });

  it("prevents adding more than available inventory", async () => {
    vi.mocked(getProducts).mockResolvedValue([product]);
    vi.mocked(getInventory).mockResolvedValue([
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantityOnHand: 1,
        reorderPoint: 2,
      },
    ]);
    vi.mocked(getSales).mockResolvedValue([]);
    vi.mocked(getCustomers).mockResolvedValue([]);

    render(<Checkout authorization="Basic token" onSignOut={vi.fn()} />);
    await screen.findByText("Coffee");
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(screen.getByRole("button", { name: "Add one Coffee" })).toBeDisabled();
  });

  it("signs out if the protected API rejects the credentials", async () => {
    vi.mocked(getProducts).mockRejectedValue(new ApiError("Unauthorized", 401));
    vi.mocked(getInventory).mockResolvedValue([]);
    vi.mocked(getSales).mockResolvedValue([]);
    vi.mocked(getCustomers).mockResolvedValue([]);
    const onSignOut = vi.fn();

    render(<Checkout authorization="Basic expired" onSignOut={onSignOut} />);
    await waitFor(() => expect(onSignOut).toHaveBeenCalledOnce());
  });
});
