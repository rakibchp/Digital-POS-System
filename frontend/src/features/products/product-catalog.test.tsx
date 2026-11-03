import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createProduct,
  getProducts,
  type Product,
} from "@/lib/api/backend";
import { ProductCatalog } from "./product-catalog";

vi.mock("@/lib/api/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/backend")>();
  return {
    ...actual,
    createProduct: vi.fn(),
    getProducts: vi.fn(),
  };
});

const createdProduct: Product = {
  id: "product-1",
  sku: "COFFEE-01",
  name: "Coffee",
  price: 3.5,
  createdAt: "2026-11-04T00:00:00Z",
};

describe("ProductCatalog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("loads products and creates a product through the authenticated API", async () => {
    vi.mocked(getProducts).mockResolvedValue([]);
    vi.mocked(createProduct).mockResolvedValue(createdProduct);

    render(
      <ProductCatalog
        authorization="Basic token"
        onSignOut={vi.fn()}
        username="cashier"
      />,
    );

    expect(await screen.findByText("No products yet")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("SKU"), {
      target: { value: "COFFEE-01" },
    });
    fireEvent.change(screen.getByLabelText("Product name"), {
      target: { value: "Coffee" },
    });
    fireEvent.change(screen.getByLabelText("Price"), {
      target: { value: "3.50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add product" }));

    expect(await screen.findByRole("cell", { name: "COFFEE-01" })).toBeInTheDocument();
    expect(createProduct).toHaveBeenCalledWith("Basic token", {
      sku: "COFFEE-01",
      name: "Coffee",
      price: 3.5,
    });
    expect(screen.getByText("$3.50")).toBeInTheDocument();
  });

  it("signs out when the API rejects the active credentials", async () => {
    vi.mocked(getProducts).mockRejectedValue(new ApiError("Unauthorized", 401));
    const onSignOut = vi.fn();

    render(
      <ProductCatalog
        authorization="Basic expired"
        onSignOut={onSignOut}
        username="cashier"
      />,
    );

    await waitFor(() => expect(onSignOut).toHaveBeenCalledOnce());
  });

  it("shows duplicate SKU errors from the API", async () => {
    vi.mocked(getProducts).mockResolvedValue([]);
    vi.mocked(createProduct).mockRejectedValue(
      new ApiError("A product with SKU 'COFFEE-01' already exists", 409),
    );

    render(
      <ProductCatalog
        authorization="Basic token"
        onSignOut={vi.fn()}
        username="cashier"
      />,
    );

    await screen.findByText("No products yet");
    fireEvent.change(screen.getByLabelText("SKU"), {
      target: { value: "COFFEE-01" },
    });
    fireEvent.change(screen.getByLabelText("Product name"), {
      target: { value: "Coffee" },
    });
    fireEvent.change(screen.getByLabelText("Price"), {
      target: { value: "3.50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add product" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("already exists");
  });
});
