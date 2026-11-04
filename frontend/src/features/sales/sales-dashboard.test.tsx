import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getSales, getSalesReport, returnSale, type Sale } from "@/lib/api/backend";
import { SalesDashboard } from "./sales-dashboard";

vi.mock("@/lib/api/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/backend")>();
  return {
    ...actual,
    getSales: vi.fn(),
    getSalesReport: vi.fn(),
    returnSale: vi.fn(),
  };
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
    returnedAt: null,
    returnReason: null,
    refundAmount: null,
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
    returnedAt: null,
    returnReason: null,
    refundAmount: null,
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
    vi.unstubAllGlobals();
  });

  it("loads a date-range report and exports its line items as CSV", async () => {
    const report = {
      from: "2026-11-01",
      to: "2026-11-04",
      sales,
    };
    vi.mocked(getSales).mockResolvedValue(sales);
    vi.mocked(getSalesReport).mockResolvedValue(report);
    const createObjectURL = vi.fn<(object: Blob | MediaSource) => string>(
      () => "blob:report",
    );
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<SalesDashboard authorization="Basic token" onSignOut={vi.fn()} />);

    await waitFor(() => expect(getSalesReport).toHaveBeenCalledOnce());
    expect(await screen.findByText(/2 transactions included/)).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Sales report")).getByText("$19.00"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });

  it("summarizes transactions and ranks products by units sold", async () => {
    vi.mocked(getSales).mockResolvedValue(sales);

    render(<SalesDashboard authorization="Basic token" onSignOut={vi.fn()} />);

    await screen.findByText("sale-123");
    const recentSummary = within(
      screen.getByRole("group", { name: "Recent sales summary" }),
    );
    expect(await recentSummary.findByText("$19.00")).toBeInTheDocument();
    expect(recentSummary.getByText("$9.50")).toBeInTheDocument();
    expect(recentSummary.getByText("6", { selector: "p" })).toBeInTheDocument();
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
    expect(
      within(screen.getByRole("group", { name: "Recent sales summary" })).getAllByText("$0.00"),
    ).toHaveLength(3);
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

  it("records a full return, updates net sales, and removes return action", async () => {
    const activeCustomerSale: Sale = {
      ...sales[0],
      returnedAt: null,
      returnReason: null,
      refundAmount: null,
    };
    const activeWalkInSale: Sale = {
      ...sales[1],
      returnedAt: null,
      returnReason: null,
      refundAmount: null,
    };
    const returnedCustomerSale: Sale = {
      ...sales[0],
      returnedAt: "2026-11-04T12:00:00Z",
      returnReason: "Customer changed mind",
      refundAmount: sales[0].totalAmount,
    };
    vi.mocked(getSales).mockResolvedValue([activeCustomerSale, activeWalkInSale]);
    vi.mocked(returnSale).mockResolvedValue(returnedCustomerSale);

    render(<SalesDashboard authorization="Basic token" onSignOut={vi.fn()} />);
    await screen.findByText("sale-123");

    fireEvent.click(screen.getAllByRole("button", { name: "Return" })[0]);
    expect(screen.getByRole("dialog", { name: "Record sale return" })).toHaveTextContent(
      "restocks all 1 sale line",
    );
    expect(screen.getByRole("dialog", { name: "Record sale return" })).toHaveTextContent(
      "Return payment to the customer manually",
    );
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Customer changed mind" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record return" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Return recorded for $14.00",
    );
    expect(returnSale).toHaveBeenCalledWith("Basic token", "sale-12345678", {
      reason: "Customer changed mind",
    });
    expect(screen.getByText("Returned")).toBeInTheDocument();
    expect(screen.getByText("Net revenue").parentElement).toHaveTextContent("$5.00");
    expect(screen.getByText("Refunds").parentElement).toHaveTextContent("$14.00");
    expect(screen.getAllByRole("button", { name: "Return" })).toHaveLength(1);
    fireEvent.click(screen.getAllByRole("button", { name: "View" })[0]);
    expect(
      within(screen.getByRole("region", { name: "Receipt sale-123" })).getByText(
        "Refund recorded: $14.00",
      ),
    ).toBeInTheDocument();
  });

  it("signs out when the sales API rejects the credentials", async () => {
    vi.mocked(getSales).mockRejectedValue(new ApiError("Unauthorized", 401));
    const onSignOut = vi.fn();

    render(<SalesDashboard authorization="Basic expired" onSignOut={onSignOut} />);

    await waitFor(() => expect(onSignOut).toHaveBeenCalledOnce());
  });
});
