import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackendStatusCard } from "./backend-status-card";

describe("BackendStatusCard", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a successful backend response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "UP",
        service: "pos-backend",
        checkedAt: "2026-11-03T12:00:00Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BackendStatusCard />);

    expect(await screen.findByText(/API connected/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/backend/status",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("shows an actionable error when the backend cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    render(<BackendStatusCard />);

    expect(await screen.findByText("API unavailable")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("rechecks the backend when requested", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "UP",
        service: "pos-backend",
        checkedAt: "2026-11-03T12:00:00Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BackendStatusCard />);
    await screen.findByText(/API connected/);

    fireEvent.click(screen.getByRole("button", { name: "Check connection" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
