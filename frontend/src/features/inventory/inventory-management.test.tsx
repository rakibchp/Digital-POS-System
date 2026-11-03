import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adjustInventory,
  ApiError,
  getInventory,
  type InventoryItem,
} from "@/lib/api/backend";
import { InventoryManagement } from "./inventory-management";

vi.mock("@/lib/api/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/backend")>();
  return {
    ...actual,
    adjustInventory: vi.fn(),
    getInventory: vi.fn(),
  };
});

const inventoryItem: InventoryItem = {
  productId: "product-1",
  sku: "COFFEE-01",
  name: "Coffee",
  quantityOnHand: 5,
};

describe("InventoryManagement", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("loads stock and applies an adjustment to the displayed balance", async () => {
    vi.mocked(getInventory).mockResolvedValue([inventoryItem]);
    vi.mocked(adjustInventory).mockResolvedValue({
      id: "adjustment-1",
      productId: "product-1",
      quantityChange: 3,
      quantityOnHand: 8,
      reason: "Supplier delivery",
      createdAt: "2026-11-04T00:00:00Z",
    });

    render(
      <InventoryManagement
        authorization="Basic token"
        onSignOut={vi.fn()}
      />,
    );

    expect(await screen.findByText("Coffee")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "5" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Quantity"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Supplier delivery" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record adjustment" }));

    expect(await screen.findByRole("cell", { name: "8" })).toBeInTheDocument();
    expect(adjustInventory).toHaveBeenCalledWith("Basic token", "product-1", {
      direction: "RECEIVE",
      quantity: 3,
      reason: "Supplier delivery",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Received 3 units");
  });

  it("signs out when the backend rejects the active credentials", async () => {
    vi.mocked(getInventory).mockRejectedValue(new ApiError("Unauthorized", 401));
    const onSignOut = vi.fn();

    render(
      <InventoryManagement
        authorization="Basic expired"
        onSignOut={onSignOut}
      />,
    );

    await waitFor(() => expect(onSignOut).toHaveBeenCalledOnce());
  });

  it("shows a conflict when an adjustment would exceed available stock", async () => {
    vi.mocked(getInventory).mockResolvedValue([inventoryItem]);
    vi.mocked(adjustInventory).mockRejectedValue(
      new ApiError("Cannot remove 7 units; only 5 are currently in stock", 409),
    );

    render(
      <InventoryManagement
        authorization="Basic token"
        onSignOut={vi.fn()}
      />,
    );

    await screen.findByText("Coffee");
    fireEvent.change(screen.getByLabelText("Adjustment"), {
      target: { value: "REMOVE" },
    });
    fireEvent.change(screen.getByLabelText("Quantity"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Damaged stock" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record adjustment" }));

    await waitFor(() =>
      expect(
        screen.getAllByText("Cannot remove 7 units; only 5 are currently in stock")
          .length,
      ).toBeGreaterThan(0),
    );
  });
});
