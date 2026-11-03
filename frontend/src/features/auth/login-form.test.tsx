import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, authenticate } from "@/lib/api/backend";
import { LoginForm } from "./login-form";

vi.mock("@/lib/api/backend", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/backend")>();
  return { ...actual, authenticate: vi.fn() };
});

describe("LoginForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("submits credentials and passes the in-memory authorization to the workspace", async () => {
    vi.mocked(authenticate).mockResolvedValue({
      session: { username: "cashier" },
      authorization: "Basic token",
    });
    const onAuthenticated = vi.fn();

    render(<LoginForm onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "cashier" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await screen.findByText(/This development session ends/);
    await vi.waitFor(() =>
      expect(onAuthenticated).toHaveBeenCalledWith("cashier", "Basic token"),
    );
    expect(authenticate).toHaveBeenCalledWith("cashier", "secret");
  });

  it("shows a clear message when credentials are rejected", async () => {
    vi.mocked(authenticate).mockRejectedValue(new ApiError("Unauthorized", 401));

    render(<LoginForm onAuthenticated={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "cashier" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("The username or password is incorrect.");
  });
});
