import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createCustomer,
  getCustomers,
} from "@/lib/api/backend";
import { CustomerManagement } from "./customer-management";

vi.mock("@/lib/api/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/backend")>();
  return {
    ...actual,
    createCustomer: vi.fn(),
    getCustomers: vi.fn(),
  };
});

describe("CustomerManagement", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("lists customers and saves a new customer", async () => {
    vi.mocked(getCustomers).mockResolvedValue([]);
    vi.mocked(createCustomer).mockResolvedValue({
      id: "customer-1",
      name: "Sam Customer",
      email: "sam@example.com",
      phone: "555-0123",
      createdAt: "2026-11-04T00:00:00Z",
    });

    render(
      <CustomerManagement authorization="Basic token" onSignOut={vi.fn()} />,
    );
    await screen.findByText("No customers saved");

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Sam Customer" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "sam@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Phone"), {
      target: { value: "555-0123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add customer" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Sam Customer added to customers.",
    );
    expect(createCustomer).toHaveBeenCalledWith("Basic token", {
      name: "Sam Customer",
      email: "sam@example.com",
      phone: "555-0123",
    });
    expect(screen.getByText("555-0123")).toBeInTheDocument();
  });

  it("signs out if the customer API rejects credentials", async () => {
    vi.mocked(getCustomers).mockRejectedValue(
      new ApiError("Unauthorized", 401),
    );
    const onSignOut = vi.fn();

    render(
      <CustomerManagement
        authorization="Basic expired"
        onSignOut={onSignOut}
      />,
    );

    await waitFor(() => expect(onSignOut).toHaveBeenCalledOnce());
  });
});
