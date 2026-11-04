import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getSales, type Sale } from "@/lib/api/backend";
import { SalesDashboard } from "./sales-dashboard";

vi.mock("@/lib/api/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/backend")>();
  return { ...actual, getSales: vi.fn() };
});

const sales: Sale[] = [
  {
    id: "sale-12345678",
    totalAmount: 14,
    createdAt: "2026-11-04T10:00:00Z",
    customerId: "customer-1",
    customerName: "Sam Customer",
    paymentMethod: "CASH",
    amountTendered: 15,
    changeDue: 1,
    items: [
      {
        productId: "coffee",
        sku: "COFFEE-01",
        productName: "Coffee",
        unitPrice: 3.5,
        quantity: 4,
        lineTotal: 14,
      },
    ],
  },
  {
    id: "sale-87654321",
    totalAmount: 5,
    createdAt: "2026-11-04T11:00:00Z",
    customerId: null,
    customerName: null,
    paymentMethod: "CARD",
    amountTendered: 5,
    changeDue: 0,
    items: [
      {
        productId: "tea",
        sku: "TEA-01",
        productName: "Tea",
        unitPrice: 2.5,
        quantity: 2,
        lineTotal: 5,
      },
    ],
  },
];

describe("SalesDashboard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("summarizes transactions and ranks products by units sold", async () => {
    vi.mocked(getSales).mockResolvedValue(sales);

    render(<SalesDashboard authorization="Basic token" onSignOut={vi.fn()} />);

    expect(await screen.findByText("$19.00")).toBeInTheDocument();
    expect(screen.getByText("$9.50")).toBeInTheDocument();
    expect(screen.getByText("6", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("COFFEE-01 · 4 sold")).toBeInTheDocument();
    expect(screen.getByText("sale-123")).toBeInTheDocument();
    expect(screen.getAllByText("Cash")).toHaveLength(1);
    expect(screen.getByText(/latest 50 transactions/i)).toBeInTheDocument();
  });

  it("shows a clear empty state when no sales exist", async () => {
    vi.mocked(getSales).mockResolvedValue([]);

    render(<SalesDashboard authorization="Basic token" onSignOut={vi.fn()} />);

    expect(await screen.findByText("No sales yet")).toBeInTheDocument();
    expect(screen.getAllByText("$0.00")).toHaveLength(2);
  });

  it("opens a past transaction receipt for printing", async () => {
    vi.mocked(getSales).mockResolvedValue(sales);
    const print = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<SalesDashboard authorization="Basic token" onSignOut={vi.fn()} />);
    await screen.findByText("sale-123");
    fireEvent.click(screen.getAllByRole("button", { name: "View" })[0]);

    expect(screen.getByRole("dialog", { name: "Receipt details" })).toBeInTheDocument();
    expect(screen.getByText("Cash received")).toBeInTheDocument();
    expect(screen.getByText("Change")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Print receipt" }));
    expect(print).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "Receipt details" })).not.toBeInTheDocument();
  });

  it("signs out when the sales API rejects the credentials", async () => {
    vi.mocked(getSales).mockRejectedValue(new ApiError("Unauthorized", 401));
    const onSignOut = vi.fn();

    render(<SalesDashboard authorization="Basic expired" onSignOut={onSignOut} />);

    await waitFor(() => expect(onSignOut).toHaveBeenCalledOnce());
  });
});
